import re
import ssl

from sqlalchemy.ext.asyncio import AsyncSession, async_sessionmaker, create_async_engine
from sqlalchemy.orm import DeclarativeBase

from app.config import settings


def _make_engine():
    url = settings.database_url
    kwargs: dict = {}
    # asyncpg doesn't accept sslmode/channel_binding in the URL — strip them
    # and pass ssl via connect_args instead
    if "sslmode" in url or "channel_binding" in url:
        url = re.sub(r"[?&](sslmode|channel_binding)=[^&]*", "", url)
        url = url.rstrip("?&")
        ctx = ssl.create_default_context()
        kwargs["connect_args"] = {"ssl": ctx}
    return create_async_engine(url, echo=False, **kwargs)


engine = _make_engine()
AsyncSessionLocal = async_sessionmaker(engine, expire_on_commit=False)


class Base(DeclarativeBase):
    pass


async def get_db():
    async with AsyncSessionLocal() as session:
        yield session
