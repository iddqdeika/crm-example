# Tasks: Playwright UI Scenario Tests

**Input**: Design documents from `/specs/008-playwright-ui-tests/`
**Branch**: `008-playwright-ui-tests`
**Prerequisites**: plan.md ✅ spec.md ✅ research.md ✅ data-model.md ✅ contracts/ ✅ quickstart.md ✅

**Tests**: This feature's deliverable IS the test suite itself. The "production code" is Playwright test files. Constitution TDD compliance is met by building infrastructure first (docker-compose, seed, helpers), then writing each scenario test as an independently verifiable unit. No application source code changes are needed except the backend seed script.

**Organization**: Tasks are grouped by user story. Each story maps to one Playwright spec file. Shared infrastructure (Phase 1–2) must complete before any story phase.

---

## Phase 1: Setup — Docker E2E Stack & Admin Seed

**Purpose**: Create the docker-compose E2E environment and admin user seeding mechanism so tests have a running app to target.

- [x] T001 Create `docker/docker-compose.e2e.yml` that extends the dev stack with E2E-specific overrides: `SEED_ADMIN=true`, `SEED_ADMIN_EMAIL=admin@e2e.test`, `SEED_ADMIN_PASSWORD=AdminPass1!`, unique database `qualityboard_e2e`, shorter session timeouts; reuse existing Dockerfiles for backend and frontend services
- [x] T002 Create admin seed script in `backend/src/scripts/seed_admin.py` that reads `SEED_ADMIN_EMAIL` / `SEED_ADMIN_PASSWORD` environment variables and creates an admin user (idempotent — skip if exists); uses existing `User` model and `auth_service.hash_password()`
- [x] T003 Modify `backend/scripts/start.sh` to call the seed script after Alembic migrations when `SEED_ADMIN=true` is set; no-op when the variable is absent
- [x] T004 [P] Update `frontend/playwright.config.ts` to skip `webServer` when `E2E=true` environment variable is set (in addition to existing `CI` check); keep `baseURL` from `PLAYWRIGHT_BASE_URL` env (already supported)
- [x] T005 [P] Add npm scripts to `frontend/package.json`: `e2e:up` (docker compose up), `e2e:down` (docker compose down -v), `e2e:test` (E2E=true playwright test), `e2e` (orchestrates up → test → down)

**Checkpoint**: `npm run e2e:up` starts all services, backend seeds admin user, `npm run e2e:down` tears down cleanly.

---

## Phase 2: Foundational — Shared Helpers

**Purpose**: Create reusable helper modules that all scenario tests depend on. Must complete before any story phase.

- [x] T006 [P] Create `frontend/e2e/helpers/auth.ts` with `signup(page, email, password, displayName)`, `login(page, email, password)`, and `logout(page)` helper functions; each operates on the existing test-id selectors (`login-email`, `login-password`, `login-submit`, etc.)
- [x] T007 [P] Create `frontend/e2e/helpers/admin.ts` with `assignBuyerRole(page, adminEmail, adminPassword, targetEmail)` that logs in as admin, navigates to `/admin`, finds the target user row, changes role to "buyer", verifies the update, and logs out
- [x] T008 [P] Create `frontend/e2e/helpers/design.ts` with `DESIGN_TOKENS` constant (bg-primary, bg-secondary, text-primary, text-secondary, font-display, font-body from `frontend/src/index.css`), and assertion functions `expectBgColor(page, selector, expectedRgb)`, `expectFontFamily(page, selector, expectedFamily)`, `expectTextColor(page, selector, expectedRgb)` using `page.evaluate()` + `getComputedStyle()`; normalize hex to `rgb()` format

**Checkpoint**: All three helper modules importable; no standalone tests needed (they are exercised by every scenario).

---

## Phase 3: User Story 1 — Registration and Profile (Priority: P1)

**Goal**: Verify a visitor can register, reach the dashboard, and view their profile with correct design tokens.

**Independent Test**: Run `npx playwright test e2e/01-registration-profile.spec.ts` in isolation — creates its own user, no dependencies on other scenarios.

- [x] T009 [US1] Create `frontend/e2e/01-registration-profile.spec.ts` with tests: (1) sign up with unique email → redirect to `/dashboard`, header shows display name; (2) click Profile link → `/profile` loads, display name and email visible; (3) design checkpoint — assert body bg-color = `rgb(8, 8, 15)` and body font-family includes `Outfit` on `/profile`
- [x] T010 [US1] Add edge case test in `frontend/e2e/01-registration-profile.spec.ts`: attempt registration with an already-used email → error message visible, user stays on `/signup`
- [x] T011 [US1] Run scenario 01 in isolation via `npx playwright test e2e/01-registration-profile.spec.ts` against E2E stack; confirm all tests pass

