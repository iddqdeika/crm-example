# Implementation Plan: Blog Section

**Branch**: `011-blog-section` | **Date**: 2026-03-02 | **Spec**: [spec.md](spec.md)  
**Input**: Feature specification from `specs/011-blog-section/spec.md`

---

## Summary

Add a public-facing blog to Qualityboard: a landing page blog preview section, a dedicated `/blog` page with "Latest" section and live debounced fulltext search (powered by Meilisearch), and individual post reading pages — all accessible without authentication. Content is authored by `content-manager` users (and admins) through a protected management interface featuring a TipTap WYSIWYG editor with live preview and image upload. A new `content-manager` role is added to the system. A Meilisearch Docker service is added as a search index, kept in sync on every post write.

---

## Technical Context

**Language/Version**: Python 3.13 (backend), TypeScript / React 18 (frontend)  
**Primary Dependencies**: FastAPI 0.115, SQLAlchemy 2.0 async, Alembic, TipTap (React WYSIWYG editor), `meilisearch` Python client  
**Storage**: PostgreSQL 16 (primary), MinIO (image uploads), Meilisearch v1.x (search index)  
**Testing**: pytest-asyncio (backend), Vitest + @testing-library/react (frontend), Playwright (E2E)  
**Target Platform**: Docker Compose (dev + E2E + prod)  
**Performance Goals**: Public blog search returns highlighted results within 2 seconds for ≤500 posts (SC-003)  
**Constraints**: Unauthenticated read access to blog APIs; management APIs require `content-manager` or `admin` role  
**Scale/Scope**: ~500 posts initial; Meilisearch index rebuild in <5 seconds at this scale

---

## Constitution Check

| Gate | Status | Notes |
|------|--------|-------|
| **TDD — tests identified before coding** | ✅ PASS | Tests specified per user story below; failing tests written first for each behavior |
| **Service boundaries and data ownership** | ✅ PASS | PostgreSQL owns blog post records; Meilisearch is a derived read index; blog service owns both; no cross-service DB access |
| **Docker images and delivery** | ✅ PASS | Meilisearch added to all docker-compose files; backend/frontend images unchanged; same image promoted across envs |
| **Deviations from constitution** | ✅ NONE | No violations; `get_optional_user` is a minor auth pattern extension, not a deviation |

---

## Project Structure

### Documentation (this feature)

```text
specs/011-blog-section/
├── plan.md              ← this file
├── research.md          ← Phase 0 (complete)
├── data-model.md        ← Phase 1 (this run)
├── quickstart.md        ← Phase 1 (this run)
├── contracts/
│   ├── get-blog-posts.md
│   ├── post-blog-post.md
│   ├── patch-blog-post.md
│   ├── delete-blog-post.md
│   └── post-blog-image.md
└── tasks.md             ← Phase 2 (/speckit.tasks)
```

### Source Code

```text
backend/
├── src/
│   ├── models/
│   │   ├── blog_post.py          NEW — BlogPost SQLAlchemy model
│   │   ├── user.py               MODIFIED — add content_manager to UserRole enum
│   │   └── __init__.py           MODIFIED — import BlogPost
│   ├── schemas/
│   │   └── blog.py               NEW — BlogPostCreate/Update/Response/ListResponse schemas
│   ├── services/
│   │   ├── blog_service.py       NEW — CRUD operations (PostgreSQL)
│   │   └── blog_search_service.py NEW — Meilisearch index sync + search
│   ├── api/
│   │   └── blog.py               NEW — APIRouter prefix=/blog
│   ├── core/
│   │   └── auth.py               MODIFIED — add get_optional_user dependency
│   ├── scripts/
│   │   └── rebuild_search_index.py NEW — CLI script to rebuild Meilisearch index from DB
│   └── app/
│       └── main.py               MODIFIED — register blog_router
│
└── migrations/
    └── versions/
        └── 20260302_001_blog_posts.py    NEW — create blog_posts table + add content_manager role

frontend/
├── src/
│   ├── pages/
│   │   ├── BlogPage.tsx           NEW — public /blog (Latest + search)
│   │   ├── BlogPage.css           NEW
│   │   ├── BlogPostPage.tsx       NEW — public /blog/:id (post reading)
│   │   ├── BlogPostPage.css       NEW
│   │   ├── BlogManagePage.tsx     NEW — protected /blog/manage (post list)
│   │   ├── BlogManagePage.css     NEW
│   │   ├── BlogManageEditPage.tsx NEW — protected /blog/manage/new and /blog/manage/:id
│   │   ├── BlogManageEditPage.css NEW
│   │   └── Landing.tsx            MODIFIED — add blog preview section
│   ├── components/
│   │   ├── BlogPostCard.tsx        NEW — card used on Landing + BlogPage
│   │   ├── RichTextEditor.tsx      NEW — TipTap editor wrapper (authoring)
│   │   └── RichTextRenderer.tsx    NEW — read-only HTML renderer (public display + preview)
│   ├── services/
│   │   └── api.ts                  MODIFIED — add blogApi, blogImageApi types + methods
│   └── App.tsx                     MODIFIED — add /blog, /blog/:id, /blog/manage, /blog/manage/new, /blog/manage/:id routes + ContentManagerRoute guard

docker/
├── docker-compose.dev.yml         MODIFIED — add meilisearch service
├── docker-compose.e2e.yml         MODIFIED — add meilisearch service
└── docker-compose.prod.yml        MODIFIED — add meilisearch service

frontend/
└── e2e/
    └── 07-blog-section.spec.ts    NEW — 8 E2E scenarios (E35–E42)
```

