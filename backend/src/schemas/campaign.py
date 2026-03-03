"""Pydantic schemas for campaign API."""
from datetime import datetime
from decimal import Decimal
from uuid import UUID

from pydantic import BaseModel, ConfigDict, Field, model_validator

from models.campaign import CampaignStatus


class CreativeResponse(BaseModel):
    """Creative for ad group detail (GET)."""

    model_config = ConfigDict(from_attributes=True)

    id: UUID
    ad_group_id: UUID
    name: str
    ad_type: str
    click_url: str | None
    icon_storage_path: str | None
    image_storage_path: str | None
    sort_order: int
    created_at: datetime
    updated_at: datetime


class CreativeUpsert(BaseModel):
    """Create or update creative in PATCH; id present = update, absent = create."""

    id: UUID | None = None
    name: str = Field(..., min_length=1, max_length=255)
    ad_type: str = Field(..., max_length=64)
    click_url: str | None = None
    icon_storage_path: str | None = None
    image_storage_path: str | None = None
    sort_order: int = 0


class AdGroupResponse(BaseModel):
    """Ad group for campaign detail (GET)."""

    model_config = ConfigDict(from_attributes=True)

    id: UUID
    campaign_id: UUID
    country_targets: str | None
    platform_targets: str | None
    browser_targets: str | None
    timezone_targets: str | None
    ssp_id_whitelist: str | None
    ssp_id_blacklist: str | None
    source_id_whitelist: str | None
    source_id_blacklist: str | None
    sort_order: int
    created_at: datetime
    updated_at: datetime
    creatives: list[CreativeResponse] = []


class AdGroupCreate(BaseModel):
    """Payload to create an ad group (nested or standalone)."""

    country_targets: str | None = None
    platform_targets: str | None = None
    browser_targets: str | None = None
    timezone_targets: str | None = None
    ssp_id_whitelist: str | None = None
    ssp_id_blacklist: str | None = None
    source_id_whitelist: str | None = None
    source_id_blacklist: str | None = None
    sort_order: int = 0


class AdGroupUpdate(BaseModel):
    """Payload to update an ad group (partial)."""

    country_targets: str | None = None
    platform_targets: str | None = None
    browser_targets: str | None = None
    timezone_targets: str | None = None
    ssp_id_whitelist: str | None = None
    ssp_id_blacklist: str | None = None
    source_id_whitelist: str | None = None
    source_id_blacklist: str | None = None
    sort_order: int | None = None


class AdGroupUpsert(BaseModel):
    """Create or update ad group in PATCH campaign; id present = update, absent = create."""

    id: UUID | None = None
    country_targets: str | None = None
    platform_targets: str | None = None
    browser_targets: str | None = None
    timezone_targets: str | None = None
    ssp_id_whitelist: str | None = None
    ssp_id_blacklist: str | None = None
    source_id_whitelist: str | None = None
    source_id_blacklist: str | None = None
    sort_order: int = 0
    creatives: list[CreativeUpsert] | None = None


class CreativeCreateNested(BaseModel):
    """Creative nested inside CampaignCreate — no id allowed."""

    model_config = ConfigDict(extra="forbid")

    name: str = Field(..., min_length=1, max_length=255)
    ad_type: str = Field(..., max_length=64)
    click_url: str | None = None
    icon_storage_path: str | None = None
    image_storage_path: str | None = None
    sort_order: int = 0


class AdGroupCreateNested(BaseModel):
    """Ad group nested inside CampaignCreate — no id allowed."""

    model_config = ConfigDict(extra="forbid")

    country_targets: str | None = None
    platform_targets: str | None = None
    browser_targets: str | None = None
    timezone_targets: str | None = None
    ssp_id_whitelist: str | None = None
    ssp_id_blacklist: str | None = None
    source_id_whitelist: str | None = None
    source_id_blacklist: str | None = None
    sort_order: int = 0
    creatives: list[CreativeCreateNested] = []


class CampaignCreate(BaseModel):
    name: str = Field(..., min_length=1, max_length=255)
    budget: Decimal = Field(..., ge=0)
    status: CampaignStatus = CampaignStatus.active
    ad_groups: list[AdGroupCreateNested] | None = None


class CampaignUpdate(BaseModel):
    name: str | None = Field(None, min_length=1, max_length=255)
    budget: Decimal | None = Field(None, ge=0)
    status: CampaignStatus | None = None
    owner_id: UUID | None = None
    version: int = Field(..., description="Current version for optimistic locking")
    ad_groups: list[AdGroupUpsert] | None = None  # full replace: create/update/delete


class CampaignResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: UUID
    name: str
    budget: Decimal
    status: CampaignStatus
    owner_id: UUID
    version: int
    created_at: datetime
    updated_at: datetime
    ad_groups: list[AdGroupResponse] = []


class CampaignSummary(BaseModel):
    """Campaign row for list; may include owner_display_name."""

    model_config = ConfigDict(from_attributes=True)

    id: UUID
    name: str
    budget: Decimal
    status: CampaignStatus
    owner_id: UUID
    version: int
    created_at: datetime
    updated_at: datetime
    owner_display_name: str | None = None


class CampaignListResponse(BaseModel):
    items: list[CampaignSummary]
    total: int
