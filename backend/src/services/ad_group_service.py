"""Ad group CRUD; enforces campaign ownership for non-admin."""
from uuid import UUID

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from models.ad_group import AdGroup
from models.campaign import Campaign


async def create_ad_group(
    db: AsyncSession,
    campaign_id: UUID,
    *,
    country_targets: str | None = None,
    platform_targets: str | None = None,
    browser_targets: str | None = None,
    timezone_targets: str | None = None,
    ssp_id_whitelist: str | None = None,
    ssp_id_blacklist: str | None = None,
    source_id_whitelist: str | None = None,
    source_id_blacklist: str | None = None,
    sort_order: int = 0,
) -> AdGroup:
    ad_group = AdGroup(
        campaign_id=campaign_id,
        country_targets=country_targets,
        platform_targets=platform_targets,
        browser_targets=browser_targets,
        timezone_targets=timezone_targets,
        ssp_id_whitelist=ssp_id_whitelist,
        ssp_id_blacklist=ssp_id_blacklist,
        source_id_whitelist=source_id_whitelist,
        source_id_blacklist=source_id_blacklist,
        sort_order=sort_order,
    )
    db.add(ad_group)
    await db.flush()
    return ad_group


async def list_ad_groups_by_campaign(
    db: AsyncSession,
    campaign_id: UUID,
) -> list[AdGroup]:
    result = await db.execute(
        select(AdGroup)
        .where(AdGroup.campaign_id == campaign_id)
        .order_by(AdGroup.sort_order.asc(), AdGroup.created_at.asc())
    )
    return list(result.scalars().all())


async def get_ad_group_by_id(
    db: AsyncSession,
    ad_group_id: UUID,
    campaign_id: UUID,
) -> AdGroup | None:
    result = await db.execute(
        select(AdGroup).where(
            AdGroup.id == ad_group_id,
            AdGroup.campaign_id == campaign_id,
        )
    )
    return result.scalar_one_or_none()


async def update_ad_group(
    db: AsyncSession,
    ad_group_id: UUID,
    campaign_id: UUID,
    *,
    country_targets: str | None = None,
    platform_targets: str | None = None,
    browser_targets: str | None = None,
    timezone_targets: str | None = None,
    ssp_id_whitelist: str | None = None,
    ssp_id_blacklist: str | None = None,
    source_id_whitelist: str | None = None,
    source_id_blacklist: str | None = None,
    sort_order: int | None = None,
) -> AdGroup | None:
    ad_group = await get_ad_group_by_id(db, ad_group_id, campaign_id)
    if not ad_group:
        return None
    if country_targets is not None:
        ad_group.country_targets = country_targets
    if platform_targets is not None:
        ad_group.platform_targets = platform_targets
    if browser_targets is not None:
        ad_group.browser_targets = browser_targets
    if timezone_targets is not None:
        ad_group.timezone_targets = timezone_targets
    if ssp_id_whitelist is not None:
        ad_group.ssp_id_whitelist = ssp_id_whitelist
    if ssp_id_blacklist is not None:
        ad_group.ssp_id_blacklist = ssp_id_blacklist
    if source_id_whitelist is not None:
        ad_group.source_id_whitelist = source_id_whitelist
    if source_id_blacklist is not None:
        ad_group.source_id_blacklist = source_id_blacklist
    if sort_order is not None:
        ad_group.sort_order = sort_order
    await db.flush()
    return ad_group


async def delete_ad_group(
    db: AsyncSession,
    ad_group_id: UUID,
    campaign_id: UUID,
) -> bool:
    ad_group = await get_ad_group_by_id(db, ad_group_id, campaign_id)
    if not ad_group:
        return False
    await db.delete(ad_group)
    await db.flush()
    return True
