"""Contract tests for POST/DELETE /me/avatar endpoints."""
import io

import pytest
from httpx import AsyncClient

from app.main import app
from core.storage import get_storage_client
from fakes.fake_storage import FakeStorageClient

SMALL_JPEG = b"\xff\xd8\xff\xe0" + b"\x00" * 100  # minimal fake JPEG header + padding


def _fake_storage_override():
    """Return a fresh FakeStorageClient for each test."""
    return FakeStorageClient()


@pytest.fixture(autouse=True)
def override_storage():
    app.dependency_overrides[get_storage_client] = _fake_storage_override
    yield
    app.dependency_overrides.pop(get_storage_client, None)


async def _signup_and_login(client: AsyncClient, email: str = "avatar@test.com") -> None:
    await client.post(
        "/api/auth/signup",
        json={"email": email, "password": "SecurePass1!", "display_name": "Avatar User"},
    )
    await client.post("/api/auth/login", json={"email": email, "password": "SecurePass1!"})


@pytest.mark.asyncio
async def test_post_avatar_returns_201(client: AsyncClient) -> None:
    """T016: valid JPEG upload returns 201 with id, avatar_url, content_type, file_size_bytes."""
    await _signup_and_login(client)
    r = await client.post(
        "/api/me/avatar",
        files={"file": ("photo.jpg", io.BytesIO(SMALL_JPEG), "image/jpeg")},
    )
    assert r.status_code == 201, r.text
    data = r.json()
    assert "id" in data
    assert "avatar_url" in data
    assert "content_type" in data
    assert "file_size_bytes" in data
    assert data["content_type"] == "image/jpeg"
    assert data["avatar_url"].startswith("http://fake-storage/")


@pytest.mark.asyncio
async def test_post_avatar_rejects_bad_type(client: AsyncClient) -> None:
    """T017: non-image content type returns 400 with informative detail."""
    await _signup_and_login(client, "bad-type@test.com")
    r = await client.post(
        "/api/me/avatar",
        files={"file": ("doc.txt", io.BytesIO(b"text content"), "text/plain")},
    )
    assert r.status_code == 400, r.text
    assert "Unsupported image type" in r.json()["detail"]


@pytest.mark.asyncio
async def test_post_avatar_rejects_oversized(client: AsyncClient) -> None:
    """T018: file > 5 MB returns 400 with size-limit message."""
    await _signup_and_login(client, "oversized@test.com")
    big = b"x" * (5 * 1024 * 1024 + 1)
    r = await client.post(
        "/api/me/avatar",
        files={"file": ("big.jpg", io.BytesIO(big), "image/jpeg")},
    )
    assert r.status_code == 400, r.text
    assert "too large" in r.json()["detail"].lower()


@pytest.mark.asyncio
async def test_post_avatar_requires_auth(client: AsyncClient) -> None:
    """T019: unauthenticated POST returns 401."""
    r = await client.post(
        "/api/me/avatar",
        files={"file": ("photo.jpg", io.BytesIO(SMALL_JPEG), "image/jpeg")},
    )
    assert r.status_code == 401, r.text


@pytest.mark.asyncio
async def test_delete_avatar_returns_204(client: AsyncClient) -> None:
    """T020: DELETE after upload returns 204; subsequent GET /me/profile has null avatar_url."""
    await _signup_and_login(client, "delete-avatar@test.com")
    await client.post(
        "/api/me/avatar",
        files={"file": ("photo.jpg", io.BytesIO(SMALL_JPEG), "image/jpeg")},
    )
    r = await client.delete("/api/me/avatar")
    assert r.status_code == 204, r.text

    profile_r = await client.get("/api/me/profile")
    assert profile_r.status_code == 200
    assert profile_r.json()["avatar_url"] is None


@pytest.mark.asyncio
async def test_delete_avatar_requires_auth(client: AsyncClient) -> None:
    """T021: unauthenticated DELETE returns 401."""
    r = await client.delete("/api/me/avatar")
    assert r.status_code == 401, r.text


@pytest.mark.asyncio
async def test_post_avatar_returns_503_on_storage_error(client: AsyncClient) -> None:
    """T029: StorageError from storage backend results in 503."""
    from core.storage import StorageError

    class FailingStorage:
        async def put_object(self, key, data, content_type):
            raise StorageError("MinIO unreachable")

        async def delete_object(self, key):
            raise StorageError("MinIO unreachable")

        async def get_presigned_url(self, key, expires_seconds=3600):
            raise StorageError("MinIO unreachable")

    app.dependency_overrides[get_storage_client] = lambda: FailingStorage()
    await _signup_and_login(client, "storage-error@test.com")
    r = await client.post(
        "/api/me/avatar",
        files={"file": ("photo.jpg", io.BytesIO(SMALL_JPEG), "image/jpeg")},
    )
    # Restore fake for cleanup
    app.dependency_overrides[get_storage_client] = _fake_storage_override
    assert r.status_code == 503, r.text
    assert "Storage service unavailable" in r.json()["detail"]
