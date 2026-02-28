"""Profile service: get current user profile with presigned avatar_url."""
from __future__ import annotations

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from core.storage import StorageClient
from models.avatar import Avatar
from models.profile import Profile
from models.session import AuthenticationSession
from models.user import User


async def get_or_create_profile(db: AsyncSession, user: User) -> Profile:
    """Get profile for user, or create one from user data."""
    result = await db.execute(
        select(Profile).where(Profile.user_id == user.id)
    )
    profile = result.scalar_one_or_none()
    if profile:
        return profile
    profile = Profile(
        user_id=user.id,
        display_name=user.display_name,
        email=user.email,
    )
    db.add(profile)
    await db.flush()
    return profile


async def get_profile_for_response(
    db: AsyncSession,
    user: User,
    *,
    storage: StorageClient,
    session: AuthenticationSession | None = None,
    settings=None,
) -> dict:
    """Return profile dict for GET /me/profile, including session expiry timestamps."""
    profile = await get_or_create_profile(db, user)

    avatar_url: str | None = None
    if profile.avatar_id:
        result = await db.execute(select(Avatar).where(Avatar.id == profile.avatar_id))
        avatar = result.scalar_one_or_none()
        if avatar:
            avatar_url = await storage.get_presigned_url(avatar.storage_path)

    data: dict = {
        "id": str(profile.id),
        "display_name": profile.display_name,
        "email": profile.email,
        "avatar_url": avatar_url,
        "role": user.role.value,
    }

    if session is not None:
        data["session_inactivity_expires_at"] = session.expires_at
        data["session_absolute_expires_at"] = session.absolute_expires_at
        if settings is not None:
            data["session_warning_seconds"] = settings.session_warning_seconds

    return data
