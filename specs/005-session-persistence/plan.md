# Implementation Plan: Session Persistence & Inactivity Timeout

**Branch**: `005-session-persistence` | **Date**: 2026-02-27 | **Spec**: [spec.md](spec.md)
**Input**: Feature specification from `/specs/005-session-persistence/spec.md`
**User constraint**: "use any kind of cache (Redis for example) to minimize relational db load"

## Summary

Fix the frontend auth-state hydration bug that causes every page reload to redirect to login (US1). Add rolling inactivity timeout + hard maximum lifetime to sessions (US2/US3). Introduce a proactive expiry warning banner with a countdown timer (US4). Redis is added as a standalone Docker Compose service and used to cache session data, eliminating PostgreSQL queries on every authenticated request. The backend falls back to PostgreSQL on cache miss, ensuring correctness with zero downtime.

## Technical Context

**Language/Version**: Python 3.12 (backend), TypeScript / React 18 (frontend)
**Primary Dependencies**: FastAPI, SQLAlchemy async, `redis[asyncio]>=5.0` (new), Alembic, React Router v6
**Storage**: PostgreSQL (authoritative session records), Redis (session cache — hot path)
**Testing**: pytest + pytest-asyncio (backend); Vitest + React Testing Library (frontend)
**Target Platform**: Linux container (Docker Compose)
**Project Type**: Web service (FastAPI backend) + React SPA frontend
**Performance Goals**: Session validation per request < 5ms (Redis hit); < 30ms (DB fallback)
**Constraints**: Redis must be a standalone service (Docker Compose), not in-process. Session validity always enforced server-side.
**Scale/Scope**: Single-tenant; architecture supports multi-instance via shared Redis.

## Constitution Check

### ✅ Testability First

- `SessionCache` is a Protocol with `FakeSessionCache` test double — no Redis required in CI.
- `AuthContext` session restoration is tested via mocked `profileApi`.
- `SessionExpiryWarning` countdown is tested by injecting mock expiry timestamps.
- All new backend code is independently testable without Docker networking.

### ✅ Test-Driven Development

- `FakeSessionCache` tests written and passing before `RedisSessionCache` implemented.
- Unit tests for `touch_session`, `create_session`, expiry logic written before implementation.
- Contract tests for `POST /me/session/touch` written before the endpoint.
- Frontend tests for `AuthContext` reload behaviour and `SessionExpiryWarning` written first.

### ✅ Red-Green-Refactor

- Each story follows: write failing test → implement minimum code → refactor.

### ✅ Microservices by Design

- Redis is a **standalone service** in Docker Compose. The backend communicates with it only through the Redis protocol.
- PostgreSQL remains the source of truth; Redis is a cache. Session records are owned by the backend service only.
- No cross-service DB access introduced.

### ✅ Docker-First Delivery

- Redis added to `docker/docker-compose.dev.yml` with health check.
- Backend service depends on Redis health.
- All new env vars documented in `.env.example`.

**Constitution Check**: ✅ PASS — No violations.

## Project Structure

### Documentation (this feature)

```text
specs/005-session-persistence/
├── plan.md              # This file
├── research.md          # R1–R10: Redis design, debounce strategy, frontend fix
├── data-model.md        # Session entity changes, Redis hash schema, new settings
├── quickstart.md        # How to run, files changed, verification checklist
├── contracts/
│   └── session-api.md   # GET /me/profile (extended), POST /me/session/touch, SessionCache protocol
└── tasks.md             # From /speckit.tasks
```

### Source Code Changes

```text
backend/
├── src/
│   ├── core/
│   │   ├── settings.py          # + redis_url, session timeout/lifetime/warning
│   │   ├── session_cache.py     # NEW: SessionCache protocol + RedisSessionCache + FakeSessionCache (DI)
│   │   └── auth.py              # Check Redis first; DB fallback on miss
│   ├── services/
│   │   └── auth_service.py      # create_session sets absolute_expires_at; touch_session w/ debounce
│   ├── api/
│   │   ├── auth.py              # logout: call session_cache.revoke()
│   │   └── profile.py           # POST /me/session/touch; GET /me/profile adds session timestamps
│   └── schemas/
│       └── profile.py           # + session_inactivity_expires_at, session_absolute_expires_at, session_warning_seconds
└── migrations/versions/
    └── YYYYMMDD_002_session_activity_columns.py  # add absolute_expires_at, last_active_at

frontend/
├── src/
│   ├── contexts/
│   │   └── AuthContext.tsx       # Mount: call GET /me/profile to restore session; expose expiry times; touchSession
│   ├── components/
│   │   ├── SessionExpiryWarning.tsx      # NEW: countdown banner
│   │   └── SessionExpiryWarning.test.tsx # NEW: Vitest tests
│   ├── pages/
│   │   └── Login.tsx             # Read redirectAfterLogin from sessionStorage; show reason=expired message
│   └── App.tsx                   # Mount SessionExpiryWarning inside authenticated layout

backend/tests/
├── fakes/
│   └── fake_session_cache.py     # NEW
├── unit/
│   ├── test_session_cache.py     # NEW
│   └── test_auth_service_session.py  # NEW
└── contract/
    └── test_session_api.py       # NEW

docker/
└── docker-compose.dev.yml        # + redis service

.env / .env.example               # + REDIS_URL, SESSION_* vars
```