---

## Phase 0: Research Summary

See [research.md](research.md) for full details. Key decisions:

| Decision | Choice | Rationale |
|----------|--------|-----------|
| Fulltext search service | **Meilisearch v1.x** | Lightweight Docker, built-in highlighting, MIT license, Python client |
| Rich-text editor | **TipTap** (headless) | No default styles, React-native, image extension, MIT license |
| Post URL scheme | **UUID** (`/blog/{uuid}`) | Consistent with campaigns; no slug complexity |
| Public API auth | **`get_optional_user`** | Returns `User \| None`; no 401 for public endpoints |
| Search in management list | **PostgreSQL ILIKE** | Internal only; no highlighting needed |
| Image storage | **MinIO via existing `core/storage.py`** | Reuses infrastructure; `blog-images/` key prefix |
| Edit/delete permissions | **Any content-manager or admin** | CMS model; no per-author restriction |
| Index rebuild | **On-demand script** | Adequate at 500-post scale; no background job complexity |

---

## Phase 1: Design

### 1. Data Model

See [data-model.md](data-model.md) for the full schema.

**New table**: `blog_posts`  
**Modified enum**: `userrole` gains `content_manager` value  
**Meilisearch index**: `blog_posts` index (separate document schema, see data-model.md)

### 2. API Design

All endpoints under `GET/POST/PATCH/DELETE /api/blog/...`  

| Method | Path | Auth | Purpose |
|--------|------|------|---------|
| GET | `/api/blog/posts` | None (optional) | List posts; `?q=` triggers Meilisearch; no `q` = PostgreSQL latest |
| GET | `/api/blog/posts/{id}` | None | Single post detail |
| POST | `/api/blog/posts` | content-manager \| admin | Create post |
| PATCH | `/api/blog/posts/{id}` | content-manager \| admin | Update post |
| DELETE | `/api/blog/posts/{id}` | content-manager \| admin | Delete post |
| POST | `/api/blog/images` | content-manager \| admin | Upload image, return URL |

See `contracts/` for full request/response shapes.

### 3. Frontend Routes

| Path | Guard | Component |
|------|-------|-----------|
| `/blog` | none (public) | `BlogPage` |
| `/blog/:id` | none (public) | `BlogPostPage` |
| `/blog/manage` | `ContentManagerRoute` | `BlogManagePage` |
| `/blog/manage/new` | `ContentManagerRoute` | `BlogManageEditPage` |
| `/blog/manage/:id` | `ContentManagerRoute` | `BlogManageEditPage` |

**New route guard**: `ContentManagerRoute` — checks `profile?.role === "content-manager" || profile?.role === "admin"`. Redirects unauthenticated users to `/login`, non-permitted roles to `/dashboard`.

**AppHeader changes**: Add `{(profile?.role === "content-manager" || profile?.role === "admin") && <Link to="/blog/manage">Blog</Link>}` between Profile and Campaigns links.

**Landing.tsx**: Add a `<section className="landing__blog">` near the bottom with the 3 latest blog post cards and a "See all posts" button linking to `/blog`. Cards show title, date, and author/creator. Section is rendered by fetching `GET /api/blog/posts?limit=3` on mount (no auth).

### 4. Rich Text Architecture

```
Authoring (BlogManageEditPage)
  └─ RichTextEditor.tsx        ← TipTap editor, outputs HTML
       └─ image upload hook    ← calls POST /api/blog/images, inserts <img> into body

Reading (BlogPostPage + Preview in BlogManageEditPage)
  └─ RichTextRenderer.tsx      ← div with dangerouslySetInnerHTML, applies blog-content CSS class

Search highlights (BlogPage search results)
  └─ Meilisearch returns body_plain._formatted with <em> tags
  └─ HighlightedText component strips raw HTML, renders the Meilisearch snippet
```

### 5. Meilisearch Sync Flow

