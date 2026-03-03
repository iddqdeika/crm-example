# E2E Test Scenarios

**Suite**: Playwright · `frontend/e2e/`  
**Run command**: `npm run e2e:up && npm run e2e:test && npm run e2e:down`  
**Config**: `frontend/playwright.config.ts`  
**Total scenarios**: 42

---

## Scenario Index

| ID | File | User Story | Scenario | Type |
|----|------|------------|----------|------|
| E01 | 01-registration-profile | US1 | Register and redirect to dashboard with name in header | functional |
| E02 | 01-registration-profile | US1 | Navigate to profile and see display name and email | functional |
| E03 | 01-registration-profile | US1 | Design checkpoint: profile page tokens | design |
| E04 | 01-registration-profile | US1 | Edge case: duplicate email shows error | edge case |
| E05 | 02-campaign-create-list | US2 | Campaigns listing loads with table visible | functional |
| E06 | 02-campaign-create-list | US2 | Create campaign → redirected to edit page with name in heading | functional |
| E07 | 02-campaign-create-list | US2 | New campaign visible in listing after creation | functional |
| E08 | 02-campaign-create-list | US2 | Design checkpoint: campaigns listing tokens | design |
| E09 | 02-campaign-create-list | US2 | Edge case: empty campaign name prevents submission | edge case |
| E34 | 02-campaign-create-list | US2 | Create campaign with ad group and creative → persisted on edit page | functional |
| E35 | 07-blog-section | US5 | Landing page shows blog section with posts after creation | functional |
| E36 | 07-blog-section | US5 | Content-manager creates post → visible on /blog | functional |
| E37 | 07-blog-section | US5 | Content-manager edits post → updated content visible publicly | functional |
| E38 | 07-blog-section | US5 | Content-manager deletes post → removed from /blog | functional |
| E39 | 07-blog-section | US5 | Search on /blog returns highlighted results | functional |
| E40 | 07-blog-section | US5 | Content-manager cannot access /campaigns | functional |
| E41 | 07-blog-section | US5 | Admin can create and manage blog posts | functional |
| E42 | 07-blog-section | US5 | Post detail shows last updated only after edit | functional |
| E10 | 03-login-logout-session | US3 | Register then logout then login again | functional |
| E11 | 03-login-logout-session | US3 | Logout clears user from header | functional |
| E12 | 03-login-logout-session | US3 | Session expired message shown | functional |
| E13 | 03-login-logout-session | US3 | Design checkpoint: login page tokens | design |
| E14 | 03-login-logout-session | US3 | Edge case: wrong password shows error | edge case |
| E15 | 03-login-logout-session | US3 | Edge case: unauthenticated user redirected to login | edge case |
| E16 | 04-admin-user-management | US4 | Admin sees Admin link and user list | functional |
| E17 | 04-admin-user-management | US4 | Admin can change user role to buyer | functional |
| E18 | 04-admin-user-management | US4 | Design checkpoint: admin page tokens | design |
| E19 | 04-admin-user-management | US4 | Edge case: non-admin redirected from /admin to /dashboard | edge case |
| E20 | 05-campaign-edit-archive | US5 | Edit campaign name and save | functional |
| E21 | 05-campaign-edit-archive | US5 | Updated name visible in listing | functional |
| E22 | 05-campaign-edit-archive | US5 | Archive campaign from listing | functional |
| E23 | 05-campaign-edit-archive | US5 | Archived campaign is view-only | functional |
| E24 | 05-campaign-edit-archive | US5 | Design checkpoint: edit page tokens | design |
| E25 | 06-design-compliance | US6 | Landing page (/) — background + fonts | design |
| E26 | 06-design-compliance | US6 | Login page (/login) — background + text color | design |
| E27 | 06-design-compliance | US6 | Signup page (/signup) — background + text color | design |
| E28 | 06-design-compliance | US6 | Dashboard (/dashboard) — background + display font | design |
| E29 | 06-design-compliance | US6 | Profile (/profile) — background + body font | design |
| E30 | 06-design-compliance | US6 | Campaigns listing (/campaigns) — background + body font | design |
| E31 | 06-design-compliance | US6 | Campaign new (/campaigns/new) — background color | design |
| E32 | 06-design-compliance | US6 | Campaign edit (/campaigns/:id) — background color | design |
| E33 | 06-design-compliance | US6 | Admin page (/admin) — background + display font | design |

