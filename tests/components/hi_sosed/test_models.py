"""Tests for validation, presets and storage migration (pure)."""

from __future__ import annotations

from typing import Any

import pytest

from custom_components.hi_sosed.audio import beep_wav, silence_wav, sniff_matches, starter_clips
from custom_components.hi_sosed.models import (
    HiSosedError,
    OutputProfile,
    Scenario,
    Sound,
    apply_preset,
    capture_preset,
    migrate_v1,
    timing_signature,
)

S1 = "11111111-1111-1111-1111-111111111111"
S2 = "22222222-2222-2222-2222-222222222222"
L1 = "aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa"
L2 = "bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb"


def raw_scenario(**overrides: Any) -> dict[str, Any]:
    """Return a valid two-layer scenario."""
    data = {
        "name": "  Стройка  ",
        "enabled": True,
        "target_entity_ids": ["media_player.kitchen"],
        "schedule": {"days": [[{"start": "10:00", "end": "18:00"}]] * 5 + [[], []]},
        "layers": [
            {"id": L1, "name": "Дрель", "sounds": [{"sound_id": S1, "weight": 3}], "grid": {"density_percent": 30}},
            {"id": L2, "name": "Молоток", "enabled": False, "sounds": [{"sound_id": S2}], "volume": 40},
        ],
    }
    data.update(overrides)
    return data


def test_valid_scenario_normalizes_values() -> None:
    """Names are trimmed and times normalized to HH:MM."""
    scenario = Scenario.from_dict(raw_scenario(schedule={"days": [[{"start": "10:00:00", "end": "18:00"}]] + [[]] * 6}))
    assert scenario.name == "Стройка"
    assert scenario.schedule.days[0][0].start == "10:00"
    assert scenario.layers[1].volume == 40
    assert scenario.sound_ids() == {S1, S2}


@pytest.mark.parametrize(
    ("patch", "code"),
    [
        ({"name": " "}, "missing_name"),
        ({"layers": []}, "invalid_layers"),
        ({"target_entity_ids": ["light.kitchen"]}, "invalid_targets"),
        ({"schedule": {"days": [[]] * 6}}, "invalid_schedule"),
        ({"schedule": {"days": [[{"start": "25:00", "end": "10:00"}]] + [[]] * 6}}, "invalid_time"),
    ],
)
def test_invalid_scenarios_raise_stable_codes(patch: dict[str, Any], code: str) -> None:
    """Every rejection is a stable code, never free text."""
    with pytest.raises(HiSosedError) as err:
        Scenario.from_dict(raw_scenario(**patch))
    assert err.value.code == code


def test_layer_validation_codes() -> None:
    """Grid, overlap and duplicate sounds are validated per layer."""
    for layer_patch, code in [
        ({"grid": {"slot_seconds": 0}}, "invalid_slot_seconds"),
        ({"grid": {"density_percent": 101}}, "invalid_density"),
        ({"overlap": "mix"}, "invalid_overlap"),
        ({"sounds": [{"sound_id": S1}, {"sound_id": S1}]}, "duplicate_sound"),
        ({"volume": 150}, "invalid_volume"),
    ]:
        raw = raw_scenario()
        raw["layers"][0] = {**raw["layers"][0], **layer_patch}
        with pytest.raises(HiSosedError) as err:
            Scenario.from_dict(raw)
        assert err.value.code == code


def test_scenario_roundtrips_through_as_dict() -> None:
    """Stored JSON is accepted back unchanged."""
    scenario = Scenario.from_dict(raw_scenario(), revision=3)
    assert Scenario.from_dict(scenario.as_dict()) == scenario


