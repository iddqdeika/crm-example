# Research: Session Persistence & Inactivity Timeout

**Feature**: 005-session-persistence
**Date**: 2026-02-27
**User constraint**: "use any kind of cache (Redis for example) to minimize relational db load"

---

## R1 — Root Cause of US1 (Session Not Surviving Page Reload)

**Finding**: `AuthContext.tsx` `useEffect` currently just calls `setLoading(false)` without verifying the session with the backend. On page reload, `user` starts as `null` and `ProtectedRoute` immediately redirects to `/login` before any auth check occurs. The session cookie is still valid on the browser side — but the frontend never asks the backend to confirm it.

**Decision**: On `AuthProvider` mount, call `GET /me/profile`. If it returns 200 → the session is valid; populate `user` and `profile` from the response. If 401 → clear state and allow the `ProtectedRoute` redirect. `loading` stays `true` until this check completes, preventing a premature redirect.

**Rationale**: No new endpoint needed. The existing `/me/profile` endpoint already validates the session cookie server-side and returns user + profile data in one call.

---

## R2 — Cache Backend: Redis

**Decision**: Use **Redis** (via `redis[asyncio]` Python library) as a standalone cache service. Redis runs as a Docker Compose service alongside PostgreSQL and MinIO.

**Rationale**:
- Redis is the de-facto standard for session caching. It supports native key TTL (auto-expiry), sub-millisecond reads, and atomic operations.
- `redis[asyncio]` (`redis.asyncio` module) provides a fully async client compatible with FastAPI's async handlers — no executor wrapping needed (unlike `boto3`).
- Session lookup is currently a DB query on every authenticated request. With Redis, the hot path is eliminated from PostgreSQL entirely.
- Every Docker Compose service the project already runs follows this standalone-service pattern (PostgreSQL, MinIO). Redis follows the same model.

**Alternatives considered**:
- **In-memory dict in the backend process**: No persistence across restarts, no multi-instance support. Rejected.
- **PostgreSQL advisory locks / UNLOGGED tables**: Still hits Postgres. Rejected.
- **Memcached**: No native TTL per key, no persistence, no pub/sub. Redis is strictly superior for this use case.

---

## R3 — Redis Session Cache Design

**Decision**: Store each session as a Redis hash at key `session:{session_id}`:
```
HSET session:{id}
  user_id         <uuid>
  inactivity_exp  <unix-timestamp>   # rolling inactivity deadline
  absolute_exp    <unix-timestamp>   # hard cap, never changes after creation
  is_revoked      0|1
```
Redis key TTL is set to `inactivity_timeout_seconds` and refreshed on each session touch. When the TTL fires, Redis automatically evicts the key — no need for a background cleanup job.

**Session validation hot path** (every authenticated request):
1. `HGETALL session:{id}` from Redis
2. If found and `is_revoked=0` and `now < inactivity_exp` and `now < absolute_exp` → valid, proceed
3. If Redis miss → fall back to PostgreSQL, repopulate Redis on hit

**Rationale**: Redis TTL mirrors the inactivity timeout. A session that expires by inactivity is automatically cleaned from Redis without any scheduled job. The PostgreSQL record remains for audit purposes.

---

## R4 — Session Touch Strategy (Minimising DB Writes)

**Decision**: "Touch" updates Redis immediately (refresh TTL + update `inactivity_exp`). DB write is **debounced**: only written to PostgreSQL if at least 60 seconds have elapsed since the last DB write for that session. The timestamp of the last DB write is stored in Redis alongside session data (`last_db_sync` field).

**Rationale**: If a user performs 100 actions per hour, we don't need 100 DB writes — the session is obviously active. Writing every 60 seconds caps DB writes at 60/hour per active session, which is a 100× improvement for active users. The 60-second debounce window is a minor security trade-off (a DB failover would lose at most 60 seconds of activity data) but Redis remains authoritative during normal operation.

**Explicit user action detection**: The frontend sends a `X-User-Action: true` HTTP header on navigation, form submission, and deliberate button clicks. Backend middleware checks this header and only touches the session when it is present. Background requests (polling, auto-save) omit the header.

---

## R5 — Session Expiry Info Exposed to Frontend (for US4 Warning)

**Decision**: Extend `GET /me/profile` response to include `session_inactivity_expires_at` (ISO 8601 UTC) and `session_absolute_expires_at`. The frontend uses these to start a countdown timer and show the warning banner when `time_remaining < warning_window_seconds`.

**Rationale**: The frontend has no other reliable way to know expiry times. Polling for session status would itself count as activity (defeating the inactivity mechanism). Embedding expiry times in the profile response is a single-call solution with no extra round-trip.

**Warning window**: Configurable via `SESSION_WARNING_SECONDS` env var (default: 300 = 5 minutes). Exposed in a new `GET /me/session-info` endpoint AND in the profile response.

---

## R6 — Redirect-After-Login (Post-Expiry Return to Original URL)

**Decision**: When the frontend detects a 401 (session expired), it saves `window.location.pathname + search` to `sessionStorage` as `redirectAfterLogin`. After successful login, the `Login` page reads this value, clears it, and navigates to the saved URL. Falls back to `/dashboard` if empty.

**Rationale**: `sessionStorage` is tab-scoped, survives navigation within the tab but not a new tab open. This is the correct scope: if the session expired in tab A, only tab A needs to redirect back. No server-side state needed.

---

## R7 — Database Schema Changes

**Decision**: Two new columns on `authentication_sessions`:
1. `last_active_at` — `TIMESTAMP NULL` — updated on each debounced DB write; NULL initially
2. `absolute_expires_at` — `TIMESTAMP NOT NULL` — set at session creation to `created_at + max_lifetime`

The existing `expires_at` column changes its **semantics** (not its name): it now represents the rolling inactivity deadline (reset on each touch), not the fixed creation-time TTL.

**Existing rows**: `absolute_expires_at` backfilled to `expires_at + 7 days` for rows without it (migration default). They continue to be valid until their original `expires_at` elapses.

---

## R8 — New Settings

| Setting | Env Var | Default | Description |
|---|---|---|---|
| `session_inactivity_timeout_seconds` | `SESSION_INACTIVITY_TIMEOUT` | `1800` (30 min) | Rolling inactivity window |
| `session_max_lifetime_seconds` | `SESSION_MAX_LIFETIME` | `28800` (8 hours) | Hard cap from login time |
| `session_warning_seconds` | `SESSION_WARNING_SECONDS` | `300` (5 min) | Warning lead time before expiry |
| `redis_url` | `REDIS_URL` | `redis://localhost:6379` | Redis connection string |

---

## R9 — Docker Compose Addition

**Decision**: Add `redis` service using `redis:7-alpine` image to `docker-compose.dev.yml`. No auth required for local dev. Backend depends on Redis health check.

```yaml
redis:
  image: redis:7-alpine
  ports: ["6379:6379"]
  healthcheck:
    test: ["CMD", "redis-cli", "ping"]
    interval: 5s
    timeout: 3s
    retries: 5
```

---

## R10 — Frontend Warning Component

**Decision**: A `SessionExpiryWarning` component subscribes to `AuthContext` which exposes the two expiry timestamps. The component uses `setInterval` (1-second tick) to update a countdown. It renders a dismissable banner at the top of the page. Two distinct messages:
- **Inactivity warning**: "Your session will expire in X minutes due to inactivity. Click anywhere to stay logged in."
- **Hard cap warning**: "Your session expires in X minutes and cannot be extended. Please save your work and log in again."

The component is mounted once inside `AppRoutes` (authenticated layout) — not rendered on the login/signup/landing pages.
