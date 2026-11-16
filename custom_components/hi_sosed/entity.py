"""Shared base and dynamic-platform helper for HiSosed entities."""

from __future__ import annotations

from typing import Any, Callable

from homeassistant.config_entries import ConfigEntry
from homeassistant.core import HomeAssistant, callback
from homeassistant.exceptions import HomeAssistantError
from homeassistant.helpers import entity_registry as er
from homeassistant.helpers.device_registry import DeviceEntryType, DeviceInfo
from homeassistant.helpers.dispatcher import async_dispatcher_connect
from homeassistant.helpers.entity import Entity
from homeassistant.helpers.entity_platform import AddEntitiesCallback

from .const import DATA_MANAGER, DOMAIN, SIGNAL_UPDATE
from .manager import ScenarioManager
from .models import HiSosedError, Scenario


class HiSosedEntity(Entity):
    """Entity bound to one scenario; it refreshes from the manager on dispatcher signals."""

    _attr_has_entity_name = True
    _attr_should_poll = False

    def __init__(self, manager: ScenarioManager, scenario: Scenario, suffix: str) -> None:
        self.manager = manager
        self.scenario_id = scenario.id
        self._attr_unique_id = f"{scenario.id}_{suffix}"
        self._attr_device_info = DeviceInfo(
            identifiers={(DOMAIN, scenario.id)},
            name=scenario.name,
            manufacturer="HiSosed",
            model="Программа",
            entry_type=DeviceEntryType.SERVICE,
        )
        self._snapshot: Any = None
        self._refresh()

    @property
    def scenario(self) -> Scenario | None:
        """Return the current scenario."""
        return self.manager.scenario(self.scenario_id)

    async def async_added_to_hass(self) -> None:
        """Subscribe to manager updates."""
        self.async_on_remove(async_dispatcher_connect(self.hass, SIGNAL_UPDATE, self._handle_update))

    @callback
    def _handle_update(self, scenario_id: str | None, config: bool) -> None:
        if scenario_id not in (None, self.scenario_id) or self.scenario is None:
            return
        # Write only real changes so per-cell activity never reaches the Recorder.
        if self._refresh():
            self.async_write_ha_state()

    def _refresh(self) -> bool:
        snapshot = self._compute()
        changed = snapshot != self._snapshot
        self._snapshot = snapshot
        return changed

    def _compute(self) -> Any:
        raise NotImplementedError


async def async_call(coro) -> None:
    """Translate domain errors raised by entity actions into HA errors."""
    try:
        await coro
    except HiSosedError as err:
        raise HomeAssistantError(err.code) from err


def async_setup_dynamic(
    hass: HomeAssistant,
    entry: ConfigEntry,
    async_add_entities: AddEntitiesCallback,
    factory: Callable[[ScenarioManager, Scenario], list[HiSosedEntity]],
) -> None:
    """Add entities for new scenarios/layers and remove those that disappeared."""
    manager: ScenarioManager = hass.data[DOMAIN][DATA_MANAGER]
    known: dict[str, HiSosedEntity] = {}

    @callback
    def _sync(_scenario_id: str | None = None, config: bool = True) -> None:
        if not config:
            return
        wanted: dict[str, HiSosedEntity] = {}
        for scenario_id in manager.scenario_ids():
            scenario = manager.scenario(scenario_id)
            if scenario is not None:
                for entity in factory(manager, scenario):
                    wanted[entity.unique_id] = entity
        registry = er.async_get(hass)
        for unique_id in [uid for uid in known if uid not in wanted]:
            entity = known.pop(unique_id)
            if entity.entity_id and registry.async_get(entity.entity_id):
                registry.async_remove(entity.entity_id)
            elif entity.hass:
                hass.async_create_task(entity.async_remove(), eager_start=False)
        new = [entity for uid, entity in wanted.items() if uid not in known]
        known.update({entity.unique_id: entity for entity in new})
        if new:
            async_add_entities(new)

    _sync()
    entry.async_on_unload(async_dispatcher_connect(hass, SIGNAL_UPDATE, _sync))
