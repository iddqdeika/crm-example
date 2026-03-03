# Contract: GET /api/blog/posts/{id}

**Auth**: None required (public endpoint)  
**Handler**: `blog.get_post`

---

## Request

### Path parameters

| Param | Type | Required | Notes |
|-------|------|----------|-------|
| `id` | UUID string | yes | Blog post UUID |

### Example

```
GET /api/blog/posts/550e8400-e29b-41d4-a716-446655440000
```

---

## Response

### 200 OK

```json
{
  "id": "550e8400-e29b-41d4-a716-446655440000",
  "title": "How Quality Assurance Scales",
  "body": "<p>Full HTML body of the post, including any <strong>formatted</strong> content and images.</p>",
  "author_display": "Jane Smith",
  "creator_id": "123e4567-e89b-12d3-a456-426614174000",
  "creator_display_name": "John Doe",
  "created_at": "2026-03-01T12:00:00Z",
  "updated_at": "2026-03-02T09:30:00Z",
  "is_edited": true
}
```

**Notes**:
- `author_display` = `author` if set, otherwise `creator_display_name`
- `is_edited` = `updated_at != created_at`
- `body` is raw HTML — frontend must render with `dangerouslySetInnerHTML` inside a sandboxed container

### 404 Not Found

```json
{"detail": "Blog post not found"}
```
