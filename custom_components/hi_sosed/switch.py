"""Switches: the schedule of each scenario and every layer."""

from __future__ import annotations

from typing import Any

from homeassistant.components.switch import SwitchEntity
from homeassistant.config_entries import ConfigEntry
from homeassistant.core import HomeAssistant
from homeassistant.helpers.entity_platform import AddEntitiesCallback

from .entity import HiSosedEntity, async_call, async_setup_dynamic
from .manager import ScenarioManager
from .models import Scenario


async def async_setup_entry(hass: HomeAssistant, entry: ConfigEntry, async_add_entities: AddEntitiesCallback) -> None:
    """Set up dynamic switches."""

    def factory(manager: ScenarioManager, scenario: Scenario) -> list[HiSosedEntity]:
        return [ScheduleSwitch(manager, scenario)] + [
            LayerSwitch(manager, scenario, layer.id) for layer in scenario.layers
        ]

    async_setup_dynamic(hass, entry, async_add_entities, factory)


class ScheduleSwitch(HiSosedEntity, SwitchEntity):
    """Turns the automatic schedule of a scenario on or off."""

    _attr_translation_key = "schedule"

    def __init__(self, manager: ScenarioManager, scenario: Scenario) -> None:
        super().__init__(manager, scenario, "enabled")

    def _compute(self) -> Any:
        scenario = self.scenario
        self._attr_is_on = bool(scenario and scenario.enabled)
        return self._attr_is_on

    async def async_turn_on(self, **kwargs: Any) -> None:
        """Enable the schedule."""
        await async_call(self.manager.async_set_enabled(self.scenario_id, True))

    async def async_turn_off(self, **kwargs: Any) -> None:
        """Disable the schedule."""
        await async_call(self.manager.async_set_enabled(self.scenario_id, False))


class LayerSwitch(HiSosedEntity, SwitchEntity):
    """Turns one layer on or off without deleting it."""

    _attr_icon = "mdi:waveform"

    def __init__(self, manager: ScenarioManager, scenario: Scenario, layer_id: str) -> None:
        self.layer_id = layer_id
        super().__init__(manager, scenario, f"layer_{layer_id}")

    def _compute(self) -> Any:
        scenario = self.scenario
        layer = scenario.layer(self.layer_id) if scenario else None
        self._attr_is_on = bool(layer and layer.enabled)
        self._attr_name = layer.name if layer else None
        return (self._attr_is_on, self._attr_name)

    async def async_turn_on(self, **kwargs: Any) -> None:
        """Enable the layer."""
        await async_call(self.manager.async_set_layer_enabled(self.scenario_id, self.layer_id, True))

    async def async_turn_off(self, **kwargs: Any) -> None:
        """Disable the layer."""
        await async_call(self.manager.async_set_layer_enabled(self.scenario_id, self.layer_id, False))
