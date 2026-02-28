# Tasks: Apply UI Design System to App Pages

**Input**: Design documents from `/specs/003-fix-ui-design-pages/`
**Prerequisites**: plan.md (required), spec.md (required), research.md, data-model.md, quickstart.md

**Tests**: Automated structural tests are MANDATORY per constitution (TDD + Red-Green-Refactor).
Each user story includes failing tests written BEFORE implementation.

**Organization**: Tasks are grouped by user story to enable independent implementation and testing.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no dependencies)
- **[Story]**: Which user story this task belongs to (e.g., US1, US2, US3)
- Include exact file paths in descriptions

---

## Phase 1: Setup

**Purpose**: Create feature branch

- [x] T001 Create and checkout git branch `003-fix-ui-design-pages` from `main`

---

## Phase 2: Foundational — AppHeader Styling (Blocking)

**Purpose**: The AppHeader navigation bar appears on every authenticated page (Dashboard, Admin, Profile). Styling it first provides the consistent chrome that US2 and US3 depend on visually.

**⚠️ CRITICAL**: US2 and US3 pages include the AppHeader — it must be styled before those stories can be visually complete.

### Test

> **Write this test FIRST, ensure it FAILS before implementation**

- [x] T002 Write failing test asserting AppHeader renders with BEM classes `.app-header`, `.app-header__link`, `.app-header__user`, `.app-header__logout`, and contains navigation links to `/dashboard` and `/profile` in `frontend/src/components/AppHeader.test.tsx`

### Implementation

- [x] T003 Create `frontend/src/components/AppHeader.css` — sticky dark nav bar (`--color-bg-secondary`), horizontal flex layout, link styles with `--color-text-secondary` at rest / `--color-text-primary` on hover, `--color-accent-3` focus-visible ring, ghost logout button, responsive collapse at 480px. Reference `docs/design.md` sections 3–4 and `frontend/src/pages/Landing.css` button patterns.
- [x] T004 Update `frontend/src/components/AppHeader.tsx` — import `./AppHeader.css`, add BEM classes: `.app-header` on `<header>`, wrap links in `<nav className="app-header__nav">`, `.app-header__link` on each `<Link>`, `.app-header__user` on display name `<span>`, `.app-header__logout` on logout `<button>`. Preserve all existing `data-testid` attributes.

**Checkpoint**: AppHeader test passes. Navigation bar is styled on all authenticated pages.

---

## Phase 3: User Story 1 — Styled Authentication Pages (Priority: P1) 🎯 MVP

**Goal**: Login and SignUp pages show a cohesive dark-themed experience with styled forms, inputs, buttons, and error states matching the UI design document.

**Independent Test**: Navigate to `/login` and `/signup` — verify dark theme, design tokens, typography, spacing, form styling. Focus/hover/error states use accent colors.

### Tests for US1

> **Write these tests FIRST, ensure they FAIL before implementation**

- [x] T005 [P] [US1] Write failing test in `frontend/src/pages/Login.test.tsx` asserting: container has `.auth` class, heading has `.auth__heading`, form has `.auth__form`, inputs have `.auth__input`, submit button has `.auth__btn`, and page contains a link to `/signup`
- [x] T006 [P] [US1] Write failing test in `frontend/src/pages/SignUp.test.tsx` asserting: container has `.auth` class, heading has `.auth__heading`, form has `.auth__form`, inputs have `.auth__input`, submit button has `.auth__btn`, and page contains a link to `/login`

### Implementation for US1

