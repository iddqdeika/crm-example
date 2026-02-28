# API Contracts: Session Persistence & Inactivity Timeout

**Service**: Backend (FastAPI)
**Version**: 1.0.0
**Feature**: 005-session-persistence

---

## Modified: GET /me/profile

**Change**: Response now includes session expiry timestamps and warning window.

**Authentication**: Required (session cookie)

**Response (200 OK)**:
```json
{
  "id": "<profile-uuid>",
  "display_name": "Alice",
  "email": "alice@example.com",
  "avatar_url": "http://...",
  "role": "standard",
  "session_inactivity_expires_at": "2026-02-27T14:30:00Z",
  "session_absolute_expires_at": "2026-02-27T21:00:00Z",
  "session_warning_seconds": 300
}
```

**Notes**:
- `session_inactivity_expires_at`: ISO 8601 UTC. The rolling inactivity deadline; reset on each user action. Frontend uses this to start the expiry countdown.
- `session_absolute_expires_at`: ISO 8601 UTC. The hard cap; never changes for this session.
- `session_warning_seconds`: The configured warning window; frontend shows the banner when `time_remaining < session_warning_seconds`.
- All three fields are `null` when called without a valid session (but this endpoint returns 401 in that case, so they will always be present on 200).

**Response (401 Unauthorized)**:
```json
{ "detail": "Session expired or invalid" }
```

---

## New: POST /me/session/touch

Signal an explicit user interaction. Resets the inactivity deadline.

**Authentication**: Required (session cookie)

**Request**: No body. The presence of this call signals user activity.

**Responses**:

| Status | Condition | Body |
|---|---|---|
| 200 OK | Session is valid and touched | `{ "inactivity_expires_at": "2026-02-27T14:35:00Z" }` |
| 401 Unauthorized | Session expired or invalid | `{ "detail": "Session expired or invalid" }` |

**Notes**:
- Frontend calls this on navigation events, form submissions, and deliberate button clicks.
- Background requests (polling, auto-save) MUST NOT call this endpoint.
- If the session has already exceeded its absolute lifetime, returns 401 even if inactivity window has not elapsed.
- The returned `inactivity_expires_at` is the new deadline; frontend uses it to reset the countdown timer.

---

## Modified: POST /auth/logout

**Change**: Logout now evicts the session from Redis cache immediately, preventing any further requests using the revoked cookie.

No change to request/response shape:
- **Request**: No body
- **Response (200 OK)**: `{ "message": "Logged out" }` (or 204 — existing behaviour preserved)

---

## Frontend → Backend: `X-User-Action` header (internal convention)

Not a standalone endpoint, but a cross-cutting contract:

| Header | Value | When to send |
|---|---|---|
| `X-User-Action: true` | `"true"` | Navigation, form submission, deliberate button click |
| (absent) | — | Background requests: polling, auto-save, prefetch |

Backend middleware reads this header on every authenticated request. If present, `POST /me/session/touch` logic is triggered (Redis TTL refresh + debounced DB write).

**Alternative approach** (simpler): Frontend explicitly calls `POST /me/session/touch` rather than using a header. Both approaches are equivalent; the header approach reduces an extra round-trip but couples middleware to request inspection. The explicit endpoint approach is cleaner and easier to test. **Decision: use explicit `POST /me/session/touch`.**

---

## Frontend Route Guard Contract (`ProtectedRoute`)

Updated behaviour on 401 response from any authenticated API call:

1. Save `window.location.pathname + window.location.search` to `sessionStorage['redirectAfterLogin']`
2. Clear auth state (`user = null`, `profile = null`)
3. Navigate to `/login?reason=expired`

Updated behaviour on successful login when `redirectAfterLogin` is set:

1. Read and clear `sessionStorage['redirectAfterLogin']`
2. Navigate to the saved URL instead of `/dashboard`

**Query param `reason=expired`**: Causes the Login page to display: *"Your session expired due to inactivity. Please log in again."*

---

## `SessionCache` Internal Contract (`backend/src/core/session_cache.py`)

```python
class SessionCache(Protocol):
    async def get(self, session_id: UUID) -> SessionCacheEntry | None:
        """
        Returns cached session data or None on cache miss.
        Returns None (not raises) if Redis is unavailable — caller falls back to DB.
        """
        ...

    async def set(self, session: AuthenticationSession) -> None:
        """
        Writes session to cache with TTL = inactivity_timeout_seconds.
        Called on: login, DB cache-miss rehydration.
        """
        ...

    async def touch(self, session_id: UUID, new_inactivity_exp: datetime) -> bool:
        """
        Refreshes TTL and updates inactivity_exp.
        Returns True if key existed, False if key was missing (session evicted — treat as expired).
        """
        ...

    async def revoke(self, session_id: UUID) -> None:
        """
        Marks session as revoked and sets a short TTL (60s) for in-flight drain.
        """
        ...
```

```python
class SessionCacheEntry:
    user_id: UUID
    inactivity_exp: datetime
    absolute_exp: datetime
    is_revoked: bool
    last_db_sync: datetime | None
```
