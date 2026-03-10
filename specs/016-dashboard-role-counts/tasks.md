# Tasks: Dashboard Role-Based Counts

**Input**: Design documents from `specs/016-dashboard-role-counts/`  
**Prerequisites**: plan.md, spec.md, research.md, data-model.md, contracts/

**Tests**: Per Qualityboard constitution, automated tests are MANDATORY and MUST be written before implementation (TDD + Red-Green-Refactor).

**Organization**: Tasks are grouped by user story; backend foundation (Phase 2) serves all stories; frontend (Phase 3–5) implements one display layer and adds per-role verification tests.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no dependencies)
- **[Story]**: Which user story this task belongs to (US1, US2, US3)
- Include exact file paths in descriptions

## Path Conventions

- **Backend**: `backend/src/` (api, schemas, services), `backend/tests/`
- **Frontend**: `frontend/src/` (pages, services), `frontend/src/pages/Dashboard.test.tsx`, `frontend/e2e/`

---

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: Confirm feature context and existing structure.

- [x] T001 Confirm design docs and plan: backend/src/api, backend/src/schemas, backend/src/services, frontend/src/pages/Dashboard.tsx and frontend/src/services/api.ts exist; feature adds dashboard counts API and Dashboard count widgets per specs/016-dashboard-role-counts/plan.md

**Checkpoint**: Ready to implement backend and frontend dashboard counts

---

## Phase 2: Foundational (Backend Dashboard Counts API)

**Purpose**: Backend endpoint GET /api/dashboard/counts returning role-based counts. MUST be complete before frontend dashboard work. Tests first (TDD).

### Tests for Foundation (contract and role shape)

- [x] T002 [P] Add contract test: GET /api/dashboard/counts returns 200 and only key "campaigns" for buyer role in backend/tests/ (e.g. contract or api test module)
- [x] T003 [P] Add contract test: GET /api/dashboard/counts returns 200 and only keys "drafts", "published" for content_manager role in backend/tests/
- [x] T004 [P] Add contract test: GET /api/dashboard/counts returns 200 and keys "campaigns", "drafts", "published", "users" for admin role; assert non-negative integers in backend/tests/
- [x] T005 Add test: dashboard counts accuracy — e.g. buyer with N campaigns receives campaigns === N in backend/tests/

### Implementation for Foundation

- [x] T006 Create DashboardCountsResponse schema (optional fields: campaigns, drafts, published, users) in backend/src/schemas/dashboard.py
- [x] T007 Implement get_dashboard_counts(db, user) using campaign_service, blog_service, and User count per research.md in backend/src/services/dashboard_service.py
- [x] T008 Add GET /api/dashboard/counts endpoint and register dashboard router in backend/src/api/dashboard.py and backend/src/app/main.py

**Checkpoint**: Backend GET /api/dashboard/counts returns role-based counts; contract tests pass

---

## Phase 3: User Story 1 – Buyer Sees Campaigns Count (Priority: P1) MVP

**Goal**: Buyer sees campaigns count on the dashboard; value matches campaigns they can access.

**Independent Test**: Log in as buyer; open /dashboard; verify campaigns count is visible and correct.

### Tests for User Story 1

- [x] T009 [P] [US1] Add test: Dashboard shows campaigns count when user is buyer (mock getDashboardCounts returning { campaigns: N }; assert label and value) in frontend/src/pages/Dashboard.test.tsx
- [x] T010 [P] [US1] Add test: Dashboard shows loading state while counts are loading and error state when fetch fails in frontend/src/pages/Dashboard.test.tsx

### Implementation for User Story 1

- [x] T011 [US1] Add getDashboardCounts() to API client in frontend/src/services/api.ts
- [x] T012 [US1] Update Dashboard: fetch counts on mount, display widgets for campaigns, drafts, published, users (by key), loading and error states in frontend/src/pages/Dashboard.tsx and frontend/src/pages/Dashboard.css

**Checkpoint**: Buyer sees campaigns count on dashboard; one implementation displays all role-relevant keys so content_manager and admin will see their counts when backend returns them

---

## Phase 4: User Story 2 – Content Manager Sees Draft and Published Counts (Priority: P1)

**Goal**: Content manager sees draft posts count and published posts count on the dashboard.

**Independent Test**: Log in as content_manager; open /dashboard; verify drafts and published counts are visible and correct.

### Tests for User Story 2

