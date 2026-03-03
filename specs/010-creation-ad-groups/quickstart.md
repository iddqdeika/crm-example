# Quickstart: Ad Groups and Creatives on Campaign Creation

## Prerequisites

- Docker Desktop running
- Node.js ≥ 18 installed
- Python ≥ 3.11 + `pytest` available inside the backend container or virtual environment

---

## Running the Dev Stack

```powershell
docker compose -f docker/docker-compose.dev.yml up --build
```

Open http://localhost:3000 → log in as a buyer → navigate to **Create campaign** → you should see the "Ad groups" section below the campaign header fields.

---

## Backend Tests

Run the new backend integration tests:

```powershell
# From repo root, inside the backend container or local venv
docker compose -f docker/docker-compose.dev.yml exec backend pytest tests/test_campaign_create_with_ad_groups.py -v
```

Or locally (requires `.env` in `backend/`):

```powershell
cd backend
python -m pytest tests/test_campaign_create_with_ad_groups.py -v
```

Expected: all tests pass, including:
- `test_create_campaign_with_ad_groups_and_creatives`
- `test_create_campaign_without_ad_groups_unchanged`
- `test_create_campaign_with_invalid_creative_name`
- `test_create_campaign_with_ad_group_id_rejected`

---

## Frontend Unit Tests

```powershell
cd frontend
npm test -- --run
```

Verify new assertions in `CampaignNewPage.test.tsx` pass (Add ad group button renders, ad group block appears).

---

## E2E Tests

```powershell
cd frontend
npm run e2e:up      # start e2e docker stack (clean slate)
npm run e2e:test    # run all 34 Playwright scenarios
npm run e2e:down    # tear down
```

The new scenario **E34 — Create campaign with ad group and creative** must pass.

---

## Manual Verification Checklist

- [ ] Navigate to `/campaigns/new`
- [ ] "Ad groups" heading and "Add ad group" button are visible below the form fields
- [ ] Click "Add ad group" → accordion block appears, expanded by default
- [ ] Fill country targets = "US", add creative with name "Test Banner", ad type "banner"
- [ ] Submit the form → redirected to `/campaigns/:id` (edit page)
- [ ] Edit page shows the ad group with country targets "US"
- [ ] Edit page shows the creative "Test Banner" inside the ad group
- [ ] Click the ad group header → collapses; click again → expands (same behavior as before)
- [ ] Navigate back to `/campaigns/new`, submit without any ad groups → works as before

---

## Troubleshooting

**Backend returns 422 on creation with ad groups**  
Check that creative `name` is not empty and `id` fields in `ad_groups` items are omitted or `null`.

**Ad group section not visible on creation page**  
Verify `AdGroupsSection` is imported and rendered in `CampaignNewPage.tsx`, and `CampaignEditPage.css` is imported to provide the `campaign-edit__ad-group-*` styles.

**E2E test E34 fails with "Ad group not visible on edit page"**  
Check backend `post_campaign` handler: confirm the ad-group creation loop runs after `create_campaign()` and before returning the response.
