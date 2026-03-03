# Tasks: Blog Section

**Input**: Design documents from `specs/011-blog-section/`  
**Prerequisites**: plan.md ✅ | spec.md ✅ | research.md ✅ | data-model.md ✅ | contracts/ ✅ | quickstart.md ✅

**Tests**: Per the Qualityboard constitution (TDD + Red-Green-Refactor), ALL test tasks MUST be written and confirmed failing **before** the corresponding implementation tasks. Tests are not optional.

**Organization**: Grouped by user story. Each phase is an independently shippable increment.

---

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: Add Meilisearch as a new Docker service and install new packages. No user story work starts until complete.

- [x] T001 Add `meilisearch` service block to `docker/docker-compose.dev.yml` (image `getmeili/meilisearch:v1.6`, port 7700, `meilisearch_data` volume, `MEILI_MASTER_KEY` env, healthcheck)
- [x] T002 [P] Add `meilisearch` service block to `docker/docker-compose.e2e.yml` (same image, no port exposure, `MEILI_ENV=development`, depends on backend)
- [x] T003 [P] Add `meilisearch` service block to `docker/docker-compose.prod.yml` (no port exposure, `MEILI_ENV=production`)
- [x] T004 Add `MEILISEARCH_URL` and `MEILISEARCH_MASTER_KEY` to backend Settings (`backend/src/core/config.py`) and `.env.example`
- [x] T005 Install `meilisearch` Python package: add to `backend/requirements.txt` (and/or `pyproject.toml`)
- [x] T006 [P] Install TipTap npm packages: `@tiptap/react @tiptap/starter-kit @tiptap/extension-image @tiptap/extension-link` — add to `frontend/package.json`

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Core backend entities, search service, schemas, auth extension, and frontend API client. All user stories depend on these.

**⚠️ CRITICAL**: No user story work can begin until this phase is complete.

- [x] T007 Add `content_manager = "content_manager"` to `UserRole` enum in `backend/src/models/user.py`
- [x] T008 Create Alembic migration `backend/migrations/versions/20260302_001_blog_posts.py`: add `content_manager` enum value (autocommit block), create `blog_posts` table, add `idx_blog_posts_created_at` and `idx_blog_posts_creator_id` indexes
- [x] T009 [P] Create `BlogPost` SQLAlchemy model in `backend/src/models/blog_post.py` (fields: id, title, body, author, creator_id FK, created_at, updated_at; `creator` relationship to `User`)
- [x] T010 Update `backend/src/models/__init__.py` to import `BlogPost` (ensures Alembic detects the model)
- [x] T011 [P] Create Pydantic schemas in `backend/src/schemas/blog.py`: `BlogPostCreate`, `BlogPostUpdate`, `BlogPostResponse` (with `author_display`, `is_edited` computed fields), `BlogPostSummary`, `BlogPostListResponse`, `BlogSearchHit`, `BlogSearchListResponse`
- [x] T012 [P] Add `get_optional_user` dependency to `backend/src/core/auth.py`: mirrors `get_current_user` but returns `User | None` instead of raising 401
- [x] T013 Write unit test `backend/tests/unit/test_blog_search_service.py` — mock `meilisearch.Client`; assert `upsert()` sends correct document shape; assert `delete()` calls index delete; assert `search()` maps `_formatted` fields correctly — **run: must FAIL**
- [x] T014 Create `backend/src/services/blog_search_service.py`: `BlogSearchService` wrapping `meilisearch` Python client; methods `upsert(post, creator_display_name)`, `delete(post_id)`, `search(q, limit, page)` → returns `BlogSearchListResponse`; sets searchable/displayed attributes on first call; Meilisearch errors are caught, logged, and swallowed (not re-raised)
- [x] T015 Confirm `test_blog_search_service.py` tests now **PASS**
- [x] T016 [P] Add `blogApi` typed methods to `frontend/src/services/api.ts`: `list(params?)`, `get(id)`, `create(data)`, `update(id, data)`, `remove(id)`, `uploadImage(file)` — DTOs: `BlogPostSummaryDto`, `BlogPostDetailDto`, `BlogSearchHitDto`
- [x] T017 [P] Create `ContentManagerRoute` guard component in `frontend/src/App.tsx` (or `frontend/src/components/ContentManagerRoute.tsx`): redirects unauthenticated users to `/login`, non-permitted roles to `/dashboard`
- [x] T018 Create `backend/src/scripts/rebuild_search_index.py`: async script that queries all blog posts from PostgreSQL and upserts them all into Meilisearch `blog_posts` index

