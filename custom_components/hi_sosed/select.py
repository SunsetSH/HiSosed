"""Select: switch the scenario mix to a saved preset."""

from __future__ import annotations

from typing import Any

from homeassistant.components.select import SelectEntity
from homeassistant.config_entries import ConfigEntry
from homeassistant.core import HomeAssistant
from homeassistant.helpers.entity_platform import AddEntitiesCallback

from .entity import HiSosedEntity, async_call, async_setup_dynamic
from .manager import ScenarioManager
from .models import Scenario

NO_PRESET = "—"


async def async_setup_entry(hass: HomeAssistant, entry: ConfigEntry, async_add_entities: AddEntitiesCallback) -> None:
    """Set up one preset selector per scenario."""
    async_setup_dynamic(hass, entry, async_add_entities, lambda manager, scenario: [PresetSelect(manager, scenario)])


class PresetSelect(HiSosedEntity, SelectEntity):
    """Selecting an option applies that preset."""

    _attr_translation_key = "preset"

    def __init__(self, manager: ScenarioManager, scenario: Scenario) -> None:
        self._option_ids: dict[str, str] = {}
        super().__init__(manager, scenario, "preset")

    def _compute(self) -> Any:
        scenario = self.scenario
        self._option_ids = {}
        if scenario is not None:
            for preset in scenario.presets:
                label = preset.name
                # Duplicate names stay selectable through a numeric suffix.
                suffix = 2
                while label in self._option_ids:
                    label = f"{preset.name} ({suffix})"
                    suffix += 1
                self._option_ids[label] = preset.id
        self._attr_options = [NO_PRESET, *self._option_ids]
        active = scenario.active_preset_id if scenario else None
        self._attr_current_option = next(
            (label for label, preset_id in self._option_ids.items() if preset_id == active), NO_PRESET
        )
        return (tuple(self._attr_options), self._attr_current_option)

    async def async_select_option(self, option: str) -> None:
        """Apply the chosen preset."""
        preset_id = self._option_ids.get(option)
        if preset_id is not None:
            await async_call(self.manager.async_apply_preset(self.scenario_id, preset_id))
