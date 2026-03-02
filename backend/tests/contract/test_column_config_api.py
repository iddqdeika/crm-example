"""Contract tests: Column configuration API (US5 T046)."""
import pytest
from httpx import AsyncClient


async def _signup_and_login(
    client: AsyncClient, email: str, password: str = "SecurePass1!", display_name: str = "User"
) -> None:
    r = await client.post(
        "/api/auth/signup",
        json={"email": email, "password": password, "display_name": display_name},
    )
    assert r.status_code in (201, 200), r.text


@pytest.mark.asyncio
async def test_get_column_config_returns_defaults(client: AsyncClient) -> None:
    """GET /me/column-config?context=campaigns returns default columns for new user."""
    await _signup_and_login(client, "colcfg1@test.com")
    r = await client.get("/api/me/column-config", params={"context": "campaigns"})
    assert r.status_code == 200
    data = r.json()
    assert data["context"] == "campaigns"
    assert isinstance(data["column_ids"], list)
    assert len(data["column_ids"]) >= 1
    assert "name" in data["column_ids"]


@pytest.mark.asyncio
async def test_put_column_config_saves_and_returns(client: AsyncClient) -> None:
    """PUT /me/column-config saves column_ids; subsequent GET returns them."""
    await _signup_and_login(client, "colcfg2@test.com")
    new_cols = ["budget", "status"]
    r = await client.put(
        "/api/me/column-config",
        json={"context": "campaigns", "column_ids": new_cols},
    )
    assert r.status_code == 200
    assert r.json()["column_ids"] == new_cols
    r2 = await client.get("/api/me/column-config", params={"context": "campaigns"})
    assert r2.status_code == 200
    assert r2.json()["column_ids"] == new_cols


@pytest.mark.asyncio
async def test_put_column_config_empty_returns_400(client: AsyncClient) -> None:
    """PUT with empty column_ids returns 422 (validation) or 400."""
    await _signup_and_login(client, "colcfg3@test.com")
    r = await client.put(
        "/api/me/column-config",
        json={"context": "campaigns", "column_ids": []},
    )
    assert r.status_code in (400, 422)
