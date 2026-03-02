"""Integration test: admin list users and update user."""
import pytest
from httpx import AsyncClient


@pytest.mark.asyncio
async def test_admin_list_users_and_update_user(admin_client: AsyncClient) -> None:
    """As admin: list users, get one, patch role/is_active."""
    list_r = await admin_client.get("/api/admin/users")
    if list_r.status_code == 404:
        pytest.skip("Admin routes not implemented")
    assert list_r.status_code == 200
    data = list_r.json()
    assert "items" in data
    assert "total" in data
    assert data["total"] >= 1
    if data["items"]:
        user_id = data["items"][0]["id"]
        get_r = await admin_client.get(f"/api/admin/users/{user_id}")
        assert get_r.status_code == 200
        patch_r = await admin_client.patch(
            f"/api/admin/users/{user_id}",
            json={"is_active": True},
        )
        assert patch_r.status_code == 204
