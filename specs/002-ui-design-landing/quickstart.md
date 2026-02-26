# Quickstart: UI Design Document & Creative Landing Page

**Feature**: `002-ui-design-landing` | **Branch**: `002-ui-design-landing`

## Prerequisites

- Node.js (for frontend dev server)
- Docker + Docker Compose (for full stack)
- Git checkout of `002-ui-design-landing` branch

## Running Locally

### Frontend only (fastest for this feature)

```bash
cd frontend
npm install
npm run dev
```

Visit `http://localhost:5173` to see the landing page.

### Full stack (via Docker)

```bash
cd docker
docker compose -f docker-compose.dev.yml up --build
```

Visit `http://localhost:3000` for the frontend.

## Running Tests

### Landing page tests

```bash
cd frontend
npm test -- --run src/pages/Landing.test.tsx
```

### All frontend tests

```bash
cd frontend
npm test
```

## Key Files

| File | Purpose |
|------|---------|
| `docs/design.md` | UI design document (visual identity, tokens, guidelines) |
| `frontend/src/pages/Landing.tsx` | Landing page component (hero + benefits + CTA) |
| `frontend/src/pages/Landing.css` | Landing page styles (dark theme, BEM) |
| `frontend/src/pages/Landing.test.tsx` | Landing page automated tests |
| `frontend/src/index.css` | Global design tokens (CSS custom properties) |

## Verification Checklist

After implementation, verify:

1. `npm test` passes — all landing page structure tests green
2. Landing page loads at root URL for unauthenticated visitors
3. Three sections visible: hero, benefits, CTA
4. Dark theme with vivid accents matches `docs/design.md`
5. Value proposition "Quality ensures your future — let's check it" is visible
6. Both "Sign up" and "Sign in" CTAs are present and link correctly
7. Body text contrast >= 7:1 (check with browser DevTools or contrast checker)
8. Page is responsive at mobile (375px), tablet (768px), desktop (1280px)
