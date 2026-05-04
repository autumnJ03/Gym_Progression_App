from decimal import Decimal

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.session_exercise import SessionExercise
from app.models.set_log import SetLog
from app.models.user_program import UserProgram
from app.models.workout_log import WorkoutLog


async def get_in_progress(db: AsyncSession, user_program_id: int) -> WorkoutLog | None:
    result = await db.execute(
        select(WorkoutLog).where(
            WorkoutLog.user_program_id == user_program_id,
            WorkoutLog.completed_at == None,
        )
    )
    return result.scalar_one_or_none()


async def start(db: AsyncSession, user_program_id: int, session_id: int) -> WorkoutLog:
    log = WorkoutLog(user_program_id=user_program_id, session_id=session_id)
    db.add(log)
    await db.commit()
    await db.refresh(log)
    return log


async def get_by_id_for_user(
    db: AsyncSession, workout_log_id: int, user_id: int
) -> WorkoutLog | None:
    result = await db.execute(
        select(WorkoutLog)
        .join(UserProgram, WorkoutLog.user_program_id == UserProgram.id)
        .where(WorkoutLog.id == workout_log_id, UserProgram.user_id == user_id)
    )
    return result.scalar_one_or_none()


async def get_session_exercise(
    db: AsyncSession, session_exercise_id: int, session_id: int
) -> SessionExercise | None:
    result = await db.execute(
        select(SessionExercise).where(
            SessionExercise.id == session_exercise_id,
            SessionExercise.session_id == session_id,
        )
    )
    return result.scalar_one_or_none()


async def log_set(
    db: AsyncSession,
    workout_log_id: int,
    session_exercise_id: int,
    set_number: int,
    weight_used,
    reps_completed: int,
    reps_prescribed: int,
) -> SetLog:
    entry = SetLog(
        workout_log_id=workout_log_id,
        session_exercise_id=session_exercise_id,
        set_number=set_number,
        weight_used=weight_used,
        reps_completed=reps_completed,
        hit=reps_completed >= reps_prescribed,
    )
    db.add(entry)
    await db.commit()
    await db.refresh(entry)
    return entry


async def get_sets_for_workout(db: AsyncSession, workout_log_id: int) -> list[SetLog]:
    result = await db.execute(
        select(SetLog).where(SetLog.workout_log_id == workout_log_id)
    )
    return list(result.scalars().all())


async def delete_set(
    db: AsyncSession,
    set_log_id: int,
    workout_log_id: int,
) -> bool:
    result = await db.execute(
        select(SetLog).where(SetLog.id == set_log_id, SetLog.workout_log_id == workout_log_id)
    )
    entry = result.scalar_one_or_none()
    if not entry:
        return False
    await db.delete(entry)
    await db.commit()
    return True


async def update_set(
    db: AsyncSession,
    set_log_id: int,
    workout_log_id: int,
    weight_used: Decimal,
    reps_completed: int,
) -> SetLog | None:
    result = await db.execute(
        select(SetLog, SessionExercise)
        .join(SessionExercise, SetLog.session_exercise_id == SessionExercise.id)
        .where(SetLog.id == set_log_id, SetLog.workout_log_id == workout_log_id)
    )
    row = result.one_or_none()
    if not row:
        return None
    entry, se = row
    entry.weight_used = weight_used
    entry.reps_completed = reps_completed
    entry.hit = reps_completed >= se.reps_prescribed
    await db.commit()
    await db.refresh(entry)
    return entry
