# Research: SEO-Friendly Blog (Slugs & Meta Tags)

**Feature**: 012-blog-seo-slugs  
**Purpose**: Resolve technical unknowns for slug sanitization, SPA meta tags, and slug redirect storage.

---

## 1. Slug sanitization algorithm

**Decision**: Implement a single, deterministic client- and server-side algorithm: (1) lowercase; (2) replace runs of spaces/dashes/underscores with a single hyphen; (3) strip any character that is not `a-z`, `0-9`, or `-`; (4) trim leading/trailing hyphens; (5) truncate to 100 characters. No transliteration — non-ASCII is stripped (per spec).

**Rationale**: Keeps slugs URL-safe (RFC 3986), readable, and consistent. Matching logic on backend and frontend avoids surprises when the server validates. Spec explicitly defers i18n/transliteration.

**Alternatives considered**:
- **Transliteration (e.g. é→e)**: Rejected for this iteration; spec says non-ASCII stripped.
- **Underscores**: Rejected; hyphens are the common convention for slugs and the spec requires hyphens.
- **Third-party lib (e.g. slugify)**: Acceptable on backend if we mirror the same rules on frontend (e.g. a small shared regex/function); otherwise a single inline implementation avoids drift.

**Implementation note**: Backend and frontend MUST produce identical output for the same title input so that auto-suggest matches server validation. Prefer one shared implementation (e.g. backend exposes a “slugify” helper used by migration and validation) or two implementations kept in sync via tests.

---

## 2. Meta tags (title, description, canonical) in React SPA

**Decision**: Use **react-helmet-async** in the React app to set `<title>`, `<meta name="description">`, and `<link rel="canonical">` on the blog post page. Wrap the app (or at least the blog subtree) in a `HelmetProvider`; render a `<Helmet>` inside the post page with values from the post (SEO title or post title, meta description or excerpt, canonical URL from slug).

**Rationale**: React Helmet is the standard way to update document head from React components. The async variant is compatible with React 18 and SSR if we add it later. Crawlers that execute JS will see the updated head; for crawlers that do not, consider a later phase with prerender/SSR (out of scope for this feature).

**Alternatives considered**:
- **document.title + manual meta elements**: Works but is easy to get wrong (cleanup on unmount, canonical link management). Helmet centralizes and cleans up.
- **Next.js / SSR**: Out of scope; would require a larger migration.
- **react-helmet (sync)**: Replaced by react-helmet-async for React 18 and to avoid deprecated usage.

**Implementation note**: Canonical URL must be absolute (e.g. `window.location.origin + '/blog/post/' + slug` or from env/config). SEO title and meta description come from post fields with fallbacks (post title, body excerpt).

---

## 3. Slug history and 301 redirect storage

**Decision**: Add a **slug_history** table: `(id, blog_post_id, slug, created_at)`. When a post’s slug is updated, insert the old slug into this table (if it was published and had a slug), then update the post’s slug. On public read: first resolve by current slug (blog_posts.slug where status = published); if not found, query slug_history for the slug and, if a row exists, 301 redirect to the post’s current slug URL. Unique constraint on `slug` (or slug + blog_post_id depending on design — see data-model) so each historical slug points to at most one post.

**Rationale**: Supports multiple slug changes and arbitrary old slugs; 301 is the right HTTP status for permanent redirects and preserves SEO value. No need to mutate old URLs in place.

**Alternatives considered**:
- **Store only previous slug on post**: Simpler but supports only one redirect per post; spec says “all previous slugs” must redirect.
- **Redirect at CDN/reverse proxy**: Still requires a source of truth (e.g. slug_history); backend is the natural owner.
- **No history, 404 on old slug**: Spec requires 301 from old to new slug.

**Implementation note**: Uniqueness: slug_history.slug must be unique globally so that a given path resolves to one post. When a post reverts to draft, its current slug can be removed from the “current” view but should remain in slug_history so old links still redirect. When a post is deleted, decide whether to keep slug_history rows (redirect to 410/404) or remove them; for simplicity, keep and redirect to 404 or to blog listing.

---

## 4. Draft/published and Meilisearch

**Decision**: **Published** posts are indexed in Meilisearch; **draft** posts are not. On publish, add/update the document; on revert to draft, remove the document from the index. Public list and search endpoints return only published posts. Management list can show all posts (draft + published) with a status filter if needed.

**Rationale**: Aligns with “draft not publicly accessible” and “slug reserved only when published.” Meilisearch becomes a read model for public content only.

**Alternatives considered**:
- **Index drafts with a flag**: Would require filtering in every public query and risks leaking draft content; rejected.
- **No Meilisearch for drafts**: Same as chosen approach; indexing on publish is the minimal change.

---

## 5. Concurrent publish with same slug

**Decision**: Enforce slug uniqueness at the database level with a **unique index on (slug)** where status = published. In practice: unique index on `blog_posts(slug)` only for rows with `status = 'published'` — which in PostgreSQL can be done with a **partial unique index**: `CREATE UNIQUE INDEX ... ON blog_posts(slug) WHERE status = 'published'`. On publish, the insert/update either succeeds or fails with a unique violation; return a 409 or 400 with a clear “slug already taken” message. First writer wins.

**Rationale**: Avoids race conditions without application-level locking. Partial index keeps draft slugs out of the uniqueness constraint.

**Alternatives considered**:
- **Last writer wins**: Would require overwriting the other post’s slug or rejecting one publish; first writer wins is simpler and clearer.
- **Optimistic locking without DB constraint**: Risk of two publishes succeeding; DB constraint is the single source of truth.
