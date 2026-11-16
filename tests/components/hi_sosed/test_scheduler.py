"""Scheduler, race and recovery tests against a real Home Assistant core."""

from __future__ import annotations

from datetime import timedelta

from pytest_homeassistant_custom_component.common import async_fire_time_changed

from homeassistant.core import HomeAssistant
from homeassistant.util import dt as dt_util

from custom_components.hi_sosed.manager import ScenarioManager

from .conftest import HALL, KITCHEN, add_sound, scenario_payload


async def _advance(hass: HomeAssistant, freezer, seconds: float) -> None:
    """Move time in small steps so every point-in-time callback fires."""
    step = 0.5
    moved = 0.0
    while moved < seconds:
        freezer.tick(timedelta(seconds=step))
        moved += step
        async_fire_time_changed(hass)
        await hass.async_block_till_done()


async def test_cells_play_on_absolute_boundaries(hass: HomeAssistant, setup_integration, freezer) -> None:
    """Inside the window, the next future cell plays; nothing plays for the current instant."""
    manager, players, _ = await setup_integration()
    sound_id = await add_sound(manager)
    await manager.async_save_scenario(scenario_payload([sound_id]))
    await hass.async_block_till_done()
    assert players.plays() == []
    await _advance(hass, freezer, 6)
    assert len(players.plays(KITCHEN)) == 3


async def test_stop_prevents_late_play_and_stale_callback(hass: HomeAssistant, setup_integration, freezer) -> None:
    """After stop, neither timers nor an already-dispatched callback can play."""
    manager, players, _ = await setup_integration()
    sound_id = await add_sound(manager)
    saved = await manager.async_save_scenario(scenario_payload([sound_id]))
    key = (saved["id"], saved["layers"][0]["id"])
    old_generation = manager._runtimes[key].generation
    await manager.async_stop(saved["id"])
    await manager._async_fire_slot(key, old_generation, 1, dt_util.now())
    await _advance(hass, freezer, 6)
    assert players.plays() == []
    assert manager.scenario(saved["id"]).enabled is False


async def test_outside_window_waits_then_starts_at_boundary(hass: HomeAssistant, setup_integration, freezer) -> None:
    """Before the window nothing plays; at the boundary cell 0 plays."""
    manager, players, _ = await setup_integration()
    freezer.move_to("2026-11-16 09:59:55+01:00")
    sound_id = await add_sound(manager)
    saved = await manager.async_save_scenario(scenario_payload([sound_id]))
    assert manager.runtime_view(saved["id"])["state"] == "waiting"
    await _advance(hass, freezer, 4)
    assert players.plays() == []
    await _advance(hass, freezer, 1.5)
    assert len(players.plays()) == 1


async def test_window_end_cancels_remaining_cells(hass: HomeAssistant, setup_integration, freezer) -> None:
    """No play_media after the end of the window, even mid-cycle."""
    manager, players, _ = await setup_integration()
    freezer.move_to("2026-11-16 10:59:55+01:00")
    sound_id = await add_sound(manager)
    await manager.async_save_scenario(scenario_payload([sound_id]))
    await _advance(hass, freezer, 15)
    assert len(players.plays()) == 2  # 10:59:56 and 10:59:58 only


async def test_restart_inside_window_restores_pattern_without_catch_up(
    hass: HomeAssistant, setup_integration, freezer
) -> None:
    """A new manager reuses the checkpointed pattern and does not replay missed cells."""
    manager, players, _ = await setup_integration()
    sound_id = await add_sound(manager)
    payload = scenario_payload([sound_id])
    payload["layers"][0]["grid"]["density_percent"] = 50
    saved = await manager.async_save_scenario(payload)
    key = (saved["id"], saved["layers"][0]["id"])
    pattern = manager._runtimes[key].pattern
    await manager.async_shutdown()
    freezer.tick(timedelta(seconds=7))
    restarted = ScenarioManager(hass)
    await restarted.async_initialize()
    await restarted.async_start_all()
    await hass.async_block_till_done()
    assert restarted._runtimes[key].pattern == pattern
    assert restarted._runtimes[key].next_slot == 4
    assert players.plays() == []
    await restarted.async_shutdown()


async def test_player_error_is_isolated_per_target(hass: HomeAssistant, setup_integration, freezer) -> None:
    """A failing player is counted, the other player still plays."""
    manager, players, _ = await setup_integration()
    players.failing.add(HALL)
    sound_id = await add_sound(manager)
    saved = await manager.async_save_scenario(scenario_payload([sound_id], target_entity_ids=[KITCHEN, HALL]))
    await _advance(hass, freezer, 2)
    assert len(players.plays(KITCHEN)) == 1
    layer = manager.runtime_view(saved["id"])["layers"][saved["layers"][0]["id"]]
    assert layer["played_count"] == 1
    players.failing.add(KITCHEN)
    await _advance(hass, freezer, 2)
    layer = manager.runtime_view(saved["id"])["layers"][saved["layers"][0]["id"]]
    assert layer["error_count"] == 1
    assert layer["last_error"] == "player_error"
    assert manager.runtime_view(saved["id"])["state"] == "error"


async def test_unavailable_target_is_skipped_without_call(hass: HomeAssistant, setup_integration, freezer) -> None:
    """An unavailable player is not called at all."""
    manager, players, _ = await setup_integration()
    hass.states.async_set(KITCHEN, "unavailable")
    sound_id = await add_sound(manager)
    saved = await manager.async_save_scenario(scenario_payload([sound_id]))
    await _advance(hass, freezer, 2)
    assert players.plays() == []
    assert manager.runtime_view(saved["id"])["layers"][saved["layers"][0]["id"]]["last_error"] == "target_unavailable"