**Checkpoint**: Foundation ready — user story implementation can now begin.

---

## Phase 3: User Story 1 — Public Blog Reading (Priority: P1) 🎯 MVP

**Goal**: Any unauthenticated visitor can see the blog section on the landing page, navigate to a dedicated `/blog` page with a "Latest" section and live debounced fulltext search with highlighting.

**Independent Test**: Open the app in incognito. Confirm the landing page shows a blog section. Click "See all posts" → `/blog` renders a "Latest" section. Search for a word in an existing post → results appear with matched text wrapped in `<em>` tags.

### Tests for User Story 1 ⚠️ Write first — must FAIL before implementation

- [x] T019 [P] [US1] Write `backend/tests/test_blog_api.py` — add `test_public_list_returns_posts_without_auth`: no session cookie → `GET /api/blog/posts` → 200, `items` list in response
- [x] T020 [P] [US1] Write `backend/tests/test_blog_api.py` — add `test_search_delegates_to_meilisearch`: `GET /api/blog/posts?q=foo` with mocked `BlogSearchService.search` → 200, response contains `is_search_result: true` items
- [x] T021 [P] [US1] Write Vitest test `frontend/src/components/BlogPostCard.test.tsx`: renders title, date, author_display; shows creator name when author is empty; links to `/blog/{id}`
- [x] T022 [P] [US1] Write Vitest test `frontend/src/pages/BlogPage.test.tsx`: renders "Latest" heading; renders search input; typing in search input calls API after debounce
- [x] T023 [P] [US1] Write E2E scenario file `frontend/e2e/07-blog-section.spec.ts` — add scenario `E35: landing page shows blog section without login`; run to confirm **FAIL**

### Implementation for User Story 1

- [x] T024 [US1] Create `backend/src/api/blog.py` with `APIRouter(prefix="/blog", tags=["blog"])`; implement `GET /posts` endpoint: if `?q` present → delegates to `BlogSearchService.search`, else → `blog_service.list_posts`; uses `get_optional_user`
- [x] T025 [US1] Implement `list_posts(db, limit, page)` in `backend/src/services/blog_service.py`: queries `blog_posts` ORDER BY `created_at DESC`, returns `BlogPostListResponse` with `body_excerpt` (first 200 chars of plain text)
- [x] T026 [US1] Register blog router in `backend/src/app/main.py`: `app.include_router(blog_router, prefix="/api")`
- [x] T027 [US1] Confirm `test_public_list_returns_posts_without_auth` and `test_search_delegates_to_meilisearch` **PASS**
- [x] T028 [P] [US1] Create `frontend/src/components/BlogPostCard.tsx` + `BlogPostCard.css` (BEM): card with title, author_display, date, excerpt; links to `/blog/{id}`; dark-canvas design-system styling
- [x] T029 [US1] Add blog preview section to `frontend/src/pages/Landing.tsx`: fetches `GET /api/blog/posts?limit=3` on mount (no auth); renders up to 3 `BlogPostCard` components; shows empty state if no posts; includes "See all posts" button linking to `/blog`
- [x] T030 [US1] Create `frontend/src/pages/BlogPage.tsx` + `BlogPage.css`: renders "Latest" `<section>` with `BlogPostCard` list; search `<input>` with 300ms debounce; on search → replaces "Latest" with `BlogSearchResults` using `<em>` highlighted text; "No results found" empty state; "See all" resets search
- [x] T031 [US1] Add `/blog` route (public, no guard) to `frontend/src/App.tsx`
- [x] T032 [US1] Confirm Vitest tests in `BlogPostCard.test.tsx` and `BlogPage.test.tsx` **PASS**
- [x] T033 [US1] Confirm E2E scenario E35 **PASSES**; update `docs/e2e-scenarios.md` with E35 entry

**Checkpoint**: User Story 1 fully functional and independently testable. Public blog readable without login.

---

## Phase 4: User Story 2 — Content Manager Authoring (Priority: P2)

**Goal**: Users with `content-manager` role can create, edit, and delete blog posts with a TipTap WYSIWYG editor (including image upload and live preview). App header shows "Blog" nav item. Role cannot access campaigns or admin.

