# Quickstart: Blog Section (011)

This guide covers how to run the blog section locally and in E2E mode after the feature is implemented.

---

## Prerequisites

- Docker Desktop running
- `docker-compose` (v2)
- Node.js 20+ (for frontend dev server only)
- Python 3.13 (for backend dev server only)

---

## New environment variables

Add these to your `.env` (copy from `.env.example` which will be updated):

```env
MEILISEARCH_URL=http://meilisearch:7700
MEILISEARCH_MASTER_KEY=changeme-dev-key
```

For local backend development outside Docker, set:
```env
MEILISEARCH_URL=http://localhost:7700
```

---

## Start the dev stack (includes Meilisearch)

```bash
docker compose -f docker/docker-compose.dev.yml up -d
```

This now starts:
- `postgres` — primary database
- `minio` — object storage (avatars + blog images)
- `meilisearch` — fulltext search index (new)
- `backend` — FastAPI app
- `frontend` — Vite dev server

Meilisearch admin UI is available at: http://localhost:7700  
(Use master key `changeme-dev-key` to authenticate)

---

## Apply database migrations

```bash
docker compose -f docker/docker-compose.dev.yml exec backend alembic upgrade head
```

This runs the new migration that:
1. Adds `content_manager` to the `userrole` PostgreSQL enum
2. Creates the `blog_posts` table with indexes

---

## Create a content_manager user (dev only)

```bash
docker compose -f docker/docker-compose.dev.yml exec backend python -c "
from src.core.db import SyncSession
from src.models.user import User, UserRole
import uuid

with SyncSession() as db:
    u = User(
        id=uuid.uuid4(),
        email='content@example.com',
        display_name='Content Manager',
        role=UserRole.content_manager,
    )
    u.set_password('Password123!')
    db.add(u)
    db.commit()
    print('Created:', u.email)
"
```

Or promote an existing user via the admin panel (if admin role is set).

---

## Rebuild Meilisearch index (if needed)

If the search index becomes stale (e.g., after restoring a database backup), rebuild it from PostgreSQL:

```bash
docker compose -f docker/docker-compose.dev.yml exec backend python src/scripts/rebuild_search_index.py
```

Expected output:
```
Rebuilding Meilisearch index 'blog_posts'...
Indexed 42 documents.
Done.
```

---

## Run backend tests

```bash
cd backend
pytest tests/test_blog_api.py -v
pytest tests/unit/test_blog_service.py -v
pytest tests/unit/test_blog_search_service.py -v
```

To run all backend tests:
```bash
pytest
```

---

## Run frontend unit tests

```bash
cd frontend
npm test
```

Relevant new test files:
- `src/pages/BlogPage.test.tsx`
- `src/pages/BlogManagePage.test.tsx`
- `src/pages/BlogManageEditPage.test.tsx`
- `src/components/BlogPostCard.test.tsx`
- `src/components/RichTextRenderer.test.tsx`

---

## Run E2E tests

```bash
# Start the E2E stack (includes Meilisearch)
npm run e2e:up

# Run all E2E specs (new blog scenarios are in 07-blog-section.spec.ts)
npm run e2e:test

# Run only blog scenarios
npx playwright test frontend/e2e/07-blog-section.spec.ts

# Tear down
npm run e2e:down
```

---

## API exploration

After starting the dev stack, the blog API is available at:

| Endpoint | URL |
|----------|-----|
| List/search posts | GET http://localhost:8000/api/blog/posts |
| Get single post | GET http://localhost:8000/api/blog/posts/{id} |
| Create post | POST http://localhost:8000/api/blog/posts |
| Update post | PATCH http://localhost:8000/api/blog/posts/{id} |
| Delete post | DELETE http://localhost:8000/api/blog/posts/{id} |
| Upload image | POST http://localhost:8000/api/blog/images |

Interactive API docs (Swagger): http://localhost:8000/docs#/blog

---

## Meilisearch index inspection

```bash
# List all documents in the blog index
curl -H "Authorization: Bearer changeme-dev-key" \
  http://localhost:7700/indexes/blog_posts/documents

# Run a test search
curl -H "Authorization: Bearer changeme-dev-key" \
  "http://localhost:7700/indexes/blog_posts/search?q=quality"
```
