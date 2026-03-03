# Research: Blog Section (011)

**Date**: 2026-03-02  
**Feature**: `specs/011-blog-section/spec.md`  
**User addendum**: "add some fulltext-search indexed DB service to update with posts and search in it"

---

## Decision 1: Fulltext Search Engine

**Decision**: Use **Meilisearch** as the fulltext search service.

**Rationale**:
- Lightweight Docker image (~50 MB, single binary) — trivial to add to docker-compose
- Purpose-built for fast, typo-tolerant, full-text search with zero configuration
- Built-in result highlighting: returns `_formatted` fields with `<em>` tags around matched terms, satisfying FR-005 with no additional frontend work
- Simple Python client (`meilisearch` PyPI package, official, maintained)
- MIT license — no commercial restrictions
- REST API makes it independently testable and independently deployable (Constitution IV — Microservices by Design)
- Adequate for SC-003 target: 2-second search for up to 500 posts; Meilisearch returns sub-100ms at this scale
- Widely used in similar content-management stacks; well-documented

**Alternatives considered**:

| Alternative | Reason rejected |
|---|---|
| PostgreSQL `ILIKE` | No real highlighting support; coupling search to the primary DB; poor scalability |
| PostgreSQL `tsvector` / `tsquery` | Built-in highlighting via `ts_headline` is complex and slow; still couples search to primary DB; does not support typo tolerance |
| Elasticsearch | BSL license since v7.11; heavyweight (~500 MB JVM); complex ops; overkill for 500 posts |
| OpenSearch | Apache 2.0 but same operational complexity as Elasticsearch |
| Typesense | Good alternative to Meilisearch; fewer community resources; near-identical feature set but higher memory footprint at idle |

**Integration pattern**:
1. Meilisearch runs as an isolated Docker service (`meilisearch:v1.x`)
2. Backend `blog_search_service.py` wraps the `meilisearch` Python client
3. Sync operations: create/update/delete posts → `blog_search_service` updates the Meilisearch index atomically after the PostgreSQL write succeeds
4. Search operation: `GET /api/blog/posts?q=...` delegates to Meilisearch; returns hits with `_formatted.title` and `_formatted.body_plain` for highlighting
5. "Latest" listing (`GET /api/blog/posts` without `q`): served directly from PostgreSQL (no index needed)
6. Meilisearch is treated as a **read replica / derived cache** — PostgreSQL is the source of truth; the index can be fully rebuilt from the DB at any time

**Meilisearch index document schema**:
```json
{
  "id": "uuid-string",
  "title": "Post title",
  "body_plain": "Plain text stripped of HTML tags",
  "author_display": "Author name or creator display name",
  "created_at_ts": 1740912000
}
```
Note: HTML is stripped before indexing so Meilisearch does not search HTML markup.

---

## Decision 2: Rich-Text Editor

**Decision**: Use **TipTap** (headless WYSIWYG editor for React).

**Rationale**:
- Headless architecture — zero default styles; fully compatible with the dark design system
- Extensions used: `StarterKit` (paragraphs, headings h1–h3, bold, italic, lists), `Link`, `Image`
- Outputs and inputs HTML strings → stored as `TEXT` in PostgreSQL
- MIT license
- First-class React support (`@tiptap/react`)
- `Image` extension can be configured with a custom `uploadFn` that calls `POST /api/blog/images`
- Industry standard for React-based headless WYSIWYG (used by Notion clones, Linear, etc.)

**Alternatives considered**:

| Alternative | Reason rejected |
|---|---|
| `react-quill` | Unmaintained (last release 2021); heavy; opinionated styles |
| `draft-js` | Facebook-era, complex state model, effectively unmaintained |
| Plain `<textarea>` + Markdown | Content managers should not need Markdown knowledge; no inline image support |
| `react-markdown` + input | Read-only rendering only; needs a separate editor |
| Slate.js | Powerful but requires building all primitives manually; high implementation cost |

**Body storage**: HTML string in PostgreSQL `TEXT` column. Safe to render via React with `dangerouslySetInnerHTML` since content is staff-authored only (no public input accepted for body).

---

## Decision 3: Public API Access (unauthenticated blog reads)

**Decision**: Create a `get_optional_user` FastAPI dependency returning `User | None`.

**Rationale**:
- Public blog GET endpoints (`GET /api/blog/posts`, `GET /api/blog/posts/{id}`) must work without a session
- The existing `get_current_user` raises HTTP 401 if no session — it cannot be used as-is
- A new `get_optional_user(request, db, cache)` dependency mirrors `get_current_user` but returns `None` instead of raising when no session cookie is present
- This pattern is minimal: one new function in `core/auth.py`; all other dependencies remain unchanged
- Protected management endpoints continue to use `get_current_user` (unchanged)

---

## Decision 4: Post URL scheme

**Decision**: UUID-based URLs — `/blog/{uuid}`.

**Rationale**:
- Consistent with existing campaign URLs (`/campaigns/{uuid}`)
- No slug generation, uniqueness constraint, or URL-safe encoding complexity
- Avoids a migration if post titles change after creation
- Sufficient for this scope (blog is internal company content, not SEO-critical at this stage)

---

## Decision 5: Who can edit/delete any post

**Decision**: Any `content-manager` or `admin` can edit or delete any post (CMS model, no per-author restriction).

**Rationale**:
- The spec describes a team-managed CMS, not a personal blog platform
- Per-author restriction would require UI to reflect ownership and complicate role checks
- Consistent with how admins currently manage all campaigns

---

## Decision 6: Image upload in blog posts

**Decision**: New backend endpoint `POST /api/blog/images` using the existing MinIO storage pattern.

**Rationale**:
- Reuses `core/storage.py` + boto3 client; no new infrastructure
- TipTap `Image` extension's `uploadFn` calls this endpoint, receives `{url: string}`, inserts into the body
- Images are stored under `blog-images/{uuid}.ext` key in the same `qualityboard-media` MinIO bucket
- File type and size validation identical to avatar upload

---

## Decision 7: Meilisearch index rebuild strategy

**Decision**: On-demand rebuild via a CLI/script command; not a background job.

**Rationale**:
- At 500 posts the index can be fully rebuilt in under 5 seconds
- Drift only occurs if a write fails after the Postgres commit (rare edge case)
- A simple `python src/scripts/rebuild_search_index.py` script iterates all posts and upserts them into Meilisearch
- This is simpler than a background sync job and adequate for the stated scale (SC-003)

---

## Decision 8: Search in management list vs public blog page

**Decision**: Management list uses PostgreSQL `ILIKE` (server-side filter); public blog page uses Meilisearch.

**Rationale**:
- Management list is admin/internal only; sub-second ILIKE on a few hundred posts is acceptable
- Management list does not require highlighting
- Meilisearch is reserved for the public-facing search where highlighting and typo tolerance matter
- Keeps the management list independent of Meilisearch availability
