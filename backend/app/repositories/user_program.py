from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.user_program import UserProgram


async def get_active(db: AsyncSession, user_id: int) -> UserProgram | None:
    result = await db.execute(
        select(UserProgram).where(
            UserProgram.user_id == user_id,
            UserProgram.is_active == True,
        )
    )
    return result.scalar_one_or_none()
