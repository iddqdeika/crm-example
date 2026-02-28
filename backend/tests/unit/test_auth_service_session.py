"""Unit tests for session creation, touch, and Redis cache integration in auth_service."""
import uuid
from datetime import datetime, timedelta
from unittest.mock import AsyncMock, MagicMock, patch

import pytest

from core.settings import Settings
from core.session_cache import FakeSessionCache, SessionCacheEntry
from models.session import AuthenticationSession
from services.auth_service import create_session, touch_session


def _make_settings(**overrides) -> Settings:
    base = dict(
        database_url="sqlite+aiosqlite:///:memory:",
        secret_key="test-secret-key-32-characters-long",
        session_inactivity_timeout_seconds=1800,
        session_max_lifetime_seconds=28800,
        session_warning_seconds=300,
        redis_url="redis://localhost:6379",
    )
    base.update(overrides)
    return Settings(**base)


@pytest.fixture
def fake_cache() -> FakeSessionCache:
    return FakeSessionCache()


@pytest.fixture
def mock_db():
    db = AsyncMock()
    db.add = MagicMock()
    db.flush = AsyncMock()
    return db


@pytest.mark.asyncio
async def test_create_session_sets_absolute_expires_at(mock_db, fake_cache) -> None:
    """T014: create_session sets absolute_expires_at = created_at + max_lifetime."""
    settings = _make_settings(
        session_inactivity_timeout_seconds=300,
        session_max_lifetime_seconds=3600,
    )
    before = datetime.utcnow()
    session = await create_session(
        mock_db, uuid.uuid4(), settings=settings, session_cache=fake_cache
    )
    after = datetime.utcnow()

    assert session.absolute_expires_at is not None
    assert session.expires_at is not None

    inactivity_delta = session.expires_at - before
    assert timedelta(seconds=299) <= inactivity_delta <= timedelta(seconds=301) + (after - before)

    absolute_delta = session.absolute_expires_at - before
    assert timedelta(seconds=3599) <= absolute_delta <= timedelta(seconds=3601) + (after - before)


@pytest.mark.asyncio
async def test_create_session_caches_in_redis(mock_db, fake_cache) -> None:
    """T014b: create_session populates the session cache."""
    settings = _make_settings()
    session = await create_session(
        mock_db, uuid.uuid4(), settings=settings, session_cache=fake_cache
    )
    cached = await fake_cache.get(session.id)
    assert cached is not None
    assert cached.user_id == session.user_id


@pytest.mark.asyncio
async def test_touch_session_extends_inactivity_deadline(fake_cache) -> None:
    """T015: touch_session updates expires_at to now + inactivity_timeout."""
    settings = _make_settings(session_inactivity_timeout_seconds=600)
    sid = uuid.uuid4()
    now = datetime.utcnow()
    entry = SessionCacheEntry(
        user_id=uuid.uuid4(),
        inactivity_exp=now + timedelta(seconds=100),
        absolute_exp=now + timedelta(seconds=28800),
        is_revoked=False,
    )
    await fake_cache.set_entry(sid, entry)

    session = AuthenticationSession(
        id=sid,
        user_id=entry.user_id,
        created_at=now - timedelta(seconds=60),
        expires_at=now + timedelta(seconds=100),
        absolute_expires_at=now + timedelta(seconds=28800),
    )

    before_touch = datetime.utcnow()
    new_exp = await touch_session(session, fake_cache, settings=settings)
    after_touch = datetime.utcnow()

    expected_min = before_touch + timedelta(seconds=599)
    expected_max = after_touch + timedelta(seconds=601)
    assert expected_min <= new_exp <= expected_max

    cached = await fake_cache.get(sid)
    assert cached is not None
    assert cached.inactivity_exp == new_exp


