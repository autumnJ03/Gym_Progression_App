from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession

from app.auth.dependencies import get_current_user_id
from app.database import get_db
from app.repositories import workout as workout_repo
from app.schemas.workout import LogSetRequest, SetLogOut, UpdateSetRequest
from app.services import workout as workout_service

router = APIRouter()


@router.post("/{workout_log_id}/sets", status_code=status.HTTP_201_CREATED)
async def log_set(
    workout_log_id: int,
    body: LogSetRequest,
    user_id: int = Depends(get_current_user_id),
    db: AsyncSession = Depends(get_db),
):
    log = await workout_repo.get_by_id_for_user(db, workout_log_id, user_id)
    if not log:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Workout not found")
    if log.completed_at:
        raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail="Workout already completed")

    se = await workout_repo.get_session_exercise(db, body.session_exercise_id, log.session_id)
    if not se:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Exercise not in this session")

    entry = await workout_repo.log_set(
        db,
        workout_log_id=workout_log_id,
        session_exercise_id=body.session_exercise_id,
        set_number=body.set_number,
        weight_used=body.weight_used,
        reps_completed=body.reps_completed,
        reps_prescribed=se.reps_prescribed,
    )
    return {"id": entry.id, "hit": entry.hit}


@router.get("/{workout_log_id}/sets", response_model=list[SetLogOut])
async def get_sets(
    workout_log_id: int,
    user_id: int = Depends(get_current_user_id),
    db: AsyncSession = Depends(get_db),
):
    log = await workout_repo.get_by_id_for_user(db, workout_log_id, user_id)
    if not log:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Workout not found")
    sets = await workout_repo.get_sets_for_workout(db, workout_log_id)
    return [
        SetLogOut(
            id=s.id,
            session_exercise_id=s.session_exercise_id,
            set_number=s.set_number,
            weight_used=float(s.weight_used),
            reps_completed=s.reps_completed,
            hit=s.hit,
        )
        for s in sets
    ]


@router.patch("/{workout_log_id}/sets/{set_log_id}")
async def update_set(
    workout_log_id: int,
    set_log_id: int,
    body: UpdateSetRequest,
    user_id: int = Depends(get_current_user_id),
    db: AsyncSession = Depends(get_db),
):
    log = await workout_repo.get_by_id_for_user(db, workout_log_id, user_id)
    if not log:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Workout not found")
    if log.completed_at:
        raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail="Workout already completed")
    entry = await workout_repo.update_set(db, set_log_id, workout_log_id, body.weight_used, body.reps_completed)
    if not entry:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Set not found")
    return {"id": entry.id, "hit": entry.hit}


@router.post("/{workout_log_id}/complete", status_code=status.HTTP_200_OK)
async def complete_workout(
    workout_log_id: int,
    user_id: int = Depends(get_current_user_id),
    db: AsyncSession = Depends(get_db),
):
    await workout_service.complete_workout(db, workout_log_id, user_id)
    return {"status": "completed"}
