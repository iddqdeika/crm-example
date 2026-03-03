# Tasks: Campaign UI Design

**Input**: Design documents from `specs/009-campaign-ui-design/`  
**Prerequisites**: plan.md ✅, spec.md ✅

**Tests**: This feature is purely visual/CSS. Existing Playwright E2E tests serve as design compliance tests (CSS token assertions are already present in `frontend/e2e/06-design-compliance.spec.ts`). New Vitest component tests will verify class names are applied without breaking rendering. Per the test-driven approach: component tests must be written first (failing), then implementation makes them green.

**Organization**: Tasks grouped by user story to enable independent implementation and verification.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no dependencies)
- **[Story]**: Which user story this task belongs to (US1, US2, US3)

---

## Phase 1: Setup

**Purpose**: Add shimmer animation to shared CSS and prepare BEM class names in JSX (non-visual, structural changes only)

- [x] T001 Add `@keyframes shimmer` animation to `frontend/src/index.css` with `prefers-reduced-motion` media query suppression
- [x] T002 [P] Update `frontend/src/pages/Campaigns.tsx` — replace `<main className="page">` with `<main className="campaigns">` and assign BEM class names to all child elements (toolbar, table, thead, tbody, rows, cells, archive button, search input, column-setup button, empty state, total count, loading placeholder)
- [x] T003 [P] Update `frontend/src/pages/CampaignNewPage.tsx` — replace `<main className="page">` with `<main className="campaign-new">` and assign BEM class names to all child elements (heading, form, field wrappers, labels, inputs, selects, error, submit button, back link)
- [x] T004 [P] Update `frontend/src/pages/CampaignEditPage.tsx` — replace `<main className="page">` with `<main className="campaign-edit">` and assign BEM class names to all child elements (heading, form, fields, ad-group accordion items, accordion headers, accordion bodies, creative rows, archived notice, conflict alert, all action buttons, back link, loading placeholder)
- [x] T005 [P] Update `frontend/src/components/ColumnSetupPopup.tsx` — assign BEM class names to all elements (overlay, modal, header, column list, checkbox items, save/cancel buttons)

**Checkpoint**: All JSX has BEM class names; pages visually unchanged (no CSS files yet). Run `npm test` and confirm all existing component tests pass.

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Establish the shared style primitives that all three pages depend on — form field tokens, button token mapping, and skeleton loader component pattern. These must exist before any page-specific CSS is authored.

- [x] T006 Write failing Vitest component test for `Campaigns.tsx` in `frontend/src/pages/Campaigns.test.tsx` — assert `<main>` has class `campaigns` and table has class `campaigns__table`
- [x] T007 Write failing Vitest component test for `CampaignNewPage.tsx` in `frontend/src/pages/CampaignNewPage.test.tsx` — assert `<main>` has class `campaign-new` and submit button has class `campaign-new__btn`
- [x] T008 Write failing Vitest component test for `CampaignEditPage.tsx` in `frontend/src/pages/CampaignEditPage.test.tsx` — assert `<main>` has class `campaign-edit` and ad group blocks have class `campaign-edit__ad-group-block`

**Checkpoint**: T006–T008 fail (red). Phase 1 JSX changes (T002–T005) can now make them green. Run `npm test` — T006–T008 should now pass if Phase 1 is complete.

---

## Phase 3: User Story 1 — Campaign Listing Page (Priority: P1) 🎯 MVP

**Goal**: Style the campaigns listing page with a proper dark-canvas data table, color-coded status badges, styled toolbar and search, row hover feedback, sort indicators, skeleton loader, and empty state message.

**Independent Test**: Log in as a buyer → navigate to `/campaigns` → verify dark table, status badges, hover rows, styled search/toolbar, skeleton on load, empty state when no campaigns. Run `npm run e2e:test` to confirm Playwright design-compliance tests pass.

### Implementation for User Story 1

