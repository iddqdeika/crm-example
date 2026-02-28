# Data Model: Session Persistence & Inactivity Timeout

**Feature**: 005-session-persistence
**Date**: 2026-02-27

---

## Modified DB Entity: `AuthenticationSession`

Table: `authentication_sessions`

| Column | Type | Nullable | Change | Description |
|---|---|---|---|---|
| `id` | UUID PK | NO | unchanged | Session identifier (also Redis key suffix) |
| `user_id` | UUID FK → users.id | NO | unchanged | Owner of the session |
| `created_at` | TIMESTAMP | NO | unchanged | Login time; used to compute `absolute_expires_at` |
| `expires_at` | TIMESTAMP | NO | **semantics changed** | Now: rolling inactivity deadline. Reset to `now + inactivity_timeout` on each touch. Was: fixed TTL from creation. |
| `absolute_expires_at` | TIMESTAMP | NO | **NEW column** | Hard cap: `created_at + max_lifetime`. Never changes after creation. |
| `last_active_at` | TIMESTAMP | YES | **NEW column** | Last time a DB write was flushed for this session. Used for debounced DB writes. NULL = never touched since creation. |
| `revoked_at` | TIMESTAMP | YES | unchanged | Set on explicit logout. |
| `ip_address` | VARCHAR(45) | YES | unchanged | |
| `user_agent` | VARCHAR(512) | YES | unchanged | |

### State Transitions

```
[Created]
    │  expires_at = now + inactivity_timeout
    │  absolute_expires_at = now + max_lifetime
    │  last_active_at = NULL
    ▼
[Active]  ──── touch() ────►  [Active]
    │                          expires_at = min(now + inactivity_timeout, absolute_expires_at)
    │                          last_active_at = now (debounced)
    │
    ├── expires_at <= now  ──► [Inactivity Expired]
    ├── absolute_expires_at <= now  ──► [Hard Cap Expired]
    └── revoke()  ──► [Revoked]
```

---

## Alembic Migration

**File**: `backend/migrations/versions/YYYYMMDD_002_session_activity_columns.py`

Changes:
1. `ADD COLUMN absolute_expires_at TIMESTAMP NOT NULL DEFAULT (NOW() + INTERVAL '8 hours')` — backfills existing rows with 8-hour window from migration time
2. `ADD COLUMN last_active_at TIMESTAMP NULL`
3. `CREATE INDEX ix_authentication_sessions_expires_at ON authentication_sessions(expires_at)` (if not exists)
4. `CREATE INDEX ix_authentication_sessions_absolute_expires_at ON authentication_sessions(absolute_expires_at)`

---

## Redis Data Structures

### Session Cache

**Key pattern**: `session:{session_id_uuid}`
**Type**: Redis Hash
**TTL**: `SESSION_INACTIVITY_TIMEOUT` seconds (auto-refreshed on touch)

| Hash Field | Value | Description |
|---|---|---|
| `user_id` | UUID string | Session owner |
| `inactivity_exp` | Unix timestamp (int) | Current inactivity deadline |
| `absolute_exp` | Unix timestamp (int) | Hard cap; never changes |
| `is_revoked` | `"0"` or `"1"` | Revocation flag |
| `last_db_sync` | Unix timestamp (int) | Last time DB was updated; used for debounce |

**Write operations**:
- `HSET session:{id} ... ; EXPIRE session:{id} {inactivity_timeout}` — on session creation
- `HSET session:{id} inactivity_exp {new_exp} last_db_sync {now} ; EXPIRE session:{id} {inactivity_timeout}` — on touch
- `HSET session:{id} is_revoked 1 ; EXPIRE session:{id} 60` — on revoke (short TTL to let in-flight requests drain)

**Read operation**: `HGETALL session:{id}` — O(1), sub-millisecond

---

## New Settings Fields (`backend/src/core/settings.py`)

| Field | Env Var | Default | Type |
|---|---|---|---|
| `session_inactivity_timeout_seconds` | `SESSION_INACTIVITY_TIMEOUT` | `1800` | `int` |
| `session_max_lifetime_seconds` | `SESSION_MAX_LIFETIME` | `28800` | `int` |
| `session_warning_seconds` | `SESSION_WARNING_SECONDS` | `300` | `int` |
| `redis_url` | `REDIS_URL` | `redis://localhost:6379` | `str` |

---

## New Backend Service: `SessionCacheService` (`backend/src/core/session_cache.py`)

Abstracts all Redis operations for sessions. Injected via FastAPI dependency.

```python
class SessionCache(Protocol):
    async def get(self, session_id: UUID) -> dict | None: ...
    async def set(self, session: AuthenticationSession) -> None: ...
    async def touch(self, session_id: UUID, new_inactivity_exp: datetime) -> None: ...
    async def revoke(self, session_id: UUID) -> None: ...

class RedisSessionCache:
    """Concrete implementation backed by Redis."""

class FakeSessionCache:
    """In-memory dict for tests. No Redis connection required."""
```

---

## Frontend State Changes (`frontend/src/contexts/AuthContext.tsx`)

**New fields added to `AuthContextValue`**:

| Field | Type | Description |
|---|---|---|
| `sessionInactivityExpiresAt` | `Date \| null` | Rolling inactivity deadline from server |
| `sessionAbsoluteExpiresAt` | `Date \| null` | Hard cap from server |
| `touchSession` | `() => void` | Called by frontend on user interaction; sends `X-User-Action: true` |

**Mount behaviour change**:
- `useEffect` on mount calls `GET /me/profile`
- On 200: set `user`, `profile`, and session expiry timestamps from response
- On 401: clear state, `loading = false`

---

## New Frontend Component: `SessionExpiryWarning`

**File**: `frontend/src/components/SessionExpiryWarning.tsx`

Renders a dismissable banner when `time_to_expiry < warning_window`:
- Inactivity warning (extendable): warns user to interact
- Hard cap warning (non-extendable): warns user to save work

---

## `ProfileResponse` Schema (`backend/src/schemas/profile.py`)

**New fields**:

| Field | Type | Description |
|---|---|---|
| `session_inactivity_expires_at` | `datetime \| None` | Inactivity deadline for the current session |
| `session_absolute_expires_at` | `datetime \| None` | Hard cap for the current session |
| `session_warning_seconds` | `int` | Configured warning window (for frontend countdown) |