## Implementation Phases

### Phase A — Infrastructure

1. Add Redis service to `docker-compose.dev.yml`
2. Add session/Redis settings to `Settings`
3. Add env vars to `.env` and `.env.example`
4. Add `redis[asyncio]>=5.0` to `pyproject.toml`

### Phase B — Storage Abstraction + Cache (TDD)

1. **Test**: Write `test_session_cache.py` — unit tests for `FakeSessionCache` (RED)
2. Create `session_cache.py` with `SessionCache` protocol, `RedisSessionCache`, `FakeSessionCache`, `get_session_cache` DI (GREEN)
3. **Test**: Write unit tests for debounce logic — `touch` skips DB write if within 60s (RED)
4. Implement `touch_session` with debounce in `auth_service.py` (GREEN)

### Phase C — DB Migration + Session Model

1. Write Alembic migration adding `absolute_expires_at` and `last_active_at`
2. Update `create_session` in `auth_service.py` to set `absolute_expires_at = created_at + max_lifetime`
3. Update `get_current_session` in `auth.py` to check both expiry columns + use Redis cache

### Phase D — API Contracts (TDD)

1. **Test**: Write contract tests for `POST /me/session/touch` (RED)
2. Implement `POST /me/session/touch` endpoint (GREEN)
3. **Test**: Write contract test for `GET /me/profile` returning session timestamps (RED)
4. Update `ProfileResponse` schema + `get_profile_for_response` + `get_my_profile` endpoint (GREEN)
5. Update `POST /auth/logout` to call `session_cache.revoke()`

### Phase E — US1: Frontend Session Restoration (TDD)

1. **Test**: Write Vitest test — `AuthContext` on mount calls `GET /me/profile`, restores user state (RED)
2. Fix `AuthContext.tsx` `useEffect` to call `GET /me/profile` on mount (GREEN)
3. **Test**: Write Vitest test — 401 from profile clears user state, does not throw (RED)
4. Verify test passes (should be immediate GREEN after Phase E step 2 fix)

### Phase F — US2/US3: Post-expiry redirect + login page message (TDD)

1. **Test**: Write Vitest test — 401 response saves current URL to `sessionStorage` and redirects to `/login?reason=expired` (RED)
2. Add 401 interceptor in `AuthContext` that saves redirect target (GREEN)
3. **Test**: Write Vitest test — Login page shows "session expired" message when `reason=expired` (RED)
4. Update `Login.tsx` to handle `reason=expired` query param (GREEN)
5. **Test**: Write Vitest test — after login, `redirectAfterLogin` in `sessionStorage` causes navigation to saved URL (RED)
6. Update `login` function in `AuthContext` to check and consume `redirectAfterLogin` (GREEN)

### Phase G — US4: Expiry Warning Banner (TDD)

1. **Test**: Write Vitest test — `SessionExpiryWarning` renders banner when `timeRemaining < warningSecs` (RED)
2. Create `SessionExpiryWarning.tsx` component (GREEN)
3. **Test**: Write Vitest test — inactivity warning shows "click to stay" message; hard-cap warning shows save-work message (RED)
4. Implement the two message variants (GREEN)
5. Mount `SessionExpiryWarning` inside authenticated layout in `App.tsx`

## Complexity Tracking

No constitution violations.

| Deviation | Why needed | Alternative rejected |
|---|---|---|
| Redis TTL as primary expiry signal | Eliminates DB queries; Redis TTL is authoritative during normal operation | Full DB validation on every request — too slow, defeats the purpose |
| Debounced DB write (60s window) | Dramatically reduces DB writes for active users | Write-through — acceptable correctness cost for a minor security edge case |
