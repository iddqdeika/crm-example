# Tasks: Media Persistence (Avatar Storage)

**Input**: Design documents from `/specs/004-media-persistence/`
**Branch**: `004-media-persistence`
**Prerequisites**: plan.md ✅ spec.md ✅ research.md ✅ data-model.md ✅ contracts/ ✅ quickstart.md ✅

**Tests**: Per constitution and spec, TDD is MANDATORY. Test tasks appear before their corresponding implementation tasks. Tests MUST fail (RED) before implementation begins, and pass (GREEN) after.

**Organization**: Tasks grouped by user story for independent implementation and testing.

---

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: Add MinIO as a standalone Docker service and wire up new environment variables.

- [x] T001 Add `minio` service (port 9000/9001, named volume `minio_data`) to `docker/docker-compose.dev.yml`
- [x] T002 Add `minio-init` service (using `minio/mc` image) to `docker/docker-compose.dev.yml` that creates the `qualityboard-media` bucket and exits
- [x] T003 [P] Add `MINIO_ROOT_USER`, `MINIO_ROOT_PASSWORD`, `STORAGE_ENDPOINT_URL`, `STORAGE_PUBLIC_URL`, `STORAGE_ACCESS_KEY`, `STORAGE_SECRET_KEY`, `STORAGE_BUCKET` to `.env` and `.env.example`
- [x] T004 [P] Add `boto3>=1.34` and `types-boto3[s3]>=1.34` to `backend/pyproject.toml` (or `requirements*.txt`) dev and runtime dependencies

**Checkpoint**: `docker compose up` starts MinIO on port 9000 and the init container creates the bucket. MinIO console accessible at http://localhost:9001.

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Storage abstraction and test infrastructure that ALL user stories depend on.

**⚠️ CRITICAL**: No user story work can begin until this phase is complete.

- [x] T005 Add `storage_endpoint_url`, `storage_public_url`, `storage_access_key`, `storage_secret_key`, `storage_bucket` fields to `Settings` class in `backend/src/core/settings.py`
- [x] T006 Create `backend/src/core/storage.py` with: `StorageClient` Protocol (methods: `put_object`, `delete_object`, `get_presigned_url`), `StorageError` exception class, `S3StorageClient` concrete implementation using `boto3` (sync calls wrapped in `run_in_executor`), and `get_storage_client()` FastAPI DI function
- [x] T007 Create `backend/tests/fakes/__init__.py` and `backend/tests/fakes/fake_storage.py` with `FakeStorageClient` (in-memory `dict[str, bytes]` store; `get_presigned_url` returns `http://fake-storage/{key}`)
- [x] T008 Write unit tests for `FakeStorageClient` in `backend/tests/unit/test_fake_storage.py`: assert `put_object` stores data, `delete_object` removes it, `get_presigned_url` returns expected URL shape, `delete_object` on missing key is a no-op — **these tests MUST pass before proceeding** (they test the test helper itself)

**Checkpoint**: Foundation ready — `FakeStorageClient` verified, `StorageClient` protocol and `S3StorageClient` exist, settings fields added.

---

## Phase 3: User Story 1 — Avatar Survives Server Restarts (Priority: P1) 🎯 MVP

**Goal**: Refactor `avatar_service.py` to store files in MinIO via `StorageClient` instead of the local filesystem. After this phase, uploaded avatars persist across backend container restarts.

**Independent Test**: Upload an avatar via `POST /me/avatar` in tests, restart the backend (or re-create the test client), then `GET /me/profile` and confirm `avatar_url` is non-null and the `FakeStorageClient` still holds the object.

### Tests for User Story 1 (write FIRST — must FAIL before T015/T016)

