from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

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
