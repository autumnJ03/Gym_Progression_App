from collections import defaultdict

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.exercise import Exercise
from app.models.program import Program
from app.models.program_session import ProgramSession
from app.models.session_exercise import SessionExercise
from app.schemas.program import (
    ExerciseOut,
    ProgramDetailOut,
    ProgramOut,
    ProgramSessionOut,
    SessionExerciseOut,
)


async def list_all(db: AsyncSession) -> list[Program]:
    result = await db.execute(select(Program).order_by(Program.id))
    return list(result.scalars().all())


async def get_with_sessions(db: AsyncSession, program_id: int) -> ProgramDetailOut | None:
    program = await db.get(Program, program_id)
    if not program:
        return None

    sessions_result = await db.execute(
        select(ProgramSession)
        .where(ProgramSession.program_id == program_id)
        .order_by(ProgramSession.position)
    )
    sessions = list(sessions_result.scalars().all())

    if not sessions:
        return ProgramDetailOut(
            id=program.id, name=program.name, description=program.description, sessions=[]
        )

    session_ids = [s.id for s in sessions]
    se_result = await db.execute(
        select(SessionExercise, Exercise)
        .join(Exercise, SessionExercise.exercise_id == Exercise.id)
        .where(SessionExercise.session_id.in_(session_ids))
        .order_by(SessionExercise.session_id, SessionExercise.order_in_session)
    )

    se_by_session: dict[int, list[SessionExerciseOut]] = defaultdict(list)
    for se, ex in se_result.all():
        se_by_session[se.session_id].append(
            SessionExerciseOut(
                id=se.id,
                exercise=ExerciseOut(id=ex.id, name=ex.name, muscle_group=ex.muscle_group),
                sets_prescribed=se.sets_prescribed,
                reps_prescribed=se.reps_prescribed,
                order_in_session=se.order_in_session,
            )
        )

    return ProgramDetailOut(
        id=program.id,
        name=program.name,
        description=program.description,
        sessions=[
            ProgramSessionOut(
                id=s.id,
                name=s.name,
                position=s.position,
                exercises=se_by_session[s.id],
            )
            for s in sessions
        ],
    )