- [x] T013 [P] [US2] Add test: Dashboard shows drafts and published counts when user is content_manager (mock getDashboardCounts returning { drafts, published }; assert both labels and values) in frontend/src/pages/Dashboard.test.tsx

### Implementation for User Story 2

- [x] T014 [US2] Verify content_manager flow: ensure GET /api/dashboard/counts returns drafts and published for content_manager (T003) and Dashboard renders them when present; add or run integration check if needed in backend/tests/ or frontend

**Checkpoint**: Content manager sees draft and published counts on dashboard

---

## Phase 5: User Story 3 – Admin Sees All Four Counts (Priority: P1)

**Goal**: Admin sees campaigns, draft posts, published posts, and user count on the dashboard.

**Independent Test**: Log in as admin; open /dashboard; verify all four counts are visible and correct.

### Tests for User Story 3

- [x] T015 [P] [US3] Add test: Dashboard shows campaigns, drafts, published, and users counts when user is admin (mock getDashboardCounts with all four keys; assert all labels and values) in frontend/src/pages/Dashboard.test.tsx

### Implementation for User Story 3

- [x] T016 [US3] Verify admin flow: ensure GET /api/dashboard/counts returns campaigns, drafts, published, users for admin (T004) and Dashboard renders all four; add or run integration check if needed in backend/tests/ or frontend

**Checkpoint**: Admin sees all four counts on dashboard

---

## Phase 6: Polish & Cross-Cutting Concerns

**Purpose**: Validation and optional E2E.

- [x] T017 [P] Run quickstart validation from specs/016-dashboard-role-counts/quickstart.md: log in as buyer, content_manager, admin; verify dashboard counts; check loading/error
- [x] T018 [P] Optional: Add or extend E2E in frontend/e2e/: open dashboard as buyer/content_manager/admin and assert expected count widgets and values in frontend/e2e/

---

## Dependencies & Execution Order

### Phase Dependencies

- **Phase 1 (Setup)**: No dependencies — start immediately
- **Phase 2 (Foundational)**: Depends on Phase 1 — backend endpoint and contract tests
- **Phase 3 (US1)**: Depends on Phase 2 — frontend needs API; tests first then API client and Dashboard UI
- **Phase 4 (US2)**: Depends on Phase 3 — verification test only; backend already returns drafts/published for content_manager
- **Phase 5 (US3)**: Depends on Phase 3 — verification test only; backend already returns all four for admin
- **Phase 6 (Polish)**: Depends on Phases 2–5 complete

### Within Phase 2

- T002–T005 (tests) must be written first and fail; T006–T008 (schema, service, endpoint) make them pass.

### Within Phase 3

- T009–T010 (tests) must be written first and fail; T011–T012 (API client, Dashboard) make them pass.

### Parallel Opportunities

- T002, T003, T004 [P] — contract tests per role (same test file, different cases)
- T009, T010 [P] — buyer test and loading/error test
- T013, T015 [P] — content_manager and admin frontend tests
- T017, T018 [P] — quickstart and E2E after implementation complete

---

## Implementation Strategy

### MVP First (Phase 1 + Phase 2 + Phase 3)

1. Phase 1: T001
2. Phase 2: T002–T005 (tests fail) → T006–T008 (implement) → tests pass
3. Phase 3: T009–T010 (tests fail) → T011–T012 (implement) → tests pass
4. **Validate**: Log in as buyer; dashboard shows campaigns count

### Incremental Delivery

1. Setup → Foundation (backend API) → US1 (buyer campaigns + full display layer) → US2 verification → US3 verification → Polish

---

## Summary

| Metric | Value |
|--------|--------|
| **Total tasks** | 18 |
| **Phase 1 (Setup)** | 1 |
| **Phase 2 (Foundational)** | 7 |
| **Phase 3 (US1)** | 4 |
| **Phase 4 (US2)** | 2 |
| **Phase 5 (US3)** | 2 |
| **Phase 6 (Polish)** | 2 |
| **Parallel [P] tasks** | 10 |

**Independent test criteria**

- **US1**: Buyer sees campaigns count on dashboard; loading and error states
- **US2**: Content manager sees drafts and published counts on dashboard
- **US3**: Admin sees campaigns, drafts, published, and users counts on dashboard

**Suggested MVP scope**: Phase 1 + Phase 2 + Phase 3 (T001–T012) — backend dashboard counts API and frontend dashboard with count widgets for all roles.

**Format validation**: All tasks use `- [ ] [TaskID] [P?] [Story?] Description` with file paths where applicable.
