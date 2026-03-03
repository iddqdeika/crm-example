# Tasks: Ad Groups and Creatives on Campaign Creation

**Input**: Design documents from `specs/010-creation-ad-groups/`  
**Prerequisites**: plan.md ✅, spec.md ✅, research.md ✅, data-model.md ✅, contracts/ ✅

**Tests**: Per constitution and user request — tests MUST be written FIRST (failing) before implementation for each story. Red-Green-Refactor applies to all changes.

**Organization**: Tasks grouped by user story. US1 (backend + new creation page + E2E) is independent of US2 (edit page refactor to use shared component). US2 depends on the `AdGroupsSection` component created in the Foundational phase.

---

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no dependencies)
- **[Story]**: Which user story this task belongs to (US1 or US2)

---

## Phase 1: Setup

**Purpose**: No new project structure is introduced by this feature. The existing backend service functions (`create_ad_group`, `create_creative`, `AdGroupUpsert` schema) and frontend types (`AdGroupUpsert`, `CreativeUpsert` in `api.ts`) are already in place. This phase confirms nothing needs scaffolding.

- [X] T001 Verify `backend/src/services/ad_group_service.py` exports `create_ad_group` and `backend/src/services/creative_service.py` exports `create_creative` — confirm function signatures match expected call in plan.md before writing tests

**Checkpoint**: Existing services confirmed available. Proceed to Foundational phase.

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Extract the ad-group accordion section from `CampaignEditPage.tsx` into a reusable `AdGroupsSection` component. This component blocks both US1 (new page) and US2 (edit page refactor). Must be complete before either story's frontend tasks begin.

**⚠️ CRITICAL**: US1 and US2 frontend tasks cannot begin until T002–T005 are complete.

- [X] T002 Define `AdGroupEdit` and `CreativeEdit` types and `emptyAdGroup` / `emptyCreative` factory functions in `frontend/src/components/AdGroupsSection.tsx` — copy types verbatim from `CampaignEditPage.tsx`
- [X] T003 Implement the `AdGroupsSection` React component in `frontend/src/components/AdGroupsSection.tsx` — accept props: `adGroups`, `expanded`, `readOnly`, `onToggle`, `onAddAdGroup`, `onRemoveAdGroup`, `onUpdateAdGroup`, `onAddCreative`, `onRemoveCreative`, `onUpdateCreative`; render the full `campaign-edit__ad-groups` section JSX extracted from `CampaignEditPage.tsx` (do NOT remove from CampaignEditPage yet — that is US2)
- [X] T004 Add `import "./CampaignEditPage.css"` at the top of `frontend/src/components/AdGroupsSection.tsx` so the component's `campaign-edit__ad-group-*` BEM classes resolve correctly without duplicating CSS
- [X] T005 Verify `AdGroupsSection` renders in isolation — add a minimal render test in `frontend/src/components/AdGroupsSection.test.tsx` that mounts the component with empty `adGroups` and asserts the "Add ad group" button is present

**Checkpoint**: `AdGroupsSection` component renders correctly with zero ad groups and an "Add ad group" button. Both US1 and US2 frontend work can now begin independently.

---

## Phase 3: User Story 1 — Backend: POST Endpoint Accepts Ad Groups (Priority: P1) 🎯

**Goal**: `POST /api/campaigns` accepts an optional `ad_groups` payload and persists ad groups and creatives in a single request.

**Independent Test**: Run `pytest backend/tests/test_campaign_create_with_ad_groups.py -v` — all 6 tests must pass without any UI running.

### Tests for US1 — Backend (Write FIRST — must FAIL before T012–T013)

- [X] T006 [US1] Create `backend/tests/test_campaign_create_with_ad_groups.py` and write test `test_create_campaign_without_ad_groups_unchanged` — POST without `ad_groups` field → assert 201 and `"ad_groups": []` in response (uses existing `admin_client` fixture)
- [X] T007 [P] [US1] Add test `test_create_campaign_with_empty_ad_groups` to `backend/tests/test_campaign_create_with_ad_groups.py` — POST with `ad_groups: []` → assert 201 and `"ad_groups": []`
- [X] T008 [P] [US1] Add test `test_create_campaign_with_ad_groups_and_creatives` to `backend/tests/test_campaign_create_with_ad_groups.py` — POST with one ad group (`country_targets: "US"`) containing one creative (`name: "Banner"`, `ad_type: "banner"`) → assert 201, response `ad_groups` has length 1, `ad_groups[0].country_targets == "US"`, `ad_groups[0].creatives[0].name == "Banner"`
- [X] T009 [P] [US1] Add test `test_create_campaign_with_multiple_ad_groups` to `backend/tests/test_campaign_create_with_ad_groups.py` — POST with two ad groups, each with one creative → assert 201, response `ad_groups` has length 2
- [X] T010 [P] [US1] Add test `test_create_campaign_with_invalid_creative_name` to `backend/tests/test_campaign_create_with_ad_groups.py` — POST with creative `name: ""` → assert 422
- [X] T011 [P] [US1] Add test `test_create_campaign_with_ad_group_id_rejected` to `backend/tests/test_campaign_create_with_ad_groups.py` — POST with ad group `"id": "00000000-0000-0000-0000-000000000001"` → assert 422

