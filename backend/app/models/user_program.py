from datetime import datetime

from sqlalchemy import ForeignKey, func
from sqlalchemy.orm import Mapped, mapped_column

from app.database import Base


class UserProgram(Base):
    __tablename__ = "user_programs"

    id: Mapped[int] = mapped_column(primary_key=True)
    user_id: Mapped[int] = mapped_column(ForeignKey("users.id"))
    program_id: Mapped[int] = mapped_column(ForeignKey("programs.id"))
    next_session_position: Mapped[int] = mapped_column(default=1)
    started_at: Mapped[datetime] = mapped_column(server_default=func.now())
    is_active: Mapped[bool] = mapped_column(default=True)
