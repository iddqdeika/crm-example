# Research: Separate API Routes from Page Routes

## Decision: API Prefix Strategy

**Decision**: Add `/api` prefix at the FastAPI application level using `root_path` or a top-level `APIRouter` with `prefix="/api"`, so all backend endpoints are natively under `/api/...`.

**Rationale**: Adding the prefix at the backend level (not the proxy layer) means:
- The backend is self-describing — its OpenAPI/Swagger docs show `/api/...` paths.
- Health checks and all endpoints consistently live under `/api/`.
- Proxy configuration becomes a single rule (`/api → backend`) instead of many per-path rules.
- Contract tests remain valid because they hit the backend directly.

**Alternatives considered**:
1. *Proxy-level rewrite only*: Nginx/Vite add `/api` prefix and strip it before forwarding to backend. Rejected — backend stays unaware of its public paths, OpenAPI docs show wrong paths, and two layers of routing logic must stay in sync.
2. *Individual router prefix changes*: Change each router from `/auth` to `/api/auth`, etc. Rejected — more files to touch, easy to miss one, no single source of truth.

## Decision: Health Check Path

**Decision**: Health check moves to `/api/health` (backend-internal path becomes `/health` under the `/api` root). Docker health checks must be updated to call `http://localhost:8000/api/health`.

**Rationale**: Keeping health under the same prefix is consistent and avoids a special case. Docker health checks call the backend container directly (not through Nginx), so updating the URL in `docker-compose.*.yml` is sufficient.

## Decision: Frontend API_BASE Constant

**Decision**: Change `API_BASE` in `frontend/src/services/api.ts` from `""` to `"/api"`. All existing `request("/auth/login", ...)` calls automatically become `/api/auth/login` without changing each callsite.

**Rationale**: Single constant change, minimal diff, zero risk of missing a callsite. The `fetch` already uses `${API_BASE}${path}`, so this is the designed extension point.

## Decision: Proxy Configuration (Vite + Nginx)

**Decision**: Replace all per-path proxy rules with a single `/api` rule in both Vite and Nginx configs.

**Rationale**: Eliminates the root cause — no more per-path collision between SPA routes and API routes. Nginx's `location /` with `try_files $uri $uri/ /index.html` handles all SPA routes correctly as a fallback.

## Decision: Test Updates

**Decision**: Backend contract tests do not need path changes — they use `AsyncClient` against the ASGI app which resolves routes from the app's router tree (now under `/api`). The `base_url` in conftest is `http://test` and paths in tests like `"/auth/login"` need to become `"/api/auth/login"`.

**Rationale**: The tests call the app directly, so they must use the app's actual routes. All test paths need the `/api` prefix.
