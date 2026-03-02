# Quickstart: Advertising Campaign Management

**Feature**: 006-campaign-management  
**Branch**: `006-campaign-management`

---

## Prerequisites

- Python 3.12+, Node 18+, Docker Compose (existing backend, frontend, Postgres, Redis, MinIO).
- Migrations run on backend startup; ensure `alembic upgrade head` succeeds (new migrations for campaigns, ad_groups, creatives, column_configurations, user role buyer).

---

## Environment (optional)

- `DESIGNATED_SYSTEM_OWNER_ID` — UUID of user to receive campaigns when a campaign owner is deleted. If unset, implementation may require a seeded "system" user or refuse delete of users who own campaigns.

---

## Run

- From repo root: `docker compose -f docker/docker-compose.dev.yml up` (or existing run command).
- Backend: campaigns API at `/campaigns`, `/campaigns/{id}`; column config at `/me/column-config`.
- Frontend: Campaigns listing and edit pages; buyer sees only own campaigns; admin sees all and can filter by owner.

---

## Verify optimistic locking

1. **Backend**: Run contract test `test_patch_campaign_returns_409_when_version_mismatch` — must pass. Run unit test that campaign update with stale version returns conflict and does not overwrite.
2. **Frontend**: Open campaign edit in two tabs; save in tab A; save in tab B with same initial version — expect B to show conflict message (409) and offer refresh; after refresh, B has new version and can save.

---

## Key files (implementation)

- **Optimistic locking**: `backend/src/models/campaign.py` (version column), `backend/src/services/campaign_service.py` (version check on update), `backend/src/api/campaign.py` (409 on conflict), `backend/tests/unit/test_campaign_service.py`, `backend/tests/contract/test_campaign_api.py`, frontend campaign edit (send version, handle 409).
- **Buyer role**: `backend/src/models/user.py` (UserRole.buyer), migration, list API filter by owner_id for buyer.
- **Campaign CRUD**: Campaign, AdGroup, Creative models and APIs; edit page with ad group blocks and creatives.