> **Confirmed**: 4 tests failed (RED). T006/T007 already passed before implementation.

### Implementation for US1 — Backend

- [X] T012 [US1] Extend `CampaignCreate` schema in `backend/src/schemas/campaign.py` — added `CreativeCreateNested` and `AdGroupCreateNested` schemas (with `extra="forbid"` to reject `id`), then added `ad_groups: list[AdGroupCreateNested] | None = None` to `CampaignCreate`
- [X] T013 [US1] Update `post_campaign` handler in `backend/src/api/campaign.py` — iterate `body.ad_groups` calling `create_ad_group` then `create_creative` per nested creative; build `ag_with_cr` list for response

> **Confirmed**: All 6 tests pass (GREEN). Full `pytest backend/tests/ -v` → 90/90 passed.

**Checkpoint**: Backend contract from `contracts/post-campaigns.md` is fully implemented and tested. US1 backend is complete.

---

## Phase 4: User Story 1 — Frontend: Creation Page with Ad Groups (Priority: P1) 🎯

**Goal**: The campaign creation page renders an "Ad groups" section, allows adding/removing ad groups and creatives, and submits them in one request.

### Tests for US1 — Frontend (Write FIRST — must FAIL before T016–T018)

- [X] T014 [US1] Extend `frontend/src/pages/CampaignNewPage.test.tsx` — added assertion: rendered page contains `add-ad-group` testid button
- [X] T015 [P] [US1] Extend `frontend/src/pages/CampaignNewPage.test.tsx` — added assertions: after click on "Add ad group", a `ad-group-block` element appears; after click on delete, it disappears

> **Confirmed**: 3 tests failed (RED). Proceeded to T016.

### Implementation for US1 — Frontend

- [X] T016 [US1] Extend `campaignApi.create()` type signature in `frontend/src/services/api.ts` — added `ad_groups?: AdGroupUpsert[]` to the `data` parameter type
- [X] T017 [US1] Update `frontend/src/pages/CampaignNewPage.tsx` — added state and handlers (`addAdGroup`, `removeAdGroup`, `updateAdGroup`, `addCreative`, `removeCreative`, `updateCreative`, `toggleExpanded`)
- [X] T018 [US1] Render `<AdGroupsSection />` in `frontend/src/pages/CampaignNewPage.tsx` — placed below status field, before submit button
- [X] T019 [US1] Wire ad groups into `campaignApi.create()` call — pass `ad_groups` mapping `AdGroupEdit[]` to `AdGroupUpsert[]`

> **Confirmed**: All 8 tests pass (GREEN). Full Vitest suite 64/64 passed.

**Checkpoint**: Campaign creation page renders the ad-group section and submits ad groups. US1 frontend is complete.

---

## Phase 5: User Story 1 — E2E Test + Documentation (Priority: P1)

**Goal**: End-to-end verification that creating a campaign with an ad group and creative persists correctly and the full E2E suite remains green.

- [X] T020 [US1] Added scenario E34 to `frontend/e2e/02-campaign-create-list.spec.ts` — steps: login as buyer → fill campaign form → click "Add ad group" → expand → fill country_targets "US" → add creative "Banner Ad" → submit → verify on edit page
- [X] T021 [P] [US1] Updated `docs/e2e-scenarios.md` — incremented total to 34, added E34 to Scenario Index table and US2 section table

> **Confirm**: Run `npm run e2e:up && npm run e2e:test && npm run e2e:down` to verify E34 passes.

**Checkpoint**: US1 fully verified end-to-end. 34 E2E scenarios. Docs updated.

---

## Phase 6: User Story 2 — Edit Page Refactored to Use Shared Component (Priority: P2)

**Goal**: `CampaignEditPage.tsx` delegates its ad-group section to `AdGroupsSection`, eliminating duplicate JSX between creation and edit pages and proving UI parity.

### Tests for US2

- [X] T022 [US2] Existing `CampaignEditPage.test.tsx` already asserts `campaign-edit__ad-group-block` — confirmed passes after refactor

### Implementation for US2

