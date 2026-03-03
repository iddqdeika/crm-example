# Implementation Plan: Blog Login and Register Links

**Branch**: `013-blog-auth-links` | **Date**: 2026-03-03 | **Spec**: [spec.md](spec.md)  
**Input**: Feature specification from `specs/013-blog-auth-links/spec.md`

## Summary

Add "Log in" and "Register" links to the blog listing page and individual blog post pages for unauthenticated users. When the user clicks either link, set the current blog URL in `sessionStorage.redirectAfterLogin` and navigate to `/login` or `/signup`. After successful login or signup, the app redirects back to that URL (same blog page). No new backend APIs or data model; frontend-only changes to BlogPage, BlogPostPage, and SignUp redirect behavior.

## Technical Context

**Language/Version**: Python 3.12+ (backend), TypeScript / React 18 (frontend)  
**Primary Dependencies**: FastAPI, React Router, existing AuthContext and auth API  
**Storage**: None (uses existing sessionStorage `redirectAfterLogin`; no backend change)  
**Testing**: Vitest + @testing-library/react (frontend unit), Playwright (E2E optional for this feature)  
**Target Platform**: Same as existing app (Docker Compose dev/e2e/prod)  
**Project Type**: Web application (frontend + backend; only frontend touched)  
**Performance Goals**: N/A (links and one sessionStorage write)  
**Constraints**: Only blog listing and blog post pages show the links; authenticated users do not see them  
**Scale/Scope**: Two pages (BlogPage, BlogPostPage); SignUp page behavior extended for redirect

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

| Gate | Status | Notes |
|------|--------|-------|
| **TDD — tests identified before coding** | ✅ PASS | Tests: (1) Blog listing shows Log in/Register when unauthenticated and hides when authenticated; (2) Blog post page same; (3) Clicking link sets redirectAfterLogin and navigates; (4) After login/signup from blog, redirect to same page. Unit tests for components; E2E optional. |
| **Service boundaries and data ownership** | ✅ PASS | No new services or APIs; frontend-only. Auth and blog APIs unchanged. |
| **Docker images and delivery** | ✅ PASS | No new containers; frontend image rebuilt as usual. |
| **Deviations from constitution** | ✅ NONE | No violations |

*Post–Phase 1 re-check*: No new contracts or data model; design aligns with TDD and existing structure. ✅ PASS

## Project Structure

### Documentation (this feature)

```text
specs/013-blog-auth-links/
├── plan.md              # This file
├── research.md          # Phase 0 — redirect-after-auth, link placement
├── data-model.md        # Phase 1 — no new entities
├── quickstart.md        # Phase 1 — run/test this feature
├── contracts/           # Phase 1 — no new API (existing auth used)
└── tasks.md             # Phase 2 (/speckit.tasks)
```

### Source Code (repository root)

```text
frontend/
├── src/
│   ├── pages/
│   │   ├── BlogPage.tsx          MODIFIED — when !user, show Log in / Register links; onClick set redirectAfterLogin, navigate
│   │   ├── BlogPostPage.tsx      MODIFIED — same
│   │   └── SignUp.tsx            MODIFIED — after signup success, if redirectAfterLogin set, redirect there; else navigate("/dashboard")
│   ├── components/
│   │   └── (optional) BlogAuthLinks.tsx   NEW — reusable "Log in" / "Register" block that sets redirect and navigates (used by BlogPage, BlogPostPage)
│   └── contexts/
│       └── AuthContext.tsx       UNCHANGED — login() already uses redirectAfterLogin
├── e2e/
│   └── 07-blog-section.spec.ts   OPTIONAL — add scenario: unauthenticated sees links; click Login from post, login, land back on post
```

**Structure Decision**: Frontend-only. Backend and auth API unchanged. Optional small component `BlogAuthLinks` to avoid duplicating link + sessionStorage logic on BlogPage and BlogPostPage.

## Complexity Tracking

| Violation | Why Needed | Simpler Alternative Rejected Because |
|-----------|------------|-------------------------------------|
| *(none)* | — | — |
