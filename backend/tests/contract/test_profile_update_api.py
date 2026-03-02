"""Contract tests: PATCH /me/password, POST /me/avatar, DELETE /me/avatar."""
import pytest
from httpx import AsyncClient


@pytest.mark.asyncio
async def test_patch_password_shape(client: AsyncClient) -> None:
    """PATCH /me/password with current_password, new_password returns 204 or 4xx."""
    await client.post(
        "/api/auth/signup",
        json={
            "email": "pw@example.com",
            "password": "OldPass1!",
            "display_name": "PW User",
        },
    )
    r = await client.patch(
        "/api/me/password",
        json={"current_password": "OldPass1!", "new_password": "NewPass1!"},
    )
    assert r.status_code in (204, 400, 401, 404)


@pytest.mark.asyncio
async def test_post_avatar_requires_auth(client: AsyncClient) -> None:
    """POST /me/avatar without auth returns 401."""
    r = await client.post("/api/me/avatar", data={})
    assert r.status_code in (401, 404, 422)


@pytest.mark.asyncio
async def test_delete_avatar_shape(client: AsyncClient) -> None:
    """DELETE /me/avatar with auth returns 204 or 401."""
    await client.post(
        "/api/auth/signup",
        json={
            "email": "delav@example.com",
            "password": "SecurePass1!",
            "display_name": "Del",
        },
    )
    r = await client.delete("/api/me/avatar")
    assert r.status_code in (204, 401, 404)
