# Implementation Plan: SEO-Friendly Blog (Slugs & Meta Tags)

**Branch**: `012-blog-seo-slugs` | **Date**: 2026-02-26 | **Spec**: [spec.md](spec.md)  
**Input**: Feature specification from `specs/012-blog-seo-slugs/spec.md`

## Summary

Introduce SEO-friendly blog URLs and meta tags: (1) **Draft/Published** lifecycle so posts can be saved as draft or published explicitly; (2) **Slug** — unique, editable, URL-safe identifier per post with auto-suggestion from title and debounced uniqueness check; (3) **Public URL** `/blog/post/<slug>` with 301 redirects from old slugs via a slug-history table; (4) **SEO meta** — optional SEO title (60 chars) and meta description (160 chars) in the editor, rendered in page `<head>` with `<link rel="canonical">`. Migration assigns slugs to existing posts (numeric suffix on collision). Backend: new/updated models, API by slug, slug-check endpoint; frontend: slug field, SEO section, draft/publish actions, route `/blog/post/:slug`, meta injection.

## Technical Context

**Language/Version**: Python 3.12+ (backend), TypeScript / React 18 (frontend)  
**Primary Dependencies**: FastAPI, SQLAlchemy 2.0 async, Alembic, React Router, Meilisearch Python client (existing)  
**Storage**: PostgreSQL (blog_posts extended, slug_history table), Meilisearch (index documents include slug; search/listing filter by status)  
**Testing**: pytest-asyncio (backend), Vitest + @testing-library/react (frontend), Playwright (E2E)  
**Target Platform**: Docker Compose (dev, e2e, prod); same backend/frontend images  
**Performance Goals**: Slug uniqueness check &lt;500 ms; slug-by-slug lookup and redirect resolution &lt;200 ms p95  
**Constraints**: Public read only for **published** posts at `/blog/post/<slug>`; draft posts return 404; management APIs require content_manager/admin  
**Scale/Scope**: ~500 posts; slug history rows grow with slug changes only; no new services

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

| Gate | Status | Notes |
|------|--------|-------|
| **TDD — tests identified before coding** | ✅ PASS | Per-user-story test tasks will be in tasks.md; failing tests written first for slug sanitization, uniqueness, redirect, draft/publish, SEO meta |
| **Service boundaries and data ownership** | ✅ PASS | Backend owns blog_posts and slug_history; Meilisearch remains derived index; no cross-service DB access |
| **Docker images and delivery** | ✅ PASS | No new containers; backend/frontend images unchanged; migrations run in existing backend startup/CI |
| **Deviations from constitution** | ✅ NONE | No violations |

*Post–Phase 1 re-check*: Data model and contracts align with TDD (tests in tasks.md); service boundaries unchanged; Docker unchanged. ✅ PASS

## Project Structure

### Documentation (this feature)

```text
specs/012-blog-seo-slugs/
├── plan.md              # This file
├── research.md          # Phase 0 — slug sanitization, meta tags in SPA, redirect pattern
├── data-model.md        # Phase 1 — entities, migrations
├── quickstart.md       # Phase 1 — run/test this feature
├── contracts/          # Phase 1 — API contracts (by-slug read, slug check, create/update with status)
└── tasks.md            # Phase 2 (/speckit.tasks)
```

### Source Code (repository root)

```text
backend/
├── src/
│   ├── models/
│   │   ├── blog_post.py          MODIFIED — add slug, status, seo_title, meta_description
│   │   ├── blog_slug_history.py   NEW — SlugHistory model for 301 redirects
│   │   └── __init__.py           MODIFIED — export SlugHistory
│   ├── schemas/
│   │   └── blog.py               MODIFIED — slug, status, seo_* in create/update/response
│   ├── services/
│   │   ├── blog_service.py       MODIFIED — slug CRUD, status, slug history, migration helper
│   │   └── blog_search_service.py MODIFIED — index only published; document slug
│   ├── api/
│   │   └── blog.py               MODIFIED — GET by slug, slug-check endpoint; list filter by status
│   ├── scripts/
│   │   └── migrate_blog_slugs.py NEW — one-off migration for existing posts
│   └── migrations/
│       └── versions/             NEW — add slug, status, seo_title, meta_description; slug_history table
├── tests/
│   ├── test_blog_api.py          MODIFIED — slug, status, redirect, draft visibility
│   └── unit/                     NEW/EXTEND — slug sanitization, uniqueness, slug history
frontend/
├── src/
│   ├── App.tsx                   MODIFIED — route /blog/post/:slug; optional legacy /blog/:id redirect
│   ├── pages/
│   │   ├── BlogPage.tsx          MODIFIED — links to /blog/post/<slug>; only published in list
│   │   ├── BlogPostPage.tsx      MODIFIED — fetch by slug; inject <title>, meta, canonical
│   │   ├── BlogManagePage.tsx    MODIFIED — show status; links to /blog/post/<slug> for published
│   │   └── BlogManageEditPage.tsx MODIFIED — slug field + auto-suggest, debounced check, SEO section, draft/publish
│   ├── components/
│   │   ├── BlogPostCard.tsx      MODIFIED — link to /blog/post/<slug>
│   │   └── (optional) MetaTags.tsx NEW — reusable head injection for post page
│   └── services/
│       └── api.ts                 MODIFIED — getBySlug, checkSlug, create/update with slug/status/seo_*
├── e2e/
│   └── 07-blog-section.spec.ts   MODIFIED — slug URLs, draft/publish, SEO meta
```

**Structure Decision**: Same backend/frontend split as 011-blog-section; all changes are additive (new columns, new table, new route pattern). Management routes stay under `/blog/manage`; public post URL becomes `/blog/post/<slug>`.

## Complexity Tracking

| Violation | Why Needed | Simpler Alternative Rejected Because |
|-----------|------------|-------------------------------------|
| *(none)* | — | — |
