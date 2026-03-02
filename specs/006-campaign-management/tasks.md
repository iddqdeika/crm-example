# Tasks: Advertising Campaign Management

**Input**: Design documents from `/specs/006-campaign-management/`
**Branch**: `006-campaign-management`
**Prerequisites**: plan.md ✅ spec.md ✅ research.md ✅ data-model.md ✅ contracts/ ✅ quickstart.md ✅

**Tests**: TDD is MANDATORY (constitution + plan). Test tasks appear before implementation. Optimistic locking MUST have dedicated tests: unit (service rejects stale version), contract (PATCH 409), frontend (409 message/refresh).

**Organization**: Tasks grouped by user story for independent implementation and testing.

---

## Phase 1: Setup

**Purpose**: Configuration and migration chain readiness.

- [x] T001 Add `designated_system_owner_id` (optional UUID) to `backend/src/core/settings.py` from env `DESIGNATED_SYSTEM_OWNER_ID`; document in `.env.example`
- [x] T002 Run `alembic heads` in backend and note current head revision for subsequent migrations (e.g. 20260227_002)

**Checkpoint**: Settings load; migration chain known.

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: User role buyer and Campaign entity so US1 (access) and US2 (CRUD + optimistic lock) can build on them.

- [x] T003 Create Alembic migration `backend/migrations/versions/20260227_003_add_user_role_buyer.py`: add value `buyer` to enum `userrole` (ALTER TYPE userrole ADD VALUE 'buyer')
- [x] T004 Add `buyer = "buyer"` to `UserRole` enum in `backend/src/models/user.py`
- [x] T005 Create Alembic migration `backend/migrations/versions/20260227_004_create_campaigns_table.py`: create table `campaigns` with id, name, budget, status (enum active/pause/archive), owner_id (FK users), version (integer NOT NULL default 1), created_at, updated_at; down_revision = previous migration head
- [x] T006 Create `backend/src/models/campaign.py`: Campaign model with name, budget, status, owner_id, version, created_at, updated_at; relationship to User
- [x] T007 Create `backend/src/schemas/campaign.py`: CampaignCreate (name, budget, status), CampaignUpdate (name?, budget?, status?, owner_id?, version required), CampaignResponse (id, name, budget, status, owner_id, version, created_at, updated_at), CampaignListResponse (items, total)

**Checkpoint**: Migrations run; Campaign model and schemas exist; buyer role in code.

---

## Phase 3: User Story 1 — Buyer Role Access (Priority: P1) 🎯 MVP

**Goal**: Buyer role exists; admins can assign it; buyers can access campaigns section and cannot access admin; when they list campaigns they see only their own (enforced in list API in US2).

**Independent Test**: Assign buyer role via admin, log in as buyer, access /campaigns only; /admin redirect or 403.

### Tests for User Story 1

- [x] T008 [P] [US1] Write contract test in `backend/tests/contract/test_admin_api.py` or new file: admin can set user role to buyer (PATCH user with role=buyer); assert response and DB role
- [x] T009 [P] [US1] Write Vitest test in `frontend/src/components/AppHeader.test.tsx` or `frontend/src/pages/Campaigns.test.tsx`: when user has role buyer, admin link is not shown (or is hidden); when role is admin, admin link is shown
- [x] T010 [P] [US1] Write Vitest test: buyer navigating to /admin is redirected (e.g. to /dashboard) or sees access denied; in `frontend/src/App.test.tsx` or route guard test

### Implementation for User Story 1

- [x] T011 [US1] Update signup flow in `backend/src/api/auth.py` and/or `backend/src/services/auth_service.py`: set default role to buyer for new self-signup (configurable if needed)
- [x] T012 [US1] Ensure admin PATCH user in `backend/src/api/admin.py` (or equivalent) accepts role=buyer; validate against UserRole enum
- [x] T013 [US1] Add route /campaigns in `frontend/src/App.tsx`; buyer and admin can access; add Campaigns page placeholder in `frontend/src/pages/Campaigns.tsx`
- [x] T014 [US1] Update `frontend/src/components/AppHeader.tsx`: show "Campaigns" link for buyer and admin; show "Admin" link only for admin; buyer does not see Admin link
- [x] T015 [US1] Add route guard or redirect in `frontend/src/App.tsx`: when user is buyer and tries to access /admin, redirect to /dashboard or show 403

**Checkpoint**: Buyer role assignable; buyer sees Campaigns, not Admin; redirect from /admin.

---

## Phase 4: User Story 2 — Campaign CRUD and Optimistic Locking (Priority: P1)

**Goal**: Create/read/update campaign with version; list campaigns (buyer = own only, admin = all with optional owner filter); PATCH returns 409 on version mismatch; tests MUST verify optimistic locking.