async def test_snooze_silences_and_resume_restores(hass: HomeAssistant, setup_integration, freezer) -> None:
    """Snoozed cells are skipped, not replayed later."""
    manager, players, _ = await setup_integration()
    sound_id = await add_sound(manager)
    await manager.async_save_scenario(scenario_payload([sound_id]))
    await manager.async_snooze(5)
    await _advance(hass, freezer, 6)
    assert players.plays() == []
    await manager.async_resume()
    await _advance(hass, freezer, 2)
    assert len(players.plays()) == 1


async def test_run_now_plays_outside_schedule_until_deadline(hass: HomeAssistant, setup_integration, freezer) -> None:
    """Manual run starts immediately and ends exactly at its deadline."""
    manager, players, _ = await setup_integration()
    freezer.move_to("2026-11-16 20:00:00+01:00")
    sound_id = await add_sound(manager)
    saved = await manager.async_save_scenario(scenario_payload([sound_id], enabled=False))
    await manager.async_run_now(saved["id"], 1)
    async_fire_time_changed(hass)
    await hass.async_block_till_done()
    assert len(players.plays()) == 1
    assert manager.scenario(saved["id"]).enabled is True
    await _advance(hass, freezer, 70)
    assert len(players.plays()) == 30
    assert manager.runtime_view(saved["id"])["override_until"] is None


async def test_mix_edit_keeps_cycle_and_timing_edit_restarts(hass: HomeAssistant, setup_integration) -> None:
    """Changing weights keeps the runtime generation; changing the grid restarts it."""
    manager, _, _ = await setup_integration()
    sound_id = await add_sound(manager)
    saved = await manager.async_save_scenario(scenario_payload([sound_id]))
    key = (saved["id"], saved["layers"][0]["id"])
    generation = manager._runtimes[key].generation
    saved["layers"][0]["sounds"][0]["weight"] = 5
    saved = await manager.async_save_scenario(saved)
    assert manager._runtimes[key].generation == generation
    saved["layers"][0]["grid"]["slot_seconds"] = 3
    await manager.async_save_scenario(saved)
    assert manager._runtimes[key].generation > generation


async def test_revision_conflict_changes_nothing(hass: HomeAssistant, setup_integration) -> None:
    """A stale revision is rejected and the stored version survives."""
    manager, _, _ = await setup_integration()
    sound_id = await add_sound(manager)
    saved = await manager.async_save_scenario(scenario_payload([sound_id]))
    stale = dict(saved, name="Старое")
    await manager.async_save_scenario(dict(saved, name="Новое"))
    try:
        await manager.async_save_scenario(stale)
    except Exception as err:  # noqa: BLE001
        assert getattr(err, "code", None) == "revision_conflict"
    else:
        raise AssertionError("expected revision_conflict")
    assert manager.scenario(saved["id"]).name == "Новое"


async def test_overlap_skip_yields_to_recent_other_layer(hass: HomeAssistant, setup_integration) -> None:
    """A 'skip' layer does not interrupt a clip another layer just started."""
    manager, _, _ = await setup_integration()
    sound_id = await add_sound(manager)
    payload = scenario_payload([sound_id])
    payload["layers"].append({**payload["layers"][0], "name": "Вторая", "overlap": "skip"})
    saved = await manager.async_save_scenario(payload)
    scenario = manager.scenario(saved["id"])
    first, second = scenario.layers
    now = dt_util.now()
    manager._last_play[KITCHEN] = (now, (scenario.id, first.id), 2)
    plan = manager._plan_play_locked(scenario, second, manager._runtimes[(scenario.id, second.id)], now)
    assert plan is not None and plan.targets == ()
    later = now + timedelta(seconds=3)
    plan = manager._plan_play_locked(scenario, second, manager._runtimes[(scenario.id, second.id)], later)
    assert plan is not None and [target for target, _ in plan.targets] == [KITCHEN]


async def test_layer_volume_is_applied_before_play(hass: HomeAssistant, setup_integration, freezer) -> None:
    """A layer volume issues volume_set only when the player differs."""
    manager, players, _ = await setup_integration()
    sound_id = await add_sound(manager)
    payload = scenario_payload([sound_id])
    payload["layers"][0]["volume"] = 30
    await manager.async_save_scenario(payload)
    await _advance(hass, freezer, 2)
    services = [service for service, _, _ in players.calls]
    assert services == ["volume_set", "play_media"]
    assert players.calls[0][2]["volume_level"] == 0.3


async def test_bluetooth_keepalive_plays_silence_in_long_gaps(hass: HomeAssistant, setup_integration, freezer) -> None:
    """With density 0 the speaker still gets a silent clip every keep-alive period."""
    manager, players, _ = await setup_integration()
    await manager.async_save_output({"entity_id": KITCHEN, "kind": "bluetooth", "keepalive_seconds": 30})
    sound_id = await add_sound(manager)
    payload = scenario_payload([sound_id])
    payload["layers"][0]["grid"]["density_percent"] = 0
    await manager.async_save_scenario(payload)
    await _advance(hass, freezer, 65)
    silent = [uri for uri in players.plays(include_system=True) if uri.endswith("silence.wav")]
    assert 2 <= len(silent) <= 3
    assert players.plays() == []
