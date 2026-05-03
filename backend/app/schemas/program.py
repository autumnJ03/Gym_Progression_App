from pydantic import BaseModel


class ExerciseOut(BaseModel):
    id: int
    name: str
    muscle_group: str

    model_config = {"from_attributes": True}


class SessionExerciseOut(BaseModel):
    id: int
    exercise: ExerciseOut
    sets_prescribed: int
    reps_prescribed: int
    order_in_session: int

    model_config = {"from_attributes": True}


class ProgramSessionOut(BaseModel):
    id: int
    name: str
    position: int
    exercises: list[SessionExerciseOut]

    model_config = {"from_attributes": True}


class ProgramOut(BaseModel):
    id: int
    name: str
    description: str

    model_config = {"from_attributes": True}


class ProgramDetailOut(ProgramOut):
    sessions: list[ProgramSessionOut]
