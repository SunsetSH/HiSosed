"""Tests for deterministic HiSosed domain behavior (pure, no hass fixture)."""

from __future__ import annotations

from collections import Counter
from datetime import datetime, timedelta
from random import Random
from zoneinfo import ZoneInfo

import pytest

from custom_components.hi_sosed.engine import (
    choose_sound,
    current_window,
    generate_pattern,
    next_slot_index,
    next_window,
    pattern_from_text,
    pattern_to_text,
    schedule_windows,
)
from custom_components.hi_sosed.models import GridSpec, SoundRef, WeeklySchedule

TZ = ZoneInfo("Europe/Berlin")


def _schedule(days: dict[int, list[tuple[str, str]]]) -> WeeklySchedule:
    return WeeklySchedule.from_dict(
        {"days": [[{"start": s, "end": e} for s, e in days.get(day, [])] for day in range(7)]}
    )


def _at(text: str) -> datetime:
    return datetime.fromisoformat(text).replace(tzinfo=TZ)


def test_pattern_has_exact_requested_density() -> None:
    """The configured density is exact within one explicit rounding rule."""
    pattern = generate_pattern(GridSpec(slot_seconds=2, slot_count=10, density_percent=30), Random(123))

    assert sum(pattern) == 3


@pytest.mark.parametrize(("count", "density", "expected"), [(1, 49, 0), (1, 50, 1), (3, 50, 2), (10, 5, 1), (7, 100, 7)])
def test_half_up_rounding(count: int, density: int, expected: int) -> None:
    """floor(N*d/100 + 0.5), not banker's rounding."""
    assert GridSpec(slot_count=count, density_percent=density).active_count == expected


def test_hundred_cycles_keep_exact_density() -> None:
    """Every generated cycle keeps the exact active count."""
    rng = Random(7)
    grid = GridSpec(slot_count=37, density_percent=41)
    previous: tuple[bool, ...] = ()
    for _ in range(100):
        previous = generate_pattern(grid, rng, previous)
        assert sum(previous) == grid.active_count


def test_pattern_is_reproducible_for_fixed_seed() -> None:
    """Tests may inject a seed without relying on runtime randomness."""
    grid = GridSpec(slot_seconds=2, slot_count=17, density_percent=47)

    assert generate_pattern(grid, Random(42)) == generate_pattern(grid, Random(42))


def test_pattern_avoids_repeating_previous_when_possible() -> None:
    """With two possible patterns the retry nearly always yields the other one."""
    grid = GridSpec(slot_count=2, density_percent=50)
    first = generate_pattern(grid, Random(1))
    repeats = sum(generate_pattern(grid, Random(seed), first) == first for seed in range(200))
    assert repeats < 40


def test_pattern_supports_silent_and_full_cycles() -> None:
    """The two edge densities never create invalid sample requests and do not loop."""
    assert not any(generate_pattern(GridSpec(slot_count=5, density_percent=0), Random(1), (False,) * 5))
    assert all(generate_pattern(GridSpec(slot_count=5, density_percent=100), Random(1), (True,) * 5))


def test_pattern_text_roundtrip_rejects_mismatch() -> None:
    """A stored pattern is reused only if it still matches the grid."""
    grid = GridSpec(slot_count=4, density_percent=50)
    pattern = generate_pattern(grid, Random(3))
    assert pattern_from_text(pattern_to_text(pattern), grid) == pattern
    assert pattern_from_text("1111", grid) is None
    assert pattern_from_text("10", grid) is None


def test_choose_sound_respects_switches_and_weights() -> None:
    """Disabled and missing sounds never play; weights shift the distribution."""
    refs = [
        SoundRef("00000000-0000-0000-0000-000000000001", True, 9),
        SoundRef("00000000-0000-0000-0000-000000000002", True, 1),
        SoundRef("00000000-0000-0000-0000-000000000003", False, 1000),
    ]
    rng = Random(5)
    counts = Counter(choose_sound(refs, rng).sound_id[-1] for _ in range(2000))
    assert "3" not in counts
    assert counts["1"] > counts["2"] * 4
    only = choose_sound(refs, rng, available={refs[1].sound_id})
    assert only is refs[1]
    assert choose_sound(refs, rng, available=set()) is None


def test_multiple_ranges_per_day_give_breaks() -> None:
    """Two ranges on one day are two windows with a break between them."""
    schedule = _schedule({0: [("10:00", "13:00"), ("14:00", "18:00")]})
    monday = _at("2026-11-16T12:00:00")
    assert current_window(schedule, monday, TZ) == (_at("2026-11-16T10:00"), _at("2026-11-16T13:00"))
    assert current_window(schedule, _at("2026-11-16T13:30"), TZ) is None
    assert next_window(schedule, _at("2026-11-16T13:30"), TZ)[0] == _at("2026-11-16T14:00")


def test_overnight_window_belongs_to_start_day() -> None:
    """22:00-01:00 on Monday is active early on Tuesday but not early on Monday."""
    schedule = _schedule({0: [("22:00", "01:00")]})
    assert current_window(schedule, _at("2026-11-17T00:30"), TZ) == (_at("2026-11-16T22:00"), _at("2026-11-17T01:00"))
    assert current_window(schedule, _at("2026-11-16T00:30"), TZ) is None


def test_touching_ranges_merge_into_one_window() -> None:
    """Mon 20-24 and Tue 00-02 form a single logical window (no double scheduler)."""
    schedule = _schedule({0: [("20:00", "00:00")], 1: [("00:00", "02:00")]})
    windows = schedule_windows(schedule, _at("2026-11-16T19:00"), TZ)
    assert windows[0] == (_at("2026-11-16T20:00"), _at("2026-11-17T02:00"))


def test_equal_start_and_end_is_full_day() -> None:
    """start == end means 24 hours from start."""
    schedule = _schedule({2: [("08:00", "08:00")]})
    assert current_window(schedule, _at("2026-11-19T07:00"), TZ) == (_at("2026-11-18T08:00"), _at("2026-11-19T08:00"))


def test_empty_schedule_has_no_windows() -> None:
    """No ranges: no window and no exception."""
    schedule = _schedule({})
    assert schedule.is_empty
    assert next_window(schedule, _at("2026-11-16T10:00"), TZ) is None


def test_spring_forward_gap_moves_start_past_gap() -> None:
    """02:30 does not exist on 2026-03-29 in Berlin; the window starts at 03:30."""
    schedule = _schedule({6: [("02:30", "05:00")]})
    start, end = next_window(schedule, _at("2026-03-29T00:00"), TZ)
    assert start.astimezone(TZ).hour == 3 and start.astimezone(TZ).minute == 30
    assert end - start == timedelta(hours=1, minutes=30)


def test_fall_back_repeated_hour_yields_one_window() -> None:
    """02:30 happens twice on 2026-10-25; only one window is produced."""
    schedule = _schedule({6: [("02:30", "02:45")]})
    windows = [w for w in schedule_windows(schedule, _at("2026-10-25T00:00"), TZ) if w[0].date().isoformat() == "2026-10-25"]
    assert len(windows) == 1


def test_next_slot_restart_is_strictly_future_and_boundary_tolerates_lateness() -> None:
    """Restart never replays; a boundary callback half a slot late still plays slot 0."""
    start = _at("2026-11-16T10:00:00")
    assert next_slot_index(start, start + timedelta(seconds=10.3), 2, fresh=False) == 6
    assert next_slot_index(start, start + timedelta(seconds=0.4), 2, fresh=True) == 0
    assert next_slot_index(start, start + timedelta(seconds=1.5), 2, fresh=True) == 1
