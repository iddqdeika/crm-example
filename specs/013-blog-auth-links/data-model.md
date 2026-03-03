# Data Model: Blog Login and Register Links

**Feature**: 013-blog-auth-links

## Summary

This feature does **not** introduce new database entities, API payloads, or persistent storage. It uses the existing:

- **User / session**: Already provided by auth (login, signup, profile). No change.
- **Blog post / listing**: Already exposed by existing blog API. No change.

The only “state” involved is **client-side**: `sessionStorage.redirectAfterLogin` (already used by the app for post-login redirect). When the user clicks "Log in" or "Register" from a blog page, the frontend sets this to the current path (e.g. `/blog` or `/blog/post/<slug>`). After successful login or signup, the app reads it and redirects; then the key is cleared.

No migrations, no new tables, no new API request/response shapes.
