# Implementation Plan: Campaign UI Design

**Branch**: `009-campaign-ui-design` | **Date**: 2026-02-26 | **Spec**: [spec.md](spec.md)  
**Input**: Feature specification from `specs/009-campaign-ui-design/spec.md`

## Summary

Add comprehensive dark-canvas design system styling to three campaign-related pages (listing, creation, editing) to match the editorial-industrial aesthetic of other application pages. This includes styled data tables with color-coded status badges, collapsible accordion ad groups, skeleton loading placeholders, and responsive layouts. No new functionality — purely visual/CSS with minor JSX class name updates.

## Technical Context

**Language/Version**: TypeScript + React 18, Python 3.12 (backend unchanged)  
**Primary Dependencies**: React Router v6, existing Vite + Vitest frontend stack; no new npm packages required  
**Storage**: N/A — feature is UI-only, no data model changes  
**Testing**: Vitest (unit/component tests) + Playwright E2E (existing tests must pass)  
**Target Platform**: Web browser, all modern browsers (Chrome, Firefox, Safari, Edge)  
**Project Type**: Web application (frontend feature)  
**Performance Goals**: No performance impact — CSS-only with no JS computation changes  
**Constraints**: Must not break existing Playwright E2E test suite; must comply with WCAG 2.1 AA  
**Scale/Scope**: 3 pages (Campaigns listing, CampaignNewPage, CampaignEditPage), 1 helper component (ColumnSetupPopup), ~4-5 new CSS files

## Constitution Check

**Gate Status**: ✅ PASS

- ✅ **Tests for each story**: Unit tests will verify CSS class application; Vitest component tests for accordion expand/collapse logic; Playwright E2E tests already validate visual behavior (design tokens, accessibility) and will pass post-styling.
- ✅ **Service boundaries**: Single frontend service, no microservice changes. Backend remains unchanged.
- ✅ **Docker/Delivery**: Frontend already containerized via Docker Compose dev/e2e stacks; no new image required.
- ✅ **Deviations**: None — this is pure UI styling following established patterns.

## Project Structure

### Documentation (this feature)

```text
specs/009-campaign-ui-design/
├── spec.md              # Feature specification (completed)
├── plan.md              # This file (phase 1 output)
├── research.md          # Phase 0 output (N/A — no research needed)
├── data-model.md        # Phase 1 output (N/A — no data model changes)
├── contracts/           # Phase 1 output (N/A — no contract changes)
├── quickstart.md        # Phase 1 output (phase 1 below)
└── tasks.md             # Phase 2 output (/speckit.tasks command)
```

### Source Code (repository)

```text
frontend/src/
├── pages/
│   ├── Campaigns.tsx                 (existing, add .campaigns__* classes)
│   ├── Campaigns.css                 (NEW)
│   ├── CampaignNewPage.tsx           (existing, add .campaign-new__* classes)
│   ├── CampaignNewPage.css           (NEW)
│   ├── CampaignEditPage.tsx          (existing, add .campaign-edit__* classes)
│   └── CampaignEditPage.css          (NEW)
└── components/
    ├── ColumnSetupPopup.tsx          (existing, add .column-setup-popup__* classes)
    └── ColumnSetupPopup.css          (NEW)

frontend/src/index.css                (update with shimmer @keyframes animation)
```

**Structure Decision**: Single frontend project with new CSS files co-located next to React components, following existing project patterns. No new directories created.

## Complexity Tracking

> No violations. Feature is straightforward UI styling within one frontend service, using existing design system tokens.

---

## Phase 0: Research

**Status**: ✅ **SKIP** — No research needed.

**Rationale**: 
- All technical decisions resolved in `/speckit.clarify`: accordion pattern, badge styling, skeleton loading.
- Design system fully defined in `docs/design.md` — no exploration needed.
- CSS patterns established by `Admin.css`, `Profile.css`, `Dashboard.css` — no new approaches required.
- No external dependencies to evaluate.

**Artifacts**: None.

---

## Phase 1: Design & Contracts

### 1. Data Model

**Status**: ✅ **SKIP** — No data model changes.

**Rationale**: Feature is UI-only. Campaigns, ad groups, creatives entities unchanged; only visual presentation changes.

### 2. Contracts

**Status**: ✅ **SKIP** — No contract changes.

**Rationale**: 
- No API changes (backend untouched).
- No inter-component contracts exposed.
- Component props and behavior unchanged.

### 3. CSS Architecture & BEM Naming

**Status**: ✅ **BLOCK** — Establish before implementation.

**Decision**: Follow BEM (Block-Element-Modifier) convention already used in Admin.css, Profile.css, Dashboard.css.

**Blocks** (new):
- `.campaigns` — Campaigns listing page wrapper
- `.campaign-new` — CampaignNewPage wrapper
- `.campaign-edit` — CampaignEditPage wrapper
- `.column-setup-popup` — ColumnSetupPopup modal

