# Contract: GET /api/blog/posts (Management variant)

**URL**: `GET /api/blog/posts`  
**Auth**: Optional (session cookie). When `?search=`, `?sort_by=`, or `?sort_dir=` are present the endpoint returns the full management list (PostgreSQL ILIKE search, no Meilisearch).

---

## Query Parameters

| Parameter | Type | Default | Description |
|-----------|------|---------|-------------|
| `search` | string | — | Keyword filter using PostgreSQL `ILIKE` on `title` and `body` |
| `sort_by` | `"created_at"` \| `"title"` | `"created_at"` | Column to sort by |
| `sort_dir` | `"asc"` \| `"desc"` | `"desc"` | Sort direction |
| `limit` | integer 1–100 | `20` | Page size |
| `page` | integer ≥1 | `1` | Page number (1-indexed) |

> **Distinction from fulltext search**: When `?q=` is present the request is delegated to Meilisearch (see `get-blog-posts.md`). When `?search=` is present it uses PostgreSQL ILIKE. They are mutually exclusive; `?q=` takes precedence.

---

## Example Request

```
GET /api/blog/posts?search=quarterly&sort_by=title&sort_dir=asc&page=1&limit=20
```

---

## Response: 200 OK

```json
{
  "items": [
    {
      "id": "6ba7b810-9dad-11d1-80b4-00c04fd430c8",
      "title": "Q1 Quarterly Review",
      "body_excerpt": "This post covers the quarterly metrics…",
      "author_display": "Jane Smith",
      "created_at": "2026-03-01T12:00:00Z",
      "updated_at": "2026-03-01T12:00:00Z",
      "is_edited": false
    }
  ],
  "total": 1
}
```

---

## Notes

- Returns the same `BlogPostListResponse` schema as the public list endpoint.
- `body_excerpt` is the first 200 characters of plain text (HTML tags stripped).
- `author_display` falls back to the creator's `display_name` when `author` is null.
- `is_edited` is `true` when `updated_at > created_at`.
