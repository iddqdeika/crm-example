# Tasks: Session Persistence & Inactivity Timeout

**Input**: Design documents from `/specs/005-session-persistence/`
**Branch**: `005-session-persistence`
**Prerequisites**: plan.md ✅ spec.md ✅ research.md ✅ data-model.md ✅ contracts/ ✅ quickstart.md ✅

**Tests**: TDD is MANDATORY per constitution. Test tasks appear before their implementation counterparts. Tests MUST fail (RED) before implementation, and pass (GREEN) after.

**Organization**: Tasks grouped by user story for independent implementation and testing.

---

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: Add Redis as a standalone Docker service, new environment variables, and Python dependency.

- [x] T001 Add `redis:7-alpine` service with health check to `docker/docker-compose.dev.yml`; add `REDIS_URL` to backend `environment` block; add `redis` as a `depends_on` condition for the `backend` service
- [x] T002 [P] Add `SESSION_INACTIVITY_TIMEOUT`, `SESSION_MAX_LIFETIME`, `SESSION_WARNING_SECONDS`, `REDIS_URL` to `.env` and `.env.example` with documented defaults
- [x] T003 [P] Add `redis[asyncio]>=5.0` to `dependencies` in `backend/pyproject.toml`
- [x] T004 [P] Add `session_inactivity_timeout_seconds` (default 1800), `session_max_lifetime_seconds` (default 28800), `session_warning_seconds` (default 300), `redis_url` (default `redis://localhost:6379`) fields to `Settings` in `backend/src/core/settings.py`

**Checkpoint**: `docker compose up` starts Redis on port 6379. `redis-cli ping` returns `PONG`.

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Redis session cache abstraction, fake for testing, DB migration — all user stories depend on these.

**⚠️ CRITICAL**: No user story work can begin until this phase is complete.

- [x] T005 Write unit tests for `FakeSessionCache` in `backend/tests/unit/test_session_cache.py`: assert `get` returns `None` for unknown session, `set` stores entry retrievable by `get`, `touch` updates `inactivity_exp` and returns `True`, `touch` on missing key returns `False`, `revoke` marks entry as revoked — **tests MUST pass before T006** (they test the test helper itself)
- [x] T006 Create `backend/src/core/session_cache.py` with: `SessionCacheEntry` dataclass, `SessionCache` Protocol (`get`, `set`, `touch`, `revoke`), `RedisSessionCache` concrete implementation (Redis hash per session, TTL = inactivity timeout), `FakeSessionCache` (in-memory dict), `get_session_cache()` FastAPI DI function
- [x] T007 Create `backend/tests/fakes/fake_session_cache.py` (move `FakeSessionCache` here for reuse across test modules; import it from `session_cache.py` or duplicate — whichever keeps tests importable)
- [x] T008 Write Alembic migration `backend/migrations/versions/20260227_002_session_activity_columns.py`: add `absolute_expires_at TIMESTAMP NOT NULL DEFAULT (NOW() + INTERVAL '8 hours')`, add `last_active_at TIMESTAMP NULL`, add index on `absolute_expires_at`

**Checkpoint**: `pytest backend/tests/unit/test_session_cache.py -v` all GREEN. Migration file exists with correct up/downgrade.

---

## Phase 3: User Story 1 — Session Survives Page Reload and New Tabs (Priority: P1) 🎯 MVP

**Goal**: Fix the `AuthContext` mount effect to verify the session with the backend on page load. Users no longer get redirected to login on every page refresh.

**Independent Test**: Log in, press F5 — the `AuthContext` calls `GET /me/profile` on mount, restores `user` and `profile` from the response, and `ProtectedRoute` renders the page instead of redirecting.

### Tests for User Story 1 (write FIRST — must FAIL before T012–T013)

- [x] T009 [P] [US1] Write Vitest test `renders-dashboard-after-reload` in `frontend/src/contexts/AuthContext.test.tsx`: mock `profileApi.getProfile` to return a valid profile; render `AuthProvider` + `ProtectedRoute`; assert the protected content is shown (not the login redirect) once `loading` settles
- [x] T010 [P] [US1] Write Vitest test `clears-state-on-401` in `frontend/src/contexts/AuthContext.test.tsx`: mock `profileApi.getProfile` to throw a 401; render `AuthProvider`; assert `user` is `null` and `loading` is `false` after mount
- [x] T011 [P] [US1] Write Vitest test `shows-loading-spinner-during-check` in `frontend/src/contexts/AuthContext.test.tsx`: mock `profileApi.getProfile` to return a pending promise; render `AuthProvider` + `ProtectedRoute`; assert the loading placeholder is shown while the promise is pending

