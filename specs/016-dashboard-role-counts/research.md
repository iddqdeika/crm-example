# Research: Dashboard Role-Based Counts

**Feature**: 016-dashboard-role-counts  
**Purpose**: Decide API shape, scope rules, and integration points for role-based dashboard counts.

---

## 1. API shape for dashboard counts

**Decision**: Add a single backend endpoint `GET /api/dashboard/counts` (or `GET /api/me/dashboard/counts`) that returns a JSON object with optional count fields. The response includes only the keys relevant to the current user’s role (buyer: `campaigns`; content_manager: `drafts`, `published`; admin: `campaigns`, `drafts`, `published`, `users`). Frontend calls this once when the Dashboard page loads and renders widgets for each key present.

**Rationale**: One round-trip keeps the dashboard fast and avoids multiple parallel calls; role-based keys keep the contract simple and the frontend logic “show what’s there.” Existing list endpoints (campaigns, blog posts, admin users) return full lists and totals; a dedicated counts endpoint avoids over-fetching and centralizes permission logic.

**Alternatives considered**: (1) Reusing list endpoints with `limit=0` or `page_size=0` to get only `total` — rejected because blog list does not expose separate draft/published totals in one call and would require two calls. (2) Embedding counts in an existing “profile” or “me” response — rejected to keep profile payload small and to allow dashboard counts to evolve independently.

---

## 2. Scope rules for each count

**Decision**:

- **Campaigns**: Buyer sees count of campaigns they own (same as existing list_campaigns filter). Admin sees system-wide count (all campaigns). Implementation: reuse `list_campaigns`-style filtering (by `current_user_id` and `is_admin`) and return only the total count.
- **Draft / published posts**: Content manager and admin see counts of posts with `status = 'draft'` and `status = 'published'`. Scope: all posts the user is allowed to manage (content_manager and admin see all posts; no per-author filter). Implementation: two count queries (or one with conditional aggregation) on BlogPost by status.
- **Users**: Admin only. Count of user accounts (same scope as existing admin user list, e.g. all users in the system). Implementation: count from User table; no filter unless existing product rules restrict (e.g. active only); if unspecified, use total User count.

**Rationale**: Aligns with spec (“counts are scoped by existing permissions”) and existing code: campaign_service already restricts by owner for non-admin; blog is not owner-scoped for content_manager/admin; admin user list is system-wide.

**Alternatives considered**: Per-author post counts for content_manager — rejected because spec says “content manager sees draft and published counts” without restricting to “own posts”; existing blog management is system-wide for content_manager and admin.

---

## 3. Where to mount the endpoint

**Decision**: Mount under the API router with path `GET /api/dashboard/counts`. Protected by existing auth middleware; response depends on `current_user.role`. No new auth logic.

**Rationale**: “Dashboard” is a clear namespace; `/api/me/dashboard/counts` is an alternative if the project prefers “me” for current-user resources. Chose `/api/dashboard/counts` for consistency with a single dashboard resource.

**Alternatives considered**: Mounting under `/api/profile` (e.g. `/api/profile/dashboard-counts`) — rejected to keep profile focused on user profile data and to avoid overloading the profile contract.

---

## 4. Frontend integration

**Decision**: Dashboard page (Dashboard.tsx) calls the new endpoint on mount (e.g. useEffect), stores counts in component state (or a small context if needed later). Displays loading state while fetching; on error, shows an error state for the counts area (per spec edge case). Renders one widget per count key present (e.g. “X campaigns”, “X drafts”, “X published”, “X users”) using existing design tokens / Dashboard.css.

**Rationale**: Matches existing patterns (AuthContext, API client); minimal new state; loading and error handling satisfy spec. No new route or layout.

**Alternatives considered**: Server-side rendering or prefetch in a layout — not required for 3-second visibility and would add complexity; can be revisited later if needed.
