from decimal import Decimal

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.exercise import Exercise
from app.models.program_session import ProgramSession
from app.models.session_exercise import SessionExercise
from app.models.user_exercise_state import UserExerciseState
from app.models.user_program import UserProgram
from app.schemas.workout import TodayExerciseOut


async def get_today_data(
    db: AsyncSession, up: UserProgram
) -> tuple[ProgramSession, list[TodayExerciseOut]]:
    session_result = await db.execute(
        select(ProgramSession).where(
            ProgramSession.program_id == up.program_id,
            ProgramSession.position == up.next_session_position,
        )
    )
    session = session_result.scalar_one()

    se_result = await db.execute(
        select(SessionExercise, Exercise)
        .join(Exercise, SessionExercise.exercise_id == Exercise.id)
        .where(SessionExercise.session_id == session.id)
        .order_by(SessionExercise.order_in_session)
    )
    rows = se_result.all()

    exercise_ids = [ex.id for _, ex in rows]
    state_result = await db.execute(
        select(UserExerciseState).where(
            UserExerciseState.user_program_id == up.id,
            UserExerciseState.exercise_id.in_(exercise_ids),
        )
    )
    state_by_exercise = {s.exercise_id: s for s in state_result.scalars().all()}

    exercises = [
        TodayExerciseOut(
            session_exercise_id=se.id,
            exercise_name=ex.name,
            sets_prescribed=se.sets_prescribed,
            reps_prescribed=se.reps_prescribed,
            current_weight=state_by_exercise[ex.id].current_weight
            if ex.id in state_by_exercise
            else Decimal("0"),
            order_in_session=se.order_in_session,
        )
        for se, ex in rows
    ]

    return session, exercises
