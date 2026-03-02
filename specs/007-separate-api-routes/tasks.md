# Tasks: Separate API Routes from Page Routes

**Input**: Design documents from `/specs/007-separate-api-routes/`
**Branch**: `007-separate-api-routes`
**Prerequisites**: plan.md ✅ spec.md ✅ research.md ✅ data-model.md ✅ contracts/ ✅ quickstart.md ✅

**Tests**: TDD is MANDATORY (constitution). Backend test paths are updated first (red), then backend routes change (green). Frontend API_BASE change and proxy updates happen together.

**Organization**: Both user stories (US1 + US2) are P1 and tightly coupled — they are different perspectives of the same routing change. Tasks are organized by layer (backend → tests → frontend → proxy → Docker) rather than by story, since every task serves both stories simultaneously.

---

## Phase 1: Backend — Add `/api` Prefix

**Purpose**: Move all backend endpoints under `/api` at the FastAPI app level.

- [x] T001 [P] [US1] [US2] Add `/api` root prefix to FastAPI app by wrapping all routers under a parent `APIRouter(prefix="/api")` in `backend/src/app/main.py`; move `/health` endpoint under the parent router; set `docs_url="/api/docs"` and `openapi_url="/api/openapi.json"` on the FastAPI app

**Checkpoint**: Backend now serves all endpoints under `/api/...`. Existing tests will fail (expected — red phase).

---

## Phase 2: Backend Tests — Update All Paths to `/api`

**Purpose**: Update every backend test file to use `/api`-prefixed paths so tests pass against the new routes.

- [x] T002 [P] [US2] Update all API paths in `backend/tests/contract/test_auth_api.py` to use `/api/auth/...` prefix
- [x] T003 [P] [US2] Update all API paths in `backend/tests/contract/test_profile_api.py` to use `/api/me/...` prefix
- [x] T004 [P] [US2] Update all API paths in `backend/tests/contract/test_profile_update_api.py` to use `/api/me/...` prefix
- [x] T005 [P] [US2] Update all API paths in `backend/tests/contract/test_avatar_api.py` to use `/api/me/...` prefix
- [x] T006 [P] [US2] Update all API paths in `backend/tests/contract/test_session_api.py` to use `/api/me/...` prefix
- [x] T007 [P] [US2] Update all API paths in `backend/tests/contract/test_admin_api.py` to use `/api/admin/...` and `/api/auth/...` prefix
- [x] T008 [P] [US2] Update all API paths in `backend/tests/contract/test_campaign_api.py` to use `/api/campaigns/...` and `/api/auth/...` prefix
- [x] T009 [P] [US2] Update all API paths in `backend/tests/contract/test_column_config_api.py` to use `/api/me/column-config/...` and `/api/auth/...` prefix
- [x] T010 [P] [US2] Update all API paths in `backend/tests/integration/test_auth_flow.py` to use `/api/auth/...` prefix
- [x] T011 [P] [US2] Update all API paths in `backend/tests/integration/test_profile_flow.py` to use `/api/me/...` and `/api/auth/...` prefix
- [x] T012 [P] [US2] Update all API paths in `backend/tests/integration/test_profile_update_flow.py` to use `/api/me/...` and `/api/auth/...` prefix
- [x] T013 [P] [US2] Update all API paths in `backend/tests/integration/test_admin_flow.py` to use `/api/admin/...` and `/api/auth/...` prefix
- [x] T014 [US2] Run full backend test suite (`pytest backend/tests/ -v`); all 84 tests must pass

**Checkpoint**: All 84 backend tests pass with `/api` prefix (green phase).

---

## Phase 3: Frontend — Update API Base and Proxy Configs

**Purpose**: Point the frontend at the new `/api` prefix and simplify proxy routing so page routes no longer collide with API routes.

- [x] T015 [P] [US1] [US2] Change `API_BASE` from `""` to `"/api"` in `frontend/src/services/api.ts`
- [x] T016 [P] [US1] Replace all per-path proxy entries with a single `"/api": "http://localhost:8000"` rule in `frontend/vite.config.ts`
- [x] T017 [P] [US1] Replace all per-path location blocks with a single `location /api/` proxy block in `frontend/nginx.conf`; keep `location /` with `try_files $uri $uri/ /index.html` as SPA fallback; keep `/docs` and `/openapi.json` proxying under `/api/`
- [x] T018 [US1] [US2] Run full frontend test suite (`npx vitest run`); all 55 tests must pass

**Checkpoint**: Frontend calls `/api/...` for all API requests. Page routes (`/campaigns`, `/admin`, etc.) are no longer intercepted by the proxy and fall through to SPA `index.html`.

---

## Phase 4: Docker — Update Health Checks

**Purpose**: Update Docker Compose health check URLs so container orchestration uses the new endpoint path.

- [x] T019 [P] Update backend health check URL from `http://localhost:8000/health` to `http://localhost:8000/api/health` in `docker/docker-compose.dev.yml`
- [x] T020 [P] Update backend health check URL from `http://localhost:8000/health` to `http://localhost:8000/api/health` in `docker/docker-compose.prod.yml`

**Checkpoint**: Docker health checks point to `/api/health`.

---

## Phase 5: Polish & Verification

**Purpose**: Full regression testing and quickstart validation.

- [x] T021 Run full backend test suite: `pytest backend/tests/ -v`; confirm 84 passed
- [x] T022 Run full frontend test suite: `npx vitest run`; confirm 55 passed
- [x] T023 Run quickstart.md verification checklist (page refresh test, API functionality test, docs test, Docker health check)

---

## Dependencies & Execution Order

### Phase Dependencies

- **Phase 1** (Backend prefix): No dependencies — start immediately
- **Phase 2** (Backend tests): Depends on Phase 1
- **Phase 3** (Frontend + proxies): Can start after Phase 1 (independent of Phase 2 test updates)
- **Phase 4** (Docker): Can start after Phase 1 (independent of Phases 2–3)
- **Phase 5** (Verification): Depends on all previous phases

### User Story Dependencies

- **US1** (Page refresh serves HTML) and **US2** (API continues working) are satisfied simultaneously by the same routing change — they are two sides of the same coin.

### Parallel Opportunities

- T002–T013 (all backend test file updates) can run in parallel
- T015, T016, T017 (frontend API_BASE, Vite config, Nginx config) can run in parallel
- T019, T020 (Docker compose files) can run in parallel
- Phase 3 and Phase 4 can run in parallel with Phase 2

---

## Implementation Strategy

### All-at-Once (Recommended for This Feature)

This is a small, tightly-coupled change (~15 files). The recommended approach is:

1. Phase 1: Add `/api` prefix to backend (1 file)
2. Phase 2: Update all backend tests (12 files) → run and confirm green
3. Phase 3: Update frontend API_BASE + proxies (3 files) → run and confirm green
4. Phase 4: Update Docker health checks (2 files)
5. Phase 5: Full verification

Total: ~18 file modifications, zero new files, zero data model changes.

---

## Notes

- All tasks use format `- [ ] Tnnn [P?] [USn?] Description with file path`.
- Both user stories are P1 and satisfied by the same set of changes.
- No data model or migration changes required.
- Backend test path updates are mechanical: prefix every API path string with `/api`.