```
POST /api/blog/posts
  1. INSERT into blog_posts (PostgreSQL)
  2. await blog_search_service.upsert(post)  ← Meilisearch upsert
  3. Return 201

PATCH /api/blog/posts/{id}
  1. UPDATE blog_posts (PostgreSQL)
  2. await blog_search_service.upsert(post)
  3. Return 200

DELETE /api/blog/posts/{id}
  1. DELETE from blog_posts (PostgreSQL)
  2. await blog_search_service.delete(post_id)
  3. Return 204
```

If Meilisearch is unreachable, the operation logs a warning but does **not** fail the HTTP request — the index can be rebuilt via `rebuild_search_index.py`. This keeps the blog writable even if the search service is temporarily down.

### 6. Docker Services (additions)

```yaml
# Added to docker-compose.dev.yml, docker-compose.e2e.yml, docker-compose.prod.yml
meilisearch:
  image: getmeili/meilisearch:v1.6
  ports:
    - "7700:7700"   # dev only; omit in prod
  environment:
    MEILI_MASTER_KEY: ${MEILISEARCH_MASTER_KEY:-changeme-dev-key}
    MEILI_ENV: development   # or production
  volumes:
    - meilisearch_data:/meili_data
  healthcheck:
    test: ["CMD", "wget", "-qO-", "http://localhost:7700/health"]
    interval: 10s
    timeout: 5s
    retries: 5
```

**New env vars** (added to `.env.example` and backend settings):
- `MEILISEARCH_URL` — default `http://meilisearch:7700`
- `MEILISEARCH_API_KEY` — default `changeme-dev-key`

### 7. Test Design

#### Backend tests (TDD — write failing first)

**New file**: `backend/tests/test_blog_api.py`  
**New file**: `backend/tests/unit/test_blog_service.py`  
**New file**: `backend/tests/unit/test_blog_search_service.py`

| Test | Behavior verified |
|------|-------------------|
| `test_public_list_returns_posts_without_auth` | GET /api/blog/posts → 200, no session |
| `test_public_get_returns_post_without_auth` | GET /api/blog/posts/{id} → 200, no session |
| `test_search_delegates_to_meilisearch` | GET /api/blog/posts?q=foo → uses search service, returns formatted hits |
| `test_create_requires_content_manager_role` | POST /api/blog/posts as buyer → 403 |
| `test_create_post_as_content_manager` | POST /api/blog/posts → 201, all fields in response |
| `test_create_post_as_admin` | POST /api/blog/posts as admin → 201 |
| `test_update_post` | PATCH /api/blog/posts/{id} → 200, updated_at changes |
| `test_delete_post` | DELETE /api/blog/posts/{id} → 204, no longer returned |
| `test_buyer_cannot_create_post` | POST as buyer → 403 |
| `test_unauthenticated_cannot_create_post` | POST without session → 401 |
| `test_last_updated_only_after_edit` | created_at == updated_at on new post; differs after PATCH |
| `test_author_fallback_to_creator` | author=null → public response shows creator display name |

**Unit tests** (blog_search_service): mock `meilisearch.Client`; verify upsert/delete/search calls with correct document shape.

#### Frontend Vitest tests (TDD — write failing first)

| File | Tests |
|------|-------|
| `BlogPostCard.test.tsx` | Renders title, date, author; fallback to creator name |
| `BlogManagePage.test.tsx` | Shows post list; Edit/Delete buttons; search filters list |
| `BlogManageEditPage.test.tsx` | BEM class names; Preview renders body; Save calls blogApi |
| `AppHeader.test.tsx` (extend) | Blog link shown to content-manager; not shown to buyer |
| `RichTextRenderer.test.tsx` | Renders HTML body; does not show raw tags |

#### E2E scenarios (`frontend/e2e/07-blog-section.spec.ts`)

| ID | Scenario |
|----|----------|
| E35 | Landing page shows blog section without login |
| E36 | content-manager creates post → visible on /blog |
| E37 | content-manager edits post → updated content visible publicly |
| E38 | content-manager deletes post → removed from /blog |
| E39 | Search on /blog returns results with highlighted text |
| E40 | content-manager cannot access /campaigns (redirected) |
| E41 | Admin can create and manage blog posts |
| E42 | Post detail shows "last updated" only after edit |

### 8. Quickstart Guide

See [quickstart.md](quickstart.md).

---

## Constitution Check (Post-Design)

| Gate | Status | Notes |
|------|--------|-------|
| **Tests before code** | ✅ PASS | All test files listed; TDD order explicit in tasks.md |
| **Service boundary: Meilisearch** | ✅ PASS | Meilisearch accessed only through `blog_search_service.py`; no direct index calls from router |
| **Service boundary: PostgreSQL** | ✅ PASS | Blog CRUD only in `blog_service.py`; no direct DB in router |
| **Docker** | ✅ PASS | Meilisearch added to all three compose files; `meilisearch_data` named volume |
| **Deviations** | ✅ NONE | |

---

## Complexity Tracking

No constitution violations.
