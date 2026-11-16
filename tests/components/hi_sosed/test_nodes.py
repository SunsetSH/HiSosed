"""Audio node onboarding: driving the core MPD config flow from the panel."""

from __future__ import annotations

from typing import Any
from unittest.mock import MagicMock, patch

import pytest
from pytest_homeassistant_custom_component.common import MockConfigEntry

from homeassistant.core import HomeAssistant
from homeassistant.data_entry_flow import FlowResultType
from homeassistant.exceptions import HomeAssistantError
from homeassistant.helpers import device_registry as dr, entity_registry as er

from custom_components.hi_sosed.models import HiSosedError
from custom_components.hi_sosed.nodes import validate_host

HOST = "192.168.1.50"


def _register_player(hass: HomeAssistant, entry: MockConfigEntry) -> str:
    device = dr.async_get(hass).async_get_or_create(
        config_entry_id=entry.entry_id, identifiers={("mpd", entry.entry_id)}
    )
    item = er.async_get(hass).async_get_or_create(
        "media_player", "mpd", entry.entry_id, config_entry=entry, device_id=device.id
    )
    return item.entity_id


class FakeMpdFlow:
    """Stands in for the MPD config flow; ports in `refused` behave like a closed port."""

    def __init__(self, hass: HomeAssistant, refused: set[int] | None = None) -> None:
        self.hass = hass
        self.refused = refused or set()
        self.aborted: list[str] = []

    async def async_init(self, domain: str, *, context: dict[str, Any], data: dict[str, Any]) -> dict[str, Any]:
        assert domain == "mpd" and context == {"source": "user"}
        if data["port"] in self.refused:
            return {"type": FlowResultType.FORM, "flow_id": f"flow-{data['port']}", "errors": {"base": "cannot_connect"}}
        entry = MockConfigEntry(domain="mpd", title="Music Player Daemon", data=data)
        entry.add_to_hass(self.hass)
        _register_player(self.hass, entry)
        return {"type": FlowResultType.CREATE_ENTRY, "result": entry}

    def async_abort(self, flow_id: str) -> None:
        self.aborted.append(flow_id)


@pytest.mark.parametrize("raw", ["192.168.1.50", " 10.0.0.7 ", "audio-node.local", "fe80::1", "HiSosed-Audio"])
def test_validate_host_accepts(raw: str) -> None:
    """IP addresses and DNS names pass and are normalized."""
    assert validate_host(raw) == raw.strip().lower()


@pytest.mark.parametrize("raw", ["", "http://192.168.1.50", "a b", "host:6600", "-bad.local", "x" * 254, "../etc"])
def test_validate_host_rejects(raw: str) -> None:
    """URLs, ports, spaces and path tricks are rejected with a stable code."""
    with pytest.raises(HiSosedError, match="invalid_host"):
        validate_host(raw)


async def test_connect_adds_players_names_and_profiles(hass: HomeAssistant, setup_integration, hass_ws_client) -> None:
    """Each port becomes a named player with a speaker profile of the chosen kind."""
    manager, _, _ = await setup_integration()
    flow = FakeMpdFlow(hass)
    client = await hass_ws_client(hass)
    with patch.object(hass.config_entries.flow, "async_init", flow.async_init):
        await client.send_json_auto_id({"type": "hi_sosed/node/connect", "host": HOST, "players": 2, "kind": "bluetooth", "name": "Кухня"})
        result = (await client.receive_json())["result"]
    players = result["players"]
    assert [(p["port"], p["status"]) for p in players] == [(6600, "added"), (6601, "added")]
    assert isinstance(result["local_url"], bool)
    names = []
    for player in players:
        item = er.async_get(hass).async_get(player["entity_id"])
        names.append(dr.async_get(hass).async_get(item.device_id).name_by_user)
        profile = manager.output(player["entity_id"])
        assert (profile.kind, profile.warmup_seconds, profile.keepalive_seconds, profile.lead_ms) == ("bluetooth", 10, 60, 250)
    assert names == ["Кухня 1", "Кухня 2"]


async def test_connect_is_idempotent_and_keeps_user_choices(hass: HomeAssistant, setup_integration, hass_ws_client) -> None:
    """A second connect finds existing entries, never renames them and keeps edited profiles."""
    manager, _, _ = await setup_integration()
    entry = MockConfigEntry(domain="mpd", title="Music Player Daemon", data={"host": HOST, "port": 6600})
    entry.add_to_hass(hass)
    entity_id = _register_player(hass, entry)
    await manager.async_save_output({"entity_id": entity_id, "kind": "other", "volume": 30})
    init = MagicMock(side_effect=AssertionError("flow must not start for a known player"))
    client = await hass_ws_client(hass)
    with patch.object(hass.config_entries.flow, "async_init", init):
        await client.send_json_auto_id({"type": "hi_sosed/node/connect", "host": HOST, "players": 1})
        result = (await client.receive_json())["result"]
    assert result["players"] == [{"port": 6600, "status": "exists", "entity_id": entity_id}]
    assert manager.output(entity_id).kind == "other" and manager.output(entity_id).volume == 30
    device_id = er.async_get(hass).async_get(entity_id).device_id
    assert dr.async_get(hass).async_get(device_id).name_by_user is None


async def test_connect_reports_closed_ports_and_aborts_their_flows(hass: HomeAssistant, setup_integration, hass_ws_client) -> None:
    """A refused port is reported, its flow is not left pending, the other port still connects."""
    manager, _, _ = await setup_integration()
    flow = FakeMpdFlow(hass, refused={6601})
    client = await hass_ws_client(hass)
    with patch.object(hass.config_entries.flow, "async_init", flow.async_init), patch.object(
        hass.config_entries.flow, "async_abort", flow.async_abort
    ):
        await client.send_json_auto_id({"type": "hi_sosed/node/connect", "host": HOST, "players": 2})
        players = (await client.receive_json())["result"]["players"]
    assert [(p["status"], p["entity_id"] is None) for p in players] == [("added", False), ("cannot_connect", True)]
    assert flow.aborted == ["flow-6601"]
    assert manager.output(players[0]["entity_id"]).kind == "jack"


async def test_connect_without_mpd_integration(hass: HomeAssistant, setup_integration, hass_ws_client) -> None:
    """If the MPD integration cannot load, every player says so instead of crashing."""
    await setup_integration()
    client = await hass_ws_client(hass)
    with patch.object(hass.config_entries.flow, "async_init", side_effect=HomeAssistantError("requirements")):
        await client.send_json_auto_id({"type": "hi_sosed/node/connect", "host": HOST, "players": 1})
        players = (await client.receive_json())["result"]["players"]
    assert players == [{"port": 6600, "status": "unavailable", "entity_id": None}]


async def test_connect_rejects_bad_host_and_non_admin(
    hass: HomeAssistant, setup_integration, hass_ws_client, hass_admin_user
) -> None:
    """Invalid hosts give a stable code; non-admins cannot add integrations."""
    await setup_integration()
    client = await hass_ws_client(hass)
    await client.send_json_auto_id({"type": "hi_sosed/node/connect", "host": "http://evil"})
    assert (await client.receive_json())["error"]["code"] == "invalid_host"
    hass_admin_user.groups = []
    await client.send_json_auto_id({"type": "hi_sosed/node/connect", "host": HOST})
    assert (await client.receive_json())["error"]["code"] == "unauthorized"
