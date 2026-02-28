# Feature Specification: Media Persistence (Avatar Storage)

**Feature Branch**: `004-media-persistence`
**Created**: 2026-02-27
**Status**: Draft
**Input**: User description: "avatar and other media persistence. for example avatar need to be stored and retrievable."

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Avatar Survives Server Restarts (Priority: P1)

A user uploads their avatar. After the server is restarted, redeployed, or the container is recreated, the user can still see and retrieve their avatar exactly as they uploaded it. The avatar does not disappear or return a broken image.

**Why this priority**: The current implementation stores avatar files on the container's local filesystem, which is ephemeral. Files are silently lost on every restart or redeployment, making the avatar feature effectively non-functional in production. This is the most critical gap to close.

**Independent Test**: Upload an avatar, restart the backend service, load the profile page — the avatar image must still display correctly.

**Acceptance Scenarios**:

1. **Given** a user has uploaded an avatar, **When** the backend service is restarted, **Then** the avatar is still visible and loads without error on the profile page.
2. **Given** a user has uploaded an avatar, **When** the user logs out and logs back in, **Then** the avatar URL returned by the profile endpoint still serves the correct image.
3. **Given** an avatar has been stored, **When** any number of subsequent deployments occur, **Then** the avatar remains retrievable with the same URL.

---

### User Story 2 - Avatar Upload and Retrieval (Priority: P2)

An authenticated user can upload an image file as their profile avatar. The avatar is stored durably and the profile page displays it immediately. A previously set avatar can be replaced or removed.

**Why this priority**: This is the primary user-facing interaction. It must work end-to-end with durable storage, not just in-memory or local-disk scenarios.

**Independent Test**: Upload an avatar via the profile page, refresh the page, confirm the image displays. Delete the avatar, confirm the placeholder returns. Upload a new avatar to replace it.

**Acceptance Scenarios**:

1. **Given** an authenticated user on the profile page, **When** they upload a valid image (JPEG, PNG, GIF, or WebP up to 5 MB), **Then** the avatar is stored durably and immediately shown on their profile.
2. **Given** a user with an existing avatar, **When** they upload a new image, **Then** the new image replaces the old one and is displayed; the old file is no longer returned.
3. **Given** a user with an existing avatar, **When** they remove it, **Then** the avatar placeholder is shown and the previously stored file is no longer accessible to them.
4. **Given** a user attempts to upload a file exceeding 5 MB, **When** the upload is submitted, **Then** the system rejects it with a clear size-limit message and no file is stored.
5. **Given** a user attempts to upload a non-image file (e.g., PDF, executable), **When** the upload is submitted, **Then** the system rejects it with a clear format error and no file is stored.

---

### User Story 3 - Other Media Types (Priority: P3)

The media storage system is designed to be extensible so that future media types (such as attachments, exports, or report files) can be stored and retrieved using the same durable persistence mechanism established for avatars.

**Why this priority**: The user explicitly mentioned "other media" as future scope. Building the avatar storage on a general-purpose, extensible storage layer now avoids a rework when other media types are needed.

**Independent Test**: The storage abstraction handles a second media type (e.g., a dummy document file) stored and retrieved through the same mechanism as avatars, without changes to the storage layer itself.

**Acceptance Scenarios**:

1. **Given** a new media category is introduced (e.g., documents), **When** it uses the same storage layer as avatars, **Then** the files are stored and retrieved without modifying the core persistence mechanism.

---

### Edge Cases

- What happens when the storage system is temporarily unavailable during an upload? The upload must fail with a clear error; no partial or corrupt file should be recorded.
- What happens if the same user uploads a second avatar before the first upload completes? The system must ensure only one avatar is active at a time; the most recent successful upload wins.
- How does the system handle very large files just at the 5 MB limit? Files at exactly 5 MB must be accepted; files at 5 MB + 1 byte must be rejected.
- What if an avatar file is corrupted or unreadable at retrieval time? The system must return a clear error (not a broken image) and the user should be prompted to re-upload.

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: Uploaded avatar image files MUST be stored in a durable location that survives backend service restarts and redeployments.
- **FR-002**: The system MUST accept avatar uploads in JPEG, PNG, GIF, and WebP formats up to 5 MB in size.
- **FR-003**: The system MUST reject uploads that exceed 5 MB or are not a supported image format, returning a clear error message.
- **FR-004**: After a successful upload, the user's profile MUST reflect the new avatar URL and the image MUST be retrievable at that URL.
- **FR-005**: Removing an avatar MUST make the associated stored file inaccessible to the user, and the profile MUST revert to showing the placeholder.
- **FR-006**: Replacing an avatar MUST deactivate the previous avatar so only the most recently uploaded image is served as the active avatar.
- **FR-007**: The media storage mechanism MUST be usable by future media categories (documents, exports, etc.) without redesigning the storage layer.
- **FR-008**: Avatar images MUST only be accessible to authenticated users; unauthenticated requests for avatar images MUST be rejected.

### Key Entities

- **Media File**: A binary file (image or other type) uploaded by a user. Has an owner, a content type, a size, a storage location, and an active/inactive status.
- **Avatar**: A specialised media file that represents a user's profile image. Only one avatar is active per user at any time.
- **Storage Location**: The durable location reference (path or identifier) where a media file is persisted. Must remain valid across service restarts and redeployments.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: Avatars uploaded by users are retrievable without error after at least one full backend service restart or redeployment, 100% of the time.
- **SC-002**: Users can upload, view, replace, and remove their avatar entirely within the profile page with no page refresh or manual intervention required.
- **SC-003**: Upload validation rejects invalid files (wrong format, oversized) in 100% of cases and returns a user-readable error message.
- **SC-004**: The storage mechanism supports at least one additional media category (beyond avatars) being stored and retrieved without modifying the core storage layer.
- **SC-005**: Avatar images are not accessible to unauthenticated users in 100% of retrieval attempts.

## Assumptions

- The current avatar upload and removal API endpoints already exist; this feature focuses on replacing the ephemeral local-disk storage with a durable alternative.
- "Durable storage" means persistent across container restarts. Object storage (e.g., S3-compatible service) or a volume-backed filesystem are both acceptable approaches — the choice is a planning-phase decision.
- A user may have at most one active avatar at a time; the "other media" story does not require multi-file management for avatars.
- File size limit (5 MB) and supported image types (JPEG, PNG, GIF, WebP) carry over from the existing implementation and are not changing with this feature.
- Access control scope is limited to "authenticated user can access their own avatar." Cross-user avatar access is out of scope.
