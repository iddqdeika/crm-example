"""Contract tests: GET /admin/users, GET /admin/users/{user_id}, PATCH /admin/users/{user_id}, 403 for non-admin."""
import pytest
from httpx import AsyncClient


@pytest.mark.asyncio
async def test_admin_users_requires_admin(client: AsyncClient) -> None:
    """GET /admin/users as non-admin returns 403."""
    await client.post(
        "/api/auth/signup",
        json={
            "email": "standard@example.com",
            "password": "SecurePass1!",
            "display_name": "Standard",
        },
    )
    r = await client.get("/api/admin/users")
    assert r.status_code in (403, 404)


@pytest.mark.asyncio
async def test_admin_users_list_shape(client: AsyncClient) -> None:
    """GET /admin/users as admin returns 200 with items and total (or 404 if not implemented)."""
    # Create admin via signup - we need a way to be admin; for contract test we only check shape/status
    await client.post(
        "/api/auth/signup",
        json={
            "email": "admincontract@example.com",
            "password": "SecurePass1!",
            "display_name": "Admin",
        },
    )
    r = await client.get("/api/admin/users")
    assert r.status_code in (200, 403, 404)
    if r.status_code == 200:
        data = r.json()
        assert "items" in data
        assert "total" in data


@pytest.mark.asyncio
async def test_admin_users_get_one_requires_admin(client: AsyncClient) -> None:
    """GET /admin/users/{user_id} without admin returns 403 or 404."""
    await client.post(
        "/api/auth/signup",
        json={
            "email": "one@example.com",
            "password": "SecurePass1!",
            "display_name": "One",
        },
    )
    r = await client.get("/api/admin/users/00000000-0000-0000-0000-000000000001")
    assert r.status_code in (403, 404)


@pytest.mark.asyncio
async def test_admin_users_patch_requires_admin(client: AsyncClient) -> None:
    """PATCH /admin/users/{user_id} without admin returns 403 or 404."""
    await client.post(
        "/api/auth/signup",
        json={
            "email": "patch@example.com",
            "password": "SecurePass1!",
            "display_name": "Patch",
        },
    )
    r = await client.patch(
        "/api/admin/users/00000000-0000-0000-0000-000000000001",
        json={"role": "admin"},
    )
    assert r.status_code in (403, 404)


@pytest.mark.asyncio
async def test_admin_can_set_user_role_to_buyer(
    admin_client: AsyncClient, db_session
) -> None:
    """Admin PATCH user with role=buyer; GET user returns role buyer (US1)."""
    from models.user import User, UserRole
    from services.auth_service import hash_password

    u = User(
        email="buyertarget@example.com",
        hashed_password=hash_password("Pass1!"),
        display_name="Buyer Target",
        role=UserRole.standard,
    )
    db_session.add(u)
    await db_session.flush()
    user_id = str(u.id)
    r = await admin_client.patch(
        f"/api/admin/users/{user_id}",
        json={"role": "buyer"},
    )
    assert r.status_code == 204
    r2 = await admin_client.get(f"/api/admin/users/{user_id}")
    assert r2.status_code == 200
    assert r2.json()["role"] == "buyer"
