# Feature Specification: Playwright UI Scenario Tests

**Feature Branch**: `008-playwright-ui-tests`  
**Created**: 2026-02-26  
**Status**: Draft  
**Input**: User description: "UI tests with Playwright. Document main user scenarios through the app and verify them with an AI agent using Playwright on a locally deployed app. Ensure all checkpoints (scenario completable, design correct per design.md) are green."

## User Scenarios & Testing

### User Story 1 — Registration and Profile (Priority: P1)

A new visitor registers for an account, is redirected to the dashboard, then navigates to the profile page and sees their information displayed.

**Why this priority**: Registration is the entry point for every other scenario. If sign-up is broken, nothing else works.

**Independent Test**: Can be fully tested by completing the sign-up form and navigating to `/profile`. Delivers confidence that authentication and profile display work end-to-end.

**Acceptance Scenarios**:

1. **Given** the app is running locally and no user exists with the test email, **When** a visitor fills the sign-up form (email, password, display name) and submits, **Then** they are redirected to `/dashboard` and the header shows their display name.
2. **Given** a newly registered user is on `/dashboard`, **When** they click the "Profile" link in the header, **Then** `/profile` loads and shows their display name and email.
3. **Given** a registered user is on `/profile`, **Then** the page layout, typography, and colors match the project design tokens defined in `docs/design.md`.

---

### User Story 2 — Campaign Creation and Listing (Priority: P1)

A buyer registers, navigates to the campaigns listing, creates a new campaign, and confirms the campaign appears in the listing table.

**Why this priority**: Campaign management is the core business feature. Verifying the create-then-list round-trip is the single most valuable E2E check.

**Independent Test**: Can be tested by signing up as a new user (who gets buyer role assigned by an admin or test seed), navigating to `/campaigns/new`, creating a campaign, and verifying it appears at `/campaigns`.

**Acceptance Scenarios**:

1. **Given** a user with the buyer role is logged in, **When** they navigate to `/campaigns`, **Then** the campaigns listing page loads and the table is visible.
2. **Given** a buyer is on `/campaigns`, **When** they click "New Campaign", fill in name and budget, select a status, and submit, **Then** they are redirected to the campaign edit page and the campaign name appears in the heading.
3. **Given** a buyer has just created a campaign, **When** they navigate back to `/campaigns`, **Then** the new campaign appears in the listing table with the correct name and budget.
4. **Given** the campaigns listing is displayed, **Then** the table layout and page structure match the design tokens in `docs/design.md`.

---

### User Story 3 — Login, Logout, and Session Expiry (Priority: P2)

An existing user logs in, sees the dashboard, logs out, and is returned to the login page. A session-expired redirect shows the appropriate message.

**Why this priority**: Authentication lifecycle is critical but secondary to the create-and-verify flows above.

**Independent Test**: Can be tested by logging in with known credentials, verifying the dashboard loads, clicking log out, and confirming redirect to login.

**Acceptance Scenarios**:

1. **Given** a registered user, **When** they visit `/login`, enter valid credentials, and submit, **Then** they are redirected to `/dashboard` and the header shows their display name.
2. **Given** a logged-in user, **When** they click "Log out" in the header, **Then** they are redirected to `/login` and the header no longer shows their name.
3. **Given** a user visits `/login?reason=expired`, **Then** a session-expired message is visible on the page.

---

### User Story 4 — Admin User Management (Priority: P2)

An admin user logs in, navigates to the admin panel, views the user list, selects a user, and changes their role.

**Why this priority**: Admin functionality is important but used less frequently than registration and campaigns.

**Independent Test**: Can be tested by logging in as an admin, navigating to `/admin`, and performing a role change on an existing user.

**Acceptance Scenarios**:

1. **Given** an admin user is logged in, **When** they click "Admin" in the header, **Then** `/admin` loads with a list of users showing email, display name, role, and active status.
2. **Given** an admin is on `/admin`, **When** they select a user and change their role to "buyer", **Then** the updated role is reflected in the user list.
3. **Given** the admin page is displayed, **Then** the page layout matches the design tokens in `docs/design.md`.

---

### User Story 5 — Campaign Edit and Archive (Priority: P3)

A buyer opens an existing campaign, edits its name and budget, saves, and then archives it. The archived campaign becomes view-only.

**Why this priority**: Edit and archive are important but depend on prior scenarios (campaign must exist first).

**Independent Test**: Can be tested by navigating to an existing campaign's edit page, modifying fields, saving, then archiving from the listing and re-opening to confirm read-only state.

**Acceptance Scenarios**:

1. **Given** a buyer has an existing campaign, **When** they navigate to `/campaigns/:id`, change the name, and click "Save", **Then** the updated name is persisted and visible on the page.
2. **Given** a buyer is on `/campaigns`, **When** they click "Archive" on a campaign and confirm, **Then** the campaign status changes to "archive" in the listing.
3. **Given** a buyer opens an archived campaign at `/campaigns/:id`, **Then** all form fields are disabled, no "Save" button is visible, and an archived notice is displayed.

