# Contract: GET /api/blog/posts/check-slug (slug availability)

**Feature**: 012-blog-seo-slugs  
**Auth**: Required — `content_manager` or `admin`  
**Purpose**: Debounced real-time check whether a slug is available (not taken by another **published** post). Used by the create/edit form to show an inline warning before publish.

---

## Request

### Query parameters

| Param | Type | Required | Notes |
|-------|------|----------|-------|
| `slug` | string | yes | Slug to check (URL-safe, 1–100 chars) |
| `exclude_post_id` | UUID | no | When editing, exclude this post’s own slug from the conflict check |

### Example

```
GET /api/blog/posts/check-slug?slug=campaign-basics
GET /api/blog/posts/check-slug?slug=campaign-basics&exclude_post_id=550e8400-e29b-41d4-a716-446655440000
```

---

## Response

### 200 OK

**Available** — slug is not used by any published post (or only by the excluded post):

```json
{"available": true}
```

**Taken** — slug is used by another published post:

```json
{"available": false, "message": "This URL is already taken"}
```

- When `exclude_post_id` is provided and the slug belongs to that post, respond `available: true`.
- Draft posts do not reserve slugs; only published posts are considered.

### 400 Bad Request

Slug missing or invalid (empty, wrong format, or length &gt; 100):

```json
{"detail": "Invalid slug"}
```

### 401 / 403

Same as other blog management endpoints.

---

## Notes

- Call this after ~500 ms debounce when the user types in the slug field.
- Publish still enforces uniqueness on the server; this endpoint is for UX only.
- Rate limiting may be applied to avoid abuse (e.g. per-user limit); exact limit is implementation-defined.
