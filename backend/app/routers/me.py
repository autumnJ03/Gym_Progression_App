from fastapi import APIRouter, Depends

from app.auth.dependencies import get_current_user_id

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


@router.get("/session/today")
async def today_session(user_id: int = Depends(get_current_user_id)):
    # TODO: return next session with current weights
    raise NotImplementedError


@router.post("/session/today/start")
async def start_session(user_id: int = Depends(get_current_user_id)):
    # TODO: create workout_log, return workout_log_id
    raise NotImplementedError


@router.get("/status")
async def user_status(user_id: int = Depends(get_current_user_id)):
    # TODO: compute days_idle from MAX(completed_at)
    raise NotImplementedError


@router.post("/accept-return-reduction")
async def accept_return_reduction(user_id: int = Depends(get_current_user_id)):
    # TODO: apply 10% deload to all exercises in active program
    raise NotImplementedError