**Independent Test**: Log in as `content@example.com` (content-manager role). Verify "Blog" in header; verify no "Campaigns" or "Admin" access. Create a post → verify it appears on `/blog`. Edit → verify changes public. Delete → verify removed. Buyer login → no "Blog" header item.

### Tests for User Story 2 ⚠️ Write first — must FAIL before implementation

- [x] T034 [P] [US2] Write `backend/tests/test_blog_api.py` — add `test_create_requires_content_manager_role` (buyer → 403), `test_unauthenticated_cannot_create_post` (no session → 401), `test_create_post_as_content_manager` (→ 201, all fields), `test_create_post_as_admin` (→ 201)
- [x] T035 [P] [US2] Write `backend/tests/test_blog_api.py` — add `test_update_post` (PATCH → 200, `updated_at` changes, `is_edited` true), `test_delete_post` (DELETE → 204, subsequent GET → 404), `test_buyer_cannot_delete_post` (→ 403)
- [x] T036 [P] [US2] Write `backend/tests/unit/test_blog_service.py` — `test_create_calls_search_upsert` (mock search service; verify upsert called after create), `test_delete_calls_search_delete` (verify delete called after remove)
- [x] T037 [P] [US2] Write Vitest test `frontend/src/components/AppHeader.test.tsx` (extend existing): "Blog" link visible for content-manager; "Blog" link visible for admin; "Blog" link NOT visible for buyer
- [x] T038 [P] [US2] Write Vitest test `frontend/src/pages/BlogManagePage.test.tsx`: renders post list table with title/date/creator columns; Edit and Delete buttons present per row; search input filters rows
- [x] T039 [P] [US2] Write Vitest test `frontend/src/pages/BlogManageEditPage.test.tsx`: title and body inputs present; Preview button renders `RichTextRenderer` with current body; Save calls `blogApi.create` or `blogApi.update`; empty title prevents save
- [x] T040 [P] [US2] Add E2E scenarios E36–E40 to `frontend/e2e/07-blog-section.spec.ts`; run to confirm **FAIL**

### Implementation for User Story 2

- [x] T041 [US2] Implement `create_post`, `update_post`, `delete_post` in `backend/src/services/blog_service.py`; each calls `blog_search_service.upsert`/`delete` after PostgreSQL write
- [x] T042 [US2] Implement `POST /posts`, `PATCH /posts/{id}`, `DELETE /posts/{id}` endpoints in `backend/src/api/blog.py`; role check: `content_manager` or `admin`; `POST /images` using MinIO `core/storage.py` under `blog-images/` key prefix
- [x] T043 [US2] Confirm backend create/update/delete/image tests **PASS** (T034–T036)
- [x] T044 [P] [US2] Create `frontend/src/components/RichTextEditor.tsx`: TipTap editor with `StarterKit`, `Link`, `Image` (image uploadFn calls `blogApi.uploadImage`); outputs HTML; BEM styled for dark canvas
- [x] T045 [US2] Create `frontend/src/pages/BlogManagePage.tsx` + `BlogManagePage.css`: paginated table of all posts (title, created_at, creator, author); Sort by title / date; keyword search filter (ILIKE via API `?search=`); Edit → `/blog/manage/{id}`; Delete with confirmation modal; "New post" → `/blog/manage/new`
- [x] T046 [US2] Create `frontend/src/pages/BlogManageEditPage.tsx` + `BlogManageEditPage.css`: title input, author input (optional), `RichTextEditor` body; "Preview" toggle renders `RichTextRenderer` alongside; "Save" calls create/update; form validation (title and body required); success → navigate to manage list
- [x] T047 [US2] Update `frontend/src/components/AppHeader.tsx`: add "Blog" `<Link to="/blog/manage">` visible only when `profile?.role === "content_manager" || profile?.role === "admin"`
- [x] T048 [US2] Add routes to `frontend/src/App.tsx`: `/blog/manage` (ContentManagerRoute → BlogManagePage), `/blog/manage/new` (ContentManagerRoute → BlogManageEditPage), `/blog/manage/:id` (ContentManagerRoute → BlogManageEditPage)
- [x] T049 [US2] Add `?search=` / `?sort_by=` / `?sort_dir=` query params to `GET /api/blog/posts` for the management list (PostgreSQL ILIKE; distinct from Meilisearch `?q=` path); update `list_posts` service accordingly
- [x] T050 [US2] Confirm all Vitest tests in T037–T039 **PASS**
- [x] T051 [US2] Confirm E2E scenarios E36–E40 **PASS**; update `docs/e2e-scenarios.md` with E36–E40 entries

