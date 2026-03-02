"""Pytest fixtures: test client and DB."""
import asyncio
from collections.abc import AsyncGenerator, Generator
from typing import Any

import pytest
import pytest_asyncio
from httpx import ASGITransport, AsyncClient
from sqlalchemy.ext.asyncio import AsyncSession, async_sessionmaker, create_async_engine

from app.main import app
from core.database import get_db
from core.session_cache import FakeSessionCache, get_session_cache
from models.base import Base
from models.ad_group import AdGroup  # noqa: F401 - register for create_all
from models.campaign import Campaign  # noqa: F401 - register for create_all
from models.column_config import ColumnConfiguration  # noqa: F401 - register for create_all
from models.creative import Creative  # noqa: F401 - register for create_all

TEST_DATABASE_URL = "sqlite+aiosqlite:///:memory:"


@pytest.fixture(scope="session")
def event_loop() -> Generator[asyncio.AbstractEventLoop, None, None]:
    loop = asyncio.get_event_loop_policy().new_event_loop()
    yield loop
    loop.close()


@pytest_asyncio.fixture
async def engine():
    eng = create_async_engine(TEST_DATABASE_URL, echo=False)
    async with eng.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)
    yield eng
    await eng.dispose()


@pytest_asyncio.fixture
async def db_session(engine) -> AsyncGenerator[AsyncSession, None]:
    factory = async_sessionmaker(
        engine, class_=AsyncSession, expire_on_commit=False, autocommit=False, autoflush=False
    )
    async with factory() as session:
        yield session


@pytest_asyncio.fixture
def fake_cache() -> FakeSessionCache:
    return FakeSessionCache()


@pytest_asyncio.fixture
async def client(db_session: AsyncSession, fake_cache: FakeSessionCache) -> AsyncGenerator[AsyncClient, None]:
    async def override_get_db() -> AsyncGenerator[AsyncSession, None]:
        yield db_session

    def override_get_session_cache() -> FakeSessionCache:
        return fake_cache

    app.dependency_overrides[get_db] = override_get_db
    app.dependency_overrides[get_session_cache] = override_get_session_cache
    async with AsyncClient(
        transport=ASGITransport(app=app),
        base_url="http://test",
    ) as ac:
        yield ac
    app.dependency_overrides.clear()


@pytest_asyncio.fixture
async def admin_user(db_session: AsyncSession) -> tuple[str, str]:
    """Create an admin user in the test DB; returns (email, password)."""
    from models.user import User, UserRole
    from services.auth_service import hash_password

    u = User(
        email="admin@test.com",
        hashed_password=hash_password("AdminPass1!"),
        display_name="Admin",
        role=UserRole.admin,
    )
    db_session.add(u)
    await db_session.flush()
    return ("admin@test.com", "AdminPass1!")


@pytest_asyncio.fixture
async def admin_client(client: AsyncClient, admin_user: tuple[str, str]) -> AsyncClient:
    """Client with session authenticated as admin."""
    email, password = admin_user
    await client.post("/api/auth/login", json={"email": email, "password": password})
    return client
