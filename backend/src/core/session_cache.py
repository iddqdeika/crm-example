"""Session cache: Redis-backed and in-memory fake implementations."""
from __future__ import annotations

import uuid
from dataclasses import dataclass, field
from datetime import datetime, timedelta
from typing import Protocol

from fastapi import Depends

from core.settings import Settings, get_settings


@dataclass
class SessionCacheEntry:
    user_id: uuid.UUID
    inactivity_exp: datetime
    absolute_exp: datetime
    is_revoked: bool = False
    last_db_sync: datetime | None = None


class SessionCache(Protocol):
    async def get(self, session_id: uuid.UUID) -> SessionCacheEntry | None:
        """Return cached session entry or None on cache miss / Redis unavailable."""
        ...

    async def set_entry(self, session_id: uuid.UUID, entry: SessionCacheEntry) -> None:
        """Write entry to cache with TTL = inactivity_timeout_seconds."""
        ...

    async def touch(self, session_id: uuid.UUID, new_inactivity_exp: datetime) -> bool:
        """
        Refresh TTL and update inactivity_exp.
        Returns True if key existed, False if missing (treat as expired).
        """
        ...

    async def revoke(self, session_id: uuid.UUID) -> None:
        """Mark session as revoked with a short drain TTL (60 s)."""
        ...


class RedisSessionCache:
    """Concrete SessionCache backed by Redis hashes."""

    def __init__(self, redis_url: str, inactivity_timeout_seconds: int) -> None:
        import redis.asyncio as aioredis

        self._client: aioredis.Redis = aioredis.from_url(redis_url, decode_responses=True)
        self._ttl = inactivity_timeout_seconds

    @staticmethod
    def _key(session_id: uuid.UUID) -> str:
        return f"session:{session_id}"

    async def get(self, session_id: uuid.UUID) -> SessionCacheEntry | None:
        try:
            data: dict[str, str] = await self._client.hgetall(self._key(session_id))
        except Exception:
            return None
        if not data:
            return None
        last_sync_raw = data.get("last_db_sync")
        return SessionCacheEntry(
            user_id=uuid.UUID(data["user_id"]),
            inactivity_exp=datetime.utcfromtimestamp(int(data["inactivity_exp"])),
            absolute_exp=datetime.utcfromtimestamp(int(data["absolute_exp"])),
            is_revoked=data.get("is_revoked", "0") == "1",
            last_db_sync=datetime.utcfromtimestamp(int(last_sync_raw)) if last_sync_raw else None,
        )

    async def set_entry(self, session_id: uuid.UUID, entry: SessionCacheEntry) -> None:
        try:
            mapping = {
                "user_id": str(entry.user_id),
                "inactivity_exp": str(int(entry.inactivity_exp.timestamp())),
                "absolute_exp": str(int(entry.absolute_exp.timestamp())),
                "is_revoked": "1" if entry.is_revoked else "0",
            }
            if entry.last_db_sync:
                mapping["last_db_sync"] = str(int(entry.last_db_sync.timestamp()))
            key = self._key(session_id)
            await self._client.hset(key, mapping=mapping)
            await self._client.expire(key, self._ttl)
        except Exception:
            pass

    async def touch(self, session_id: uuid.UUID, new_inactivity_exp: datetime) -> bool:
        try:
            key = self._key(session_id)
            exists = await self._client.exists(key)
            if not exists:
                return False
            await self._client.hset(
                key,
                mapping={
                    "inactivity_exp": str(int(new_inactivity_exp.timestamp())),
                    "last_db_sync": str(int(datetime.utcnow().timestamp())),
                },
            )
            await self._client.expire(key, self._ttl)
            return True
        except Exception:
            return False

    async def revoke(self, session_id: uuid.UUID) -> None:
        try:
            key = self._key(session_id)
            await self._client.hset(key, "is_revoked", "1")
            await self._client.expire(key, 60)
        except Exception:
            pass


@dataclass
class FakeSessionCache:
    """In-memory SessionCache for tests. No Redis connection required."""

    _store: dict[uuid.UUID, SessionCacheEntry] = field(default_factory=dict)

    async def get(self, session_id: uuid.UUID) -> SessionCacheEntry | None:
        return self._store.get(session_id)

    async def set_entry(self, session_id: uuid.UUID, entry: SessionCacheEntry) -> None:
        self._store[session_id] = entry

    async def touch(self, session_id: uuid.UUID, new_inactivity_exp: datetime) -> bool:
        if session_id not in self._store:
            return False
        self._store[session_id].inactivity_exp = new_inactivity_exp
        self._store[session_id].last_db_sync = datetime.utcnow()
        return True

    async def revoke(self, session_id: uuid.UUID) -> None:
        if session_id in self._store:
            self._store[session_id].is_revoked = True


_cache_instance: RedisSessionCache | None = None


def get_session_cache(settings: Settings = Depends(get_settings)) -> RedisSessionCache:
    global _cache_instance
    if _cache_instance is None:
        _cache_instance = RedisSessionCache(
            redis_url=settings.redis_url,
            inactivity_timeout_seconds=settings.session_inactivity_timeout_seconds,
        )
    return _cache_instance
