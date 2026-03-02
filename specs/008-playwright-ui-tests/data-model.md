# Data Model: Playwright UI Scenario Tests

No new data entities, tables, or migrations are introduced by this feature.

The E2E tests interact with existing entities (User, Campaign, AdGroup, Creative) through the browser UI only. Test data is created at runtime via the application's own forms and APIs.

The only data-adjacent addition is a **seed script** that creates a pre-seeded admin user when `SEED_ADMIN=true` is set. This uses the existing `User` model and `auth_service.hash_password()` — no schema changes.