- [x] T009 [P] [US1] Write unit test `test_upload_avatar_stores_to_storage_client` in `backend/tests/unit/test_avatar_service.py`: call `upload_avatar(db, user, file_content, "image/jpeg", "photo.jpg", storage_client=fake)`, assert `fake.objects` contains the expected key `avatars/{user_id}/{avatar_id}.jpg` with correct bytes
- [x] T010 [P] [US1] Write unit test `test_upload_avatar_rejects_invalid_type` in `backend/tests/unit/test_avatar_service.py`: pass `content_type="application/pdf"`, assert `ValueError` is raised and `fake.objects` is empty
- [x] T011 [P] [US1] Write unit test `test_upload_avatar_rejects_oversized_file` in `backend/tests/unit/test_avatar_service.py`: pass 5 MB + 1 byte content, assert `ValueError` raised and nothing stored
- [x] T012 [P] [US1] Write unit test `test_remove_avatar_deletes_from_storage_client` in `backend/tests/unit/test_avatar_service.py`: upload an avatar first, then call `remove_avatar(db, user, storage_client=fake)`, assert key is gone from `fake.objects` and `profile.avatar_id` is `None`
- [x] T013 [P] [US1] Write unit test `test_upload_avatar_replaces_existing` in `backend/tests/unit/test_avatar_service.py`: upload two avatars in sequence for the same user, assert only the second key exists in `fake.objects` (old key deleted) and `profile.avatar_id` points to the second avatar

### Implementation for User Story 1

- [x] T014 [US1] Refactor `backend/src/services/avatar_service.py`: replace `Path.write_bytes` with `await storage_client.put_object(key, data, content_type)`; add `storage_client: StorageClient` parameter to `upload_avatar` and `remove_avatar`; call `storage_client.delete_object(old_key)` before storing the new one in `upload_avatar`; call `storage_client.delete_object(avatar.storage_path)` in `remove_avatar` (depends on T009–T013 being RED)
- [x] T015 [US1] Update `backend/src/api/profile.py`: inject `storage: StorageClient = Depends(get_storage_client)` into `post_avatar` and `delete_avatar` endpoints; pass `storage` through to `avatar_service` functions (depends on T014)

**Checkpoint**: Run `pytest backend/tests/unit/test_avatar_service.py -v` — all 5 tests GREEN. Avatar files written to `FakeStorageClient.objects`, not to `uploads/` directory.

---

## Phase 4: User Story 2 — Avatar Upload and Retrieval (Priority: P2)

**Goal**: Full API-level cycle works end-to-end: `POST /me/avatar` stores durably, `GET /me/profile` returns a presigned URL, `DELETE /me/avatar` removes the file. The old `/me/avatar/{id}/image` backend-proxy endpoint is removed.

**Independent Test**: Using the FastAPI test client with `FakeStorageClient` injected: POST a valid image → assert 201 and `avatar_url` in response body; GET /me/profile → assert `avatar_url` starts with `http://fake-storage/`; DELETE /me/avatar → assert 204 and GET /me/profile returns `avatar_url: null`.

### Tests for User Story 2 (write FIRST — must FAIL before T021–T025)

- [x] T016 [P] [US2] Write contract test `test_post_avatar_returns_201` in `backend/tests/contract/test_avatar_api.py`: authenticated user POSTs a valid JPEG (<5 MB), assert 201 and response contains `id`, `avatar_url`, `content_type`, `file_size_bytes`
- [x] T017 [P] [US2] Write contract test `test_post_avatar_rejects_bad_type` in `backend/tests/contract/test_avatar_api.py`: POST a `text/plain` file, assert 400 and error detail mentions "Unsupported image type"
- [x] T018 [P] [US2] Write contract test `test_post_avatar_rejects_oversized` in `backend/tests/contract/test_avatar_api.py`: POST a 5 MB + 1 byte payload, assert 400 and error detail mentions "too large"
- [x] T019 [P] [US2] Write contract test `test_post_avatar_requires_auth` in `backend/tests/contract/test_avatar_api.py`: unauthenticated POST, assert 401
- [x] T020 [P] [US2] Write contract test `test_delete_avatar_returns_204` in `backend/tests/contract/test_avatar_api.py`: authenticated user with existing avatar calls DELETE, assert 204; follow up with GET /me/profile and assert `avatar_url` is null
- [x] T021 [P] [US2] Write contract test `test_delete_avatar_requires_auth` in `backend/tests/contract/test_avatar_api.py`: unauthenticated DELETE, assert 401
- [x] T022 [P] [US2] Write contract test `test_get_profile_avatar_url_is_presigned` in `backend/tests/contract/test_profile_api.py` (extend existing file): after uploading an avatar, GET /me/profile and assert `avatar_url` starts with `http://fake-storage/` (presigned URL shape, not old `/me/avatar/` path)

