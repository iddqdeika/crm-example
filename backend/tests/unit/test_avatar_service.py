"""Unit tests for avatar_service — TDD: write before refactoring avatar_service.py."""
import uuid

import pytest
import pytest_asyncio
from sqlalchemy.ext.asyncio import AsyncSession, async_sessionmaker, create_async_engine

from fakes.fake_storage import FakeStorageClient
from models.base import Base
from models.profile import Profile
from models.user import User
from services.avatar_service import upload_avatar, remove_avatar

TEST_DB_URL = "sqlite+aiosqlite:///:memory:"


@pytest_asyncio.fixture
async def db() -> AsyncSession:
    engine = create_async_engine(TEST_DB_URL, echo=False)
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)
    factory = async_sessionmaker(engine, class_=AsyncSession, expire_on_commit=False)
    async with factory() as session:
        yield session
    await engine.dispose()


@pytest_asyncio.fixture
async def user_with_profile(db: AsyncSession) -> User:
    u = User(
        email="test@example.com",
        hashed_password="hashed",
        display_name="Test User",
    )
    db.add(u)
    await db.flush()
    p = Profile(user_id=u.id, display_name=u.display_name, email=u.email)
    db.add(p)
    await db.flush()
    return u


@pytest.mark.asyncio
async def test_upload_avatar_stores_to_storage_client(
    db: AsyncSession, user_with_profile: User
) -> None:
    """T009: upload_avatar writes bytes to the StorageClient at an avatars/ key."""
    fake = FakeStorageClient()
    avatar = await upload_avatar(
        db,
        user_with_profile,
        b"fake-image-bytes",
        "image/jpeg",
        "photo.jpg",
        storage_client=fake,
    )
    # The key must follow avatars/{user_id}/{avatar_id}.jpg
    expected_key = f"avatars/{user_with_profile.id}/{avatar.id}.jpg"
    assert expected_key in fake.objects
    assert fake.objects[expected_key] == b"fake-image-bytes"


@pytest.mark.asyncio
async def test_upload_avatar_rejects_invalid_type(
    db: AsyncSession, user_with_profile: User
) -> None:
    """T010: unsupported content type raises ValueError, nothing stored."""
    fake = FakeStorageClient()
    with pytest.raises(ValueError, match="Unsupported"):
        await upload_avatar(
            db,
            user_with_profile,
            b"pdf-bytes",
            "application/pdf",
            "doc.pdf",
            storage_client=fake,
        )
    assert fake.objects == {}


@pytest.mark.asyncio
async def test_upload_avatar_rejects_oversized_file(
    db: AsyncSession, user_with_profile: User
) -> None:
    """T011: file exceeding 5 MB raises ValueError, nothing stored."""
    fake = FakeStorageClient()
    oversized = b"x" * (5 * 1024 * 1024 + 1)
    with pytest.raises(ValueError, match="too large"):
        await upload_avatar(
            db,
            user_with_profile,
            oversized,
            "image/jpeg",
            "big.jpg",
            storage_client=fake,
        )
    assert fake.objects == {}


@pytest.mark.asyncio
async def test_remove_avatar_deletes_from_storage_client(
    db: AsyncSession, user_with_profile: User
) -> None:
    """T012: remove_avatar deletes the object from storage and clears profile.avatar_id."""
    from sqlalchemy import select
    from models.profile import Profile

    fake = FakeStorageClient()
    avatar = await upload_avatar(
        db,
        user_with_profile,
        b"img",
        "image/jpeg",
        "a.jpg",
        storage_client=fake,
    )
    key = f"avatars/{user_with_profile.id}/{avatar.id}.jpg"
    assert key in fake.objects

    await remove_avatar(db, user_with_profile, storage_client=fake)

    assert key not in fake.objects
    result = await db.execute(select(Profile).where(Profile.user_id == user_with_profile.id))
    profile = result.scalar_one()
    assert profile.avatar_id is None


@pytest.mark.asyncio
async def test_upload_avatar_replaces_existing(
    db: AsyncSession, user_with_profile: User
) -> None:
    """T013: uploading a second avatar deletes the first from storage; only new key present."""
    fake = FakeStorageClient()
    avatar1 = await upload_avatar(
        db,
        user_with_profile,
        b"first",
        "image/jpeg",
        "first.jpg",
        storage_client=fake,
    )
    key1 = f"avatars/{user_with_profile.id}/{avatar1.id}.jpg"

    avatar2 = await upload_avatar(
        db,
        user_with_profile,
        b"second",
        "image/png",
        "second.png",
        storage_client=fake,
    )
    key2 = f"avatars/{user_with_profile.id}/{avatar2.id}.png"

    assert key1 not in fake.objects, "Old avatar key should be deleted"
    assert key2 in fake.objects
    assert fake.objects[key2] == b"second"

    from sqlalchemy import select
    from models.profile import Profile

    result = await db.execute(select(Profile).where(Profile.user_id == user_with_profile.id))
    profile = result.scalar_one()
    assert profile.avatar_id == avatar2.id
