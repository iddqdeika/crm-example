"""Unit tests for creative_service (T038)."""
from decimal import Decimal
from uuid import uuid4

import pytest
from sqlalchemy.ext.asyncio import AsyncSession

from models.ad_group import AdGroup
from models.campaign import Campaign, CampaignStatus
from services.creative_service import (
    InvalidAdTypeError,
    create_creative,
    delete_creative,
    get_creative_by_id,
    list_creatives_by_ad_group,
    update_creative,
)


@pytest.fixture
async def ad_group(db_session: AsyncSession) -> AdGroup:
    from models.user import User, UserRole
    from services.auth_service import hash_password

    u = User(
        email="cr_owner@test.com",
        hashed_password=hash_password("Pass1!"),
        display_name="Owner",
        role=UserRole.buyer,
    )
    db_session.add(u)
    await db_session.flush()
    c = Campaign(
        name="C", budget=Decimal("10"), status=CampaignStatus.active, owner_id=u.id
    )
    db_session.add(c)
    await db_session.flush()
    ag = AdGroup(campaign_id=c.id, sort_order=0)
    db_session.add(ag)
    await db_session.flush()
    return ag


@pytest.mark.asyncio
async def test_create_creative(db_session: AsyncSession, ad_group: AdGroup) -> None:
    cr = await create_creative(
        db_session, ad_group.id, name="Banner1", ad_type="banner", click_url="https://x.com"
    )
    assert cr.id is not None
    assert cr.name == "Banner1"
    assert cr.ad_type == "banner"
    assert cr.ad_group_id == ad_group.id


@pytest.mark.asyncio
async def test_create_creative_invalid_ad_type(db_session: AsyncSession, ad_group: AdGroup) -> None:
    with pytest.raises(InvalidAdTypeError):
        await create_creative(db_session, ad_group.id, name="Bad", ad_type="popup")


@pytest.mark.asyncio
async def test_list_creatives_by_ad_group(db_session: AsyncSession, ad_group: AdGroup) -> None:
    await create_creative(db_session, ad_group.id, name="A", ad_type="banner", sort_order=1)
    await create_creative(db_session, ad_group.id, name="B", ad_type="native", sort_order=0)
    items = await list_creatives_by_ad_group(db_session, ad_group.id)
    assert len(items) == 2
    assert items[0].sort_order <= items[1].sort_order


@pytest.mark.asyncio
async def test_update_creative(db_session: AsyncSession, ad_group: AdGroup) -> None:
    cr = await create_creative(db_session, ad_group.id, name="Old", ad_type="banner")
    updated = await update_creative(db_session, cr.id, ad_group.id, name="New", ad_type="video")
    assert updated is not None
    assert updated.name == "New"
    assert updated.ad_type == "video"


@pytest.mark.asyncio
async def test_update_creative_invalid_ad_type(db_session: AsyncSession, ad_group: AdGroup) -> None:
    cr = await create_creative(db_session, ad_group.id, name="X", ad_type="banner")
    with pytest.raises(InvalidAdTypeError):
        await update_creative(db_session, cr.id, ad_group.id, ad_type="popup")


@pytest.mark.asyncio
async def test_delete_creative(db_session: AsyncSession, ad_group: AdGroup) -> None:
    cr = await create_creative(db_session, ad_group.id, name="Del", ad_type="native")
    assert await delete_creative(db_session, cr.id, ad_group.id) is True
    assert await get_creative_by_id(db_session, cr.id, ad_group.id) is None
    assert await delete_creative(db_session, cr.id, ad_group.id) is False
