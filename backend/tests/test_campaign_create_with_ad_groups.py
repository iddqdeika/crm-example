"""Integration tests: POST /api/campaigns with ad_groups payload."""
import pytest
import pytest_asyncio
from httpx import AsyncClient

from models.user import User, UserRole
from services.auth_service import hash_password


@pytest.mark.asyncio
async def test_create_campaign_without_ad_groups_unchanged(admin_client: AsyncClient):
    """Omitting ad_groups keeps existing behaviour: 201 + empty ad_groups list."""
    resp = await admin_client.post(
        "/api/campaigns",
        json={"name": "No AG Campaign", "budget": "100.00", "status": "active"},
    )
    assert resp.status_code == 201
    data = resp.json()
    assert data["name"] == "No AG Campaign"
    assert data["ad_groups"] == []


@pytest.mark.asyncio
async def test_create_campaign_with_empty_ad_groups(admin_client: AsyncClient):
    """Explicit empty ad_groups list → 201 + empty ad_groups."""
    resp = await admin_client.post(
        "/api/campaigns",
        json={"name": "Empty AG Campaign", "budget": "0", "status": "active", "ad_groups": []},
    )
    assert resp.status_code == 201
    assert resp.json()["ad_groups"] == []


@pytest.mark.asyncio
async def test_create_campaign_with_ad_groups_and_creatives(admin_client: AsyncClient):
    """POST with one ad group containing one creative → 201, ad group and creative in response."""
    payload = {
        "name": "Campaign With AG",
        "budget": "500.00",
        "status": "active",
        "ad_groups": [
            {
                "country_targets": "US",
                "platform_targets": None,
                "browser_targets": None,
                "timezone_targets": None,
                "ssp_id_whitelist": None,
                "ssp_id_blacklist": None,
                "source_id_whitelist": None,
                "source_id_blacklist": None,
                "sort_order": 0,
                "creatives": [
                    {"name": "Banner", "ad_type": "banner", "click_url": None, "sort_order": 0}
                ],
            }
        ],
    }
    resp = await admin_client.post("/api/campaigns", json=payload)
    assert resp.status_code == 201
    data = resp.json()
    assert len(data["ad_groups"]) == 1
    ag = data["ad_groups"][0]
    assert ag["country_targets"] == "US"
    assert len(ag["creatives"]) == 1
    assert ag["creatives"][0]["name"] == "Banner"
    assert ag["creatives"][0]["ad_type"] == "banner"


@pytest.mark.asyncio
async def test_create_campaign_with_multiple_ad_groups(admin_client: AsyncClient):
    """Two ad groups each with one creative → 201, both present in response."""
    payload = {
        "name": "Multi AG Campaign",
        "budget": "200.00",
        "status": "active",
        "ad_groups": [
            {
                "country_targets": "US",
                "sort_order": 0,
                "creatives": [{"name": "Creative 1", "ad_type": "banner", "sort_order": 0}],
            },
            {
                "country_targets": "DE",
                "sort_order": 1,
                "creatives": [{"name": "Creative 2", "ad_type": "native", "sort_order": 0}],
            },
        ],
    }
    resp = await admin_client.post("/api/campaigns", json=payload)
    assert resp.status_code == 201
    data = resp.json()
    assert len(data["ad_groups"]) == 2
    targets = {ag["country_targets"] for ag in data["ad_groups"]}
    assert targets == {"US", "DE"}


@pytest.mark.asyncio
async def test_create_campaign_with_invalid_creative_name(admin_client: AsyncClient):
    """Creative with empty name → 422 validation error."""
    payload = {
        "name": "Bad Creative Campaign",
        "budget": "100.00",
        "status": "active",
        "ad_groups": [
            {
                "sort_order": 0,
                "creatives": [{"name": "", "ad_type": "banner", "sort_order": 0}],
            }
        ],
    }
    resp = await admin_client.post("/api/campaigns", json=payload)
    assert resp.status_code == 422


@pytest.mark.asyncio
async def test_create_campaign_with_ad_group_id_rejected(admin_client: AsyncClient):
    """Ad group item supplying a non-null id → 422 (ids not accepted on creation)."""
    payload = {
        "name": "ID Rejected Campaign",
        "budget": "100.00",
        "status": "active",
        "ad_groups": [
            {
                "id": "00000000-0000-0000-0000-000000000001",
                "sort_order": 0,
                "creatives": [],
            }
        ],
    }
    resp = await admin_client.post("/api/campaigns", json=payload)
    assert resp.status_code == 422