### Implementation for User Story 1

- [x] T012 [US1] Fix `useEffect` in `frontend/src/contexts/AuthContext.tsx`: call `profileApi.getProfile()` on mount; on 200 set `user` (from profile fields) and `profile`; on error (401/network) clear state; set `loading = false` in `finally` (depends on T009–T011 RED)
- [x] T013 [US1] Update `frontend/src/services/api.ts` (or equivalent): ensure `getProfile` returns a response shape that includes `id`, `email`, `display_name` fields so `AuthContext` can populate the `user` object from it (depends on T012)

**Checkpoint**: `npx vitest run src/contexts/AuthContext.test.tsx` — all 3 tests GREEN. Manual: log in, press F5, dashboard loads without login redirect.

---

## Phase 4: User Story 2 — Automatic Re-login After Inactivity (Priority: P2)

**Goal**: Sessions expire after the configured inactivity window. The backend enforces both rolling inactivity and absolute hard-cap expiry. Redis is the hot-path validation layer.

**Independent Test**: With `SESSION_INACTIVITY_TIMEOUT=60`, log in, wait 70 seconds idle, then trigger any API call — 401 returned, frontend redirects to `/login?reason=expired`.

### Tests for User Story 2 (write FIRST — must FAIL before T020–T025)

- [x] T014 [P] [US2] Write unit test `test_create_session_sets_absolute_expires_at` in `backend/tests/unit/test_auth_service_session.py`: call `create_session`; assert returned session has `absolute_expires_at = created_at + max_lifetime` and `expires_at = created_at + inactivity_timeout`
- [x] T015 [P] [US2] Write unit test `test_touch_session_extends_inactivity_deadline` in `backend/tests/unit/test_auth_service_session.py`: create a session, call `touch_session`; assert `expires_at` is updated to `now + inactivity_timeout`; assert `absolute_expires_at` is unchanged
- [x] T016 [P] [US2] Write unit test `test_touch_session_respects_absolute_cap` in `backend/tests/unit/test_auth_service_session.py`: create a session with `absolute_expires_at = now + 10s`; call `touch_session`; assert `expires_at = absolute_expires_at` (capped, not extended beyond hard limit)
- [x] T017 [P] [US2] Write unit test `test_get_current_session_checks_redis_first` in `backend/tests/unit/test_auth_service_session.py`: mock `SessionCache.get` to return a valid entry; assert no DB query is made (DB mock not called)
- [x] T018 [P] [US2] Write unit test `test_get_current_session_falls_back_to_db` in `backend/tests/unit/test_auth_service_session.py`: mock `SessionCache.get` to return `None`; assert `db.execute` is called; session re-cached after DB hit
- [x] T019 [P] [US2] Write contract test `test_session_touch_returns_200` in `backend/tests/contract/test_session_api.py`: authenticated user calls `POST /me/session/touch`; assert 200 and `inactivity_expires_at` in response body
- [x] T020 [P] [US2] Write contract test `test_session_touch_requires_auth` in `backend/tests/contract/test_session_api.py`: unauthenticated `POST /me/session/touch`; assert 401
- [x] T021 [P] [US2] Write Vitest test `redirects-to-login-with-reason-on-401` in `frontend/src/contexts/AuthContext.test.tsx`: any API call returns 401 after initial load; assert `sessionStorage['redirectAfterLogin']` is set to current path and navigation goes to `/login?reason=expired`
- [x] T022 [P] [US2] Write Vitest test `login-page-shows-expiry-message` in `frontend/src/pages/Login.test.tsx`: render `Login` with `?reason=expired` in URL; assert a "session expired" informational message is visible

### Implementation for User Story 2

