# Research: Advertising Campaign Management

**Feature**: 006-campaign-management  
**Date**: 2026-02-27

---

## R1. Optimistic locking for campaign update

**Decision**: Use a **version** column (integer, incremented on every update) on the Campaign table. Every GET campaign (single or in list) returns `version`. PATCH/PUT must send the version the client had; backend compares with current row version. If mismatch → **409 Conflict** with a stable error code/message (e.g. `CONCURRENT_MODIFICATION` or "Campaign was updated by someone else; please refresh and try again."). No DB write on conflict.

**Rationale**: Prevents lost updates when two users (e.g. owner and admin) edit the same campaign. Spec explicitly requires this (FR-008c). Integer version is simple, avoids timestamp precision issues, and is easy to test.

**Alternatives considered**: Timestamp-based (updated_at) — possible but timezone/clock skew can cause false conflicts. Last-write-wins — rejected by spec.

**Tests**: (1) Unit: service layer receives current version and request version; if different, returns conflict and does not update. (2) Contract: PATCH with stale version returns 409 and response body indicates conflict. (3) Frontend: on 409, show message and offer refresh/retry.

---

## R2. Buyer role and default role for signup

**Decision**: Add `buyer = "buyer"` to existing `UserRole` enum (backend). Default role for **new self-signup** remains configurable; spec says "buyer role is the default role for new self-registered users going forward" — so default for signup = buyer. Existing users unchanged. Admin panel already supports role change; extend to show buyer.

**Rationale**: Minimal change; enum extension in PostgreSQL via migration; frontend already uses role for admin routing, extend to buyer (campaigns section visible, admin section forbidden).

**Alternatives considered**: Separate "buyer" flag vs role — rejected; single role enum keeps model simple.

---

## R3. Ad type (creative)

**Decision**: Store as **string** (VARCHAR) with a small allowed set defined in backend (e.g. banner, native, video). Validation at API/service layer. If product later needs open-ended types, allow any string; for now constrained set is sufficient and enables dropdown in UI.

**Rationale**: Spec says "ad type" and "exact list defined during planning"; constrained set avoids typos and supports consistent reporting.

**Alternatives considered**: Free-text only — rejected for consistency. Full enum in DB — same effect as constrained string with validation.

---

## R4. Column configuration storage

**Decision**: New table `column_configurations`: `user_id`, `context` (e.g. `"campaigns"`), `column_ids` (JSON array of column identifiers in order). One row per (user_id, context). At least one column enforced in API and frontend (FR-021).

**Rationale**: Per-user, per-context; simple to implement; JSON array for order. No need for separate column-definition table in MVP.

**Alternatives considered**: Key-value store per user — possible but table is clearer for querying. Frontend-only (localStorage) — rejected; spec requires "saved per user and restored on next login" (cross-device implied).

---

## R5. Designated system owner (deleted-user campaigns)

**Decision**: Configuration value (e.g. `DESIGNATED_SYSTEM_OWNER_ID` env or settings) pointing to an existing user ID (e.g. a system or admin account). When a user is deleted, all campaigns with `owner_id = deleted_user_id` are updated to `owner_id = designated_system_owner_id`. If not configured, migration/delete logic can refuse to delete users who own campaigns, or use a well-known system user created by migration.

**Rationale**: Spec requires reassignment to a "designated system owner"; no orphaned campaigns. Configurable ID allows deployment-specific choice.

**Alternatives considered**: Reassign to deleting admin — possible but not in spec. Orphan with null owner — rejected by spec.

---

## R6. Campaign list limits (ad groups / creatives per campaign)

**Decision**: No hard limit in schema for MVP. Application can enforce a reasonable limit (e.g. 50 ad groups, 100 creatives per campaign) in service layer to avoid abuse and poor UX; exact numbers can be set in implementation. Spec edge case "how many before performance degrades" deferred to implementation; add pagination or virtualization on edit page if needed.

**Rationale**: Keeps scope manageable; limits can be added in task phase without spec change.
