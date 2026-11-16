"""Admin WebSocket API consumed by the bundled panel."""

from __future__ import annotations

from functools import wraps
from typing import Any, Awaitable, Callable

import voluptuous as vol

from homeassistant.components import websocket_api
from homeassistant.core import HomeAssistant, callback
from homeassistant.helpers.dispatcher import async_dispatcher_connect

from . import nodes
from .const import (
    DATA_MANAGER,
    DOMAIN,
    MAX_RUN_NOW_MINUTES,
    MAX_SNOOZE_MINUTES,
    NODE_KINDS,
    NODE_MAX_PLAYERS,
    SIGNAL_UPDATE,
)
from .manager import ScenarioManager
from .models import HiSosedError

Handler = Callable[[HomeAssistant, websocket_api.ActiveConnection, dict[str, Any], ScenarioManager], Awaitable[Any]]


def _manager(hass: HomeAssistant) -> ScenarioManager | None:
    return hass.data.get(DOMAIN, {}).get(DATA_MANAGER)


def _command(schema: dict[Any, Any]) -> Callable[[Handler], Any]:
    """Wrap an admin command: resolve the manager and map domain errors to stable codes."""

    def decorator(func: Handler) -> Any:
        @websocket_api.require_admin
        @websocket_api.websocket_command(schema)
        @websocket_api.async_response
        @wraps(func)
        async def handler(hass: HomeAssistant, connection: websocket_api.ActiveConnection, msg: dict[str, Any]) -> None:
            manager = _manager(hass)
            if manager is None:
                connection.send_error(msg["id"], "integration_not_ready", "integration_not_ready")
                return
            try:
                result = await func(hass, connection, msg, manager)
            except HiSosedError as err:
                connection.send_error(msg["id"], err.code, err.code)
                return
            connection.send_result(msg["id"], result)

        return handler

    return decorator


@_command({vol.Required("type"): "hi_sosed/state"})
async def ws_state(hass, connection, msg, manager):
    """Return scenarios with runtime, the sound library, outputs and settings."""
    return manager.get_state()


@websocket_api.require_admin
@websocket_api.websocket_command({vol.Required("type"): "hi_sosed/subscribe"})
@callback
def ws_subscribe(hass: HomeAssistant, connection: websocket_api.ActiveConnection, msg: dict[str, Any]) -> None:
    """Push live updates; runtime-only changes carry the scenario runtime inline."""

    @callback
    def _forward(scenario_id: str | None, config: bool) -> None:
        payload: dict[str, Any] = {"scenario_id": scenario_id, "config": config}
        manager = _manager(hass)
        if scenario_id and not config and manager is not None and manager.scenario(scenario_id):
            payload["runtime"] = manager.runtime_view(scenario_id)
        connection.send_message(websocket_api.event_message(msg["id"], payload))

    connection.subscriptions[msg["id"]] = async_dispatcher_connect(hass, SIGNAL_UPDATE, _forward)
    connection.send_result(msg["id"])


@_command({vol.Required("type"): "hi_sosed/scenario/save", vol.Required("scenario"): dict})
async def ws_scenario_save(hass, connection, msg, manager):
    """Validate and persist a scenario."""
    return {"scenario": await manager.async_save_scenario(msg["scenario"])}


@_command({vol.Required("type"): "hi_sosed/scenario/delete", vol.Required("scenario_id"): str})
async def ws_scenario_delete(hass, connection, msg, manager):
    """Delete a scenario."""
    await manager.async_delete_scenario(msg["scenario_id"])


_ACTIONS = vol.In(
    [
        "start",
        "stop",
        "run_now",
        "cancel_run",
        "regenerate",
        "apply_preset",
        "capture_preset",
        "set_layer",
        "set_sound",
    ]
)


@_command(
    {
        vol.Required("type"): "hi_sosed/scenario/action",
        vol.Required("scenario_id"): str,
        vol.Required("action"): _ACTIONS,
        vol.Optional("minutes"): vol.All(int, vol.Range(min=1, max=MAX_RUN_NOW_MINUTES)),
        vol.Optional("layer_id"): str,
        vol.Optional("sound_id"): str,
        vol.Optional("preset_id"): str,
        vol.Optional("name"): str,
        vol.Optional("enabled"): bool,
    }
)
async def ws_scenario_action(hass, connection, msg, manager):
    """Run one scenario action with the same semantics as the public services."""
    scenario_id = msg["scenario_id"]
    action = msg["action"]
    if action == "start":
        await manager.async_start(scenario_id)
    elif action == "stop":
        await manager.async_stop(scenario_id)
    elif action == "run_now":
        await manager.async_run_now(scenario_id, msg.get("minutes", 30))
    elif action == "cancel_run":
        await manager.async_cancel_run_now(scenario_id)
    elif action == "regenerate":
        await manager.async_regenerate(scenario_id, msg.get("layer_id"))
    elif action == "apply_preset":
        await manager.async_apply_preset(scenario_id, _required(msg, "preset_id"))
    elif action == "capture_preset":
        return {"preset_id": await manager.async_capture_preset(scenario_id, _required(msg, "name"), msg.get("preset_id"))}
    elif action == "set_layer":
        await manager.async_set_layer_enabled(scenario_id, _required(msg, "layer_id"), bool(msg.get("enabled", True)))
    elif action == "set_sound":
        await manager.async_set_sound_enabled(
            scenario_id, _required(msg, "layer_id"), _required(msg, "sound_id"), bool(msg.get("enabled", True))
        )
    return None