- [x] T023 [US2] Update `backend/src/models/session.py`: add `absolute_expires_at: Mapped[datetime]` and `last_active_at: Mapped[datetime | None]` columns (depends on T008 migration existing)
- [x] T024 [US2] Update `backend/src/services/auth_service.py`: `create_session` sets `absolute_expires_at = now + max_lifetime` and `expires_at = now + inactivity_timeout`; add `touch_session(db, session, cache)` function that updates `expires_at = min(now + inactivity_timeout, absolute_expires_at)`, refreshes Redis TTL via `cache.touch()`, and debounces DB write (only flushes if `last_db_sync` in Redis is > 60s ago) (depends on T014–T016 RED)
- [x] T025 [US2] Update `backend/src/core/auth.py`: `get_current_session` checks `session_cache.get(session_id)` first; validates both `inactivity_exp` and `absolute_exp` from cache; falls back to DB + `cache.set()` on cache miss; inject `SessionCache` via `Depends(get_session_cache)` (depends on T017–T018 RED)
- [x] T026 [US2] Add `POST /me/session/touch` endpoint to `backend/src/api/profile.py`: calls `touch_session(db, session, cache)`; returns `{"inactivity_expires_at": ...}`; inject `SessionCache` (depends on T019–T020 RED)
- [x] T027 [US2] Update `backend/src/api/auth.py` logout handler: call `session_cache.revoke(session_id)` before DB revoke (depends on T025)
- [x] T028 [US2] Add 401 interceptor to `frontend/src/services/api.ts` (or `AuthContext.tsx`): on any 401 from an authenticated call, save `window.location.pathname + search` to `sessionStorage['redirectAfterLogin']`, clear auth state, navigate to `/login?reason=expired` (depends on T021 RED)
- [x] T029 [US2] Update `frontend/src/pages/Login.tsx`: read `?reason=expired` query param; show distinct "Your session expired due to inactivity" message when present (depends on T022 RED)
- [x] T030 [US2] Update `frontend/src/contexts/AuthContext.tsx` `login` function: after successful login, read and clear `sessionStorage['redirectAfterLogin']`; navigate to saved URL if set, otherwise `/dashboard`

**Checkpoint**: `pytest backend/tests/unit/test_auth_service_session.py backend/tests/contract/test_session_api.py -v` all GREEN. `npx vitest run` frontend tests GREEN. Manual: idle past timeout → redirected to login with message → re-login → returned to original page.

---

## Phase 5: User Story 3 — Configurable Inactivity Timeout (Priority: P3)

**Goal**: Both `SESSION_INACTIVITY_TIMEOUT` and `SESSION_MAX_LIFETIME` are env-var-only changes that take effect for all new sessions without a code deployment.

**Independent Test**: Change `SESSION_INACTIVITY_TIMEOUT=120` in `.env`, restart backend only, log in, wait 130 seconds — session expires at the new threshold.

### Tests for User Story 3 (write FIRST — must FAIL before T033)

- [x] T031 [P] [US3] Write unit test `test_settings_inactivity_timeout_is_configurable` in `backend/tests/unit/test_auth_service_session.py`: instantiate `Settings` with `session_inactivity_timeout_seconds=120`; call `create_session` with those settings; assert `expires_at = created_at + 120s`
- [x] T032 [P] [US3] Write unit test `test_settings_max_lifetime_is_configurable` in `backend/tests/unit/test_auth_service_session.py`: instantiate `Settings` with `session_max_lifetime_seconds=3600`; call `create_session`; assert `absolute_expires_at = created_at + 3600s`

### Implementation for User Story 3

- [x] T033 [US3] Verify `create_session` and `touch_session` in `backend/src/services/auth_service.py` read timeout values from injected `Settings` (not hard-coded constants); add `settings: Settings` parameter if not already present (depends on T031–T032 RED)

**Checkpoint**: Change `SESSION_INACTIVITY_TIMEOUT=120` env var, restart backend; `GET /me/profile` returns `session_inactivity_expires_at` ≈ 2 minutes from now.

---

## Phase 6: User Story 4 — Expiry Warning Before Forced Logout (Priority: P3)

**Goal**: `GET /me/profile` returns session expiry timestamps. A `SessionExpiryWarning` banner component shows a countdown and distinct messages for inactivity vs hard-cap expiry.

**Independent Test**: Set `SESSION_INACTIVITY_TIMEOUT=400`, `SESSION_WARNING_SECONDS=300`; log in, wait ~100 seconds — warning banner appears with "click anywhere to stay" message. Click → banner disappears, countdown resets.

