# Quickstart: Playwright UI Scenario Tests

## Prerequisites

- Docker and Docker Compose installed
- Node.js 20+ installed
- Playwright browsers installed (`npx playwright install chromium` in `frontend/`)

## Run the Full E2E Suite (One Command)

```bash
cd frontend
npm run e2e
```

This command:
1. Starts the docker-compose E2E stack (postgres, redis, minio, backend, frontend)
2. Waits for all health checks to pass
3. Runs all Playwright tests in headless Chromium
4. Tears down the stack and removes volumes

## Run Individual Steps

```bash
# Start the E2E stack (keep running)
npm run e2e:up

# Run tests (stack must be running)
npm run e2e:test

# Run a single scenario
npx playwright test e2e/01-registration-profile.spec.ts

# Run in headed mode (see the browser)
npx playwright test --headed

# Stop the stack
npm run e2e:down
```

## Verification Checklist

After implementation, verify these pass:

1. **One-command execution**: `npm run e2e` completes without manual intervention
2. **All scenarios green**: 6 spec files, all tests pass
3. **Design checkpoints**: Each scenario has at least one CSS assertion that validates against `docs/design.md` tokens
4. **Test independence**: Running any single spec file in isolation passes (`npx playwright test e2e/03-login-logout-session.spec.ts`)
5. **Suite timing**: Full run completes in under 3 minutes
6. **Clean teardown**: After `npm run e2e`, no docker containers remain from the E2E stack

## Troubleshooting

- **Tests fail with "connection refused"**: The docker-compose stack may not be healthy yet. Check `docker compose -f ../docker/docker-compose.e2e.yml ps` for service status.
- **Font assertions fail**: Ensure Google Fonts (Syne, Outfit) are loaded. In Docker, the frontend build bundles the CSS but fonts load from Google Fonts CDN — container needs internet access.
- **Admin login fails**: Verify `SEED_ADMIN=true` is set in `docker-compose.e2e.yml` and the backend startup logs show "Admin user seeded".
