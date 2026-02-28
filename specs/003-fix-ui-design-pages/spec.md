# Feature Specification: Apply UI Design System to App Pages

**Feature Branch**: `003-fix-ui-design-pages`  
**Created**: 2026-02-26  
**Status**: Draft  
**Input**: User description: "fix ui design in login, signup, dashboard, admin, and profile pages"

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Styled Authentication Pages (Priority: P1)

Visitors navigating to the sign-in or sign-up pages see a cohesive dark-themed experience that matches the landing page and follows the UI design document. The forms feel intentional and polished rather than default/unstyled.

**Why this priority**: Authentication is the first post-landing interaction. Unstyled auth pages break the visual continuity established by the landing page and erode trust.

**Independent Test**: Can be fully tested by navigating to the login and sign-up pages, verifying the dark theme, design tokens, typography, spacing, and form styling match the UI design document. The pages should feel like a natural continuation of the landing page.

**Acceptance Scenarios**:

1. **Given** a visitor on the sign-in page, **When** they view the page, **Then** they see a dark-themed layout with the design document's typography, colors, and spacing applied to the heading, form fields, buttons, and error messages.
2. **Given** a visitor on the sign-up page, **When** they view the page, **Then** they see the same cohesive dark-themed styling as the sign-in page, with consistent form layout and button styles.
3. **Given** a visitor on either auth page, **When** they interact with form fields, **Then** focus states, hover states, and error states are clearly visible and use the accent colors defined in the design document.
4. **Given** the design document, **When** the auth pages are compared against it, **Then** there are no material deviations from the defined guidelines (typography, color, contrast, spacing).

---

### User Story 2 - Styled Dashboard Page (Priority: P2)

Authenticated users arriving at the dashboard see a properly styled welcome area that uses the dark theme, design tokens, and typographic hierarchy from the UI design document.

**Why this priority**: The dashboard is the primary authenticated landing point. It should reinforce the visual quality established during onboarding.

**Independent Test**: Can be fully tested by signing in and verifying the dashboard page uses the dark theme, correct fonts, spacing, and a layout that feels consistent with the landing and auth pages.

**Acceptance Scenarios**:

1. **Given** an authenticated user on the dashboard, **When** they view the page, **Then** they see a dark-themed layout with the design document's typography and spacing applied to the heading and welcome content.
2. **Given** an admin user on the admin page, **When** they view the page, **Then** they see the same dark-themed layout and design token usage as the dashboard.
3. **Given** the design document, **When** the dashboard and admin pages are compared against it, **Then** typography, colors, and spacing follow the defined guidelines.

---

### User Story 3 - Styled Profile Page (Priority: P3)

Authenticated users on the profile page see a well-structured, dark-themed layout with clearly separated sections for user info, password change, and avatar management — all following the UI design document.

**Why this priority**: The profile page has the most visual complexity (avatar, forms, sections). Applying the design system here validates that it works for richer content layouts.

**Independent Test**: Can be fully tested by navigating to the profile page, verifying the dark theme is applied, sections are visually separated, form elements are styled consistently with the auth pages, and the avatar area follows the design guidelines.

**Acceptance Scenarios**:

1. **Given** an authenticated user on the profile page, **When** they view the page, **Then** they see a dark-themed layout with clearly separated sections for personal info, password change, and avatar management.
2. **Given** the profile page, **When** the user interacts with the password form and avatar upload, **Then** inputs, buttons, and feedback messages use the same styling as the auth pages.
3. **Given** the design document, **When** the profile page is compared against it, **Then** typography, colors, spacing, and component styles follow the defined guidelines.

---

### Edge Cases

- What happens when error messages appear on auth forms? Error text must be visible against the dark background using the secondary accent color.
- How does the avatar placeholder look on a dark background? It must be distinguishable without relying on a white/light background.
- How do the pages look on mobile viewports (375px)? All pages must be responsive and usable at mobile, tablet, and desktop widths.

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: The sign-in page MUST use the dark theme, design tokens (colors, typography, spacing), and form styling defined in the UI design document.
- **FR-002**: The sign-up page MUST use the same dark theme and form styling as the sign-in page, maintaining visual consistency.
- **FR-003**: Form elements (inputs, labels, buttons) on auth pages MUST have visible focus, hover, and error states using the design document's accent colors.
- **FR-004**: The dashboard and admin pages MUST use the dark theme and design tokens for their headings, layout, and content.
- **FR-005**: The profile page MUST use the dark theme with visually separated sections for user info, password change, and avatar management.
- **FR-006**: The profile page form elements (password change, avatar upload) MUST use the same styled inputs and buttons as the auth pages.
- **FR-007**: All five pages MUST be responsive at mobile (375px), tablet (768px), and desktop (1280px) viewports.
- **FR-008**: All five pages MUST comply with WCAG 2.1 AA, with body text meeting the enhanced contrast ratio of at least 7:1 as defined in the design document.
- **FR-009**: The navigation header MUST be styled consistently with the dark theme across all authenticated pages (dashboard, profile, admin).

### Key Entities

- **Auth Pages (Login, SignUp)**: Form-based pages for unauthenticated visitors. Comprise a heading, form with inputs, a submit button, an error display area, and a consistent dark-themed layout.
- **Dashboard Page**: The primary authenticated landing screen. Comprises a heading, welcome message, and minimal content area.
- **Admin Page**: An authenticated admin-only page. Receives the same dark theme treatment as the dashboard.
- **Profile Page**: An authenticated page with multiple sections: user info display, password change form, and avatar upload/remove area.
- **App Header**: The navigation bar shown on authenticated pages. Must be styled to match the dark theme.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: All five pages (login, sign-up, dashboard, admin, profile) pass a visual audit against the UI design document with zero critical deviations.
- **SC-002**: Users perceive no visual discontinuity when navigating from the landing page through sign-up/sign-in to the dashboard, admin, and profile — the experience feels like one cohesive product.
- **SC-003**: All form elements on all pages have visible focus, hover, and error states that meet WCAG 2.1 AA contrast requirements.
- **SC-004**: All five pages render correctly at mobile (375px), tablet (768px), and desktop (1280px) viewports without layout breakage.

## Clarifications

### Session 2026-02-27

- Q: Should the Admin page be included in this feature's scope? → A: Yes, include Admin page (same dark theme treatment as Dashboard).

## Assumptions

- The UI design document (`docs/design.md`) and CSS design tokens in `frontend/src/index.css` already exist and define the visual language (from feature 002).
- The existing page components and their functionality (auth flows, profile updates, avatar management) remain unchanged — only visual styling is added.
- The AppHeader component is included in scope since it appears on all authenticated pages.
- The Admin page is included in scope to prevent visual inconsistency (same dark theme treatment as Dashboard).
- Form components (LoginForm, SignUpForm, PasswordChangeForm, AvatarUpload) are styled via CSS applied to their existing class names or new BEM classes — no component logic changes.
