"""Avatar upload/remove: store file via StorageClient, update profile.avatar_id."""
import uuid

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from core.storage import StorageClient, media_key
from models.avatar import Avatar
from models.user import User
from services.profile_service import get_or_create_profile

ALLOWED_CONTENT_TYPES = {"image/jpeg", "image/png", "image/gif", "image/webp"}
MAX_SIZE_BYTES = 5 * 1024 * 1024  # 5 MB

_EXT_MAP = {
    "image/jpeg": ".jpg",
    "image/png": ".png",
    "image/gif": ".gif",
    "image/webp": ".webp",
}


async def upload_avatar(
    db: AsyncSession,
    user: User,
    file_content: bytes,
    content_type: str,
    filename: str,  # noqa: ARG001
    *,
    storage_client: StorageClient,
) -> Avatar:
    """Store avatar via StorageClient and link to user's profile."""
    if content_type not in ALLOWED_CONTENT_TYPES:
        raise ValueError("Unsupported image type")
    if len(file_content) > MAX_SIZE_BYTES:
        raise ValueError("File too large")

    ext = _EXT_MAP.get(content_type, ".bin")
    avatar_id = uuid.uuid4()
    key = media_key("avatars", user.id, avatar_id, ext)

    # Ensure profile exists; delete existing avatar from storage before replacing.
    profile = await get_or_create_profile(db, user)
    if profile.avatar_id:
        old_result = await db.execute(select(Avatar).where(Avatar.id == profile.avatar_id))
        old_avatar = old_result.scalar_one_or_none()
        if old_avatar:
            await storage_client.delete_object(old_avatar.storage_path)

    await storage_client.put_object(key, file_content, content_type)

    avatar = Avatar(
        id=avatar_id,
        user_id=user.id,
        storage_path=key,
        content_type=content_type,
        file_size_bytes=len(file_content),
    )
    db.add(avatar)
    await db.flush()

    profile.avatar_id = avatar.id
    await db.flush()

    return avatar


async def remove_avatar(
    db: AsyncSession,
    user: User,
    *,
    storage_client: StorageClient,
) -> None:
    """Delete avatar from storage and clear profile.avatar_id."""
    profile = await get_or_create_profile(db, user)
    if profile.avatar_id:
        old_result = await db.execute(select(Avatar).where(Avatar.id == profile.avatar_id))
        old_avatar = old_result.scalar_one_or_none()
        if old_avatar:
            await storage_client.delete_object(old_avatar.storage_path)
        profile.avatar_id = None
        await db.flush()