- [x] T009 [US1] Create `frontend/src/pages/Campaigns.css` — page layout and heading (`.campaigns` block, `.campaigns__heading`, max-width 72rem, padding using spacing tokens, Syne heading font)
- [x] T010 [US1] Add toolbar styles to `frontend/src/pages/Campaigns.css` — `.campaigns__toolbar` (flex row, gap, wrap on mobile), `.campaigns__search` (dark input with border, focus ring using accent-3), `.campaigns__columns-btn` (ghost button style)
- [x] T011 [US1] Add CTA button styles to `frontend/src/pages/Campaigns.css` — `.campaigns__create-btn` styled as primary CTA (accent-1 background, dark text, min-height 44px, hover lift with glow, focus ring)
- [x] T012 [US1] Add table container styles to `frontend/src/pages/Campaigns.css` — `.campaigns__table-wrapper` (horizontal scroll on mobile), `.campaigns__table` (full width, border-collapse, bg-secondary background)
- [x] T013 [US1] Add table header styles to `frontend/src/pages/Campaigns.css` — `.campaigns__th` (Outfit font, text-secondary color, border-bottom, text-align left), `.campaigns__th--sortable` (cursor pointer, hover bg-elevated), sort indicator unicode characters styled with accent-3 color
- [x] T014 [US1] Add table body/row styles to `frontend/src/pages/Campaigns.css` — `.campaigns__tr` (border-bottom), `.campaigns__tr:hover` (bg-elevated background), `.campaigns__td` (Outfit font, text-primary, padding sm/xs, vertical-align middle), text overflow ellipsis for name column
- [x] T015 [US1] Add status badge styles to `frontend/src/pages/Campaigns.css` — `.campaigns__status-badge` (pill shape: border-radius 999px, padding 2px 10px, font-size small, font-weight 500), `.campaigns__status-badge--active` (accent-1 text + semi-transparent accent-1 background), `.campaigns__status-badge--pause` (accent-3 text + semi-transparent accent-3 background), `.campaigns__status-badge--archive` (text-muted + bg-elevated background)
- [x] T016 [US1] Update `frontend/src/pages/Campaigns.tsx` — render status column cells using the badge markup: `<span className={`campaigns__status-badge campaigns__status-badge--${c.status}`}>{c.status}</span>` instead of plain text
- [x] T017 [US1] Add row action button styles to `frontend/src/pages/Campaigns.css` — `.campaigns__edit-link` (text-secondary link, hover accent-3), `.campaigns__archive-btn` (ghost button, accent-2 hover, min-height 44px), `.campaigns__actions-cell` (flex row, gap xs, white-space nowrap)
- [x] T018 [US1] Add empty state styles to `frontend/src/pages/Campaigns.css` — `.campaigns__empty` (centered block, text-secondary color, font-size body, padding lg, italic or subdued treatment)
- [x] T019 [US1] Add skeleton loader styles to `frontend/src/pages/Campaigns.css` — `.campaigns__skeleton-row` (table row with shimmer bars in place of cells), `.campaigns__skeleton-cell` (bg-elevated bar, border-radius 4px, height 1rem, uses `shimmer` animation from `index.css`)
- [x] T020 [US1] Update `frontend/src/pages/Campaigns.tsx` — replace `<p>Loading…</p>` with skeleton rows markup (render 5 skeleton rows in tbody with correct number of columns while `loading === true`)
- [x] T021 [US1] Add total count / footer styles to `frontend/src/pages/Campaigns.css` — `.campaigns__total` (text-secondary, font-size small, margin-top sm)
- [x] T022 [US1] Add responsive styles to `frontend/src/pages/Campaigns.css` — `@media (max-width: 768px)`: toolbar stacks vertically, search input full-width, table wrapper adds horizontal scroll; `@media (max-width: 480px)`: reduced padding
- [x] T023 [US1] Import `Campaigns.css` at top of `frontend/src/pages/Campaigns.tsx`

**Checkpoint**: Navigate to `/campaigns` — fully styled table, badges, hover, skeleton, empty state. Run `npm test` (T006 green) and `npm run e2e:test` (all tests pass).

---

## Phase 4: User Story 2 — Campaign Edit Page (Priority: P2)

**Goal**: Style the campaign edit page with a properly structured form, collapsible accordion ad groups, styled creative rows, archived notice banner, conflict alert, and consistent button hierarchy. Includes skeleton loading state.