**Block-level class assignments**:
- Campaigns page: `<main className="page">` → add `<main className="campaigns">`
- CampaignNewPage: `<main className="page">` → add `<main className="campaign-new">`
- CampaignEditPage: `<main className="page">` → add `<main className="campaign-edit">`
- ColumnSetupPopup: new `<div className="column-setup-popup">` wrapper

**Elements** (selected examples):
- `.campaigns__toolbar` — toolbar area (search + buttons)
- `.campaigns__archive-btn` — archive button in row
- `.campaign-edit__ad-group-block` — ad group accordion item
- `.campaign-edit__ad-group-header` — ad group clickable header (toggle)
- `.column-setup-popup__header` — modal header
- `.column-setup-popup__list` — checkbox list

**Modifiers** (examples):
- `.campaign-edit__ad-group-header.is-expanded` — accordion expanded state
- `.admin__btn--primary` — existing pattern, apply to campaign buttons
- `.column-setup-popup__checkbox--disabled` — disabled state

### 4. Styling Deliverables

**Files to create**:

1. **`Campaigns.css`** — Campaign listing page
   - Table styling (header, rows, cells, hover)
   - Toolbar & search input
   - Status badge pills (color-coded)
   - Column header sort indicators
   - Empty state message
   - Skeleton loader (table rows)
   - Mobile responsive (horizontal scroll for table, vertical stack for toolbar)

2. **`CampaignNewPage.css`** — Campaign creation form
   - Form container & fields
   - Button styling
   - Error message styling
   - Loading state on button
   - Mobile responsive

3. **`CampaignEditPage.css`** — Campaign editing form
   - Form fields & layout
   - Accordion ad group headers (clickable, expand/collapse indicator)
   - Accordion body (revealed on expand, hidden on collapse)
   - Creative row styling (inline desktop, stacked mobile)
   - Archived notice banner (accent-2 background/border)
   - Conflict alert styling
   - Button hierarchy (primary, secondary, destructive)
   - Skeleton loader (form fields)
   - Mobile responsive (single column layout for ad group fields)

4. **`ColumnSetupPopup.css`** — Column selection popup
   - Modal/overlay styling
   - Checkbox list styling
   - Save/Cancel button styling
   - Consistent dark-surface design

5. **Update `frontend/src/index.css`**
   - Add shimmer @keyframes animation for skeleton loaders
   - Animation respects `prefers-reduced-motion` media query

### 5. Quickstart

**File**: `specs/009-campaign-ui-design/quickstart.md`

See [quickstart.md](quickstart.md) (generated below).

---

## Quickstart Guide: Campaign UI Design

### Prerequisites

- Node.js 20+
- React 18 + TypeScript
- npm or pnpm
- Familiarity with BEM CSS architecture and CSS custom properties (design tokens)

### Feature Overview

This feature styles three campaign-related pages in the Qualityboard frontend to match the dark-canvas, editorial-industrial design language:

1. **Campaigns Listing** (`/campaigns`) — data table with color-coded status badges, toolbar, search, skeleton loaders
2. **Campaign Creation** (`/campaigns/new`) — clean focused form with validation styling
3. **Campaign Editing** (`/campaigns/:id`) — complex nested form with collapsible accordion ad groups, archived state lockdown

### Running Locally

1. **Start the dev environment**:
   ```bash
   docker compose -f docker/docker-compose.dev.yml up --build
   ```
   Frontend runs at http://localhost:3000, backend at http://localhost:8000.

2. **Log in as a buyer or admin**:
   - Register a new user at `/signup`, or
   - Log in with an existing account

3. **Navigate to campaign pages**:
   - `/campaigns` — listing page (styled table, toolbar, search, color-coded status badges)
   - `/campaigns/new` — creation form
   - `/campaigns/{id}` — edit page with collapsible ad groups and archived state

4. **Verify styling**:
   - Check that pages match the dark-canvas aesthetic (dark backgrounds, vivid accents)
   - Verify color-coded status badges (active=green, pause=violet, archive=muted)
   - Test accordion expand/collapse on ad groups
   - Test mobile responsiveness (< 768px)
   - Verify accessibility: WCAG 2.1 AA contrast, focus indicators, 44px touch targets

### Testing

**Unit/Component Tests**:
```bash
cd frontend && npm test
```
- Vitest runs tests for all components
- Verify that new CSS classes don't break component rendering

**E2E Tests**:
```bash
cd frontend
npm run e2e:up       # start isolated Docker stack
npm run e2e:test     # run Playwright scenarios
npm run e2e:down     # tear down stack
```
- Existing Playwright tests must continue to pass
- Tests verify visual elements match design tokens (colors, fonts, spacing)

