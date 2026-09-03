"""Application service and cancellable scheduler for HiSosed."""

from __future__ import annotations

import asyncio
import secrets
from dataclasses import dataclass
from datetime import datetime, timedelta
from random import Random
from typing import Any, Callable

from homeassistant.core import CALLBACK_TYPE, HomeAssistant, callback
from homeassistant.exceptions import HomeAssistantError
from homeassistant.helpers.event import async_track_point_in_time
from homeassistant.util import dt as dt_util

from .const import EVENT_UPDATED
from .engine import active_window, choose_audio, generate_pattern, next_window_start
from .models import Scenario, ScenarioValidationError
from .storage import ScenarioStore


@dataclass(slots=True)
class Runtime:
    """In-memory state for exactly one scenario scheduler."""

    generation: int
    cancel: CALLBACK_TYPE | None = None
    window_start: datetime | None = None
    window_end: datetime | None = None
    cycle_index: int = -1
    pattern: tuple[bool, ...] = ()
    next_slot: int | None = None
    state: str = "waiting"
    next_event: datetime | None = None
    played_count: int = 0
    skipped_count: int = 0
    error_count: int = 0


class ScenarioManager:
    """Own validated scenarios and coordinate their asynchronous effects."""

    def __init__(self, hass: HomeAssistant) -> None:
        self.hass = hass
        self._store = ScenarioStore(hass)
        self._scenarios: dict[str, Scenario] = {}
        self._runtimes: dict[str, Runtime] = {}
        self._lock = asyncio.Lock()

    async def async_initialize(self) -> None:
        """Load valid scenarios; invalid stored entries are ignored safely."""
        raw_scenarios = await self._store.async_load()
        for scenario_id, raw in raw_scenarios.items():
            try:
                scenario = Scenario.from_dict(raw)
            except (ScenarioValidationError, TypeError, ValueError):
                continue
            if scenario.id == scenario_id:
                self._scenarios[scenario.id] = scenario

    async def async_start_enabled(self) -> None:
        """Schedule all enabled scenarios after Home Assistant starts."""
        for scenario in tuple(self._scenarios.values()):
            if scenario.enabled:
                await self.async_start(scenario.id)

    async def async_shutdown(self) -> None:
        """Invalidate every callback before unloading the integration."""
        async with self._lock:
            for runtime in self._runtimes.values():
                runtime.generation += 1
                if runtime.cancel:
                    runtime.cancel()
            self._runtimes.clear()

    def list_scenarios(self) -> list[dict[str, Any]]:
        """Return configuration and lightweight runtime state for the panel."""
        return [self._serialize(scenario) for scenario in self._scenarios.values()]

    def get_scenario(self, scenario_id: str) -> dict[str, Any]:
        """Return a scenario or signal a stable not-found error."""
        scenario = self._scenarios.get(scenario_id)
        if scenario is None:
            raise HomeAssistantError("scenario_not_found")
        return self._serialize(scenario)

    async def async_save_scenario(self, raw: dict[str, Any]) -> dict[str, Any]:
        """Validate, revision-check, persist, then schedule a scenario."""
        async with self._lock:
            raw_id = raw.get("id")
            existing = self._scenarios.get(raw_id) if isinstance(raw_id, str) else None
            supplied_revision = raw.get("revision")
            if existing is not None and supplied_revision != existing.revision:
                raise HomeAssistantError("revision_conflict")
            scenario = Scenario.from_dict(raw, revision=(existing.revision + 1 if existing else 1))
            self._invalidate_locked(scenario.id)
            updated = dict(self._scenarios)
            updated[scenario.id] = scenario
            await self._store.async_save({key: value.as_dict() for key, value in updated.items()})
            self._scenarios = updated
        if scenario.enabled:
            await self.async_start(scenario.id)
        self._publish(scenario.id)
        return self._serialize(scenario)

    async def async_delete_scenario(self, scenario_id: str) -> None:
        """Cancel and remove one scenario atomically."""
        async with self._lock:
            if scenario_id not in self._scenarios:
                raise HomeAssistantError("scenario_not_found")
            self._invalidate_locked(scenario_id)
            updated = dict(self._scenarios)
            del updated[scenario_id]
            await self._store.async_save({key: value.as_dict() for key, value in updated.items()})
            self._scenarios = updated
        self._publish(scenario_id)

    async def async_start(self, scenario_id: str, *, fresh_window: bool = False) -> None:
        """Start now if in a window, otherwise schedule its next window."""
        async with self._lock:
            scenario = self._require_scenario(scenario_id)
            generation = self._invalidate_locked(scenario_id) + 1
            runtime = Runtime(generation=generation, state="waiting")
            self._runtimes[scenario_id] = runtime
            now = dt_util.now()
            window = active_window(scenario, now)
            if window is None:
                self._schedule_locked(scenario, runtime, next_window_start(scenario, now), None)
            else:
                runtime.window_start, runtime.window_end = window
                if fresh_window:
                    runtime.next_slot = 0
                    self._ensure_pattern(scenario, runtime, 0)
                    self._schedule_locked(scenario, runtime, now, 0)
                else:
                    elapsed = max(0.0, (now - runtime.window_start).total_seconds())
                    runtime.next_slot = int(elapsed // scenario.grid.slot_seconds) + 1
                    self._schedule_slot_locked(scenario, runtime)
        self._publish(scenario_id)

    async def async_stop(self, scenario_id: str) -> None:
        """Cancel future playback; this is deliberately idempotent."""
        async with self._lock:
            self._require_scenario(scenario_id)
            generation = self._invalidate_locked(scenario_id) + 1
            self._runtimes[scenario_id] = Runtime(generation=generation, state="disabled")
        self._publish(scenario_id)

    async def async_regenerate(self, scenario_id: str) -> None:
        """Replace only the future cycle pattern."""
        async with self._lock:
            scenario = self._require_scenario(scenario_id)
            runtime = self._runtimes.get(scenario_id)
            if runtime is None or runtime.window_start is None:
                raise HomeAssistantError("scenario_not_running")
            runtime.pattern = ()
            runtime.cycle_index = -1
            self._ensure_pattern(scenario, runtime, runtime.next_slot or 0)
        self._publish(scenario_id)

    async def async_preview(self, scenario_id: str, media_content_id: str | None = None) -> None:
        """Play an explicitly requested or randomly selected item once."""
        async with self._lock:
            scenario = self._require_scenario(scenario_id)
            if media_content_id is None:
                item = choose_audio(scenario.audio, Random(secrets.randbits(64)))
                media_content_id = item.media_content_id
            elif not any(item.media_content_id == media_content_id for item in scenario.audio):
                raise HomeAssistantError("media_not_in_scenario")
        await self._async_play(scenario, media_content_id)

    def _serialize(self, scenario: Scenario) -> dict[str, Any]:
        result = scenario.as_dict()
        runtime = self._runtimes.get(scenario.id)
        result["runtime"] = {
            "state": runtime.state if runtime else "disabled",
            "next_event": runtime.next_event.isoformat() if runtime and runtime.next_event else None,
            "cycle_index": runtime.cycle_index if runtime else None,
            "pattern": list(runtime.pattern) if runtime else [],
            "played_count": runtime.played_count if runtime else 0,
            "skipped_count": runtime.skipped_count if runtime else 0,
            "error_count": runtime.error_count if runtime else 0,
        }
        return result

    def _require_scenario(self, scenario_id: str) -> Scenario:
        scenario = self._scenarios.get(scenario_id)
        if scenario is None:
            raise HomeAssistantError("scenario_not_found")
        return scenario

    def _invalidate_locked(self, scenario_id: str) -> int:
        """Cancel current work and return its new monotonic generation."""
        runtime = self._runtimes.get(scenario_id)
        if runtime is not None:
            runtime.generation += 1
            if runtime.cancel:
                runtime.cancel()
            return runtime.generation
        return 0

    def _ensure_pattern(self, scenario: Scenario, runtime: Runtime, slot: int) -> None:
        cycle_index = slot // scenario.grid.slot_count
        if runtime.cycle_index != cycle_index:
            runtime.cycle_index = cycle_index
            runtime.pattern = generate_pattern(scenario.grid, Random(secrets.randbits(64)))

    def _schedule_slot_locked(self, scenario: Scenario, runtime: Runtime) -> None:
        assert runtime.window_start is not None and runtime.window_end is not None
        assert runtime.next_slot is not None
        scheduled = runtime.window_start + timedelta(seconds=runtime.next_slot * scenario.grid.slot_seconds)
        if scheduled >= runtime.window_end:
            self._schedule_locked(scenario, runtime, next_window_start(scenario, runtime.window_end), None)
            return
        self._ensure_pattern(scenario, runtime, runtime.next_slot)
        self._schedule_locked(scenario, runtime, scheduled, runtime.next_slot)

    def _schedule_locked(
        self,
        scenario: Scenario,
        runtime: Runtime,
        when: datetime,
        slot: int | None,
    ) -> None:
        generation = runtime.generation
        runtime.next_event = when
        if slot is None:
            runtime.state = "waiting"
        else:
            runtime.state = "running"

        @callback
        def _fire(_: datetime) -> None:
            self.hass.async_create_task(self._async_fire(scenario.id, generation, slot, when))

        runtime.cancel = async_track_point_in_time(self.hass, _fire, when)

    async def _async_fire(self, scenario_id: str, generation: int, slot: int | None, when: datetime) -> None:
        """Handle either window start or one scheduled cell."""
        if slot is None:
            await self.async_start(scenario_id, fresh_window=True)
            return
        async with self._lock:
            scenario = self._scenarios.get(scenario_id)
            runtime = self._runtimes.get(scenario_id)
            if scenario is None or runtime is None or runtime.generation != generation:
                return
            now = dt_util.now()
            window = active_window(scenario, now)
            if window is None or runtime.window_start != window[0]:
                runtime.state = "waiting"
                self._schedule_locked(scenario, runtime, next_window_start(scenario, now), None)
                return
            # A suspended host must never replay an old cell after it wakes up.
            if now > when + timedelta(seconds=scenario.grid.slot_seconds / 2):
                runtime.skipped_count += 1
                runtime.next_slot = int((now - window[0]).total_seconds() // scenario.grid.slot_seconds) + 1
                self._schedule_slot_locked(scenario, runtime)
                self._publish(scenario_id)
                return
            self._ensure_pattern(scenario, runtime, slot)
            should_play = runtime.pattern[slot % scenario.grid.slot_count]
            runtime.next_slot = slot + 1
            self._schedule_slot_locked(scenario, runtime)
        if should_play:
            item = choose_audio(scenario.audio, Random(secrets.randbits(64)))
            try:
                await self._async_play(scenario, item.media_content_id)
            except HomeAssistantError:
                async with self._lock:
                    current = self._runtimes.get(scenario_id)
                    if current and current.generation == generation:
                        current.error_count += 1
            else:
                async with self._lock:
                    current = self._runtimes.get(scenario_id)
                    if current and current.generation == generation:
                        current.played_count += 1
        self._publish(scenario_id)

    async def _async_play(self, scenario: Scenario, media_content_id: str) -> None:
        """Use Home Assistant's media-player adapter, never host audio APIs."""
        await self.hass.services.async_call(
            "media_player",
            "play_media",
            {
                "media_content_id": media_content_id,
                "media_content_type": "music",
            },
            target={"entity_id": list(scenario.target_entity_ids)},
            blocking=False,
        )

    def _publish(self, scenario_id: str) -> None:
        """Notify the panel without putting private data in log messages."""
        self.hass.bus.async_fire(EVENT_UPDATED, {"scenario_id": scenario_id})