**Independent Test**: Navigate to an existing campaign's edit page → verify styled form fields, accordion ad groups toggle on click, creative rows inline layout, archived banner on archived campaigns, conflict alert appears on 409, skeleton loads. Run `npm run e2e:test` to confirm E2E tests pass.

### Implementation for User Story 2

- [x] T024 [US2] Create `frontend/src/pages/CampaignEditPage.css` — page layout and heading (`.campaign-edit` block, `.campaign-edit__heading`, max-width 72rem, padding using spacing tokens, Syne heading font)
- [x] T025 [US2] Add form field styles to `frontend/src/pages/CampaignEditPage.css` — `.campaign-edit__field` (flex column, gap xs, margin-bottom sm), `.campaign-edit__label` (font-body, font-size small, color text-secondary), `.campaign-edit__input` and `.campaign-edit__select` (dark-surface: bg-secondary background, border 1px solid text-muted, border-radius 6px, padding xs sm, color text-primary, min-height 44px, focus ring using accent-3, disabled state: opacity 0.45 + cursor not-allowed)
- [x] T026 [US2] Add archived notice banner styles to `frontend/src/pages/CampaignEditPage.css` — `.campaign-edit__archived-notice` (display block, background semi-transparent accent-2, border-left 3px solid accent-2, padding sm md, font-body, font-size body, color text-primary, border-radius 0 6px 6px 0, margin-bottom md)
- [x] T027 [US2] Add conflict alert styles to `frontend/src/pages/CampaignEditPage.css` — `.campaign-edit__conflict` (background semi-transparent accent-3, border 1px solid accent-3, border-radius 8px, padding sm md, margin-bottom md, display flex, align-items center, justify-content space-between, visually distinct from archived notice)
- [x] T028 [US2] Add ad groups section styles to `frontend/src/pages/CampaignEditPage.css` — `.campaign-edit__ad-groups` (section container, margin-top lg), `.campaign-edit__ad-groups-heading` (Syne font, font-size h3, font-weight 600, color text-primary, margin-bottom md)
- [x] T029 [US2] Add accordion styles to `frontend/src/pages/CampaignEditPage.css` — `.campaign-edit__ad-group-block` (card container: bg-elevated, border-radius 8px, border 1px solid bg-elevated, margin-bottom md, overflow hidden), `.campaign-edit__ad-group-header` (flex row, justify-content space-between, align-items center, padding sm md, cursor pointer, user-select none, hover bg-secondary), `.campaign-edit__ad-group-header.is-expanded` (border-bottom 1px solid bg-secondary), `.campaign-edit__ad-group-title` (font-body, font-weight 600, color text-primary), `.campaign-edit__ad-group-toggle` (accent-3 color, font-size small, transition 0.2s, `prefers-reduced-motion` rule to disable transition), `.campaign-edit__ad-group-body` (padding md, display none by default), `.campaign-edit__ad-group-body.is-expanded` (display block)
- [x] T030 [US2] Update `frontend/src/pages/CampaignEditPage.tsx` — add `expanded` state tracking per ad group (array of booleans, default `true` for new groups per FR-006), add toggle click handler on `.campaign-edit__ad-group-header`, apply `.is-expanded` modifier class conditionally to header and body elements
- [x] T031 [US2] Add ad group fields grid styles to `frontend/src/pages/CampaignEditPage.css` — `.campaign-edit__ad-group-fields` (CSS grid: 2-column on desktop ≥768px, 1-column on mobile), `.campaign-edit__ad-group-fields .campaign-edit__field` (grid-column span rules as needed)
- [x] T032 [US2] Add creative section styles to `frontend/src/pages/CampaignEditPage.css` — `.campaign-edit__creatives` (margin-top md, padding-top sm, border-top 1px solid bg-elevated), `.campaign-edit__creatives-heading` (font-body, font-size small, font-weight 600, color text-secondary, text-transform uppercase, letter-spacing 0.05em, margin-bottom sm)
- [x] T033 [US2] Add creative row styles to `frontend/src/pages/CampaignEditPage.css` — `.campaign-edit__creative-row` (flex row on desktop: gap sm, align-items center, wrap on mobile), `.campaign-edit__creative-input` and `.campaign-edit__creative-select` (flex 1, min-width 0, inherits input styling from T025), `@media (max-width: 768px)` stacked column layout
- [x] T034 [US2] Add button hierarchy styles to `frontend/src/pages/CampaignEditPage.css` — `.campaign-edit__btn` (base: font-body, font-weight 600, font-size small, border-radius 6px, padding xs md, min-height 44px, cursor pointer, transition), `.campaign-edit__btn--primary` (accent-1 bg, dark text, hover lift + glow), `.campaign-edit__btn--secondary` (transparent bg, border 1px solid text-muted, text-secondary, hover border text-primary), `.campaign-edit__btn--danger` (transparent bg, border 1px solid accent-2, accent-2 text, hover bg semi-transparent accent-2), `.campaign-edit__btn:disabled` (opacity 0.5, cursor not-allowed, transform none), all have focus-visible ring using accent-3
- [x] T035 [US2] Add form actions area styles to `frontend/src/pages/CampaignEditPage.css` — `.campaign-edit__form-actions` (flex row, gap sm, margin-top lg, padding-top md, border-top 1px solid bg-elevated)
- [x] T036 [US2] Add skeleton loader styles to `frontend/src/pages/CampaignEditPage.css` — `.campaign-edit__skeleton` (container with margin-top md), `.campaign-edit__skeleton-field` (shimmer bar styled as a field row: height 56px, border-radius 6px, bg-elevated, uses shimmer animation, margin-bottom sm)
- [x] T037 [US2] Update `frontend/src/pages/CampaignEditPage.tsx` — replace `<main className="page"><p>Loading…</p></main>` with skeleton markup (render 4 skeleton field bars inside `.campaign-edit__skeleton` wrapper)
- [x] T038 [US2] Add back link and error styles to `frontend/src/pages/CampaignEditPage.css` — `.campaign-edit__back-link` (text-secondary, hover accent-3, font-size small, display inline-flex, align-items center, gap xs, margin-top md), `.campaign-edit__form-error` (accent-2 color, font-size small, margin-top xs)
- [x] T039 [US2] Add responsive styles to `frontend/src/pages/CampaignEditPage.css` — `@media (max-width: 768px)` reduced padding, form actions wrap to column, creative rows stack; `@media (max-width: 480px)` compact padding
- [x] T040 [US2] Import `CampaignEditPage.css` at top of `frontend/src/pages/CampaignEditPage.tsx`

