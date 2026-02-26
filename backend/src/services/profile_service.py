"""Profile service: get current user profile with avatar_url."""
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from models.avatar import Avatar
from models.profile import Profile
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


def _avatar_url(profile: Profile, base_url: str = "") -> str | None:
    if not profile.avatar_id:
        return None
    return f"{base_url.rstrip('/')}/me/avatar/{profile.avatar_id}/image"


async def get_profile_for_response(
    db: AsyncSession, user: User, base_url: str = ""
) -> dict:
    """Return profile dict with id, display_name, email, avatar_url, role for GET /me/profile."""
    profile = await get_or_create_profile(db, user)
    return {
        "id": str(profile.id),
        "display_name": profile.display_name,
        "email": profile.email,
        "avatar_url": _avatar_url(profile, base_url),
        "role": user.role.value,
    }