- [x] T007 [US1] Create `frontend/src/pages/auth.css` — full auth page styles per `data-model.md` BEM class map: `.auth` centered dark container (max-width 28rem, vertical centering), `.auth__heading` (Syne 700, `--font-size-h2`), `.auth__form` (flex column, `--space-md` gap), `.auth__field` (flex column, `--space-xs` gap), `.auth__label` (`--color-text-secondary`, `--font-size-small`), `.auth__input` (dark input with `--color-bg-secondary` bg, `--color-text-primary` text, border `--color-text-muted`, focus-visible ring `--color-accent-3`), `.auth__btn` (accent-1 bg, dark text, min-height 48px, hover lift+glow), `.auth__error` (`--color-accent-2`, `--font-size-small`), `.auth__footer` + `.auth__link` (`--color-accent-3`). Include responsive rules for 768px and 480px. Include `prefers-reduced-motion` media query. Reference `docs/design.md` and `frontend/src/pages/Landing.css` button patterns.
- [x] T008 [P] [US1] Update `frontend/src/components/LoginForm.tsx` — change `className="auth-form"` to `className="auth__form"`, wrap each `<label>` inner text in `<span className="auth__label">`, add `className="auth__input"` to each `<input>`, add `className="auth__btn"` to `<button>`, change `className="auth-form__error"` to `className="auth__error"`. Preserve all `data-testid` attributes.
- [x] T009 [P] [US1] Update `frontend/src/components/SignUpForm.tsx` — same BEM class changes as T008: `auth__form`, `auth__label`, `auth__input`, `auth__btn`, `auth__error`. Preserve all `data-testid` attributes.
- [x] T010 [P] [US1] Update `frontend/src/pages/Login.tsx` — add `import "./auth.css"`, change `className="auth-page"` to `className="auth"`, add `className="auth__heading"` to `<h1>`, add `<p className="auth__footer">` with a `<Link to="/signup" className="auth__link">` below the form.
- [x] T011 [P] [US1] Update `frontend/src/pages/SignUp.tsx` — add `import "./auth.css"`, change `className="auth-page"` to `className="auth"`, add `className="auth__heading"` to `<h1>`, add `<p className="auth__footer">` with a `<Link to="/login" className="auth__link">` below the form.

**Checkpoint**: Login and SignUp tests pass. Both auth pages are fully styled, forms have focus/hover/error states, responsive at all breakpoints.

---

## Phase 4: User Story 2 — Styled Dashboard & Admin Pages (Priority: P2)

**Goal**: Dashboard and Admin pages use the dark theme with design tokens applied to headings, layout, user list, and detail panel.

**Independent Test**: Sign in, verify `/dashboard` and `/admin` use dark theme, correct fonts, spacing, and layout consistent with auth pages. Admin user list and detail panel are styled.

### Tests for US2

> **Write these tests FIRST, ensure they FAIL before implementation**

- [x] T012 [P] [US2] Write failing test in `frontend/src/pages/Dashboard.test.tsx` asserting: container has `.dashboard` class, heading has `.dashboard__heading`, welcome text has `.dashboard__welcome`
- [x] T013 [P] [US2] Write failing test in `frontend/src/pages/Admin.test.tsx` asserting: container has `.admin` class, heading has `.admin__heading`, user list has `.admin__list`, user list items have `.admin__item`, user buttons have `.admin__user-btn`. Also assert the detail panel (when a user is selected) has `.admin__detail`, `.admin__detail-heading`, `.admin__detail-actions`

### Implementation for US2

- [x] T014 [P] [US2] Create `frontend/src/pages/Dashboard.css` — `.dashboard` container (max-width 72rem, padding `--space-xl` / `--space-lg`), `.dashboard__heading` (Syne 700, `--font-size-h2`), `.dashboard__welcome` (`--color-text-secondary`, `--font-size-body`). Responsive padding at 768px and 480px. Reference `docs/design.md` sections 2–4.
- [x] T015 [P] [US2] Create `frontend/src/pages/Admin.css` — `.admin` container (max-width 72rem, padding), `.admin__heading` (Syne 700, `--font-size-h2`), `.admin__count` (`--color-text-secondary`), `.admin__list` (reset list-style, flex column, gap), `.admin__item` (border-bottom `--color-bg-elevated`), `.admin__user-btn` (full-width text-align left, padding, `--color-text-primary`, hover `--color-bg-elevated`), `.admin__user-btn--inactive` (`--color-text-muted`), `.admin__detail` (`--color-bg-elevated` bg, rounded, padding, margin-top), `.admin__detail-heading` (Syne 600, `--font-size-h3`), `.admin__detail-name` (`--color-text-secondary`), `.admin__detail-field` (flex column, gap, label text), `.admin__detail-select` (dark input matching `.auth__input` style), `.admin__detail-checkbox` (accent-1 accent-color), `.admin__detail-actions` (flex row, gap), `.admin__btn` (base button), `.admin__btn--primary` (accent-1 bg), `.admin__btn--ghost` (transparent, `--color-text-secondary`). Responsive at 768px/480px.
- [x] T016 [US2] Update `frontend/src/pages/Dashboard.tsx` — add `import "./Dashboard.css"`, add `className="dashboard__heading"` to `<h1>`, add `className="dashboard__welcome"` to `<p>`. Keep existing `className="dashboard"` on container.
- [x] T017 [US2] Update `frontend/src/pages/Admin.tsx` — add `import "./Admin.css"`, change `className="admin-page"` to `className="admin"`, add BEM classes to all elements per `data-model.md`: `.admin__heading` on `<h1>`, `.admin__count` on `<p>Total</p>`, `.admin__list` on `<ul>`, `.admin__item` on `<li>`, `.admin__user-btn` on user `<button>` (with `--inactive` modifier when `!u.is_active`), `.admin__detail` on detail wrapper, `.admin__detail-heading` on `<h2>`, `.admin__detail-name` on `<p>`, `.admin__detail-field` on `<label>`, `.admin__detail-select` on `<select>`, `.admin__detail-checkbox` on checkbox `<input>`, `.admin__detail-actions` wrapper around save/close buttons, `.admin__btn--primary` on save, `.admin__btn--ghost` on close. Preserve all `data-testid` attributes.

