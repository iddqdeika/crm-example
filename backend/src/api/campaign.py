"""Campaign CRUD and list; optimistic locking on PATCH."""
from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.ext.asyncio import AsyncSession

from core.auth import get_current_user
from core.database import get_db
from models.campaign import Campaign, CampaignStatus
from models.user import User, UserRole
from schemas.campaign import (
    AdGroupResponse,
    AdGroupUpsert,
    CampaignCreate,
    CampaignListResponse,
    CampaignResponse,
    CampaignSummary,
    CampaignUpdate,
    CreativeResponse,
)
from services.ad_group_service import (
    create_ad_group,
    delete_ad_group,
    list_ad_groups_by_campaign,
    update_ad_group,
)
from services.campaign_service import (
    ArchivedError,
    ConflictError,
    create_campaign,
    get_campaign_by_id,
    list_campaigns,
    update_campaign,
)
from services.creative_service import (
    create_creative,
    delete_creative,
    list_creatives_by_ad_group,
    update_creative,
)

router = APIRouter(prefix="/campaigns", tags=["campaigns"])


def _creative_to_response(cr) -> CreativeResponse:
    return CreativeResponse(
        id=cr.id,
        ad_group_id=cr.ad_group_id,
        name=cr.name,
        ad_type=cr.ad_type,
        click_url=cr.click_url,
        icon_storage_path=cr.icon_storage_path,
        image_storage_path=cr.image_storage_path,
        sort_order=cr.sort_order,
        created_at=cr.created_at,
        updated_at=cr.updated_at,
    )


def _ad_group_to_response(ag, creatives: list | None = None) -> AdGroupResponse:
    cr_list = creatives if creatives is not None else []
    return AdGroupResponse(
        id=ag.id,
        campaign_id=ag.campaign_id,
        country_targets=ag.country_targets,
        platform_targets=ag.platform_targets,
        browser_targets=ag.browser_targets,
        timezone_targets=ag.timezone_targets,
        ssp_id_whitelist=ag.ssp_id_whitelist,
        ssp_id_blacklist=ag.ssp_id_blacklist,
        source_id_whitelist=ag.source_id_whitelist,
        source_id_blacklist=ag.source_id_blacklist,
        sort_order=ag.sort_order,
        created_at=ag.created_at,
        updated_at=ag.updated_at,
        creatives=[_creative_to_response(cr) for cr in cr_list],
    )


def _to_response(c: Campaign, ad_groups_with_creatives: list[tuple] | None = None) -> CampaignResponse:
    """Build response. ad_groups_with_creatives is list of (ad_group, creatives_list)."""
    ag_responses = []
    for ag, crs in (ad_groups_with_creatives or []):
        ag_responses.append(_ad_group_to_response(ag, crs))
    return CampaignResponse(
        id=c.id,
        name=c.name,
        budget=c.budget,
        status=c.status,
        owner_id=c.owner_id,
        version=c.version,
        created_at=c.created_at,
        updated_at=c.updated_at,
        ad_groups=ag_responses,
    )


async def _load_ad_groups_with_creatives(db, campaign_id: UUID) -> list[tuple]:
    ad_groups = await list_ad_groups_by_campaign(db, campaign_id)
    result = []
    for ag in ad_groups:
        crs = await list_creatives_by_ad_group(db, ag.id)
        result.append((ag, crs))
    return result


def _to_summary(c: Campaign, owner_display_name: str | None = None) -> CampaignSummary:
    return CampaignSummary(
        id=c.id,
        name=c.name,
        budget=c.budget,
        status=c.status,
        owner_id=c.owner_id,
        version=c.version,
        created_at=c.created_at,
        updated_at=c.updated_at,
        owner_display_name=owner_display_name,
    )


@router.get("", response_model=CampaignListResponse)
async def list_campaigns_endpoint(
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
    search: str | None = Query(None),
    sort: str | None = Query(None),
    sort2: str | None = Query(None),
    owner_id: UUID | None = Query(None),
    page: int = Query(1, ge=1),
    page_size: int = Query(20, ge=1, le=100),
) -> CampaignListResponse:
    is_admin = current_user.role == UserRole.admin
    if owner_id is not None and not is_admin:
        owner_id = None
    items, total = await list_campaigns(
        db,
        current_user.id,
        is_admin,
        search=search,
        sort=sort,
        sort2=sort2,
        owner_id=owner_id,
        page=page,
        page_size=page_size,
    )
    summaries = [_to_summary(c) for c in items]
    return CampaignListResponse(items=summaries, total=total)