**Checkpoint**: Navigate to a campaign edit page — styled form, accordion expands/collapses, archived state visible, skeleton on load. Run `npm test` (T008 green) and `npm run e2e:test` (all tests pass).

---

## Phase 5: User Story 3 — Campaign Creation Page (Priority: P3)

**Goal**: Style the campaign creation page with a clean focused form, matching the design system field/button patterns established in Phase 4.

**Independent Test**: Navigate to `/campaigns/new` → verify styled heading, form fields, primary submit button, validation error in accent-2, loading state on button, back link. Run `npm test` and `npm run e2e:test`.

### Implementation for User Story 3

- [x] T041 [US3] Create `frontend/src/pages/CampaignNewPage.css` — page layout (`.campaign-new` block, max-width 72rem, padding using spacing tokens)
- [x] T042 [US3] Add heading styles to `frontend/src/pages/CampaignNewPage.css` — `.campaign-new__heading` (Syne font, font-size h2, font-weight 700, color text-primary, margin-bottom md)
- [x] T043 [US3] Add form and field styles to `frontend/src/pages/CampaignNewPage.css` — `.campaign-new__form` (max-width 32rem, display flex, flex-direction column, gap md), `.campaign-new__field` (flex column, gap xs), `.campaign-new__label` (font-body, font-size small, color text-secondary), `.campaign-new__input` and `.campaign-new__select` (matches edit page input style: bg-secondary, border, focus ring, min-height 44px, color text-primary, border-radius 6px, padding xs sm)
- [x] T044 [US3] Add validation error styles to `frontend/src/pages/CampaignNewPage.css` — `.campaign-new__error` (accent-2 color, font-size small, margin-top xs, display flex, align-items center, gap xs)
- [x] T045 [US3] Add submit button styles to `frontend/src/pages/CampaignNewPage.css` — `.campaign-new__submit` (primary CTA: accent-1 bg, dark text, font-body, font-weight 600, font-size body, border-radius 6px, padding sm md, min-height 44px, hover lift + glow, disabled state opacity 0.5 + cursor not-allowed, focus-visible ring using accent-3)
- [x] T046 [US3] Add back link styles to `frontend/src/pages/CampaignNewPage.css` — `.campaign-new__back-link` (text-secondary, hover accent-3, font-size small, display inline-flex, align-items center, gap xs, margin-top md)
- [x] T047 [US3] Add responsive styles to `frontend/src/pages/CampaignNewPage.css` — `@media (max-width: 768px)`: form max-width unset (full width), padding reduced; `@media (max-width: 480px)`: compact padding
- [x] T048 [US3] Import `CampaignNewPage.css` at top of `frontend/src/pages/CampaignNewPage.tsx`

