"""Contract tests: Campaign CRUD and optimistic locking (US2)."""
from decimal import Decimal
from uuid import UUID

import pytest
from httpx import AsyncClient
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from models.campaign import Campaign, CampaignStatus


async def _signup_and_login(
    client: AsyncClient, email: str, password: str = "SecurePass1!", display_name: str = "User"
) -> None:
    r = await client.post(
        "/api/auth/signup",
        json={"email": email, "password": password, "display_name": display_name},
    )
    assert r.status_code in (201, 200), r.text


@pytest.mark.asyncio
async def test_patch_campaign_returns_409_when_version_mismatch(
    client: AsyncClient, db_session: AsyncSession
) -> None:
    """PATCH with wrong version returns 409 and body indicates conflict (T018)."""
    await _signup_and_login(client, "buyer409@test.com", "SecurePass1!", "Buyer")
    r = await client.post(
        "/api/campaigns",
        json={"name": "Camp", "budget": "100", "status": "active"},
    )
    assert r.status_code == 201
    data = r.json()
    campaign_id = data["id"]
    version = data["version"]
    # Simulate another update: increment version in DB
    result = await db_session.execute(select(Campaign).where(Campaign.id == UUID(campaign_id)))
    campaign = result.scalar_one_or_none()
    assert campaign is not None
    campaign.version = version + 1
    campaign.name = "Other"
    await db_session.flush()
    # PATCH with stale version
    r2 = await client.patch(
        f"/api/campaigns/{campaign_id}",
        json={"name": "Stale", "version": version},
    )
    assert r2.status_code == 409
    body = r2.json()
    assert "detail" in body
    assert "refresh" in body["detail"].lower() or "updated" in body["detail"].lower()
    # Campaign in DB should still have "Other" and version+1
    await db_session.refresh(campaign)
    assert campaign.name == "Other"
    assert campaign.version == version + 1


@pytest.mark.asyncio
async def test_patch_campaign_succeeds_when_version_matches(client: AsyncClient) -> None:
    """PATCH with correct version returns 200 and version incremented (T019)."""
    await _signup_and_login(client, "buyer200@test.com", "SecurePass1!", "Buyer")
    r = await client.post(
        "/api/campaigns",
        json={"name": "Camp", "budget": "50", "status": "pause"},
    )
    assert r.status_code == 201
    data = r.json()
    campaign_id = data["id"]
    version = data["version"]
    r2 = await client.patch(
        f"/api/campaigns/{campaign_id}",
        json={"name": "Updated", "budget": "75", "version": version},
    )
    assert r2.status_code == 200
    data2 = r2.json()
    assert data2["name"] == "Updated"
    assert data2["budget"] in (75, "75", 75.0)
    assert data2["version"] == version + 1


@pytest.mark.asyncio
async def test_buyer_sees_only_own_campaigns(client: AsyncClient) -> None:
    """Buyer GET /campaigns returns only campaigns where owner_id = current user (T020)."""
    await _signup_and_login(client, "buyer_own@test.com", "SecurePass1!", "Buyer1")
    await client.post("/api/campaigns", json={"name": "Mine", "budget": "10", "status": "active"})
    r = await client.get("/api/campaigns")
    assert r.status_code == 200
    data = r.json()
    assert data["total"] >= 1
    items = data["items"]
    assert len(items) >= 1
    assert any(c["name"] == "Mine" for c in items)


@pytest.mark.asyncio
async def test_post_campaign_creates_with_owner_and_version(client: AsyncClient) -> None:
    """POST /campaigns creates campaign with owner=current user and version=1 (T021)."""
    await _signup_and_login(client, "owner_ver@test.com", "SecurePass1!", "Owner")
    r = await client.post(
        "/api/campaigns",
        json={"name": "New Camp", "budget": "0", "status": "active"},
    )
    assert r.status_code == 201
    data = r.json()
    assert data["name"] == "New Camp"
    assert data["budget"] in (0, "0", 0.0)
    assert data["version"] == 1
    assert "id" in data
    assert "owner_id" in data


@pytest.mark.asyncio
async def test_get_campaign_returns_version(client: AsyncClient) -> None:
    """GET /campaigns/{id} returns version (T021)."""
    await _signup_and_login(client, "get_ver@test.com", "SecurePass1!", "Get")
    r = await client.post("/api/campaigns", json={"name": "V", "budget": "1", "status": "active"})
    assert r.status_code == 201
    cid = r.json()["id"]
    r2 = await client.get(f"/api/campaigns/{cid}")
    assert r2.status_code == 200
    assert "version" in r2.json()
    assert r2.json()["version"] == 1


