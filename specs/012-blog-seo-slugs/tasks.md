# Tasks: SEO-Friendly Blog (Slugs & Meta Tags)

**Input**: Design documents from `specs/012-blog-seo-slugs/`  
**Prerequisites**: plan.md, spec.md, research.md, data-model.md, contracts/

**Tests**: Automated tests are MANDATORY (TDD). Write failing tests first for each user story, then implement until they pass.

**Organization**: Tasks grouped by user story for independent implementation and testing.

## Format: `[ID] [P?] [Story?] Description`

- **[P]**: Can run in parallel (different files, no dependencies)
- **[Story]**: User story (US0–US5)
- Include exact file paths in descriptions

## Path Conventions

- **Backend**: `backend/src/`, `backend/tests/`
- **Frontend**: `frontend/src/`, `frontend/e2e/`

---

## Phase 1: Setup

**Purpose**: Add dependency required for SEO meta (react-helmet-async).

- [x] T001 [P] Add `react-helmet-async` to frontend dependencies in `frontend/package.json` and run `npm install`

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Database schema, models, slug sanitization, and schemas that ALL user stories depend on. No user story work can begin until this phase is complete.

- [x] T002 Write unit test for slug sanitization (lowercase, hyphens, strip non-ASCII, trim, max 100) in `backend/tests/unit/test_slug_utils.py` — run: must FAIL
- [x] T003 Implement slug sanitization helper in `backend/src/core/slug.py` (used by migration and validation)
- [x] T004 [P] Extend BlogPost model with `slug`, `status`, `seo_title`, `meta_description` in `backend/src/models/blog_post.py`
- [x] T005 [P] Create SlugHistory model in `backend/src/models/blog_slug_history.py`
- [x] T006 Update `backend/src/models/__init__.py` to export SlugHistory
- [x] T007 Update blog schemas: add `slug`, `status`, `seo_title`, `meta_description` to create/update/response in `backend/src/schemas/blog.py`
- [x] T008 Add Alembic migration: add columns to `blog_posts`; create `blog_slug_history`; partial unique index on `(slug) WHERE status = 'published'` in `backend/migrations/versions/`
- [x] T009 Run migration and unit test for slug — test must PASS

**Checkpoint**: Foundation ready — user story implementation can begin

---

## Phase 3: User Story 0 — Draft / Published Post States (Priority: P1) MVP base

**Goal**: Posts have status draft/published; draft not public; publish reserves slug; list shows status.

**Independent Test**: Save post as draft → 404 at `/blog/post/<slug>`; click Publish → 200 at same URL; list shows Draft/Published.

### Tests for User Story 0

- [x] T010 [P] [US0] Write integration tests: create draft → GET by slug 404; publish → 200; revert to draft → 404; list returns status in `backend/tests/test_blog_api.py` — run: must FAIL

### Implementation for User Story 0

- [x] T011 [US0] blog_service: create/update accept `status`; list_posts filter by `status=published` for public; get_post by id for manage in `backend/src/services/blog_service.py`
- [x] T012 [US0] blog_search_service: index only when `status=published`; remove document when reverted to draft in `backend/src/services/blog_search_service.py`
- [x] T013 [US0] API: create/update accept `status`; public list only published; management list includes drafts and status in `backend/src/api/blog.py`
- [x] T014 [US0] Frontend api: create/update send `status`; list response type includes `status` in `frontend/src/services/api.ts`
- [x] T015 [US0] BlogManageEditPage: add Save draft / Publish buttons; submit `status` with create/update in `frontend/src/pages/BlogManageEditPage.tsx`
- [x] T016 [US0] BlogManagePage: show status column (Draft/Published) in `frontend/src/pages/BlogManagePage.tsx`
- [x] T017 [US0] Run backend tests for US0 — must pass

**Checkpoint**: Draft/publish and status in list work independently

---

## Phase 4: User Story 1 — Auto-Suggested Slug on Post Creation (Priority: P1)

**Goal**: Slug field auto-fills from title; stops when user edits slug manually; format enforced.

**Independent Test**: Type title → slug field shows sanitized slug; edit slug manually → suggestion stops overwriting; clear title → slug clears when untouched.

### Tests for User Story 1

- [x] T018 [P] [US1] Write unit test: slug auto-fills from title, stops when user edits slug, clears when title cleared (untouched slug) in `frontend/src/pages/BlogManageEditPage.test.tsx` — run: must FAIL

### Implementation for User Story 1

- [x] T019 [US1] Implement client-side slugify (match backend rules) and slug field with auto-suggest; stop overwriting when user has edited slug in `frontend/src/pages/BlogManageEditPage.tsx`
- [x] T020 [US1] Backend: create/update require `slug`; validate format (regex/length) in `backend/src/schemas/blog.py` and `backend/src/services/blog_service.py`
- [x] T021 [US1] Run frontend unit test for slug suggest — must pass

