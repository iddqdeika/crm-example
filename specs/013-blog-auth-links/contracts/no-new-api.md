# Contract: No New API (013-blog-auth-links)

**Feature**: 013-blog-auth-links

## Summary

This feature does **not** add or change any backend HTTP API. It uses existing endpoints only:

- **Auth**: `POST /api/auth/login`, `POST /api/auth/signup` — unchanged.
- **Blog**: `GET /api/blog/posts`, `GET /api/blog/posts/by-slug/:slug` (or by id) — unchanged.

Redirect-after-auth is implemented entirely on the client: set `sessionStorage.redirectAfterLogin` before navigating to login/signup; after success, the client reads it and redirects. No new query params, headers, or response fields required.
