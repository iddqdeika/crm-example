# Contract: DELETE /api/blog/posts/{id}

**Auth**: Required — role must be `content_manager` or `admin`  
**Handler**: `blog.delete_post`

---

## Request

### Path parameters

| Param | Type | Required |
|-------|------|----------|
| `id` | UUID | yes |

### Headers

```
Cookie: session=<session_token>
```

### Example

```
DELETE /api/blog/posts/550e8400-e29b-41d4-a716-446655440000
```

---

## Response

### 204 No Content

Empty body.

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

---

## Side effects

1. Row hard-deleted from `blog_posts` table
2. Meilisearch delete: document removed from `blog_posts` index (failure logs warning, does not fail request)
