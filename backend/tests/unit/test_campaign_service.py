"""Unit tests for campaign service; optimistic locking (US2)."""
from decimal import Decimal
from uuid import uuid4

import pytest
from sqlalchemy.ext.asyncio import AsyncSession

from models.campaign import Campaign, CampaignStatus
from models.user import User, UserRole
from services.campaign_service import (
    ConflictError,
    create_campaign,
    get_campaign_by_id,
    update_campaign,
)
from services.auth_service import hash_password


@pytest.fixture
async def buyer_user(db_session: AsyncSession) -> User:
    u = User(
        email="buyer@test.com",
        hashed_password=hash_password("Pass1!"),
        display_name="Buyer",
        role=UserRole.buyer,
    )
    db_session.add(u)
    await db_session.flush()
    return u


@pytest.mark.asyncio
async def test_campaign_update_rejects_stale_version(
    db_session: AsyncSession, buyer_user: User
) -> None:
    """Update with old version leaves DB unchanged and raises ConflictError (T016)."""
    campaign = await create_campaign(
        db_session, buyer_user.id, "Campaign", Decimal("100"), CampaignStatus.active
    )
    await db_session.flush()
    # First update: version becomes 2
    await update_campaign(
        db_session,
        campaign.id,
        buyer_user.id,
        False,
        name="Updated",
        version=campaign.version,
    )
    await db_session.flush()
    # Second update with stale version 1 should raise
    with pytest.raises(ConflictError) as exc_info:
        await update_campaign(
            db_session,
            campaign.id,
            buyer_user.id,
            False,
            name="Stale",
            version=1,
        )
    assert "refresh" in str(exc_info.value).lower()
    # DB should still have "Updated" and version 2
    result = await get_campaign_by_id(db_session, campaign.id, buyer_user.id, False)
    assert result is not None
    assert result.name == "Updated"
    assert result.version == 2


@pytest.mark.asyncio
async def test_campaign_update_succeeds_when_version_matches(
    db_session: AsyncSession, buyer_user: User
) -> None:
    """Update with correct version succeeds and increments version (T017)."""
    campaign = await create_campaign(
        db_session, buyer_user.id, "Campaign", Decimal("50"), CampaignStatus.pause
    )
    await db_session.flush()
    updated = await update_campaign(
        db_session,
        campaign.id,
        buyer_user.id,
        False,
        name="New Name",
        budget=Decimal("75"),
        version=campaign.version,
    )
    assert updated is not None
    assert updated.name == "New Name"
    assert updated.budget == Decimal("75")
    assert updated.version == 2
