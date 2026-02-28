# Quickstart: Media Persistence (Avatar Storage)

**Feature**: 004-media-persistence
**Branch**: `004-media-persistence`

---

## Prerequisites

- Docker Desktop running
- Node.js 18+ and Python 3.12+ (for local dev outside Docker)
- `.env` file at repo root (copy from `.env.example`, adjust as needed)

---

## New Environment Variables

Add to `.env` (and `.env.example`):

```env
MINIO_ROOT_USER=minioadmin
MINIO_ROOT_PASSWORD=minioadmin
STORAGE_ENDPOINT_URL=http://minio:9000
STORAGE_PUBLIC_URL=http://localhost:9000
STORAGE_ACCESS_KEY=minioadmin
STORAGE_SECRET_KEY=minioadmin
STORAGE_BUCKET=qualityboard-media
```

---

## Running the Full Stack (with MinIO)

```bash
cd docker
docker compose -f docker-compose.dev.yml up --build
```

Services started:
| Service | URL | Notes |
|---|---|---|
| Frontend | http://localhost:3000 | React app |
| Backend | http://localhost:8000 | FastAPI |
| PostgreSQL | localhost:5432 | DB |
| MinIO S3 API | http://localhost:9000 | Object storage |
| MinIO Console | http://localhost:9001 | Web UI (minioadmin/minioadmin) |

The `minio-init` service creates the `qualityboard-media` bucket automatically on first start.

---

## Running Backend Tests

```bash
cd backend
pip install -e ".[dev]"
pytest tests/ -v
```

Tests use `FakeStorageClient` — no MinIO instance required.

---

## Key Files Changed / Added

### New Files
| File | Purpose |
|---|---|
| `backend/src/core/storage.py` | `StorageClient` Protocol + `S3StorageClient` + `get_storage_client` DI |
| `backend/tests/fakes/fake_storage.py` | `FakeStorageClient` for tests |
| `backend/tests/unit/test_avatar_service.py` | Unit tests for avatar upload/remove with fake storage |
| `backend/tests/contract/test_avatar_api.py` | Contract tests for `POST /me/avatar`, `DELETE /me/avatar` |

### Modified Files
| File | Change |
|---|---|
| `backend/src/services/avatar_service.py` | Replace filesystem writes with `StorageClient` calls; accept `storage: StorageClient` param |
| `backend/src/api/profile.py` | Inject `StorageClient`; pass to service; return presigned URL via `avatar_service.avatar_url_for` |
| `backend/src/core/settings.py` | Add `storage_*` settings fields |
| `backend/src/services/profile_service.py` | Accept `storage: StorageClient`; generate presigned URL for `avatar_url` |
| `docker/docker-compose.dev.yml` | Add `minio` service + `minio-init` service + `minio_data` volume |
| `.env.example` | Document new storage env vars |

---

## Post-Implementation Verification Checklist

- [ ] `docker compose up` starts 5 services without errors
- [ ] MinIO console accessible at http://localhost:9001 (minioadmin/minioadmin)
- [ ] `qualityboard-media` bucket exists in MinIO console after first start
- [ ] Log in to the app, go to Profile, upload a JPEG avatar → avatar appears immediately
- [ ] Restart the backend container (`docker compose restart backend`) → avatar still appears
- [ ] Upload a second avatar → only the new avatar is shown; old key is absent from MinIO bucket
- [ ] Delete avatar → placeholder shown; MinIO bucket no longer contains the old key
- [ ] Try uploading a 6 MB file → rejected with a size error message
- [ ] Try uploading a `.pdf` → rejected with a format error message
- [ ] Open avatar URL in a private/incognito browser session without cookies → returns a signed URL expiry error (not the image)
- [ ] All backend tests pass: `pytest tests/ -v` (no MinIO connection required)
