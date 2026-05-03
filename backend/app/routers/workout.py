from fastapi import APIRouter, Depends

from app.auth.dependencies import get_current_user_id

router = APIRouter()


@router.post("/{workout_log_id}/sets")
async def log_set(workout_log_id: int, user_id: int = Depends(get_current_user_id)):
    # TODO: validate ownership, insert set_log, compute hit
    raise NotImplementedError


@router.post("/{workout_log_id}/complete")
async def complete_workout(workout_log_id: int, user_id: int = Depends(get_current_user_id)):
    # TODO: mark completed, run progression engine, advance next_session_position
    raise NotImplementedError
