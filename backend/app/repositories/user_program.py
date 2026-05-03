from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.program import Program
from app.models.user_program import UserProgram


async def get_active(db: AsyncSession, user_id: int) -> UserProgram | None:
    result = await db.execute(
        select(UserProgram).where(
            UserProgram.user_id == user_id,
            UserProgram.is_active == True,
        )
    )
    return result.scalar_one_or_none()


async def enroll(db: AsyncSession, user_id: int, program_id: int) -> UserProgram:
    up = UserProgram(user_id=user_id, program_id=program_id, next_session_position=1, is_active=True)
    db.add(up)
    await db.commit()
    await db.refresh(up)
    return up


async def unenroll(db: AsyncSession, up: UserProgram) -> None:
    up.is_active = False
    await db.commit()