### Tests for User Story 4 (write FIRST — must FAIL before T037–T041)

- [x] T034 [P] [US4] Write contract test `test_get_profile_returns_session_timestamps` in `backend/tests/contract/test_profile_api.py` (extend file): authenticated `GET /me/profile`; assert response contains `session_inactivity_expires_at`, `session_absolute_expires_at`, `session_warning_seconds`
- [x] T035 [P] [US4] Write Vitest test `shows-inactivity-warning-when-near-expiry` in `frontend/src/components/SessionExpiryWarning.test.tsx`: render `SessionExpiryWarning` with `inactivityExpiresAt = now + 200s` and `warningSecs = 300`; assert warning banner is visible with text about inactivity
- [x] T036 [P] [US4] Write Vitest test `shows-hard-cap-warning-when-near-absolute-expiry` in `frontend/src/components/SessionExpiryWarning.test.tsx`: render with `absoluteExpiresAt = now + 200s`, `warningSecs = 300`; assert warning contains "cannot be extended" language
- [x] T037 [P] [US4] Write Vitest test `no-warning-when-not-near-expiry` in `frontend/src/components/SessionExpiryWarning.test.tsx`: render with both expiry times > 10 minutes away; assert no warning banner is rendered
- [x] T038 [P] [US4] Write Vitest test `inactivity-warning-dismissed-on-touch` in `frontend/src/components/SessionExpiryWarning.test.tsx`: show inactivity warning; simulate user clicking inside the component; assert warning dismissed and `touchSession` was called

### Implementation for User Story 4

- [x] T039 [US4] Update `backend/src/schemas/profile.py`: add `session_inactivity_expires_at: datetime | None`, `session_absolute_expires_at: datetime | None`, `session_warning_seconds: int` to `ProfileResponse`
- [x] T040 [US4] Update `backend/src/services/profile_service.py` `get_profile_for_response`: accept the current `AuthenticationSession` (passed from endpoint); populate new schema fields from `session.expires_at`, `session.absolute_expires_at`, and `settings.session_warning_seconds` (depends on T034 RED)
- [x] T041 [US4] Update `backend/src/api/profile.py` `get_my_profile`: pass current session to `get_profile_for_response`; it already has `session` from `get_current_session` dependency
- [x] T042 [US4] Update `frontend/src/contexts/AuthContext.tsx`: parse `session_inactivity_expires_at`, `session_absolute_expires_at`, `session_warning_seconds` from `GET /me/profile` response; expose as `sessionInactivityExpiresAt`, `sessionAbsoluteExpiresAt`, `sessionWarningSecs` in context; add `touchSession()` function that calls `POST /me/session/touch` and updates `sessionInactivityExpiresAt`
- [x] T043 [US4] Create `frontend/src/components/SessionExpiryWarning.tsx`: reads expiry times and warning window from `AuthContext`; uses `setInterval` (1s tick) to update countdown; renders dismissable banner with two message variants — inactivity (shows "click anywhere") and hard-cap ("save your work"); calls `touchSession()` on interaction for inactivity case (depends on T035–T038 RED)
- [x] T044 [US4] Mount `SessionExpiryWarning` in authenticated layout inside `frontend/src/App.tsx` (inside `AppRoutes`, only rendered for authenticated pages)

**Checkpoint**: `pytest backend/tests/contract/test_profile_api.py -v` GREEN. `npx vitest run src/components/SessionExpiryWarning.test.tsx` GREEN. Manual: warning appears before expiry; clicking extends inactivity deadline.

---

## Phase 7: Polish & Cross-Cutting Concerns

- [x] T045 [P] Run full backend test suite `pytest backend/tests/ -v`; fix any regressions from session model changes or new DI injections
- [x] T046 [P] Run full frontend test suite `npx vitest run`; fix any regressions from `AuthContext` changes
- [x] T047 [P] Update `backend/tests/conftest.py`: add `fake_session_cache` fixture that overrides `get_session_cache` dependency; ensure all existing contract/integration tests pass with the new DI (session cache injected and overridden in tests)
- [x] T048 Verify no `Path("uploads")` or `session_ttl_seconds` hard-coded references remain in `backend/src/services/auth_service.py` (old fixed TTL replaced by new fields)
- [ ] T049 Run quickstart.md end-to-end verification checklist against running `docker compose up` stack

