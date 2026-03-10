# Quickstart: Dashboard Role-Based Counts (016)

## What this feature does

- **Buyer**: Dashboard shows campaigns count (campaigns they own).
- **Content manager**: Dashboard shows draft posts count and published posts count.
- **Admin**: Dashboard shows campaigns count, draft posts count, published posts count, and user count (all system-wide except campaigns can be specified either way; see research.md — admin sees all campaigns).

## Run the app

Use the existing dev setup:

```bash
docker compose -f docker/docker-compose.dev.yml up -d
# Or run backend and frontend locally per project docs.
```

Open the frontend (e.g. http://localhost:3000), log in as a user with one of: buyer, content_manager, admin.

## Manual test

1. **Buyer**: Log in as a buyer. Open Dashboard (/dashboard). Confirm a “campaigns” count is visible (e.g. “X campaigns”) and matches the number of campaigns you own. If zero, confirm “0 campaigns” is shown.
2. **Content manager**: Log in as a content manager. Open Dashboard. Confirm “drafts” and “published” counts are visible and match actual draft/published post counts.
3. **Admin**: Log in as an admin. Open Dashboard. Confirm campaigns, drafts, published, and users counts are visible and accurate.
4. **Loading / error**: Reload the dashboard and confirm counts load within a few seconds; if the backend is down, confirm an appropriate error or empty state for the counts area.

## Automated tests

- **Backend**: pytest for GET /api/dashboard/counts — role-based response shape and count accuracy (see contracts/get-dashboard-counts.md).
- **Frontend**: Vitest + React Testing Library — Dashboard shows count widgets for the current role; loading and error states.
- **E2E** (optional): Playwright — log in as buyer/content_manager/admin, open dashboard, assert expected count labels and values.

```bash
# Backend
cd backend && pytest tests/ -v -k dashboard

# Frontend
cd frontend && npm run test -- --run -k Dashboard
```
