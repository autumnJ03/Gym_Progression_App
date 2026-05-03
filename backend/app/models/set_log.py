from decimal import Decimal

from sqlalchemy import ForeignKey, Numeric
from sqlalchemy.orm import Mapped, mapped_column

from app.database import Base


class SetLog(Base):
    __tablename__ = "set_logs"

    id: Mapped[int] = mapped_column(primary_key=True)
    workout_log_id: Mapped[int] = mapped_column(ForeignKey("workout_logs.id"))
    session_exercise_id: Mapped[int] = mapped_column(ForeignKey("session_exercises.id"))
    set_number: Mapped[int]
    weight_used: Mapped[Decimal] = mapped_column(Numeric(6, 2))
    reps_completed: Mapped[int]
    hit: Mapped[bool]
