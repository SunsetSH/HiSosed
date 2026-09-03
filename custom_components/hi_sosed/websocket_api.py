"""Admin WebSocket API consumed by the bundled panel."""

from __future__ import annotations

from typing import Any

import voluptuous as vol

from homeassistant.components import websocket_api
from homeassistant.core import HomeAssistant, callback

from .const import DATA_MANAGER, DOMAIN
from .manager import ScenarioManager


def async_register_commands(hass: HomeAssistant) -> None:
    """Register once during component setup."""
    websocket_api.async_register_command(hass, ws_list)
    websocket_api.async_register_command(hass, ws_save)
    websocket_api.async_register_command(hass, ws_delete)


def _manager(hass: HomeAssistant) -> ScenarioManager:
    return hass.data[DOMAIN][DATA_MANAGER]


@websocket_api.require_admin
@websocket_api.websocket_command({vol.Required("type"): "hi_sosed/list"})
@callback
def ws_list(hass: HomeAssistant, connection: websocket_api.ActiveConnection, msg: dict[str, Any]) -> None:
    """List scenarios and current runtime state."""
    connection.send_result(msg["id"], {"scenarios": _manager(hass).list_scenarios()})


@websocket_api.require_admin
@websocket_api.async_response
@websocket_api.websocket_command(
    {vol.Required("type"): "hi_sosed/save", vol.Required("scenario"): dict}
)
async def ws_save(hass: HomeAssistant, connection: websocket_api.ActiveConnection, msg: dict[str, Any]) -> None:
    """Validate and persist a scenario."""
    scenario = await _manager(hass).async_save_scenario(msg["scenario"])
    connection.send_result(msg["id"], {"scenario": scenario})


@websocket_api.require_admin
@websocket_api.async_response
@websocket_api.websocket_command(
    {vol.Required("type"): "hi_sosed/delete", vol.Required("scenario_id"): str}
)
async def ws_delete(hass: HomeAssistant, connection: websocket_api.ActiveConnection, msg: dict[str, Any]) -> None:
    """Delete a scenario."""
    await _manager(hass).async_delete_scenario(msg["scenario_id"])
    connection.send_result(msg["id"])
