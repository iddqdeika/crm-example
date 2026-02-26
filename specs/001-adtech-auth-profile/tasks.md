# Tasks: Adtech Landing & Profile Auth

**Input**: Design documents from `specs/001-adtech-auth-profile/`
**Prerequisites**: plan.md, spec.md, research.md, data-model.md, contracts/

**Tests**: For Qualityboard, automated tests are MANDATORY and MUST be written before
implementation for each user story (TDD + Red-Green-Refactor).

**Organization**: Tasks are grouped by user story to enable independent implementation and
testing of each story.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no dependencies)
- **[Story]**: Which user story this task belongs to (US1, US2, US3, US4)
- Include exact file paths in descriptions

## Path Conventions

- **Backend**: `backend/src/`, `backend/tests/`, `backend/scripts/`, `backend/migrations/`
- **Frontend**: `frontend/src/`, `frontend/tests/`
- **Docker**: `docker/`

---

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: Project initialization and basic structure per plan.md

- [x] T001 Create project structure: backend/, frontend/, docker/ directories and backend/src/api, backend/src/models, backend/src/services, backend/src/schemas, backend/src/core, backend/tests/unit, backend/tests/integration, backend/tests/contract, frontend/src/components, frontend/src/pages, frontend/src/services, frontend/src/hooks, frontend/src/types, frontend/src/utils
- [x] T002 Initialize backend Python project with FastAPI, SQLAlchemy, Alembic, Uvicorn, pytest in backend/pyproject.toml or backend/requirements.txt
- [x] T003 Initialize frontend React+TypeScript project with Vite (or CRA), React Router, React Testing Library in frontend/package.json
- [x] T004 [P] Add .env.example at repository root documenting POSTGRES_USER, POSTGRES_PASSWORD, POSTGRES_DB, DATABASE_URL, SECRET_KEY, APP_ENV
- [x] T005 [P] Configure Ruff linting and formatting for backend in backend/pyproject.toml or backend/ruff.toml
- [x] T006 [P] Configure ESLint and Prettier for frontend in frontend/.eslintrc and frontend/.prettierrc

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Core infrastructure that MUST be complete before ANY user story can be implemented

**⚠️ CRITICAL**: No user story work can begin until this phase is complete

- [x] T007 Setup PostgreSQL connection and Alembic migrations in backend/src/core/database.py and backend/migrations/ with env-based DATABASE_URL
- [x] T008 [P] Create User model (id, email, hashed_password, display_name, role, is_active, created_at, updated_at) in backend/src/models/user.py
- [x] T009 [P] Create AuthenticationSession model (id, user_id, created_at, expires_at, revoked_at, ip_address, user_agent) in backend/src/models/session.py
- [x] T010 Create get_db dependency and session factory in backend/src/core/database.py
- [x] T011 Implement core settings from environment variables in backend/src/core/settings.py
- [x] T012 Implement session middleware and get_current_user dependency (HTTP-only cookie, validate session) in backend/src/core/auth.py
- [x] T013 Add backend/scripts/migrate.sh (Alembic upgrade/downgrade) and backend/scripts/start.sh (run migrations then start Uvicorn)
- [x] T014 Create backend Dockerfile (multi-stage, non-root user, CMD using start.sh)
- [x] T015 Create frontend Dockerfile (build SPA, serve static)
- [x] T016 Add docker/docker-compose.dev.yml and docker/docker-compose.prod.yml with backend, frontend, postgres services and env config
- [x] T017 Configure structured error handling and request/security logging in backend/src/core/logging.py and exception handlers

**Checkpoint**: Foundation ready - user story implementation can now begin

---

## Phase 3: User Story 1 - Discover and Sign Up (Priority: P1) 🎯 MVP

**Goal**: Visitors see an adtech-themed landing page and can sign up or sign in to reach an authenticated area.

**Independent Test**: From public URL, complete sign-up with valid details and reach post-sign-up screen; or sign in with existing account and see personal area.

### Tests for User Story 1 (write FIRST, ensure they FAIL before implementation)

