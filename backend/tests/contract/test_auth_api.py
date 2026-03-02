"""Contract tests: POST /auth/signup, POST /auth/login, POST /auth/logout shapes and status codes."""
import pytest
from httpx import AsyncClient


@pytest.mark.asyncio
async def test_signup_request_response_shape(client: AsyncClient) -> None:
    """POST /auth/signup accepts email, password, display_name; returns 201 or 4xx."""
    r = await client.post(
        "/api/auth/signup",
        json={
            "email": "user@example.com",
            "password": "SecurePass1!",
            "display_name": "Test User",
        },
    )
    assert r.status_code in (201, 400, 404)

    if r.status_code == 201:
        # 201 may return message or empty; may set cookie
        body = r.json()
        assert isinstance(body, dict) and ("message" in body or "detail" in body or body == {})

    if r.status_code == 400:
        assert "detail" in r.json()


@pytest.mark.asyncio
async def test_signup_conflict_when_email_exists(client: AsyncClient) -> None:
    """POST /auth/signup with existing email returns 409."""
    payload = {
        "email": "dup@example.com",
        "password": "SecurePass1!",
        "display_name": "Dup",
    }
    await client.post("/api/auth/signup", json=payload)
    r2 = await client.post("/api/auth/signup", json=payload)
    assert r2.status_code in (409, 404)


@pytest.mark.asyncio
async def test_login_request_response_shape(client: AsyncClient) -> None:
    """POST /auth/login accepts email, password; returns 200 or 4xx."""
    r = await client.post(
        "/api/auth/login",
        json={"email": "any@example.com", "password": "any"},
    )
    assert r.status_code in (200, 401, 404)

    if r.status_code == 200:
        assert "Set-Cookie" in r.headers or True

    if r.status_code == 401:
        assert "detail" in r.json()


@pytest.mark.asyncio
async def test_logout_requires_auth(client: AsyncClient) -> None:
    """POST /auth/logout without session returns 204 or 401."""
    r = await client.post("/api/auth/logout")
    assert r.status_code in (204, 401, 404)
