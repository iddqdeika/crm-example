# Feature Specification: Campaign UI Design

**Feature Branch**: `009-campaign-ui-design`  
**Created**: 2026-02-26  
**Status**: Draft  
**Input**: User description: "ui design for campaigns listing, creation and editing"

## User Scenarios & Testing *(mandatory)*

### User Story 1 — Campaign Listing Page (Priority: P1)

A buyer or admin navigates to the campaigns listing page and sees a polished, professional data table that follows the application's dark-canvas design language. The table has clear column headers, readable rows with hover feedback, and prominent action controls. The search bar and toolbar feel integrated into the page layout, not afterthoughts. The "Create campaign" call-to-action is immediately visible and inviting.

**Why this priority**: The listing page is the most visited campaign screen — every campaign workflow starts here. It must establish visual credibility and make information scannable at a glance.

**Independent Test**: Can be fully tested by logging in as a buyer, navigating to `/campaigns`, and verifying that all visual elements (table, toolbar, search, column headers, action buttons, sort indicators, pagination count) match the design system's tokens and hierarchy rules.

**Acceptance Scenarios**:

1. **Given** a buyer with campaigns, **When** they open `/campaigns`, **Then** they see a styled data table with dark card surfaces, legible text, clear row boundaries, and color-coded status badges (active = accent-1/green, pause = accent-3/violet, archive = muted).
2. **Given** the campaigns listing page, **When** the user views the toolbar area, **Then** the "Create campaign" link is styled as a prominent primary CTA button using the accent-1 color.
3. **Given** the campaigns listing page, **When** the user hovers over a table row, **Then** the row shows elevated background feedback.
4. **Given** the campaigns listing page, **When** the user views it on a mobile viewport (< 768px), **Then** the table scrolls horizontally and the toolbar stacks vertically, remaining usable.
5. **Given** the campaigns listing page, **When** the user clicks "Columns" to open the column setup popup, **Then** the popup is styled consistently with the page's dark-surface design.
6. **Given** the campaigns listing page, **When** the user clicks a sortable column header, **Then** the sort indicator is clearly visible and the header shows interactive affordance (cursor, hover state).

---

### User Story 2 — Campaign Edit Page (Priority: P2)

A buyer navigates to the campaign edit page and encounters a well-structured form with clear visual hierarchy: the campaign header fields (name, budget, status) appear prominently, followed by collapsible accordion ad group sections, each containing its own creatives. Each ad group header is always visible and acts as a toggle to expand or collapse its fields. The form feels organized despite its complexity, with consistent field styling, clear section boundaries, and prominent save/cancel actions.

**Why this priority**: The edit page is the most complex screen in the application. Proper visual hierarchy and grouping are essential to prevent cognitive overload from the many nested fields (campaign → ad groups → creatives).

**Independent Test**: Can be fully tested by navigating to an existing campaign's edit page and verifying field styling, section grouping, button treatments, error/conflict states, and archived campaign visual lockdown.

**Acceptance Scenarios**:

1. **Given** a campaign edit page, **When** the user views it, **Then** form fields use the design system's input styling (dark backgrounds, bordered, correct typography).
2. **Given** a campaign edit page with ad groups, **When** the user views the ad groups section, **Then** each ad group is rendered as a collapsible accordion item with a clickable header showing the ad group number and current state (expanded/collapsed), and a card-style container that reveals its fields when expanded.
3. **Given** an ad group with creatives, **When** the user views the creatives section, **Then** each creative row is visually compact with inline fields and delete action, styled consistently with the design system.
4. **Given** a campaign edit page, **When** the user views the action buttons (Save, Add ad group, Add creative, Delete), **Then** primary actions (Save) use accent-1 styling, destructive actions (Delete) use accent-2 styling, and secondary actions (Add) use ghost/outlined styling.
5. **Given** an archived campaign, **When** the user views its edit page, **Then** the archived notice banner is visually prominent (accent-2 background or border), and all disabled fields appear visually muted.
6. **Given** a version conflict, **When** the conflict alert appears, **Then** it uses a visually distinct alert treatment with a clear refresh action.
7. **Given** the edit page on mobile, **When** the user views ad group fields, **Then** the fields stack vertically in a single column layout.

---

### User Story 3 — Campaign Creation Page (Priority: P3)

A buyer navigates to the new campaign creation page and sees a clean, focused form with a clear heading, minimal required fields (name, budget, status), and an obvious submit button. The page feels lightweight and inviting compared to the more complex edit page.

**Why this priority**: The creation page is simple with only three fields. Styling it is straightforward once the form field and button patterns are established by the edit page design.

**Independent Test**: Can be fully tested by navigating to `/campaigns/new` and verifying form layout, field styling, button treatments, error display, and the back-to-list navigation link.

**Acceptance Scenarios**:

1. **Given** the campaign creation page, **When** the user views it, **Then** the page heading uses the display font, and form fields match the design system's input styles.
2. **Given** the creation form, **When** the user submits with invalid data, **Then** the error message uses accent-2 color and is clearly associated with the form.
3. **Given** the creation page, **When** the user views the submit button, **Then** it uses primary CTA styling (accent-1) and shows a loading state while saving.
4. **Given** the creation page on mobile, **When** the user views it, **Then** the form fields occupy full width and remain comfortable to tap (44px minimum touch targets).

---

### Edge Cases