**Independent Test**: Create campaign as buyer; list shows only own; PATCH with wrong version → 409; PATCH with correct version → 200 and version incremented.

### Tests for User Story 2 (write FIRST — must FAIL before implementation)

- [x] T016 [P] [US2] Write unit test in `backend/tests/unit/test_campaign_service.py`: `test_campaign_update_rejects_stale_version` — create campaign, update once (version=2), call update with version=1; assert no DB write and service returns conflict (e.g. ConflictError or tuple (False, conflict_message))
- [x] T017 [P] [US2] Write unit test in `backend/tests/unit/test_campaign_service.py`: `test_campaign_update_succeeds_when_version_matches` — create campaign, update with current version; assert 200-style success and version incremented in DB
- [x] T018 [P] [US2] Write contract test in `backend/tests/contract/test_campaign_api.py`: `test_patch_campaign_returns_409_when_version_mismatch` — create campaign, GET version V, simulate another update (version V+1), PATCH with version V; assert response 409 and body contains conflict message/code; assert campaign in DB has version V+1
- [x] T019 [P] [US2] Write contract test in `backend/tests/contract/test_campaign_api.py`: `test_patch_campaign_succeeds_when_version_matches` — create campaign, PATCH with correct version; assert 200 and version incremented in response
- [x] T020 [P] [US2] Write contract test in `backend/tests/contract/test_campaign_api.py`: buyer GET /campaigns returns only campaigns where owner_id = current user; admin GET /campaigns returns all (or filtered by owner_id query)
- [x] T021 [P] [US2] Write contract tests: POST /campaigns creates campaign with owner=current user and version=1; GET /campaigns/{id} returns version; 403 when non-owner buyer tries to GET/PATCH another's campaign
- [x] T022 [P] [US2] Write Vitest test in `frontend/src/pages/CampaignEditPage.test.tsx` or similar: when campaign save returns 409, UI shows conflict message (e.g. "Campaign was updated by someone else; please refresh and try again") and offers refresh/retry

### Implementation for User Story 2

- [x] T023 [US2] Create `backend/src/services/campaign_service.py`: create_campaign(db, user_id, name, budget, status), get_campaign_by_id(db, campaign_id, current_user_id, is_admin), update_campaign(db, campaign_id, current_user_id, is_admin, payload with version) — update rejects when payload.version != current campaign.version and returns conflict; on success increment version
- [x] T024 [US2] Create `backend/src/api/campaign.py`: GET /campaigns (query: search, sort, sort2, owner_id for admin); GET /campaigns/{id}; POST /campaigns; PATCH /campaigns/{id} (body includes version; on conflict return 409 with detail and code CONCURRENT_MODIFICATION); register router in app
- [x] T025 [US2] Implement list in campaign_service: filter by owner_id for buyer; for admin allow optional owner_id filter; search across name/status/budget/owner; sort by up to two fields
- [x] T026 [US2] Add campaign API client in `frontend/src/services/api.ts`: campaignApi.list(params), campaignApi.get(id), campaignApi.create(data), campaignApi.update(id, data with version); on 409 throw or return error with code so UI can show conflict message
- [x] T027 [US2] Create `frontend/src/pages/Campaigns.tsx`: list campaigns (call list API); show table with columns; link to create and edit; buyer sees only own (API enforces)
- [x] T028 [US2] Create `frontend/src/pages/CampaignEditPage.tsx` (or CampaignForm): load campaign (store version); form for name, budget, status; on save send version; on 409 show message and offer "Refresh" to reload campaign
- [x] T029 [US2] Add routes in `frontend/src/App.tsx`: /campaigns (list), /campaigns/new (create), /campaigns/:id (edit); protect with auth

**Checkpoint**: Campaign CRUD + list; optimistic locking tests pass; 409 on stale version; frontend shows conflict message.

---

## Phase 5: User Story 3 — Ad Groups Within a Campaign (Priority: P2)

**Goal**: Ad groups as blocks on campaign edit page; add/delete/edit targeting (country, platform, browser, timezone, whitelist/blacklist by sspID/sourceID).

**Independent Test**: Open campaign, add two ad groups, save, reload; delete one; targeting values persist.

### Tests for User Story 3

- [x] T030 [P] [US3] Write unit tests in `backend/tests/unit/test_ad_group_service.py`: create ad group under campaign, get by campaign, delete
- [x] T031 [P] [US3] Write contract tests in `backend/tests/contract/test_campaign_api.py`: GET /campaigns/{id} includes ad_groups with targeting fields; POST/PATCH ad groups (nested in campaign payload or dedicated endpoint)
- [x] T032 [P] [US3] Write Vitest test: CampaignEditPage shows ad group blocks; "Add ad group" adds block; delete removes block; fields editable

