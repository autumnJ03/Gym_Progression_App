from collections import defaultdict
from datetime import datetime, timezone
from decimal import Decimal

from fastapi import HTTPException, status
from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.program_session import ProgramSession
from app.models.session_exercise import SessionExercise
from app.models.user_exercise_state import UserExerciseState
from app.models.user_program import UserProgram
from app.repositories import user_exercise_state as state_repo
from app.repositories import workout as workout_repo
from app.services.progression import compute_next_state


async def complete_workout(db: AsyncSession, workout_log_id: int, user_id: int) -> None:
    log = await workout_repo.get_by_id_for_user(db, workout_log_id, user_id)
    if not log:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Workout not found")
    if log.completed_at:
        raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail="Workout already completed")

    se_result = await db.execute(
        select(SessionExercise).where(SessionExercise.session_id == log.session_id)
    )
    session_exercises = list(se_result.scalars().all())

    set_logs = await workout_repo.get_sets_for_workout(db, workout_log_id)
    sets_by_se: dict[int, list] = defaultdict(list)
    for sl in set_logs:
        sets_by_se[sl.session_exercise_id].append(sl)

    up = await db.get(UserProgram, log.user_program_id)
    exercise_ids = [se.exercise_id for se in session_exercises]
    state_result = await db.execute(
        select(UserExerciseState).where(
            UserExerciseState.user_program_id == up.id,
            UserExerciseState.exercise_id.in_(exercise_ids),
        )
    )
    states = {s.exercise_id: s for s in state_result.scalars().all()}

    for se in session_exercises:
        logged = sets_by_se[se.id]
        all_sets_hit = (
            len(logged) >= se.sets_prescribed
            and all(sl.hit for sl in logged[: se.sets_prescribed])
        )

        existing = states.get(se.exercise_id)
        if existing:
            current_weight = existing.current_weight
            consecutive_misses = existing.consecutive_misses
        else:
            current_weight = logged[0].weight_used if logged else Decimal("0")
            consecutive_misses = 0

        new_state = compute_next_state(
            current_weight=current_weight,
            consecutive_misses=consecutive_misses,
            all_sets_hit=all_sets_hit,
            increment=se.default_increment,
        )
        await state_repo.upsert(
            db, up.id, se.exercise_id, new_state.current_weight, new_state.consecutive_misses
        )

    log.completed_at = datetime.now(timezone.utc)

    total = (
        await db.execute(
            select(func.count(ProgramSession.id)).where(
                ProgramSession.program_id == up.program_id
            )
        )
    ).scalar_one()
    up.next_session_position = (up.next_session_position % total) + 1

    await db.commit()
