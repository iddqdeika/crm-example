# Implementation Plan: Dashboard Role-Based Counts

**Branch**: `016-dashboard-role-counts` | **Date**: 2026-02-26 | **Spec**: [spec.md](spec.md)  
**Input**: Feature specification from `specs/016-dashboard-role-counts/spec.md`

## Summary

Add role-based summary counts to the dashboard: buyers see campaigns count; content managers see draft and published posts counts; admins see campaigns, draft posts, published posts, and user count. Each user has a single role. Implementation: new backend endpoint (e.g. GET /api/dashboard/counts) returning only the counts appropriate to the current user’s role; frontend Dashboard page fetches and displays these counts with loading and error states. No new data model entities; reuse existing Campaign, BlogPost, and User with existing permission rules.

## Technical Context

**Language/Version**: Python 3.12+ (backend), TypeScript / React 18 (frontend)  
**Primary Dependencies**: FastAPI, SQLAlchemy 2.x (backend); React, existing AuthContext and API client (frontend)  
**Storage**: Existing PostgreSQL (Campaign, BlogPost, User); no new tables  
**Testing**: pytest (backend unit/contract), Vitest + React Testing Library (frontend); optional Playwright E2E  
**Target Platform**: Same as existing app (Docker Compose dev/e2e/prod)  
**Project Type**: Web application (backend + frontend)  
**Performance Goals**: Dashboard counts visible within 3 seconds (per spec SC-001–SC-003)  
**Constraints**: Counts must respect existing permissions (buyer: own campaigns; admin: system-wide for campaigns/posts/users)  
**Scale/Scope**: One dashboard endpoint; one Dashboard page update; role-based response shape

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

| Gate | Status | Notes |
|------|--------|--------|
| **TDD — tests identified before coding** | ✅ PASS | Tests: (1) Backend: dashboard counts endpoint returns correct shape per role (buyer/content_manager/admin) and correct counts; (2) Frontend: Dashboard shows role-appropriate count widgets, loading and error states. Unit/contract tests first; then implementation. |
| **Service boundaries and data ownership** | ✅ PASS | Dashboard counts are a new endpoint under existing API; it uses existing campaign, blog, and user data with existing service/layer logic. No cross-service violation. |
| **Docker images and delivery** | ✅ PASS | No new containers; backend and frontend images built as usual. |
| **Deviations from constitution** | ✅ NONE | No violations. |

*Post–Phase 1 re-check*: Contracts and data-model docs align with TDD and existing structure. ✅ PASS

## Project Structure

### Documentation (this feature)

```text
specs/016-dashboard-role-counts/
├── plan.md              # This file
├── research.md          # Phase 0 — API shape, scope rules
├── data-model.md        # Phase 1 — no new entities; count sources
├── quickstart.md        # Phase 1 — run and verify
├── contracts/           # Phase 1 — GET dashboard counts
└── tasks.md             # Phase 2 (/speckit.tasks)
```

### Source Code (repository root)

```text
backend/
├── src/
│   ├── api/
│   │   └── dashboard.py         NEW — GET /dashboard/counts (or under profile); role-based counts
│   ├── schemas/
│   │   └── dashboard.py         NEW — DashboardCountsResponse (campaigns?, drafts?, published?, users?)
│   └── services/
│       └── dashboard_service.py NEW — aggregate counts using campaign_service, blog_service, admin/count
frontend/
├── src/
│   ├── pages/
│   │   └── Dashboard.tsx        MODIFIED — fetch counts, render role-based widgets (campaigns, drafts, published, users)
│   ├── services/
│   │   └── api.ts               MODIFIED — add getDashboardCounts()
│   └── (styles)
│       └── Dashboard.css       MODIFIED — styles for count widgets/cards
```

**Structure Decision**: Backend adds a dedicated dashboard module (api + schema + service) to keep counts logic and permissions in one place. Frontend extends the existing Dashboard page and API client. No new routes; dashboard remains /dashboard.

## Complexity Tracking

| Violation | Why Needed | Simpler Alternative Rejected Because |
|-----------|------------|-------------------------------------|
| *(none)* | — | — |
