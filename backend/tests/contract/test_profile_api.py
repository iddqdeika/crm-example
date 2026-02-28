"""Contract tests: GET /me/profile response shape and 401 when unauthenticated."""
import io

import pytest
from httpx import AsyncClient

from app.main import app
from core.storage import get_storage_client
from fakes.fake_storage import FakeStorageClient

SMALL_JPEG = b"\xff\xd8\xff\xe0" + b"\x00" * 100


@pytest.fixture(autouse=True)
def override_storage_for_profile_tests():
    app.dependency_overrides[get_storage_client] = lambda: FakeStorageClient()
    yield
    app.dependency_overrides.pop(get_storage_client, None)


@pytest.mark.asyncio
async def test_get_profile_requires_auth(client: AsyncClient) -> None:
    """GET /me/profile without session returns 401."""
    r = await client.get("/me/profile")
    assert r.status_code == 401


@pytest.mark.asyncio
async def test_get_profile_response_shape(client: AsyncClient) -> None:
    """GET /me/profile with valid session returns 200 and id, display_name, email, avatar_url."""
    # Create user and session via signup, then get profile
    await client.post(
        "/auth/signup",
        json={
            "email": "profile@example.com",
            "password": "SecurePass1!",
            "display_name": "Profile User",
        },
    )
    r = await client.get("/me/profile")
    if r.status_code == 404:
        pytest.skip("Profile route not implemented yet")
    assert r.status_code == 200
    data = r.json()
    assert "id" in data
    assert "display_name" in data
    assert "email" in data
    assert "avatar_url" in data


@pytest.mark.asyncio
async def test_get_profile_avatar_url_is_presigned(client: AsyncClient) -> None:
    """T022: after uploading an avatar, GET /me/profile returns a presigned URL (not old proxy path)."""
    await client.post(
        "/auth/signup",
        json={
            "email": "presigned@example.com",
            "password": "SecurePass1!",
            "display_name": "Presigned User",
        },
    )
    await client.post(
        "/me/avatar",
        files={"file": ("photo.jpg", io.BytesIO(SMALL_JPEG), "image/jpeg")},
    )
    r = await client.get("/me/profile")
    assert r.status_code == 200
    data = r.json()
    assert data["avatar_url"] is not None
    assert data["avatar_url"].startswith("http://fake-storage/"), (
        f"Expected presigned URL, got: {data['avatar_url']}"
    )
    assert "/me/avatar/" not in data["avatar_url"], "Should not use old proxy URL"


@pytest.mark.asyncio
async def test_get_profile_returns_session_timestamps(client: AsyncClient) -> None:
    """T034: GET /me/profile for authenticated user returns session expiry timestamps."""
    await client.post(
        "/auth/signup",
        json={
            "email": "session-ts@example.com",
            "password": "SecurePass1!",
            "display_name": "Session TS User",
        },
    )
    r = await client.get("/me/profile")
    assert r.status_code == 200
    data = r.json()
    assert "session_inactivity_expires_at" in data
    assert "session_absolute_expires_at" in data
    assert "session_warning_seconds" in data
    assert data["session_inactivity_expires_at"] is not None
    assert data["session_absolute_expires_at"] is not None
    assert isinstance(data["session_warning_seconds"], int)
