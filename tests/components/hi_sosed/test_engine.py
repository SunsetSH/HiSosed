"""Tests for deterministic HiSosed domain behavior."""

from __future__ import annotations

from random import Random

from custom_components.hi_sosed.engine import generate_pattern
from custom_components.hi_sosed.models import GridSpec


def test_pattern_has_exact_requested_density() -> None:
    """The configured density is exact within one explicit rounding rule."""
    pattern = generate_pattern(GridSpec(slot_seconds=2, slot_count=10, density_percent=30), Random(123))

    assert sum(pattern) == 3


def test_pattern_is_reproducible_for_fixed_seed() -> None:
    """Tests may inject a seed without relying on runtime randomness."""
    grid = GridSpec(slot_seconds=2, slot_count=17, density_percent=47)

    assert generate_pattern(grid, Random(42)) == generate_pattern(grid, Random(42))


def test_pattern_supports_silent_and_full_cycles() -> None:
    """The two edge densities never create invalid sample requests."""
    assert not any(generate_pattern(GridSpec(slot_count=5, density_percent=0), Random(1)))
    assert all(generate_pattern(GridSpec(slot_count=5, density_percent=100), Random(1)))