@router.get("/{campaign_id}", response_model=CampaignResponse)
async def get_campaign(
    campaign_id: UUID,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> CampaignResponse:
    is_admin = current_user.role == UserRole.admin
    campaign = await get_campaign_by_id(db, campaign_id, current_user.id, is_admin)
    if not campaign:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Campaign not found")
    ag_with_cr = await _load_ad_groups_with_creatives(db, campaign_id)
    return _to_response(campaign, ag_with_cr)


@router.post("", response_model=CampaignResponse, status_code=status.HTTP_201_CREATED)
async def post_campaign(
    body: CampaignCreate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> CampaignResponse:
    campaign = await create_campaign(
        db,
        current_user.id,
        body.name,
        body.budget,
        body.status,
    )
    ag_with_cr: list[tuple] = []
    if body.ad_groups:
        for ag_data in body.ad_groups:
            new_ag = await create_ad_group(
                db,
                campaign.id,
                country_targets=ag_data.country_targets,
                platform_targets=ag_data.platform_targets,
                browser_targets=ag_data.browser_targets,
                timezone_targets=ag_data.timezone_targets,
                ssp_id_whitelist=ag_data.ssp_id_whitelist,
                ssp_id_blacklist=ag_data.ssp_id_blacklist,
                source_id_whitelist=ag_data.source_id_whitelist,
                source_id_blacklist=ag_data.source_id_blacklist,
                sort_order=ag_data.sort_order,
            )
            creatives = []
            for cr_data in ag_data.creatives:
                new_cr = await create_creative(
                    db,
                    new_ag.id,
                    name=cr_data.name,
                    ad_type=cr_data.ad_type,
                    click_url=cr_data.click_url,
                    icon_storage_path=cr_data.icon_storage_path,
                    image_storage_path=cr_data.image_storage_path,
                    sort_order=cr_data.sort_order,
                )
                creatives.append(new_cr)
            ag_with_cr.append((new_ag, creatives))
    await db.commit()
    return _to_response(campaign, ag_with_cr)


@router.patch("/{campaign_id}", response_model=CampaignResponse)
async def patch_campaign(
    campaign_id: UUID,
    body: CampaignUpdate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> CampaignResponse:
    is_admin = current_user.role == UserRole.admin
    try:
        campaign = await update_campaign(
            db,
            campaign_id,
            current_user.id,
            is_admin,
            name=body.name,
            budget=body.budget,
            status=body.status,
            owner_id=body.owner_id,
            version=body.version,
        )
    except ArchivedError as e:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail=str(e),
        ) from e
    except ConflictError as e:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail=str(e),
            headers={"X-Conflict-Code": "CONCURRENT_MODIFICATION"},
        ) from e
    if not campaign:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Campaign not found")
    # Apply ad_groups replace: create new, update by id, delete missing
    if body.ad_groups is not None:
        existing = await list_ad_groups_by_campaign(db, campaign_id)
        existing_ids = {ag.id for ag in existing}
        kept_ids: set[UUID] = set()
        for item in body.ad_groups:
            ag_id: UUID | None = None
            if item.id is not None and item.id in existing_ids:
                await update_ad_group(
                    db,
                    item.id,
                    campaign_id,
                    country_targets=item.country_targets,
                    platform_targets=item.platform_targets,
                    browser_targets=item.browser_targets,
                    timezone_targets=item.timezone_targets,
                    ssp_id_whitelist=item.ssp_id_whitelist,
                    ssp_id_blacklist=item.ssp_id_blacklist,
                    source_id_whitelist=item.source_id_whitelist,
                    source_id_blacklist=item.source_id_blacklist,
                    sort_order=item.sort_order,
                )
                kept_ids.add(item.id)
                ag_id = item.id
            elif item.id is None:
                new_ag = await create_ad_group(
                    db,
                    campaign_id,
                    country_targets=item.country_targets,
                    platform_targets=item.platform_targets,
                    browser_targets=item.browser_targets,
                    timezone_targets=item.timezone_targets,
                    ssp_id_whitelist=item.ssp_id_whitelist,
                    ssp_id_blacklist=item.ssp_id_blacklist,
                    source_id_whitelist=item.source_id_whitelist,
                    source_id_blacklist=item.source_id_blacklist,
                    sort_order=item.sort_order,
                )
                ag_id = new_ag.id
            # Sync creatives for this ad group
            if ag_id is not None and item.creatives is not None:
                existing_cr = await list_creatives_by_ad_group(db, ag_id)
                existing_cr_ids = {cr.id for cr in existing_cr}
                kept_cr_ids: set[UUID] = set()
                for cr_item in item.creatives:
                    if cr_item.id is not None and cr_item.id in existing_cr_ids:
                        await update_creative(
                            db, cr_item.id, ag_id,
                            name=cr_item.name, ad_type=cr_item.ad_type,
                            click_url=cr_item.click_url,
                            icon_storage_path=cr_item.icon_storage_path,
                            image_storage_path=cr_item.image_storage_path,
                            sort_order=cr_item.sort_order,
                        )
                        kept_cr_ids.add(cr_item.id)
                    else:
                        await create_creative(
                            db, ag_id,
                            name=cr_item.name, ad_type=cr_item.ad_type,
                            click_url=cr_item.click_url,
                            icon_storage_path=cr_item.icon_storage_path,
                            image_storage_path=cr_item.image_storage_path,
                            sort_order=cr_item.sort_order,
                        )
                for cr in existing_cr:
                    if cr.id not in kept_cr_ids:
                        await delete_creative(db, cr.id, ag_id)
        for ag in existing:
            if ag.id not in kept_ids:
                await delete_ad_group(db, ag.id, campaign_id)
    ag_with_cr = await _load_ad_groups_with_creatives(db, campaign_id)
    return _to_response(campaign, ag_with_cr)
