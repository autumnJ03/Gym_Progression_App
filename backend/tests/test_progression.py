from decimal import Decimal

import pytest

from app.services.progression import compute_next_state, apply_return_reduction


def test_hit_all_sets_increases_weight():
    result = compute_next_state(
        current_weight=Decimal("100"),
        consecutive_misses=0,
        all_sets_hit=True,
        increment=Decimal("5"),
    )
    assert result.current_weight == Decimal("105")
    assert result.consecutive_misses == 0


def test_hit_resets_consecutive_misses():
    result = compute_next_state(
        current_weight=Decimal("100"),
        consecutive_misses=1,
        all_sets_hit=True,
        increment=Decimal("2.5"),
    )
    assert result.current_weight == Decimal("102.5")
    assert result.consecutive_misses == 0


def test_first_miss_repeats_weight():
    result = compute_next_state(
        current_weight=Decimal("100"),
        consecutive_misses=0,
        all_sets_hit=False,
        increment=Decimal("5"),
    )
    assert result.current_weight == Decimal("100")
    assert result.consecutive_misses == 1


def test_second_miss_deloads_ten_percent():
    result = compute_next_state(
        current_weight=Decimal("100"),
        consecutive_misses=1,
        all_sets_hit=False,
        increment=Decimal("5"),
    )
    assert result.current_weight == Decimal("90.00")
    assert result.consecutive_misses == 0


def test_deload_resets_miss_counter():
    result = compute_next_state(
        current_weight=Decimal("80"),
        consecutive_misses=1,
        all_sets_hit=False,
        increment=Decimal("2.5"),
    )
    assert result.consecutive_misses == 0


def test_exact_reps_counts_as_hit():
    # reps_completed == reps_prescribed is a hit — the router sets all_sets_hit=True in this case
    result = compute_next_state(
        current_weight=Decimal("60"),
        consecutive_misses=0,
        all_sets_hit=True,
        increment=Decimal("2.5"),
    )
    assert result.current_weight == Decimal("62.5")


def test_return_reduction_applies_ten_percent():
    assert apply_return_reduction(Decimal("100")) == Decimal("90.00")


def test_return_reduction_rounds_to_cents():
    assert apply_return_reduction(Decimal("95")) == Decimal("85.50")
