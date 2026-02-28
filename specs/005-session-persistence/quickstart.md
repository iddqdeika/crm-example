# Quickstart: Session Persistence & Inactivity Timeout

**Feature**: 005-session-persistence
**Branch**: `005-session-persistence`

---

## Prerequisites

- Docker Desktop running
- `.env` file at repo root (copy from `.env.example`)

---

## New Environment Variables

Add to `.env` and `.env.example`:

```env
# Session behaviour
SESSION_INACTIVITY_TIMEOUT=1800    # 30 minutes (seconds)
SESSION_MAX_LIFETIME=28800         # 8 hours (seconds)
SESSION_WARNING_SECONDS=300        # 5-minute warning before expiry

# Redis
REDIS_URL=redis://redis:6379
```

---

## Running the Full Stack

```bash
cd docker
docker compose -f docker-compose.dev.yml up --build
```

Services:
| Service | URL | Notes |
|---|---|---|
| Frontend | http://localhost:3000 | React app |
| Backend | http://localhost:8000 | FastAPI |
| PostgreSQL | localhost:5432 | Primary DB |
| Redis | localhost:6379 | Session cache |
| MinIO | http://localhost:9000 | Object storage |

---

## Running Backend Tests

```bash
cd backend
pip install -e ".[dev]"
pytest tests/ -v
```

Tests use `FakeSessionCache` — no Redis connection required.

---

## Key Files Changed / Added

### New Files
| File | Purpose |
|---|---|
| `backend/src/core/session_cache.py` | `SessionCache` protocol + `RedisSessionCache` + `get_session_cache` DI |
| `backend/tests/fakes/fake_session_cache.py` | `FakeSessionCache` for tests |
| `backend/tests/unit/test_session_cache.py` | Unit tests for `FakeSessionCache` |
| `backend/tests/unit/test_auth_service_session.py` | Unit tests for session creation/touch/expiry logic |
| `backend/tests/contract/test_session_api.py` | Contract tests for `POST /me/session/touch` |
| `backend/migrations/versions/YYYYMMDD_002_session_activity_columns.py` | Add `absolute_expires_at`, `last_active_at` columns |
| `frontend/src/components/SessionExpiryWarning.tsx` | Warning banner component |
| `frontend/src/components/SessionExpiryWarning.test.tsx` | Vitest tests for warning banner |

### Modified Files
| File | Change |
|---|---|
| `backend/src/core/settings.py` | Add `redis_url`, session timeout/lifetime/warning fields |
| `backend/src/core/auth.py` | Check Redis cache first; fall back to DB on miss |
| `backend/src/services/auth_service.py` | `create_session` sets `absolute_expires_at`; `touch_session` updates Redis + debounced DB |
| `backend/src/api/auth.py` | On logout, call `session_cache.revoke()` |
| `backend/src/api/profile.py` | New `POST /me/session/touch` endpoint; `GET /me/profile` adds session timestamps |
| `backend/src/schemas/profile.py` | Add `session_inactivity_expires_at`, `session_absolute_expires_at`, `session_warning_seconds` |
| `docker/docker-compose.dev.yml` | Add Redis service; backend depends on Redis |
| `.env` / `.env.example` | Add Redis URL + session config vars |
| `frontend/src/contexts/AuthContext.tsx` | Mount effect checks session via `GET /me/profile`; expose expiry timestamps; `touchSession` fn |
| `frontend/src/App.tsx` | Mount `SessionExpiryWarning` inside authenticated layout |
| `frontend/src/pages/Login.tsx` | Read `redirectAfterLogin` from `sessionStorage`; show expiry message on `?reason=expired` |

---

## Post-Implementation Verification Checklist

### US1 — Session persists across reload
- [ ] Log in, press F5 — Dashboard still shown, no login redirect
- [ ] Log in, open new tab, navigate to `/profile` — profile shown without login prompt
- [ ] Close all tabs, open new browser window within session lifetime — still logged in

### US2 — Inactivity timeout
- [ ] Set `SESSION_INACTIVITY_TIMEOUT=60` (1 minute), restart backend
- [ ] Log in, wait 70 seconds without any interaction
- [ ] Click any link — redirected to `/login?reason=expired` with "session expired" message
- [ ] Log back in — redirected to the page you were on before expiry

### US3 — Configurable timeout
- [ ] Change `SESSION_INACTIVITY_TIMEOUT=120`, restart backend, verify new timeout applies
- [ ] `GET /me/profile` — `session_inactivity_expires_at` is ~2 minutes from now

### US4 — Expiry warning
- [ ] Set `SESSION_INACTIVITY_TIMEOUT=400`, `SESSION_WARNING_SECONDS=300`
- [ ] Log in, wait ~100 seconds idle — warning banner appears: "session will expire in ~5 minutes, click to stay"
- [ ] Click anywhere — banner disappears, `session_inactivity_expires_at` resets to ~6 minutes from now
- [ ] Set `SESSION_MAX_LIFETIME=400`, `SESSION_WARNING_SECONDS=300`, log in fresh
- [ ] Wait ~100 seconds — warning appears with hard-cap message (no "click to stay")

### Redis cache
- [ ] `docker exec -it docker-redis-1 redis-cli KEYS 'session:*'` — shows one key per active session
- [ ] Backend logs show cache HIT on second request, no DB query
- [ ] Restart only the Redis container, make an authenticated request — cache miss, falls back to DB, still works