**Checkpoint**: Content manager authoring fully functional. Blog post lifecycle (create → search-indexed → public → edit → delete) is end-to-end complete.

---

## Phase 5: User Story 3 — Blog Post Reading Page (Priority: P3)

**Goal**: Any unauthenticated visitor can open a full blog post via direct URL, see the full formatted body, author (fallback to creator), creation date, and — only when edited — a "last updated" date.

**Independent Test**: Navigate directly to `/blog/{uuid}` without logging in. Confirm all fields render. Check that `is_edited=false` hides the "last updated" line. Edit the post as content-manager; reload → "last updated" appears.

### Tests for User Story 3 ⚠️ Write first — must FAIL before implementation

- [x] T052 [P] [US3] Write `backend/tests/test_blog_api.py` — add `test_public_get_returns_post_without_auth` (no session → GET `/api/blog/posts/{id}` → 200, full body in response), `test_get_nonexistent_post_returns_404`
- [x] T053 [P] [US3] Write `backend/tests/test_blog_api.py` — add `test_author_fallback_to_creator` (post with `author=null` → `author_display` equals creator's `display_name`), `test_last_updated_only_after_edit` (`is_edited=false` on new post; `is_edited=true` after PATCH)
- [x] T054 [P] [US3] Write Vitest test `frontend/src/components/RichTextRenderer.test.tsx`: renders HTML body without showing raw tags; applies `blog-content` CSS class
- [x] T055 [P] [US3] Write Vitest test `frontend/src/pages/BlogPostPage.test.tsx`: renders title, body, author_display, created_at; shows "last updated" when `is_edited=true`; hides "last updated" when `is_edited=false`; renders "Back to blog" link
- [x] T056 [P] [US3] Add E2E scenarios E41–E42 to `frontend/e2e/07-blog-section.spec.ts`; run to confirm **FAIL**

### Implementation for User Story 3

- [x] T057 [US3] Implement `get_post(db, post_id)` in `backend/src/services/blog_service.py`: queries by id, raises `HTTPException(404)` if not found; returns `BlogPostResponse` with `author_display` fallback and `is_edited` flag
- [x] T058 [US3] Implement `GET /posts/{id}` endpoint in `backend/src/api/blog.py` using `get_optional_user`
- [x] T059 [US3] Confirm backend tests T052–T053 **PASS**
- [x] T060 [P] [US3] Create `frontend/src/components/RichTextRenderer.tsx`: renders HTML body via `dangerouslySetInnerHTML` inside a `<div className="blog-content">`; `blog-content` CSS class scoped styles for typography (headings, paragraphs, images)
- [x] T061 [US3] Create `frontend/src/pages/BlogPostPage.tsx` + `BlogPostPage.css`: fetches `GET /api/blog/posts/{id}`; renders title, `RichTextRenderer` for body, author_display, created_at; conditionally renders "Last updated: {date}" when `is_edited=true`; "Back to blog" link; 404 not-found state
- [x] T062 [US3] Add `/blog/:id` route (public) to `frontend/src/App.tsx`
- [x] T063 [US3] Confirm Vitest tests T054–T055 **PASS**
- [x] T064 [US3] Confirm E2E scenarios E41–E42 **PASS**; update `docs/e2e-scenarios.md` with E41–E42 entries

**Checkpoint**: All three user stories independently functional. Full public blog + authoring + post reading working end-to-end.

---

## Phase 6: Polish & Cross-Cutting Concerns

- [x] T065 [P] Initialize Meilisearch index settings on backend startup: in `backend/src/app/main.py` lifespan, call `blog_search_service.ensure_index_configured()` to set `searchableAttributes`, `displayedAttributes`, `highlightPreTag/PostTag`
- [x] T066 [P] Add management `GET /api/blog/posts` variant for content-manager list (`?search=`, `?sort_by=`, `?sort_dir=`, `?page=`) to backend API contracts documentation in `specs/011-blog-section/contracts/`
- [x] T067 [P] Update `docs/e2e-scenarios.md` total scenario count (E35–E42 = 8 new scenarios); verify all scenario entries are present
- [x] T068 Run full backend test suite: `cd backend && pytest` — confirm all pass, no regressions
- [x] T069 Run full frontend test suite: `cd frontend && npm test` — confirm all pass, no regressions
- [ ] T070 Run full E2E suite: `npm run e2e:up && npm run e2e:test && npm run e2e:down`
- [ ] T071 [P] Update `specs/011-blog-section/checklists/requirements.md` — mark all FR items as implemented

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: No dependencies — can start immediately
- **Foundational (Phase 2)**: Depends on Phase 1 (Docker + packages) — **BLOCKS all user stories**
- **US1 (Phase 3)**: Depends on Phase 2 — `list_posts`, `blogApi.list`, `GET /posts` endpoint required
- **US2 (Phase 4)**: Depends on Phase 2 — builds on Phase 3 public infrastructure; can overlap with Phase 3 on different files
- **US3 (Phase 5)**: Depends on Phase 2; `GET /posts/{id}` endpoint — independent from US2 except `RichTextRenderer` is shared
- **Polish (Phase 6)**: Depends on Phases 3–5 complete

### User Story Dependencies

- **US1 (P1)**: No inter-story dependencies; needs Foundational complete
- **US2 (P2)**: Shares `blog_service.py` and `blog.py` router with US1 — implement in separate functions, no blocking dependency
- **US3 (P3)**: Uses `BlogPostCard` from US1; `RichTextRenderer` created here is also imported by US2 Preview — implement US3 renderer before US2 preview OR use a stub in US2

### Within Each User Story

1. Tests MUST be written first and confirmed **failing**
2. Backend service → backend endpoint → confirm tests pass
3. Frontend component → page → route → confirm tests pass
4. E2E scenario last (requires full stack)

### Parallel Opportunities

- T001, T002, T003 — Docker compose files (3 separate files)
- T009, T011, T012 — model, schemas, auth — separate files
- T019, T020, T021, T022, T023 — all US1 tests (separate files)
- T034, T035, T036, T037, T038, T039, T040 — all US2 tests (separate files)
- T052, T053, T054, T055, T056 — all US3 tests (separate files)
- T028 (`BlogPostCard`) and T029 (`Landing`) — separate components
- T044 (`RichTextEditor`) and T045 (`BlogManagePage`) — separate files

---

## Parallel Example: User Story 2 Tests

```bash
# Launch all US2 test tasks simultaneously (all separate files):
Task: "T034 Write backend create/auth tests in backend/tests/test_blog_api.py"
Task: "T035 Write backend update/delete tests in backend/tests/test_blog_api.py"
Task: "T036 Write unit test for blog_service search sync in backend/tests/unit/test_blog_service.py"
Task: "T037 Extend AppHeader Vitest tests in frontend/src/components/AppHeader.test.tsx"
Task: "T038 Write BlogManagePage Vitest test in frontend/src/pages/BlogManagePage.test.tsx"
Task: "T039 Write BlogManageEditPage Vitest test in frontend/src/pages/BlogManageEditPage.test.tsx"
```

---

## Implementation Strategy

### MVP First (User Story 1 + Foundational)

1. Complete Phase 1: Setup (Docker + packages)
2. Complete Phase 2: Foundational (model, migration, search service, schemas, auth)
3. Complete Phase 3: User Story 1 (public reading — landing + `/blog` page + search)
4. **STOP and VALIDATE**: incognito browser test — landing shows posts, search highlights results
5. MVP delivered: public blog is live and searchable

### Incremental Delivery

1. Phase 1 + 2 → Foundation ready
2. Phase 3 → Public blog working (E35 E2E green) → Demo
3. Phase 4 → Content manager can author (E36–E40 E2E green) → Demo
4. Phase 5 → Post reading page (E41–E42 E2E green) → Demo
5. Phase 6 → Polish + full test suite green → Merge to main

---

## Notes

- `[P]` = can run in parallel with other `[P]` tasks in the same phase (different files, no dependencies)
- `[USn]` = maps task to User Story n for traceability
- Always confirm tests FAIL before writing implementation code (Red-Green-Refactor)
- Commit after each checkpoint or logical group
- Meilisearch sync failures must not fail HTTP requests — log and swallow
- Management list search uses PostgreSQL ILIKE; public blog fulltext search uses Meilisearch — these are distinct code paths