### Implementation for User Story 3

- [x] T033 [US3] Create Alembic migration `backend/migrations/versions/YYYYMMDD_005_create_ad_groups_table.py`: table ad_groups (id, campaign_id FK CASCADE, country_targets, platform_targets, browser_targets, timezone_targets, ssp_id_whitelist/blacklist, source_id_whitelist/blacklist, sort_order, created_at, updated_at)
- [x] T034 [US3] Create `backend/src/models/ad_group.py`: AdGroup model with relationships to Campaign
- [x] T035 [US3] Create `backend/src/services/ad_group_service.py`: create, list by campaign_id, update, delete; enforce campaign ownership for non-admin
- [x] T036 [US3] Extend `backend/src/schemas/campaign.py` and campaign API: GET campaign returns nested ad_groups; PATCH campaign accepts ad_groups (create/update/delete) with version check on campaign
- [x] T037 [US3] Update `frontend/src/pages/CampaignEditPage.tsx`: render ad group blocks (one after another); "Add ad group" button; per-block delete; inline targeting fields (country, platform, browser, timezone, whitelist/blacklist); save sends ad groups with campaign (version still required)

**Checkpoint**: Ad groups visible and editable on campaign edit; save persists.

---

## Phase 6: User Story 4 — Creatives Within an Ad Group (Priority: P2)

**Goal**: Creatives inline in each ad group block; name, ad type, click URL, icon, image; add/delete/edit; reuse existing media (MinIO) for icon/image.

**Independent Test**: Add two creatives to an ad group, set name/adtype/clickurl, upload icon/image, save; delete one; reload and verify.

### Tests for User Story 4

- [x] T038 [P] [US4] Write unit tests in `backend/tests/unit/test_creative_service.py`: create creative under ad_group, list by ad_group, update, delete; validate ad_type against allowed set
- [x] T039 [P] [US4] Write contract tests: GET campaign includes ad_groups with creatives; POST creative (icon/image upload); PATCH/DELETE creative
- [x] T040 [P] [US4] Write Vitest test: within ad group block, "Add creative" adds row; name, ad type, click URL, icon/image fields; delete creative removes row

### Implementation for User Story 4

- [x] T041 [US4] Create Alembic migration `backend/migrations/versions/YYYYMMDD_006_create_creatives_table.py`: table creatives (id, ad_group_id FK CASCADE, name, ad_type, click_url, icon_media_id, image_media_id, sort_order, created_at, updated_at); icon_media_id/image_media_id reference media storage (e.g. reuse existing pattern or media_assets table)
- [x] T042 [US4] Create `backend/src/models/creative.py`: Creative model; relationship to AdGroup; ad_type constrained (e.g. banner, native, video)
- [x] T043 [US4] Create `backend/src/services/creative_service.py`: create (with icon/image upload via existing storage), list by ad_group_id, update, delete; validate ad_type
- [x] T044 [US4] Extend campaign GET/PATCH (or dedicated creatives API): campaign detail includes ad_groups with creatives; create/update creative (upload icon/image to MinIO, store key); Creative schema with icon_url, image_url (presigned or path)
- [x] T045 [US4] Update `frontend/src/pages/CampaignEditPage.tsx`: within each ad group block, list creatives with inline fields (name, ad type dropdown, click URL, icon upload, image upload); add creative / delete creative buttons; save persists creatives

**Checkpoint**: Creatives with icon/image in ad groups; save and reload work.

---

## Phase 7: User Story 5 — Campaign Listing with Search, Sort, Column Setup (Priority: P3)

**Goal**: List supports search (all campaign fields), sort by up to two fields, admin filter by owner; column-setup popup with at least one column enforced; column config saved per user.

**Independent Test**: Search by name; sort by budget desc; open column-setup, reorder columns, save; reload and column order restored.

### Tests for User Story 5

- [x] T046 [P] [US5] Write contract tests in `backend/tests/contract/test_column_config_api.py`: GET /me/column-config?context=campaigns returns column_ids (default or saved); PUT with at least one column saves; PUT with empty column_ids returns 400
- [x] T047 [P] [US5] Write contract tests: GET /campaigns?search=... filters results; GET /campaigns?sort=budget&sort2=name applies order; admin GET /campaigns?owner_id=... filters by owner
- [x] T048 [P] [US5] Write Vitest test: Campaign list column-setup popup reorders columns; at least one column cannot be removed; save and reload restores order

### Implementation for User Story 5

