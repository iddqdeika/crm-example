# Implementation Plan: Landing Sign In/Sign Up, Blog Nav, and Manage Posts Rename

**Branch**: `014-landing-auth-blog-nav` | **Date**: 2026-02-26 | **Spec**: [spec.md](spec.md)  
**Input**: Feature specification from `specs/014-landing-auth-blog-nav/spec.md`

## Summary

Implement three UI/navigation changes: (1) Use "Sign in" and "Sign up" on the landing page in both the hero and a persistent header/nav, and ensure the same labels wherever auth entry points appear. (2) Add a "Blog" entry in the main nav between Dashboard and Profile that links to the public blog listing (`/blog`); show "Blog" to everyone (visitors and logged-in users). (3) Rename the existing blog management area to "Manage posts": nav link and all page titles/breadcrumbs use the label "Manage posts", and it appears as the fourth nav item (Dashboard, Blog, Profile, Manage posts) for users with content_manager or admin role. No new backend APIs or data model; frontend-only changes to landing, header/nav, and manage pages.

## Technical Context

**Language/Version**: Python 3.12+ (backend), TypeScript / React 18 (frontend)  
**Primary Dependencies**: React Router, existing AuthContext; FastAPI backend unchanged  
**Storage**: None (no new persistence; existing auth and blog APIs unchanged)  
**Testing**: Vitest + @testing-library/react (frontend unit), Playwright (E2E)  
**Target Platform**: Same as existing app (Docker Compose dev/e2e/prod)  
**Project Type**: Web application (frontend + backend; only frontend touched)  
**Performance Goals**: N/A (copy and nav changes)  
**Constraints**: Nav order and labels per spec; visitor header shows Blog + Sign in/Sign up; no new routes  
**Scale/Scope**: Landing, AppHeader (and/or visitor header), BlogManagePage/BlogManageEditPage titles; nav order and visibility by role

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

| Gate | Status | Notes |
|------|--------|-------|
| **TDD — tests identified before coding** | ✅ PASS | Tests: (1) Landing shows "Sign in" and "Sign up" in hero and in header; (2) Visitor header/nav shows Blog and Sign in/Sign up; (3) Logged-in nav order Dashboard → Blog → Profile and optional Campaigns, Manage posts (by role), Admin; (4) "Blog" links to /blog; "Manage posts" visible only for content_manager/admin and links to /blog/manage; (5) Manage pages show "Manage posts" in title/breadcrumb. Unit tests for header and landing; E2E for nav and labels. |
| **Service boundaries and data ownership** | ✅ PASS | No new services or APIs; frontend-only. Auth and blog APIs unchanged. |
| **Docker images and delivery** | ✅ PASS | No new containers; frontend image rebuilt as usual. |
| **Deviations from constitution** | ✅ NONE | No violations |

*Post–Phase 1 re-check*: No new contracts or data model; design aligns with TDD and existing structure. ✅ PASS

## Project Structure

### Documentation (this feature)

```text
specs/014-landing-auth-blog-nav/
├── plan.md              # This file
├── research.md          # Phase 0 — visitor header, nav order, label placement
├── data-model.md        # Phase 1 — no new entities
├── quickstart.md        # Phase 1 — run/test this feature
├── contracts/           # Phase 1 — no new API
└── tasks.md             # Phase 2 (/speckit.tasks)
```

### Source Code (repository root)

```text
frontend/
├── src/
│   ├── pages/
│   │   ├── Landing.tsx              MODIFIED — ensure "Sign in" / "Sign up" in hero; add or reuse header with Sign in/Sign up (and optionally Blog)
│   │   ├── BlogManagePage.tsx       MODIFIED — heading and any breadcrumb: "Manage posts" (not "Blog Posts")
│   │   └── BlogManageEditPage.tsx  MODIFIED — page title/breadcrumb "Manage posts"; back link "Manage posts" or "Back to Manage posts"
│   ├── components/
│   │   └── AppHeader.tsx            MODIFIED — when !user: show visitor nav (Blog, Sign in, Sign up); when user: nav order Dashboard, Blog, Profile, [Campaigns], Manage posts (content_manager/admin), [Admin]; "Blog" → /blog, "Manage posts" → /blog/manage
│   └── (optional) components/
│       └── VisitorHeader.tsx        NEW (optional) — if preferred over expanding AppHeader: header for unauthenticated with Blog + Sign in + Sign up
```

**Structure Decision**: Frontend-only. AppHeader currently returns null when `!user`; extend it to render a visitor nav (Blog, Sign in, Sign up) when unauthenticated. For logged-in users, reorder nav to Dashboard → Blog → Profile, add "Blog" linking to `/blog`, rename existing "Blog" (→ `/blog/manage`) to "Manage posts". Landing already has "Sign in"/"Sign up" in hero CTA; add persistent header on landing (or ensure layout shows header on `/` with those labels). No new routes; optional VisitorHeader only if we want to keep AppHeader for authenticated users only and a separate component for visitors.

## Complexity Tracking

| Violation | Why Needed | Simpler Alternative Rejected Because |
|-----------|------------|-------------------------------------|
| *(none)* | — | — |
