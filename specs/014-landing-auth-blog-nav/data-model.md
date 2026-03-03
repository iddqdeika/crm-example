# Data Model: Landing Sign In/Sign Up, Blog Nav, Manage Posts Rename

**Feature**: 014-landing-auth-blog-nav

## Summary

This feature does **not** introduce new database entities, API payloads, or persistent storage. It uses the existing:

- **User / session**: Already provided by auth (login, signup, profile). No change.
- **Blog post / listing**: Already exposed by existing blog API. No change.
- **Profile (role)**: Already used for nav visibility (admin, content_manager, buyer). No change.

Changes are **UI-only**: labels ("Sign in", "Sign up", "Blog", "Manage posts"), nav order and visibility (Dashboard, Blog, Profile, then role-based Campaigns, Manage posts, Admin), and visitor header content. No migrations, no new tables, no new API request/response shapes.

## Entities (unchanged)

| Entity    | Use in this feature |
|-----------|----------------------|
| User      | Auth state for showing visitor vs logged-in header and nav. |
| Profile   | Role (admin, content_manager, buyer) for showing Campaigns, Manage posts, Admin links. |
| Blog post | Existing listing and management; only user-facing labels change to "Manage posts". |
