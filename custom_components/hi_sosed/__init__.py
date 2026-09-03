"""HiSosed custom integration."""

from __future__ import annotations

from typing import Any

import voluptuous as vol

from homeassistant.config_entries import ConfigEntry
from homeassistant.core import HomeAssistant
from homeassistant.exceptions import ServiceValidationError

from .const import (
    DATA_MANAGER,
    DOMAIN,
    SERVICE_PREVIEW,
    SERVICE_REGENERATE,
    SERVICE_START,
    SERVICE_STOP,
)
from .http import AudioUploadView
from .manager import ScenarioManager
from .panel import async_register_panel
from .websocket_api import async_register_commands

SERVICE_SCHEMA = vol.Schema({vol.Required("scenario_id"): str})
PREVIEW_SCHEMA = SERVICE_SCHEMA.extend({vol.Optional("media_content_id"): str})


def _manager(hass: HomeAssistant) -> ScenarioManager:
    manager = hass.data.get(DOMAIN, {}).get(DATA_MANAGER)
    if manager is None:
        raise ServiceValidationError("integration_not_ready")
    return manager


async def async_setup(hass: HomeAssistant, config: dict[str, Any]) -> bool:
    """Register global actions, panel and secured import endpoint."""
    hass.data.setdefault(DOMAIN, {})
    async_register_commands(hass)
    hass.http.register_view(AudioUploadView())
    await async_register_panel(hass)

    async def async_start(call) -> None:
        await _manager(hass).async_start(call.data["scenario_id"])

    async def async_stop(call) -> None:
        await _manager(hass).async_stop(call.data["scenario_id"])

    async def async_regenerate(call) -> None:
        await _manager(hass).async_regenerate(call.data["scenario_id"])

    async def async_preview(call) -> None:
        await _manager(hass).async_preview(call.data["scenario_id"], call.data.get("media_content_id"))

    hass.services.async_register(DOMAIN, SERVICE_START, async_start, schema=SERVICE_SCHEMA)
    hass.services.async_register(DOMAIN, SERVICE_STOP, async_stop, schema=SERVICE_SCHEMA)
    hass.services.async_register(DOMAIN, SERVICE_REGENERATE, async_regenerate, schema=SERVICE_SCHEMA)
    hass.services.async_register(DOMAIN, SERVICE_PREVIEW, async_preview, schema=PREVIEW_SCHEMA)
    return True


async def async_setup_entry(hass: HomeAssistant, entry: ConfigEntry) -> bool:
    """Load persisted scenarios and schedule them when HA is running."""
    manager = ScenarioManager(hass)
    await manager.async_initialize()
    hass.data[DOMAIN][DATA_MANAGER] = manager
    if hass.is_running:
        await manager.async_start_enabled()
    else:
        entry.async_on_unload(hass.bus.async_listen_once("homeassistant_started", lambda _: hass.async_create_task(manager.async_start_enabled())))
    return True


async def async_unload_entry(hass: HomeAssistant, entry: ConfigEntry) -> bool:
    """Cancel all scheduled work and remove the singleton runtime."""
    manager = hass.data[DOMAIN].pop(DATA_MANAGER, None)
    if manager is not None:
        await manager.async_shutdown()
    return True
