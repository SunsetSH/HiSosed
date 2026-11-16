"""Fixtures for HiSosed integration tests."""

from __future__ import annotations

from collections.abc import Callable
from pathlib import Path
from typing import Any
from unittest.mock import patch

import pytest
from pytest_homeassistant_custom_component.common import MockConfigEntry

from homeassistant.core import HomeAssistant, ServiceCall
from homeassistant.exceptions import HomeAssistantError

from custom_components.hi_sosed.const import DATA_MANAGER, DOMAIN
from custom_components.hi_sosed.manager import ScenarioManager

MONDAY_10 = "2026-11-16 10:00:00+01:00"
KITCHEN = "media_player.kitchen"
HALL = "media_player.hall"


class FakePlayers:
    """Records play_media/volume_set per entity and can fail selected entities."""

    def __init__(self, hass: HomeAssistant) -> None:
        self.calls: list[tuple[str, str, dict[str, Any]]] = []
        self.failing: set[str] = set()
        for service in ("play_media", "volume_set", "turn_on"):
            hass.services.async_register("media_player", service, self._handler(service))
        for entity_id in (KITCHEN, HALL):
            hass.states.async_set(entity_id, "idle", {"supported_features": 4 | 128, "volume_level": 0.5})

    def _handler(self, service: str) -> Callable[[ServiceCall], Any]:
        async def handle(call: ServiceCall) -> None:
            entity_ids = call.data.get("entity_id") or []
            entity_ids = [entity_ids] if isinstance(entity_ids, str) else list(entity_ids)
            for entity_id in entity_ids:
                if entity_id in self.failing:
                    raise HomeAssistantError("boom")
                payload = {k: v for k, v in call.data.items() if k != "entity_id"}
                self.calls.append((service, entity_id, payload))

        return handle

    def plays(self, entity_id: str | None = None, *, include_system: bool = False) -> list[str]:
        """Return media ids played (optionally on one entity), excluding generated clips."""
        return [
            data["media_content_id"]
            for service, entity, data in self.calls
            if service == "play_media"
            and (entity_id is None or entity == entity_id)
            and (include_system or "/system/" not in data["media_content_id"])
        ]


@pytest.fixture
async def setup_integration(hass: HomeAssistant, tmp_path: Path, freezer):
    """Return an async factory that sets up HiSosed at a frozen Monday 10:00 CET."""
    freezer.move_to(MONDAY_10)
    await hass.config.async_set_time_zone("Europe/Berlin")
    hass.config.media_dirs = {"local": str(tmp_path)}
    # The panel needs the real frontend package, which the test harness does not ship.
    hass.config.components.update({"frontend", "panel_custom"})
    players = FakePlayers(hass)

    async def _setup() -> tuple[ScenarioManager, FakePlayers, MockConfigEntry]:
        entry = MockConfigEntry(domain=DOMAIN, title="HiSosed")
        entry.add_to_hass(hass)
        with patch("custom_components.hi_sosed.async_register_panel"):
            assert await hass.config_entries.async_setup(entry.entry_id)
            await hass.async_block_till_done()
        return hass.data[DOMAIN][DATA_MANAGER], players, entry

    return _setup


async def add_sound(manager: ScenarioManager, name: str = "knock") -> str:
    """Add a referenced (unmanaged) sound and return its id."""
    sound = await manager.async_add_uri_sound(
        {"media_content_id": f"media-source://media_source/local/{name}.mp3", "name": name}
    )
    return sound["id"]


def scenario_payload(sound_ids: list[str], **overrides: Any) -> dict[str, Any]:
    """Monday 10:00-11:00, one layer, every 2 s cell active."""
    data: dict[str, Any] = {
        "name": "Тест",
        "enabled": True,
        "target_entity_ids": [KITCHEN],
        "schedule": {"days": [[{"start": "10:00", "end": "11:00"}]] + [[]] * 6},
        "layers": [
            {
                "name": "Основная",
                "sounds": [{"sound_id": sound_id} for sound_id in sound_ids],
                "grid": {"slot_seconds": 2, "slot_count": 10, "density_percent": 100},
            }
        ],
    }
    data.update(overrides)
    return data
