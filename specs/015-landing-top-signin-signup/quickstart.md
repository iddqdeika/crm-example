# Quickstart: Sign Up / Sign In at Top of Landing with Design-Document UI (015-landing-top-signin-signup)

## What this feature does

- **Top-of-landing auth**: Sign up and Sign in are visible in the top area of the landing page (above the fold) for unauthenticated visitors, with no scroll required.
- **Design-document UI**: Those controls use the project design document’s typography (e.g. Outfit 600), color tokens (e.g. primary accent for Sign up, secondary/outline for Sign in), spacing scale, and minimum 44px touch target.

## Run the app

Use the existing dev setup:

```bash
docker compose -f docker/docker-compose.dev.yml up -d
# Or run backend and frontend locally per project docs.
```

Open the frontend (e.g. http://localhost:3000) and ensure you are **logged out**.

## Manual test

1. Open the **landing page** (e.g. http://localhost:3000/). Confirm **Sign up** and **Sign in** appear in the **top** of the page (header/nav), visible without scrolling.
2. Click **Sign up** in the top area → you should land on the sign-up flow. Go back, then click **Sign in** in the top area → you should land on the sign-in flow.
3. **Design check**: Compare the top Sign up and Sign in controls to the project design document. They should use the defined typography (e.g. Outfit, weight 600), primary accent for the main CTA, and spacing/touch targets (e.g. min 44px height, spacing tokens). No hard-coded colors that contradict the document.

## Automated tests

- **Unit**: Landing or AppHeader tests assert that (1) Sign up and Sign in are present in the top area for unauthenticated users, and (2) the controls use design tokens (e.g. CSS custom properties or computed styles for font, colors). Optional: assert min height for touch target.
- **E2E** (optional): Playwright scenario: open landing as visitor, assert Sign up and Sign in are visible above the fold; click each and assert correct route.

```bash
cd frontend && npm run test:run
# E2E: npm run e2e:test
```
