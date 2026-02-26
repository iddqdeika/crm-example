# Tasks: UI Design Document & Creative Landing Page

**Input**: Design documents from `/specs/002-ui-design-landing/`
**Prerequisites**: plan.md, spec.md, research.md, data-model.md, quickstart.md

**Tests**: Automated tests are MANDATORY per the Qualityboard constitution (TDD + Red-Green-Refactor). For User Story 1 (design document), validation is structural (checklist-based review) since it produces a markdown artifact. For User Story 2 (landing page), Vitest tests MUST be written and fail before implementation.

**Organization**: Tasks are grouped by user story to enable independent implementation and testing.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no dependencies)
- **[Story]**: Which user story this task belongs to (US1, US2)
- Include exact file paths in descriptions

---

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: Add external font resources required by both user stories

- [x] T001 Add Google Fonts links (display + body font pair, avoiding Inter/Roboto/Arial/Space Grotesk) to frontend/index.html

---

## Phase 2: User Story 1 — UI Design Document (Priority: P1) 🎯 MVP

**Goal**: Create a comprehensive design document that defines QualityBoard's visual language — dark theme, vivid accents, distinctive typography, WCAG 2.1 AA with 7:1 body text contrast — as the authoritative reference for all implementation.

**Independent Test**: Reviewers can read docs/design.md and apply its guidelines to create interface elements without ambiguity. All required sections are present (visual identity, typography, color, spatial composition, content tone, accessibility).

### Implementation for User Story 1

- [x] T002 [US1] Create docs/design.md with visual identity overview: target audience (creative thinkers), design principles (contrast, benefit-oriented text), and dark theme with vivid accents direction
- [x] T003 [US1] Add typography section to docs/design.md: chosen Google Fonts pair (display + body), size scale, line heights, hierarchy rules, and CSS token names (--font-display, --font-body, etc.)
- [x] T004 [P] [US1] Add color palette section to docs/design.md: dark background, text colors (7:1 body, 4.5:1 secondary), 2-3 vivid accent colors with hex values, usage rules, and CSS token names (--color-bg-primary, --color-accent-1, etc.)
- [x] T005 [P] [US1] Add spatial composition and content tone sections to docs/design.md: spacing scale, layout principles, benefit-oriented copywriting guidelines, and tone of voice for creative audiences
- [x] T006 [US1] Add accessibility section to docs/design.md: WCAG 2.1 AA requirements, contrast ratio targets, focus states, and semantic HTML expectations
- [x] T007 [US1] Define all CSS design tokens (color, typography, spacing) as custom properties in `:root` of frontend/src/index.css per the values specified in docs/design.md

**Checkpoint**: docs/design.md is complete and frontend/src/index.css contains all design tokens. A reader can make consistent design decisions from the document alone.

---

## Phase 3: User Story 2 — Landing Page Implementation (Priority: P2)

**Goal**: Redesign the existing Landing.tsx to embody the design document — three focused sections (hero, benefits, CTA) with dark theme, vivid accents, benefit-oriented copy centered on "Quality ensures your future — let's check it", and dual sign-up/sign-in CTAs.

**Independent Test**: Load the landing page at root URL as an unauthenticated visitor. Verify three sections render, value proposition is visible, both CTAs work, and visuals match the design document.

### Tests for User Story 2 (TDD — write first, must FAIL before implementation)

- [x] T008 [P] [US2] Write failing test: Landing renders three sections (hero, benefits, CTA) with correct BEM class names in frontend/src/pages/Landing.test.tsx
- [x] T009 [P] [US2] Write failing test: hero section displays value proposition text "Quality ensures your future" in frontend/src/pages/Landing.test.tsx
- [x] T010 [P] [US2] Write failing test: CTA section contains sign-up link to /signup and sign-in link to /login in frontend/src/pages/Landing.test.tsx

### Implementation for User Story 2