def _required(msg: dict[str, Any], key: str) -> str:
    if not msg.get(key):
        raise HiSosedError(f"missing_{key}")
    return msg[key]


@_command(
    {
        vol.Required("type"): "hi_sosed/snooze",
        vol.Required("minutes"): vol.All(int, vol.Range(min=0, max=MAX_SNOOZE_MINUTES)),
    }
)
async def ws_snooze(hass, connection, msg, manager):
    """Silence everything for N minutes; 0 resumes."""
    if msg["minutes"] == 0:
        await manager.async_resume()
    else:
        await manager.async_snooze(msg["minutes"])


@_command(
    {
        vol.Required("type"): "hi_sosed/sound/update",
        vol.Required("sound_id"): str,
        vol.Optional("name"): str,
        vol.Optional("category"): str,
    }
)
async def ws_sound_update(hass, connection, msg, manager):
    """Rename a sound or change its category."""
    return {"sound": await manager.async_update_sound(msg["sound_id"], msg.get("name"), msg.get("category"))}


@_command(
    {
        vol.Required("type"): "hi_sosed/sound/delete",
        vol.Required("sound_id"): str,
        vol.Optional("force", default=False): bool,
    }
)
async def ws_sound_delete(hass, connection, msg, manager):
    """Delete a sound (and its managed file)."""
    await manager.async_delete_sound(msg["sound_id"], force=msg["force"])


@_command(
    {
        vol.Required("type"): "hi_sosed/sound/add_uri",
        vol.Required("media_content_id"): str,
        vol.Optional("name"): str,
        vol.Optional("category"): str,
    }
)
async def ws_sound_add_uri(hass, connection, msg, manager):
    """Reference an existing media-source item."""
    raw = {key: msg[key] for key in ("media_content_id", "name", "category") if key in msg}
    return {"sound": await manager.async_add_uri_sound(raw)}


@_command({vol.Required("type"): "hi_sosed/sound/scan"})
async def ws_sound_scan(hass, connection, msg, manager):
    """Register files copied into the HiSosed media folder."""
    return {"added": await manager.async_scan_library()}


@_command({vol.Required("type"): "hi_sosed/sound/starter"})
async def ws_sound_starter(hass, connection, msg, manager):
    """Add the generated starter clips."""
    return {"added": await manager.async_add_starter_pack()}


@_command(
    {
        vol.Required("type"): "hi_sosed/sound/preview",
        vol.Required("sound_id"): str,
        vol.Optional("entity_ids"): [str],
        vol.Optional("scenario_id"): str,
    }
)
async def ws_sound_preview(hass, connection, msg, manager):
    """Play one sound once on a speaker."""
    await manager.async_preview(msg["sound_id"], msg.get("entity_ids"), msg.get("scenario_id"))


@_command({vol.Required("type"): "hi_sosed/output/save", vol.Required("output"): dict})
async def ws_output_save(hass, connection, msg, manager):
    """Save a speaker profile."""
    return {"output": await manager.async_save_output(msg["output"])}


@_command({vol.Required("type"): "hi_sosed/output/delete", vol.Required("entity_id"): str})
async def ws_output_delete(hass, connection, msg, manager):
    """Forget a speaker profile."""
    await manager.async_delete_output(msg["entity_id"])


@_command({vol.Required("type"): "hi_sosed/output/test", vol.Required("entity_id"): str})
async def ws_output_test(hass, connection, msg, manager):
    """Play the test beep."""
    await manager.async_test_output(msg["entity_id"])


@_command(
    {
        vol.Required("type"): "hi_sosed/node/connect",
        vol.Required("host"): vol.All(str, vol.Length(min=1, max=253)),
        vol.Optional("players", default=2): vol.All(int, vol.Range(min=1, max=NODE_MAX_PLAYERS)),
        vol.Optional("kind", default="jack"): vol.In(list(NODE_KINDS)),
        vol.Optional("name", default="HiSosed"): vol.All(str, vol.Length(max=40)),
    }
)
async def ws_node_connect(hass, connection, msg, manager):
    """Add the MPD players of an audio node and give new ones a speaker profile."""
    host = nodes.validate_host(msg["host"])
    players = await nodes.async_connect_node(hass, host, msg["players"], msg["name"].strip() or "HiSosed")
    for player in players:
        entity_id = player["entity_id"]
        if entity_id and manager.output(entity_id) is None:
            await manager.async_save_output({"entity_id": entity_id, "kind": msg["kind"], **NODE_KINDS[msg["kind"]]})
    return {"players": players, "local_url": nodes.has_local_url(hass)}


def async_register_commands(hass: HomeAssistant) -> None:
    """Register once during component setup."""
    for command in (
        ws_state,
        ws_subscribe,
        ws_scenario_save,
        ws_scenario_delete,
        ws_scenario_action,
        ws_snooze,
        ws_sound_update,
        ws_sound_delete,
        ws_sound_add_uri,
        ws_sound_scan,
        ws_sound_starter,
        ws_sound_preview,
        ws_output_save,
        ws_output_delete,
        ws_output_test,
        ws_node_connect,
    ):
        websocket_api.async_register_command(hass, command)
