# Feature Specification: Session Persistence & Inactivity Timeout

**Feature Branch**: `005-session-persistence`
**Created**: 2026-02-27
**Status**: Draft
**Input**: User description: "save session data between page reloads and new tabs. define session deadline to require re-login after such time passed from last user interaction."

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Session Survives Page Reload and New Tabs (Priority: P1)

A user who is logged in opens a new browser tab, refreshes the page, or navigates directly to any URL within the app. They are recognised as logged in immediately — they see their profile, dashboard, and all authenticated content — without being redirected to the login page.

**Why this priority**: Without this, every page reload forces the user to log in again, making the app effectively unusable for normal browsing. This is the minimum expected behaviour of any authenticated web application.

**Independent Test**: Log in, refresh the browser, navigate to `/dashboard` in a new tab — the user is still authenticated and sees their content without any login prompt.

**Acceptance Scenarios**:

1. **Given** a logged-in user on the Dashboard, **When** they press F5 (hard refresh), **Then** the Dashboard loads with their authenticated content; the login page is not shown.
2. **Given** a logged-in user, **When** they open a new browser tab and navigate to `/profile`, **Then** they see their profile page without being asked to log in.
3. **Given** a logged-in user, **When** they close all tabs and re-open the app within the active session window, **Then** they are still logged in.
4. **Given** a user who has never logged in, **When** they navigate to `/dashboard`, **Then** they are redirected to the login page.

---

### User Story 2 - Automatic Re-login After Inactivity (Priority: P2)

A logged-in user leaves the application idle — they stop clicking, scrolling, or submitting forms — for a defined inactivity period. After that period elapses, their session expires. The next time they interact with the application, they are redirected to the login page with a clear explanation that their session timed out due to inactivity.

**Why this priority**: Inactivity timeout is a fundamental security control. A session that never expires due to inactivity exposes accounts to takeover if a device is left unattended. This protects users even when they forget to log out.

**Independent Test**: Log in, remain completely idle for the configured inactivity period, then attempt any action — you are redirected to login with a "session expired" message.

**Acceptance Scenarios**:

1. **Given** a logged-in user who has been idle for longer than the inactivity timeout period, **When** they attempt any action (click, navigate, submit), **Then** they are redirected to the login page and shown a message explaining their session expired due to inactivity.
2. **Given** a logged-in user who is actively using the application, **When** they perform an interaction, **Then** their inactivity deadline is reset — the countdown restarts from zero.
3. **Given** a logged-in user who has been idle for less than the inactivity timeout, **When** they perform any action, **Then** their session remains valid and they continue uninterrupted.
4. **Given** a user whose session expired due to inactivity, **When** they log back in, **Then** they receive a fresh session and can resume using the app normally.

---

### User Story 3 - Configurable Inactivity Timeout (Priority: P3)

An operator or system administrator can configure the inactivity timeout period — the duration of idle time after which users are required to re-authenticate. The setting takes effect for all new sessions without requiring a deployment.

**Why this priority**: Different deployments have different security requirements. A public-facing consumer app might tolerate 2-hour sessions; a finance tool might require 15-minute timeouts. The value must be adjustable without code changes.

**Independent Test**: Change the inactivity timeout setting, log in, remain idle for slightly longer than the new timeout, and confirm that re-login is required at the new threshold.

**Acceptance Scenarios**:

1. **Given** the inactivity timeout is set to a value T, **When** a user remains idle for exactly T minutes, **Then** their next interaction triggers re-authentication.
2. **Given** the inactivity timeout is updated, **When** a new session is created, **Then** the new timeout value applies to that session.
3. **Given** an existing session created under the old timeout value, **When** the timeout is updated, **Then** the new timeout applies to future activity extensions (not retroactively invalidating active sessions).

---

### User Story 4 - Expiry Warning Before Forced Logout (Priority: P3)

A logged-in user who is approaching their session expiry — either the inactivity deadline or the absolute lifetime limit — sees a visible, dismissable warning notifying them that they will be logged out soon. The warning gives them enough time to save any work in progress and either extend the session (by any interaction) or log out intentionally.

**Why this priority**: Without a warning, users lose unsaved work silently. This is especially important when approaching the hard maximum lifetime cap, which cannot be extended by further activity.

**Independent Test**: Set a very short timeout, log in, remain idle until near expiry — a warning banner or modal appears before the redirect. Clicking anywhere (interacting) extends the inactivity deadline and dismisses the warning.

**Acceptance Scenarios**:

1. **Given** a logged-in user whose inactivity deadline is within the warning window, **When** that threshold is crossed, **Then** a visible warning is displayed indicating how much time remains before logout.
2. **Given** a logged-in user who sees the expiry warning, **When** they perform any interaction (click, navigate, submit), **Then** the inactivity deadline is extended, the warning is dismissed, and they continue their session uninterrupted.
3. **Given** a logged-in user who sees the expiry warning, **When** they take no action and the deadline passes, **Then** they are automatically redirected to the login page with the inactivity expiry message.
4. **Given** a logged-in user approaching the absolute maximum session lifetime, **When** they are within the warning window, **Then** the warning notifies them that this session will end regardless of activity and they must log in again to continue.

---

### Edge Cases

