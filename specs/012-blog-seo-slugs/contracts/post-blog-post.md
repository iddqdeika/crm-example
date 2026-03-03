# Contract: POST /api/blog/posts (012 — with slug, status, SEO fields)

**Feature**: 012-blog-seo-slugs  
**Auth**: Required — `content_manager` or `admin`  
**Supersedes**: 011 contract; adds `slug`, `status`, `seo_title`, `meta_description`.

---

## Request

### Body

```json
{
  "title": "How Quality Assurance Scales",
  "body": "<p>Full HTML body from TipTap editor.</p>",
  "author": "Jane Smith",
  "slug": "how-quality-assurance-scales",
  "status": "draft",
  "seo_title": "How QA Scales | Blog",
  "meta_description": "Short description for search results."
}
```

| Field | Type | Required | Constraints |
|-------|------|----------|-------------|
| `title` | string | yes | 1–255 characters |
| `body` | string | yes | Min 1 character; HTML string |
| `author` | string \| null | no | Max 255 characters |
| **slug** | **string** | **yes** | 1–100 chars; `[a-z0-9-]` only; no leading/trailing hyphen. Uniqueness enforced only when `status = published` |
| **status** | **string** | **yes** | `draft` \| `published`. Default `draft` if omitted |
| **seo_title** | **string \| null** | no | Max 60 characters; used for `<title>` when set |
| **meta_description** | **string \| null** | no | Max 160 characters; used for `<meta name="description">` when set |

- If `status = published`, slug MUST be unique among all published posts; otherwise 409 or 400 with `"slug already taken"`.
- If `status = draft`, slug may duplicate another draft’s slug.

---

## Response

### 201 Created

Same as 011 response, plus:

- `slug`, `status`, `seo_title`, `meta_description`

### 409 Conflict (or 400) — slug taken

When `status = published` and slug is already used by another published post:

```json
{"detail": "This URL is already taken. Please choose another slug."}
```

### 422 Unprocessable Entity

Validation errors (e.g. invalid slug format, empty slug, status not allowed).

---

## Side effects

1. Row inserted into `blog_posts` with `slug`, `status`, `seo_title`, `meta_description`.
2. Meilisearch: document indexed **only if** `status = 'published'`; no index entry for drafts.
