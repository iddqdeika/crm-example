# Qualityboard

Adtech campaign management platform with authentication, user profiles, campaign CRUD, admin controls, and a public blog with content management. Built as a full-stack application with a FastAPI backend and React frontend, deployed via Docker Compose.

## Architecture

```
┌─────────────────┐       /api        ┌──────────────────┐      ┌─────────────────┐
│    Frontend     │ ───────────────►  │     Backend      │ ───► │   PostgreSQL 16 │
│  React + Vite   │ ◄──────────────── │     FastAPI      │      ├─────────────────┤
│  (Nginx)        │                   │   port 8000      │ ───► │   Redis 7       │
│  port 3000      │                   │                  │      ├─────────────────┤
└─────────────────┘                   │                  │ ───► │   MinIO         │
                                      │                  │      ├─────────────────┤
                                      │                  │ ───► │   Meilisearch   │
                                      └──────────────────┘      └─────────────────┘
```

### Backend (Python 3.12, FastAPI)

| Layer    | Location              | Purpose |
|----------|-----------------------|---------|
| Routes   | `backend/src/api/`    | HTTP handlers: auth, profile, campaign, column_config, admin, **blog** |
| Services | `backend/src/services/` | Business logic: auth, profile, avatar, campaign, ad groups, creatives, **blog**, **blog_search** |
| Models   | `backend/src/models/` | SQLAlchemy 2.x async ORM (users, sessions, profiles, campaigns, ad_groups, creatives, **blog_post**, **blog_slug_history**) |
| Schemas  | `backend/src/schemas/`| Pydantic request/response validation |
| Core     | `backend/src/core/`   | DB engine, settings, session cache, S3 storage, logging, **slug** |

All API routes are mounted under the `/api` prefix. Alembic manages database migrations.

### Frontend (React 18, TypeScript, Vite)

| Area       | Location                | Purpose |
|------------|-------------------------|---------|
| Pages      | `frontend/src/pages/`   | Landing, SignUp, Login, Dashboard, Profile, Campaigns, CampaignNewPage, CampaignEditPage, Admin, **BlogPage**, **BlogPostPage**, **BlogManagePage**, **BlogManageEditPage** |
| Components | `frontend/src/components/` | AppHeader, SessionExpiryWarning, LoginForm, SignUpForm, AvatarUpload, ColumnSetupPopup, **BlogAuthLinks**, **BlogPostCard**, **RichTextEditor**, **RichTextRenderer**, **AdGroupsSection**, PasswordChangeForm |
| Contexts   | `frontend/src/contexts/` | AuthContext / AuthProvider for user state |
| API client | `frontend/src/services/api.ts` | Typed fetch wrappers for all backend endpoints |
| Utils      | `frontend/src/utils/`  | **slug** (blog URL slug handling) |

React Router v6 handles client-side routing. Route protection: **ProtectedRoute** (any logged-in user), **AdminRoute** (admin only), **ContentManagerRoute** (content_manager or admin), **CampaignRoute** (admin or buyer; content_manager redirected). Nginx serves the SPA in production and proxies `/api/` to the backend.

### Infrastructure

| Service       | Role |
|---------------|------|
| **PostgreSQL 16** | Primary data store (users, sessions, profiles, campaigns, ad groups, creatives, **blog_posts**, **blog_slug_history**) |
| **Redis 7**   | Session cache with TTL-based expiry |
| **MinIO**     | S3-compatible object storage for avatars and media |
| **Meilisearch** | Full-text search index for blog posts (rebuilt on backend startup) |

### Docker Compose Stacks

| File                        | Project name      | Purpose |
|-----------------------------|-------------------|---------|
| `docker/docker-compose.dev.yml`  | `qualityboard-dev`  | Local development (all services, exposed ports) |
| `docker/docker-compose.e2e.yml`  | `qualityboard-e2e`  | E2E test environment (isolated DB, auto-seeded admin, data cleanup on startup) |
| `docker/docker-compose.prod.yml` | —                  | Production deployment |

Dev and E2E stacks use separate Docker project names and named volumes, so E2E test runs never affect local development data.

## Testing

### Backend Tests (pytest)