- [X] T023 [US2] Refactored `frontend/src/pages/CampaignEditPage.tsx` — replaced inline ad-group accordion JSX with `<AdGroupsSection ... />`
- [X] T024 [US2] Removed duplicated types `AdGroupEdit`, `CreativeEdit`, `emptyAdGroup`, `emptyCreative` from `CampaignEditPage.tsx`; now imported from `../components/AdGroupsSection`
- [X] T025 [P] [US2] Verified `frontend/src/pages/CampaignEditPage.css` import chain intact: `CampaignEditPage.tsx → CampaignEditPage.css` and `AdGroupsSection.tsx → CampaignEditPage.css`

> **Confirmed**: All CampaignEditPage.test.tsx tests pass. Full Vitest suite 64/64 passed.

**Checkpoint**: Both creation and edit pages share `AdGroupsSection`. Edit page behavior unchanged. Zero duplicate ad-group JSX.

---

## Phase 7: Polish & Cross-Cutting Concerns

- [X] T026 [P] Full backend test suite: `pytest backend/tests/ -v` — 90/90 passed
- [X] T027 [P] Full frontend Vitest suite: `npm test -- --run` — 64/64 passed across 20 test files
- [ ] T028 Run full E2E suite: `npm run e2e:up && npm run e2e:test && npm run e2e:down` — all 34 scenarios should pass (requires Docker)
- [X] T029 [P] `AdGroupsSection.tsx` inherits `prefers-reduced-motion` and `focus-visible` styles from `CampaignEditPage.css` — confirmed via import
- [X] T030 [P] "Add ad group" button uses `campaign-edit__btn campaign-edit__btn--secondary` matching edit page — confirmed in `AdGroupsSection.tsx`

---

## Dependencies & Execution Order

### Phase Dependencies

- **Phase 1 (Setup)**: No dependencies — start immediately
- **Phase 2 (Foundational)**: Depends on Phase 1 — BLOCKS all frontend work in Phases 4, 5, 6
- **Phase 3 (US1 Backend)**: Independent of Phase 2 — can run in parallel with Phase 2
- **Phase 4 (US1 Frontend)**: Depends on Phase 2 (AdGroupsSection) + Phase 3 (api.ts type for `ad_groups`)
- **Phase 5 (US1 E2E)**: Depends on Phases 3 and 4 being fully green
- **Phase 6 (US2 Refactor)**: Depends on Phase 2 (AdGroupsSection) — can start in parallel with Phases 3–5
- **Phase 7 (Polish)**: Depends on all phases complete

### User Story Dependencies

- **US1 (P1)**: Phases 3, 4, 5 — backend + new page + E2E. Backend (Phase 3) has no frontend dependency.
- **US2 (P2)**: Phase 6 — edit page refactor. Depends only on the `AdGroupsSection` component (Phase 2).

### Within Each Phase

- **Tests FIRST**: T006–T011 before T012–T013. T014–T015 before T016–T019. T020 written before E2E stack is run. T022 before T023–T025.
- **All [P] tasks** within a phase operate on different files and can run concurrently.

### Parallel Opportunities

```text
Phase 2 can run in parallel with Phase 3 (backend vs. frontend component):
  Thread A: T002 → T003 → T004 → T005  (AdGroupsSection component)
  Thread B: T006 → T007/T008/T009/T010/T011 → T012 → T013  (backend tests + implementation)

Once Phase 2 + 3 complete:
Phase 4 can run in parallel with Phase 6:
  Thread A: T014 → T015 → T016 → T017 → T018 → T019  (new creation page)
  Thread B: T022 → T023 → T024 → T025  (edit page refactor)
```

---

## Implementation Strategy

### MVP First (US1 Only — Phases 1–5)

1. Complete Phase 1: Confirm existing services ✅
2. Complete Phases 2 + 3 in parallel: AdGroupsSection + backend tests and implementation ✅
3. Complete Phase 4: Wire AdGroupsSection into CampaignNewPage ✅
4. Complete Phase 5: E2E test + docs ✅
5. **VALIDATE**: `POST /api/campaigns` with ad groups works end-to-end in 34 E2E scenarios
6. Ship MVP — users can now create campaigns with ad groups in one step

### Incremental Delivery

1. Phases 1–3 → Backend accepts ad groups on creation ✓
2. Phases 1–5 → Full creation page + E2E verified ✓ (MVP)
3. Phase 6 → Edit page refactored to shared component (zero user-visible change, reduces maintenance debt) ✓
4. Phase 7 → Final polish + audit ✓

---

## Notes

- [P] tasks operate on different files — no merge conflicts
- The backend change is 2 files and ~15 lines of code; the largest work is the `AdGroupsSection` extraction
- `CampaignEditPage.css` is intentionally imported from `AdGroupsSection.tsx` — no CSS duplication, no renaming
- The E2E test E34 reuses the existing `buyerEmail` `beforeAll` setup in `02-campaign-create-list.spec.ts`
- If the E2E stack cannot run locally, validate T020 manually against the dev stack and defer E2E to CI
- Commit after each phase checkpoint to keep history clean and bisectable