**Checkpoint**: US1 fully passing — registration → dashboard → profile → design check → duplicate email edge case.

---

## Phase 4: User Story 2 — Campaign Creation and Listing (Priority: P1)

**Goal**: Verify a buyer can list campaigns, create one, and see it in the listing. Exercises admin role assignment as setup.

**Independent Test**: Run `npx playwright test e2e/02-campaign-create-list.spec.ts` in isolation — registers a user, uses admin to assign buyer role, creates a campaign.

- [x] T012 [US2] Create `frontend/e2e/02-campaign-create-list.spec.ts` with setup: register new user via `signup()`, assign buyer role via `assignBuyerRole()`, log in as buyer; tests: (1) navigate to `/campaigns` → table visible; (2) click "New Campaign", fill name/budget/status, submit → redirect to `/campaigns/:id`, heading shows name; (3) navigate back to `/campaigns` → new campaign in table with correct name and budget; (4) design checkpoint — assert heading font-family includes `Syne` on `/campaigns`
- [x] T013 [US2] Add edge case test in `frontend/e2e/02-campaign-create-list.spec.ts`: attempt to create campaign with empty name → form prevents submission or shows validation error
- [x] T014 [US2] Run scenario 02 in isolation; confirm all tests pass

**Checkpoint**: US2 fully passing — buyer setup → list → create → verify in listing → design check → empty fields edge case.

---

## Phase 5: User Story 3 — Login, Logout, and Session Expiry (Priority: P2)

**Goal**: Verify login/logout cycle and session-expired message display.

**Independent Test**: Run `npx playwright test e2e/03-login-logout-session.spec.ts` in isolation — creates its own user via signup.

- [x] T015 [US3] Create `frontend/e2e/03-login-logout-session.spec.ts` with tests: (1) register via signup → redirect to `/dashboard`; (2) logout → redirect to `/login`; (3) login with same credentials → redirect to `/dashboard`, header shows display name; (4) logout again → redirect to `/login`, no display name in header; (5) navigate to `/login?reason=expired` → session-expired message visible; (6) design checkpoint — assert body bg-color = `rgb(8, 8, 15)` on `/login`
- [x] T016 [US3] Add edge case tests in `frontend/e2e/03-login-logout-session.spec.ts`: (a) login with wrong password → error message, stays on `/login`; (b) navigate to `/campaigns` while logged out → redirect to `/login`
- [x] T017 [US3] Run scenario 03 in isolation; confirm all tests pass

**Checkpoint**: US3 fully passing — signup → logout → login → logout → expired message → design check → edge cases.

---

## Phase 6: User Story 4 — Admin User Management (Priority: P2)

**Goal**: Verify admin can view user list and change a user's role.

**Independent Test**: Run `npx playwright test e2e/04-admin-user-management.spec.ts` in isolation — uses pre-seeded admin, creates a target user via signup.

- [x] T018 [US4] Create `frontend/e2e/04-admin-user-management.spec.ts` with setup: register a new user via signup, logout; tests: (1) login as admin → "Admin" link visible in header; (2) click Admin → `/admin` loads, user list with email/name/role/active columns; (3) find the new user, change role to "buyer" → updated role reflected; (4) design checkpoint — assert body bg-color = `rgb(8, 8, 15)` and heading font-family includes `Syne` on `/admin`
- [x] T019 [US4] Add edge case test in `frontend/e2e/04-admin-user-management.spec.ts`: log in as the (non-admin) user created in setup, navigate to `/admin` → redirect to `/dashboard`
- [x] T020 [US4] Run scenario 04 in isolation; confirm all tests pass

**Checkpoint**: US4 fully passing — admin login → user list → role change → design check → non-admin redirect edge case.

---

## Phase 7: User Story 5 — Campaign Edit and Archive (Priority: P3)

**Goal**: Verify campaign editing, archiving, and view-only mode for archived campaigns.

**Independent Test**: Run `npx playwright test e2e/05-campaign-edit-archive.spec.ts` in isolation — registers user, assigns buyer, creates campaign, then edits and archives.

- [x] T021 [US5] Create `frontend/e2e/05-campaign-edit-archive.spec.ts` with setup: register user, assign buyer role, login as buyer, create a campaign; tests: (1) navigate to `/campaigns/:id`, change name, click "Save" → updated name visible; (2) navigate to `/campaigns` → updated name in listing; (3) click "Archive" on the campaign, confirm dialog → status changes to "archive"; (4) open the archived campaign → all fields disabled, no "Save" button, archived notice visible; (5) design checkpoint — assert body bg-color = `rgb(8, 8, 15)` on edit page
- [x] T022 [US5] Run scenario 05 in isolation; confirm all tests pass

