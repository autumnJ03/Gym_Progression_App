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


class UpdateSetRequest(BaseModel):
    weight_used: Decimal
    reps_completed: int


class SetLogOut(BaseModel):
    id: int
    session_exercise_id: int
    set_number: int
    weight_used: float
    reps_completed: int
    hit: bool


class UserStatusOut(BaseModel):
    days_idle: int | None
    show_return_prompt: bool


class ProgressPointOut(BaseModel):
    date: str
    weight: float


class ExerciseProgressOut(BaseModel):
    exercise_name: str
    history: list[ProgressPointOut]


class EnrollRequest(BaseModel):
    program_id: int


class EnrollmentOut(BaseModel):
    id: int
    program_id: int
    next_session_position: int