**Checkpoint**: Slug field and auto-suggest work; create/update require slug

---

## Phase 5: User Story 2 — Unique, Editable Slug Validation (Priority: P1)

**Goal**: Real-time debounced slug check; publish rejects duplicate slug with inline error.

**Independent Test**: Type slug matching published post → after ~500 ms see warning; attempt publish → blocked with error. Edit own post without changing slug → save succeeds.

### Tests for User Story 2

- [x] T022 [P] [US2] Write integration tests: check-slug returns available/taken; publish with duplicate slug returns 409/400; exclude_post_id in `backend/tests/test_blog_api.py` — run: must FAIL

### Implementation for User Story 2

- [x] T023 [US2] Implement GET `/api/blog/posts/check-slug?slug=...&exclude_post_id=...` and enforce slug uniqueness at publish in `backend/src/api/blog.py` and `backend/src/services/blog_service.py`
- [x] T024 [US2] Frontend: add checkSlug to api; debounced 500 ms slug check; show inline warning "URL already taken" in `frontend/src/pages/BlogManageEditPage.tsx` and `frontend/src/services/api.ts`
- [x] T025 [US2] Run backend tests for slug check and publish uniqueness — must pass

**Checkpoint**: Slug uniqueness enforced; real-time warning in editor

---

## Phase 6: User Story 3 — Posts Accessible via Slug URL (Priority: P1)

**Goal**: Public URL `/blog/post/<slug>`; 301 from old slug; 404 for nonexistent or draft.

**Independent Test**: Publish post with slug → GET `/blog/post/<slug>` 200; change slug → GET old slug 301 to new; GET nonexistent slug 404.

### Tests for User Story 3

- [x] T026 [P] [US3] Write integration tests: GET by slug 200 for published; 301 from slug_history; 404 for draft and nonexistent in `backend/tests/test_blog_api.py` — run: must FAIL

### Implementation for User Story 3

- [x] T027 [US3] Implement GET `/api/blog/posts/by-slug/{slug}`: resolve published by slug → 200; else slug_history → 301; else 404 in `backend/src/services/blog_service.py` and `backend/src/api/blog.py`
- [x] T028 [US3] Frontend: add route `/blog/post/:slug` and fetch post by slug in `frontend/src/App.tsx` and `frontend/src/pages/BlogPostPage.tsx`
- [x] T029 [US3] Frontend: BlogPage and BlogManagePage and BlogPostCard link to `/blog/post/<slug>` in `frontend/src/pages/BlogPage.tsx`, `frontend/src/pages/BlogManagePage.tsx`, `frontend/src/components/BlogPostCard.tsx`
- [x] T030 [US3] Frontend api: add getPostBySlug and handle 301 redirect in `frontend/src/services/api.ts`
- [x] T031 [US3] Run backend tests for by-slug and redirect — must pass

**Checkpoint**: Public viewing by slug and 301 from old slug work

---

## Phase 7: User Story 4 — SEO Meta Fields on Post Editor (Priority: P2)

**Goal**: SEO section (title 60 chars, description 160 chars, counters); page head has title, meta description, canonical.

**Independent Test**: Set SEO title/description → view source on post page → correct `<title>`, `<meta name="description">`, `<link rel="canonical">`.

### Tests for User Story 4

- [x] T032 [P] [US4] Write test: post page renders title, meta description, canonical in head (e.g. BlogPostPage or E2E) in `frontend/src/pages/BlogPostPage.test.tsx` — run: must FAIL

### Implementation for User Story 4

- [x] T033 [US4] BlogManageEditPage: add SEO section with SEO title (max 60) and Meta description (max 160) and live character counters in `frontend/src/pages/BlogManageEditPage.tsx`
- [x] T034 [US4] BlogPostPage: use react-helmet-async to set `<title>`, `<meta name="description">`, `<link rel="canonical">` from post (or defaults) in `frontend/src/pages/BlogPostPage.tsx`
- [x] T035 [US4] Backend: ensure get_post response includes `seo_title`, `meta_description` for post page (already in schema; verify in `backend/src/schemas/blog.py` and service)
- [x] T036 [US4] Run tests for SEO meta — must pass

**Checkpoint**: SEO section and meta tags on post page work

---

## Phase 8: User Story 5 — Slug Editing on Existing Posts (Priority: P2)

**Goal**: Slug editable on edit form; on change, old slug 301s to new; empty slug rejected.

**Independent Test**: Edit post, change slug, save → post at new URL; GET old slug → 301 to new. Clear slug, save → validation error.

### Tests for User Story 5

- [x] T037 [P] [US5] Write integration test: PATCH slug updates post; GET old slug returns 301 to new slug in `backend/tests/test_blog_api.py` — run: must FAIL

### Implementation for User Story 5

