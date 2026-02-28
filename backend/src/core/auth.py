"""Session-based auth: cookie validation and get_current_user dependency."""
from datetime import datetime
from uuid import UUID

from fastapi import Depends, HTTPException, status
from fastapi.security import APIKeyCookie
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from core.database import get_db
from core.session_cache import FakeSessionCache, SessionCache, SessionCacheEntry, get_session_cache
from core.settings import get_settings
from models.session import AuthenticationSession
from models.user import User

_settings = get_settings()
cookie_scheme = APIKeyCookie(name=_settings.session_cookie_name, auto_error=False)


async def _validate_session_from_cache(
    session_id: UUID,
    cache: SessionCache,
) -> SessionCacheEntry | None:
    """Return valid cache entry, or None if missing/expired/revoked."""
    entry = await cache.get(session_id)
    if entry is None:
        return None
    now = datetime.utcnow()
    if entry.is_revoked:
        return None
    if entry.inactivity_exp <= now:
        return None
    if entry.absolute_exp <= now:
        return None
    return entry


async def get_current_session(
    db: AsyncSession = Depends(get_db),
    session_id: str | None = Depends(cookie_scheme),
    cache: SessionCache = Depends(get_session_cache),
) -> AuthenticationSession:
    if not session_id:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Not authenticated",
        )
    try:
        sid = UUID(session_id)
    except ValueError:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid session",
        )

    # Try Redis cache first
    cache_entry = await _validate_session_from_cache(sid, cache)
    if cache_entry is not None:
        # Build a lightweight AuthenticationSession from cache data (avoids DB round-trip)
        session = AuthenticationSession(
            id=sid,
            user_id=cache_entry.user_id,
            expires_at=cache_entry.inactivity_exp,
            absolute_expires_at=cache_entry.absolute_exp,
        )
        return session

    # Cache miss — fall back to DB
    now = datetime.utcnow()
    result = await db.execute(
        select(AuthenticationSession)
        .where(AuthenticationSession.id == sid)
        .where(AuthenticationSession.revoked_at.is_(None))
        .where(AuthenticationSession.expires_at > now)
        .where(AuthenticationSession.absolute_expires_at > now)
    )
    session = result.scalar_one_or_none()
    if not session:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Session expired or invalid",
        )

    # Re-populate cache on DB hit
    from core.session_cache import SessionCacheEntry as SCE

    entry = SCE(
        user_id=session.user_id,
        inactivity_exp=session.expires_at,
        absolute_exp=session.absolute_expires_at,
    )
    await cache.set_entry(sid, entry)

    return session


async def get_current_user(
    session: AuthenticationSession = Depends(get_current_session),
    db: AsyncSession = Depends(get_db),
) -> User:
    user_result = await db.execute(select(User).where(User.id == session.user_id))
    user = user_result.scalar_one_or_none()
    if not user or not user.is_active:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="User not found or inactive",
        )
    return user
