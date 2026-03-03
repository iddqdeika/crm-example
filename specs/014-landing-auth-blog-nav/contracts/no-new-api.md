# Contract: No New API (014-landing-auth-blog-nav)

**Feature**: 014-landing-auth-blog-nav

## Summary

This feature does **not** add or change any backend HTTP API. It uses existing endpoints only:

- **Auth**: `POST /api/auth/login`, `POST /api/auth/signup` — unchanged.
- **Blog**: `GET /api/blog/posts`, management endpoints — unchanged.
- **Profile**: Existing profile/role for nav visibility — unchanged.

All changes are frontend-only: labels (Sign in, Sign up, Blog, Manage posts), nav order and visibility, visitor header, and manage page titles/breadcrumbs. No new query params, headers, or response fields required.