---

## Dependencies & Execution Order

### Phase Dependencies

- **Phase 1 (Setup)**: No dependencies — start immediately
- **Phase 2 (Foundational)**: Depends on Phase 1 — **BLOCKS all user stories**
- **Phase 3 (US1)**: Depends on Phase 2 — frontend fix only, no DB/Redis changes needed
- **Phase 4 (US2)**: Depends on Phase 2 + Phase 3 (session model + Redis must be in place)
- **Phase 5 (US3)**: Depends on Phase 4 (settings must be wired into `create_session`)
- **Phase 6 (US4)**: Depends on Phase 4 (session timestamps in `ProfileResponse` need `expires_at`/`absolute_expires_at` on session model)
- **Phase 7 (Polish)**: Depends on all user story phases complete

### User Story Dependencies

- **US1 (P1)**: Frontend-only; can start after Phase 2 (foundational types exist)
- **US2 (P2)**: Backend + frontend; depends on session model columns (Phase 2 migration)
- **US3 (P3)**: Settings wiring; depends on US2 `create_session` being updated
- **US4 (P4)**: Frontend timer + schema extension; depends on US2 session columns being present

### Within Each User Story

- Test tasks (T009–T011, T014–T022, T031–T032, T034–T038) MUST be RED before corresponding implementation tasks
- DB migration (T008) before model field additions (T023)
- Backend service changes before endpoint changes
- Frontend `AuthContext` changes before `SessionExpiryWarning` component

### Parallel Opportunities

- T002, T003, T004 (Phase 1): fully parallel — different files
- T009–T011 (US1 tests): parallel — different test functions
- T014–T022 (US2 tests): parallel — different test functions and files
- T031–T032 (US3 tests): parallel
- T034–T038 (US4 tests): parallel
- T045, T046, T047 (Polish): parallel — different commands

---

## Parallel Example: User Story 2 Tests

```bash
# Write all 9 US2 tests simultaneously (different files/functions):
T014: test_create_session_sets_absolute_expires_at      → test_auth_service_session.py
T015: test_touch_session_extends_inactivity_deadline    → test_auth_service_session.py
T016: test_touch_session_respects_absolute_cap          → test_auth_service_session.py
T017: test_get_current_session_checks_redis_first       → test_auth_service_session.py
T018: test_get_current_session_falls_back_to_db         → test_auth_service_session.py
T019: test_session_touch_returns_200                    → test_session_api.py
T020: test_session_touch_requires_auth                  → test_session_api.py
T021: redirects-to-login-with-reason-on-401             → AuthContext.test.tsx
T022: login-page-shows-expiry-message                   → Login.test.tsx

# Run backend:
pytest backend/tests/unit/test_auth_service_session.py backend/tests/contract/test_session_api.py -v
# Run frontend:
npx vitest run src/contexts/AuthContext.test.tsx src/pages/Login.test.tsx
```

---

## Implementation Strategy

### MVP First (US1 only — Phases 1–3)

1. Complete Phase 1: Redis Docker service + env vars
2. Complete Phase 2: `SessionCache` abstraction + migration
3. Complete Phase 3: Fix `AuthContext` mount effect
4. **STOP and VALIDATE**: Press F5 after login — dashboard loads, no redirect to login
5. This alone fixes the most critical usability bug; ship if needed

### Incremental Delivery

1. Phase 1 + Phase 2 → Infrastructure ready ✅
2. Phase 3 (US1) → Page reload works ✅
3. Phase 4 (US2) → Inactivity timeout + Redis hot path ✅
4. Phase 5 (US3) → Configurable timeout values ✅
5. Phase 6 (US4) → Expiry warning banner ✅
6. Phase 7 (Polish) → Full test suite green ✅

---

## Notes

- `[P]` = can run in parallel with other `[P]` tasks in the same phase
- `[US1]–[US4]` = user story labels from `spec.md`
- TDD is mandatory: all test tasks must be RED before their implementation tasks begin
- `FakeSessionCache` is the only cache implementation used in all automated tests — no Redis needed in CI
- `session_ttl_seconds` in `Settings` is superseded by `session_inactivity_timeout_seconds` and `session_max_lifetime_seconds`; the old field can be removed in Phase 7 once all references are migrated
