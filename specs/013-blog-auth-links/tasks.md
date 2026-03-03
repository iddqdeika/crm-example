# Tasks: Blog Login and Register Links

**Input**: Design documents from `specs/013-blog-auth-links/`  
**Prerequisites**: plan.md, spec.md, research.md, data-model.md, contracts/

**Tests**: Per Qualityboard constitution, automated tests are MANDATORY and MUST be written before implementation for each user story (TDD + Red-Green-Refactor).

**Organization**: Tasks are grouped by user story to enable independent implementation and testing.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no dependencies)
- **[Story]**: Which user story this task belongs to (US1, US2, US3)
- Include exact file paths in descriptions

## Path Conventions

- **Frontend**: `frontend/src/` (pages, components, contexts)
- **Tests**: `frontend/src/pages/*.test.tsx`, `frontend/src/components/*.test.tsx`
- **E2E**: `frontend/e2e/`

---

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: Confirm feature context; no new project structure (frontend-only feature).

- [x] T001 Confirm design docs and plan: feature is frontend-only; auth and blog pages exist in frontend/src/pages/

**Checkpoint**: Ready to implement redirect and blog UI changes

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: SignUp must redirect to `sessionStorage.redirectAfterLogin` when set, so that post-registration from blog returns to the same page. Login already does this in AuthContext.

**Independent Test**: Set `sessionStorage.redirectAfterLogin = "/blog"`, complete signup, assert redirect to `/blog`.

### Tests for Foundational

- [x] T002 [P] Add test: SignUp redirects to sessionStorage redirectAfterLogin after successful signup in frontend/src/pages/SignUp.test.tsx (mock signup success, set redirectAfterLogin, assert location/redirect)

### Implementation for Foundational

- [x] T003 Implement SignUp redirect: after signup success, if sessionStorage.redirectAfterLogin is set, clear it and redirect there (e.g. window.location.href); else navigate to /dashboard in frontend/src/pages/SignUp.tsx

**Checkpoint**: SignUp redirect-after-registration works; US1 and US2 can rely on it

---

## Phase 3: User Story 1 – Unauthenticated visitor sees login and register links on blog listing (Priority: P1) MVP

**Goal**: Blog listing page shows "Log in" and "Register" links when the user is not authenticated; clicking either sets current path in redirectAfterLogin and navigates to /login or /signup.

**Independent Test**: Open blog listing as logged-out user; verify "Log in" and "Register" are present; click Log in → login page; after login, land back on blog listing.

### Tests for User Story 1

- [x] T004 [P] [US1] Add test: BlogPage shows "Log in" and "Register" when user is null in frontend/src/pages/BlogPage.test.tsx (mock useAuth with user: null)
- [x] T005 [US1] Add test: Clicking "Log in" from BlogPage sets sessionStorage.redirectAfterLogin to current path and navigates to /login in frontend/src/pages/BlogPage.test.tsx (or BlogAuthLinks test)

### Implementation for User Story 1

- [x] T006 [US1] Create BlogAuthLinks component: when !user render "Log in" and "Register" links; onClick set sessionStorage.redirectAfterLogin to current pathname then navigate to /login or /signup in frontend/src/components/BlogAuthLinks.tsx
- [x] T007 [US1] Add BlogAuthLinks to blog listing in frontend/src/pages/BlogPage.tsx (use useAuth(); when !user render BlogAuthLinks with path from useLocation())

**Checkpoint**: User Story 1 complete; unauthenticated users see and can use auth links on blog listing

---

## Phase 4: User Story 2 – Unauthenticated visitor sees login and register links on individual post pages (Priority: P2)

**Goal**: Individual blog post page shows the same "Log in" and "Register" links when not authenticated; click sets redirect to that post URL and navigates; after auth, user returns to same post.

**Independent Test**: Open a blog post as logged-out user; verify links present; click Register → signup → complete signup → land back on same post URL.

### Tests for User Story 2

- [x] T008 [P] [US2] Add test: BlogPostPage shows "Log in" and "Register" when user is null in frontend/src/pages/BlogPostPage.test.tsx (mock useAuth with user: null)
- [x] T009 [US2] Add test: Clicking "Register" from BlogPostPage sets redirectAfterLogin to /blog/post/:slug and navigates to /signup in frontend/src/pages/BlogPostPage.test.tsx (or BlogAuthLinks with path)

### Implementation for User Story 2

- [x] T010 [US2] Add BlogAuthLinks to blog post page in frontend/src/pages/BlogPostPage.tsx (use useAuth() and useLocation(); when !user render BlogAuthLinks so redirect targets current post path)

**Checkpoint**: User Stories 1 and 2 complete; both listing and post show auth links and redirect back correctly

---

## Phase 5: User Story 3 – Authenticated users do not see redundant login/register on blog (Priority: P3)

**Goal**: When the user is logged in, blog listing and post pages do not show "Log in" or "Register" in the blog area (or show an appropriate alternative such as Dashboard).

**Independent Test**: Log in, visit /blog and /blog/post/some-slug; verify "Log in" and "Register" are not shown in blog content area.