**Checkpoint**: Navigate to `/campaigns/new` — styled form with matching input/button patterns. Run `npm test` (T007 green) and `npm run e2e:test` (all tests pass).

---

## Phase 6: ColumnSetupPopup Styling

**Goal**: Style the `ColumnSetupPopup` modal component to match the dark-surface design system, ensuring the popup opened from the campaigns listing page feels visually consistent.

**Independent Test**: Click the "Columns" button on the campaign listing → popup opens with dark modal, styled checkboxes, and consistent save/cancel buttons.

### Implementation for Phase 6

- [x] T049 Create `frontend/src/components/ColumnSetupPopup.css` — modal overlay (`.column-setup-popup__overlay`: fixed position, full viewport, semi-transparent black backdrop, display flex, align-items center, justify-content center, z-index 100)
- [x] T050 Add modal card styles to `frontend/src/components/ColumnSetupPopup.css` — `.column-setup-popup__modal` (bg-secondary background, border 1px solid bg-elevated, border-radius 12px, padding md lg, min-width 280px, max-width 400px, box-shadow 0 8px 32px rgba(0,0,0,0.5))
- [x] T051 Add header and heading styles to `frontend/src/components/ColumnSetupPopup.css` — `.column-setup-popup__heading` (Syne font, font-size h3, font-weight 600, color text-primary, margin-bottom md)
- [x] T052 Add checkbox list styles to `frontend/src/components/ColumnSetupPopup.css` — `.column-setup-popup__list` (list-style none, margin 0, padding 0, display flex, flex-direction column, gap xs), `.column-setup-popup__item` (display flex, align-items center, gap sm, cursor pointer, hover bg-elevated, padding xs, border-radius 4px), `.column-setup-popup__checkbox` (width 18px, height 18px, accent-color accent-1, cursor pointer), `.column-setup-popup__label` (font-body, font-size body, color text-primary, cursor pointer)
- [x] T053 Add action button styles to `frontend/src/components/ColumnSetupPopup.css` — `.column-setup-popup__actions` (display flex, gap sm, margin-top md, justify-content flex-end), `.column-setup-popup__save-btn` (primary: accent-1, min-height 44px), `.column-setup-popup__cancel-btn` (ghost/outlined, min-height 44px), both inherit focus ring from accent-3
- [x] T054 Import `ColumnSetupPopup.css` at top of `frontend/src/components/ColumnSetupPopup.tsx`

**Checkpoint**: Open the column setup popup — styled dark modal with checkboxes and action buttons.

---

## Phase 7: Polish & Cross-Cutting Concerns

**Purpose**: Final cross-cutting improvements, animation, accessibility audit, and E2E validation.

