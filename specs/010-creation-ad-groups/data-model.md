# Data Model: Ad Groups and Creatives on Campaign Creation

## No New Entities

This feature introduces **no new database tables or model classes**. The `Campaign`, `AdGroup`, and `Creative` models and their relationships are unchanged.

## Schema Changes

### Backend: `CampaignCreate` (additive)

`backend/src/schemas/campaign.py` — the `CampaignCreate` Pydantic model gains one optional field:

| Field | Type | Default | Description |
|-------|------|---------|-------------|
| `ad_groups` | `list[AdGroupUpsert] \| None` | `None` | Optional ad groups to create with the campaign. Each item follows the existing `AdGroupUpsert` schema. |

All items in `ad_groups` MUST have `id: None` (or omit `id`) — supplying a non-null `id` on creation is rejected with HTTP 422.

Existing `AdGroupUpsert` and `CreativeUpsert` schemas are used as-is, unchanged.

### Frontend: `campaignApi.create()` (additive)

`frontend/src/services/api.ts` — the `create` method's parameter type gains one optional field:

| Field | Type | Description |
|-------|------|-------------|
| `ad_groups` | `AdGroupUpsert[] \| undefined` | Optional ad groups, same type as used in `update()` |

The `AdGroupUpsert` and `CreativeUpsert` TypeScript types already exist in `api.ts` and are used unchanged.

## Existing Entities (Reference)

### Campaign

Owned by a user. Has zero or more `AdGroup` children.

| Column | Type | Notes |
|--------|------|-------|
| `id` | UUID PK | |
| `name` | str (1–255) | |
| `budget` | Decimal ≥ 0 | |
| `status` | enum: active, pause, archive | |
| `owner_id` | UUID FK → User | |
| `version` | int | Optimistic locking counter |

### AdGroup

Belongs to a `Campaign`. Has zero or more `Creative` children.

| Column | Type | Notes |
|--------|------|-------|
| `id` | UUID PK | |
| `campaign_id` | UUID FK → Campaign | |
| `country_targets` | str \| null | Comma-separated codes |
| `platform_targets` | str \| null | |
| `browser_targets` | str \| null | |
| `timezone_targets` | str \| null | |
| `ssp_id_whitelist` | str \| null | |
| `ssp_id_blacklist` | str \| null | |
| `source_id_whitelist` | str \| null | |
| `source_id_blacklist` | str \| null | |
| `sort_order` | int | |

### Creative

Belongs to an `AdGroup`.

| Column | Type | Notes |
|--------|------|-------|
| `id` | UUID PK | |
| `ad_group_id` | UUID FK → AdGroup | |
| `name` | str (1–255) | Required |
| `ad_type` | str (max 64) | e.g. banner, native, video |
| `click_url` | str \| null | |
| `icon_storage_path` | str \| null | |
| `image_storage_path` | str \| null | |
| `sort_order` | int | |

## State Transitions

No change to campaign status state machine. Ad groups and creatives have no status field.

## Impact Summary

| Layer | File | Change |
|-------|------|--------|
| Backend schema | `backend/src/schemas/campaign.py` | Add `ad_groups` field to `CampaignCreate` |
| Backend endpoint | `backend/src/api/campaign.py` | Handle `body.ad_groups` in `post_campaign` |
| Frontend service | `frontend/src/services/api.ts` | Add `ad_groups?` to `create()` parameter type |
| Frontend component | `frontend/src/components/AdGroupsSection.tsx` | New shared component (extracted from `CampaignEditPage`) |
| Frontend page | `frontend/src/pages/CampaignNewPage.tsx` | Add `AdGroupsSection` + `ad_groups` state |
| Frontend CSS | `frontend/src/pages/CampaignEditPage.css` | Already covers `campaign-edit__ad-group-*`; imported from `CampaignNewPage` |
| Backend tests | `backend/tests/test_campaign_create_with_ad_groups.py` | New file |
| Frontend tests | `frontend/src/pages/CampaignNewPage.test.tsx` | Extended |
| E2E tests | `frontend/e2e/02-campaign-create-list.spec.ts` | New scenario |
| E2E docs | `docs/e2e-scenarios.md` | New row added |
