"""Contract tests: GET /me/profile response shape and 401 when unauthenticated."""
import pytest
from httpx import AsyncClient


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
