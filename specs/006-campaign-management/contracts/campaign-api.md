# API Contract: Campaign CRUD and Listing

**Feature**: 006-campaign-management  
**Service**: Backend (FastAPI)

---

## Authentication and authorization

- All campaign endpoints require an authenticated session (existing cookie/auth).
- **Buyer**: may only list/read/edit/delete campaigns where they are the owner.
- **Admin**: may list all campaigns, filter by owner, and edit/delete any campaign.
- **Optimistic locking**: Update (PATCH) and any operation that changes campaign data must respect the `version` field; see below.

---

## Campaign resource

**GET /campaigns** — List campaigns

- **Query**: `search` (optional, full-text across name/status/owner/budget), `sort` (e.g. `name`, `-budget` for desc), `sort2` (optional second field), `owner_id` (optional, admin only — filter by owner).
- **Response 200**: `{ "items": [ CampaignSummary ], "total": N }`.
- **CampaignSummary** (and GET single): include `id`, `name`, `budget`, `status`, `owner_id`, **`version`** (required for optimistic locking), `created_at`, `updated_at`. Optional: `owner_display_name` for listing.
- Buyer: only campaigns with `owner_id = current_user.id` are returned. Admin: all unless `owner_id` filter is set.

**GET /campaigns/{id}** — Get single campaign (with ad groups and creatives)

- **Response 200**: Campaign detail including **`version`**, nested `ad_groups` (each with `creatives`). Used by edit page; client must store `version` and send it on save.
- **Response 403**: Not owner and not admin.
- **Response 404**: Campaign not found or not visible to user.

**POST /campaigns** — Create campaign

- **Body**: `{ "name", "budget", "status" }`. Owner set to current user.
- **Response 201**: Created campaign including `id`, **`version`** (e.g. 1), and other fields.
- **Response 400**: Validation (e.g. budget negative, name empty).

**PATCH /campaigns/{id}** — Update campaign (optimistic locking)

- **Body**: Must include **`version`** (integer) that the client received from GET. May include `name`, `budget`, `status`, `owner_id` (transfer; only owner may set), and nested ad_groups/creatives as needed by design.
- **Behavior**: Backend loads campaign; if `request.version != campaign.version`, do **not** update; return **409 Conflict**.
- **Response 200**: Updated campaign with **`version`** incremented.
- **Response 409**: Version mismatch — campaign was modified since client loaded it. Body must indicate conflict (e.g. `{ "detail": "Campaign was updated by someone else; please refresh and try again.", "code": "CONCURRENT_MODIFICATION" }`). Client should show message and offer refresh.
- **Response 403**: Not owner and not admin.
- **Response 404**: Campaign not found.

**DELETE /campaigns/{id}** — Delete campaign (optional; or archive only)

- If delete is in scope: same auth as PATCH. 204 on success.
- Archive is separate: PATCH status to `archive` (with version check).

**POST /campaigns/{id}/archive** (or PATCH status to archive)

- Sets status to `archive` with confirmation implied by client. **Optimistic locking applies**: send `version`; 409 if stale.
- **Response 200**: Campaign archived (version incremented).
- **Response 409**: Version mismatch (same as PATCH).

---

## Ad groups and creatives (nested or separate endpoints)

- Either: PATCH /campaigns/{id} accepts full payload including `ad_groups[]` and each `ad_group.creatives[]` (version still required on campaign).
- Or: REST for ad_groups and creatives under `/campaigns/{id}/ad-groups`, `/ad-groups/{id}/creatives`. Campaign update (name, budget, status, owner) still uses PATCH /campaigns/{id} with version.
- Design choice in implementation; contract for campaign-level update and version/409 is above.

---

## Tests (contract) — optimistic locking

- **MUST** have a test: `test_patch_campaign_returns_409_when_version_mismatch`. Steps: create campaign, get version V; simulate another update (version becomes V+1); PATCH with version V; assert response is 409 and body indicates conflict; assert campaign in DB still has version V+1 and the other update's data.
- **MUST** have a test: `test_patch_campaign_succeeds_when_version_matches`. Steps: create campaign, PATCH with correct version; assert 200 and version incremented.