@pytest.mark.asyncio
async def test_touch_session_respects_absolute_cap(fake_cache) -> None:
    """T016: touch_session never extends expires_at beyond absolute_expires_at."""
    settings = _make_settings(session_inactivity_timeout_seconds=600)
    sid = uuid.uuid4()
    now = datetime.utcnow()
    absolute_cap = now + timedelta(seconds=10)

    entry = SessionCacheEntry(
        user_id=uuid.uuid4(),
        inactivity_exp=now + timedelta(seconds=5),
        absolute_exp=absolute_cap,
        is_revoked=False,
    )
    await fake_cache.set_entry(sid, entry)

    session = AuthenticationSession(
        id=sid,
        user_id=entry.user_id,
        created_at=now - timedelta(seconds=28790),
        expires_at=now + timedelta(seconds=5),
        absolute_expires_at=absolute_cap,
    )

    new_exp = await touch_session(session, fake_cache, settings=settings)
    assert new_exp <= absolute_cap


@pytest.mark.asyncio
async def test_get_current_session_checks_redis_first(fake_cache) -> None:
    """T017: get_current_session uses cache; DB should not be queried on cache hit."""
    from core.auth import _validate_session_from_cache

    sid = uuid.uuid4()
    now = datetime.utcnow()
    entry = SessionCacheEntry(
        user_id=uuid.uuid4(),
        inactivity_exp=now + timedelta(seconds=300),
        absolute_exp=now + timedelta(seconds=3600),
        is_revoked=False,
    )
    await fake_cache.set_entry(sid, entry)

    result = await _validate_session_from_cache(sid, fake_cache)
    assert result is not None
    assert result.user_id == entry.user_id
    assert result.is_revoked is False


@pytest.mark.asyncio
async def test_validate_session_cache_returns_none_on_miss(fake_cache) -> None:
    """T018: _validate_session_from_cache returns None on cache miss."""
    from core.auth import _validate_session_from_cache

    result = await _validate_session_from_cache(uuid.uuid4(), fake_cache)
    assert result is None


@pytest.mark.asyncio
async def test_validate_session_cache_returns_none_when_revoked(fake_cache) -> None:
    """T018b: _validate_session_from_cache returns None for revoked entries."""
    from core.auth import _validate_session_from_cache

    sid = uuid.uuid4()
    now = datetime.utcnow()
    entry = SessionCacheEntry(
        user_id=uuid.uuid4(),
        inactivity_exp=now + timedelta(seconds=300),
        absolute_exp=now + timedelta(seconds=3600),
        is_revoked=True,
    )
    await fake_cache.set_entry(sid, entry)

    result = await _validate_session_from_cache(sid, fake_cache)
    assert result is None


@pytest.mark.asyncio
async def test_validate_session_cache_returns_none_when_inactivity_expired(fake_cache) -> None:
    """T018c: _validate_session_from_cache returns None when inactivity_exp is in the past."""
    from core.auth import _validate_session_from_cache

    sid = uuid.uuid4()
    now = datetime.utcnow()
    entry = SessionCacheEntry(
        user_id=uuid.uuid4(),
        inactivity_exp=now - timedelta(seconds=1),
        absolute_exp=now + timedelta(seconds=3600),
        is_revoked=False,
    )
    await fake_cache.set_entry(sid, entry)

    result = await _validate_session_from_cache(sid, fake_cache)
    assert result is None


@pytest.mark.asyncio
async def test_validate_session_cache_returns_none_when_absolute_expired(fake_cache) -> None:
    """T018d: _validate_session_from_cache returns None when absolute_exp is in the past."""
    from core.auth import _validate_session_from_cache

    sid = uuid.uuid4()
    now = datetime.utcnow()
    entry = SessionCacheEntry(
        user_id=uuid.uuid4(),
        inactivity_exp=now + timedelta(seconds=300),
        absolute_exp=now - timedelta(seconds=1),
        is_revoked=False,
    )
    await fake_cache.set_entry(sid, entry)

    result = await _validate_session_from_cache(sid, fake_cache)
    assert result is None
