from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession

from app.auth.dependencies import get_current_user_id
from app.database import get_db
from app.repositories import session as session_repo
from app.repositories import user_program as user_program_repo
from app.repositories import workout as workout_repo
from app.schemas.workout import TodaySessionOut

router = APIRouter()


@router.post("/program")
async def enroll(user_id: int = Depends(get_current_user_id)):
    # TODO: enroll user in program
    raise NotImplementedError


@router.get("/program")
async def get_enrollment(user_id: int = Depends(get_current_user_id)):
    # TODO: return active user_program
    raise NotImplementedError


@router.delete("/program")
async def unenroll(user_id: int = Depends(get_current_user_id)):
    # TODO: set is_active=False
    raise NotImplementedError


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


@router.get("/status")
async def user_status(user_id: int = Depends(get_current_user_id)):
    # TODO: compute days_idle from MAX(completed_at)
    raise NotImplementedError


@router.post("/accept-return-reduction")
async def accept_return_reduction(user_id: int = Depends(get_current_user_id)):
    # TODO: apply 10% deload to all exercises in active program
    raise NotImplementedError
