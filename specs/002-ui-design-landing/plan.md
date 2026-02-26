# Implementation Plan: UI Design Document & Creative Landing Page

**Branch**: `002-ui-design-landing` | **Date**: 2026-02-26 | **Spec**: [spec.md](spec.md)
**Input**: Feature specification from `/specs/002-ui-design-landing/spec.md`

## Summary

Create a UI design document (`docs/design.md`) that codifies the visual language for QualityBoard — dark theme, vivid accents, distinctive typography, WCAG 2.1 AA with 7:1 body text contrast — and redesign the existing `Landing.tsx` page to embody it. The landing page is restructured into three focused sections (hero, benefits, CTA) with benefit-oriented copy centered on "Quality ensures your future — let's check it." No backend changes are required; this is a frontend-only and documentation feature.

## Technical Context

**Language/Version**: TypeScript ~5.6.2, React 18.3.1, Python >=3.12 (backend — unchanged)
**Primary Dependencies**: Vite 5.4.10, React Router DOM 6.28.0
**Storage**: N/A (no data persistence changes)
**Testing**: Vitest 2.1.4 + @testing-library/react (frontend); pytest (backend — unchanged)
**Target Platform**: Web browser (desktop + mobile responsive)
**Project Type**: Web application (frontend + backend + Docker)
**Performance Goals**: Landing page loads and renders within 2 seconds on standard broadband; no layout shift (CLS < 0.1)
**Constraints**: Plain CSS with BEM naming (existing pattern); no new CSS framework; WCAG 2.1 AA + 7:1 body text contrast
**Scale/Scope**: 1 documentation file + 1 page component + 1 CSS file; frontend service only

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

- **TDD + Red-Green-Refactor**: Tests for each user story are identified below. For the design document (Story 1), validation is structural (checklist-based review). For the landing page (Story 2), automated Vitest tests will verify: (a) three sections render (hero, benefits, CTA), (b) sign-up and sign-in CTAs are present, (c) value proposition text is displayed, (d) correct CSS classes/structure for dark theme. Tests are written before implementation.
- **Service boundaries**: This feature touches only the frontend service. No cross-service calls or data model changes. The existing `Landing.tsx` page is replaced; no new services are introduced.
- **Docker delivery**: The frontend already builds as a Docker image via `docker/docker-compose.dev.yml`. No Dockerfile changes needed — the redesigned landing page ships inside the existing frontend image.
- **No violations detected.** Complexity Tracking section remains empty.

## Project Structure

### Documentation (this feature)

```text
specs/002-ui-design-landing/
├── plan.md              # This file
├── research.md          # Phase 0 output
├── data-model.md        # Phase 1 output
├── quickstart.md        # Phase 1 output
└── tasks.md             # Phase 2 output (NOT created by /speckit.plan)
```

### Source Code (repository root)

```text
docs/
└── design.md                    # NEW — UI design document (Story 1)

frontend/
├── src/
│   ├── pages/
│   │   ├── Landing.tsx          # MODIFIED — redesigned landing page (Story 2)
│   │   ├── Landing.css          # NEW — landing page styles (dark theme, BEM)
│   │   └── Landing.test.tsx     # NEW — landing page tests (TDD)
│   └── index.css                # MODIFIED — design tokens (CSS custom properties)
└── ...
```

**Structure Decision**: Follows existing web application layout. The design document lives in `docs/` alongside the existing `README.md`. Landing page styles are co-located with the component using BEM naming, consistent with the project's CSS approach. Global design tokens (colors, fonts, spacing) are added to `index.css` as CSS custom properties so they're available application-wide.

## Complexity Tracking

> No constitution violations. Table intentionally empty.
