# Research: Ad Groups and Creatives on Campaign Creation

## Decision 1: Backend Schema Extension Strategy

**Decision**: Extend `CampaignCreate` to add `ad_groups: list[AdGroupUpsert] | None = None`, and reuse the existing `AdGroupUpsert` / `CreativeUpsert` schemas without modification.

**Rationale**: `AdGroupUpsert` already captures all targeting fields and supports nested `CreativeUpsert` items (name, ad_type, click_url, sort_order). The same schema is used for PATCH; it is already proven correct. Creating a separate `AdGroupCreate` nested type would add schema duplication with no benefit — the `id` field on `AdGroupUpsert` is simply ignored (or rejected if supplied) on creation.

**Alternatives considered**:
- Introduce a new `AdGroupCreate` schema with no `id` field → rejected: unnecessary duplication, the existing `AdGroupUpsert` with `id: None` already expresses "new ad group" semantics clearly.
- Require a separate POST for each ad group after campaign creation → rejected: spec explicitly requires single-request persistence (FR-007).

---

## Decision 2: POST Handler Ad-Group Persistence Strategy

**Decision**: After `create_campaign(...)` returns the new `Campaign`, run the same ad-group upsert loop that `patch_campaign` uses — iterate `body.ad_groups`, call `create_ad_group` for each (all are new, no `id` expected), then call `create_creative` for each nested creative. Reject any `AdGroupUpsert` item that supplies a non-null `id` with HTTP 422.

**Rationale**: The PATCH handler's ad-group loop already handles the "id is None → create" branch. For the POST handler we only need the create branch since all ad groups in a new campaign are new. Reusing `create_ad_group` and `create_creative` services requires zero new service-layer code.

**Alternatives considered**:
- Extract a shared `_apply_ad_groups(db, campaign_id, items)` helper and call it from both POST and PATCH → accepted as a refactoring improvement (reduces duplication), but not required for correctness.

---

## Decision 3: Frontend — Shared Ad-Group Section Component

**Decision**: Extract the ad-group accordion state and JSX from `CampaignEditPage.tsx` into a reusable `AdGroupsSection` component (`frontend/src/components/AdGroupsSection.tsx`). Both `CampaignEditPage` and `CampaignNewPage` import and render this component. The component uses the existing `campaign-edit__ad-group-*` CSS classes from `CampaignEditPage.css`, which `CampaignNewPage.tsx` also imports to get the shared styles.

**Rationale**: The spec requires identical UI design (FR-011). A shared component guarantees this — one implementation, one set of CSS classes, no divergence risk. Duplicating the JSX into `CampaignNewPage` would create two code paths that drift over time.

**Alternatives considered**:
- Copy the ad-group JSX directly into `CampaignNewPage.tsx` → rejected: violates DRY, creates maintenance burden.
- Create a new `ad-groups-section.css` with renamed BEM classes → rejected: spec says design must match edit; same classes achieve this most directly.

---

## Decision 4: Frontend API Service Update

**Decision**: Extend the `campaignApi.create()` type signature to accept `ad_groups?: AdGroupUpsert[]`, passing it in the POST body if supplied. The `AdGroupUpsert` type is already defined in `api.ts`.

**Rationale**: Minimal change — one type addition and one body field. Existing callers that don't pass `ad_groups` continue to work unchanged.

---

## Decision 5: Test Strategy

**Decision**: Three test layers.

1. **Backend integration tests** (`backend/tests/test_campaign_create_with_ad_groups.py`): Use the existing in-memory SQLite + HTTPX test client. Cover: POST with ad groups + creatives → 201 + populated response; POST with invalid creative name → 422; POST without `ad_groups` field → existing behavior unchanged.

2. **Frontend Vitest component tests**: Extend `CampaignNewPage.test.tsx` with assertions for: "Add ad group" button renders; ad group block appears after click; "Add creative" button appears inside the block.

3. **E2E Playwright test**: Add a new scenario to `frontend/e2e/02-campaign-create-list.spec.ts` — create a campaign with one ad group (country targets = "US") and one creative (name, ad type), verify the edit page shows the ad group and creative after redirect.

**Rationale**: Backend integration tests exercise the schema change and the ad-group persistence loop independently of the UI. Vitest component tests verify the shared `AdGroupsSection` renders correctly in the new page context without requiring a running server. E2E tests verify the full vertical slice end-to-end, including the UI and persistence.

The user explicitly asked for E2E tests to be included.

---

## Decision 6: No Database Migration Required

**Decision**: No new Alembic migration is needed for this feature.

**Rationale**: The `ad_groups` and `creatives` tables already exist. This feature only changes *when* rows are inserted into those tables (at creation time vs. only after editing), not the schema of those tables.