### Implementation for User Story 2

- [x] T023 [US2] Update `backend/src/services/profile_service.py`: replace `_avatar_url` inline URL builder with `await storage_client.get_presigned_url(avatar.storage_path)`; add `storage_client: StorageClient` parameter to `get_profile_for_response`; fetch the active `Avatar` row by `profile.avatar_id` to get its `storage_path` (depends on T022 being RED)
- [x] T024 [US2] Update `backend/src/api/profile.py`: inject `StorageClient` into `get_profile` endpoint and pass to `get_profile_for_response`; update `post_avatar` response body to include `avatar_url` from the newly generated presigned URL (depends on T016–T021 being RED)
- [x] T025 [US2] Remove the `GET /me/avatar/{avatar_id}/image` proxy endpoint from `backend/src/api/profile.py` and delete or update any existing tests that reference that route (depends on T023, T024)

**Checkpoint**: Run `pytest backend/tests/contract/ -v` — all avatar and profile tests GREEN. `POST /me/avatar` returns `avatar_url` with presigned URL shape. `GET /me/profile` `avatar_url` is a presigned URL. Old image proxy route returns 404.

---

## Phase 5: User Story 3 — Extensible Storage for Other Media (Priority: P3)

**Goal**: Verify that the `StorageClient` abstraction handles a second object key namespace (e.g., `documents/`) without changes to the storage layer.

**Independent Test**: Use `FakeStorageClient` directly: `put_object("documents/user-id/doc-id.pdf", b"data", "application/pdf")` then `get_presigned_url("documents/user-id/doc-id.pdf")` — both succeed without modifying `storage.py`.

### Tests for User Story 3 (write FIRST — must FAIL before T027)

- [x] T026 [P] [US3] Write unit test `test_storage_client_supports_arbitrary_key_prefix` in `backend/tests/unit/test_fake_storage.py`: put an object under `documents/` prefix, assert it is stored and retrievable with a presigned URL — test must pass with the existing `FakeStorageClient` (validates extensibility without code changes; if it fails the abstraction is too narrow)

### Implementation for User Story 3

- [x] T027 [US3] Add docstring examples to `backend/src/core/storage.py` illustrating how a second media category (e.g., `documents/{user_id}/{doc_id}.pdf`) uses the same `StorageClient` interface; add a `media_key(category, user_id, file_id, ext)` helper function that generates object keys for any category (depends on T026 GREEN)

**Checkpoint**: `test_storage_client_supports_arbitrary_key_prefix` GREEN. Storage layer documented as extensible. No changes to `StorageClient` protocol or `S3StorageClient` required.

---

## Phase 6: Polish & Cross-Cutting Concerns

- [x] T028 [P] Update `backend/src/api/profile.py` error handling: catch `StorageError` in `post_avatar` and return HTTP 503 with detail `"Storage service unavailable. Please try again."`
- [x] T029 [P] Write contract test `test_post_avatar_returns_503_on_storage_error` in `backend/tests/contract/test_avatar_api.py`: override storage dependency with a client that raises `StorageError`, POST valid avatar, assert 503 (must be RED before T028)
- [x] T030 [P] Confirm `uploads/` directory is no longer created by the backend: verify no `Path("uploads")` references remain in `backend/src/services/avatar_service.py`
- [x] T031 Run full backend test suite `pytest backend/tests/ -v` and confirm all tests pass; fix any regressions
- [ ] T032 Run quickstart.md post-implementation verification checklist end-to-end with `docker compose up`

