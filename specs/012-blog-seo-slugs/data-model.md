# Data Model: SEO-Friendly Blog (Slugs & Meta Tags)

**Feature**: 012-blog-seo-slugs  
**Storage**: PostgreSQL (existing database); Meilisearch (existing index, documents extended).

---

## 1. Blog Post (extended)

**Table**: `blog_posts` (existing; new columns)

| Column | Type | Nullable | Description |
|--------|------|----------|--------------|
| id | UUID | NOT NULL | Primary key (unchanged) |
| title | VARCHAR(255) | NOT NULL | (unchanged) |
| body | TEXT | NOT NULL | (unchanged) |
| author | VARCHAR(255) | NULL | (unchanged) |
| creator_id | UUID FK(users.id) | NOT NULL | (unchanged) |
| created_at | TIMESTAMP | NOT NULL | (unchanged) |
| updated_at | TIMESTAMP | NOT NULL | (unchanged) |
| **slug** | **VARCHAR(100)** | **NOT NULL** | URL-safe identifier; unique among **published** posts only (partial unique index) |
| **status** | **VARCHAR(20)** | **NOT NULL** | `draft` \| `published`; default `draft` for new posts |
| **seo_title** | **VARCHAR(60)** | **NULL** | Override for page `<title>` |
| **meta_description** | **VARCHAR(160)** | **NULL** | Override for `<meta name="description">` |

**Constraints**:
- `slug`: only [a-z0-9-], no leading/trailing hyphen; length 1–100 (enforced in application + DB check if desired).
- **Partial unique index**: `UNIQUE(blog_posts.slug) WHERE status = 'published'` so drafts may reuse slugs.
- Existing rows (pre-migration) get `status = 'published'` and a generated slug (see migration).

**State transitions**:
- Draft → Published: set `status = 'published'`; slug is now reserved (uniqueness enforced).
- Published → Draft: set `status = 'draft'`; slug is released from uniqueness pool; slug_history retains old slug for 301.

---

## 2. Slug History

**Table**: `blog_slug_history` (new)

| Column | Type | Nullable | Description |
|--------|------|----------|--------------|
| id | UUID | NOT NULL | Primary key |
| blog_post_id | UUID FK(blog_posts.id) | NOT NULL | Post that used this slug |
| slug | VARCHAR(100) | NOT NULL | Historical slug value |
| created_at | TIMESTAMP | NOT NULL | When the slug was retired (replaced by a new slug) |

**Constraints**:
- **UNIQUE(slug)** — each historical slug appears at most once globally so that a request to `/blog/post/<slug>` resolves to at most one post (current or redirect).
- When a post’s slug is updated: insert current slug into `blog_slug_history` (if it was ever published and had a slug), then set `blog_posts.slug` to the new value. The current slug is not stored in history until it is replaced.

**Usage**: Public read by slug: (1) resolve by `blog_posts.slug` where `status = 'published'` → 200; (2) else resolve by `blog_slug_history.slug` → 301 to post’s current slug URL; (3) else 404.

---

## 3. Meilisearch index

**Index**: Same as 011 (e.g. `blog_posts`). Documents extended with:
- `slug`: string (post’s current slug).
- `status`: only index when `status = 'published'`; remove document when post is reverted to draft.

Public list/search return only published posts; management list can include drafts (backend filters by status as needed).

---

## 4. Migration (existing posts)

1. Add columns to `blog_posts`: `slug`, `status`, `seo_title`, `meta_description` (nullable where applicable; `slug` and `status` backfilled before NOT NULL if needed).
2. Backfill: for each existing post, set `status = 'published'`, set `slug = slugify(title)`; if two posts yield the same slug, assign `slug-2`, `slug-3`, etc. in order of `created_at` (oldest gets unsuffixed).
3. Add partial unique index on `(slug) WHERE status = 'published'`.
4. Create `blog_slug_history` table.
5. After deployment, old URL pattern `/blog/:id` (UUID) can return 404 or a one-time redirect to `/blog/post/<slug>` if desired (spec says old ID-based URLs return 404; optional redirect can be a separate small task).

---

## 5. Validation rules (application)

- **Slug format**: Regex or equivalent — `^[a-z0-9]+(?:-[a-z0-9]+)*$`, length 1–100. Reject empty, leading/trailing hyphen, consecutive hyphens.
- **Slug uniqueness**: Enforced at publish via partial unique index; on conflict return 409/400 with clear message.
- **seo_title**: Optional; if present, max 60 characters.
- **meta_description**: Optional; if present, max 160 characters.
- **status**: Only `draft` or `published`; default `draft` for new posts.
