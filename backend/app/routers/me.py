from datetime import datetime, timezone

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy import func, select, update
from sqlalchemy.ext.asyncio import AsyncSession

from app.auth.dependencies import get_current_user_id
from app.database import get_db
from app.models.program import Program
from app.models.user_exercise_state import UserExerciseState
from app.models.workout_log import WorkoutLog
from app.repositories import session as session_repo
from app.repositories import user_program as user_program_repo
from app.repositories import workout as workout_repo
from app.schemas.workout import EnrollRequest, EnrollmentOut, TodaySessionOut, UserStatusOut
from app.services.progression import apply_return_reduction

router = APIRouter()


@router.post("/program", response_model=EnrollmentOut, status_code=status.HTTP_201_CREATED)
async def enroll(
    body: EnrollRequest,
    user_id: int = Depends(get_current_user_id),
    db: AsyncSession = Depends(get_db),
):
    existing = await user_program_repo.get_active(db, user_id)
    if existing:
        raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail="Already enrolled in a program")

    program = await db.get(Program, body.program_id)
    if not program:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Program not found")

    up = await user_program_repo.enroll(db, user_id, body.program_id)
    return EnrollmentOut(id=up.id, program_id=up.program_id, next_session_position=up.next_session_position)


@router.get("/program", response_model=EnrollmentOut)
async def get_enrollment(
    user_id: int = Depends(get_current_user_id),
    db: AsyncSession = Depends(get_db),
):
    up = await user_program_repo.get_active(db, user_id)
    if not up:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="No active program")
    return EnrollmentOut(id=up.id, program_id=up.program_id, next_session_position=up.next_session_position)


@router.delete("/program", status_code=status.HTTP_204_NO_CONTENT)
async def unenroll(
    user_id: int = Depends(get_current_user_id),
    db: AsyncSession = Depends(get_db),
):
    up = await user_program_repo.get_active(db, user_id)
    if not up:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="No active program")
    await user_program_repo.unenroll(db, up)


@router.get("/session/today", response_model=TodaySessionOut)
async def today_session(
    user_id: int = Depends(get_current_user_id),
    db: AsyncSession = Depends(get_db),
):
    up = await user_program_repo.get_active(db, user_id)
    if not up:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="No active program")

    program_session, exercises = await session_repo.get_today_data(db, up)
    in_progress = await workout_repo.get_in_progress(db, up.id)

    return TodaySessionOut(
        workout_log_id=in_progress.id if in_progress else None,
        session_name=program_session.name,
        exercises=exercises,
    )


@router.post("/session/today/start")
async def start_session(
    user_id: int = Depends(get_current_user_id),
    db: AsyncSession = Depends(get_db),
):
    up = await user_program_repo.get_active(db, user_id)
    if not up:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="No active program")

    in_progress = await workout_repo.get_in_progress(db, up.id)
    if in_progress:
        return {"workout_log_id": in_progress.id}

    program_session, _ = await session_repo.get_today_data(db, up)
    log = await workout_repo.start(db, up.id, program_session.id)
    return {"workout_log_id": log.id}


@router.get("/status", response_model=UserStatusOut)
async def user_status(
    user_id: int = Depends(get_current_user_id),
    db: AsyncSession = Depends(get_db),
):
    up = await user_program_repo.get_active(db, user_id)
    if not up:
        return UserStatusOut(days_idle=None, show_return_prompt=False)

    last_completed = (
        await db.execute(
            select(func.max(WorkoutLog.completed_at)).where(
                WorkoutLog.user_program_id == up.id,
                WorkoutLog.completed_at != None,
            )
        )
    ).scalar_one()

    if last_completed is None:
        return UserStatusOut(days_idle=None, show_return_prompt=False)

    days_idle = (datetime.now(timezone.utc) - last_completed.replace(tzinfo=timezone.utc)).days
    return UserStatusOut(days_idle=days_idle, show_return_prompt=days_idle > 30)


@router.post("/accept-return-reduction", status_code=status.HTTP_200_OK)
async def accept_return_reduction(
    user_id: int = Depends(get_current_user_id),
    db: AsyncSession = Depends(get_db),
):
    up = await user_program_repo.get_active(db, user_id)
    if not up:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="No active program")

    states = (
        await db.execute(
            select(UserExerciseState).where(UserExerciseState.user_program_id == up.id)
        )
    ).scalars().all()

    for state in states:
        state.current_weight = apply_return_reduction(state.current_weight)

    await db.commit()
    return {"status": "reduced"}
