# Implementation Plan: Playwright UI Scenario Tests

**Branch**: `008-playwright-ui-tests` | **Date**: 2026-02-26 | **Spec**: [spec.md](spec.md)
**Input**: Feature specification from `/specs/008-playwright-ui-tests/spec.md`

## Summary

Add a comprehensive Playwright E2E test suite that documents and verifies the main user scenarios through the Qualityboard application. Tests run against a dedicated docker-compose stack that starts all services (frontend, backend, PostgreSQL, Redis, MinIO) with health checks. Each scenario validates both functional behavior (navigation, form submission, redirects) and design compliance (CSS computed values vs. `docs/design.md` tokens). A pre-seeded admin user enables buyer role assignment within tests.

## Technical Context

**Language/Version**: TypeScript (Playwright Test framework)
**Primary Dependencies**: `@playwright/test` (already installed in `frontend/package.json`)
**Storage**: N/A — tests operate against the running application's PostgreSQL via the UI
**Testing**: Playwright Test with `list` reporter (default), HTML reporter for CI
**Target Platform**: Local development machine (Windows), Docker containers for the SUT
**Project Type**: E2E test suite for an existing web application
**Performance Goals**: Full suite < 3 minutes
**Constraints**: Each test file self-contained; sequential execution (workers: 1); headless Chromium
**Scale/Scope**: 6 user stories → 6 test files + shared helpers + docker-compose

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

- **TDD (tests before code)**: This feature's deliverable IS the tests themselves. The "production code" is the test suite. Constitution compliance is met by writing scenario spec outlines first, then implementing the Playwright code that fulfills each scenario. No application code changes are needed.
- **Service boundaries & contracts**: No new services are introduced. Tests interact with existing services through the browser UI only. The docker-compose file composes existing service images.
- **Docker-first delivery**: The test infrastructure uses a dedicated `docker/docker-compose.e2e.yml` that builds and runs the full application stack. Playwright runs on the host against the containerized app.
- **No violations detected.** The Complexity Tracking section is not needed.

## Project Structure

### Documentation (this feature)

```text
specs/008-playwright-ui-tests/
├── plan.md              # This file
├── research.md          # Phase 0 output
├── data-model.md        # Phase 1 output (minimal — no new entities)
├── quickstart.md        # Phase 1 output
├── contracts/           # Phase 1 output (scenario catalogue)
└── tasks.md             # Phase 2 output
```

### Source Code (repository root)

```text
docker/
└── docker-compose.e2e.yml       # NEW — dedicated E2E stack

frontend/
├── playwright.config.ts          # MODIFIED — add E2E docker baseURL support
├── e2e/
│   ├── helpers/
│   │   ├── auth.ts               # NEW — signup, login, logout helpers
│   │   ├── admin.ts              # NEW — admin login + role assignment helper
│   │   └── design.ts             # NEW — CSS assertion helpers for design tokens
│   ├── 01-registration-profile.spec.ts   # NEW — US1
│   ├── 02-campaign-create-list.spec.ts   # NEW — US2
│   ├── 03-login-logout-session.spec.ts   # NEW — US3
│   ├── 04-admin-user-management.spec.ts  # NEW — US4
│   ├── 05-campaign-edit-archive.spec.ts  # NEW — US5
│   ├── 06-design-compliance.spec.ts      # NEW — US6
│   └── campaign-creation.spec.ts         # EXISTING — will be superseded by 02-*
└── package.json                  # MODIFIED — add e2e scripts
```

**Structure Decision**: E2E tests live in `frontend/e2e/` alongside the existing Playwright config. Shared helpers in `e2e/helpers/` provide reusable auth, admin, and design assertion functions. The docker-compose file for the E2E stack lives in `docker/` next to the existing dev and prod compose files. The old `campaign-creation.spec.ts` is superseded by the new comprehensive `02-campaign-create-list.spec.ts`.

## Admin Seed Strategy

The docker-compose E2E stack needs a pre-seeded admin user for buyer role provisioning (FR-009). The approach:

1. The `docker-compose.e2e.yml` defines an environment variable `SEED_ADMIN_EMAIL` / `SEED_ADMIN_PASSWORD` on the backend service.
2. The backend startup script (`scripts/start.sh`) already runs Alembic migrations. A seed step after migrations creates the admin user if it doesn't exist (idempotent).
3. Test helpers reference the same admin credentials via constants.

This avoids modifying the application's production code path — the seed is an E2E-only concern controlled by environment variables.

## Design Token Assertion Strategy

Design checks use Playwright's `page.evaluate()` to read `getComputedStyle()` values and compare them against expected token values. The `e2e/helpers/design.ts` module:

1. Defines a `DESIGN_TOKENS` constant with expected values sourced from `frontend/src/index.css`.
2. Exports assertion functions: `expectBgColor(page, selector, token)`, `expectFontFamily(page, selector, token)`, etc.
3. Each scenario file calls these in its design checkpoint test.

Color comparison normalizes hex → rgb to handle browser rendering differences.
