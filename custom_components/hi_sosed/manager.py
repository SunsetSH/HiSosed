"""Application service and cancellable per-layer scheduler for HiSosed."""

from __future__ import annotations

import asyncio
import logging
import secrets
from dataclasses import dataclass, replace
from datetime import datetime, timedelta
from pathlib import Path
from random import Random
from typing import Any
from uuid import uuid4

from homeassistant.core import CALLBACK_TYPE, HomeAssistant, callback
from homeassistant.helpers.dispatcher import async_dispatcher_send
from homeassistant.helpers.event import async_track_point_in_time, async_track_time_interval
from homeassistant.util import dt as dt_util

from . import files
from .audio import starter_clips
from .const import (
    BEEP_FILE,
    MAX_LIBRARY_BYTES,
    MAX_RUN_NOW_MINUTES,
    MAX_SNOOZE_MINUTES,
    MAX_SOUNDS,
    MAX_UPLOAD_BYTES,
    MEDIA_SOURCE_PREFIX,
    PLAY_TIMEOUT_SECONDS,
    SIGNAL_UPDATE,
    SILENCE_FILE,
    STARTER_CATEGORY,
    TICK_SECONDS,
)
from .engine import (
    choose_sound,
    current_window,
    generate_pattern,
    next_slot_index,
    next_window,
    pattern_from_text,
    pattern_to_text,
    slot_time,
)
from .models import (
    HiSosedError,
    Layer,
    OutputProfile,
    Scenario,
    Sound,
    apply_preset,
    capture_preset,
    guess_content_type,
    timing_signature,
)
from .storage import RuntimeStore, ScenarioStore

_LOGGER = logging.getLogger(__name__)
LayerKey = tuple[str, str]
_STATE_RANK = {"disabled": 0, "idle": 1, "waiting": 2, "running": 3}
# Supported-feature bits of media_player, copied to keep the domain import-light.
_FEATURE_VOLUME_SET = 4
_FEATURE_TURN_ON = 128


@dataclass(slots=True)
class LayerRuntime:
    """In-memory state of exactly one layer scheduler."""

    generation: int
    signature: tuple[Any, ...] = ()
    cancel: CALLBACK_TYPE | None = None
    prepare_cancel: CALLBACK_TYPE | None = None
    state: str = "disabled"
    issue: str | None = None
    window_start: datetime | None = None
    window_end: datetime | None = None
    cycle_index: int = -1
    pattern: tuple[bool, ...] = ()
    next_slot: int | None = None
    next_event: datetime | None = None
    played_count: int = 0
    skipped_count: int = 0
    error_count: int = 0
    last_error: str | None = None
    last_played_at: datetime | None = None


@dataclass(frozen=True, slots=True)
class _PlayPlan:
    generation: int
    key: LayerKey
    media_content_id: str
    targets: tuple[tuple[str, int | None], ...]


def _iso(value: datetime | None) -> str | None:
    return value.isoformat() if value else None