- What happens when the campaign table is empty? An empty state message should be styled and centered, not just raw text.
- What happens when a very long campaign name appears in the table? Text should truncate with ellipsis rather than breaking the table layout.
- What happens when there are many ad groups (5+) on the edit page? The page should remain scrollable and organized, with each group clearly delineated as a collapsed accordion item by default.
- What happens during slow data fetches? Skeleton placeholder bars are shown rather than a blank area, maintaining layout stability.
- What happens when the column setup popup has all columns deselected? The save action should be disabled or a minimum-column constraint enforced visually.

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: Campaign listing page MUST use the application's design system tokens (colors, typography, spacing) as defined in `docs/design.md`.
- **FR-002**: Campaign listing table MUST have styled column headers with hover affordance for sortable columns and visible sort direction indicators.
- **FR-002a**: Campaign status values MUST be rendered as color-coded badge pills: `active` uses accent-1 (green) tint, `pause` uses accent-3 (violet) tint, `archive` uses muted/secondary tint. Badges use a semi-transparent background and rounded corners.
- **FR-003**: Campaign listing table rows MUST show hover state feedback using the elevated background color.
- **FR-004**: The "Create campaign" action MUST be styled as a primary CTA button using accent-1 color.
- **FR-005**: Campaign edit page form fields (inputs, selects) MUST use consistent dark-surface styling with visible borders, appropriate focus rings, and design-system typography.
- **FR-006**: Ad group sections MUST be rendered as collapsible accordion items — each with a clickable header (showing ad group number and expand/collapse indicator) that toggles visibility of its fields. Newly added ad groups MUST open expanded by default.
- **FR-007**: Creative rows within ad groups MUST be visually compact with inline layout on desktop and stacked layout on mobile.
- **FR-008**: Action buttons MUST follow a consistent hierarchy: primary actions (accent-1), destructive actions (accent-2), secondary actions (ghost/outlined).
- **FR-009**: Archived campaign edit pages MUST show a prominent notice banner and visually muted/disabled form fields.
- **FR-010**: Conflict alerts MUST use a distinct visual treatment that separates them from form validation errors.
- **FR-011**: All campaign pages MUST be responsive, with readable layouts on viewports from 320px to 1440px+.
- **FR-012**: All interactive elements (buttons, links, inputs) MUST meet the 44px minimum touch target requirement.
- **FR-013**: All campaign pages MUST use semantic HTML landmarks and maintain heading hierarchy per the accessibility guidelines.
- **FR-014**: Search input MUST be styled consistently with other form inputs in the design system.
- **FR-015**: Campaign creation page MUST display form validation errors using accent-2 color with clear visual association to the form.
- **FR-016**: Empty table state MUST display a styled placeholder message rather than a blank or raw-text area.
- **FR-017**: Loading states on the campaigns listing and campaign edit pages MUST display skeleton placeholder bars — shimmer-animated grey bars shaped like table rows (listing) or form fields (edit) — replacing the current raw "Loading…" text. Skeleton bars MUST use the elevated background color with a shimmer animation that respects `prefers-reduced-motion`.

### Key Entities

- **Campaign Listing Table**: A data table displaying campaign summaries with configurable columns, sortable headers, color-coded status badges, row actions (edit, archive), and a search toolbar.
- **Campaign Form**: A form component used for both creation (simple: name, budget, status) and editing (complex: name, budget, status + nested ad groups with creatives).
- **Ad Group Card**: A visually grouped section containing targeting fields and nested creative rows, used within the campaign edit form.
- **Creative Row**: A compact inline form row within an ad group card for managing individual creatives (name, type, URL).

## Clarifications

### Session 2026-02-26

- Q: Should ad groups be collapsible (accordion — click to expand/hide fields) or always-visible (static cards)? → A: Collapsible accordion — each ad group has a clickable header that shows/hides its fields.
- Q: Should campaign status be displayed as color-coded badge pills, styled plain text, or plain unstyled text? → A: Color-coded badge pills — small rounded tags with background tint per status (active = green/accent-1, pause = violet/accent-3, archive = muted).
- Q: How should loading states be presented on campaign pages — spinner, skeleton placeholders, or styled text? → A: Skeleton placeholders — grey shimmer bars in the shape of table rows and form fields.

## Assumptions

- The design follows the existing design system established in `docs/design.md` — no new tokens or colors need to be introduced.
- CSS architecture follows the BEM convention used by other styled pages (Admin, Profile, Dashboard).
- No JavaScript behavior changes are required — this feature is purely visual/CSS with class name updates to JSX.
- The column setup popup (`ColumnSetupPopup.tsx`) will receive matching dark-surface styling as part of this feature.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: All three campaign pages (listing, creation, editing) visually match the dark-canvas design language used across other application pages (Landing, Profile, Admin, Dashboard).
- **SC-002**: All campaign page elements pass WCAG 2.1 AA contrast requirements (body text >= 7:1, secondary text >= 4.5:1, interactive elements >= 4.5:1 against their backgrounds).
- **SC-003**: Campaign pages render correctly on viewports from 320px to 1440px without horizontal overflow, broken layouts, or unreadable text.
- **SC-004**: Users can complete the full campaign workflow (list → create → edit → archive) without encountering any unstyled or visually inconsistent elements.
- **SC-005**: Existing Playwright E2E tests continue to pass, confirming design changes do not break functional behavior.
- **SC-006**: All interactive elements on campaign pages (buttons, links, inputs, selects) have visible focus indicators and meet the 44px minimum touch target.
