"""Session-based auth: cookie validation and get_current_user dependency."""
from datetime import datetime
from uuid import UUID

from fastapi import Depends, HTTPException, status
from fastapi.security import APIKeyCookie
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from core.database import get_db
from core.settings import get_settings
from models.session import AuthenticationSession
from models.user import User

_settings = get_settings()
cookie_scheme = APIKeyCookie(name=_settings.session_cookie_name, auto_error=False)


async def get_current_session(
    db: AsyncSession = Depends(get_db),
    session_id: str | None = Depends(cookie_scheme),
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
    result = await db.execute(
        select(AuthenticationSession)
        .where(AuthenticationSession.id == sid)
        .where(AuthenticationSession.revoked_at.is_(None))
        .where(AuthenticationSession.expires_at > datetime.utcnow())
    )
    session = result.scalar_one_or_none()
    if not session:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Session expired or invalid",
        )
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
