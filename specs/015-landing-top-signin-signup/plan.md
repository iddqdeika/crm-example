# Implementation Plan: Sign Up / Sign In Buttons at Top of Landing with Design-Document UI

**Branch**: `015-landing-top-signin-signup` | **Date**: 2026-02-26 | **Spec**: [spec.md](spec.md)  
**Input**: Feature specification from `specs/015-landing-top-signin-signup/spec.md`

## Summary

Ensure Sign up and Sign in controls at the top of the landing page (above the fold) are visible for unauthenticated visitors and conform to the project design document: typography (e.g. Outfit 600 for buttons), color tokens (primary/secondary actions, backgrounds), spacing scale, and touch-target size. The top area is implemented as the visitor header/nav (e.g. AppHeader when !user); this feature focuses on verifying placement and applying design-document UI so the controls are both discoverable and on-brand. No new backend APIs or data model; frontend-only, with tests for visibility and design-token usage.

## Technical Context

**Language/Version**: Python 3.12+ (backend), TypeScript / React 18 (frontend)  
**Primary Dependencies**: React Router, existing AuthContext; design tokens from `frontend/src/index.css` and project design document (e.g. `docs/design.md`)  
**Storage**: None (no new persistence)  
**Testing**: Vitest + @testing-library/react (frontend unit), Playwright (E2E optional)  
**Target Platform**: Same as existing app (Docker Compose dev/e2e/prod)  
**Project Type**: Web application (frontend only for this feature)  
**Performance Goals**: N/A  
**Constraints**: Top-of-landing auth controls must use design document tokens only; no hard-coded colors/typography that contradict the document  
**Scale/Scope**: Visitor header/nav (Sign up, Sign in), possibly Landing; CSS and component styling only

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

| Gate | Status | Notes |
|------|--------|-------|
| **TDD — tests identified before coding** | ✅ PASS | Tests: (1) Landing/top area shows Sign up and Sign in above the fold for unauthenticated users; (2) Top auth controls use design tokens (typography, colors, spacing) — assert CSS vars or computed styles; (3) Single click/tap navigates to correct flow. Unit tests for header/landing; optional E2E for above-the-fold visibility. |
| **Service boundaries and data ownership** | ✅ PASS | No new services or APIs; frontend-only. |
| **Docker images and delivery** | ✅ PASS | No new containers; frontend image rebuilt as usual. |
| **Deviations from constitution** | ✅ NONE | No violations |

*Post–Phase 1 re-check*: No new contracts or data model; design aligns with TDD and existing structure. ✅ PASS

## Project Structure

### Documentation (this feature)

```text
specs/015-landing-top-signin-signup/
├── plan.md              # This file
├── research.md          # Phase 0 — design doc token mapping, top-area placement
├── data-model.md        # Phase 1 — no new entities
├── quickstart.md        # Phase 1 — run/test this feature
├── contracts/           # Phase 1 — no new API
└── tasks.md             # Phase 2 (/speckit.tasks)
```

### Source Code (repository root)

```text
frontend/
├── src/
│   ├── components/
│   │   └── AppHeader.tsx       MODIFIED — visitor nav Sign up/Sign in styled per design doc (tokens for typography, colors, spacing, min height)
│   ├── pages/
│   │   └── Landing.tsx         VERIFY — hero CTA already uses design tokens; no change if already compliant
│   └── (styles)
│       └── AppHeader.css       MODIFIED — use --font-body, --color-accent-1, --space-*, min-height 44px for top auth buttons
```

**Structure Decision**: Frontend-only. The “top” of the landing is the visitor header (AppHeader when !user) that already shows Blog, Sign in, Sign up. This feature ensures those Sign up/Sign in controls are styled per the design document (typography, color tokens, spacing, touch targets). If a dedicated landing header exists, apply the same token-based styling there.

## Complexity Tracking

| Violation | Why Needed | Simpler Alternative Rejected Because |
|-----------|------------|-------------------------------------|
| *(none)* | — | — |
