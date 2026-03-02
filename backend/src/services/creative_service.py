"""Creative CRUD; validates ad_type against allowed set."""
from uuid import UUID

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from models.creative import ALLOWED_AD_TYPES, Creative


class InvalidAdTypeError(Exception):
    pass


async def create_creative(
    db: AsyncSession,
    ad_group_id: UUID,
    *,
    name: str,
    ad_type: str,
    click_url: str | None = None,
    icon_storage_path: str | None = None,
    image_storage_path: str | None = None,
    sort_order: int = 0,
) -> Creative:
    if ad_type not in ALLOWED_AD_TYPES:
        raise InvalidAdTypeError(f"ad_type must be one of {sorted(ALLOWED_AD_TYPES)}")
    creative = Creative(
        ad_group_id=ad_group_id,
        name=name,
        ad_type=ad_type,
        click_url=click_url,
        icon_storage_path=icon_storage_path,
        image_storage_path=image_storage_path,
        sort_order=sort_order,
    )
    db.add(creative)
    await db.flush()
    return creative


async def list_creatives_by_ad_group(
    db: AsyncSession,
    ad_group_id: UUID,
) -> list[Creative]:
    result = await db.execute(
        select(Creative)
        .where(Creative.ad_group_id == ad_group_id)
        .order_by(Creative.sort_order.asc(), Creative.created_at.asc())
    )
    return list(result.scalars().all())


async def get_creative_by_id(
    db: AsyncSession,
    creative_id: UUID,
    ad_group_id: UUID,
) -> Creative | None:
    result = await db.execute(
        select(Creative).where(
            Creative.id == creative_id,
            Creative.ad_group_id == ad_group_id,
        )
    )
    return result.scalar_one_or_none()


async def update_creative(
    db: AsyncSession,
    creative_id: UUID,
    ad_group_id: UUID,
    *,
    name: str | None = None,
    ad_type: str | None = None,
    click_url: str | None = None,
    icon_storage_path: str | None = None,
    image_storage_path: str | None = None,
    sort_order: int | None = None,
) -> Creative | None:
    creative = await get_creative_by_id(db, creative_id, ad_group_id)
    if not creative:
        return None
    if ad_type is not None:
        if ad_type not in ALLOWED_AD_TYPES:
            raise InvalidAdTypeError(f"ad_type must be one of {sorted(ALLOWED_AD_TYPES)}")
        creative.ad_type = ad_type
    if name is not None:
        creative.name = name
    if click_url is not None:
        creative.click_url = click_url
    if icon_storage_path is not None:
        creative.icon_storage_path = icon_storage_path
    if image_storage_path is not None:
        creative.image_storage_path = image_storage_path
    if sort_order is not None:
        creative.sort_order = sort_order
    await db.flush()
    return creative


async def delete_creative(
    db: AsyncSession,
    creative_id: UUID,
    ad_group_id: UUID,
) -> bool:
    creative = await get_creative_by_id(db, creative_id, ad_group_id)
    if not creative:
        return False
    await db.delete(creative)
    await db.flush()
    return True
