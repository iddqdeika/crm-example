# Contract: GET /api/blog/posts

**Auth**: None required (public endpoint)  
**Handler**: `blog.get_posts`

---

## Request

### Query parameters

| Param | Type | Required | Default | Notes |
|-------|------|----------|---------|-------|
| `q` | string | no | — | Fulltext search query; if present, delegates to Meilisearch |
| `limit` | integer | no | 20 | Max 100 |
| `page` | integer | no | 1 | 1-based page number (used with `limit`) |

### Example — Latest posts (no search)

```
GET /api/blog/posts?limit=3
```

### Example — Fulltext search

```
GET /api/blog/posts?q=quality+assurance&limit=10
```

---

## Response

### 200 OK — Latest (no `q`)

```json
{
  "items": [
    {
      "id": "550e8400-e29b-41d4-a716-446655440000",
      "title": "How Quality Assurance Scales",
      "body_excerpt": "Plain text excerpt of the post body, up to 200 characters of plain text...",
      "author_display": "Jane Smith",
      "created_at": "2026-03-01T12:00:00Z",
      "updated_at": "2026-03-01T12:00:00Z",
      "is_edited": false
    }
  ],
  "total": 42
}
```

### 200 OK — Search results (with `q`)

```json
{
  "items": [
    {
      "id": "550e8400-e29b-41d4-a716-446655440000",
      "title": "How <em>Quality</em> <em>Assurance</em> Scales",
      "body_snippet": "...plain text excerpt with <em>quality</em> assurance highlighted...",
      "author_display": "Jane Smith",
      "created_at_ts": 1740912000,
      "is_search_result": true
    }
  ],
  "total": 3
}
```

**Search response notes**:
- `title` and `body_snippet` may contain `<em>` tags for highlighting
- `body_snippet` is a short excerpt (~200 chars) from Meilisearch's `_formatted.body_plain`, not the full body
- `created_at_ts` is a Unix timestamp (from Meilisearch); frontend converts to display string
- `is_search_result: true` distinguishes the response type on the frontend

### 422 Unprocessable Entity — Invalid query params

```json
{"detail": [{"loc": ["query", "limit"], "msg": "value is not a valid integer", "type": "type_error.integer"}]}
```

---

## Backend logic

```python
@router.get("", response_model=BlogPostListResponse | BlogSearchListResponse)
async def get_posts(
    q: str | None = Query(None),
    limit: int = Query(20, ge=1, le=100),
    page: int = Query(1, ge=1),
    db: AsyncSession = Depends(get_db),
    search_service: BlogSearchService = Depends(get_search_service),
) -> ...:
    if q:
        return await search_service.search(q, limit=limit, page=page)
    return await blog_service.list_posts(db, limit=limit, page=page)
```
