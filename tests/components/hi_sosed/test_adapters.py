"""WebSocket, HTTP upload, services, entities and storage migration."""

from __future__ import annotations

from pathlib import Path
from typing import Any
from unittest.mock import patch

import aiohttp
import pytest

from homeassistant.core import HomeAssistant
from homeassistant.exceptions import ServiceValidationError
from homeassistant.helpers import entity_registry as er
from homeassistant.helpers.network import NoURLAvailableError

from custom_components.hi_sosed.audio import beep_wav
from custom_components.hi_sosed.const import DOMAIN, STORAGE_KEY
from custom_components.hi_sosed.manager import ScenarioManager

from .conftest import HALL, KITCHEN, add_sound, scenario_payload


async def test_ws_state_save_and_errors(hass: HomeAssistant, setup_integration, hass_ws_client) -> None:
    """The panel API saves, lists and reports stable error codes."""
    manager, _, _ = await setup_integration()
    sound_id = await add_sound(manager)
    client = await hass_ws_client(hass)
    await client.send_json_auto_id({"type": "hi_sosed/scenario/save", "scenario": scenario_payload([sound_id])})
    saved = (await client.receive_json())["result"]["scenario"]
    await client.send_json_auto_id({"type": "hi_sosed/state"})
    state = (await client.receive_json())["result"]
    assert [item["id"] for item in state["scenarios"]] == [saved["id"]]
    assert state["sounds"][0]["usage"] == 1
    await client.send_json_auto_id({"type": "hi_sosed/scenario/save", "scenario": dict(saved, revision=0)})
    response = await client.receive_json()
    assert response["error"]["code"] == "revision_conflict"
    await client.send_json_auto_id({"type": "hi_sosed/sound/delete", "sound_id": sound_id})
    assert (await client.receive_json())["error"]["code"] == "sound_in_use"
    await client.send_json_auto_id({"type": "hi_sosed/sound/delete", "sound_id": sound_id, "force": True})
    assert (await client.receive_json())["success"]
    assert manager.scenario(saved["id"]).layers[0].sounds == ()


async def test_ws_requires_admin(hass: HomeAssistant, setup_integration, hass_ws_client, hass_admin_user) -> None:
    """Non-admin users cannot read or change anything through the panel API."""
    await setup_integration()
    hass_admin_user.groups = []
    client = await hass_ws_client(hass)
    await client.send_json_auto_id({"type": "hi_sosed/state"})
    assert (await client.receive_json())["error"]["code"] == "unauthorized"


async def test_ws_subscribe_pushes_updates(hass: HomeAssistant, setup_integration, hass_ws_client) -> None:
    """Config changes are pushed to subscribers."""
    manager, _, _ = await setup_integration()
    client = await hass_ws_client(hass)
    await client.send_json_auto_id({"type": "hi_sosed/subscribe"})
    assert (await client.receive_json())["success"]
    await manager.async_snooze(10)
    event = await client.receive_json()
    assert event["event"] == {"scenario_id": None, "config": True}


def _form(data: bytes, filename: str, category: str | None = "Удары") -> aiohttp.FormData:
    form = aiohttp.FormData()
    if category is not None:
        form.add_field("category", category)
    form.add_field("file", data, filename=filename, content_type="application/octet-stream")
    return form


async def test_upload_registers_sound_and_stores_file(
    hass: HomeAssistant, setup_integration, hass_client, tmp_path: Path
) -> None:
    """A browser upload lands in <media>/hi_sosed and appears in the library."""
    manager, _, _ = await setup_integration()
    client = await hass_client()
    response = await client.post("/api/hi_sosed/upload", data=_form(beep_wav(), "Мой стук.wav"))
    assert response.status == 200, await response.text()
    sound = await response.json()
    assert sound["name"] == "Мой стук"
    assert sound["category"] == "Удары"
    stored = tmp_path / "hi_sosed" / sound["media_content_id"].rsplit("/", 1)[-1]
    assert stored.read_bytes() == beep_wav()
    assert manager.get_state()["sounds"][0]["id"] == sound["id"]
    assert not list((tmp_path / "hi_sosed").glob(".*.part"))


@pytest.mark.parametrize(
    ("payload", "filename", "status", "code"),
    [
        (b"<html>", "fake.mp3", 415, "unsupported_audio_format"),
        (b"RIFF", "x.exe", 415, "unsupported_audio_format"),
    ],
)
async def test_upload_rejects_bad_files(
    hass: HomeAssistant, setup_integration, hass_client, tmp_path: Path, payload: bytes, filename: str, status: int, code: str
) -> None:
    """Wrong extensions and content that does not match the extension are rejected."""
    await setup_integration()
    client = await hass_client()
    response = await client.post("/api/hi_sosed/upload", data=_form(payload, filename))
    assert response.status == status
    assert (await response.json())["code"] == code
    assert not [p for p in (tmp_path / "hi_sosed").glob("*") if p.is_file()]


