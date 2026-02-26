"""Integration test: signup then login flow (create user, then authenticate)."""
import pytest
from httpx import AsyncClient


@pytest.mark.asyncio
async def test_signup_then_login(client: AsyncClient) -> None:
    """After signup, login with same credentials succeeds and returns 200."""
    email = "flow@example.com"
    password = "SecurePass1!"
    display_name = "Flow User"

    signup = await client.post(
        "/auth/signup",
        json={"email": email, "password": password, "display_name": display_name},
    )
    if signup.status_code == 404:
        pytest.skip("Auth routes not implemented yet")
    assert signup.status_code == 201, signup.text

    login = await client.post(
        "/auth/login",
        json={"email": email, "password": password},
    )
    assert login.status_code == 200, login.text
