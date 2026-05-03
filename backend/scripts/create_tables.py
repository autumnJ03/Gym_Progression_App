"""Run once to create all tables: python -m scripts.create_tables"""
import asyncio

import app.models  # noqa: F401 — registers all models with Base.metadata
from app.database import Base, engine


async def main() -> None:
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)
    print("Tables created.")
    await engine.dispose()


asyncio.run(main())
