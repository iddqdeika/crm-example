# Contract: PATCH /api/blog/posts/{id} (012 — slug, status, SEO fields)

**Feature**: 012-blog-seo-slugs  
**Auth**: Required — `content_manager` or `admin`  
**Supersedes**: 011 contract; adds optional `slug`, `status`, `seo_title`, `meta_description`.

---

## Request

### Path parameters

| Param | Type | Required |
|-------|------|----------|
| `id` | UUID | yes |

### Body (partial update — all fields optional)

```json
{
  "title": "Updated Title",
  "body": "<p>Updated body.</p>",
  "author": "New Author",
  "slug": "updated-title",
  "status": "published",
  "seo_title": "Updated Title | Blog",
  "meta_description": "Updated meta description."
}
```

| Field | Type | Required | Constraints |
|-------|------|----------|-------------|
| `title` | string | no | 1–255 characters |
| `body` | string | no | Min 1 character |
| `author` | string \| null | no | Max 255; null clears |
| **slug** | **string** | no | 1–100 chars; `[a-z0-9-]`; no leading/trailing hyphen. When changing slug: old slug is stored in slug_history for 301 redirects |
| **status** | **string** | no | `draft` \| `published`. Transition to `published` enforces slug uniqueness |
| **seo_title** | **string \| null** | no | Max 60; null clears |
| **meta_description** | **string \| null** | no | Max 160; null clears |

- **Slug change**: If slug is updated and the post was previously published with an old slug, insert the old slug into `blog_slug_history` so that GET by old slug returns 301 to the new slug.
- **Publish**: If `status` is set to `published`, slug uniqueness is enforced; if slug is taken, return 409/400.
- **Revert to draft**: If `status` is set to `draft`, remove document from Meilisearch; slug is released from uniqueness pool (other posts may use it after publish).

---

## Response

### 200 OK

Same as 011 response, plus `slug`, `status`, `seo_title`, `meta_description`.

### 409 / 400 — slug taken

When setting `status = published` or changing slug to one already used by another published post.

---

## Side effects

1. `blog_posts` row updated; on slug change, insert previous slug into `blog_slug_history`.
2. Meilisearch: if status becomes `published`, upsert document; if status becomes `draft`, delete document from index.