**Checkpoint**: Dashboard and Admin tests pass. Both pages are styled with dark theme, admin user list and detail panel functional and styled.

---

## Phase 5: User Story 3 — Styled Profile Page (Priority: P3)

**Goal**: Profile page displays clearly separated sections for user info, password change, and avatar management — all styled with the dark theme and design tokens.

**Independent Test**: Navigate to `/profile`, verify dark theme, visually separated sections, form elements styled like auth pages, avatar placeholder visible on dark background.

### Test for US3

> **Write this test FIRST, ensure it FAILS before implementation**

- [x] T018 [US3] Write failing test in `frontend/src/pages/Profile.test.tsx` asserting: container has `.profile` class, heading has `.profile__heading`, info section has `.profile__info`, display name has `.profile__name`, email has `.profile__email`, sections have `.profile__section`, section headings have `.profile__section-heading`, avatar placeholder has `.profile__avatar-placeholder`

### Implementation for US3

- [x] T019 [US3] Create `frontend/src/pages/Profile.css` — `.profile` container (max-width 72rem, padding), `.profile__heading` (Syne 700, `--font-size-h2`), `.profile__info` (flex row/column, gap, avatar alongside text), `.profile__name` (`--font-size-h3`, `--color-text-primary`), `.profile__email` (`--color-text-secondary`), `.profile__avatar` (round, 80px, object-fit cover), `.profile__avatar-placeholder` (`--color-bg-elevated` bg, 80px round, centered icon/text, `--color-text-muted`), `.profile__section` (margin-top `--space-lg`, padding-top `--space-lg`, border-top 1px `--color-bg-elevated`), `.profile__section-heading` (Syne 600, `--font-size-h3`). Import `./auth.css` for form element reuse in password form. Responsive at 768px/480px.
- [x] T020 [P] [US3] Update `frontend/src/components/PasswordChangeForm.tsx` — add BEM classes matching auth form pattern: `className="auth__form"` on `<form>`, wrap label text in `<span className="auth__label">`, `className="auth__input"` on inputs, `className="auth__btn"` on submit button, `className="auth__error"` on error `<p>`. Preserve all `data-testid` attributes.
- [x] T021 [P] [US3] Update `frontend/src/components/AvatarUpload.tsx` — add BEM classes: `className="profile__avatar-upload"` on wrapper `<div>`, `className="profile__avatar"` on `<img>`, `className="profile__avatar-placeholder"` on placeholder `<div>`, `className="auth__btn"` on remove button, `className="auth__error"` on error `<p>`. Preserve all `data-testid` attributes.
- [x] T022 [US3] Update `frontend/src/pages/Profile.tsx` — add `import "./Profile.css"` and `import "./auth.css"`, change `className="profile-page"` to `className="profile"`, add `.profile__heading` to `<h1>`, wrap user info in `<div className="profile__info">`, add `.profile__name` and `.profile__email` to `<p>` tags, add `.profile__avatar` to avatar `<img>`, add `.profile__avatar-placeholder` to placeholder `<div>`, add `.profile__section` to each `<section>`, add `.profile__section-heading` to each `<h2>`. Preserve all `data-testid` attributes.

**Checkpoint**: Profile test passes. All sections styled, password form reuses auth styles, avatar placeholder visible on dark bg.

---

