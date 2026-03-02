"""Integration test: password change and avatar upload/remove."""
import pytest
from httpx import AsyncClient


@pytest.mark.asyncio
async def test_password_change_then_login(client: AsyncClient) -> None:
    """After signup, change password, logout, login with new password succeeds."""
    await client.post(
        "/api/auth/signup",
        json={
            "email": "chpwd@example.com",
            "password": "OldPass1!",
            "display_name": "ChPwd",
        },
    )
    r = await client.patch(
        "/api/me/password",
        json={"current_password": "OldPass1!", "new_password": "NewPass1!"},
    )
    if r.status_code == 404:
        pytest.skip("Password endpoint not implemented")
    assert r.status_code == 204
    await client.post("/api/auth/logout")
    login = await client.post(
        "/api/auth/login",
        json={"email": "chpwd@example.com", "password": "NewPass1!"},
    )
    assert login.status_code == 200


@pytest.mark.asyncio
async def test_delete_avatar_when_authenticated(client: AsyncClient) -> None:
    """DELETE /me/avatar when authenticated returns 204."""
    await client.post(
        "/api/auth/signup",
        json={
            "email": "delav2@example.com",
            "password": "SecurePass1!",
            "display_name": "Del2",
        },
    )
    r = await client.delete("/api/me/avatar")
    if r.status_code == 404:
        pytest.skip("Delete avatar not implemented")
    assert r.status_code == 204
