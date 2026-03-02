# Implementation Plan: Separate API Routes from Page Routes

**Branch**: `007-separate-api-routes` | **Date**: 2026-02-26 | **Spec**: [spec.md](spec.md)
**Input**: Feature specification from `/specs/007-separate-api-routes/spec.md`

## Summary

Browser refresh on SPA routes (e.g., `/campaigns`) returns JSON from the backend API instead of HTML because frontend page routes and backend API routes share the same paths. The fix adds an `/api` prefix to all backend endpoints at the FastAPI application level, updates the frontend `API_BASE` constant, simplifies proxy configs to a single `/api` rule, and updates Docker health checks. All existing tests are updated to use the new paths.

## Technical Context

**Language/Version**: Python 3.13 (backend), TypeScript (frontend)
**Primary Dependencies**: FastAPI, React, Vite, Nginx
**Storage**: PostgreSQL (unchanged)
**Testing**: pytest + pytest-asyncio (backend), Vitest (frontend)
**Target Platform**: Docker (Linux containers), Windows dev
**Project Type**: Web application (SPA + API)
**Performance Goals**: N/A (routing change only)
**Constraints**: Zero functional regression — all 84 backend + 55 frontend tests must pass
**Scale/Scope**: ~15 files modified; no new features, no data model changes

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

- **TDD**: Tests will be written/updated first (failing under new `/api` prefix), then implementation applied to make them pass. Backend contract tests updated to `/api/...` paths before backend routes change. Frontend tests updated alongside API_BASE change.
- **Service boundaries**: Two existing services (backend, frontend) with a clear HTTP contract between them. The contract changes from bare paths to `/api`-prefixed paths. Documented in `contracts/routing.md`.
- **Docker**: Both services already build as Docker images. Health check URL updated in `docker-compose.*.yml`. Same images, new config.
- **No deviations**: No constitution violations. Straightforward routing refactor.

## Project Structure

### Documentation (this feature)

```text
specs/007-separate-api-routes/
├── plan.md              # This file
├── research.md          # Phase 0: routing strategy decisions
├── data-model.md        # Phase 1: no data changes
├── quickstart.md        # Phase 1: verification checklist
├── contracts/
│   └── routing.md       # Phase 1: before/after route mapping
└── tasks.md             # Phase 2 output (via /speckit.tasks)
```

### Source Code (files to modify)

```text
backend/
├── src/
│   └── app/
│       └── main.py              # Add /api prefix to FastAPI app
└── docker-compose health check paths

frontend/
├── src/
│   └── services/
│       └── api.ts               # Change API_BASE to "/api"
├── vite.config.ts               # Single /api proxy rule
└── nginx.conf                   # Single /api location block

docker/
├── docker-compose.dev.yml       # Health check: /api/health
└── docker-compose.prod.yml      # Health check: /api/health

backend/tests/                   # All test paths: add /api prefix
├── contract/*.py
├── integration/*.py
```

**Structure Decision**: Existing web application structure (backend + frontend). No new directories or files created. Only modifications to existing files.

## Implementation Approach

### Step 1: Backend — Add `/api` root prefix

In `backend/src/app/main.py`, wrap all routers under an `APIRouter(prefix="/api")` parent router. The `/health` endpoint also moves under this parent. FastAPI's `docs_url` and `openapi_url` are set to `/api/docs` and `/api/openapi.json`.

### Step 2: Backend tests — Update all paths

Every test that calls `client.post("/auth/login", ...)`, `client.get("/campaigns", ...)`, etc. must prefix with `/api`. This is a mechanical find-and-replace across all test files.

### Step 3: Frontend — Change `API_BASE`

In `frontend/src/services/api.ts`, change `const API_BASE = ""` to `const API_BASE = "/api"`. All existing `request("/auth/login", ...)` calls automatically become `/api/auth/login`.

### Step 4: Proxy configs — Simplify to single rule

**Vite** (`vite.config.ts`): Replace all per-path proxy entries with a single `"/api": "http://localhost:8000"`.

**Nginx** (`nginx.conf`): Replace all per-path location blocks with a single `location /api/` block. Keep `location /` with `try_files` as the SPA fallback.

### Step 5: Docker health checks

Update `docker-compose.dev.yml` and `docker-compose.prod.yml` to use `http://localhost:8000/api/health`.

### Step 6: Verify

Run full backend test suite (84 tests), full frontend test suite (55 tests), and quickstart manual verification.

## Complexity Tracking

No constitution violations. No complexity entries needed.