- [x] T038 [US5] blog_service: on slug change (PATCH), insert previous slug into slug_history before updating in `backend/src/services/blog_service.py`
- [x] T039 [US5] Frontend: ensure slug field is editable on edit page and PATCH sends slug; empty slug validation in `frontend/src/pages/BlogManageEditPage.tsx`
- [x] T040 [US5] Run backend tests for slug history and 301 — must pass

**Checkpoint**: Slug editing and 301 from old slug work

---

## Phase 9: Migration of Existing Posts

**Purpose**: Backfill slug and status for posts created before this feature.

- [x] T041 Implement migrate_blog_slugs script: for each post without slug set slug from title (slugify), resolve collisions with -2, -3 by created_at; set status=published in `backend/src/scripts/migrate_blog_slugs.py`
- [x] T042 Run migration script in dev; verify existing posts have slug and status; run rebuild_search_index if needed

---

## Phase 10: Polish & Cross-Cutting

**Purpose**: E2E, docs, full suite validation.

- [x] T043 Update E2E: use slug URLs, draft/publish flow, SEO meta in head in `frontend/e2e/07-blog-section.spec.ts`
- [x] T044 Update `docs/e2e-scenarios.md` with new/updated blog scenarios (slug, draft/publish, meta) if any
- [x] T045 Run full backend test suite: `cd backend && pytest`
- [x] T046 Run full frontend test suite: `cd frontend && npm test -- --run`
- [x] T047 Run E2E: `npm run e2e:up && npm run e2e:test && npm run e2e:down`
- [x] T048 Validate quickstart steps in `specs/012-blog-seo-slugs/quickstart.md`

---

## Dependencies & Execution Order

### Phase Dependencies

- **Phase 1 (Setup)**: No dependencies.
- **Phase 2 (Foundational)**: Depends on Phase 1. BLOCKS all user stories.
- **Phase 3 (US0)**: Depends on Phase 2. Base for slug + status semantics.
- **Phase 4 (US1)**: Depends on Phase 2 + US0 (slug and status in API).
- **Phase 5 (US2)**: Depends on Phase 2 + US0 (published posts exist to check).
- **Phase 6 (US3)**: Depends on Phase 2 + US0 (slug, status, slug_history table).
- **Phase 7 (US4)**: Depends on US3 (canonical URL from slug).
- **Phase 8 (US5)**: Depends on US3 (GET by slug, slug_history).
- **Phase 9 (Migration)**: Depends on Phase 2 + Phase 8 (slug_history in place).
- **Phase 10 (Polish)**: Depends on all story phases complete.

### User Story Dependencies

- **US0**: After Foundational — no other story dependency.
- **US1**: After US0 (slug + status in create/update).
- **US2**: After US0 (published posts for uniqueness).
- **US3**: After US0 (public by slug, 301 from history).
- **US4**: After US3 (canonical uses slug URL).
- **US5**: After US3 (slug change → history → 301).

### Within Each User Story

- Tests MUST be written and FAIL before implementation.
- Backend service/API before frontend where applicable.
- Run story tests after implementation to confirm pass.

### Parallel Opportunities

- T001 can run anytime (Setup).
- T004, T005 (models) can run in parallel.
- T010, T018, T022, T026, T032, T037 (test tasks) can run in parallel within their phases after dependencies.
- After Foundational, US0 must complete before US1–US5; US1, US2, US3 can then proceed in parallel; US4 after US3; US5 after US3.

---

## Parallel Example: After Foundational

```bash
# US0 tests then implementation (sequential)
# Then in parallel:
# - US1: slug auto-suggest (frontend + backend validation)
# - US2: check-slug endpoint + frontend debounce
# - US3: GET by slug + frontend route and links
# Then US4 (SEO), US5 (slug edit)
```

---

## Implementation Strategy

### MVP First (US0 + US1 + US2 + US3)

1. Complete Phase 1 + Phase 2 (Setup + Foundational).
2. Complete Phase 3 (US0 Draft/Published).
3. Complete Phase 4 (US1 Auto-suggest slug).
4. Complete Phase 5 (US2 Slug uniqueness).
5. Complete Phase 6 (US3 Slug URL + 301).
6. **STOP and VALIDATE**: Public can read by slug; draft/publish and uniqueness work.
7. Add Phase 7 (US4 SEO meta) and Phase 8 (US5 slug editing); then Phase 9 migration and Phase 10 polish.

### Incremental Delivery

- After Phase 3: Draft/publish and status in list — demo.
- After Phase 6: Full public slug URLs and 301 — demo.
- After Phase 7: SEO meta in head — demo.
- After Phase 8: Slug editing and history — demo.
- After Phase 9: Existing posts migrated — ready for release.

---

## Notes

- [P] = different files, no dependency on other tasks in same phase.
- [USn] = task belongs to that user story for traceability.
- Every task includes a file path or clear scope.
- TDD: run each “must FAIL” test before implementing; confirm “must pass” after implementation.
- Commit after each task or logical group; stop at checkpoints to validate story independently.
