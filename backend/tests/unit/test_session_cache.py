"""Unit tests for FakeSessionCache — validates the test double before RedisSessionCache."""
import uuid
from datetime import datetime, timedelta

import pytest

from tests.fakes.fake_session_cache import FakeSessionCache, SessionCacheEntry


def _make_entry(
    *,
    user_id: uuid.UUID | None = None,
    inactivity_offset: int = 300,
    absolute_offset: int = 3600,
    is_revoked: bool = False,
) -> SessionCacheEntry:
    now = datetime.utcnow()
    return SessionCacheEntry(
        user_id=user_id or uuid.uuid4(),
        inactivity_exp=now + timedelta(seconds=inactivity_offset),
        absolute_exp=now + timedelta(seconds=absolute_offset),
        is_revoked=is_revoked,
        last_db_sync=None,
    )


@pytest.fixture
def cache() -> FakeSessionCache:
    return FakeSessionCache()


@pytest.mark.asyncio
async def test_get_returns_none_for_unknown_session(cache: FakeSessionCache) -> None:
    result = await cache.get(uuid.uuid4())
    assert result is None


@pytest.mark.asyncio
async def test_set_and_get_round_trip(cache: FakeSessionCache) -> None:
    sid = uuid.uuid4()
    entry = _make_entry()
    await cache.set_entry(sid, entry)
    result = await cache.get(sid)
    assert result is not None
    assert result.user_id == entry.user_id
    assert result.inactivity_exp == entry.inactivity_exp
    assert result.absolute_exp == entry.absolute_exp
    assert result.is_revoked is False


@pytest.mark.asyncio
async def test_touch_updates_inactivity_exp(cache: FakeSessionCache) -> None:
    sid = uuid.uuid4()
    await cache.set_entry(sid, _make_entry(inactivity_offset=60))

    new_exp = datetime.utcnow() + timedelta(seconds=600)
    result = await cache.touch(sid, new_inactivity_exp=new_exp)

    assert result is True
    updated = await cache.get(sid)
    assert updated is not None
    assert updated.inactivity_exp == new_exp


@pytest.mark.asyncio
async def test_touch_on_missing_key_returns_false(cache: FakeSessionCache) -> None:
    result = await cache.touch(uuid.uuid4(), new_inactivity_exp=datetime.utcnow())
    assert result is False


@pytest.mark.asyncio
async def test_revoke_marks_entry_as_revoked(cache: FakeSessionCache) -> None:
    sid = uuid.uuid4()
    await cache.set_entry(sid, _make_entry())
    await cache.revoke(sid)

    entry = await cache.get(sid)
    assert entry is not None
    assert entry.is_revoked is True


@pytest.mark.asyncio
async def test_revoke_on_missing_key_does_not_raise(cache: FakeSessionCache) -> None:
    await cache.revoke(uuid.uuid4())  # should not raise
