"""Pure random-grid and time-window functions (no Home Assistant imports)."""

from __future__ import annotations

from datetime import UTC, datetime, time, timedelta, tzinfo
from math import ceil, comb
from random import Random
from typing import Sequence

from .models import GridSpec, SoundRef, WeeklySchedule

Window = tuple[datetime, datetime]
_REPEAT_ATTEMPTS = 3


def generate_pattern(grid: GridSpec, rng: Random, previous: tuple[bool, ...] = ()) -> tuple[bool, ...]:
    """Create a pattern with exactly the requested number of active cells.

    When more than one pattern is possible, a bounded number of retries avoids
    repeating the previous cycle exactly (HS-FR-024).
    """
    attempts = _REPEAT_ATTEMPTS if comb(grid.slot_count, grid.active_count) > 1 else 1
    pattern: tuple[bool, ...] = ()
    for _ in range(attempts):
        indexes = frozenset(rng.sample(range(grid.slot_count), grid.active_count))
        pattern = tuple(index in indexes for index in range(grid.slot_count))
        if pattern != previous:
            break
    return pattern


def choose_sound(refs: Sequence[SoundRef], rng: Random, available: set[str] | None = None) -> SoundRef | None:
    """Choose one enabled (and still existing) sound by weight."""
    enabled = [ref for ref in refs if ref.enabled and (available is None or ref.sound_id in available)]
    if not enabled:
        return None
    return rng.choices(enabled, weights=[ref.weight for ref in enabled], k=1)[0]


def _local(day_value, wall: time, tz: tzinfo) -> datetime:
    """Return an aware local datetime; a nonexistent DST time moves past the gap."""
    naive = datetime.combine(day_value, wall)
    aware = naive.replace(tzinfo=tz, fold=0)
    # Round-tripping through UTC normalizes times inside a spring-forward gap.
    return aware.astimezone(UTC).astimezone(tz)


def schedule_windows(schedule: WeeklySchedule, now: datetime, tz: tzinfo, days_ahead: int = 8) -> list[Window]:
    """Return merged local windows that end after ``now``, sorted by start.

    Ranges that touch or overlap (also across midnight and across days) become
    one logical window, so a layer never runs two schedulers at once.
    """
    local_now = now.astimezone(tz)
    raw: list[Window] = []
    for offset in range(-1, days_ahead + 1):
        day_value = local_now.date() + timedelta(days=offset)
        for rng in schedule.days[day_value.weekday()]:
            start_time, end_time = time.fromisoformat(rng.start), time.fromisoformat(rng.end)
            start = _local(day_value, start_time, tz)
            end_day = day_value + timedelta(days=1) if end_time <= start_time else day_value
            end = _local(end_day, end_time, tz)
            if end > start:
                raw.append((start, end))
    raw.sort()
    merged: list[Window] = []
    for start, end in raw:
        if merged and start <= merged[-1][1]:
            merged[-1] = (merged[-1][0], max(merged[-1][1], end))
        else:
            merged.append((start, end))
    return [window for window in merged if window[1] > now]


def current_window(schedule: WeeklySchedule, now: datetime, tz: tzinfo) -> Window | None:
    """Return the window containing ``now``."""
    for start, end in schedule_windows(schedule, now, tz):
        if start <= now < end:
            return start, end
    return None


def next_window(schedule: WeeklySchedule, now: datetime, tz: tzinfo) -> Window | None:
    """Return the first window starting strictly after ``now``, if any within a week."""
    for start, end in schedule_windows(schedule, now, tz):
        if start > now:
            return start, end
    return None


def next_slot_index(window_start: datetime, now: datetime, slot_seconds: int, *, fresh: bool) -> int:
    """Return the first slot to schedule.

    ``fresh`` (a window-boundary callback) tolerates being up to half a slot late;
    otherwise (restart, edit) only strictly future slots are used, so missed
    cells are never replayed (HS-FR-014).
    """
    elapsed = max(0.0, (now - window_start).total_seconds())
    if fresh:
        return max(0, ceil((elapsed - slot_seconds / 2) / slot_seconds))
    return int(elapsed // slot_seconds) + 1


def slot_time(window_start: datetime, slot: int, slot_seconds: int) -> datetime:
    """Return the absolute boundary of a slot."""
    return window_start + timedelta(seconds=slot * slot_seconds)


def pattern_to_text(pattern: tuple[bool, ...]) -> str:
    """Compactly encode a pattern for storage and the panel."""
    return "".join("1" if cell else "0" for cell in pattern)


def pattern_from_text(text: str, grid: GridSpec) -> tuple[bool, ...] | None:
    """Decode a stored pattern if it still satisfies the grid invariants."""
    if len(text) != grid.slot_count or set(text) - {"0", "1"}:
        return None
    pattern = tuple(char == "1" for char in text)
    return pattern if sum(pattern) == grid.active_count else None
