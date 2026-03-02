"""Campaign CRUD and list; optimistic locking on update."""
from decimal import Decimal
from uuid import UUID

from sqlalchemy import select, func, update as sql_update
from sqlalchemy.ext.asyncio import AsyncSession

from models.campaign import Campaign, CampaignStatus


class ConflictError(Exception):
    """Raised when update fails due to version mismatch (optimistic lock)."""
    pass


class ArchivedError(Exception):
    """Raised when attempting to modify an archived campaign."""
    pass


async def create_campaign(
    db: AsyncSession,
    owner_id: UUID,
    name: str,
    budget: Decimal,
    status: CampaignStatus = CampaignStatus.active,
) -> Campaign:
    campaign = Campaign(
        name=name,
        budget=budget,
        status=status,
        owner_id=owner_id,
        version=1,
    )
    db.add(campaign)
    await db.flush()
    return campaign


async def get_campaign_by_id(
    db: AsyncSession,
    campaign_id: UUID,
    current_user_id: UUID,
    is_admin: bool,
) -> Campaign | None:
    result = await db.execute(
        select(Campaign).where(Campaign.id == campaign_id)
    )
    campaign = result.scalar_one_or_none()
    if not campaign:
        return None
    if not is_admin and campaign.owner_id != current_user_id:
        return None
    return campaign


async def update_campaign(
    db: AsyncSession,
    campaign_id: UUID,
    current_user_id: UUID,
    is_admin: bool,
    *,
    name: str | None = None,
    budget: Decimal | None = None,
    status: CampaignStatus | None = None,
    owner_id: UUID | None = None,
    version: int,
) -> Campaign:
    campaign = await get_campaign_by_id(db, campaign_id, current_user_id, is_admin)
    if not campaign:
        return None  # 404
    if campaign.status == CampaignStatus.archive:
        raise ArchivedError("Archived campaigns are view-only and cannot be modified.")
    if campaign.version != version:
        raise ConflictError("Campaign was updated by someone else; please refresh and try again.")
    if name is not None:
        campaign.name = name
    if budget is not None:
        campaign.budget = budget
    if status is not None:
        campaign.status = status
    if owner_id is not None:
        campaign.owner_id = owner_id
    campaign.version += 1
    await db.flush()
    return campaign


async def list_campaigns(
    db: AsyncSession,
    current_user_id: UUID,
    is_admin: bool,
    *,
    search: str | None = None,
    sort: str | None = None,
    sort2: str | None = None,
    owner_id: UUID | None = None,
    page: int = 1,
    page_size: int = 20,
) -> tuple[list[Campaign], int]:
    base = select(Campaign)
    count_q = select(func.count()).select_from(Campaign)
    if not is_admin:
        base = base.where(Campaign.owner_id == current_user_id)
        count_q = count_q.where(Campaign.owner_id == current_user_id)
    if owner_id is not None and is_admin:
        base = base.where(Campaign.owner_id == owner_id)
        count_q = count_q.where(Campaign.owner_id == owner_id)
    if search:
        term = f"%{search}%"
        base = base.where(Campaign.name.ilike(term))
        count_q = count_q.where(Campaign.name.ilike(term))
    # Sort: allow name, budget, status, created_at, updated_at
    order_cols = {
        "name": Campaign.name,
        "budget": Campaign.budget,
        "status": Campaign.status,
        "created_at": Campaign.created_at,
        "updated_at": Campaign.updated_at,
    }
    if sort:
        col = order_cols.get(sort.lstrip("-"), Campaign.created_at)
        if sort.startswith("-"):
            base = base.order_by(col.desc())
        else:
            base = base.order_by(col.asc())
    if sort2:
        col2 = order_cols.get(sort2.lstrip("-"), Campaign.updated_at)
        if sort2.startswith("-"):
            base = base.order_by(col2.desc())
        else:
            base = base.order_by(col2.asc())
    total_result = await db.execute(count_q)
    total = total_result.scalar() or 0
    base = base.offset((page - 1) * page_size).limit(page_size)
    if not sort and not sort2:
        base = base.order_by(Campaign.created_at.desc())
    result = await db.execute(base)
    items = list(result.scalars().all())
    return items, total


async def reassign_campaigns(
    db: AsyncSession,
    from_user_id: UUID,
    to_user_id: UUID,
) -> int:
    """Reassign all campaigns owned by from_user_id to to_user_id. Returns count."""
    result = await db.execute(
        sql_update(Campaign)
        .where(Campaign.owner_id == from_user_id)
        .values(owner_id=to_user_id)
    )
    await db.flush()
    return result.rowcount  # type: ignore[return-value]


async def count_campaigns_by_owner(db: AsyncSession, owner_id: UUID) -> int:
    result = await db.execute(
        select(func.count()).select_from(Campaign).where(Campaign.owner_id == owner_id)
    )
    return result.scalar() or 0
