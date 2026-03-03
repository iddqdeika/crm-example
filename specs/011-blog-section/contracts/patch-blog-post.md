# Contract: PATCH /api/blog/posts/{id}

**Auth**: Required — role must be `content_manager` or `admin`  
**Handler**: `blog.update_post`

---

## Request

### Path parameters

| Param | Type | Required |
|-------|------|----------|
| `id` | UUID | yes |

### Headers

```
Content-Type: application/json
Cookie: session=<session_token>
```

### Body (partial update — all fields optional)

```json
{
  "title": "Updated Title",
  "body": "<p>Updated body HTML.</p>",
  "author": "New Author Name"
}
```

| Field | Type | Required | Constraints |
|-------|------|----------|-------------|
| `title` | string | no | 1–255 characters |
| `body` | string | no | Min 1 character; HTML string |
| `author` | string \| null | no | `null` explicitly clears the author field; omitting leaves it unchanged |

---

## Response

### 200 OK

```json
{
  "id": "550e8400-e29b-41d4-a716-446655440000",
  "title": "Updated Title",
  "body": "<p>Updated body HTML.</p>",
  "author_display": "New Author Name",
  "creator_id": "123e4567-e89b-12d3-a456-426614174000",
  "creator_display_name": "John Doe",
  "created_at": "2026-03-01T12:00:00Z",
  "updated_at": "2026-03-02T15:30:00Z",
  "is_edited": true
}
```

**Notes**:
- `updated_at` is always the server-generated timestamp of this operation
- `creator_id` is never changed by a PATCH operation
- `is_edited` = `true` after the first PATCH

### 401 Unauthorized

```json
{"detail": "Not authenticated"}
```

### 403 Forbidden

```json
{"detail": "Insufficient permissions"}
```

### 404 Not Found

```json
{"detail": "Blog post not found"}
```

### 422 Unprocessable Entity

Standard FastAPI validation error shape.

---

## Side effects

1. Row updated in `blog_posts` table (`updated_at` refreshed)
2. Meilisearch upsert: document re-indexed with new field values (failure logs warning, does not fail request)
