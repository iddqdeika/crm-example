# Tasks: Landing Sign In/Sign Up, Blog Nav, Manage Posts Rename

**Input**: Design documents from `specs/014-landing-auth-blog-nav/`  
**Prerequisites**: plan.md, spec.md, research.md, data-model.md, contracts/

**Tests**: Per Qualityboard constitution, automated tests are MANDATORY and MUST be written before implementation for each user story (TDD + Red-Green-Refactor).

**Organization**: Tasks are grouped by user story to enable independent implementation and testing.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no dependencies)
- **[Story]**: Which user story this task belongs to (US1, US2, US3)
- Include exact file paths in descriptions

## Path Conventions

- **Frontend**: `frontend/src/` (pages, components)
- **Tests**: `frontend/src/pages/*.test.tsx`, `frontend/src/components/*.test.tsx`, `frontend/src/components/AppHeader.*.test.tsx`
- **E2E**: `frontend/e2e/`

---

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: Confirm feature context; no new project structure (frontend-only).

- [ ] T001 Confirm design docs and plan: feature is frontend-only; Landing, AppHeader, BlogManagePage, BlogManageEditPage exist in frontend/src/

**Checkpoint**: Ready to implement nav and label changes

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: None required — no new APIs or shared services. AppHeader and Landing are existing; we extend them. Phase 2 is empty; user stories can start after Setup.

**Checkpoint**: Proceed to Phase 3

---

## Phase 3: User Story 1 – Sign In / Sign Up on Landing Page (Priority: P1) MVP

**Goal**: Visitor sees "Sign in" and "Sign up" in both the landing hero and in a persistent header/nav; clicking either goes to the existing login/signup flow.

**Independent Test**: Open landing (/) as visitor; verify "Sign in" and "Sign up" in hero and in header; click Sign in → login page; click Sign up → signup page.

### Tests for User Story 1

- [ ] T002 [P] [US1] Add test: Landing page shows "Sign in" and "Sign up" in hero and in header when unauthenticated in frontend/src/pages/Landing.test.tsx (mock useAuth with user: null; assert both hero CTA and header nav contain labels)
- [ ] T003 [P] [US1] Add test: When !user, AppHeader shows visitor nav with Blog, Sign in, Sign up linking to /blog, /login, /signup in frontend/src/components/AppHeader.tsx or AppHeader.blog.test.tsx (extend or add AppHeader.visitor.test.tsx)

### Implementation for User Story 1

- [ ] T004 [US1] Implement visitor nav in AppHeader: when !user render nav with Blog (→/blog), Sign in (→/login), Sign up (→/signup) in frontend/src/components/AppHeader.tsx (remove early return null when !user)
- [ ] T005 [US1] Ensure Landing hero CTA uses labels "Sign in" and "Sign up" (verify or update frontend/src/pages/Landing.tsx)

**Checkpoint**: User Story 1 complete; landing has Sign in/Sign up in hero and header; visitor sees header with Blog, Sign in, Sign up

---

## Phase 4: User Story 2 – Blog in Main Navigation Between Dashboard and Profile (Priority: P1)

**Goal**: Logged-in user sees "Blog" between Dashboard and Profile; "Blog" links to /blog (public listing). Visitors already see Blog in header (US1).

**Independent Test**: Log in; verify nav order Dashboard, Blog, Profile; click Blog → /blog listing. As visitor, click Blog in header → /blog listing.

### Tests for User Story 2

- [ ] T006 [P] [US2] Add test: When logged in, AppHeader nav shows Dashboard, Blog, Profile in that order and Blog links to /blog in frontend/src/components/AppHeader.blog.test.tsx or AppHeader.test.tsx
- [ ] T007 [P] [US2] Add test: Visitor header Blog link goes to /blog and blog listing loads (unit with router or E2E) in frontend/src/components/AppHeader.visitor.test.tsx or frontend/e2e/

### Implementation for User Story 2

- [ ] T008 [US2] Implement logged-in nav order: Dashboard, Blog (→/blog), Profile then role-based Campaigns, Manage posts, Admin in frontend/src/components/AppHeader.tsx (add Blog link between Dashboard and Profile; keep existing role-based links after Profile)

**Checkpoint**: User Story 2 complete; logged-in nav order Dashboard → Blog → Profile; Blog opens public listing

---

## Phase 5: User Story 3 – Manage Posts Rename (Priority: P2)

**Goal**: Post management area is labeled "Manage posts" everywhere: nav link (fourth after Profile for content_manager/admin), BlogManagePage heading, BlogManageEditPage title and back link.

**Independent Test**: As content_manager or admin, open nav → see "Manage posts" as fourth item → click → /blog/manage; manage list and edit pages show "Manage posts" in heading/title/back link.

### Tests for User Story 3

- [ ] T009 [P] [US3] Add test: content_manager/admin sees "Manage posts" in nav linking to /blog/manage and it appears after Dashboard, Blog, Profile in frontend/src/components/AppHeader.blog.test.tsx or AppHeader.test.tsx
- [ ] T010 [P] [US3] Add test: BlogManagePage shows heading "Manage posts" in frontend/src/pages/BlogManagePage.test.tsx
- [ ] T011 [P] [US3] Add test: BlogManageEditPage shows "Manage posts" in page title or back link in frontend/src/pages/BlogManageEditPage.test.tsx

