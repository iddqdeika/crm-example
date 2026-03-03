# Quickstart: SEO-Friendly Blog — Slugs & Meta (012)

This guide covers how to run and test the 012 feature on top of the existing blog (011). It assumes the 011 blog section is already implemented and the dev stack is familiar.

---

## Prerequisites

- Same as [011 quickstart](011-blog-section/quickstart.md): Docker, Node 20+, Python 3.12+
- Blog section (011) running; Meilisearch and PostgreSQL up

---

## What’s new in 012

- **Draft / Published**: Posts have `status`; only published posts are public and indexed.
- **Slug**: Each post has a unique (among published) URL slug; public URL is `/blog/post/<slug>`.
- **Slug check**: `GET /api/blog/posts/check-slug?slug=...` for debounced uniqueness in the editor.
- **Public by slug**: `GET /api/blog/posts/by-slug/<slug>` — 200 if published, 301 if slug in history, 404 otherwise.
- **SEO fields**: `seo_title`, `meta_description` in create/update; rendered in page `<head>` with canonical.
- **Slug history**: Old slugs redirect (301) to the current slug; stored in `blog_slug_history`.

---

## Apply migrations

After implementing the 012 migrations:

```bash
docker compose -f docker/docker-compose.dev.yml exec backend alembic upgrade head
```

This adds to `blog_posts`: `slug`, `status`, `seo_title`, `meta_description`, and creates `blog_slug_history`. A data migration (or script) backfills slugs for existing posts and sets `status = 'published'`.

---

## One-off slug migration (existing posts)

If the codebase provides a script to assign slugs to posts that don’t have one:

```bash
docker compose -f docker/docker-compose.dev.yml exec backend python src/scripts/migrate_blog_slugs.py
```

Behavior: for each post without a slug, set `slug = slugify(title)`; on collision append `-2`, `-3`, etc. by `created_at`; set `status = 'published'` for all existing rows.

---

## Rebuild Meilisearch index

After migration, reindex so only published posts are searchable and documents include `slug`:

```bash
docker compose -f docker/docker-compose.dev.yml exec backend python src/scripts/rebuild_search_index.py
```

---

## Run tests

**Backend** (slug sanitization, uniqueness, redirect, draft/publish, API by slug):

```bash
cd backend
pytest tests/test_blog_api.py tests/unit/ -v -k blog
```

**Frontend** (slug field, auto-suggest, debounced check, SEO section, draft/publish, meta tags):

```bash
cd frontend
npm test -- --run src/pages/BlogManageEditPage src/pages/BlogPostPage src/components/BlogPostCard
```

**E2E** (public slug URL, draft not visible, publish flow, meta in head):

```bash
npm run e2e:up
npx playwright test frontend/e2e/07-blog-section.spec.ts
npm run e2e:down
```

---

## API endpoints (012)

| Endpoint | Method | Description |
|----------|--------|-------------|
| Get by slug (public) | GET /api/blog/posts/by-slug/{slug} | 200 post, 301 redirect, or 404 |
| Check slug availability | GET /api/blog/posts/check-slug?slug=...&exclude_post_id=... | 200 `{"available": true\|false}` |
| Create post | POST /api/blog/posts | Body: title, body, author, **slug**, **status**, **seo_title**, **meta_description** |
| Update post | PATCH /api/blog/posts/{id} | Same new fields optional |

Public list/search still use GET /api/blog/posts (returns only published after 012). Management list can show drafts and status; response items include `slug`, `status`.

---

## Frontend routes

- **Public**: `/blog` — list (published only); `/blog/post/:slug` — single post by slug (meta tags set here).
- **Manage**: `/blog/manage`, `/blog/manage/new`, `/blog/manage/:id` — slug field, SEO section, Save draft / Publish.

---

## Verify SEO meta

1. Publish a post with a slug and optional SEO title/description.
2. Open `/blog/post/<slug>` in the browser.
3. View page source: `<title>`, `<meta name="description">`, and `<link rel="canonical">` should reflect the post (or defaults).
4. Verify old slug: change the post’s slug, save; request `/blog/post/<old-slug>` — expect 301 to `/blog/post/<new-slug>`.