---

## Dependencies & Execution Order

### Phase Dependencies

- **Phase 1 (Setup)**: No dependencies — start immediately
- **Phase 2 (Foundational)**: Depends on Phase 1 — **BLOCKS all user stories**
- **Phase 3 (US1)**: Depends on Phase 2 completion
- **Phase 4 (US2)**: Depends on Phase 3 completion (US2 builds on the refactored `avatar_service`)
- **Phase 5 (US3)**: Depends on Phase 2 completion — independent of US1/US2 implementation (tests the abstraction)
- **Phase 6 (Polish)**: Depends on Phase 3, 4, 5 all complete

### User Story Dependencies

- **US1 (P1)**: Core storage refactor — all other stories depend on this being done
- **US2 (P2)**: API-layer contract tests — depends on US1 service-layer changes
- **US3 (P3)**: Extensibility test — depends only on Phase 2 (foundational abstraction)

### Within Each User Story

- Tests (T009–T013 for US1, T016–T022 for US2, T026 for US3) MUST be written and FAIL before the corresponding implementation tasks
- Models before services; services before endpoints
- Implementation complete and all tests GREEN before moving to next story

### Parallel Opportunities

- T003, T004 (Phase 1): fully parallel
- T009–T013 (US1 tests): all parallel — different test functions in the same file
- T016–T022 (US2 tests): all parallel — different test functions
- T028, T029, T030 (Polish): all parallel

---

## Parallel Example: User Story 1 Tests

```bash
# All US1 unit tests can be written simultaneously (different test functions):
Task T009: test_upload_avatar_stores_to_storage_client
Task T010: test_upload_avatar_rejects_invalid_type
Task T011: test_upload_avatar_rejects_oversized_file
Task T012: test_remove_avatar_deletes_from_storage_client
Task T013: test_upload_avatar_replaces_existing

# Run all together:
pytest backend/tests/unit/test_avatar_service.py -v
```

## Parallel Example: User Story 2 Tests

```bash
# All US2 contract tests can be written simultaneously:
Task T016: test_post_avatar_returns_201
Task T017: test_post_avatar_rejects_bad_type
Task T018: test_post_avatar_rejects_oversized
Task T019: test_post_avatar_requires_auth
Task T020: test_delete_avatar_returns_204
Task T021: test_delete_avatar_requires_auth
Task T022: test_get_profile_avatar_url_is_presigned

# Run all together:
pytest backend/tests/contract/ -v
```

---

## Implementation Strategy

### MVP First (User Story 1 Only — Phases 1–3)

1. Complete Phase 1: Add MinIO to Docker Compose + env vars
2. Complete Phase 2: `StorageClient` abstraction + `FakeStorageClient` + settings
3. Complete Phase 3: Refactor `avatar_service.py` (TDD)
4. **STOP and VALIDATE**: `pytest backend/tests/unit/ -v` all GREEN; `docker compose restart backend` → avatar still in MinIO
5. Deploy or demo if ready

### Incremental Delivery

1. Phase 1 + Phase 2 → Infrastructure + abstraction ready
2. Phase 3 (US1) → Avatars now survive restarts (core durability) ✅
3. Phase 4 (US2) → Full API cycle with presigned URLs, old proxy removed ✅
4. Phase 5 (US3) → Extensibility proven ✅
5. Phase 6 (Polish) → Production-hardened ✅

---

## Notes

- `[P]` = can run in parallel with other `[P]` tasks in the same phase (different files, no shared state)
- `[US1]`, `[US2]`, `[US3]` = user story labels from `spec.md`
- All test tasks (T009–T013, T016–T022, T026, T029) MUST be RED before their implementation counterparts are written
- `FakeStorageClient` is the only storage backend used in all automated tests — no MinIO connection required in CI
- Commit after each checkpoint to keep a clean history
