# Implementation Plan: Advertising Campaign Management

**Branch**: `006-campaign-management` | **Date**: 2026-02-27 | **Spec**: [spec.md](spec.md)
**Input**: Feature specification from `/specs/006-campaign-management/spec.md`
**User constraint**: Do not forget optimistic locking during campaign update; pay attention to tests ensuring this behavior.

## Summary

Add a **buyer** role and full **advertising campaign** management: campaigns (name, budget, status, owner) with nested **ad groups** (targeting: country, platform, browser, timezone, SSP/source white/blacklists) and **creatives** (name, ad type, click URL, icon, image). Campaign listing supports search, multi-column sort (up to two fields), per-user column setup (popup, persisted), archive with confirmation, and edit navigation. **Optimistic locking** is required on campaign update (including ownership transfer): version/timestamp is used so concurrent saves are rejected with a clear message; tests MUST verify this behavior. Buyers see only their campaigns; admins see all and can filter by owner. Archived campaigns are view-only. Deleted-owner campaigns reassign to a designated system owner.

## Technical Context

**Language/Version**: Python 3.12 (backend), TypeScript / React 18 (frontend)
**Primary Dependencies**: FastAPI, SQLAlchemy async, React Router v6, existing auth and media (MinIO) stack
**Storage**: PostgreSQL (campaigns, ad groups, creatives, column config); existing MinIO for creative icon/image blobs
**Testing**: pytest + pytest-asyncio (backend); Vitest + React Testing Library (frontend). **Optimistic locking**: unit and contract tests MUST assert that campaign update with stale version returns 409 and does not overwrite; frontend tests MUST assert conflict message is shown and user can refresh.
**Target Platform**: Linux container (Docker Compose)
**Project Type**: Web application (FastAPI backend + React SPA)
**Performance Goals**: Campaign list/search/sort responsive under 500 ms for typical datasets; edit page load under 1 s
**Constraints**: Campaign updates MUST use version field for optimistic locking; tests MUST cover conflict path
**Scale/Scope**: Single-tenant; hundreds of campaigns per buyer; ad groups/creatives per campaign in tens (limits TBD in implementation)

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

- **Tests for each story**: Plan identifies tests first (TDD). Buyer role access (unit + contract); Campaign CRUD including **optimistic locking tests** (unit: service rejects stale version; contract: PATCH returns 409 when version mismatch); Ad groups and Creatives (unit + contract); Listing search/sort/column-setup (contract + frontend). **Optimistic locking behavior MUST have dedicated failing tests before implementation.**
- **Service boundaries**: Backend owns campaigns, ad groups, creatives, column config; frontend consumes REST API. No new microservices; existing backend/frontend boundaries respected.
- **Docker**: Existing backend and frontend images; no new services. Migrations run on backend startup.
- **Deviations**: None. Optimistic locking and its tests are first-class requirements.

**Constitution Check**: PASS.

## Project Structure

### Documentation (this feature)

```text
specs/006-campaign-management/
├── plan.md              # This file
├── research.md          # Phase 0: optimistic lock, buyer role, ad type, column config, designated owner
├── data-model.md        # Campaign (with version), AdGroup, Creative, ColumnConfig; User role extension
├── contracts/           # Campaign API (CRUD, list, version/409), column-config API
├── quickstart.md        # Run and verify
└── tasks.md             # From /speckit.tasks
```

### Source Code (repository root)