### Tests for User Story 3

- [x] T011 [P] [US3] Add test: BlogPage does not show "Log in" or "Register" when user is authenticated in frontend/src/pages/BlogPage.test.tsx (mock useAuth with user: { id, email, display_name })
- [x] T012 [P] [US3] Add test: BlogPostPage does not show "Log in" or "Register" when user is authenticated in frontend/src/pages/BlogPostPage.test.tsx (mock useAuth with user set)

### Implementation for User Story 3

- [x] T013 [US3] Ensure BlogAuthLinks renders nothing (or only optional Dashboard link) when user is present; verify BlogPage and BlogPostPage pass auth state correctly in frontend/src/components/BlogAuthLinks.tsx and frontend/src/pages/BlogPage.tsx, frontend/src/pages/BlogPostPage.tsx

**Checkpoint**: All three user stories complete; authenticated users do not see login/register in blog area

---

## Phase 6: Polish & Cross-Cutting Concerns

**Purpose**: Validation and optional E2E coverage.

- [x] T014 [P] Run quickstart.md validation: manual test from specs/013-blog-auth-links/quickstart.md (logged-out see links on /blog and post; click Login/signup and confirm redirect back)
- [x] T015 [P] Optional: Add E2E scenario in frontend/e2e/07-blog-section.spec.ts — unauthenticated user sees Log in/Register on blog; clicks Login from post, completes login, lands back on same post

---

## Dependencies & Execution Order

### Phase Dependencies

- **Phase 1 (Setup)**: No dependencies — start immediately
- **Phase 2 (Foundational)**: Depends on Phase 1 — SignUp redirect blocks US1/US2
- **Phase 3 (US1)**: Depends on Phase 2 — blog listing links and redirect
- **Phase 4 (US2)**: Depends on Phase 2 and T006/T007 (BlogAuthLinks exists) — post page reuses same component
- **Phase 5 (US3)**: Depends on Phase 3 and 4 — conditional rendering already in place; tests and verification
- **Phase 6 (Polish)**: Depends on Phases 2–5 complete

### User Story Dependencies

- **US1 (P1)**: After Foundational — no dependency on US2/US3
- **US2 (P2)**: After Foundational and US1 implementation (BlogAuthLinks) — reuses component
- **US3 (P3)**: After US1 and US2 — verifies hiding when authenticated

### Within Each Phase

- Tests (T004, T005, T008, T009, T011, T012) MUST be written and MUST fail before implementation
- Implementation tasks (T006, T007, T010, T013) then make tests pass

### Parallel Opportunities

- T002 (SignUp test) can run alone in Phase 2
- T004, T008, T011, T012 are [P] — different test files
- T014 and T015 (Polish) can run in parallel after stories complete

---

## Parallel Example: User Story 1

```bash
# After T002, T003 done (Foundational):
# Write US1 tests (must fail first):
T004: Add test BlogPage shows Log in/Register when user null (BlogPage.test.tsx)
T005: Add test click Log in sets redirectAfterLogin and navigates (BlogPage.test.tsx)

# Then implement:
T006: Create BlogAuthLinks.tsx
T007: Add BlogAuthLinks to BlogPage.tsx
```

---

## Implementation Strategy

### MVP First (User Story 1 Only)

1. Phase 1: T001
2. Phase 2: T002 (test fails) → T003 (implement) → test passes
3. Phase 3: T004, T005 (tests fail) → T006, T007 (implement) → tests pass
4. **STOP and VALIDATE**: Manual check — open /blog logged out, see links, login, land back on /blog

### Incremental Delivery

1. Foundation (T001–T003) → SignUp redirect works
2. US1 (T004–T007) → Blog listing links + redirect
3. US2 (T008–T010) → Blog post page links + redirect
4. US3 (T011–T013) → Hide links when authenticated
5. Polish (T014–T015) → Quickstart + optional E2E

### Parallel Team Strategy

- One developer: Phases 1 → 2 → 3 → 4 → 5 → 6 in order
- Two developers: After Phase 2, Dev A does US1 (T004–T007), Dev B can start US2 (T008–T010) once T006 is done (BlogAuthLinks exists)

---

## Summary

| Metric | Value |
|--------|--------|
| **Total tasks** | 15 |
| **Phase 1 (Setup)** | 1 |
| **Phase 2 (Foundational)** | 2 |
| **Phase 3 (US1)** | 4 |
| **Phase 4 (US2)** | 3 |
| **Phase 5 (US3)** | 3 |
| **Phase 6 (Polish)** | 2 |
| **Parallel [P] tasks** | 7 |

**Independent test criteria**

- **US1**: Blog listing shows Log in/Register when !user; click → auth page → after auth → back to /blog
- **US2**: Blog post shows Log in/Register when !user; click → auth page → after auth → back to same post
- **US3**: When user is logged in, blog listing and post do not show Log in/Register

**Suggested MVP scope**: Phase 1 + Phase 2 + Phase 3 (T001–T007) — blog listing auth links and redirect after login/signup.

**Format validation**: All tasks use `- [ ] [TaskID] [P?] [Story?] Description with file path`.