- [x] T018 [P] [US1] Contract test POST /auth/signup and POST /auth/login request/response shapes and status codes in backend/tests/contract/test_auth_api.py
- [x] T019 [P] [US1] Integration test signup then login flow (create user, then authenticate) in backend/tests/integration/test_auth_flow.py
- [x] T020 [P] [US1] Frontend test Landing page renders and signup/login forms submit in frontend/src/pages/Landing.test.tsx and frontend/src/components/auth forms tests

### Implementation for User Story 1

- [x] T021 [US1] Implement auth service (signup, login, password hashing, session creation) in backend/src/services/auth_service.py
- [x] T022 [US1] Implement Pydantic schemas for signup and login in backend/src/schemas/auth.py
- [x] T023 [US1] Implement POST /auth/signup, POST /auth/login, POST /auth/logout in backend/src/api/auth.py
- [x] T024 [US1] Create adtech-themed Landing page component in frontend/src/pages/Landing.tsx
- [x] T025 [US1] Create SignUp and Login form components in frontend/src/components/
- [x] T026 [US1] Implement auth API client (signup, login, logout) in frontend/src/services/api.ts
- [x] T027 [US1] Add auth context and routing (landing, login, signup, post-login redirect to personal area) in frontend/src/App.tsx and router config

**Checkpoint**: User Story 1 is fully functional and testable independently

---

## Phase 4: User Story 2 - View Profile (Priority: P2)

**Goal**: Authenticated users can open a profile page and see their account information and avatar.

**Independent Test**: Sign in as existing user, navigate to profile page, confirm display name, email, and avatar (or placeholder) are shown with actions for password and avatar.

### Tests for User Story 2

- [x] T028 [P] [US2] Contract test GET /me/profile response shape and 401 when unauthenticated in backend/tests/contract/test_profile_api.py
- [x] T029 [P] [US2] Integration test get profile when authenticated in backend/tests/integration/test_profile_flow.py
- [x] T030 [P] [US2] Frontend test Profile page displays user info and links for password/avatar in frontend/src/pages/Profile.test.tsx

### Implementation for User Story 2

- [x] T031 [US2] Create Profile model (id, user_id, display_name, email, bio, avatar_id, updated_at) in backend/src/models/profile.py
- [x] T032 [US2] Implement profile service (get current user profile with avatar_url) in backend/src/services/profile_service.py
- [x] T033 [US2] Implement GET /me/profile in backend/src/api/profile.py
- [x] T034 [US2] Create ProfilePage component and wire to router in frontend/src/pages/Profile.tsx
- [x] T035 [US2] Extend auth context to load and expose profile in frontend/src/contexts/AuthContext.tsx
- [x] T036 [US2] Display avatar URL and profile data wherever user identity is shown (header/sidebar) in frontend/src/

**Checkpoint**: User Stories 1 and 2 work independently

---

## Phase 5: User Story 3 - Change Password and Avatar (Priority: P3)

**Goal**: Authenticated users can change password and upload/remove avatar from the profile page.

**Independent Test**: Sign in, go to profile, change password and upload avatar; sign out, sign in with new password; confirm new avatar appears.

### Tests for User Story 3

- [x] T037 [P] [US3] Contract test PATCH /me/password, POST /me/avatar, DELETE /me/avatar in backend/tests/contract/test_profile_update_api.py
- [x] T038 [P] [US3] Integration test password change and avatar upload/remove in backend/tests/integration/test_profile_update_flow.py
- [x] T039 [P] [US3] Frontend test password change form and avatar upload component in frontend/src/components/

### Implementation for User Story 3

- [x] T040 [US3] Create Avatar model (id, user_id, storage_path, content_type, file_size_bytes, created_at, is_active) in backend/src/models/avatar.py
- [x] T041 [US3] Implement password change (verify current, hash new, update user) in backend/src/services/auth_service.py or profile_service.py
- [x] T042 [US3] Implement avatar upload/remove service (store file, update profile.avatar_id) in backend/src/services/avatar_service.py
- [x] T043 [US3] Implement PATCH /me/password, POST /me/avatar, DELETE /me/avatar in backend/src/api/profile.py
- [x] T044 [US3] Add PasswordChangeForm and AvatarUpload components in frontend/src/components/
- [x] T045 [US3] Wire password and avatar forms to Profile page and API client in frontend/src/pages/Profile.tsx and frontend/src/services/api.ts

