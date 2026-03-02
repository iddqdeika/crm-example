# Quickstart: Verify Separate API Routes

## Prerequisites

- Docker Compose running (`docker/docker-compose.dev.yml`)
- Or: backend on port 8000 + frontend on port 3000

## Verification Steps

### 1. Page Refresh Test (US1)

1. Open browser to `http://localhost:3000/campaigns`
2. Press F5 → should see the campaigns list page (HTML), not JSON
3. Navigate to `http://localhost:3000/campaigns/new` → create form, not JSON
4. Navigate to `http://localhost:3000/admin` → admin panel, not JSON
5. Paste `http://localhost:3000/campaigns` in a new tab → campaigns page loads

### 2. API Functionality Test (US2)

1. Open `http://localhost:3000/api/health` → `{"status":"ok"}`
2. Log in via the web UI → authentication works
3. Create a campaign → saved successfully
4. Edit the campaign, add an ad group → changes persist
5. Archive a campaign → status changes, edit page shows view-only

### 3. API Documentation

1. Open `http://localhost:3000/api/docs` → Swagger UI loads
2. All endpoints show `/api/...` prefix

### 4. Docker Health Check

1. Run `docker compose -f docker/docker-compose.dev.yml ps`
2. Backend service shows "healthy" status
3. Health check URL uses `/api/health`
