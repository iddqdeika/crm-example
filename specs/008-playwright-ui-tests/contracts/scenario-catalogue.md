# Scenario Catalogue: E2E Test Contracts

Each scenario maps to one Playwright spec file. Checkpoints are the assertions within each test.

---

## Scenario 01: Registration and Profile

**File**: `frontend/e2e/01-registration-profile.spec.ts`
**Pre-seeded data**: Admin user (for later scenarios; not needed here)

| Step | Action | Functional Checkpoint |
|------|--------|-----------------------|
| 1 | Navigate to `/signup` | Sign-up form visible (email, password, display name fields) |
| 2 | Fill form, submit | Redirect to `/dashboard`; header shows display name |
| 3 | Click "Profile" in header | `/profile` loads; display name and email visible |

**Design Checkpoint**: On `/profile`, assert `body` background-color matches `--color-bg-primary` (`rgb(8, 8, 15)`), body font-family includes `Outfit`.

---

## Scenario 02: Campaign Creation and Listing

**File**: `frontend/e2e/02-campaign-create-list.spec.ts`
**Pre-seeded data**: Admin user
**Setup**: Register new user → admin assigns buyer role → log in as buyer

| Step | Action | Functional Checkpoint |
|------|--------|-----------------------|
| 1 | Navigate to `/campaigns` | Campaigns listing page loads; table visible |
| 2 | Click "New Campaign" | Redirect to `/campaigns/new` |
| 3 | Fill name, budget, status; submit | Redirect to `/campaigns/:id`; heading contains campaign name |
| 4 | Navigate to `/campaigns` | New campaign visible in table with correct name and budget |

**Design Checkpoint**: On `/campaigns`, assert table container background matches `--color-bg-primary` or `--color-bg-secondary`, heading font-family includes `Syne`.

---

## Scenario 03: Login, Logout, and Session Expiry

**File**: `frontend/e2e/03-login-logout-session.spec.ts`
**Pre-seeded data**: None (creates own user via signup)

| Step | Action | Functional Checkpoint |
|------|--------|-----------------------|
| 1 | Register a new user via `/signup` | Redirect to `/dashboard` |
| 2 | Click "Log out" | Redirect to `/login` |
| 3 | Log in with same credentials | Redirect to `/dashboard`; header shows display name |
| 4 | Click "Log out" again | Redirect to `/login`; display name not in header |
| 5 | Navigate to `/login?reason=expired` | Session-expired message visible |

**Design Checkpoint**: On `/login`, assert body background-color matches `--color-bg-primary`, form text color matches `--color-text-primary`.

---

## Scenario 04: Admin User Management

**File**: `frontend/e2e/04-admin-user-management.spec.ts`
**Pre-seeded data**: Admin user

| Step | Action | Functional Checkpoint |
|------|--------|-----------------------|
| 1 | Log in as admin | Redirect to `/dashboard`; "Admin" link visible in header |
| 2 | Click "Admin" link | `/admin` loads; user list visible with columns |
| 3 | Select a user, change role to "buyer" | Updated role reflected in the user list |

**Design Checkpoint**: On `/admin`, assert body background-color matches `--color-bg-primary`, heading font-family includes `Syne`.

---

## Scenario 05: Campaign Edit and Archive

**File**: `frontend/e2e/05-campaign-edit-archive.spec.ts`
**Pre-seeded data**: Admin user
**Setup**: Register new user → admin assigns buyer role → buyer creates a campaign

| Step | Action | Functional Checkpoint |
|------|--------|-----------------------|
| 1 | Navigate to `/campaigns/:id` | Edit form loaded with campaign data |
| 2 | Change name, click "Save" | Updated name visible on page after save |
| 3 | Navigate to `/campaigns` | Updated name visible in listing |
| 4 | Click "Archive" on campaign, confirm | Campaign status changes to "archive" |
| 5 | Open archived campaign | All fields disabled; no "Save" button; archived notice visible |

**Design Checkpoint**: On the edit page, assert body background-color matches `--color-bg-primary`.

---

## Scenario 06: Design Compliance

**File**: `frontend/e2e/06-design-compliance.spec.ts`
**Pre-seeded data**: Admin user (to access all pages)
**Setup**: Register user → admin assigns buyer role → create a campaign (to have data on pages)

| Page | Design Assertions |
|------|-------------------|
| `/` (Landing) | bg-color = `--color-bg-primary`, h1 font-family includes `Syne`, body font-family includes `Outfit` |
| `/login` | bg-color = `--color-bg-primary`, text color = `--color-text-primary` |
| `/signup` | bg-color = `--color-bg-primary`, text color = `--color-text-primary` |
| `/dashboard` | bg-color = `--color-bg-primary`, heading font-family includes `Syne` |
| `/profile` | bg-color = `--color-bg-primary`, body font-family includes `Outfit` |
| `/campaigns` | bg-color = `--color-bg-primary`, heading font-family includes `Syne` |
| `/campaigns/new` | bg-color = `--color-bg-primary` |
| `/campaigns/:id` | bg-color = `--color-bg-primary` |
| `/admin` | bg-color = `--color-bg-primary`, heading font-family includes `Syne` |

---

## Edge Case Tests (embedded in scenarios)

| Edge Case | Embedded In | Assertion |
|-----------|-------------|-----------|
| Duplicate email registration | 01-registration-profile | Error message visible |
| Wrong login credentials | 03-login-logout-session | Error message visible, stays on `/login` |
| Empty campaign fields | 02-campaign-create-list | Form prevents submission or shows validation error |
| Non-admin accessing `/admin` | 04-admin-user-management | Redirect to `/dashboard` |
| Unauthenticated accessing `/campaigns` | 03-login-logout-session | Redirect to `/login` |

---

## Shared Helpers

| Helper | File | Purpose |
|--------|------|---------|
| `signup(page, email, password, name)` | `e2e/helpers/auth.ts` | Fill and submit signup form |
| `login(page, email, password)` | `e2e/helpers/auth.ts` | Fill and submit login form |
| `logout(page)` | `e2e/helpers/auth.ts` | Click logout in header |
| `assignBuyerRole(page, adminEmail, adminPassword, targetEmail)` | `e2e/helpers/admin.ts` | Log in as admin, find user, change role to buyer, log out |
| `expectBgColor(page, selector, expectedRgb)` | `e2e/helpers/design.ts` | Assert background-color matches token |
| `expectFontFamily(page, selector, expectedFamily)` | `e2e/helpers/design.ts` | Assert font-family includes expected family name |
| `expectTextColor(page, selector, expectedRgb)` | `e2e/helpers/design.ts` | Assert color matches token |
| `DESIGN_TOKENS` | `e2e/helpers/design.ts` | Map of token names to expected `rgb()` / font values |

---

## Design Token Expected Values

Sourced from `frontend/src/index.css`:

| Token | CSS Variable | Expected Computed Value |
|-------|-------------|------------------------|
| bg-primary | `--color-bg-primary` | `rgb(8, 8, 15)` |
| bg-secondary | `--color-bg-secondary` | `rgb(17, 17, 25)` |
| text-primary | `--color-text-primary` | `rgb(240, 240, 245)` |
| text-secondary | `--color-text-secondary` | `rgb(157, 157, 171)` |
| accent-1 | `--color-accent-1` | `rgb(0, 229, 160)` |
| accent-2 | `--color-accent-2` | `rgb(255, 61, 113)` |
| accent-3 | `--color-accent-3` | `rgb(123, 97, 255)` |
| font-display | `--font-display` | `Syne` |
| font-body | `--font-body` | `Outfit` |
