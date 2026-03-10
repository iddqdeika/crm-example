# Tasks: Sign Up / Sign In at Top of Landing with Design-Document UI

**Input**: Design documents from `specs/015-landing-top-signin-signup/`  
**Prerequisites**: plan.md, spec.md, research.md, data-model.md, contracts/

**Tests**: Per Qualityboard constitution, automated tests are MANDATORY and MUST be written before implementation for each user story (TDD + Red-Green-Refactor).

**Organization**: Tasks are grouped by user story to enable independent implementation and testing.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no dependencies)
- **[Story]**: Which user story this task belongs to (US1, US2)
- Include exact file paths in descriptions

## Path Conventions

- **Frontend**: `frontend/src/` (pages, components)
- **Tests**: `frontend/src/pages/*.test.tsx`, `frontend/src/components/*.test.tsx`, `frontend/src/components/AppHeader.*.test.tsx`
- **Design doc**: `docs/design.md`
- **E2E**: `frontend/e2e/`

---

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: Confirm feature context; design document and visitor header (or landing top area) exist.

- [x] T001 Confirm design docs and plan: docs/design.md exists; AppHeader (or equivalent) and Landing exist in frontend/src/; feature is frontend-only styling and placement of top auth controls

**Checkpoint**: Ready to implement visibility and design-doc styling

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: None required — no new APIs. Visitor header may already show Sign up/Sign in (e.g. from spec 014); this feature verifies and styles. Phase 2 is empty.

**Checkpoint**: Proceed to Phase 3

---

## Phase 3: User Story 1 – Visible Sign Up and Sign In at Top of Landing (Priority: P1) MVP

**Goal**: Visitor sees Sign up and Sign in in the top area of the landing page (above the fold) and can reach sign-up and sign-in flows with one click.

**Independent Test**: Open landing (/) as visitor; verify Sign up and Sign in are in the top area (header/nav) without scrolling; click Sign up → /signup; click Sign in → /login.

### Tests for User Story 1

- [x] T002 [P] [US1] Add test: Landing page shows Sign up and Sign in in the top area (header/nav) when unauthenticated in frontend/src/pages/Landing.test.tsx or frontend/src/components/AppHeader.test.tsx (mock useAuth with user: null; assert links/labels present in header)
- [x] T003 [P] [US1] Add test: Visitor header Sign up link has href /signup and Sign in link has href /login in frontend/src/components/AppHeader.test.tsx (or AppHeader.visitor.test.tsx)

### Implementation for User Story 1

- [x] T004 [US1] Ensure visitor header (AppHeader when !user) renders Sign up and Sign in in the top area and links to /signup and /login in frontend/src/components/AppHeader.tsx (implement or verify existing behavior)

**Checkpoint**: User Story 1 complete; top area shows Sign up and Sign in; single click navigates to correct flow

---

## Phase 4: User Story 2 – Top Auth Buttons Conform to Design Document (Priority: P1)

**Goal**: Top-of-landing Sign up and Sign in controls use the project design document’s typography (e.g. Outfit 600), color tokens (primary accent for Sign up, secondary/outline for Sign in), spacing scale, and minimum 44px touch target.

**Independent Test**: Compare top auth controls to docs/design.md; assert typography, colors, spacing, and min height use defined tokens (no hard-coded values that contradict the document).

### Tests for User Story 2

- [x] T005 [P] [US2] Add test: Top-area Sign up and Sign in controls use design tokens (e.g. font-family var(--font-body), or Outfit; font-weight 600; color/background from CSS vars) in frontend/src/components/AppHeader.test.tsx (assert computed styles or class/token usage)
- [x] T006 [P] [US2] Add test: Top auth controls have min-height 44px and visible focus style (e.g. outline using --color-accent-3) in frontend/src/components/AppHeader.test.tsx

### Implementation for User Story 2

- [x] T007 [US2] Style visitor nav Sign up and Sign in per design document in frontend/src/components/AppHeader.css: use --font-body, --color-accent-1 for primary (Sign up), --color-text-secondary or --color-accent-3 for secondary (Sign in), --space-* for padding/gaps, min-height 44px, focus-visible with --color-accent-3

**Checkpoint**: User Story 2 complete; top auth controls conform to design document (typography, colors, spacing, touch target)

---

## Phase 5: Polish & Cross-Cutting Concerns

**Purpose**: Validation and optional E2E for top-area visibility and navigation.

- [x] T008 [P] Run quickstart validation from specs/015-landing-top-signin-signup/quickstart.md: landing top shows Sign up/Sign in; click each → correct flow; design check vs docs/design.md
- [x] T009 [P] Optional: Add or extend E2E in frontend/e2e/: open landing as visitor, assert Sign up and Sign in visible in top area without scroll; single click Sign up → signup page; repeat for Sign in in frontend/e2e/

---

## Dependencies & Execution Order

### Phase Dependencies

- **Phase 1 (Setup)**: No dependencies — start immediately
- **Phase 2 (Foundational)**: Empty — no blocking infra
- **Phase 3 (US1)**: Depends on Phase 1 — visibility and links for top auth
- **Phase 4 (US2)**: Depends on Phase 1 and Phase 3 — styling applies to existing top controls
- **Phase 5 (Polish)**: Depends on Phases 3–4 complete

### User Story Dependencies

- **US1 (P1)**: After Setup — top area shows Sign up/Sign in and links work
- **US2 (P1)**: After US1 — same controls styled per design document

### Within Each Phase

- Tests MUST be written and MUST fail before implementation (TDD)
- Implementation tasks then make tests pass

### Parallel Opportunities

- T002, T003 [P] — different test files or same file different cases
- T005, T006 [P] — token assertion vs min-height/focus assertion
- T008, T009 [P] — quickstart vs E2E after stories complete

---

## Parallel Example: User Story 1

```bash
# After T001:
# Write US1 tests (must fail first):
T002: Landing or AppHeader test — assert Sign up/Sign in in top area when !user
T003: AppHeader test — assert Sign up → /signup, Sign in → /login

# Then implement:
T004: AppHeader.tsx — ensure visitor nav has Sign up, Sign in with correct hrefs
```

---

## Implementation Strategy

### MVP First (User Story 1 Only)

1. Phase 1: T001
2. Phase 3: T002, T003 (tests fail) → T004 (implement) → tests pass
3. **STOP and VALIDATE**: Open / as visitor; see Sign up/Sign in at top; click each → correct page

### Incremental Delivery

1. Setup (T001) → context confirmed
2. US1 (T002–T004) → Top area shows Sign up/Sign in and links work
3. US2 (T005–T007) → Top auth controls use design document tokens
4. Polish (T008–T009) → Quickstart + optional E2E

---

## Summary

| Metric | Value |
|--------|--------|
| **Total tasks** | 9 |
| **Phase 1 (Setup)** | 1 |
| **Phase 2 (Foundational)** | 0 |
| **Phase 3 (US1)** | 3 |
| **Phase 4 (US2)** | 3 |
| **Phase 5 (Polish)** | 2 |
| **Parallel [P] tasks** | 6 |

**Independent test criteria**

- **US1**: Visitor sees Sign up and Sign in in top area without scroll; single click → correct flow (/signup, /login)
- **US2**: Top Sign up/Sign in use design document typography, color tokens, spacing, and min 44px height; focus visible

**Suggested MVP scope**: Phase 1 + Phase 3 (T001–T004) — top area visibility and navigation.

**Format validation**: All tasks use `- [ ] [TaskID] [P?] [Story?] Description with file path`.
