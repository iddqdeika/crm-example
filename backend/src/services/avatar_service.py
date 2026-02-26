"""Avatar upload/remove: store file metadata, update profile.avatar_id."""
import uuid
from pathlib import Path

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from models.avatar import Avatar
from models.profile import Profile
from models.user import User

ALLOWED_CONTENT_TYPES = {"image/jpeg", "image/png", "image/gif", "image/webp"}
MAX_SIZE_BYTES = 5 * 1024 * 1024  # 5 MB


async def upload_avatar(
    db: AsyncSession,
    user: User,
    file_content: bytes,
    content_type: str,
    filename: str,
) -> Avatar:
    """Store avatar file and create Avatar record; link to user's profile."""
    if content_type not in ALLOWED_CONTENT_TYPES:
        raise ValueError("Unsupported image type")
    if len(file_content) > MAX_SIZE_BYTES:
        raise ValueError("File too large")
    storage_dir = Path("uploads")
    storage_dir.mkdir(parents=True, exist_ok=True)
    ext = ".jpg" if "jpeg" in content_type else ".png" if "png" in content_type else ".bin"
    storage_path = str(storage_dir / f"{user.id}_{uuid.uuid4().hex}{ext}")
    Path(storage_path).write_bytes(file_content)
    avatar = Avatar(
        user_id=user.id,
        storage_path=storage_path,
        content_type=content_type,
        file_size_bytes=len(file_content),
    )
    db.add(avatar)
    await db.flush()
    result = await db.execute(select(Profile).where(Profile.user_id == user.id))
    profile = result.scalar_one_or_none()
    if profile:
        profile.avatar_id = avatar.id
        await db.flush()
    return avatar


def avatar_url_for(avatar: Avatar | None, request_base_url: str = "") -> str | None:
    """Return URL to serve avatar image (placeholder: base + path)."""
    if not avatar:
        return None
    return f"{request_base_url.rstrip('/')}/me/avatar/{avatar.id}/image"


async def remove_avatar(db: AsyncSession, user: User) -> None:
    """Clear profile.avatar_id for user (avatar record can remain for audit)."""
    result = await db.execute(select(Profile).where(Profile.user_id == user.id))
    profile = result.scalar_one_or_none()
    if profile and profile.avatar_id:
        profile.avatar_id = None
        await db.flush()
