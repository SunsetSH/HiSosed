"""HiSosed custom integration."""

from __future__ import annotations

from typing import Any, Awaitable

import voluptuous as vol

from homeassistant.config_entries import ConfigEntry
from homeassistant.core import HomeAssistant, ServiceCall, callback
from homeassistant.exceptions import ServiceValidationError
from homeassistant.helpers import config_validation as cv
from homeassistant.helpers import device_registry as dr
from homeassistant.helpers.dispatcher import async_dispatcher_connect
from homeassistant.helpers.start import async_at_started

from .const import (
    DATA_MANAGER,
    DOMAIN,
    MAX_RUN_NOW_MINUTES,
    MAX_SNOOZE_MINUTES,
    PLATFORMS,
    SERVICE_APPLY_PRESET,
    SERVICE_PREVIEW,
    SERVICE_REGENERATE,
    SERVICE_RESUME,
    SERVICE_RUN_NOW,
    SERVICE_SET_LAYER,
    SERVICE_SNOOZE,
    SERVICE_START,
    SERVICE_STOP,
    SIGNAL_UPDATE,
)
from .http import AudioUploadView
from .manager import ScenarioManager
from .models import HiSosedError
from .panel import async_register_panel
from .websocket_api import async_register_commands

CONFIG_SCHEMA = cv.config_entry_only_config_schema(DOMAIN)

SCENARIO_SCHEMA = vol.Schema({vol.Required("scenario_id"): cv.string})
RUN_NOW_SCHEMA = SCENARIO_SCHEMA.extend(
    {vol.Optional("minutes", default=30): vol.All(vol.Coerce(int), vol.Range(min=1, max=MAX_RUN_NOW_MINUTES))}
)
REGENERATE_SCHEMA = SCENARIO_SCHEMA.extend({vol.Optional("layer"): cv.string})
PRESET_SCHEMA = SCENARIO_SCHEMA.extend({vol.Required("preset"): cv.string})
LAYER_SCHEMA = SCENARIO_SCHEMA.extend({vol.Required("layer"): cv.string, vol.Required("enabled"): cv.boolean})
PREVIEW_SCHEMA = vol.Schema(
    {
        vol.Required("sound_id"): cv.string,
        vol.Optional("entity_id"): cv.entity_ids,
        vol.Optional("scenario_id"): cv.string,
    }
)
SNOOZE_SCHEMA = vol.Schema(
    {vol.Optional("minutes", default=30): vol.All(vol.Coerce(int), vol.Range(min=1, max=MAX_SNOOZE_MINUTES))}
)


def _manager(hass: HomeAssistant) -> ScenarioManager:
    manager = hass.data.get(DOMAIN, {}).get(DATA_MANAGER)
    if manager is None:
        raise ServiceValidationError("integration_not_ready")
    return manager


async def _run(coro: Awaitable[Any]) -> None:
    try:
        await coro
    except HiSosedError as err:
        raise ServiceValidationError(err.code) from err


async def async_setup(hass: HomeAssistant, config: dict[str, Any]) -> bool:
    """Register global actions, panel and the secured import endpoint."""
    hass.data.setdefault(DOMAIN, {})
    async_register_commands(hass)
    hass.http.register_view(AudioUploadView())
    await async_register_panel(hass)

    handlers = {
        SERVICE_START: (SCENARIO_SCHEMA, lambda m, d: m.async_start(d["scenario_id"])),
        SERVICE_STOP: (SCENARIO_SCHEMA, lambda m, d: m.async_stop(d["scenario_id"])),
        SERVICE_RUN_NOW: (RUN_NOW_SCHEMA, lambda m, d: m.async_run_now(d["scenario_id"], d["minutes"])),
        SERVICE_REGENERATE: (REGENERATE_SCHEMA, lambda m, d: m.async_regenerate(d["scenario_id"], d.get("layer"))),
        SERVICE_APPLY_PRESET: (PRESET_SCHEMA, lambda m, d: m.async_apply_preset(d["scenario_id"], d["preset"])),
        SERVICE_SET_LAYER: (
            LAYER_SCHEMA,
            lambda m, d: m.async_set_layer_enabled(d["scenario_id"], d["layer"], d["enabled"]),
        ),
        SERVICE_PREVIEW: (
            PREVIEW_SCHEMA,
            lambda m, d: m.async_preview(d["sound_id"], d.get("entity_id"), d.get("scenario_id")),
        ),
        SERVICE_SNOOZE: (SNOOZE_SCHEMA, lambda m, d: m.async_snooze(d["minutes"])),
        SERVICE_RESUME: (vol.Schema({}), lambda m, d: m.async_resume()),
    }

    def _make(func):
        async def _handle(call: ServiceCall) -> None:
            await _run(func(_manager(hass), call.data))

        return _handle

    for name, (schema, func) in handlers.items():
        hass.services.async_register(DOMAIN, name, _make(func), schema=schema)
    return True


async def async_setup_entry(hass: HomeAssistant, entry: ConfigEntry) -> bool:
    """Load persisted data, add entities and schedule when HA is running."""
    manager = ScenarioManager(hass)
    await manager.async_initialize()
    hass.data[DOMAIN][DATA_MANAGER] = manager
    await hass.config_entries.async_forward_entry_setups(entry, PLATFORMS)

    @callback
    def _sync_devices(_scenario_id: str | None = None, config: bool = True) -> None:
        """Rename devices with their scenario and drop devices of deleted scenarios."""
        if not config:
            return
        registry = dr.async_get(hass)
        for device in dr.async_entries_for_config_entry(registry, entry.entry_id):
            scenario_id = next((ident for domain, ident in device.identifiers if domain == DOMAIN), None)
            scenario = manager.scenario(scenario_id) if scenario_id else None
            if scenario is None:
                registry.async_remove_device(device.id)
            elif device.name != scenario.name:
                registry.async_update_device(device.id, name=scenario.name)

    entry.async_on_unload(async_dispatcher_connect(hass, SIGNAL_UPDATE, _sync_devices))

    async def _start(_hass: HomeAssistant) -> None:
        await manager.async_start_all()

    entry.async_on_unload(async_at_started(hass, _start))
    return True


async def async_unload_entry(hass: HomeAssistant, entry: ConfigEntry) -> bool:
    """Invalidate every callback, then unload platforms."""
    manager: ScenarioManager | None = hass.data[DOMAIN].get(DATA_MANAGER)
    if manager is not None:
        await manager.async_shutdown()
    unloaded = await hass.config_entries.async_unload_platforms(entry, PLATFORMS)
    if unloaded:
        hass.data[DOMAIN].pop(DATA_MANAGER, None)
    return unloaded
