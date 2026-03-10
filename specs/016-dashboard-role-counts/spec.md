# Feature Specification: Dashboard Role-Based Counts

**Feature Branch**: `016-dashboard-role-counts`  
**Created**: 2026-02-26  
**Status**: Draft  
**Input**: User description: "dashboard shows campaigns count to buyer, posts count to content manager and both + user count for admin"

## Clarifications

### Session 2026-02-26

- Q: Posts count — what is included (published only, or all manageable)? → A: Different counts for draft and published (show separate draft count and published count).
- Q: User with both buyer and content_manager (no admin) — show both counts or one set? → A: User can have single role (no dual-role case; counts are determined by that single role).

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Buyer Sees Campaigns Count on Dashboard (Priority: P1)

A user with the buyer role opens the dashboard and sees the number of campaigns (e.g. "12 campaigns" or a dedicated count widget). This gives the buyer an at-a-glance view of how many campaigns exist without navigating away.

**Why this priority**: Buyers are campaign-focused; the count supports quick orientation and decision-making.

**Independent Test**: Log in as a buyer; open the dashboard; verify a campaigns count is visible and matches the actual number of campaigns the user can access.

**Acceptance Scenarios**:

1. **Given** a user with the buyer role is logged in, **When** they open the dashboard, **Then** they see a campaigns count (e.g. number or "X campaigns").
2. **Given** the buyer views the dashboard, **When** the count is displayed, **Then** the value reflects the current number of campaigns (or the count they are permitted to see).

---

### User Story 2 - Content Manager Sees Draft and Published Posts Counts on Dashboard (Priority: P1)

A user with the content manager role opens the dashboard and sees two separate counts: the number of draft posts and the number of published posts (e.g. "3 drafts", "12 published" or dedicated count widgets). This gives the content manager quick visibility into workload by status.

**Why this priority**: Content managers are post-focused; separate draft and published counts support workload awareness and prioritization.

**Independent Test**: Log in as a content manager; open the dashboard; verify draft posts count and published posts count are visible and each matches the actual number of draft and published posts the user can manage.

**Acceptance Scenarios**:

1. **Given** a user with the content manager role is logged in, **When** they open the dashboard, **Then** they see a draft posts count and a published posts count (e.g. "X drafts", "Y published").
2. **Given** the content manager views the dashboard, **When** the counts are displayed, **Then** each value reflects the current number of draft and published blog posts they can manage.

---

### User Story 3 - Admin Sees Campaigns, Draft/Published Posts, and User Counts on Dashboard (Priority: P1)

An admin opens the dashboard and sees campaigns count, draft posts count, published posts count, and user count. This gives the admin a single-screen overview of key platform metrics.

**Why this priority**: Admins need a consolidated view; showing these counts supports oversight and prioritization.

**Independent Test**: Log in as an admin; open the dashboard; verify campaigns count, draft posts count, published posts count, and user count are all visible and accurate.

**Acceptance Scenarios**:

1. **Given** an admin is logged in, **When** they open the dashboard, **Then** they see campaigns count, draft posts count, published posts count, and user count.
2. **Given** the admin views the dashboard, **When** counts are displayed, **Then** each count reflects the current number of campaigns, draft posts, published posts, and users in the system.
3. **Given** an admin has access to the dashboard, **When** they view it, **Then** they do not need to scroll or open another page to see all four counts (above the fold or clearly presented).

---

### Edge Cases

- Each user has a single role; no combined-role behavior is required (e.g. buyer + content_manager).
- Users with no role or an unrecognized role see only the dashboard layout without role-specific counts (or a sensible default such as no counts).
- When a count is zero, the dashboard shows "0" (e.g. "0 campaigns", "0 drafts", "0 published", "0 users") rather than hiding the widget.
- Counts update when the user refreshes or reopens the dashboard; real-time updates are out of scope unless already supported by the platform.
- If the backend is temporarily unavailable, the dashboard shows an appropriate loading or error state for the counts rather than incorrect data.

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: The dashboard MUST display a campaigns count to users with the buyer role.
- **FR-002**: The dashboard MUST display a campaigns count to users with the admin role.
- **FR-003**: The dashboard MUST display a draft posts count and a published posts count to users with the content manager role.
- **FR-004**: The dashboard MUST display a draft posts count and a published posts count to users with the admin role.
- **FR-005**: The dashboard MUST display a user count to users with the admin role only.
- **FR-006**: Counts MUST reflect the current number of entities (campaigns, draft posts, published posts, users) as defined by the system’s data and the user’s permissions.
- **FR-007**: The dashboard MUST NOT show the user count to buyers or content managers.
- **FR-008**: The dashboard MUST present counts in a clear, readable form (e.g. "X campaigns", "X drafts", "X published", "X users").

### Key Entities *(include if feature involves data)*

- **Dashboard**: The main landing view after login; it shows role-based summary counts.
- **Campaign**: Entity used to derive the campaigns count (e.g. count of campaigns the user can access or total in the system for admin).
- **Post (blog post)**: Entity used to derive draft and published counts; posts are classified as draft or published; each count is shown separately.
- **User**: Entity used to derive the user count (admin only; e.g. total registered or active users).
- **Role**: Determines which counts are visible (buyer → campaigns; content_manager → draft posts, published posts; admin → campaigns, draft posts, published posts, users).

## Assumptions

- Roles (buyer, content_manager, admin) already exist in the system; no new roles are introduced.
- Each user has a single role; there is no dual-role case (e.g. buyer and content_manager at once). Dashboard counts are determined solely by that role.
- The dashboard page and navigation to it already exist; this feature adds or adjusts count widgets/sections.
- Counts are scoped by existing permissions (e.g. buyer sees campaigns they can access; admin may see system-wide counts).
- "User count" means the number of user accounts (or similar) that the admin is allowed to see; the exact definition (e.g. all users, active only) follows existing product rules.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: A buyer can see the campaigns count on the dashboard within 3 seconds of the dashboard loading.
- **SC-002**: A content manager can see the draft posts count and published posts count on the dashboard within 3 seconds of the dashboard loading.
- **SC-003**: An admin can see campaigns count, draft posts count, published posts count, and user count on the dashboard within 3 seconds of the dashboard loading.
- **SC-004**: Displayed counts match the actual number of entities (within the same permission scope) with 100% accuracy when data is successfully loaded.
- **SC-005**: Role-appropriate counts only are shown (no user count for non-admin; no irrelevant counts for each role).