**Checkpoint**: All three user stories are independently functional

---

## Phase 6: Admin - List and Manage Users (FR-011)

**Goal**: Admin users can list users and view/update a specific user (role, is_active).

**Independent Test**: Sign in as admin, open admin users list, open a user, change role or is_active, confirm update.

### Tests for Admin

- [x] T046 [P] [US4] Contract test GET /admin/users, GET /admin/users/{user_id}, PATCH /admin/users/{user_id} and 403 for non-admin in backend/tests/contract/test_admin_api.py
- [x] T047 [US4] Integration test admin list users and update user in backend/tests/integration/test_admin_flow.py

### Implementation for Admin

- [x] T048 [US4] Implement GET /admin/users, GET /admin/users/{user_id}, PATCH /admin/users/{user_id} with admin-only dependency in backend/src/api/admin.py
- [x] T049 [US4] Create Admin users list and user detail/edit page in frontend/src/pages/Admin.tsx
- [x] T050 [US4] Restrict admin routes to admin role in frontend router and add admin nav link for admins only

---

## Phase 7: Polish & Cross-Cutting Concerns

**Purpose**: Improvements that affect multiple user stories

- [x] T051 [P] Update docs/ and validate specs/001-adtech-auth-profile/quickstart.md steps (env, docker compose, migrations, tests)
- [x] T052 [P] Code cleanup and refactoring across backend and frontend per lint rules
- [x] T053 Security hardening: review auth cookies (httpOnly, secure, sameSite), password rules, and optional rate limiting on auth endpoints
- [x] T054 Run full backend and frontend test suites and quickstart.md validation

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: No dependencies - can start immediately
- **Foundational (Phase 2)**: Depends on Setup - BLOCKS all user stories
- **User Stories (Phase 3–5)**: Depend on Foundational; US2 depends on US1 (auth); US3 depends on US2 (profile)
- **Admin (Phase 6)**: Depends on Foundational and US1 (auth + role)
- **Polish (Phase 7)**: Depends on all desired user stories and admin complete

### User Story Dependencies

- **US1 (P1)**: After Phase 2 - no other story dependency
- **US2 (P2)**: After Phase 2 - uses US1 auth/session
- **US3 (P3)**: After US2 - uses profile page and profile API
- **US4 (Admin)**: After US1 - uses role and auth

### Within Each User Story

- Tests MUST be written and FAIL before implementation (TDD)
- Models before services; services before API routes; routes before frontend integration
- Story complete before moving to next priority

### Parallel Opportunities

- Phase 1: T004, T005, T006 can run in parallel
- Phase 2: T008, T009 can run in parallel
- Within US1: T018, T019, T020 can run in parallel; T024, T025 can run in parallel after T021–T023
- Within US2: T028, T029, T030 in parallel; T031 can run with T034 prep
- Within US3: T037, T038, T039 in parallel
- Phase 7: T051, T052 in parallel

---

## Implementation Strategy

### MVP First (User Story 1 Only)

1. Complete Phase 1: Setup
2. Complete Phase 2: Foundational
3. Complete Phase 3: User Story 1
4. **STOP and VALIDATE**: Test landing, signup, login independently
5. Deploy/demo if ready

### Incremental Delivery

1. Setup + Foundational → foundation ready
2. Add User Story 1 → test → Deploy/Demo (MVP)
3. Add User Story 2 → test → Deploy/Demo
4. Add User Story 3 → test → Deploy/Demo
5. Add Admin → test → Deploy/Demo
6. Polish and validate

---

## Notes

- [P] tasks = different files, no dependencies
- [Story] label maps task to user story for traceability
- Each user story is independently completable and testable
- Verify tests fail before implementing (Red-Green-Refactor)
- Commit after each task or logical group
- Stop at any checkpoint to validate story independently
