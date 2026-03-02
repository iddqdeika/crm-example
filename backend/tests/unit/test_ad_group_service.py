"""Unit tests for ad_group_service (T030)."""
from decimal import Decimal
from uuid import uuid4

import pytest
from sqlalchemy.ext.asyncio import AsyncSession

from models.campaign import Campaign, CampaignStatus
from services.ad_group_service import (
    create_ad_group,
    delete_ad_group,
    get_ad_group_by_id,
    list_ad_groups_by_campaign,
    update_ad_group,
)


@pytest.fixture
async def campaign(db_session: AsyncSession) -> Campaign:
    from models.user import User, UserRole
    from services.auth_service import hash_password

    u = User(
        email="owner@test.com",
        hashed_password=hash_password("Pass1!"),
        display_name="Owner",
        role=UserRole.buyer,
    )
    db_session.add(u)
    await db_session.flush()
    c = Campaign(
        name="Test Campaign",
        budget=Decimal("100"),
        status=CampaignStatus.active,
        owner_id=u.id,
    )
    db_session.add(c)
    await db_session.flush()
    return c


@pytest.mark.asyncio
async def test_create_ad_group_under_campaign(db_session: AsyncSession, campaign: Campaign) -> None:
    ag = await create_ad_group(
        db_session,
        campaign.id,
        country_targets="US,CA",
        sort_order=0,
    )
    assert ag.id is not None
    assert ag.campaign_id == campaign.id
    assert ag.country_targets == "US,CA"
    assert ag.sort_order == 0


@pytest.mark.asyncio
async def test_list_ad_groups_by_campaign(db_session: AsyncSession, campaign: Campaign) -> None:
    await create_ad_group(db_session, campaign.id, sort_order=1)
    await create_ad_group(db_session, campaign.id, sort_order=0)
    items = await list_ad_groups_by_campaign(db_session, campaign.id)
    assert len(items) == 2
    assert items[0].sort_order <= items[1].sort_order


@pytest.mark.asyncio
async def test_get_ad_group_by_id(db_session: AsyncSession, campaign: Campaign) -> None:
    ag = await create_ad_group(db_session, campaign.id, platform_targets="web")
    got = await get_ad_group_by_id(db_session, ag.id, campaign.id)
    assert got is not None
    assert got.platform_targets == "web"
    wrong_campaign = uuid4()
    assert await get_ad_group_by_id(db_session, ag.id, wrong_campaign) is None


@pytest.mark.asyncio
async def test_update_ad_group(db_session: AsyncSession, campaign: Campaign) -> None:
    ag = await create_ad_group(db_session, campaign.id, browser_targets="chrome")
    updated = await update_ad_group(
        db_session, ag.id, campaign.id, browser_targets="firefox", sort_order=5
    )
    assert updated is not None
    assert updated.browser_targets == "firefox"
    assert updated.sort_order == 5


@pytest.mark.asyncio
async def test_delete_ad_group(db_session: AsyncSession, campaign: Campaign) -> None:
    ag = await create_ad_group(db_session, campaign.id)
    ok = await delete_ad_group(db_session, ag.id, campaign.id)
    assert ok is True
    assert await get_ad_group_by_id(db_session, ag.id, campaign.id) is None
    ok2 = await delete_ad_group(db_session, ag.id, campaign.id)
    assert ok2 is False
