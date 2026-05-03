from dataclasses import dataclass
from decimal import Decimal


@dataclass(frozen=True)
class ExerciseStateUpdate:
    current_weight: Decimal
    consecutive_misses: int


def compute_next_state(
    current_weight: Decimal,
    consecutive_misses: int,
    all_sets_hit: bool,
    increment: Decimal,
) -> ExerciseStateUpdate:
    if all_sets_hit:
        return ExerciseStateUpdate(
            current_weight=current_weight + increment,
            consecutive_misses=0,
        )

    new_misses = consecutive_misses + 1
    if new_misses >= 2:
        deloaded = (current_weight * Decimal("0.9")).quantize(Decimal("0.01"))
        return ExerciseStateUpdate(current_weight=deloaded, consecutive_misses=0)

    return ExerciseStateUpdate(current_weight=current_weight, consecutive_misses=new_misses)


def apply_return_reduction(current_weight: Decimal) -> Decimal:
    return (current_weight * Decimal("0.9")).quantize(Decimal("0.01"))