- [x] T049 [US5] Create Alembic migration `backend/migrations/versions/YYYYMMDD_007_create_column_configurations_table.py`: table column_configurations (id, user_id FK, context, column_ids JSONB, updated_at); unique (user_id, context)
- [x] T050 [US5] Create `backend/src/models/column_config.py`: ColumnConfiguration model
- [x] T051 [US5] Create `backend/src/services/column_config_service.py`: get_or_default(user_id, context), save(user_id, context, column_ids); validate at least one column
- [x] T052 [US5] Add `backend/src/api/column_config.py`: GET /me/column-config?context=campaigns, PUT /me/column-config; register in app
- [x] T053 [US5] Update list in `backend/src/services/campaign_service.py`: ensure search (ILIKE or similar on name, status, budget, owner); sort (order by up to two columns); admin owner_id filter
- [x] T054 [US5] Create `frontend/src/components/CampaignList.tsx`: table with configurable columns (from column config API); search input; sortable headers (up to two); column-setup popup (reorder, at least one column); save column config on confirm
- [x] T055 [US5] Load column config on Campaigns page; pass to CampaignList; persist on popup save

**Checkpoint**: Search, sort, column-setup; config persists across sessions.

---

## Phase 8: Polish & Cross-Cutting

**Goal**: Archive action with confirmation; archived campaigns view-only; designated system owner on user delete.

- [x] T056 [P] Add archive action: PATCH /campaigns/{id} with status=archive (or POST /campaigns/{id}/archive); optimistic lock applies (version required); 409 if stale
- [x] T057 [P] Enforce view-only for archived campaigns in `backend/src/api/campaign.py` and `backend/src/services/campaign_service.py`: PATCH/DELETE for campaign with status=archive returns 403 or 400 with message
- [x] T058 [P] In `frontend/src/pages/Campaigns.tsx` or CampaignList: "Archive" button with confirmation popup; on confirm call archive API; list shows status
- [x] T059 [P] In `frontend/src/pages/CampaignEditPage.tsx`: when campaign status is archive, render read-only (no save, no add/delete ad group/creative); show message "Archive campaigns are view-only"
- [x] T060 Implement user delete reassignment: in user delete flow (admin or cascade), update all campaigns with owner_id = deleted user to owner_id = settings.designated_system_owner_id; if not set, refuse delete when user owns campaigns or use migration-created system user
- [x] T061 Run full backend test suite: `pytest backend/tests/ -v`; fix regressions
- [x] T062 Run full frontend test suite: `npx vitest run`; fix regressions
- [x] T063 Run quickstart.md verification checklist

---

## Dependencies & Execution Order

- **Phase 1–2**: Must complete before any user story.
- **Phase 3 (US1)**: Depends on Phase 2 (buyer in DB and Campaign model exist for later list filter).
- **Phase 4 (US2)**: Depends on Phase 2 (Campaign model, schemas); implements list and enforces buyer filter.
- **Phase 5 (US3)**: Depends on Phase 4 (campaign API and edit page exist); adds ad groups.
- **Phase 6 (US4)**: Depends on Phase 5 (ad groups exist); adds creatives.
- **Phase 7 (US5)**: Depends on Phase 4 (list endpoint); adds search, sort, column config.
- **Phase 8**: After US1–US5.

### Optimistic Locking (US2)

- T016–T019, T022 = tests that MUST exist and pass; T023–T024 implement version check and 409; T027–T028 frontend version and 409 handling.

---

## Parallel Opportunities

- T008–T010 (US1 tests) parallel.
- T016–T022 (US2 tests) parallel.
- T030–T032 (US3 tests) parallel.
- T038–T040 (US4 tests) parallel.
- T046–T048 (US5 tests) parallel.
- T056–T060 (Polish) parallel where different files.

---

## Implementation Strategy

### MVP First (US1 + US2)

1. Phase 1 + 2 → buyer role and Campaign entity.
2. Phase 3 (US1) → buyer access and routing.
3. Phase 4 (US2) → Campaign CRUD + list + **optimistic locking** (tests first, then implementation).
4. Validate: create campaign, list, edit with version; 409 on stale version.

### Incremental Delivery

- After Phase 4: MVP (buyer + campaign CRUD + list + optimistic lock).
- Phase 5–6: Ad groups and creatives.
- Phase 7: Listing search/sort/column-setup.
- Phase 8: Archive, view-only, designated owner.

---

## Notes

- All tasks use format `- [ ] Tnnn [P?] [USn?] Description with file path`.
- Optimistic locking: unit test (T016), contract tests (T018, T019), frontend test (T022); implementation T023–T024, T027–T028.
- Migrations: run `alembic heads` before adding new migration; set down_revision to current head (see .cursor/rules/alembic-migrations.mdc).
