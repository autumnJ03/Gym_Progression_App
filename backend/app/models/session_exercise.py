from decimal import Decimal

from sqlalchemy import ForeignKey, Numeric
from sqlalchemy.orm import Mapped, mapped_column

from app.database import Base


class SessionExercise(Base):
    __tablename__ = "session_exercises"

    id: Mapped[int] = mapped_column(primary_key=True)
    session_id: Mapped[int] = mapped_column(ForeignKey("sessions.id"))
    exercise_id: Mapped[int] = mapped_column(ForeignKey("exercises.id"))
    sets_prescribed: Mapped[int]
    reps_prescribed: Mapped[int]
    default_increment: Mapped[Decimal] = mapped_column(Numeric(5, 2))
    order_in_session: Mapped[int]