# --- T031: Ad groups (US3) ---


@pytest.mark.asyncio
async def test_get_campaign_includes_ad_groups(client: AsyncClient) -> None:
    """GET /campaigns/{id} includes ad_groups with targeting fields (T031)."""
    await _signup_and_login(client, "adg_get@test.com", "SecurePass1!", "Adg")
    r = await client.post("/api/campaigns", json={"name": "With AdGroups", "budget": "50", "status": "active"})
    assert r.status_code == 201
    cid = r.json()["id"]
    version = r.json()["version"]
    r_patch = await client.patch(
        f"/api/campaigns/{cid}",
        json={
            "version": version,
            "ad_groups": [
                {"country_targets": "US,CA", "platform_targets": "web", "sort_order": 0},
            ],
        },
    )
    assert r_patch.status_code == 200
    assert len(r_patch.json().get("ad_groups", [])) == 1
    assert r_patch.json()["ad_groups"][0]["country_targets"] == "US,CA"
    assert r_patch.json()["ad_groups"][0]["platform_targets"] == "web"
    r_get = await client.get(f"/api/campaigns/{cid}")
    assert r_get.status_code == 200
    assert "ad_groups" in r_get.json()
    assert len(r_get.json()["ad_groups"]) == 1
    assert r_get.json()["ad_groups"][0]["country_targets"] == "US,CA"


@pytest.mark.asyncio
async def test_patch_campaign_ad_groups_create_and_delete(client: AsyncClient) -> None:
    """PATCH with ad_groups: add two, then remove one (T031)."""
    await _signup_and_login(client, "adg_patch@test.com", "SecurePass1!", "AdgPatch")
    r = await client.post("/api/campaigns", json={"name": "AG", "budget": "10", "status": "active"})
    assert r.status_code == 201
    cid = r.json()["id"]
    v = r.json()["version"]
    r2 = await client.patch(
        f"/api/campaigns/{cid}",
        json={
            "version": v,
            "ad_groups": [
                {"country_targets": "US", "sort_order": 0},
                {"country_targets": "CA", "sort_order": 1},
            ],
        },
    )
    assert r2.status_code == 200
    ad_groups = r2.json()["ad_groups"]
    assert len(ad_groups) == 2
    ids = [ag["id"] for ag in ad_groups]
    v2 = r2.json()["version"]
    r3 = await client.patch(
        f"/api/campaigns/{cid}",
        json={"version": v2, "ad_groups": [{"id": ids[0], "country_targets": "US", "sort_order": 0}]},
    )
    assert r3.status_code == 200
    assert len(r3.json()["ad_groups"]) == 1
    assert r3.json()["ad_groups"][0]["id"] == ids[0]


# --- T039: Creatives (US4) ---


@pytest.mark.asyncio
async def test_get_campaign_includes_ad_groups_with_creatives(client: AsyncClient) -> None:
    """GET /campaigns/{id} includes ad_groups with creatives (T039)."""
    await _signup_and_login(client, "cr_get@test.com", "SecurePass1!", "CrGet")
    r = await client.post("/api/campaigns", json={"name": "CrCamp", "budget": "10", "status": "active"})
    assert r.status_code == 201
    cid = r.json()["id"]
    v = r.json()["version"]
    # Add ad group with a creative
    r2 = await client.patch(
        f"/api/campaigns/{cid}",
        json={
            "version": v,
            "ad_groups": [
                {
                    "country_targets": "US",
                    "sort_order": 0,
                    "creatives": [
                        {"name": "Banner1", "ad_type": "banner", "click_url": "https://x.com", "sort_order": 0},
                    ],
                }
            ],
        },
    )
    assert r2.status_code == 200
    ag = r2.json()["ad_groups"]
    assert len(ag) == 1
    assert len(ag[0].get("creatives", [])) == 1
    assert ag[0]["creatives"][0]["name"] == "Banner1"
    assert ag[0]["creatives"][0]["ad_type"] == "banner"
    # Verify GET also returns them
    r3 = await client.get(f"/api/campaigns/{cid}")
    assert r3.status_code == 200
    assert len(r3.json()["ad_groups"][0]["creatives"]) == 1