**Checkpoint**: US5 fully passing — edit → save → archive → view-only → design check.

---

## Phase 8: User Story 6 — Design Compliance (Priority: P3)

**Goal**: Verify every page conforms to design tokens across all routes.

**Independent Test**: Run `npx playwright test e2e/06-design-compliance.spec.ts` in isolation — creates users and data needed to access all pages.

- [x] T023 [US6] Create `frontend/e2e/06-design-compliance.spec.ts` with setup: register user, assign buyer role, create campaign (to populate pages); tests for each page: (1) `/` (landing) — bg-color, h1 font-family `Syne`, body font-family `Outfit`; (2) `/login` — bg-color, text color; (3) `/signup` — bg-color, text color; (4) `/dashboard` — bg-color, heading font `Syne`; (5) `/profile` — bg-color, body font `Outfit`; (6) `/campaigns` — bg-color, heading font `Syne`; (7) `/campaigns/new` — bg-color; (8) `/campaigns/:id` — bg-color; (9) `/admin` (as admin) — bg-color, heading font `Syne`
- [x] T024 [US6] Run scenario 06 in isolation; confirm all tests pass

**Checkpoint**: US6 fully passing — all 9 pages checked for design token compliance.

---

## Phase 9: Polish & Verification

**Purpose**: Clean up, full suite run, and quickstart validation.

- [x] T025 Remove the old `frontend/e2e/campaign-creation.spec.ts` (superseded by `02-campaign-create-list.spec.ts`)
- [x] T026 Run the full E2E suite via `npm run e2e` (one command) and confirm all 6 scenario files pass
- [x] T027 Verify suite completes in under 3 minutes (SC-003)
- [x] T028 Run a single scenario in isolation (e.g., `npx playwright test e2e/03-login-logout-session.spec.ts`) to confirm test independence (SC-005)
- [x] T029 Run quickstart.md verification checklist: one-command execution, all green, design checkpoints present, test independence, clean teardown

---

## Dependencies & Execution Order

### Phase Dependencies

- **Phase 1 (Setup)**: No dependencies — start immediately
- **Phase 2 (Foundational)**: Depends on Phase 1 (helpers import from app, stack must exist)
- **Phases 3–8 (User Stories)**: All depend on Phase 2 (shared helpers must exist)
  - US1 (Phase 3) and US3 (Phase 5): No dependencies on other stories
  - US2 (Phase 4) and US4 (Phase 6): Depend only on admin seed (Phase 1)
  - US5 (Phase 7): Depends only on admin seed (Phase 1)
  - US6 (Phase 8): Depends only on admin seed (Phase 1)
- **Phase 9 (Polish)**: Depends on all story phases being complete

### User Story Dependencies

- **US1** (Registration/Profile): Independent — no other story needed
- **US2** (Campaign Create/List): Independent — creates own buyer via admin flow
- **US3** (Login/Logout/Session): Independent — creates own user via signup
- **US4** (Admin Management): Independent — uses pre-seeded admin
- **US5** (Campaign Edit/Archive): Independent — creates own buyer and campaign
- **US6** (Design Compliance): Independent — creates all data it needs

### Parallel Opportunities

- T004 and T005 can run in parallel (different files, both in Phase 1)
- T006, T007, T008 can all run in parallel (three separate helper files)
- Phases 3–8 can run in parallel (all story tests are independent)
- Within each story, edge case tasks depend on the main spec task

---

## Implementation Strategy

### MVP First (US1 + US2 Only)

1. Complete Phase 1: Setup (docker-compose, seed, scripts)
2. Complete Phase 2: Foundational (helpers)
3. Complete Phase 3: US1 — Registration and Profile
4. Complete Phase 4: US2 — Campaign Creation and Listing
5. **STOP and VALIDATE**: Two P1 stories cover the most critical paths

### Incremental Delivery

1. Setup + Foundational → Infrastructure ready
2. Add US1 → Registration verified (MVP start)
3. Add US2 → Campaign lifecycle verified (MVP complete)
4. Add US3 → Auth lifecycle verified
5. Add US4 → Admin verified
6. Add US5 → Edit/archive verified
7. Add US6 → Design compliance verified
8. Polish → Full suite green, quickstart validated

---

## Notes

- All tasks use format `- [ ] Tnnn [P?] [USn?] Description with file path`.
- Each scenario file is self-contained — creates its own users and data.
- The admin seed (T002–T003) is the only backend change; everything else is test code.
- Design checkpoints use CSS assertions per the clarification (no screenshots).
- The old `campaign-creation.spec.ts` is removed in T025 after its coverage is superseded.
