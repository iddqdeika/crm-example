# API Contract: Avatar Endpoints

**Service**: Backend (FastAPI)
**Version**: 1.0.0
**Feature**: 004-media-persistence

---

## POST /me/avatar

Upload or replace the authenticated user's avatar.

**Authentication**: Required (session cookie)

**Request**:
- Content-Type: `multipart/form-data`
- Body field: `file` — image file (JPEG, PNG, GIF, or WebP; max 5 MB)

**Responses**:

| Status | Condition | Body |
|---|---|---|
| 201 Created | Upload accepted and stored | `{ "id": "<uuid>", "avatar_url": "<presigned-url>", "content_type": "image/jpeg", "file_size_bytes": 12345 }` |
| 400 Bad Request | Unsupported content type | `{ "detail": "Unsupported image type. Allowed: JPEG, PNG, GIF, WebP." }` |
| 400 Bad Request | File exceeds 5 MB | `{ "detail": "File too large. Maximum allowed size is 5 MB." }` |
| 401 Unauthorized | No valid session | `{ "detail": "Not authenticated" }` |
| 503 Service Unavailable | Storage backend unavailable | `{ "detail": "Storage service unavailable. Please try again." }` |

**Side effects**:
- Previous active avatar's object is deleted from MinIO.
- `Profile.avatar_id` is updated to the new `Avatar.id`.
- Old `Avatar` record is removed or deactivated.

---

## DELETE /me/avatar

Remove the authenticated user's avatar.

**Authentication**: Required (session cookie)

**Responses**:

| Status | Condition | Body |
|---|---|---|
| 204 No Content | Avatar removed (or no avatar existed) | (empty) |
| 401 Unauthorized | No valid session | `{ "detail": "Not authenticated" }` |

**Side effects**:
- Active avatar's object is deleted from MinIO.
- `Profile.avatar_id` is set to `null`.

---

## GET /me/profile (modified)

Returns the user's profile. The `avatar_url` field is now a **presigned URL** from MinIO (valid for 1 hour) instead of a backend proxy URL.

**Authentication**: Required (session cookie)

**Response (200 OK)**:
```json
{
  "id": "<profile-uuid>",
  "display_name": "Alice",
  "email": "alice@example.com",
  "avatar_url": "http://localhost:9000/qualityboard-media/avatars/user-id/avatar-id.jpg?X-Amz-Algorithm=...&X-Amz-Expires=3600&...",
  "role": "standard"
}
```

When no avatar is set, `avatar_url` is `null`.

**Breaking change note**: The `avatar_url` value changes from `/me/avatar/{id}/image` (backend proxy) to a MinIO presigned URL. Clients (frontend) that already render `<img src={avatar_url}>` work without change since the URL is self-contained.

---

## Removed Endpoint: GET /me/avatar/{avatar_id}/image

This endpoint (backend image proxy) is removed. Image delivery is handled directly by MinIO via presigned URLs.

**Migration**: All consumers of this endpoint must switch to using the `avatar_url` from `GET /me/profile` or equivalent profile endpoints.

---

## Storage Service Contract (`StorageClient` Protocol)

This is an internal contract between the backend and the storage layer.

```python
class StorageClient(Protocol):
    async def put_object(
        self, key: str, data: bytes, content_type: str
    ) -> None:
        """Store bytes at the given key. Raises StorageError on failure."""
        ...

    async def delete_object(self, key: str) -> None:
        """Delete the object at the given key. No-op if key does not exist."""
        ...

    async def get_presigned_url(
        self, key: str, expires_seconds: int = 3600
    ) -> str:
        """Return a time-limited URL that allows direct download of the object."""
        ...
```

**Error type**: `StorageError(Exception)` — raised by `S3StorageClient` when the MinIO/S3 service is unreachable or returns an unexpected error. The API layer catches this and returns 503.
