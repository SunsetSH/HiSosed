"""Sensor: aggregated scenario state; attributes change only on window boundaries."""

from __future__ import annotations

from typing import Any

from homeassistant.components.sensor import SensorDeviceClass, SensorEntity
from homeassistant.config_entries import ConfigEntry
from homeassistant.core import HomeAssistant
from homeassistant.helpers.entity_platform import AddEntitiesCallback

from .entity import HiSosedEntity, async_setup_dynamic
from .manager import ScenarioManager
from .models import Scenario

STATES = ["disabled", "idle", "waiting", "running", "snoozed", "error"]


async def async_setup_entry(hass: HomeAssistant, entry: ConfigEntry, async_add_entities: AddEntitiesCallback) -> None:
    """Set up one status sensor per scenario."""
    async_setup_dynamic(hass, entry, async_add_entities, lambda manager, scenario: [StatusSensor(manager, scenario)])


class StatusSensor(HiSosedEntity, SensorEntity):
    """Shows disabled/idle/waiting/running/snoozed/error."""

    _attr_translation_key = "status"
    _attr_device_class = SensorDeviceClass.ENUM
    _attr_options = STATES

    def __init__(self, manager: ScenarioManager, scenario: Scenario) -> None:
        super().__init__(manager, scenario, "status")

    def _compute(self) -> Any:
        state, upcoming = self.manager.status(self.scenario_id)
        override = self.manager.runtime_view(self.scenario_id)["override_until"]
        self._attr_native_value = state
        self._attr_extra_state_attributes = {
            "next_window": upcoming.isoformat() if upcoming else None,
            "manual_until": override,
        }
        return (state, self._attr_extra_state_attributes["next_window"], override)
