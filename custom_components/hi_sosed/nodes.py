"""Adapter that adds audio-node players to Home Assistant through the core MPD config flow.

HiSosed itself never talks to the node: the MPD integration opens the connection,
HiSosed only drives its config flow and names the resulting device (ADR-0004).
"""

from __future__ import annotations

import asyncio
import ipaddress
import re
from typing import Any

from homeassistant.config_entries import SOURCE_USER, ConfigEntry
from homeassistant.const import CONF_HOST, CONF_PORT
from homeassistant.core import HomeAssistant
from homeassistant.data_entry_flow import FlowResultType
from homeassistant.exceptions import HomeAssistantError
from homeassistant.helpers import device_registry as dr, entity_registry as er
from homeassistant.helpers.network import NoURLAvailableError, get_url

from .const import MPD_DOMAIN, NODE_BASE_PORT, NODE_ENTITY_WAIT_SECONDS
from .models import HiSosedError

_HOSTNAME_RE = re.compile(r"^(?!-)[a-z0-9-]{1,63}(?<!-)(\.(?!-)[a-z0-9-]{1,63}(?<!-))*$")


def validate_host(raw: str) -> str:
    """Return a normalized IP address or DNS name, rejecting URLs and garbage."""
    host = raw.strip().lower()
    try:
        return str(ipaddress.ip_address(host))
    except ValueError:
        pass
    if len(host) > 253 or not _HOSTNAME_RE.match(host):
        raise HiSosedError("invalid_host")
    return host


def has_local_url(hass: HomeAssistant) -> bool:
    """Return True when HA can build a LAN URL the node can download sounds from."""
    try:
        get_url(hass, allow_external=False, allow_cloud=False)
    except NoURLAvailableError:
        return False
    return True


async def async_connect_node(hass: HomeAssistant, host: str, players: int, name: str) -> list[dict[str, Any]]:
    """Add every player of one node; ports are probed concurrently by the MPD flow."""
    return list(
        await asyncio.gather(
            *(
                _async_connect_player(hass, host, NODE_BASE_PORT + index, name if players == 1 else f"{name} {index + 1}")
                for index in range(players)
            )
        )
    )


async def _async_connect_player(hass: HomeAssistant, host: str, port: int, name: str) -> dict[str, Any]:
    entry = _find_entry(hass, host, port)
    status = "exists"
    if entry is None:
        try:
            result = await hass.config_entries.flow.async_init(
                MPD_DOMAIN, context={"source": SOURCE_USER}, data={CONF_HOST: host, CONF_PORT: port}
            )
        except HomeAssistantError:
            # The MPD integration could not be loaded (e.g. its requirement failed to install).
            return {"port": port, "status": "unavailable", "entity_id": None}
        if result["type"] is FlowResultType.CREATE_ENTRY:
            entry = result["result"]
            status = "added"
        elif result["type"] is FlowResultType.ABORT:
            entry = _find_entry(hass, host, port)
        else:
            # A form back means the flow rejected the address; do not leave it pending.
            hass.config_entries.flow.async_abort(result["flow_id"])
        if entry is None:
            return {"port": port, "status": "cannot_connect", "entity_id": None}
    entity_id = await _async_entity_id(hass, entry)
    if status == "added" and entity_id:
        _name_device(hass, entity_id, name)
    return {"port": port, "status": status, "entity_id": entity_id}


def _find_entry(hass: HomeAssistant, host: str, port: int) -> ConfigEntry | None:
    for entry in hass.config_entries.async_entries(MPD_DOMAIN):
        if entry.data.get(CONF_HOST) == host and entry.data.get(CONF_PORT) == port:
            return entry
    return None


async def _async_entity_id(hass: HomeAssistant, entry: ConfigEntry) -> str | None:
    registry = er.async_get(hass)
    loop = asyncio.get_running_loop()
    deadline = loop.time() + NODE_ENTITY_WAIT_SECONDS
    while True:
        for item in er.async_entries_for_config_entry(registry, entry.entry_id):
            if item.domain == "media_player":
                return item.entity_id
        if loop.time() >= deadline:
            return None
        await asyncio.sleep(0.5)


def _name_device(hass: HomeAssistant, entity_id: str, name: str) -> None:
    """Give a fresh MPD device a readable name; every MPD device is otherwise 'Music Player Daemon'."""
    item = er.async_get(hass).async_get(entity_id)
    if item is None or item.device_id is None:
        return
    devices = dr.async_get(hass)
    device = devices.async_get(item.device_id)
    if device is not None and device.name_by_user is None:
        devices.async_update_device(device.id, name_by_user=name)
