"""Contract tests for POST /me/session/touch."""
import pytest
from httpx import AsyncClient


async def _signup_and_login(client: AsyncClient, email: str = "touch@example.com") -> None:
    await client.post(
        "/api/auth/signup",
        json={"email": email, "password": "TouchPass1!", "display_name": "Touch User"},
    )
    await client.post("/api/auth/login", json={"email": email, "password": "TouchPass1!"})


@pytest.mark.asyncio
async def test_session_touch_returns_200(client: AsyncClient) -> None:
    """T019: Authenticated POST /me/session/touch returns 200 with new inactivity deadline."""
    await _signup_and_login(client)
    response = await client.post("/api/me/session/touch")
    assert response.status_code == 200, response.text
    body = response.json()
    assert "inactivity_expires_at" in body
    assert body["inactivity_expires_at"] is not None


@pytest.mark.asyncio
async def test_session_touch_requires_auth(client: AsyncClient) -> None:
    """T020: Unauthenticated POST /me/session/touch returns 401."""
    response = await client.post("/api/me/session/touch")
    assert response.status_code == 401, response.text
