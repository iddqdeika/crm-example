# Research: Media Persistence (Avatar Storage)

**Feature**: 004-media-persistence
**Date**: 2026-02-27
**Key constraint from user**: "for maintenance and scalability media persistence must be standalone service like s3-compatible minio"

---

## R1 — Storage Backend: MinIO (S3-Compatible Object Storage)

**Decision**: Use **MinIO** as the object storage service. The backend communicates with it via the S3 protocol using the `boto3` Python library (AWS SDK, fully S3-compatible).

**Rationale**:
- MinIO is self-hosted, S3-compatible, Docker-native, and free. Deploying it as a Docker Compose service satisfies the user's explicit requirement for a standalone service.
- `boto3` is the de facto Python S3 client with excellent async-compatible usage patterns. Its interface is identical to AWS S3, so swapping to real S3 in production requires only an env-var change (endpoint URL, credentials).
- MinIO runs as a single container with a Docker volume for data — zero external dependencies. Its management console (port 9001) provides visibility into stored objects for local development.
- Alternative (`minio` Python SDK): Also valid, but `boto3` is more widely known, better documented, and easier to mock in tests via `moto` or direct patching.

**Alternatives considered**:
- **Local filesystem with Docker volume**: Simpler but couples storage to the backend container; doesn't satisfy the "standalone service" requirement. Rejected.
- **MinIO Python SDK** instead of boto3: Works, but `boto3` is more standard and easier to test-mock. Rejected.
- **AWS S3** (real): Valid for production but requires cloud credentials for local dev. MinIO provides the same API locally. Use MinIO in dev/test, S3 in prod via env-vars.

---

## R2 — Storage Abstraction Layer

**Decision**: Introduce a thin `StorageClient` abstraction in `backend/src/core/storage.py` with two methods: `put_object(key, data, content_type)` and `delete_object(key)`. The avatar service calls this abstraction rather than writing to the filesystem.

**Rationale**:
- Decouples business logic (avatar upload/remove) from the storage backend. The `avatar_service.py` should not know whether objects are in MinIO, S3, or a test fake.
- Tests can inject a fake/mock `StorageClient` without hitting MinIO — satisfies the constitution's Testability First principle.
- FR-007 (extensibility for future media types) is naturally satisfied: any new media category uses the same `StorageClient` interface.

**Key interface**:
```python
class StorageClient(Protocol):
    async def put_object(self, key: str, data: bytes, content_type: str) -> None: ...
    async def delete_object(self, key: str) -> None: ...
    async def get_presigned_url(self, key: str, expires_seconds: int = 3600) -> str: ...
```

**Alternatives considered**:
- Direct `boto3` calls in `avatar_service.py`: Works but makes unit testing harder (must patch boto3 globally) and violates Testability First. Rejected.
- `aioboto3` (fully async S3 client): Cleaner for async FastAPI, but adds a dependency and `boto3` with `run_in_executor` is battle-tested. Use sync `boto3` calls wrapped in `asyncio.get_event_loop().run_in_executor(None, ...)`. Revisit for async if performance warrants it.

---

## R3 — Avatar URL Strategy: Presigned URLs vs Proxy

**Decision**: Use **presigned URLs** from MinIO/S3 for serving avatar images directly, instead of proxying through the backend.