```text
backend/
├── src/
│   ├── core/
│   │   └── settings.py           # Optional: DESIGNATED_SYSTEM_OWNER_ID or env
│   ├── models/
│   │   ├── user.py                # + UserRole.buyer
│   │   ├── campaign.py            # NEW: Campaign (version, name, budget, status, owner_id)
│   │   ├── ad_group.py            # NEW: AdGroup (campaign_id, targeting fields)
│   │   ├── creative.py            # NEW: Creative (ad_group_id, name, ad_type, click_url, icon_id, image_id)
│   │   └── column_config.py       # NEW: ColumnConfig (user_id, context, column_ids order)
│   ├── schemas/
│   │   └── campaign.py            # NEW: request/response schemas; include version in GET/PATCH
│   ├── services/
│   │   ├── campaign_service.py    # NEW: CRUD + optimistic lock check on update
│   │   └── column_config_service.py
│   └── api/
│       ├── campaign.py            # NEW: CRUD, list (search, sort, filter); PATCH returns 409 on version conflict
│       └── profile.py / auth       # Existing; admin role check for filter-by-owner
└── tests/
    ├── unit/
    │   └── test_campaign_service.py  # MUST: test update rejects stale version (optimistic lock)
    ├── contract/
    │   └── test_campaign_api.py      # MUST: test PATCH 409 when version mismatch
    └── fakes/

frontend/
├── src/
│   ├── components/
│   │   ├── CampaignList.tsx       # Table, search, sort, column-setup popup, archive confirm
│   │   ├── CampaignEdit.tsx       # Form + ad group blocks + creatives; send version on save
│   │   └── ...
│   ├── pages/
│   │   ├── Campaigns.tsx          # Listing (buyer: own; admin: all + owner filter)
│   │   └── CampaignEditPage.tsx  # Detail/edit; handle 409 conflict message
│   ├── contexts/
│   │   └── AuthContext.tsx        # Already has role; buyer vs admin routing
│   └── services/
│       └── api.ts                 # campaignApi.get/list/create/update/archive; pass version; handle 409
└── tests/
    └── ...                         # MUST: test conflict message shown on 409 (optimistic lock)
```

**Structure Decision**: Existing backend + frontend layout. New models under `backend/src/models/`, new API under `backend/src/api/campaign.py`. Frontend campaign pages and components under existing `pages/` and `components/`. Optimistic locking: backend stores `version` (or `updated_at`) on Campaign; API returns it in GET and expects it in PATCH; PATCH returns 409 when version mismatch; frontend shows message and offers refresh.

## Implementation Phases (High Level)

### Phase A — Buyer role and access
- Add `UserRole.buyer`; migration for enum extension; admin can set role; buyer sees only own campaigns (enforced in list API).
- Tests: unit for role; contract for list filtered by owner for buyer.

### Phase B — Campaign CRUD and optimistic locking
- Campaign model (name, budget, status, owner_id, **version**); ad_group and creative models (minimal for this phase or full).
- Campaign service: create, get_by_id, update. **Update MUST check version: if request version != current DB version, return conflict (no write).**
- API: GET returns version; PATCH accepts version in body; on conflict return 409 with message.
- **Tests (TDD)**: (1) Unit: `test_campaign_update_rejects_stale_version` — update with old version leaves DB unchanged and returns conflict. (2) Contract: `test_patch_campaign_returns_409_when_version_mismatch` — PATCH with wrong version returns 409 and body indicates refresh. (3) Frontend: test that on 409 the UI shows conflict message and refresh/retry.
- Then implement service and API to make tests pass.

### Phase C — Ad groups and creatives
- Full AdGroup/Creative models and APIs (nested under campaign or dedicated endpoints); edit page with blocks and inline creatives.
- Reuse existing media upload for creative icon/image; store references in Creative.

### Phase D — Listing: search, sort, column setup
- List endpoint with search (all campaign fields), sort (up to two fields), admin filter by owner.
- ColumnConfig model and API; save/load per user; at least one column enforced.
- Frontend: table, column-setup popup, archive confirmation.

### Phase E — Archive and view-only; designated system owner
- Archive action (status → archive); detail/edit page read-only when archived.
- On user delete: reassign campaigns to designated system owner (config or fixed ID).

## Complexity Tracking

No constitution violations. Optimistic locking and tests are required by spec and plan; no deviations.

| Topic | Decision |
|-------|----------|
| Optimistic locking | Version field on Campaign; PATCH checks version; 409 on mismatch; tests must verify reject path and message. |
| Tests for locking | Unit (service), contract (API 409), frontend (409 message/refresh). |