class ScenarioManager:
    """Own validated data and coordinate every asynchronous side effect."""

    def __init__(self, hass: HomeAssistant) -> None:
        self.hass = hass
        self._store = ScenarioStore(hass)
        self._runtime_store = RuntimeStore(hass)
        self._scenarios: dict[str, Scenario] = {}
        self._sounds: dict[str, Sound] = {}
        self._outputs: dict[str, OutputProfile] = {}
        self._runtimes: dict[LayerKey, LayerRuntime] = {}
        self._overrides: dict[str, tuple[datetime, datetime]] = {}
        self._snooze_until: datetime | None = None
        self._checkpoint: dict[str, dict[str, Any]] = {}
        self._inflight: set[str] = set()
        self._last_play: dict[str, tuple[datetime, LayerKey, int]] = {}
        self._last_keepalive: dict[str, datetime] = {}
        self._tick_cancel: CALLBACK_TYPE | None = None
        self._lock = asyncio.Lock()
        self._rng = Random(secrets.randbits(64))
        self.media_dir: Path = files.media_directory(hass)

    # ----------------------------------------------------------------- lifecycle

    async def async_initialize(self) -> None:
        """Load valid data and the runtime checkpoint; invalid entries are skipped."""
        data = await self._store.async_load()
        for sound_id, raw in data["sounds"].items():
            try:
                sound = Sound.from_dict(raw)
            except (HiSosedError, TypeError, ValueError):
                continue
            if sound.id == sound_id:
                self._sounds[sound.id] = sound
        for entity_id, raw in data["outputs"].items():
            try:
                output = OutputProfile.from_dict(raw)
            except (HiSosedError, TypeError, ValueError):
                continue
            if output.entity_id == entity_id:
                self._outputs[entity_id] = output
        skipped = 0
        for scenario_id, raw in data["scenarios"].items():
            try:
                scenario = Scenario.from_dict(raw)
            except (HiSosedError, TypeError, ValueError):
                skipped += 1
                continue
            if scenario.id == scenario_id:
                self._scenarios[scenario.id] = scenario
        if skipped:
            _LOGGER.warning("Ignored %d invalid stored scenario(s)", skipped)
        checkpoint = await self._runtime_store.async_load()
        self._checkpoint = dict(checkpoint.get("layers") or {})
        for scenario_id, bounds in (checkpoint.get("overrides") or {}).items():
            start, end = (dt_util.parse_datetime(item) for item in bounds)
            if start and end and scenario_id in self._scenarios:
                self._overrides[scenario_id] = (start, end)
        self._snooze_until = dt_util.parse_datetime(checkpoint.get("snooze_until") or "")
        await self.hass.async_add_executor_job(files.ensure_system_files, self.media_dir)

    async def async_start_all(self) -> None:
        """Schedule every scenario once Home Assistant has started."""
        async with self._lock:
            now = dt_util.now()
            for scenario in self._scenarios.values():
                self._reschedule_locked(scenario, now, force=True)
            if self._tick_cancel is None:
                self._tick_cancel = async_track_time_interval(
                    self.hass, self._tick, timedelta(seconds=TICK_SECONDS)
                )
        self._publish(None, config=True)

    async def async_shutdown(self) -> None:
        """Invalidate every callback before unloading the integration."""
        async with self._lock:
            if self._tick_cancel:
                self._tick_cancel()
                self._tick_cancel = None
            for key in tuple(self._runtimes):
                self._invalidate_locked(key)
            self._runtimes.clear()
        await self._runtime_store.async_flush(self._checkpoint_data)

    # ------------------------------------------------------------------- queries

    @property
    def tz(self):
        """Return the Home Assistant time zone."""
        return dt_util.get_default_time_zone()

    def get_state(self) -> dict[str, Any]:
        """Return the full panel snapshot."""
        usage = self.sound_usage()
        return {
            "scenarios": [self.serialize_scenario(item) for item in self._scenarios.values()],
            "sounds": [{**item.as_dict(), "usage": usage.get(item.id, 0)} for item in self._sounds.values()],
            "outputs": [item.as_dict() for item in self._outputs.values()],
            "settings": {"snooze_until": _iso(self._active_snooze(dt_util.now()))},
            "library": {"path": f"/media/{self.media_dir.name}", "max_upload_bytes": MAX_UPLOAD_BYTES},
        }

    def scenario_ids(self) -> list[str]:
        """Return the current scenario ids."""
        return list(self._scenarios)

    def scenario(self, scenario_id: str) -> Scenario | None:
        """Return one scenario."""
        return self._scenarios.get(scenario_id)

    def status(self, scenario_id: str) -> tuple[str, datetime | None]:
        """Return the aggregated state and the next window boundary for entities."""
        upcoming = [rt.next_event for rt in self._scenario_runtimes(scenario_id) if rt.state == "waiting" and rt.next_event]
        return self.runtime_view(scenario_id)["state"], min(upcoming, default=None)

    def serialize_scenario(self, scenario: Scenario) -> dict[str, Any]:
        """Return configuration plus runtime state."""
        result = scenario.as_dict()
        result["runtime"] = self.runtime_view(scenario.id)
        active = next((item for item in scenario.presets if item.id == scenario.active_preset_id), None)
        if active is not None:
            captured = capture_preset(scenario, active.name, active.id)
            current = next(item for item in captured.presets if item.id == active.id)
            result["active_preset_modified"] = current.layers != active.layers
        else:
            result["active_preset_modified"] = False
        return result

    def _scenario_runtimes(self, scenario_id: str) -> list[LayerRuntime]:
        return [rt for (sid, _), rt in self._runtimes.items() if sid == scenario_id]

    def runtime_view(self, scenario_id: str) -> dict[str, Any]:
        """Return the live runtime of one scenario."""
        scenario = self._scenarios.get(scenario_id)
        now = dt_util.now()
        layers: dict[str, Any] = {}
        state = "disabled"
        has_error = False
        if scenario is not None:
            for layer in scenario.layers:
                rt = self._runtimes.get((scenario_id, layer.id))
                if rt is None:
                    continue
                layers[layer.id] = {
                    "state": rt.state,
                    "issue": rt.issue,
                    "last_error": rt.last_error,
                    "next_event": _iso(rt.next_event),
                    "window_start": _iso(rt.window_start),
                    "window_end": _iso(rt.window_end),
                    "cycle_index": rt.cycle_index,
                    "pattern": pattern_to_text(rt.pattern),
                    "next_slot": rt.next_slot,
                    "played_count": rt.played_count,
                    "skipped_count": rt.skipped_count,
                    "error_count": rt.error_count,
                    "last_played_at": _iso(rt.last_played_at),
                }
                if _STATE_RANK.get(rt.state, 0) > _STATE_RANK.get(state, 0):
                    state = rt.state
                has_error = has_error or (rt.state == "running" and rt.last_error is not None)
        if state == "running" and self._active_snooze(now):
            state = "snoozed"
        elif has_error:
            state = "error"
        override = self._overrides.get(scenario_id)
        return {
            "state": state,
            "override_until": _iso(override[1]) if override and override[1] > now else None,
            "layers": layers,
        }

    # ------------------------------------------------------------ scenario CRUD

    async def async_save_scenario(self, raw: dict[str, Any]) -> dict[str, Any]:
        """Validate, revision-check, persist, then reschedule a scenario."""
        async with self._lock:
            raw_id = raw.get("id")
            existing = self._scenarios.get(str(raw_id)) if raw_id else None
            if existing is not None and raw.get("revision") != existing.revision:
                raise HiSosedError("revision_conflict")
            scenario = Scenario.from_dict(raw, revision=existing.revision + 1 if existing else 1)
            self._check_references(scenario)
            await self._commit_locked(scenario)
        self._publish(scenario.id, config=True)
        return self.serialize_scenario(scenario)

    async def async_delete_scenario(self, scenario_id: str) -> None:
        """Cancel and remove one scenario atomically."""
        async with self._lock:
            self._require(scenario_id)
            updated = dict(self._scenarios)
            del updated[scenario_id]
            await self._persist_locked(scenarios=updated)
            for key in [key for key in self._runtimes if key[0] == scenario_id]:
                self._invalidate_locked(key)
                del self._runtimes[key]
            for checkpoint_key in [item for item in self._checkpoint if item.startswith(f"{scenario_id}:")]:
                del self._checkpoint[checkpoint_key]
            self._overrides.pop(scenario_id, None)
            self._scenarios = updated
            self._save_checkpoint()
        self._publish(scenario_id, config=True)

    async def async_set_enabled(self, scenario_ref: str, enabled: bool) -> None:
        """Turn the scenario's automatic schedule on or off (persisted)."""
        async with self._lock:
            scenario = self._resolve(scenario_ref)
            if not enabled:
                self._overrides.pop(scenario.id, None)
                self._save_checkpoint()
            if scenario.enabled != enabled:
                await self._commit_locked(self._bump(replace(scenario, enabled=enabled)))
            else:
                self._reschedule_locked(scenario, dt_util.now())
        self._publish(scenario.id, config=True)

    async def async_set_layer_enabled(self, scenario_ref: str, layer_ref: str, enabled: bool) -> None:
        """Switch one layer on or off without deleting anything."""
        async with self._lock:
            scenario = self._resolve(scenario_ref)
            layer = self._resolve_layer(scenario, layer_ref)
            if layer.enabled == enabled:
                return
            layers = tuple(replace(item, enabled=enabled) if item.id == layer.id else item for item in scenario.layers)
            await self._commit_locked(self._bump(replace(scenario, layers=layers)))
        self._publish(scenario.id, config=True)

    async def async_set_sound_enabled(self, scenario_ref: str, layer_ref: str, sound_id: str, enabled: bool) -> None:
        """Switch one sound of a layer on or off."""
        async with self._lock:
            scenario = self._resolve(scenario_ref)
            layer = self._resolve_layer(scenario, layer_ref)
            if all(ref.sound_id != sound_id for ref in layer.sounds):
                raise HiSosedError("sound_not_found")
            sounds = tuple(replace(ref, enabled=enabled) if ref.sound_id == sound_id else ref for ref in layer.sounds)
            layers = tuple(replace(item, sounds=sounds) if item.id == layer.id else item for item in scenario.layers)
            await self._commit_locked(self._bump(replace(scenario, layers=layers)))
        self._publish(scenario.id, config=True)

    async def async_apply_preset(self, scenario_ref: str, preset_ref: str) -> None:
        """Atomically switch the layer mix to a saved preset."""
        async with self._lock:
            scenario = self._resolve(scenario_ref)
            preset = next(
                (item for item in scenario.presets if preset_ref in (item.id, item.name)), None
            )
            if preset is None:
                raise HiSosedError("preset_not_found")
            updated = apply_preset(scenario, preset.id)
            self._check_references(updated)
            await self._commit_locked(self._bump(updated))
        self._publish(scenario.id, config=True)

    async def async_capture_preset(self, scenario_ref: str, name: str, preset_id: str | None = None) -> str:
        """Store the current mix as a new preset, or overwrite an existing one."""
        async with self._lock:
            scenario = self._resolve(scenario_ref)
            if preset_id is not None and all(item.id != preset_id for item in scenario.presets):
                raise HiSosedError("preset_not_found")
            updated = capture_preset(scenario, name, preset_id)
            await self._commit_locked(self._bump(updated))
        self._publish(scenario.id, config=True)
        return updated.active_preset_id or ""

    # ------------------------------------------------------------ run control

    async def async_start(self, scenario_ref: str) -> None:
        """Enable the schedule; playback still happens only inside windows."""
        await self.async_set_enabled(scenario_ref, True)

    async def async_stop(self, scenario_ref: str) -> None:
        """Idempotently stop: invalidate generations first, then persist 'disabled'."""
        await self.async_set_enabled(scenario_ref, False)

    async def async_run_now(self, scenario_ref: str, minutes: int) -> None:
        """Play right now for a limited time regardless of the weekly schedule."""
        if not 1 <= int(minutes) <= MAX_RUN_NOW_MINUTES:
            raise HiSosedError("invalid_duration")
        async with self._lock:
            scenario = self._resolve(scenario_ref)
            now = dt_util.now()
            self._overrides[scenario.id] = (now, now + timedelta(minutes=int(minutes)))
            self._save_checkpoint()
            if not scenario.enabled:
                scenario = self._bump(replace(scenario, enabled=True))
                await self._commit_locked(scenario, force=True, fresh=True)
            else:
                self._reschedule_locked(scenario, now, force=True, fresh=True)
        self._publish(scenario.id, config=True)

    async def async_cancel_run_now(self, scenario_ref: str) -> None:
        """End a manual run early and return to the weekly schedule."""
        async with self._lock:
            scenario = self._resolve(scenario_ref)
            if self._overrides.pop(scenario.id, None) is not None:
                self._save_checkpoint()
                self._reschedule_locked(scenario, dt_util.now(), force=True)
        self._publish(scenario.id, config=True)

    async def async_regenerate(self, scenario_ref: str, layer_ref: str | None = None) -> None:
        """Replace only the future cells of running layers."""
        async with self._lock:
            scenario = self._resolve(scenario_ref)
            layers = [self._resolve_layer(scenario, layer_ref)] if layer_ref else list(scenario.layers)
            changed = False
            for layer in layers:
                rt = self._runtimes.get((scenario.id, layer.id))
                if rt is None or rt.window_start is None or rt.next_slot is None:
                    continue
                self._checkpoint.pop(f"{scenario.id}:{layer.id}", None)
                rt.cycle_index = -1
                self._ensure_pattern_locked(scenario, layer, rt, rt.next_slot)
                changed = True
            if not changed:
                raise HiSosedError("scenario_not_running")
        self._publish(scenario.id)

    async def async_snooze(self, minutes: int) -> None:
        """Silence every scenario for a while; skipped cells are not replayed."""
        if not 1 <= int(minutes) <= MAX_SNOOZE_MINUTES:
            raise HiSosedError("invalid_duration")
        async with self._lock:
            self._snooze_until = dt_util.now() + timedelta(minutes=int(minutes))
            self._save_checkpoint()
        self._publish(None, config=True)

    async def async_resume(self) -> None:
        """End the global silence."""
        async with self._lock:
            self._snooze_until = None
            self._save_checkpoint()
        self._publish(None, config=True)

    async def async_preview(
        self,
        sound_id: str,
        entity_ids: list[str] | None = None,
        scenario_ref: str | None = None,
    ) -> None:
        """Play one library sound once on explicit players or the scenario's players."""
        async with self._lock:
            sound = self._sounds.get(sound_id)
            if sound is None:
                raise HiSosedError("sound_not_found")
            targets = list(entity_ids or [])
            if not targets and scenario_ref:
                targets = list(self._resolve(scenario_ref).target_entity_ids)
            if not targets:
                raise HiSosedError("no_targets")
            plan = tuple((target, self._output_volume(target)) for target in targets)
        await self._async_play_checked(sound.media_content_id, plan)

    async def async_test_output(self, entity_id: str) -> None:
        """Play the generated test beep on one player."""
        OutputProfile.from_dict({"entity_id": entity_id})
        await self._async_play_checked(files.system_uri(BEEP_FILE), ((entity_id, self._output_volume(entity_id)),))

    async def _async_play_checked(self, uri: str, plan: tuple[tuple[str, int | None], ...]) -> None:
        results = await asyncio.gather(*(self._async_play_on(target, uri, volume) for target, volume in plan))
        if all(results):
            raise HiSosedError(results[0] or "player_error")

    # ------------------------------------------------------------ outputs

    async def async_save_output(self, raw: dict[str, Any]) -> dict[str, Any]:
        """Create or replace the profile of one speaker."""
        output = OutputProfile.from_dict(raw)
        async with self._lock:
            updated = dict(self._outputs)
            updated[output.entity_id] = output
            await self._persist_locked(outputs=updated)
            self._outputs = updated
        self._publish(None, config=True)
        return output.as_dict()

    async def async_delete_output(self, entity_id: str) -> None:
        """Forget the profile of one speaker."""
        async with self._lock:
            if entity_id not in self._outputs:
                raise HiSosedError("output_not_found")
            updated = dict(self._outputs)
            del updated[entity_id]
            await self._persist_locked(outputs=updated)
            self._outputs = updated
        self._publish(None, config=True)

    # ------------------------------------------------------------ library

    def check_upload_quota(self, size: int) -> None:
        """Reject an upload that would exceed the library limits."""
        managed = sum(item.size for item in self._sounds.values() if item.managed)
        if managed + size > MAX_LIBRARY_BYTES:
            raise HiSosedError("library_full")
        if len(self._sounds) >= MAX_SOUNDS:
            raise HiSosedError("library_full")

    async def async_register_sound(
        self, *, relative_path: str, name: str, category: str | None, size: int
    ) -> dict[str, Any]:
        """Add a file already stored in the managed directory to the library."""
        uri = f"{MEDIA_SOURCE_PREFIX}{relative_path}"
        sound = Sound.from_dict(
            {
                "id": str(uuid4()),
                "name": name.rsplit(".", 1)[0] if "." in name else name,
                "category": category,
                "media_content_id": uri,
                "content_type": guess_content_type(uri),
                "size": size,
                "managed": True,
                "created_at": dt_util.utcnow().isoformat(),
            }
        )
        async with self._lock:
            self.check_upload_quota(size)
            updated = dict(self._sounds)
            updated[sound.id] = sound
            await self._persist_locked(sounds=updated)
            self._sounds = updated
        self._publish(None, config=True)
        return sound.as_dict()

    async def async_add_uri_sound(self, raw: dict[str, Any]) -> dict[str, Any]:
        """Reference any Home Assistant media-source item without copying it."""
        sound = Sound.from_dict({**raw, "id": None, "managed": False, "created_at": dt_util.utcnow().isoformat()})
        async with self._lock:
            if len(self._sounds) >= MAX_SOUNDS:
                raise HiSosedError("library_full")
            updated = dict(self._sounds)
            updated[sound.id] = sound
            await self._persist_locked(sounds=updated)
            self._sounds = updated
        self._publish(None, config=True)
        return sound.as_dict()

    async def async_update_sound(self, sound_id: str, name: str | None, category: str | None) -> dict[str, Any]:
        """Rename a sound or move it to another category."""
        async with self._lock:
            sound = self._sounds.get(sound_id)
            if sound is None:
                raise HiSosedError("sound_not_found")
            raw = sound.as_dict()
            if name is not None:
                raw["name"] = name
            if category is not None:
                raw["category"] = category
            updated_sound = Sound.from_dict(raw)
            updated = dict(self._sounds)
            updated[sound_id] = updated_sound
            await self._persist_locked(sounds=updated)
            self._sounds = updated
        self._publish(None, config=True)
        return updated_sound.as_dict()

    async def async_delete_sound(self, sound_id: str, *, force: bool = False) -> None:
        """Remove a sound; with ``force`` it is also removed from layers and presets."""
        async with self._lock:
            sound = self._sounds.get(sound_id)
            if sound is None:
                raise HiSosedError("sound_not_found")
            using = [item for item in self._scenarios.values() if sound_id in item.sound_ids()]
            if using and not force:
                raise HiSosedError("sound_in_use")
            scenarios = dict(self._scenarios)
            for scenario in using:
                scenarios[scenario.id] = self._bump(_without_sound(scenario, sound_id))
            sounds = dict(self._sounds)
            del sounds[sound_id]
            await self._persist_locked(sounds=sounds, scenarios=scenarios)
            self._sounds = sounds
            self._scenarios = scenarios
            now = dt_util.now()
            for scenario in using:
                self._reschedule_locked(scenarios[scenario.id], now)
        if sound.managed and (path := files.uri_to_path(self.media_dir, sound.media_content_id)):
            await self.hass.async_add_executor_job(files.remove_file, path)
        for scenario in using:
            self._publish(scenario.id, config=True)
        self._publish(None, config=True)

    async def async_scan_library(self) -> int:
        """Register audio files that were copied into the folder by other means."""
        found = await self.hass.async_add_executor_job(files.scan_audio_files, self.media_dir)
        async with self._lock:
            known = {item.media_content_id for item in self._sounds.values()}
            updated = dict(self._sounds)
            added = 0
            for relative, category, size in found:
                uri = f"{MEDIA_SOURCE_PREFIX}{relative}"
                if uri in known or len(updated) >= MAX_SOUNDS:
                    continue
                stem = relative.rsplit("/", 1)[-1].rsplit(".", 1)[0]
                sound = Sound.from_dict(
                    {
                        "name": stem,
                        "category": category or None,
                        "media_content_id": uri,
                        "size": size,
                        "managed": True,
                        "created_at": dt_util.utcnow().isoformat(),
                    }
                )
                updated[sound.id] = sound
                added += 1
            if added:
                await self._persist_locked(sounds=updated)
                self._sounds = updated
        if added:
            self._publish(None, config=True)
        return added

    async def async_add_starter_pack(self) -> int:
        """Generate the built-in procedural clips and add the missing ones."""
        existing = {item.name for item in self._sounds.values() if item.category == STARTER_CATEGORY}
        clips = [(name, data) for name, data in await self.hass.async_add_executor_job(starter_clips) if name not in existing]
        added = 0
        for name, data in clips:
            filename = f"{uuid4().hex}.wav"
            await self.hass.async_add_executor_job(files.write_atomic, self.media_dir, filename, data)
            await self.async_register_sound(
                relative_path=filename, name=name, category=STARTER_CATEGORY, size=len(data)
            )
            added += 1
        return added

    def sound_usage(self) -> dict[str, int]:
        """Return how many scenarios reference each sound."""
        usage: dict[str, int] = {}
        for scenario in self._scenarios.values():
            for sound_id in scenario.sound_ids():
                usage[sound_id] = usage.get(sound_id, 0) + 1
        return usage

    # ------------------------------------------------------------ internals: data

    def _require(self, scenario_id: str) -> Scenario:
        scenario = self._scenarios.get(scenario_id)
        if scenario is None:
            raise HiSosedError("scenario_not_found")
        return scenario

    def _resolve(self, ref: str) -> Scenario:
        """Accept a scenario id or its exact name (friendlier for automations)."""
        scenario = self._scenarios.get(ref) or next(
            (item for item in self._scenarios.values() if item.name == ref), None
        )
        if scenario is None:
            raise HiSosedError("scenario_not_found")
        return scenario

    @staticmethod
    def _resolve_layer(scenario: Scenario, ref: str) -> Layer:
        layer = next((item for item in scenario.layers if ref in (item.id, item.name)), None)
        if layer is None:
            raise HiSosedError("layer_not_found")
        return layer

    @staticmethod
    def _bump(scenario: Scenario) -> Scenario:
        return replace(scenario, revision=scenario.revision + 1)

    def _check_references(self, scenario: Scenario) -> None:
        if not scenario.sound_ids() <= set(self._sounds):
            raise HiSosedError("unknown_sound")

    async def _persist_locked(
        self,
        *,
        sounds: dict[str, Sound] | None = None,
        outputs: dict[str, OutputProfile] | None = None,
        scenarios: dict[str, Scenario] | None = None,
    ) -> None:
        """Write everything before memory changes, so a failed write changes nothing.

        Awaiting the bounded Store write under the lock is deliberate (ADR-0003):
        publishing to memory only after a successful write keeps saves atomic.
        """
        # Compare with None: an empty dict (the last item was deleted) must be persisted too.
        sounds = self._sounds if sounds is None else sounds
        outputs = self._outputs if outputs is None else outputs
        scenarios = self._scenarios if scenarios is None else scenarios
        await self._store.async_save(
            {
                "sounds": {key: item.as_dict() for key, item in sounds.items()},
                "outputs": {key: item.as_dict() for key, item in outputs.items()},
                "scenarios": {key: item.as_dict() for key, item in scenarios.items()},
            }
        )

    async def _commit_locked(self, scenario: Scenario, *, force: bool = False, fresh: bool = False) -> None:
        updated = dict(self._scenarios)
        updated[scenario.id] = scenario
        await self._persist_locked(scenarios=updated)
        self._scenarios = updated
        self._reschedule_locked(scenario, dt_util.now(), force=force, fresh=fresh)

    def _checkpoint_data(self) -> dict[str, Any]:
        return {
            "layers": self._checkpoint,
            "overrides": {key: [start.isoformat(), end.isoformat()] for key, (start, end) in self._overrides.items()},
            "snooze_until": _iso(self._snooze_until),
        }

    def _save_checkpoint(self) -> None:
        self._runtime_store.async_schedule_save(self._checkpoint_data)

    # ------------------------------------------------------------ internals: scheduling

    def _active_snooze(self, now: datetime) -> datetime | None:
        return self._snooze_until if self._snooze_until and self._snooze_until > now else None

    def _output_volume(self, entity_id: str) -> int | None:
        output = self._outputs.get(entity_id)
        return output.volume if output else None

    def _invalidate_locked(self, key: LayerKey) -> int:
        """Invalidate the generation first, then cancel timers; return the new generation."""
        runtime = self._runtimes.get(key)
        if runtime is None:
            return 0
        runtime.generation += 1
        for cancel in (runtime.cancel, runtime.prepare_cancel):
            if cancel:
                cancel()
        runtime.cancel = runtime.prepare_cancel = None
        return runtime.generation

    def _signature(self, scenario: Scenario, layer: Layer) -> tuple[Any, ...]:
        return (*timing_signature(scenario, layer), self._overrides.get(scenario.id))

    def _reschedule_locked(self, scenario: Scenario, now: datetime, *, force: bool = False, fresh: bool = False) -> None:
        """Restart layers whose timing changed; untouched layers keep their cycle."""
        layer_ids = {layer.id for layer in scenario.layers}
        for key in [key for key in self._runtimes if key[0] == scenario.id and key[1] not in layer_ids]:
            self._invalidate_locked(key)
            del self._runtimes[key]
            self._checkpoint.pop(f"{key[0]}:{key[1]}", None)
        for layer in scenario.layers:
            runtime = self._runtimes.get((scenario.id, layer.id))
            if not force and runtime is not None and runtime.signature == self._signature(scenario, layer):
                continue
            self._start_layer_locked(scenario, layer, now, fresh=fresh)

    def _layer_issue(self, scenario: Scenario, layer: Layer) -> str | None:
        if not any(ref.sound_id in self._sounds for ref in layer.enabled_sounds):
            return "no_sounds"
        if not scenario.layer_targets(layer):
            return "no_targets"
        return None

    def _window_for(self, scenario: Scenario, layer: Layer, now: datetime) -> tuple[datetime, datetime] | None:
        override = self._overrides.get(scenario.id)
        if override and override[1] > now:
            return override if override[0] <= now else None
        return current_window(scenario.layer_schedule(layer), now, self.tz)

    def _start_layer_locked(self, scenario: Scenario, layer: Layer, now: datetime, *, fresh: bool) -> None:
        key = (scenario.id, layer.id)
        old = self._runtimes.get(key)
        runtime = LayerRuntime(generation=self._invalidate_locked(key) + 1, signature=self._signature(scenario, layer))
        if old is not None:
            runtime.played_count, runtime.skipped_count, runtime.error_count = (
                old.played_count, old.skipped_count, old.error_count
            )
        self._runtimes[key] = runtime
        if not scenario.enabled or not layer.enabled:
            runtime.state = "disabled"
            return
        if issue := self._layer_issue(scenario, layer):
            runtime.state, runtime.issue = "idle", issue
            return
        override = self._overrides.get(scenario.id)
        if override and override[1] <= now:
            del self._overrides[scenario.id]
            self._save_checkpoint()
        window = self._window_for(scenario, layer, now)
        if window is None:
            upcoming = next_window(scenario.layer_schedule(layer), now, self.tz)
            if upcoming is None:
                runtime.state, runtime.issue = "idle", "no_schedule"
                return
            runtime.state = "waiting"
            runtime.window_start, runtime.window_end = upcoming
            self._schedule_boundary_locked(key, runtime, upcoming[0])
            self._schedule_prepare_locked(scenario, layer, runtime, upcoming[0], now)
            return
        runtime.window_start, runtime.window_end = window
        runtime.next_slot = next_slot_index(window[0], now, layer.grid.slot_seconds, fresh=fresh)
        self._schedule_slot_locked(scenario, layer, runtime)

    def _schedule_boundary_locked(self, key: LayerKey, runtime: LayerRuntime, when: datetime) -> None:
        generation = runtime.generation
        runtime.next_event = when

        @callback
        def _fire(_: datetime) -> None:
            self.hass.async_create_task(self._async_fire_boundary(key, generation), eager_start=False)

        runtime.cancel = async_track_point_in_time(self.hass, _fire, when)

    def _schedule_prepare_locked(
        self, scenario: Scenario, layer: Layer, runtime: LayerRuntime, start: datetime, now: datetime
    ) -> None:
        targets = scenario.layer_targets(layer)
        warmup = max((self._outputs[t].warmup_seconds for t in targets if t in self._outputs), default=0)
        when = start - timedelta(seconds=warmup)
        if warmup <= 0 or when <= now:
            return
        generation = runtime.generation
        key = (scenario.id, layer.id)

        @callback
        def _fire(_: datetime) -> None:
            self.hass.async_create_task(self._async_prepare(key, generation), eager_start=False)

        runtime.prepare_cancel = async_track_point_in_time(self.hass, _fire, when)

    def _schedule_slot_locked(self, scenario: Scenario, layer: Layer, runtime: LayerRuntime) -> bool:
        """Schedule the next slot by absolute time; return True if a new cycle began."""
        assert runtime.window_start is not None and runtime.window_end is not None
        assert runtime.next_slot is not None
        key = (scenario.id, layer.id)
        slot = runtime.next_slot
        at = slot_time(runtime.window_start, slot, layer.grid.slot_seconds)
        if at >= runtime.window_end:
            runtime.state = "waiting"
            self._schedule_boundary_locked(key, runtime, runtime.window_end)
            return False
        new_cycle = self._ensure_pattern_locked(scenario, layer, runtime, slot)
        lead = max((self._outputs[t].lead_ms for t in scenario.layer_targets(layer) if t in self._outputs), default=0)
        fire_at = max(runtime.window_start, at - timedelta(milliseconds=lead))
        runtime.state = "running"
        runtime.next_event = at
        generation = runtime.generation

        @callback
        def _fire(_: datetime) -> None:
            self.hass.async_create_task(self._async_fire_slot(key, generation, slot, at), eager_start=False)

        runtime.cancel = async_track_point_in_time(self.hass, _fire, fire_at)
        return new_cycle

    def _ensure_pattern_locked(self, scenario: Scenario, layer: Layer, runtime: LayerRuntime, slot: int) -> bool:
        cycle = slot // layer.grid.slot_count
        if runtime.cycle_index == cycle and runtime.pattern:
            return False
        checkpoint_key = f"{scenario.id}:{layer.id}"
        saved = self._checkpoint.get(checkpoint_key) or {}
        restored = None
        if (
            runtime.window_start is not None
            and saved.get("window_start") == runtime.window_start.isoformat()
            and saved.get("cycle_index") == cycle
        ):
            restored = pattern_from_text(str(saved.get("pattern", "")), layer.grid)
        runtime.pattern = restored or generate_pattern(layer.grid, Random(secrets.randbits(64)), runtime.pattern)
        runtime.cycle_index = cycle
        self._checkpoint[checkpoint_key] = {
            "window_start": _iso(runtime.window_start),
            "cycle_index": cycle,
            "pattern": pattern_to_text(runtime.pattern),
        }
        self._save_checkpoint()
        return True

    def _current(self, key: LayerKey, generation: int) -> tuple[Scenario, Layer, LayerRuntime] | None:
        runtime = self._runtimes.get(key)
        scenario = self._scenarios.get(key[0])
        if runtime is None or scenario is None or runtime.generation != generation:
            return None
        layer = scenario.layer(key[1])
        return (scenario, layer, runtime) if layer is not None else None

    async def _async_fire_boundary(self, key: LayerKey, generation: int) -> None:
        """Window start or end: recompute from the current time (checks generation first)."""
        async with self._lock:
            current = self._current(key, generation)
            if current is None:
                return
            scenario, layer, _ = current
            self._start_layer_locked(scenario, layer, dt_util.now(), fresh=True)
        self._publish(key[0])

    async def _async_fire_slot(self, key: LayerKey, generation: int, slot: int, at: datetime) -> None:
        """Handle one scheduled cell."""
        plan: _PlayPlan | None = None
        publish = False
        async with self._lock:
            current = self._current(key, generation)
            if current is None:
                return
            scenario, layer, runtime = current
            now = dt_util.now()
            assert runtime.window_start is not None and runtime.window_end is not None
            if now >= runtime.window_end:
                self._start_layer_locked(scenario, layer, now, fresh=False)
                publish = True
            # A suspended host must never replay an old cell after it wakes up.
            elif now > at + timedelta(seconds=layer.grid.slot_seconds / 2):
                runtime.skipped_count += 1
                runtime.next_slot = next_slot_index(runtime.window_start, now, layer.grid.slot_seconds, fresh=False)
                self._schedule_slot_locked(scenario, layer, runtime)
                publish = True
            else:
                self._ensure_pattern_locked(scenario, layer, runtime, slot)
                active = runtime.pattern[slot % layer.grid.slot_count]
                runtime.next_slot = slot + 1
                publish = self._schedule_slot_locked(scenario, layer, runtime) or active
                if active and self._active_snooze(now):
                    runtime.skipped_count += 1
                elif active:
                    plan = self._plan_play_locked(scenario, layer, runtime, now)
        if plan is not None and plan.targets:
            results = await asyncio.gather(
                *(self._async_play_on(target, plan.media_content_id, volume) for target, volume in plan.targets)
            )
            async with self._lock:
                runtime = self._runtimes.get(key)
                if runtime is not None and runtime.generation == generation:
                    self._record_results(runtime, results)
        if publish:
            self._publish(key[0])

    def _plan_play_locked(self, scenario: Scenario, layer: Layer, runtime: LayerRuntime, now: datetime) -> _PlayPlan | None:
        ref = choose_sound(layer.sounds, self._rng, available=set(self._sounds))
        if ref is None:
            runtime.skipped_count += 1
            return None
        key = (scenario.id, layer.id)
        targets: list[tuple[str, int | None]] = []
        for target in scenario.layer_targets(layer):
            last = self._last_play.get(target)
            if layer.overlap == "skip" and last and last[1] != key and (now - last[0]).total_seconds() < last[2]:
                continue
            volume = layer.volume if layer.volume is not None else self._output_volume(target)
            targets.append((target, volume))
            self._last_play[target] = (now, key, layer.grid.slot_seconds)
        if not targets:
            runtime.skipped_count += 1
        return _PlayPlan(runtime.generation, key, self._sounds[ref.sound_id].media_content_id, tuple(targets))

    @staticmethod
    def _record_results(runtime: LayerRuntime, results: list[str | None]) -> None:
        if any(result is None for result in results):
            runtime.played_count += 1
            runtime.last_played_at = dt_util.now()
            runtime.last_error = None
        elif all(result == "target_busy" for result in results):
            runtime.skipped_count += 1
        else:
            runtime.error_count += 1
            runtime.last_error = next(result for result in results if result != "target_busy")

    async def _async_play_on(self, entity_id: str, media_content_id: str, volume: int | None) -> str | None:
        """Play on one player in isolation; return an error code or None."""
        if entity_id in self._inflight:
            return "target_busy"
        state = self.hass.states.get(entity_id)
        if state is None or state.state == "unavailable":
            return "target_unavailable"
        self._inflight.add(entity_id)
        try:
            features = int(state.attributes.get("supported_features") or 0)
            current = state.attributes.get("volume_level")
            if (
                volume is not None
                and features & _FEATURE_VOLUME_SET
                and (current is None or abs(float(current) - volume / 100) > 0.005)
            ):
                await self._async_call(entity_id, "volume_set", {"volume_level": volume / 100})
            await self._async_call(
                entity_id,
                "play_media",
                {"media_content_id": media_content_id, "media_content_type": "music"},
            )
        except TimeoutError:
            return "player_timeout"
        except Exception as err:  # noqa: BLE001 - third-party player integrations may raise anything
            _LOGGER.debug("Player call failed: %s", type(err).__name__)
            return "player_error"
        finally:
            self._inflight.discard(entity_id)
        return None

    async def _async_call(self, entity_id: str, service: str, data: dict[str, Any]) -> None:
        async with asyncio.timeout(PLAY_TIMEOUT_SECONDS):
            await self.hass.services.async_call(
                "media_player", service, data, target={"entity_id": entity_id}, blocking=True
            )

    async def _async_prepare(self, key: LayerKey, generation: int) -> None:
        """Wake sleepy speakers and set their volume shortly before a window."""
        async with self._lock:
            current = self._current(key, generation)
            if current is None:
                return
            scenario, layer, _ = current
            targets = [t for t in scenario.layer_targets(layer) if t in self._outputs]
        for target in targets:
            # Each call can take seconds; a stop in the meantime must reach the next target.
            async with self._lock:
                if self._current(key, generation) is None:
                    return
            state = self.hass.states.get(target)
            output = self._outputs.get(target)
            if state is None or state.state == "unavailable" or output is None:
                continue
            try:
                features = int(state.attributes.get("supported_features") or 0)
                if state.state in ("off", "standby") and features & _FEATURE_TURN_ON:
                    await self._async_call(target, "turn_on", {})
                if output.kind == "bluetooth":
                    await self._async_call(
                        target,
                        "play_media",
                        {"media_content_id": files.system_uri(SILENCE_FILE), "media_content_type": "music"},
                    )
                    self._last_keepalive[target] = dt_util.now()
            except Exception as err:  # noqa: BLE001 - best effort, the window itself is unaffected
                _LOGGER.debug("Warm-up failed: %s", type(err).__name__)

    @callback
    def _tick(self, now: datetime) -> None:
        """Expire snooze and keep Bluetooth speakers awake inside running windows."""
        if self._snooze_until and self._snooze_until <= now:
            self._snooze_until = None
            self._save_checkpoint()
            self._publish(None, config=True)
        busy_targets: set[str] = set()
        for (scenario_id, layer_id), runtime in self._runtimes.items():
            if runtime.state != "running" or not runtime.window_start or not runtime.window_end:
                continue
            if not runtime.window_start <= now < runtime.window_end:
                continue
            scenario = self._scenarios.get(scenario_id)
            layer = scenario.layer(layer_id) if scenario else None
            if scenario and layer:
                busy_targets.update(scenario.layer_targets(layer))
        for target in busy_targets:
            output = self._outputs.get(target)
            if output is None or output.keepalive_seconds <= 0 or target in self._inflight:
                continue
            last = max(
                (item for item in (self._last_play.get(target, (None,))[0], self._last_keepalive.get(target)) if item),
                default=None,
            )
            if last is not None and (now - last).total_seconds() < output.keepalive_seconds:
                continue
            self._last_keepalive[target] = now
            self.hass.async_create_task(
                self._async_play_on(target, files.system_uri(SILENCE_FILE), None), eager_start=False
            )

    def _publish(self, scenario_id: str | None, *, config: bool = False) -> None:
        """Notify the panel and entities without putting private data anywhere."""
        async_dispatcher_send(self.hass, SIGNAL_UPDATE, scenario_id, config)


def _without_sound(scenario: Scenario, sound_id: str) -> Scenario:
    layers = tuple(
        replace(layer, sounds=tuple(ref for ref in layer.sounds if ref.sound_id != sound_id))
        for layer in scenario.layers
    )
    presets = tuple(
        replace(
            preset,
            layers=tuple(
                replace(item, sounds=tuple(ref for ref in item.sounds if ref.sound_id != sound_id))
                for item in preset.layers
            ),
        )
        for preset in scenario.presets
    )
    return replace(scenario, layers=layers, presets=presets)