async def test_upload_requires_admin(hass: HomeAssistant, setup_integration, hass_client, hass_admin_user) -> None:
    """Non-admins cannot upload."""
    await setup_integration()
    hass_admin_user.groups = []
    client = await hass_client()
    response = await client.post("/api/hi_sosed/upload", data=_form(beep_wav(), "a.wav"))
    assert response.status == 401


async def test_scan_registers_samba_copied_files(hass: HomeAssistant, setup_integration, tmp_path: Path) -> None:
    """Files copied into category folders are found once."""
    manager, _, _ = await setup_integration()
    folder = tmp_path / "hi_sosed" / "Дрель"
    folder.mkdir(parents=True)
    (folder / "d1.wav").write_bytes(beep_wav())
    assert await manager.async_scan_library() == 1
    assert await manager.async_scan_library() == 0
    sound = manager.get_state()["sounds"][0]
    assert sound["category"] == "Дрель"


async def test_starter_pack_is_idempotent(hass: HomeAssistant, setup_integration) -> None:
    """The generated starter pack adds four clips once."""
    manager, _, _ = await setup_integration()
    assert await manager.async_add_starter_pack() == 4
    assert await manager.async_add_starter_pack() == 0


async def test_entities_toggle_layers_and_apply_presets(hass: HomeAssistant, setup_integration) -> None:
    """Dashboard entities control layers and presets without the panel."""
    manager, _, _ = await setup_integration()
    sound_id = await add_sound(manager)
    payload = scenario_payload([sound_id])
    payload["layers"].append({**payload["layers"][0], "name": "Вторая"})
    saved = await manager.async_save_scenario(payload)
    await hass.async_block_till_done()
    registry = er.async_get(hass)
    layer_entity = registry.async_get_entity_id("switch", DOMAIN, f"{saved['id']}_layer_{saved['layers'][1]['id']}")
    select_entity = registry.async_get_entity_id("select", DOMAIN, f"{saved['id']}_preset")
    sensor_entity = registry.async_get_entity_id("sensor", DOMAIN, f"{saved['id']}_status")
    assert hass.states.get(sensor_entity).state == "running"

    await manager.async_capture_preset(saved["id"], "Обе")
    await hass.services.async_call("switch", "turn_off", {"entity_id": layer_entity}, blocking=True)
    await hass.async_block_till_done()
    assert manager.scenario(saved["id"]).layers[1].enabled is False
    assert hass.states.get(layer_entity).state == "off"
    await manager.async_capture_preset(saved["id"], "Одна")
    await hass.async_block_till_done()
    assert hass.states.get(select_entity).attributes["options"] == ["—", "Обе", "Одна"]

    await hass.services.async_call("select", "select_option", {"entity_id": select_entity, "option": "Обе"}, blocking=True)
    await hass.async_block_till_done()
    assert manager.scenario(saved["id"]).layers[1].enabled is True
    assert hass.states.get(select_entity).state == "Обе"

    saved = manager.serialize_scenario(manager.scenario(saved["id"]))
    saved["layers"] = saved["layers"][:1]
    await manager.async_save_scenario(saved)
    await hass.async_block_till_done()
    assert registry.async_get(layer_entity) is None


async def test_services_resolve_names_and_report_codes(hass: HomeAssistant, setup_integration) -> None:
    """Automations may use scenario/layer names; errors are stable codes."""
    manager, _, _ = await setup_integration()
    sound_id = await add_sound(manager)
    saved = await manager.async_save_scenario(scenario_payload([sound_id]))
    await hass.services.async_call(DOMAIN, "set_layer", {"scenario_id": "Тест", "layer": "Основная", "enabled": False}, blocking=True)
    assert manager.scenario(saved["id"]).layers[0].enabled is False
    with pytest.raises(ServiceValidationError) as err:
        await hass.services.async_call(DOMAIN, "apply_preset", {"scenario_id": "Тест", "preset": "нет"}, blocking=True)
    assert str(err.value) == "preset_not_found"
    await hass.services.async_call(DOMAIN, "stop", {"scenario_id": saved["id"]}, blocking=True)
    assert manager.runtime_view(saved["id"])["state"] == "disabled"


async def test_deleting_scenario_removes_device(hass: HomeAssistant, setup_integration) -> None:
    """Deleting a scenario cancels runtimes and removes its entities."""
    manager, _, _ = await setup_integration()
    sound_id = await add_sound(manager)
    saved = await manager.async_save_scenario(scenario_payload([sound_id]))
    await hass.async_block_till_done()
    await manager.async_delete_scenario(saved["id"])
    await hass.async_block_till_done()
    assert not [key for key in manager._runtimes if key[0] == saved["id"]]
    registry = er.async_get(hass)
    assert registry.async_get_entity_id("sensor", DOMAIN, f"{saved['id']}_status") is None


