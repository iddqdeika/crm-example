"""Contract tests: GET /api/dashboard/counts — role-based response shape (feature 016)."""
import pytest
from httpx import AsyncClient
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from models.campaign import Campaign, CampaignStatus
from models.user import User


@pytest.mark.asyncio
async def test_dashboard_counts_buyer_returns_only_campaigns(
    buyer_client: AsyncClient,
) -> None:
    """GET /api/dashboard/counts as buyer returns 200 and only key 'campaigns'."""
    r = await buyer_client.get("/api/dashboard/counts")
    assert r.status_code == 200, r.text
    data = r.json()
    assert list(data.keys()) == ["campaigns"]
    assert isinstance(data["campaigns"], int)
    assert data["campaigns"] >= 0


@pytest.mark.asyncio
async def test_dashboard_counts_content_manager_returns_drafts_published(
    content_manager_client: AsyncClient,
) -> None:
    """GET /api/dashboard/counts as content_manager returns 200 and only keys 'drafts', 'published'."""
    r = await content_manager_client.get("/api/dashboard/counts")
    assert r.status_code == 200, r.text
    data = r.json()
    assert set(data.keys()) == {"drafts", "published"}
    assert isinstance(data["drafts"], int) and data["drafts"] >= 0
    assert isinstance(data["published"], int) and data["published"] >= 0


@pytest.mark.asyncio
async def test_dashboard_counts_admin_returns_all_four_keys(
    admin_client: AsyncClient,
) -> None:
    """GET /api/dashboard/counts as admin returns 200 and keys campaigns, drafts, published, users."""
    r = await admin_client.get("/api/dashboard/counts")
    assert r.status_code == 200, r.text
    data = r.json()
    assert set(data.keys()) == {"campaigns", "drafts", "published", "users"}
    for k, v in data.items():
        assert isinstance(v, int), f"{k} should be int, got {type(v)}"
        assert v >= 0, f"{k} should be non-negative, got {v}"


@pytest.mark.asyncio
async def test_dashboard_counts_buyer_accuracy(
    buyer_client: AsyncClient, db_session: AsyncSession
) -> None:
    """Buyer with N campaigns receives campaigns === N (count accuracy)."""
    from decimal import Decimal
    from models.user import User, UserRole

    result = await db_session.execute(select(User).where(User.email == "buyer@test.com"))
    buyer = result.scalar_one_or_none()
    assert buyer is not None
    for i in range(3):
        c = Campaign(
            name=f"Camp {i}",
            budget=Decimal("100"),
            status=CampaignStatus.active,
            owner_id=buyer.id,
            version=1,
        )
        db_session.add(c)
    await db_session.flush()

    r = await buyer_client.get("/api/dashboard/counts")
    assert r.status_code == 200, r.text
    data = r.json()
    assert data["campaigns"] == 3


@pytest.mark.asyncio
async def test_dashboard_counts_requires_auth(client: AsyncClient) -> None:
    """GET /api/dashboard/counts without auth returns 401."""
    r = await client.get("/api/dashboard/counts")
    assert r.status_code == 401