- [x] T011 [US2] Create landing page stylesheet with dark theme base, BEM classes (landing, landing__hero, landing__benefits, landing__cta), and design token usage in frontend/src/pages/Landing.css
- [x] T012 [US2] Redesign hero section in frontend/src/pages/Landing.tsx: headline with value proposition, benefit-oriented tagline, and decorative visual element
- [x] T013 [US2] Add benefits section to frontend/src/pages/Landing.tsx: three outcome-focused benefit items with distinctive typography and vivid accent highlights
- [x] T014 [US2] Add CTA section to frontend/src/pages/Landing.tsx: primary sign-up button (links to /signup) and secondary sign-in link (links to /login)
- [x] T015 [US2] Add CSS animations to frontend/src/pages/Landing.css: staggered page-load reveal (keyframes + animation-delay) and hover transitions for interactive elements
- [x] T016 [US2] Add responsive styles to frontend/src/pages/Landing.css: mobile (375px), tablet (768px), desktop (1280px) breakpoints

**Checkpoint**: All three tests from T008-T010 pass. Landing page renders hero + benefits + CTA with dark theme, value proposition text, and dual CTAs.

---

## Phase 4: Polish & Cross-Cutting Concerns

**Purpose**: Validation, accessibility, and final quality checks

- [x] T017 [P] Run all frontend tests (`npm test` in frontend/) and confirm zero failures
- [x] T018 [P] Validate WCAG 2.1 AA compliance: body text contrast >=7:1, interactive element contrast >=4.5:1, focus states visible, semantic HTML (headings, landmarks, alt text)
- [x] T019 Run quickstart.md verification checklist end-to-end in frontend/

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: No dependencies — can start immediately
- **User Story 1 (Phase 2)**: Depends on Setup (T001) — Google Fonts must be available for font selection
- **User Story 2 (Phase 3)**: Depends on User Story 1 (T007) — design tokens in index.css must exist before landing page can reference them
- **Polish (Phase 4)**: Depends on User Story 2 completion

### User Story Dependencies

- **User Story 1 (P1)**: Can start after Setup (Phase 1). No dependency on other stories.
- **User Story 2 (P2)**: Depends on User Story 1 completion (design document defines the visual language; CSS tokens in index.css are consumed by Landing.css).

### Within Each User Story

- US1: T002 → T003 (typography builds on identity), T004 and T005 parallel, T006 after sections, T007 after full document
- US2: T008-T010 parallel (tests), then T011 first (CSS), then T012-T014 parallel (sections), T015-T016 parallel (enhancements)

### Parallel Opportunities

- **US1**: T004 and T005 can run in parallel (different sections of docs/design.md, but non-overlapping)
- **US2 Tests**: T008, T009, T010 can all run in parallel (same file but independent test cases)
- **US2 Polish**: T015 and T016 can run in parallel (animations vs responsive — different CSS concerns)
- **Phase 4**: T017 and T018 can run in parallel

---

## Parallel Example: User Story 2

```text
# Write all tests in parallel (TDD - must fail first):
Task T008: "Write failing test: three sections render"
Task T009: "Write failing test: value proposition displayed"
Task T010: "Write failing test: dual CTAs present"

# After T011 (base CSS), build sections in parallel:
Task T012: "Redesign hero section"
Task T013: "Add benefits section"
Task T014: "Add CTA section"

# After sections complete, enhancements in parallel:
Task T015: "Add CSS animations"
Task T016: "Add responsive styles"
```

---

## Implementation Strategy

### MVP First (User Story 1 Only)

1. Complete Phase 1: Setup (T001)
2. Complete Phase 2: User Story 1 — UI Design Document (T002-T007)
3. **STOP and VALIDATE**: Review docs/design.md for completeness and clarity
4. The design document alone delivers value — stakeholders can use it for future screens

### Incremental Delivery

1. Setup (T001) → Font resources ready
2. User Story 1 (T002-T007) → Design document + tokens ready → Review/Demo (MVP!)
3. User Story 2 (T008-T016) → Landing page live → Test independently → Demo
4. Polish (T017-T019) → Quality verified → Ship

---

## Notes

- [P] tasks = different files, no dependencies
- [Story] label maps task to specific user story for traceability
- US1 produces a markdown artifact — validated by structural review, not automated tests
- US2 follows strict TDD: tests T008-T010 MUST fail before T011-T016 are implemented
- Commit after each task or logical group
- Stop at any checkpoint to validate story independently