**Rationale**:
- Presigned URLs are time-limited (default 1 hour), signed by MinIO. The browser fetches the image directly from MinIO — the backend is not in the data path. This is more scalable and removes bandwidth from the backend.
- The `avatar_url` returned by `GET /me/profile` becomes a short-lived presigned URL. The frontend already stores and uses this URL directly (no change needed to frontend logic).
- MinIO presigned URLs work in local dev via `http://localhost:9000` (MinIO's public port). A `STORAGE_PUBLIC_URL` env var controls the publicly accessible host, separate from the internal `STORAGE_ENDPOINT_URL`.

**Avatar URL lifecycle**:
1. User uploads avatar → stored in MinIO at key `avatars/{user_id}/{avatar_id}.{ext}`
2. `GET /me/profile` generates a presigned URL (1-hour TTL) for that key and returns it as `avatar_url`
3. Frontend renders `<img src={avatar_url}>` — image is served directly from MinIO
4. On next profile fetch, a fresh presigned URL is generated (transparent to the user)

**Alternatives considered**:
- **Backend proxy** (keep current `/me/avatar/{id}/image` endpoint, read from MinIO): Keeps auth enforcement in the backend. Simpler to implement but puts image bandwidth through the backend. Rejected in favour of presigned URLs — FR-008 (auth) is satisfied by the presigned URL's signature (only generated for authenticated requests).
- **Public bucket + permanent URLs**: Simpler but exposes all avatars publicly without auth. Rejected (violates FR-008).

---

## R4 — Object Key Scheme

**Decision**: Object keys follow the pattern `avatars/{user_id}/{avatar_id}{ext}`. The `Avatar.storage_path` column stores this key (not a local filesystem path). All MinIO operations use this key.

**Rationale**:
- User-scoped prefix enables per-user operations (e.g., "delete all of this user's files").
- Avatar ID in the key makes it globally unique and directly traceable to the DB record.
- Extension preserved for content-type inference if needed.

---

## R5 — MinIO Docker Compose Service

**Decision**: Add MinIO as a new service in `docker/docker-compose.dev.yml`. Use the official `minio/minio:latest` image. Expose port `9000` (S3 API) and `9001` (web console). Use a named Docker volume `minio_data` for persistence.

**Configuration via env vars** (added to `.env` / `.env.example`):
```
MINIO_ROOT_USER=minioadmin
MINIO_ROOT_PASSWORD=minioadmin
STORAGE_ENDPOINT_URL=http://minio:9000        # internal (backend → minio)
STORAGE_PUBLIC_URL=http://localhost:9000       # external (browser → minio)
STORAGE_ACCESS_KEY=minioadmin
STORAGE_SECRET_KEY=minioadmin
STORAGE_BUCKET=qualityboard-media
```

**Bucket creation**: An `mc` (MinIO Client) init container or startup script creates the `qualityboard-media` bucket and sets its policy to private on first run.

**Alternatives considered**:
- `minio/minio:RELEASE.2024-*` (pinned version): Better for reproducibility. Recommended for production; use `latest` for dev simplicity.
- Separate `docker-compose.storage.yml`: More modular but adds complexity. A single dev compose file is simpler to run.

---

## R6 — Testing Strategy

**Decision**: Unit tests for `avatar_service.py` mock the `StorageClient` via a `FakeStorageClient` class (in-memory dict). Contract tests for the API use a real FastAPI test client with the `FakeStorageClient` injected via FastAPI dependency override. No real MinIO connection in CI.

**Rationale**:
- Real MinIO in CI requires a running Docker service per test run. The `FakeStorageClient` achieves the same behavior deterministically.
- The storage abstraction (R2) makes this straightforward — inject the fake via the same interface.
- Existing contract test pattern (`backend/tests/contract/`) is followed.

**Test coverage targets**:
- `upload_avatar`: stores object, creates DB record, links to profile, rejects invalid type/size
- `remove_avatar`: calls `delete_object` on the key, clears `profile.avatar_id`
- `GET /me/profile`: presigned URL present and correctly formatted when avatar exists
- `POST /me/avatar`: 201 with valid image, 400 with oversized/wrong-type file
- `DELETE /me/avatar`: 204, profile avatar_url is None after removal
- `GET /me/avatar/{id}/image`: 401 without auth (presigned URL route may be removed)

---

## R7 — Migration: `Avatar.storage_path` column

**Decision**: No schema migration needed for the `Avatar` model. The `storage_path` column already exists as `String(512)` and will store the MinIO object key (e.g., `avatars/uuid/uuid.jpg`) instead of the local filesystem path. Existing rows with filesystem paths will have broken keys in MinIO — acceptable since this is development, not production data.

**Rationale**: The column type and length are sufficient for MinIO object keys. No structural changes required.

---

## R8 — Python Dependencies

**Decision**: Add `boto3` and `types-boto3` to `backend` requirements.

```
boto3>=1.34
types-boto3[s3]>=1.34   # type stubs
```

`boto3` is synchronous; S3 calls will be wrapped with `asyncio.get_event_loop().run_in_executor(None, ...)` to avoid blocking the async event loop.

**Alternatives considered**:
- `aioboto3`: Fully async wrapper around `boto3`. Adds a layer of complexity; `run_in_executor` with sync `boto3` is simpler and sufficient for file upload operations.
