# Contract: GET /api/blog/posts/by-slug/{slug} (public by slug)

**Feature**: 012-blog-seo-slugs  
**Auth**: None (public)  
**Purpose**: Resolve a post by its URL slug; support 301 redirect from any previous slug.

---

## Request

### Path parameters

| Param | Type | Required | Notes |
|-------|------|----------|-------|
| `slug` | string | yes | URL-safe slug (e.g. `my-first-campaign-guide`) |

### Example

```
GET /api/blog/posts/by-slug/my-first-campaign-guide
```

---

## Response

### 200 OK

Post is **published** and has this slug as its current slug. Body same as [GET /api/blog/posts/{id}](get-blog-post.md) response, with added fields:

```json
{
  "id": "550e8400-e29b-41d4-a716-446655440000",
  "slug": "my-first-campaign-guide",
  "status": "published",
  "title": "My First Campaign Guide",
  "body": "<p>Full HTML body.</p>",
  "author_display": "Jane Smith",
  "creator_id": "123e4567-e89b-12d3-a456-426614174000",
  "creator_display_name": "John Doe",
  "created_at": "2026-03-01T12:00:00Z",
  "updated_at": "2026-03-02T09:30:00Z",
  "is_edited": true,
  "seo_title": "My First Campaign Guide | Blog",
  "meta_description": "A short excerpt for search results."
}
```

- `slug`, `status`, `seo_title`, `meta_description` are included for head meta rendering.
- Draft posts are never returned by this endpoint (they return 404).

### 301 Moved Permanently

The given `slug` is in **slug_history** (old slug of a post that was later changed). Redirect to the post’s current URL.

**Headers**:
- `Location`: `/blog/post/<current_slug>` (or full absolute URL per server config)

**Body**: Optional; crawlers follow redirect.

### 404 Not Found

- No published post has this slug, and it is not in slug_history.
- Or the slug belongs to a draft post (drafts are not publicly accessible).

```json
{"detail": "Post not found"}
```

---

## Resolution order

1. Look up `blog_posts` where `slug = :slug` and `status = 'published'` → 200.
2. Else look up `blog_slug_history` where `slug = :slug` → 301 to that post’s current `blog_posts.slug` URL.
3. Else → 404.

---

## Notes

- Frontend public post URL is `/blog/post/<slug>`. This API is called with that slug; the frontend does not use UUID for public viewing after 012.
- Management UI may still use GET `/api/blog/posts/{id}` by UUID for editing.