---

## Scenarios by User Story

### US1 — Registration and Profile

**File**: `frontend/e2e/01-registration-profile.spec.ts`  
**Setup**: No prerequisites — creates fresh users per test.

| ID | Scenario | Key Assertions |
|----|----------|----------------|
| E01 | Register and redirect to dashboard with name in header | URL matches `/dashboard`, `header-user` contains display name |
| E02 | Navigate to profile and see display name and email | URL matches `/profile`, `profile-display-name` and `profile-email` visible |
| E03 | Design checkpoint: profile page tokens | `body` background = `#08080f`, body font family contains `Outfit` |
| E04 | Edge case: duplicate email shows error | Alert visible, URL stays on `/signup` |

---

### US2 — Campaign Creation and Listing

**File**: `frontend/e2e/02-campaign-create-list.spec.ts`  
**Setup**: `beforeAll` — registers a standard user, logs out, assigns buyer role via admin API.

| ID | Scenario | Key Assertions |
|----|----------|----------------|
| E05 | Campaigns listing loads with table visible | `campaign-table` visible after navigation to `/campaigns` |
| E06 | Create campaign → redirected to edit page with name in heading | URL matches `/campaigns/:id`, Name field has campaign value |
| E07 | New campaign visible in listing after creation | Campaign name text visible in `campaign-table` |
| E08 | Design checkpoint: campaigns listing tokens | `body` background = `#08080f`, body font family contains `Outfit` |
| E09 | Edge case: empty campaign name prevents submission | URL stays on `/campaigns/new` |
| E34 | Create campaign with ad group and creative → persisted on edit page | After redirect to edit page: `ad-group-block` visible, Country targets = "US", Creative name = "Banner Ad" |

---

### US3 — Login, Logout, and Session

**File**: `frontend/e2e/03-login-logout-session.spec.ts`  
**Setup**: No shared prerequisites — each test is self-contained.

| ID | Scenario | Key Assertions |
|----|----------|----------------|
| E10 | Register then logout then login again | URL matches `/dashboard`, `header-user` contains name after re-login |
| E11 | Logout clears user from header | URL matches `/login`, `header-user` not visible |
| E12 | Session expired message shown | Text matching `/session.*expired/i` visible at `/login?reason=expired` |
| E13 | Design checkpoint: login page tokens | `body` background = `#08080f`, text color = `#f0f0f5` |
| E14 | Edge case: wrong password shows error | Alert visible, URL stays on `/login` |
| E15 | Edge case: unauthenticated user redirected to login | Direct navigation to `/campaigns` redirects to `/login` |

---

### US4 — Admin User Management

**File**: `frontend/e2e/04-admin-user-management.spec.ts`  
**Setup**: Uses seeded `ADMIN_EMAIL`/`ADMIN_PASSWORD` credentials from `helpers/admin.ts`.

| ID | Scenario | Key Assertions |
|----|----------|----------------|
| E16 | Admin sees Admin link and user list | `header-admin-link` visible, URL matches `/admin`, `admin-user-list` visible |
| E17 | Admin can change user role to buyer | Role dropdown updated to `buyer`, detail panel closes, user row shows `buyer` |
| E18 | Design checkpoint: admin page tokens | `body` background = `#08080f`, `h1` font family contains `Syne` |
| E19 | Edge case: non-admin redirected from /admin to /dashboard | URL matches `/dashboard` after navigating to `/admin` as standard user |

---

### US5 — Campaign Edit and Archive

**File**: `frontend/e2e/05-campaign-edit-archive.spec.ts`  
**Setup**: `beforeAll` — registers buyer, assigns buyer role, creates one campaign to share across tests.

| ID | Scenario | Key Assertions |
|----|----------|----------------|
| E20 | Edit campaign name and save | Name input has updated value after save |
| E21 | Updated name visible in listing | Updated campaign name text visible in listing table |
| E22 | Archive campaign from listing | Accepts `window.confirm` dialog; campaign shows `archive` status after reload |
| E23 | Archived campaign is view-only | `archived-notice` visible, Name input disabled, Save button not visible |
| E24 | Design checkpoint: edit page tokens | `body` background = `#08080f` |

