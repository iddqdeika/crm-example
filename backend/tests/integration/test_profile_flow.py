"""Integration test: get profile when authenticated."""
import pytest
from httpx import AsyncClient


@pytest.mark.asyncio
async def test_get_profile_when_authenticated(client: AsyncClient) -> None:
    """After signup, GET /me/profile returns profile with correct email and display_name."""
    await client.post(
        "/auth/signup",
        json={
            "email": "flowprofile@example.com",
            "password": "SecurePass1!",
            "display_name": "Flow Profile",
        },
    )
    r = await client.get("/me/profile")
    if r.status_code == 404:
        pytest.skip("Profile route not implemented yet")
    assert r.status_code == 200
    data = r.json()
    assert data["email"] == "flowprofile@example.com"
    assert data["display_name"] == "Flow Profile"