## Phase 6: Polish & Cross-Cutting Concerns

**Purpose**: Final validation across all pages

- [x] T023 Run full test suite (`cd frontend && npm test -- --run`) and fix any failures across all pages
- [x] T024 Verify responsive layouts at 375px, 768px, and 1280px for all five pages — fix any layout breakage
- [x] T025 Run `specs/003-fix-ui-design-pages/quickstart.md` verification checklist — confirm all items pass

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: No dependencies — start immediately
- **Foundational (Phase 2)**: Depends on Phase 1 — BLOCKS US2 and US3 (AppHeader appears on their pages)
- **US1 (Phase 3)**: Depends on Phase 1 only — auth pages don't include AppHeader
- **US2 (Phase 4)**: Depends on Phase 2 (AppHeader styled)
- **US3 (Phase 5)**: Depends on Phase 2 (AppHeader styled) and benefits from US1 completion (auth.css reused for form elements)
- **Polish (Phase 6)**: Depends on all user stories complete

### User Story Dependencies

- **US1 (P1)**: Independent — can start after Phase 1. Creates `auth.css` which US3 reuses.
- **US2 (P2)**: Independent — can start after Phase 2. No dependency on US1.
- **US3 (P3)**: Soft dependency on US1 (`auth.css` must exist for form styling reuse). Can run after Phase 2 if US1's T007 is complete.

### Within Each User Story

1. Tests MUST be written and FAIL before implementation (Red)
2. CSS file created before TSX modifications (styles must exist for classes to render)
3. Component-level TSX changes (LoginForm, SignUpForm) before page-level TSX changes (Login, SignUp)
4. Verify tests pass after implementation (Green)

### Parallel Opportunities

- **T005 + T006**: Both auth test files in parallel (different files)
- **T008 + T009 + T010 + T011**: All auth TSX modifications in parallel (after T007 creates auth.css)
- **T012 + T013**: Both US2 test files in parallel
- **T014 + T015**: Both US2 CSS files in parallel
- **T020 + T021**: PasswordChangeForm + AvatarUpload in parallel (different components)
- **US1 + US2**: Can run in parallel if AppHeader (Phase 2) is complete (US1 doesn't need it, US2 does)

---

## Parallel Example: User Story 1

```text
# Write both auth page tests in parallel:
T005: "Write failing Login test in frontend/src/pages/Login.test.tsx"
T006: "Write failing SignUp test in frontend/src/pages/SignUp.test.tsx"

# After T007 (auth.css created), update all TSX files in parallel:
T008: "Update LoginForm.tsx with BEM classes"
T009: "Update SignUpForm.tsx with BEM classes"
T010: "Update Login.tsx to import auth.css and add BEM classes"
T011: "Update SignUp.tsx to import auth.css and add BEM classes"
```

---

## Implementation Strategy

### MVP First (User Story 1 Only)

1. Complete Phase 1: Setup (branch)
2. Complete Phase 3: US1 — auth pages styled
3. **STOP and VALIDATE**: Login/SignUp fully styled and tested
4. Auth pages alone deliver visual continuity from landing page

### Incremental Delivery

1. Phase 1 (Setup) + Phase 2 (AppHeader) → Navigation chrome ready
2. Phase 3 (US1: Auth) → Test independently → First visible milestone
3. Phase 4 (US2: Dashboard + Admin) → Test independently → Authenticated interior styled
4. Phase 5 (US3: Profile) → Test independently → All pages complete
5. Phase 6 (Polish) → Full suite green, responsive verified

### Optimal Single-Developer Path

1. T001 → T002–T004 (AppHeader) → T005–T011 (US1 auth) → T012–T017 (US2 dashboard+admin) → T018–T022 (US3 profile) → T023–T025 (polish)
2. US1 and Phase 2 can interleave: start US1 tests (T005–T006) while AppHeader implementation runs (T003–T004)

---

## Notes

- [P] tasks = different files, no dependencies on incomplete tasks in the same phase
- [Story] label maps task to specific user story for traceability
- All CSS files reference design tokens from `frontend/src/index.css` — never hardcode values
- All CSS follows BEM convention per `data-model.md` class map
- All TSX changes preserve existing `data-testid` attributes for integration/e2e tests
- Reference `docs/design.md` for all visual decisions and `frontend/src/pages/Landing.css` for BEM patterns
- Commit after each phase checkpoint
