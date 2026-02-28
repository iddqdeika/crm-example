# Data Model: Media Persistence (Avatar Storage)

**Feature**: 004-media-persistence
**Date**: 2026-02-27

---

## Existing Models (Unchanged Schema)

### `Avatar` (existing, `backend/src/models/avatar.py`)

No schema migration needed. The `storage_path` column stores the MinIO object key instead of a filesystem path.

| Column | Type | Notes |
|---|---|---|
| `id` | UUID PK | Generated, referenced by `Profile.avatar_id` |
| `user_id` | UUID FK → `users.id` | Owner of the file |
| `storage_path` | String(512) | **Changed semantics**: now stores MinIO object key, e.g. `avatars/{user_id}/{avatar_id}.jpg` |
| `content_type` | String | e.g. `image/jpeg` |
| `file_size_bytes` | Integer | Byte size of the uploaded file |

### `Profile` (existing, `backend/src/models/profile.py`)

No changes. `avatar_id` continues to reference the active `Avatar` record.

---

## New Code Artifacts (Not DB Entities)

### `StorageClient` Protocol (`backend/src/core/storage.py`)

A Python Protocol defining the storage interface. Not a DB model — this is a runtime abstraction.

```python
from typing import Protocol

class StorageClient(Protocol):
    async def put_object(
        self, key: str, data: bytes, content_type: str
    ) -> None: ...

    async def delete_object(self, key: str) -> None: ...

    async def get_presigned_url(
        self, key: str, expires_seconds: int = 3600
    ) -> str: ...
```

### `S3StorageClient` (`backend/src/core/storage.py`)

Concrete implementation backed by MinIO/S3 via `boto3`.

| Attribute | Description |
|---|---|
| `endpoint_url` | Internal URL for the S3 API (e.g. `http://minio:9000`) |
| `public_url` | Publicly accessible URL for presigned URLs (e.g. `http://localhost:9000`) |
| `access_key` | S3 access key |
| `secret_key` | S3 secret key |
| `bucket` | Bucket name (e.g. `qualityboard-media`) |

### `FakeStorageClient` (`backend/tests/fakes/fake_storage.py`)

In-memory implementation for tests. Stores objects in a `dict[str, bytes]`. Generates fake presigned URLs of the form `http://fake-storage/{key}`.

---

## Object Key Scheme

```
avatars/{user_id}/{avatar_id}{ext}
```

Examples:
- `avatars/550e8400-e29b.../a4b8e3c1-....jpg`
- `avatars/550e8400-e29b.../d9f2a7e0-....png`

The `ext` is derived from `content_type`:
- `image/jpeg` → `.jpg`
- `image/png`  → `.png`
- `image/gif`  → `.gif`
- `image/webp` → `.webp`

---

## Settings Additions (`backend/src/core/settings.py`)

New fields added to the `Settings` Pydantic model:

| Field | Env Var | Default | Description |
|---|---|---|---|
| `storage_endpoint_url` | `STORAGE_ENDPOINT_URL` | `http://localhost:9000` | Internal S3 endpoint (backend → MinIO) |
| `storage_public_url` | `STORAGE_PUBLIC_URL` | `http://localhost:9000` | Public S3 endpoint (browser → MinIO, for presigned URLs) |
| `storage_access_key` | `STORAGE_ACCESS_KEY` | `minioadmin` | S3 access key |
| `storage_secret_key` | `STORAGE_SECRET_KEY` | `minioadmin` | S3 secret key |
| `storage_bucket` | `STORAGE_BUCKET` | `qualityboard-media` | Target bucket name |

---

## Dependency Injection

The `StorageClient` is provided via FastAPI dependency injection:

```python
# backend/src/core/storage.py
def get_storage_client() -> StorageClient:
    settings = get_settings()
    return S3StorageClient(settings)
```

In tests, this dependency is overridden with `FakeStorageClient` via `app.dependency_overrides`.

---

## Data Flow Diagram

```
[Browser]
   |
   | POST /me/avatar (multipart)
   v
[FastAPI backend]
   |
   | avatar_service.upload_avatar(db, user, file, storage_client)
   |   1. Validate content_type and size
   |   2. storage_client.put_object(key, data, content_type)  → [MinIO]
   |   3. INSERT Avatar(storage_path=key, ...)                → [PostgreSQL]
   |   4. UPDATE Profile.avatar_id = avatar.id               → [PostgreSQL]
   v
[Response 201]

[Browser]
   |
   | GET /me/profile
   v
[FastAPI backend]
   |
   | storage_client.get_presigned_url(avatar.storage_path)   → [MinIO signs URL]
   | → returns { avatar_url: "http://localhost:9000/qualityboard-media/avatars/...?X-Amz-..." }
   v
[Browser fetches image directly from MinIO using presigned URL]
```
