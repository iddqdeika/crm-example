# HTTP API Contracts: Adtech Landing & Profile Auth

## Overview

The backend exposes a JSON/HTML HTTP API for landing, authentication, profile management, and
admin user management. All authenticated endpoints require a valid session cookie.

## Public Landing & Auth

### GET `/`

- **Description**: Render the adtech-themed marketing landing page.
- **Auth**: Not required.
- **Response**:
  - `200 OK`: HTML landing page.

### POST `/auth/signup`

- **Description**: Create a new user account and start an authenticated session.
- **Auth**: Not required.
- **Request (JSON)**:
  - `email` (string, required)
  - `password` (string, required)
  - `display_name` (string, required)
- **Responses**:
  - `201 Created`: User created; sets HTTP-only session cookie.
  - `400 Bad Request`: Validation errors (e.g., weak password, invalid email).
  - `409 Conflict`: Email already in use.

### POST `/auth/login`

- **Description**: Authenticate an existing user and start a session.
- **Auth**: Not required.
- **Request (JSON)**:
  - `email` (string, required)
  - `password` (string, required)
- **Responses**:
  - `200 OK`: Authentication successful; sets/refreshes HTTP-only session cookie.
  - `400 Bad Request`: Missing/invalid input.
  - `401 Unauthorized`: Invalid credentials.

### POST `/auth/logout`

- **Description**: Terminate the current session.
- **Auth**: Required (session cookie).
- **Request**: No body.
- **Responses**:
  - `204 No Content`: Session terminated (cookie invalidated/cleared).

## Profile

### GET `/me/profile`

- **Description**: Fetch the authenticated user’s profile details.
- **Auth**: Required.
- **Response (JSON)**:
  - `id` (string)
  - `display_name` (string)
  - `email` (string)
  - `avatar_url` (string or null)
- **Responses**:
  - `200 OK`: Profile returned.
  - `401 Unauthorized`: No valid session.

### PATCH `/me/password`

- **Description**: Change the authenticated user’s password.
- **Auth**: Required.
- **Request (JSON)**:
  - `current_password` (string, required)
  - `new_password` (string, required)
- **Responses**:
  - `204 No Content`: Password changed successfully.
  - `400 Bad Request`: New password does not meet rules.
  - `401 Unauthorized`: Current password incorrect or session invalid.

### POST `/me/avatar`

- **Description**: Upload or replace the authenticated user’s avatar.
- **Auth**: Required.
- **Request**:
  - `multipart/form-data` with:
    - `file` (image, required)
- **Responses**:
  - `201 Created`: Avatar stored; returns metadata and URL.
  - `400 Bad Request`: File too large or unsupported format.
  - `401 Unauthorized`: Session invalid.

### DELETE `/me/avatar`

- **Description**: Remove the authenticated user’s avatar.
- **Auth**: Required.
- **Responses**:
  - `204 No Content`: Avatar removed; profile falls back to default avatar.

## Admin

### GET `/admin/users`

- **Description**: List users for administration.
- **Auth**: Admin role required.
- **Request**:
  - Optional query parameters for pagination/filtering (e.g., `page`, `page_size`, `email`).
- **Response (JSON)**:
  - `items`: array of user summaries
  - `total`: total count
- **Responses**:
  - `200 OK`: List returned.
  - `403 Forbidden`: Authenticated but not an admin.

### GET `/admin/users/{user_id}`

- **Description**: Fetch details for a specific user.
- **Auth**: Admin role required.
- **Responses**:
  - `200 OK`: User details (similar to profile plus role and status).
  - `404 Not Found`: User not found.
  - `403 Forbidden`: Not an admin.

### PATCH `/admin/users/{user_id}`

- **Description**: Update selected user attributes (e.g., role, activation status).
- **Auth**: Admin role required.
- **Request (JSON)**:
  - Optional fields, such as:
    - `role` (string: `standard` or `admin`)
    - `is_active` (boolean)
- **Responses**:
  - `204 No Content`: Update successful.
  - `400 Bad Request`: Invalid update.
  - `404 Not Found`: User not found.
  - `403 Forbidden`: Not an admin.

