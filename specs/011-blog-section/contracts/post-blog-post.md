# Contract: POST /api/blog/posts

**Auth**: Required — role must be `content_manager` or `admin`  
**Handler**: `blog.create_post`

---

## Request

### Headers

```
Content-Type: application/json
Cookie: session=<session_token>
```

### Body

```json
{
  "title": "How Quality Assurance Scales",
  "body": "<p>Full HTML body from TipTap editor.</p>",
  "author": "Jane Smith"
}
```

| Field | Type | Required | Constraints |
|-------|------|----------|-------------|
| `title` | string | yes | 1–255 characters |
| `body` | string | yes | Min 1 character; HTML string |
| `author` | string \| null | no | Max 255 characters; `null` = use creator display name in public view |

---

## Response

### 201 Created

```json
{
  "id": "550e8400-e29b-41d4-a716-446655440000",
  "title": "How Quality Assurance Scales",
  "body": "<p>Full HTML body from TipTap editor.</p>",
  "author_display": "Jane Smith",
  "creator_id": "123e4567-e89b-12d3-a456-426614174000",
  "creator_display_name": "John Doe",
  "created_at": "2026-03-02T10:00:00Z",
  "updated_at": "2026-03-02T10:00:00Z",
  "is_edited": false
}
```

### 401 Unauthorized — no session

```json
{"detail": "Not authenticated"}
```

### 403 Forbidden — wrong role

```json
{"detail": "Insufficient permissions"}
```

### 422 Unprocessable Entity — validation error

```json
{
  "detail": [
    {"loc": ["body", "title"], "msg": "field required", "type": "value_error.missing"}
  ]
}
```

---

## Side effects

1. Row inserted into `blog_posts` table
2. Meilisearch upsert: document indexed in `blog_posts` index (async; failure logs warning, does not fail request)