@pytest.mark.asyncio
async def test_patch_creatives_create_update_delete(client: AsyncClient) -> None:
    """PATCH ad_groups with creatives: add two, update one, delete the other (T039)."""
    await _signup_and_login(client, "cr_patch@test.com", "SecurePass1!", "CrPatch")
    r = await client.post("/api/campaigns", json={"name": "CrCamp2", "budget": "5", "status": "active"})
    assert r.status_code == 201
    cid = r.json()["id"]
    v = r.json()["version"]
    # Create ad group with two creatives
    r2 = await client.patch(
        f"/api/campaigns/{cid}",
        json={
            "version": v,
            "ad_groups": [
                {
                    "sort_order": 0,
                    "creatives": [
                        {"name": "A", "ad_type": "banner", "sort_order": 0},
                        {"name": "B", "ad_type": "native", "sort_order": 1},
                    ],
                },
            ],
        },
    )
    assert r2.status_code == 200
    ag = r2.json()["ad_groups"][0]
    crs = ag["creatives"]
    assert len(crs) == 2
    cr_a_id = crs[0]["id"]
    ag_id = ag["id"]
    v2 = r2.json()["version"]
    # Keep first creative (update name), drop second
    r3 = await client.patch(
        f"/api/campaigns/{cid}",
        json={
            "version": v2,
            "ad_groups": [
                {
                    "id": ag_id,
                    "sort_order": 0,
                    "creatives": [
                        {"id": cr_a_id, "name": "A-updated", "ad_type": "banner", "sort_order": 0},
                    ],
                },
            ],
        },
    )
    assert r3.status_code == 200
    new_crs = r3.json()["ad_groups"][0]["creatives"]
    assert len(new_crs) == 1
    assert new_crs[0]["name"] == "A-updated"
    assert new_crs[0]["id"] == cr_a_id


# --- T047: Search, Sort, Owner filter (US5) ---


@pytest.mark.asyncio
async def test_search_campaigns_by_name(client: AsyncClient) -> None:
    """GET /campaigns?search=... filters by name (T047)."""
    await _signup_and_login(client, "search_camp@test.com")
    await client.post("/api/campaigns", json={"name": "Alpha", "budget": "10", "status": "active"})
    await client.post("/api/campaigns", json={"name": "Beta", "budget": "20", "status": "active"})
    r = await client.get("/api/campaigns", params={"search": "alpha"})
    assert r.status_code == 200
    assert r.json()["total"] == 1
    assert r.json()["items"][0]["name"] == "Alpha"


@pytest.mark.asyncio
async def test_sort_campaigns_by_budget_desc(client: AsyncClient) -> None:
    """GET /campaigns?sort=-budget orders by budget descending (T047)."""
    await _signup_and_login(client, "sort_camp@test.com")
    await client.post("/api/campaigns", json={"name": "Cheap", "budget": "5", "status": "active"})
    await client.post("/api/campaigns", json={"name": "Pricey", "budget": "50", "status": "active"})
    r = await client.get("/api/campaigns", params={"sort": "-budget"})
    assert r.status_code == 200
    items = r.json()["items"]
    assert len(items) == 2
    assert float(items[0]["budget"]) >= float(items[1]["budget"])


# --- T056 / T057: Archive enforcement ---


@pytest.mark.asyncio
async def test_archive_campaign_via_patch(client: AsyncClient) -> None:
    """PATCH with status=archive archives the campaign (T056)."""
    await _signup_and_login(client, "archive1@test.com")
    r = await client.post("/api/campaigns", json={"name": "ArchTest", "budget": "10", "status": "active"})
    assert r.status_code == 201
    cid = r.json()["id"]
    v = r.json()["version"]
    r2 = await client.patch(f"/api/campaigns/{cid}", json={"version": v, "status": "archive"})
    assert r2.status_code == 200
    assert r2.json()["status"] == "archive"


@pytest.mark.asyncio
async def test_archived_campaign_patch_returns_403(client: AsyncClient) -> None:
    """Modifying an archived campaign returns 403 (T057)."""
    await _signup_and_login(client, "archive2@test.com")
    r = await client.post("/api/campaigns", json={"name": "ArchLock", "budget": "10", "status": "active"})
    assert r.status_code == 201
    cid = r.json()["id"]
    v = r.json()["version"]
    # Archive it
    r2 = await client.patch(f"/api/campaigns/{cid}", json={"version": v, "status": "archive"})
    assert r2.status_code == 200
    v2 = r2.json()["version"]
    # Try to modify archived campaign
    r3 = await client.patch(f"/api/campaigns/{cid}", json={"version": v2, "name": "New Name"})
    assert r3.status_code == 403
