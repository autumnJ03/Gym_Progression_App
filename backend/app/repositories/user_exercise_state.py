from sqlalchemy.dialects.postgresql import insert
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.user_exercise_state import UserExerciseState


async def upsert(
    db: AsyncSession,
    user_program_id: int,
    exercise_id: int,
    current_weight,
    consecutive_misses: int,
) -> None:
    stmt = (
        insert(UserExerciseState)
        .values(
            user_program_id=user_program_id,
            exercise_id=exercise_id,
            current_weight=current_weight,
            consecutive_misses=consecutive_misses,
        )
        .on_conflict_do_update(
            index_elements=["user_program_id", "exercise_id"],
            set_={"current_weight": current_weight, "consecutive_misses": consecutive_misses},
        )
    )
    await db.execute(stmt)
