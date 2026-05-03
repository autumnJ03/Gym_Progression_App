from datetime import datetime
from decimal import Decimal

from pydantic import BaseModel


class TodayExerciseOut(BaseModel):
    session_exercise_id: int
    exercise_name: str
    sets_prescribed: int
    reps_prescribed: int
    current_weight: Decimal
    order_in_session: int


class TodaySessionOut(BaseModel):
    workout_log_id: int | None
    session_name: str
    exercises: list[TodayExerciseOut]


class LogSetRequest(BaseModel):
    session_exercise_id: int
    set_number: int
    weight_used: Decimal
    reps_completed: int


class UserStatusOut(BaseModel):
    days_idle: int | None
    show_return_prompt: bool
