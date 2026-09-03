"""Pure random-grid and time-window functions."""

from __future__ import annotations

from datetime import datetime, time, timedelta
from random import Random
from typing import Sequence

from homeassistant.util import dt as dt_util

from .models import AudioItem, GridSpec, Scenario


def generate_pattern(grid: GridSpec, rng: Random) -> tuple[bool, ...]:
    """Create a pattern with exactly the requested number of active cells."""
    indexes = frozenset(rng.sample(range(grid.slot_count), grid.active_count))
    return tuple(index in indexes for index in range(grid.slot_count))


def choose_audio(audio: Sequence[AudioItem], rng: Random) -> AudioItem:
    """Choose one enabled item by configured weight."""
    enabled = [item for item in audio if item.enabled]
    return rng.choices(enabled, weights=[item.weight for item in enabled], k=1)[0]


def active_window(scenario: Scenario, now: datetime) -> tuple[datetime, datetime] | None:
    """Return active local window, including a window that crossed midnight."""
    start_time = time.fromisoformat(scenario.schedule.start)
    end_time = time.fromisoformat(scenario.schedule.end)
    for offset in (0, -1):
        start_day = now.date() + timedelta(days=offset)
        if start_day.weekday() not in scenario.schedule.weekdays:
            continue
        start = dt_util.as_local(datetime.combine(start_day, start_time))
        end_day = start_day + timedelta(days=1) if end_time <= start_time else start_day
        end = dt_util.as_local(datetime.combine(end_day, end_time))
        if start <= now < end:
            return start, end
    return None


def next_window_start(scenario: Scenario, now: datetime) -> datetime:
    """Find the next start among the coming week."""
    start_time = time.fromisoformat(scenario.schedule.start)
    for offset in range(0, 8):
        day = now.date() + timedelta(days=offset)
        if day.weekday() not in scenario.schedule.weekdays:
            continue
        candidate = dt_util.as_local(datetime.combine(day, start_time))
        if candidate > now:
            return candidate
    raise RuntimeError("No future weekly window")
