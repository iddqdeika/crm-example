# Data Model: Adtech Landing & Profile Auth

## Overview

The data model supports users with roles (standard/admin), their profiles, avatar metadata,
and authentication sessions.

## Entities

### User

- **Purpose**: Represents an individual account holder in the system.
- **Fields**:
  - `id` (UUID, primary key)
  - `email` (string, unique, required)
  - `hashed_password` (string, required)
  - `display_name` (string, required)
  - `role` (enum: `standard`, `admin`, required)
  - `is_active` (boolean, default true)
  - `created_at` (timestamp, required)
  - `updated_at` (timestamp, required)
- **Relationships**:
  - One-to-one with `Profile` (a user has exactly one profile record).
  - One-to-many with `AuthenticationSession` (a user can have multiple active sessions).
  - One-to-one or one-to-many with `Avatar` (depending on whether history is kept; start
    with one active avatar).
- **Validation rules**:
  - `email` must be well-formed and normalized (e.g., lowercase).
  - `hashed_password` must be produced by an approved hashing algorithm (e.g., bcrypt/argon2)
    with appropriate work factor.
  - `role` must be either `standard` or `admin`.
- **State transitions**:
  - `is_active` can move from true → false when accounts are disabled; disabled users cannot
    sign in or change profile data.

### Profile

- **Purpose**: Represents user-facing account information displayed on the profile page.
- **Fields**:
  - `id` (UUID, primary key)
  - `user_id` (UUID, foreign key to `User.id`, unique)
  - `display_name` (string, may mirror `User.display_name`)
  - `email` (string, read-only copy of user email for display)
  - `bio` (string, optional, for future use)
  - `avatar_id` (UUID, nullable foreign key to `Avatar.id`)
  - `updated_at` (timestamp, required)
- **Relationships**:
  - Belongs to exactly one `User`.
  - Optionally references one `Avatar` as the current profile image.
- **Validation rules**:
  - `user_id` must reference an existing, active user.
  - `display_name` length bounded to a reasonable maximum (e.g., 80 characters).

### Avatar

- **Purpose**: Represents metadata about a user’s avatar image.
- **Fields**:
  - `id` (UUID, primary key)
  - `user_id` (UUID, foreign key to `User.id`)
  - `storage_path` (string, required; e.g., object storage key or local path)
  - `content_type` (string, required; e.g., `image/png`)
  - `file_size_bytes` (integer, required)
  - `created_at` (timestamp, required)
  - `is_active` (boolean, default true)
- **Relationships**:
  - Belongs to one `User`.
- **Validation rules**:
  - `file_size_bytes` must not exceed configured maximum avatar size.
  - `content_type` must be one of the allowed image MIME types.
- **State transitions**:
  - `is_active` can be set to false when an avatar is replaced or removed.

### AuthenticationSession

- **Purpose**: Represents an authenticated session for a user.
- **Fields**:
  - `id` (UUID, primary key)
  - `user_id` (UUID, foreign key to `User.id`)
  - `created_at` (timestamp, required)
  - `expires_at` (timestamp, required)
  - `revoked_at` (timestamp, nullable)
  - `ip_address` (string, optional)
  - `user_agent` (string, optional)
- **Relationships**:
  - Belongs to one `User`.
- **Validation rules**:
  - `expires_at` must be greater than `created_at`.
- **State transitions**:
  - Active → expired when current time passes `expires_at`.
  - Active → revoked when `revoked_at` is set (e.g., user logs out or admin terminates
    sessions).

