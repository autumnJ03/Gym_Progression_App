from decimal import Decimal

from sqlalchemy import ForeignKey, Numeric
from sqlalchemy.orm import Mapped, mapped_column

from app.database import Base


class UserExerciseState(Base):
    __tablename__ = "user_exercise_states"

    user_program_id: Mapped[int] = mapped_column(ForeignKey("user_programs.id"), primary_key=True)
    exercise_id: Mapped[int] = mapped_column(ForeignKey("exercises.id"), primary_key=True)
    current_weight: Mapped[Decimal] = mapped_column(Numeric(6, 2))
    consecutive_misses: Mapped[int] = mapped_column(default=0)