```bash
cd backend && pytest
```

| Type     | Location                  | Coverage |
|----------|---------------------------|----------|
| Unit     | `backend/tests/unit/`     | auth_service, session_cache, avatar, campaign, ad_group, creative, **blog_service**, **blog_search_service**, **slug** |
| Contract | `backend/tests/contract/` | auth, profile, avatar, session, campaign, column_config, admin, **blog** |
| Integration | `backend/tests/integration/` | auth flows, profile flows, admin flows |

Uses pytest-asyncio with httpx `AsyncClient` and an in-memory SQLite database for fast isolated execution.

### Frontend Tests (Vitest)

```bash
cd frontend && npm run test
```

Component and page tests using Vitest + React Testing Library with jsdom. Test files live alongside source as `*.test.tsx` (and `AppHeader.blog.test.tsx`, `AppHeader.buyer.test.tsx`).

### E2E Tests (Playwright)

```bash
cd frontend
npm run e2e:up       # start isolated Docker stack
npm run e2e:test     # run Playwright scenarios
npm run e2e:down     # tear down stack
```

| Spec                       | Scenarios |
|----------------------------|-----------|
| `01-registration-profile`  | Signup, profile display, duplicate email handling |
| `02-campaign-create-list`  | Campaign creation, listing verification, empty-name guard |
| `03-login-logout-session`  | Login, logout, session expiry, wrong password, auth redirect |
| `04-admin-user-management` | Admin user list, role assignment, non-admin redirect |
| `05-campaign-edit-archive`  | Edit campaign, archive, view-only archived state |
| `06-design-compliance`     | CSS design token assertions across all pages |
| `07-blog-section`          | Blog listing, post page, auth links, redirect-after-login, content manager flows |

E2E tests run against a fully containerised stack with an auto-seeded admin user. The stack resets the database, Redis, and MinIO on every startup to ensure test isolation.

## Quick Start

### Prerequisites

- Docker & Docker Compose
- Node.js 20+
- Python 3.12+

### Run with Docker (development)

```bash
docker compose -f docker/docker-compose.dev.yml up --build
```

- Frontend: http://localhost:3000
- Backend API: http://localhost:8000/api/docs
- MinIO console: http://localhost:9001
- Meilisearch: http://localhost:7700

### Run locally (without Docker)

```bash
# Backend (requires Postgres, Redis, MinIO, Meilisearch)
cd backend
pip install -e .
alembic upgrade head
uvicorn app.main:app --reload --port 8000

# Frontend
cd frontend
npm install
npm run dev
```

## Feature Specs

Detailed specifications live in `specs/`, each with spec, plan, tasks, and quickstart where applicable:

| Spec  | Feature |
|-------|---------|
| `001-adtech-auth-profile` | Auth, profile, landing page |
| `002-ui-design-landing`   | Landing page UI |
| `003-fix-ui-design-pages` | UI design fixes across pages |
| `004-media-persistence`  | Avatar and media storage (MinIO) |
| `005-session-persistence`| Redis-backed session handling |
| `006-campaign-management`| Campaign CRUD, ad groups, creatives |
| `007-separate-api-routes` | `/api` prefix for all backend routes |
| `008-playwright-ui-tests`| Playwright E2E test suite |
| `009-campaign-ui-design`  | Campaign UI design and column setup |
| `010-creation-ad-groups` | Campaign creation with ad groups |
| `011-blog-section`       | Blog backend and frontend (listing, post, manage) |
| `012-blog-seo-slugs`     | SEO-friendly slugs and search (Meilisearch) |
| `013-blog-auth-links`    | Log in / Register links on blog and redirect-after-auth |
| `014-landing-auth-blog-nav` | Sign in/Sign up on landing, Blog in nav, Manage posts rename |

## Design

The UI follows an **editorial-industrial** aesthetic defined in [`docs/design.md`](design.md): dark canvas with vivid accents, Syne + Outfit typography, and strict design tokens for colors, spacing, and type scale.

## Governance

Development workflow and quality gates are defined in [`.specify/memory/constitution.md`](../.specify/memory/constitution.md) (testability first, TDD, Red-Green-Refactor, microservices by design, Docker-first delivery).