async def test_v1_storage_is_migrated(hass: HomeAssistant, setup_integration, hass_storage: dict[str, Any]) -> None:
    """A v0.1 store loads as one layer plus a library."""
    hass_storage[STORAGE_KEY] = {
        "version": 1,
        "minor_version": 1,
        "key": STORAGE_KEY,
        "data": {
            "scenarios": {
                "33333333-3333-3333-3333-333333333333": {
                    "id": "33333333-3333-3333-3333-333333333333",
                    "revision": 2,
                    "name": "Старый",
                    "enabled": False,
                    "target_entity_ids": [KITCHEN],
                    "schedule": {"weekdays": [0], "start": "10:00:00", "end": "11:00:00"},
                    "grid": {"slot_seconds": 2, "slot_count": 10, "density_percent": 30},
                    "audio": [
                        {
                            "id": "11111111-1111-1111-1111-111111111111",
                            "name": "a.mp3",
                            "media_content_id": "media-source://media_source/local/hi_sosed/a.mp3",
                        }
                    ],
                }
            }
        },
    }
    manager, _, _ = await setup_integration()
    scenario = manager.scenario("33333333-3333-3333-3333-333333333333")
    assert scenario is not None and scenario.name == "Старый"
    assert len(manager.get_state()["sounds"]) == 1


async def test_deleting_last_items_is_persisted(hass: HomeAssistant, setup_integration) -> None:
    """Removing the last scenario, sound and output must reach the Store, not only memory."""
    manager, _, _ = await setup_integration()
    sound_id = await add_sound(manager)
    saved = await manager.async_save_scenario(scenario_payload([sound_id]))
    await manager.async_save_output({"entity_id": KITCHEN, "kind": "jack"})
    await manager.async_delete_scenario(saved["id"])
    await manager.async_delete_sound(sound_id)
    await manager.async_delete_output(KITCHEN)
    await hass.async_block_till_done()
    reloaded = ScenarioManager(hass)
    await reloaded.async_initialize()
    state = reloaded.get_state()
    assert (state["scenarios"], state["sounds"], state["outputs"]) == ([], [], [])


def _register_mpd(hass: HomeAssistant, entity_id: str) -> None:
    """Turn a fake player into an MPD entity without changing its id."""
    state = hass.states.get(entity_id)
    hass.states.async_remove(entity_id)
    entry = er.async_get(hass).async_get_or_create(
        "media_player", "mpd", entity_id, suggested_object_id=entity_id.split(".", 1)[1]
    )
    assert entry.entity_id == entity_id
    hass.states.async_set(entity_id, state.state, state.attributes)


async def test_mpd_players_get_capability_url(
    hass: HomeAssistant, setup_integration, hass_client_no_auth
) -> None:
    """MPD probes cover.* next to the media without the signature; its URL must 404 quietly."""
    base = "http://192.168.0.10:8123"
    hass.config.internal_url = base
    manager, players, _ = await setup_integration()
    _register_mpd(hass, KITCHEN)
    await manager.async_test_output(KITCHEN)
    await manager.async_test_output(HALL)

    url = players.plays(KITCHEN, include_system=True)[-1]
    assert url.startswith(f"{base}/api/hi_sosed/play/")
    assert url.endswith("/system/beep.wav")
    assert players.plays(HALL, include_system=True)[-1].startswith("media-source://")

    client = await hass_client_no_auth()
    path = url.removeprefix(base)
    response = await client.get(path)
    assert response.status == 200
    assert await response.read() == beep_wav()

    token = path.split("/")[4]
    for bad in (
        path.replace(token, "x" * len(token)),
        path.replace("beep.wav", "cover.png"),
        f"/api/hi_sosed/play/{token}/system/.beep.wav.part",
        f"/api/hi_sosed/play/{token}/%2E%2E/hi_sosed.json",
    ):
        assert (await client.get(bad)).status == 404, bad


async def test_mpd_falls_back_to_media_source_without_local_url(hass: HomeAssistant, setup_integration) -> None:
    """Without a LAN URL HA cannot build the capability URL; the signed media-source path still works."""
    manager, players, _ = await setup_integration()
    _register_mpd(hass, KITCHEN)
    with patch("custom_components.hi_sosed.http.get_url", side_effect=NoURLAvailableError):
        await manager.async_test_output(KITCHEN)
    assert players.plays(KITCHEN, include_system=True)[-1].startswith("media-source://")
