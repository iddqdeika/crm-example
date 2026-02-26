"""PostgreSQL connection and session factory."""
from collections.abc import AsyncGenerator
from sqlalchemy.ext.asyncio import (
    AsyncSession,
    async_sessionmaker,
    create_async_engine,
)
from sqlalchemy.orm import sessionmaker

from core.settings import get_settings
from models.base import Base
from models.user import User  # noqa: F401 - register model
from models.session import AuthenticationSession  # noqa: F401 - register model
from models.profile import Profile  # noqa: F401 - register model
from models.avatar import Avatar  # noqa: F401 - register model

_settings = get_settings()
engine = create_async_engine(
    _settings.database_url,
    echo=_settings.app_env == "development",
    pool_pre_ping=True,
)
async_session_factory: async_sessionmaker[AsyncSession] = async_sessionmaker(
    engine,
    class_=AsyncSession,
    expire_on_commit=False,
    autocommit=False,
    autoflush=False,
)


async def get_db() -> AsyncGenerator[AsyncSession, None]:
    async with async_session_factory() as session:
        try:
            yield session
            await session.commit()
        except Exception:
            await session.rollback()
            raise
        finally:
            await session.close()
