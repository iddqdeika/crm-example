"""Auth service: signup, login, password hashing, session creation."""
from datetime import datetime, timedelta
from uuid import UUID

from passlib.context import CryptContext
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from core.session_cache import FakeSessionCache, SessionCache, SessionCacheEntry
from core.settings import Settings, get_settings
from models.session import AuthenticationSession
from models.user import User, UserRole

pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")
_settings = get_settings()


def hash_password(password: str) -> str:
    return pwd_context.hash(password)


def verify_password(plain: str, hashed: str) -> bool:
    return pwd_context.verify(plain, hashed)


async def create_user(
    db: AsyncSession,
    email: str,
    password: str,
    display_name: str,
    role: UserRole = UserRole.standard,
) -> User:
    email_lower = email.lower().strip()
    user = User(
        email=email_lower,
        hashed_password=hash_password(password),
        display_name=display_name.strip(),
        role=role,
    )
    db.add(user)
    await db.flush()
    return user


async def get_user_by_email(db: AsyncSession, email: str) -> User | None:
    result = await db.execute(
        select(User).where(User.email == email.lower().strip())
    )
    return result.scalar_one_or_none()


async def authenticate_user(
    db: AsyncSession, email: str, password: str
) -> User | None:
    user = await get_user_by_email(db, email)
    if not user or not user.is_active:
        return None
    if not verify_password(password, user.hashed_password):
        return None
    return user


async def create_session(
    db: AsyncSession,
    user_id: UUID,
    ip_address: str | None = None,
    user_agent: str | None = None,
    *,
    settings: Settings | None = None,
    session_cache: SessionCache | None = None,
) -> AuthenticationSession:
    cfg = settings or _settings
    now = datetime.utcnow()
    expires_at = now + timedelta(seconds=cfg.session_inactivity_timeout_seconds)
    absolute_expires_at = now + timedelta(seconds=cfg.session_max_lifetime_seconds)
    session = AuthenticationSession(
        user_id=user_id,
        expires_at=expires_at,
        absolute_expires_at=absolute_expires_at,
        ip_address=ip_address,
        user_agent=user_agent,
    )
    db.add(session)
    await db.flush()

    if session_cache is not None:
        entry = SessionCacheEntry(
            user_id=user_id,
            inactivity_exp=expires_at,
            absolute_exp=absolute_expires_at,
        )
        await session_cache.set_entry(session.id, entry)

    return session


async def touch_session(
    session: AuthenticationSession,
    session_cache: SessionCache,
    *,
    settings: Settings | None = None,
) -> datetime:
    """Refresh the inactivity deadline (capped at absolute_expires_at). Returns new expires_at."""
    cfg = settings or _settings
    now = datetime.utcnow()
    new_exp = min(
        now + timedelta(seconds=cfg.session_inactivity_timeout_seconds),
        session.absolute_expires_at,
    )
    session.expires_at = new_exp
    await session_cache.touch(session.id, new_inactivity_exp=new_exp)
    return new_exp


async def change_password(
    db: AsyncSession,
    user_id: UUID,
    current_password: str,
    new_password: str,
) -> bool:
    """Update user password if current password is correct. Returns True on success."""
    result = await db.execute(select(User).where(User.id == user_id))
    user = result.scalar_one_or_none()
    if not user or not verify_password(current_password, user.hashed_password):
        return False
    user.hashed_password = hash_password(new_password)
    await db.flush()
    return True


async def revoke_session(db: AsyncSession, session_id: UUID) -> None:
    result = await db.execute(
        select(AuthenticationSession).where(AuthenticationSession.id == session_id)
    )
    session = result.scalar_one_or_none()
    if session:
        session.revoked_at = datetime.utcnow()
