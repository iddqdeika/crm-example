# Research: Playwright UI Scenario Tests

## Decision 1: Admin User Seeding for E2E

**Decision**: Add a lightweight seed script triggered by an environment variable (`SEED_ADMIN=true`) that runs after Alembic migrations in the backend startup. Creates an admin user with known credentials if one doesn't exist.

**Rationale**: The E2E docker-compose sets `SEED_ADMIN=true` plus `SEED_ADMIN_EMAIL` / `SEED_ADMIN_PASSWORD`. This keeps the seed logic out of production paths (the variable is only set in `docker-compose.e2e.yml`). The seed is idempotent — safe to re-run.

**Alternatives considered**:
- Direct SQL in a docker-compose init container: rejected because it bypasses password hashing logic and would duplicate auth service code.
- Playwright test creating admin via signup + manual DB role update: rejected because it requires database access from the test runner, breaking the browser-only constraint.

## Decision 2: Playwright Configuration for Docker-Based Testing

**Decision**: Modify `frontend/playwright.config.ts` to support an E2E mode via the `PLAYWRIGHT_BASE_URL` environment variable (already supported). When running against docker-compose, set `PLAYWRIGHT_BASE_URL=http://localhost:3000` and disable the `webServer` block (already conditional on `CI` env).

**Rationale**: The existing config already handles this via `process.env.PLAYWRIGHT_BASE_URL ?? "http://localhost:3000"` and conditionally disables `webServer` in CI. For E2E with docker-compose, we set `CI=true` or add a dedicated env check to skip webServer startup.

**Alternatives considered**:
- Separate Playwright config file for E2E: rejected to avoid config duplication. The existing config is already parameterized.

## Decision 3: CSS Assertion Strategy

**Decision**: Use `page.evaluate()` with `getComputedStyle()` to read CSS values. Compare against a hardcoded `DESIGN_TOKENS` map derived from `frontend/src/index.css`. Normalize colors to `rgb()` format before comparison (browsers return computed colors as `rgb(r, g, b)`).

**Rationale**: Programmatic CSS assertions are deterministic and fast. They don't depend on screenshot rendering or pixel comparison, which varies across OS/font environments. The token map is a simple key-value object maintained alongside the tests.

**Alternatives considered**:
- Screenshot comparison (Playwright's `toHaveScreenshot`): rejected due to brittleness across environments (font rendering differences, subpixel antialiasing).
- Axe-core for accessibility contrast checks: considered as a supplement. Can be added later but not in initial scope since manual contrast ratios are documented in `docs/design.md`.

## Decision 4: Test File Organization

**Decision**: One spec file per user story, prefixed with a number for execution order (`01-`, `02-`, etc.). Shared helpers in `e2e/helpers/`. The old `campaign-creation.spec.ts` is removed as its coverage is subsumed by `02-campaign-create-list.spec.ts`.

**Rationale**: Numbering provides a natural reading order that matches the spec priority (P1 first). Each file is self-contained per FR-008 — no shared state between files. Helpers are stateless utility functions (login, signup, check CSS).

**Alternatives considered**:
- Single monolithic spec file: rejected — harder to run in isolation, harder to read.
- Grouping by feature area (auth/, campaigns/): rejected — too much structure for 6 files.

## Decision 5: Docker Compose E2E Stack

**Decision**: Create `docker/docker-compose.e2e.yml` that extends the dev stack with E2E-specific overrides: admin seed enabled, shorter session timeouts for testing, and a unique database name to avoid polluting dev data.

**Rationale**: A separate compose file keeps E2E concerns isolated. It reuses the same Dockerfiles and service definitions as dev, just with different environment variables. Using a different database name (`qualityboard_e2e`) means running E2E tests never affects the developer's local data.

**Alternatives considered**:
- Reuse `docker-compose.dev.yml` directly: rejected because it would seed admin users into the dev database and use dev session timeouts.
- Docker-in-Docker for full isolation: rejected as unnecessary complexity for a local test suite.

## Decision 6: NPM Scripts for E2E

**Decision**: Add the following scripts to `frontend/package.json`:
- `e2e:up` — starts the docker-compose E2E stack (`docker compose -f ../docker/docker-compose.e2e.yml up -d --build --wait`)
- `e2e:down` — stops the stack (`docker compose -f ../docker/docker-compose.e2e.yml down -v`)
- `e2e:test` — runs Playwright with `CI=true` so it skips webServer startup
- `e2e` — orchestrates: `e2e:up`, waits for health, `e2e:test`, `e2e:down`

**Rationale**: A single `npm run e2e` command satisfies SC-004 (AI agent can execute with one command). Breaking into sub-scripts allows developers to run parts independently (e.g., keep the stack up while iterating on tests).

**Alternatives considered**:
- Makefile: rejected — the project uses npm scripts exclusively.
- Shell script wrapper: rejected — less discoverable than package.json scripts.