- [x] T055 [P] Audit all focus-visible styles across new CSS files — verify 2px solid accent-3 ring with 2px offset appears on all interactive elements (inputs, buttons, links, accordion headers)
- [x] T056 [P] Audit all touch targets — verify min-height 44px on all buttons, inputs, selects, and accordion headers across all 4 new CSS files
- [x] T057 [P] Verify `prefers-reduced-motion` suppresses shimmer and button hover transforms in `index.css` and all new CSS files
- [x] T058 Run full Playwright E2E test suite (`npm run e2e:up && npm run e2e:test && npm run e2e:down`) — all 33 existing tests must pass
- [x] T059 Run Vitest unit tests (`cd frontend && npm test`) — all unit tests including T006–T008 must pass
- [x] T060 [P] Manual browser check — open at 320px, 768px, 1440px viewports, verify no horizontal overflow, no broken layouts, no unreadable text
- [x] T061 [P] Verify skeleton loader renders correct number of rows/bars for each page (5 rows for listing, 4 field bars for edit form)

---

## Dependencies & Execution Order

### Phase Dependencies

- **Phase 1 (Setup)**: No dependencies — start immediately
- **Phase 2 (Foundational)**: Depends on Phase 1 (BEM classes must exist before tests can assert on them)
- **Phase 3 (US1 Listing)**: Depends on Phase 1 + Phase 2 (T001 shimmer, T002 BEM classes, T006 test)
- **Phase 4 (US2 Edit)**: Depends on Phase 1 + Phase 2 (T001 shimmer, T004 BEM classes, T008 test); can run in parallel with Phase 3
- **Phase 5 (US3 New)**: Depends on Phase 1 + Phase 2 (T003 BEM classes, T007 test); can run in parallel with Phase 3 and 4
- **Phase 6 (Popup)**: Depends on Phase 1 (T005 BEM classes); can run in parallel with Phases 3–5
- **Phase 7 (Polish)**: Depends on all previous phases complete

### User Story Dependencies

- **US1 (P1 — Listing)**: No dependency on US2 or US3
- **US2 (P2 — Edit)**: No dependency on US1 or US3 (shares design patterns but independent CSS files)
- **US3 (P3 — New)**: No dependency on US1 or US2 (reuses edit page patterns but simpler form)

### Within Each Phase

- BEM class updates (T002–T005) BEFORE CSS files for that page
- Failing test written BEFORE implementation tasks
- CSS files imported only AFTER all styles are authored for that page

### Parallel Opportunities

- T002, T003, T004, T005 — all JSX BEM class updates (different files, no deps)
- T006, T007, T008 — all new component test files (different files, no deps)
- T009–T023 (US1), T024–T040 (US2), T041–T048 (US3), T049–T054 (Popup) — all independent once Phase 2 complete
- T055, T056, T057, T060, T061 — all final audit tasks are parallelizable

---

## Parallel Example: Phase 1 + 2

```text
# Run in parallel (different files, no deps):
T002 — Update Campaigns.tsx BEM classes
T003 — Update CampaignNewPage.tsx BEM classes
T004 — Update CampaignEditPage.tsx BEM classes
T005 — Update ColumnSetupPopup.tsx BEM classes

# Then run in parallel (different files, no deps):
T006 — Campaigns component test
T007 — CampaignNewPage component test
T008 — CampaignEditPage component test
```

---

## Implementation Strategy

### MVP First (User Story 1 Only)

1. Complete Phase 1: JSX BEM class names + shimmer animation
2. Complete Phase 2: Write failing component tests
3. Complete Phase 3: Campaign Listing CSS (`Campaigns.css`)
4. **STOP and VALIDATE**: Open `/campaigns` — styled table, badges, hover, skeleton. Run `npm test` + E2E
5. Ship and demo if ready

### Incremental Delivery

1. Phase 1 + 2 → Foundation ready (BEM class names + tests)
2. Phase 3 → Listing page styled ✓ (MVP)
3. Phase 4 → Edit page styled ✓
4. Phase 5 → Creation page styled ✓
5. Phase 6 → Popup styled ✓
6. Phase 7 → Final polish + accessibility audit ✓

---

## Notes

- [P] tasks operate on different files — no merge conflicts
- Skeleton loaders require `@keyframes shimmer` from T001 to be in `index.css` before any page CSS references it
- Accordion collapse state (T030) is the only JS change in this feature — it adds a small `expanded[]` boolean state array to CampaignEditPage, which is minimal and testable
- Commit after each phase checkpoint to keep history clean
- Avoid changing existing test IDs (`data-testid`) or E2E-targeted selectors while adding BEM classes