---

### User Story 6 — Design Compliance Checks (Priority: P3)

Every page in the app conforms to the visual design system defined in `docs/design.md`, including background colors, font families, spacing tokens, and accessibility contrast ratios.

**Why this priority**: Visual correctness is important but only after functional scenarios are verified.

**Independent Test**: Can be tested by navigating to each page and checking computed CSS values against the design tokens.

**Acceptance Scenarios**:

1. **Given** any page in the app, **When** the page loads, **Then** the background color of the main container matches the `--color-bg-primary` token.
2. **Given** any page with headings, **When** headings are inspected, **Then** the font family matches the display font defined in the design system.
3. **Given** any page with body text, **When** body text is inspected, **Then** the font family matches the body font defined in the design system.
4. **Given** any interactive element (buttons, links), **Then** the foreground-to-background contrast ratio meets WCAG 2.1 AA (minimum 4.5:1 for normal text).

---

### Edge Cases

- What happens when registration is attempted with an already-existing email? The test should verify an error message appears.
- What happens when login is attempted with wrong credentials? The test should verify an error message appears and the user stays on `/login`.
- What happens when a campaign is created with empty required fields? The test should verify the form prevents submission or shows validation errors.
- What happens when a non-admin user tries to access `/admin`? The test should verify redirect to `/dashboard`.
- What happens when an unauthenticated user tries to access `/campaigns`? The test should verify redirect to `/login`.

## Clarifications

### Session 2026-02-26

- Q: How should campaign tests obtain a buyer-role user? → A: Admin flow in test — register a new user, then log in as a pre-seeded admin and assign the buyer role via the admin UI.
- Q: Should tests auto-start dev servers or require them running? → A: Auto-start via a separate docker-compose file. Playwright waits for services to be healthy before running tests.
- Q: Should design checks use CSS assertions, screenshots, or both? → A: CSS assertions only — check computed style values against design token values. No screenshot comparison.

## Requirements

### Functional Requirements

- **FR-001**: The project MUST include a documented catalogue of user scenarios that cover the main application flows (registration, profile, campaigns, admin, session lifecycle).
- **FR-002**: Each documented scenario MUST be implemented as a Playwright test that runs against the locally deployed application.
- **FR-003**: Playwright tests MUST be executable by an AI agent without manual intervention — each test must be self-contained with its own setup (user creation, login) and teardown.
- **FR-004**: Each scenario MUST include functional checkpoints that verify the user can complete the described journey (page loads, elements visible, actions succeed, correct redirects).
- **FR-005**: Each scenario MUST include at least one design checkpoint that verifies visual conformance by asserting computed CSS values (colors, font families, spacing) against the design token values defined in `docs/design.md`. No screenshot comparison is used.
- **FR-006**: The test suite MUST produce a clear pass/fail report indicating which scenarios and checkpoints succeeded or failed.
- **FR-007**: The test suite MUST include a dedicated docker-compose file that starts all required services (frontend, backend, database, etc.). Playwright tests run against the containerized application after services report healthy.
- **FR-008**: Each test MUST be independent and not depend on state left by other tests (no shared mutable state between test files).
- **FR-009**: Tests MUST obtain a buyer-role user by registering a new user, then logging in as a pre-seeded admin and assigning the buyer role via the admin UI. This exercises the admin role-assignment flow as part of campaign test setup.

### Key Entities

- **Scenario**: A documented user journey with a name, steps, and checkpoints. Maps 1:1 to a Playwright test file.
- **Checkpoint**: A verifiable assertion within a scenario — either functional (element visible, redirect occurred) or design (CSS value matches token).
- **Design Token**: A named value from `docs/design.md` (color, font family, spacing) used as the expected value in design checkpoints.

## Assumptions

- A dedicated docker-compose file starts all services (frontend, backend, database, Redis, MinIO) before tests execute. The test runner waits for health checks to pass.
- A fresh database state is acceptable — tests create their own users and data.
- The buyer role is assigned by logging in as a pre-seeded admin and changing a new user's role via the admin UI within the test itself.
- Playwright tests run in headless Chromium by default; headed mode available for debugging.
- Design token values are extracted from `docs/design.md` or `frontend/src/index.css` as the source of truth. Design checks use programmatic CSS assertions only (no screenshot baselines).
- Tests run sequentially by default to avoid port/database conflicts, but individual scenario files are independent.

## Success Criteria

### Measurable Outcomes

- **SC-001**: All documented user scenarios (registration, profile, campaign lifecycle, login/logout, admin, archive) have corresponding Playwright tests that pass on a locally running instance.
- **SC-002**: Every scenario includes at least one design checkpoint that validates a visual property against `docs/design.md` tokens.
- **SC-003**: The full test suite completes in under 3 minutes on a standard development machine.
- **SC-004**: An AI agent can execute the entire test suite with a single command and interpret the pass/fail results without human guidance.
- **SC-005**: Zero test interdependencies — any single test file can be run in isolation and pass.