### Implementation for User Story 3

- [ ] T012 [US3] Rename management nav link to "Manage posts" and set href to /blog/manage; ensure order Dashboard, Blog, Profile, Manage posts (then Campaigns, Admin) for roles that have it in frontend/src/components/AppHeader.tsx
- [ ] T013 [US3] Update BlogManagePage heading from "Blog Posts" to "Manage posts" in frontend/src/pages/BlogManagePage.tsx
- [ ] T014 [US3] Update BlogManageEditPage: page title and back link to "Manage posts" (e.g. "← Back to Manage posts") in frontend/src/pages/BlogManageEditPage.tsx

**Checkpoint**: User Story 3 complete; all manage-area labels say "Manage posts"

---

## Phase 6: Polish & Cross-Cutting Concerns

**Purpose**: Validation and E2E coverage for nav and labels.

- [ ] T015 [P] Run quickstart validation from specs/014-landing-auth-blog-nav/quickstart.md: landing Sign in/Sign up in hero and header; visitor Blog; logged-in nav order; Manage posts labels
- [ ] T016 [P] Add or extend E2E: landing shows Sign in/Sign up in header; visitor clicks Blog → blog listing; after login nav has Dashboard, Blog, Profile; content_manager sees Manage posts → /blog/manage in frontend/e2e/

---

## Dependencies & Execution Order

### Phase Dependencies

- **Phase 1 (Setup)**: No dependencies — start immediately
- **Phase 2 (Foundational)**: Empty — no blocking infra
- **Phase 3 (US1)**: Depends on Phase 1 — visitor header and landing labels
- **Phase 4 (US2)**: Depends on Phase 1 and Phase 3 (AppHeader already shows when !user; US2 adds logged-in branch)
- **Phase 5 (US3)**: Depends on Phase 4 — nav has Blog and Manage posts slot; US3 renames and updates manage pages
- **Phase 6 (Polish)**: Depends on Phases 3–5 complete

### User Story Dependencies

- **US1 (P1)**: After Setup — no dependency on US2/US3
- **US2 (P1)**: After US1 (same AppHeader; add logged-in nav order and Blog link)
- **US3 (P2)**: After US2 — nav structure in place; rename link and manage pages

### Within Each Phase

- Tests MUST be written and MUST fail before implementation (TDD)
- Implementation tasks then make tests pass

### Parallel Opportunities

- T002, T003 [P] — different test files
- T006, T007 [P] — different test files
- T009, T010, T011 [P] — different test files
- T015, T016 [P] — quickstart vs E2E after stories complete

---

## Parallel Example: User Story 1

```bash
# After T001:
# Write US1 tests (must fail first):
T002: Landing.test.tsx — assert Sign in/Sign up in hero and header
T003: AppHeader test — assert visitor nav has Blog, Sign in, Sign up

# Then implement:
T004: AppHeader.tsx — visitor nav when !user
T005: Landing.tsx — verify hero labels
```

---

## Implementation Strategy

### MVP First (User Story 1 Only)

1. Phase 1: T001
2. Phase 3: T002, T003 (tests fail) → T004, T005 (implement) → tests pass
3. **STOP and VALIDATE**: Open / as visitor; see Sign in/Sign up in hero and header; click through to login/signup

### Incremental Delivery

1. Setup (T001) → context confirmed
2. US1 (T002–T005) → Landing + visitor header with Sign in/Sign up and Blog
3. US2 (T006–T008) → Logged-in nav order and Blog → /blog
4. US3 (T009–T014) → "Manage posts" everywhere
5. Polish (T015–T016) → Quickstart + E2E

### Parallel Team Strategy

- After T001: One dev can do US1 (T002–T005), then US2 (T006–T008), then US3 (T009–T014)
- US2 and US3 both touch AppHeader; do US2 first then US3 to avoid merge conflicts

---

## Summary

| Metric | Value |
|--------|--------|
| **Total tasks** | 16 |
| **Phase 1 (Setup)** | 1 |
| **Phase 2 (Foundational)** | 0 |
| **Phase 3 (US1)** | 4 |
| **Phase 4 (US2)** | 3 |
| **Phase 5 (US3)** | 6 |
| **Phase 6 (Polish)** | 2 |
| **Parallel [P] tasks** | 9 |

**Independent test criteria**

- **US1**: Landing shows "Sign in" and "Sign up" in hero and in header; visitor header has Blog, Sign in, Sign up; links go to correct routes
- **US2**: Logged-in nav order Dashboard, Blog, Profile; Blog → /blog; visitor can open /blog from header
- **US3**: content_manager/admin see "Manage posts" as fourth nav item → /blog/manage; BlogManagePage and BlogManageEditPage show "Manage posts" in heading/title/back link

**Suggested MVP scope**: Phase 1 + Phase 3 (T001–T005) — landing Sign in/Sign up in hero and header and visitor nav with Blog.

**Format validation**: All tasks use `- [ ] [TaskID] [P?] [Story?] Description with file path`.