---

### US6 — Design Compliance (All Pages)

**File**: `frontend/e2e/06-design-compliance.spec.ts`  
**Setup**: `beforeAll` — registers buyer, assigns role, creates a campaign to get a valid edit URL.

Design tokens verified against `helpers/design.ts`:

| Token | Value |
|-------|-------|
| `bgPrimary` | `rgb(8, 8, 15)` (`#08080f`) |
| `textPrimary` | `rgb(240, 240, 245)` (`#f0f0f5`) |
| `fontDisplay` | `Syne` |
| `fontBody` | `Outfit` |

| ID | Scenario | URL | Assertions |
|----|----------|-----|------------|
| E25 | Landing page | `/` | `bgPrimary` on body, `fontDisplay` on h1, `fontBody` on body |
| E26 | Login page | `/login` | `bgPrimary` on body, `textPrimary` on body |
| E27 | Signup page | `/signup` | `bgPrimary` on body, `textPrimary` on body |
| E28 | Dashboard | `/dashboard` | `bgPrimary` on body, `fontDisplay` on h1 |
| E29 | Profile | `/profile` | `bgPrimary` on body, `fontBody` on body |
| E30 | Campaigns listing | `/campaigns` | `bgPrimary` on body, `fontBody` on body |
| E31 | Campaign new | `/campaigns/new` | `bgPrimary` on body |
| E32 | Campaign edit | `/campaigns/:id` | `bgPrimary` on body |
| E33 | Admin page | `/admin` | `bgPrimary` on body, `fontDisplay` on h1 |

---

## US5 — Blog Section

**File**: `frontend/e2e/07-blog-section.spec.ts`  
**Auth**: content_manager role user (created via signup + admin role assignment in `beforeAll`)

**Notes**: Post create flow uses **Publish** button (`publish-post-btn`); public post URLs use **slug** (`/blog/post/:slug`). Draft vs published and SEO meta (title, description, canonical) are covered by 012-blog-seo-slugs.

| ID | Scenario | URL | Auth | Assertions |
|----|----------|-----|------|------------|
| E35 | Landing page shows blog section with posts | `/` | none | `[data-testid="landing-blog-section"]` visible after post created |
| E36 | Content-manager creates post → visible on /blog | `/blog` | content_manager | Post title visible after save |
| E37 | Content-manager edits post → updated content visible | `/blog` | content_manager | Updated title visible after edit |
| E38 | Content-manager deletes post → removed from /blog | `/blog` | content_manager | Title not visible after delete + confirm |
| E39 | Search on /blog returns highlighted results | `/blog` | none | Search input + results visible |
| E40 | Content-manager cannot access /campaigns | `/campaigns` → `/dashboard` | content_manager | Redirect + Blog link shown, Campaigns link hidden |
| E41 | Admin can create and manage blog posts | `/blog/manage` | admin | Post created and visible in manage list |
| E42 | Post detail shows last updated only after edit | `/blog/post/:slug` | content_manager | "last updated" hidden on new, visible after edit |

---

## Helper Modules

| File | Purpose |
|------|---------|
| `frontend/e2e/helpers/auth.ts` | `signup()`, `login()`, `logout()`, `uniqueEmail()` |
| `frontend/e2e/helpers/admin.ts` | `assignBuyerRole()`, `ADMIN_EMAIL`, `ADMIN_PASSWORD` |
| `frontend/e2e/helpers/design.ts` | `DESIGN_TOKENS`, `expectBgColor()`, `expectFontFamily()`, `expectTextColor()` |

---

## Adding New Scenarios

When adding a new E2E test scenario:

1. Add or extend a spec file in `frontend/e2e/` following the `NN-name.spec.ts` naming convention.
2. Add a row to the **Scenario Index** table at the top of this file — increment the ID (`E34`, `E35`, …).
3. Add a row to the appropriate **User Story** section table.
4. If the scenario belongs to a new user story, create a new `## USN — ...` section and a new spec file.
5. Update the **Total scenarios** count in the header.