**Browser Testing**:
- Test on Chrome, Firefox, Safari, Edge
- Test responsive layouts: 320px, 768px, 1440px+ viewports
- Test with `prefers-reduced-motion: reduce` enabled

### Acceptance Checklist

**Campaigns Listing Page**:
- [ ] Table has dark card-style background
- [ ] Column headers show sort indicators when sorted
- [ ] Rows show elevated background on hover
- [ ] Status badges are color-coded (active=green, pause=violet, archive=muted)
- [ ] Search input is styled like other form inputs
- [ ] "Create campaign" link is a primary CTA button (accent-1 green)
- [ ] Toolbar is vertically stacked on mobile
- [ ] Empty state shows styled placeholder message
- [ ] Skeleton loaders appear while data is loading
- [ ] All text is readable (WCAG 2.1 AA contrast)
- [ ] All buttons/links have visible focus indicators
- [ ] All touch targets ≥ 44px

**Campaign Creation Page**:
- [ ] Form has semantic HTML and proper heading hierarchy
- [ ] Form fields use dark-surface input styling
- [ ] Validation errors use accent-2 color (red-pink)
- [ ] Submit button uses primary CTA styling (accent-1)
- [ ] Loading state visible on submit button during save
- [ ] Layout is single-column on mobile
- [ ] All touch targets ≥ 44px

**Campaign Edit Page**:
- [ ] Campaign name, budget, status fields are styled
- [ ] Ad groups render as collapsible accordion items
- [ ] Accordion headers show expand/collapse indicator
- [ ] Newly added ad groups open expanded by default
- [ ] Creative rows are inline on desktop, stacked on mobile
- [ ] Action buttons follow hierarchy: Save=primary (green), Add=secondary (outlined), Delete=destructive (red)
- [ ] Archived notice banner is visually prominent (accent-2 background/border)
- [ ] Disabled form fields appear muted
- [ ] Conflict alerts are visually distinct from validation errors
- [ ] Skeleton loaders appear while data is loading
- [ ] All text is readable (WCAG 2.1 AA contrast)
- [ ] All buttons/links have visible focus indicators
- [ ] All touch targets ≥ 44px

**ColumnSetupPopup Modal**:
- [ ] Modal has dark-surface background
- [ ] Checkboxes are styled consistently
- [ ] Save/Cancel buttons follow button hierarchy
- [ ] Modal works on mobile

**Responsive & Accessibility**:
- [ ] Pages render correctly on 320px, 480px, 768px, 1024px, 1440px+ viewports
- [ ] No horizontal overflow
- [ ] All images have alt text (if any)
- [ ] No flashing content
- [ ] Animations respect `prefers-reduced-motion`
- [ ] Keyboard navigation works (Tab, Enter, Escape)

### Troubleshooting

**Styling not appearing?**
- Ensure CSS files are imported in their corresponding React components
- Check browser DevTools for CSS parse errors
- Verify design token variable names match `frontend/src/index.css`

**Accordion not collapsing?**
- Accordion collapse is CSS-only (no JS required); verify `.is-expanded` modifier is applied/removed by existing toggle logic
- Check for specificity conflicts with global styles

**Skeleton loader not animating?**
- Verify `@keyframes shimmer` is defined in `index.css`
- Check that animation respects `prefers-reduced-motion` media query

**Touch targets too small on mobile?**
- Verify buttons/inputs have min-height of 44px
- Use inspector to measure actual rendered size

### Rollout Plan

1. Create new CSS files and update JSX with BEM class names (isolated to campaign pages)
2. Run local E2E tests to verify no breakage
3. Open PR, verify CI tests pass
4. Deploy to staging and test on actual devices/browsers
5. Merge and deploy to production

---

## Post-Phase-1 Constitution Re-check

**Status**: ✅ **PASS** (no changes since initial check)

- Tests identified for Playwright E2E validation: visual/CSS assertions in existing E2E suite
- No service boundaries affected (single frontend service)
- No Docker or deployment changes needed
- No deviations from core principles

---

## Next Steps

**Proceed to `/speckit.tasks`** to generate the detailed task breakdown and timeline.

**Task phases** (planned):
1. **Setup**: Update JSX with BEM class names (non-styling)
2. **Campaigns Listing**: Create `Campaigns.css`, implement table styling, badges, skeleton loader
3. **Campaign Creation**: Create `CampaignNewPage.css`, implement form styling
4. **Campaign Edit**: Create `CampaignEditPage.css`, implement accordion, nested field styling, archived state
5. **Shared**: Create `ColumnSetupPopup.css`, update `index.css` with shimmer animation
6. **Testing**: Run E2E tests, verify responsive on mobile, accessibility checks
7. **Polish**: Fine-tune spacing, contrast, animations per feedback

