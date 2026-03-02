# Feature Specification: Separate Page Routes from API Routes

**Feature Branch**: `007-separate-api-routes`  
**Created**: 2026-02-26  
**Status**: Draft  
**Input**: User description: "if i refresh /campaigns page it shown as json. i wish all pages open as html by default. lets separate pages from api routes and ensure any page opens as correct web-page, not as json"

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Browser Refresh Serves Web Page (Priority: P1)

A user is browsing the campaign management section of the application. They are on the `/campaigns` page viewing their campaign list. They press F5 (or click the browser refresh button). Instead of seeing their campaign list web page, they see raw JSON data from the backend API. This happens because the `/campaigns` URL path is shared between the frontend page route and the backend API route — the server forwards the browser request to the API instead of serving the single-page application.

After this fix, refreshing any page in the application — including `/campaigns`, `/campaigns/new`, `/campaigns/:id`, `/admin`, and `/me/column-config` — always serves the web application correctly.

**Why this priority**: This is a fundamental usability bug. Users cannot reliably use the application because any page refresh breaks the experience. It affects every user on every page that shares a path with an API endpoint.

**Independent Test**: Navigate to `/campaigns` in a browser, press F5; the page should render as a normal web page with the campaign list, not as JSON.

**Acceptance Scenarios**:

1. **Given** a logged-in user on the `/campaigns` page, **When** they press F5 to refresh, **Then** the page reloads as the campaign list web page (not JSON).
2. **Given** a logged-in user on `/campaigns/new`, **When** they refresh, **Then** the create campaign form appears.
3. **Given** a logged-in user on `/campaigns/:id` (edit page), **When** they refresh, **Then** the campaign edit form loads correctly.
4. **Given** a user who pastes `/campaigns` into the browser address bar and presses Enter, **Then** the web application loads and shows the campaign list.
5. **Given** a logged-in admin on `/admin`, **When** they refresh, **Then** the admin panel web page appears (not JSON).

---

### User Story 2 - API Calls Continue Working Under New Prefix (Priority: P1)

All existing application functionality — campaign CRUD, authentication, profile management, admin operations, column configuration — continues to work without interruption after the route separation. The frontend application transparently calls API endpoints at their new location.

**Why this priority**: Equal to US1 because the API must keep functioning. Separating routes without maintaining API functionality would break the entire application.

**Independent Test**: Create a campaign, edit it, list campaigns with search/sort, archive a campaign — all operations succeed as before.

**Acceptance Scenarios**:

1. **Given** a buyer user, **When** they create a new campaign, **Then** the campaign is created successfully (not a 404 or routing error).
2. **Given** a buyer user on the edit page, **When** they save changes to a campaign, **Then** the changes persist.
3. **Given** any user, **When** they log in or sign up, **Then** authentication works correctly.
4. **Given** an admin, **When** they access user management, **Then** the admin API responds correctly.
5. **Given** a user, **When** they upload an avatar or change their password, **Then** the profile API works correctly.

---

### Edge Cases

- What happens when a user bookmarks an old API path (e.g., `/campaigns`) and opens it after the change? The bookmark should open the web page, not JSON.
- What happens when external tools or scripts call the old API paths? They should receive a clear error or redirect to the new paths.
- What happens when the health check endpoint is accessed? It should remain functional (health checks are API-only, no page equivalent).

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: All backend API endpoints MUST be served under a distinct URL prefix that does not collide with any frontend page route.
- **FR-002**: All frontend page routes (e.g., `/campaigns`, `/admin`, `/login`, `/profile`) MUST always serve the single-page application HTML, regardless of whether the user navigates via client-side routing or direct browser request (refresh, address bar, bookmark).
- **FR-003**: The frontend application MUST call the API at the new prefixed location. All existing API calls (campaigns, auth, profile, admin, column config, health) MUST work as before.
- **FR-004**: Both the development server (Vite proxy) and the production server (Nginx) MUST route API requests to the backend and page requests to the SPA.
- **FR-005**: Existing tests (backend contract tests, frontend Vitest tests) MUST continue to pass after the change.
- **FR-006**: The API documentation endpoint (Swagger/OpenAPI) MUST remain accessible.

### Assumptions

- The standard convention of using `/api` as the prefix for all backend routes is appropriate for this project.
- No external systems currently depend on the existing API paths (since the application is in active development, not yet in production).
- The health check endpoint will also move under the API prefix for consistency.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: Refreshing any page in the application (`/campaigns`, `/campaigns/new`, `/campaigns/:id`, `/admin`, `/login`, `/profile`, `/dashboard`) always shows the correct web page — never JSON.
- **SC-002**: All 84 backend tests pass after the route change.
- **SC-003**: All 55 frontend tests pass after the route change.
- **SC-004**: Campaign creation, editing, listing, archiving, ad group and creative management all function correctly end-to-end after the change.
- **SC-005**: Both development (Vite dev server) and production (Docker/Nginx) environments correctly serve pages and API routes.
