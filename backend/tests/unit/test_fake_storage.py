"""Unit tests for FakeStorageClient — verifies the test helper itself."""
import pytest

from fakes.fake_storage import FakeStorageClient


@pytest.fixture
def fake() -> FakeStorageClient:
    return FakeStorageClient()


@pytest.mark.asyncio
async def test_put_object_stores_data(fake: FakeStorageClient) -> None:
    await fake.put_object("avatars/user1/avatar1.jpg", b"img-bytes", "image/jpeg")
    assert fake.objects["avatars/user1/avatar1.jpg"] == b"img-bytes"


@pytest.mark.asyncio
async def test_delete_object_removes_data(fake: FakeStorageClient) -> None:
    await fake.put_object("avatars/user1/avatar1.jpg", b"img-bytes", "image/jpeg")
    await fake.delete_object("avatars/user1/avatar1.jpg")
    assert "avatars/user1/avatar1.jpg" not in fake.objects


@pytest.mark.asyncio
async def test_delete_object_on_missing_key_is_noop(fake: FakeStorageClient) -> None:
    await fake.delete_object("nonexistent/key.jpg")
    assert fake.objects == {}


@pytest.mark.asyncio
async def test_get_presigned_url_returns_fake_url(fake: FakeStorageClient) -> None:
    await fake.put_object("avatars/user1/avatar1.jpg", b"data", "image/jpeg")
    url = await fake.get_presigned_url("avatars/user1/avatar1.jpg")
    assert url == "http://fake-storage/avatars/user1/avatar1.jpg"


@pytest.mark.asyncio
async def test_storage_client_supports_arbitrary_key_prefix(fake: FakeStorageClient) -> None:
    """US3: storage abstraction works with any key prefix, no code changes needed."""
    await fake.put_object("documents/user-abc/doc-xyz.pdf", b"pdf-data", "application/pdf")
    assert fake.objects["documents/user-abc/doc-xyz.pdf"] == b"pdf-data"
    url = await fake.get_presigned_url("documents/user-abc/doc-xyz.pdf")
    assert url == "http://fake-storage/documents/user-abc/doc-xyz.pdf"