- What happens if the user has the app open in two tabs simultaneously and interacts in one? Both tabs must remain valid; activity in any tab counts as a user interaction.
- What happens if a background process (e.g., auto-save, polling) makes an API call while the user is visually idle? Only explicit user-triggered actions should reset the inactivity timer to avoid keeping sessions alive indefinitely through background activity.
- What happens when the inactivity deadline expires while the user is mid-form? The user is shown a session-expired message; on re-login they are redirected back to the original URL they were on when the session expired.
- What happens if the user's clock differs significantly from the server's clock? Session validity is determined by the server; the client's local clock is not authoritative.
- What happens if the session cookie is deleted manually? The next request is treated as unauthenticated and the user is redirected to login.

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: The application MUST restore an authenticated user's login state on page reload without requiring the user to log in again, provided the session has not expired.
- **FR-002**: The application MUST restore an authenticated user's login state when they open the app in a new browser tab, provided the session has not expired.
- **FR-003**: A session MUST expire if no user interaction is detected for longer than the configured inactivity timeout period.
- **FR-004**: Each explicit user interaction MUST reset the inactivity countdown — extending the session deadline by the full inactivity timeout duration from the time of that interaction.
- **FR-005**: When a session expires (due to inactivity or absolute lifetime), the user MUST be redirected to the login page and shown a clear message explaining the reason. The original URL MUST be preserved so the user is returned to it after successful re-login.
- **FR-006**: The inactivity timeout period MUST be configurable without a code deployment — set via environment or configuration.
- **FR-007**: Only explicit user-initiated actions (navigation, form submission, deliberate clicks) MUST reset the inactivity timer. Automated background requests MUST NOT reset the timer.
- **FR-008**: Session validity MUST be enforced on the server side; client-side state alone is not sufficient to grant access to protected resources.
- **FR-011**: The application MUST display a visible, dismissable warning to the user when their session is within a configurable warning window of either expiry threshold (inactivity deadline or absolute lifetime limit). The default warning window is 5 minutes before expiry.
- **FR-012**: The expiry warning MUST differentiate between the two expiry causes: inactivity (extendable by interacting) versus absolute lifetime (cannot be extended; re-login required after expiry).
- **FR-009**: A session MUST also expire when a configurable absolute maximum lifetime is reached, even if the user has been continuously active. This hard cap is independent of the inactivity timeout and cannot be extended by activity.
- **FR-010**: Both the inactivity timeout period and the absolute maximum session lifetime MUST be independently configurable without a code deployment.

### Key Entities

- **Session**: Represents a single authenticated login event for a user. Has a creation time, an inactivity deadline, an absolute expiry time (hard cap from creation), and a revocation state.
- **Inactivity Deadline**: The timestamp after which the session is considered expired if the user has not interacted. Reset on each user interaction to `(time of interaction) + inactivity timeout period`. Cannot exceed the session's absolute expiry time.
- **Absolute Expiry Time**: A fixed timestamp set at session creation to `(login time) + maximum session lifetime`. The session is unconditionally expired at this point regardless of recent activity.
- **Inactivity Timeout Period**: A configurable duration representing how long a session remains valid without any user interaction. Applies to all sessions system-wide.
- **Maximum Session Lifetime**: A configurable hard cap on how long any session may last from creation, regardless of user activity.
- **User Interaction**: A deliberate action taken by the user within the application — navigating to a page, submitting a form, clicking a button. Does not include automated background requests.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: A logged-in user who refreshes the page or opens a new tab sees their authenticated content within the same time as a normal page load — no additional login step is introduced.
- **SC-002**: A user idle for longer than the configured timeout is redirected to login within one interaction attempt after expiry, 100% of the time; after re-login they land on the page they were visiting when the session expired.
- **SC-003**: A user who interacts at least once before the timeout elapses has their deadline extended; they are never expired mid-session while actively using the application.
- **SC-004**: Both the inactivity timeout period and the absolute maximum session lifetime can each be changed by updating a single configuration value, taking effect for all sessions created after the change, with no code changes or redeployment required.
- **SC-005**: The session expiry message is distinct from other error messages; users can clearly identify that inactivity — not a system error — caused the logout.
- **SC-006**: A visible warning appears before expiry with sufficient lead time (minimum 5 minutes) for the user to save work or take action; the warning clearly distinguishes between extendable inactivity expiry and non-extendable absolute lifetime expiry.

## Clarifications

### Session 2026-02-27

- Q: Is there an absolute maximum session lifetime, independent of user activity? → A: Yes — sessions have both a rolling inactivity timeout AND a configurable hard maximum lifetime (e.g., 8 hours), after which re-login is required regardless of activity.
- Q: Should the app show a proactive warning before the session expires? → A: Yes — show a dismissable warning before expiry, giving the user a chance to extend it or save work.
- Q: After re-login following session expiry, where should the user land? → A: Redirect back to the original URL the user was on when their session expired.

## Assumptions

- "User interaction" is defined as any request the user explicitly triggers in the browser (page navigation, form submission, button click that calls the backend). Passive viewing, scrolling, or keyboard input that does not trigger a server request does not count.
- The default inactivity timeout is 30 minutes — a widely accepted default for web applications. This can be adjusted via configuration (US3).
- Sessions are identified by an httponly cookie already set at login; no change to the login mechanism itself is needed.
- The application has a single session per login event. Concurrent tabs share the same session; activity in any tab resets the inactivity timer.
- Existing sessions at the time of deployment will gradually transition: they will be expired normally when their current `expires_at` is reached. No forced logout of active users is required.
