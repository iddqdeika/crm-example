# Data Model: Sign Up / Sign In at Top of Landing with Design-Document UI

**Feature**: 015-landing-top-signin-signup

## Summary

This feature does **not** introduce new database entities, API payloads, or persistent storage. It only affects the **visual design and placement** of existing Sign up and Sign in controls at the top of the landing page (visitor header). No migrations, no new tables, no new API shapes.

## Entities (unchanged)

| Entity | Use in this feature |
|--------|----------------------|
| User / session | Unauthenticated visitors see the top-area Sign up/Sign in; authenticated users see a different header (out of scope). |
| Design document | Source of truth for typography, color, spacing, and touch-target rules applied to the top auth controls. |