def test_capture_and_apply_preset_switch_the_mix() -> None:
    """A preset restores switches, sounds, density and volume but keeps schedules."""
    base = Scenario.from_dict(raw_scenario())
    with_day = capture_preset(base, "День")
    day_id = with_day.active_preset_id
    raw = with_day.as_dict()
    raw["layers"][0]["enabled"] = False
    raw["layers"][1]["enabled"] = True
    raw["layers"][1]["grid"]["density_percent"] = 80
    night = capture_preset(Scenario.from_dict(raw), "Ночь")
    restored = apply_preset(night, day_id)
    assert restored.active_preset_id == day_id
    assert [layer.enabled for layer in restored.layers] == [True, False]
    assert restored.layers[1].grid.density_percent == 30
    assert restored.layers[1].grid.slot_count == base.layers[1].grid.slot_count
    assert restored.schedule == base.schedule
    assert len(night.presets) == 2
    with pytest.raises(HiSosedError):
        apply_preset(night, S1)


def test_timing_signature_ignores_mix_only_edits() -> None:
    """Editing weights or volume does not restart a running cycle."""
    scenario = Scenario.from_dict(raw_scenario())
    raw = scenario.as_dict()
    raw["layers"][0]["sounds"][0]["weight"] = 9
    raw["layers"][0]["volume"] = 10
    edited = Scenario.from_dict(raw)
    assert timing_signature(scenario, scenario.layers[0]) == timing_signature(edited, edited.layers[0])
    raw["layers"][0]["grid"]["slot_seconds"] = 3
    regridded = Scenario.from_dict(raw)
    assert timing_signature(scenario, scenario.layers[0]) != timing_signature(regridded, regridded.layers[0])


def test_migrate_v1_builds_library_and_single_layer() -> None:
    """Old scenarios keep their audio, schedule and grid."""
    old = {
        "scenarios": {
            "33333333-3333-3333-3333-333333333333": {
                "id": "33333333-3333-3333-3333-333333333333",
                "revision": 4,
                "name": "Old",
                "enabled": True,
                "target_entity_ids": ["media_player.a"],
                "schedule": {"weekdays": [0, 2], "start": "22:00:00", "end": "01:00:00"},
                "grid": {"slot_seconds": 3, "slot_count": 10, "density_percent": 50},
                "audio": [
                    {
                        "id": S1,
                        "name": "knock.mp3",
                        "media_content_id": "media-source://media_source/local/hi_sosed/x.mp3",
                        "enabled": True,
                        "weight": 2,
                    }
                ],
            }
        }
    }
    data = migrate_v1(old)
    sound = Sound.from_dict(data["sounds"][S1])
    assert sound.managed and sound.content_type == "audio/mpeg"
    scenario = Scenario.from_dict(data["scenarios"]["33333333-3333-3333-3333-333333333333"])
    assert scenario.revision == 4
    assert scenario.layers[0].grid.slot_seconds == 3
    assert scenario.layers[0].sounds[0].weight == 2
    assert [bool(day) for day in scenario.schedule.days] == [True, False, True, False, False, False, False]


def test_output_profile_validation() -> None:
    """Keep-alive under 15 s would spam the player and is rejected."""
    assert OutputProfile.from_dict({"entity_id": "media_player.bt", "kind": "bluetooth", "keepalive_seconds": 60}).kind == "bluetooth"
    for raw, code in [
        ({"entity_id": "media_player.bt", "keepalive_seconds": 5}, "invalid_keepalive"),
        ({"entity_id": "media_player.bt", "kind": "usb"}, "invalid_output"),
        ({"entity_id": "switch.bt"}, "invalid_targets"),
    ]:
        with pytest.raises(HiSosedError) as err:
            OutputProfile.from_dict(raw)
        assert err.value.code == code


def test_generated_clips_are_valid_wav() -> None:
    """Generated clips pass the same sniffing as uploads."""
    for data in [silence_wav(), beep_wav(), *(clip for _, clip in starter_clips())]:
        assert sniff_matches(".wav", data[:16])
    assert not sniff_matches(".mp3", b"<html>not audio")
    assert sniff_matches(".mp3", b"ID3\x04\x00")
    assert sniff_matches(".ogg", b"OggS\x00")
