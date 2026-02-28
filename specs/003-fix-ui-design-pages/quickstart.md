# Quickstart: Apply UI Design System to App Pages

**Feature**: 003-fix-ui-design-pages
**Date**: 2026-02-27

---

## Running Locally

### Frontend Only (design review)

```bash
cd frontend
npm install
npm run dev
```

Open `http://localhost:5173`. Navigate to `/login`, `/signup`, then sign in to access `/dashboard`, `/profile`, and `/admin` (requires admin role).

### Full Stack (with backend + DB)

```bash
docker compose -f docker/docker-compose.dev.yml up --build
```

Frontend: `http://localhost:5173`
Backend API: `http://localhost:8000`

---

## Running Tests

```bash
cd frontend
npm test
```

Runs Vitest in watch mode. To run once:

```bash
cd frontend
npm test -- --run
```

---

## Key Files

### New CSS Files (created by this feature)

| File | Purpose |
|------|---------|
| `frontend/src/pages/auth.css` | Shared auth page + form styles |
| `frontend/src/pages/Dashboard.css` | Dashboard page styles |
| `frontend/src/pages/Admin.css` | Admin page styles |
| `frontend/src/pages/Profile.css` | Profile page styles |
| `frontend/src/components/AppHeader.css` | Navigation header styles |

### Modified TSX Files (class name additions only)

| File | Change |
|------|--------|
| `frontend/src/pages/Login.tsx` | Import `auth.css`, add BEM classes |
| `frontend/src/pages/SignUp.tsx` | Import `auth.css`, add BEM classes |
| `frontend/src/pages/Dashboard.tsx` | Import `Dashboard.css`, add BEM classes |
| `frontend/src/pages/Admin.tsx` | Import `Admin.css`, add BEM classes |
| `frontend/src/pages/Profile.tsx` | Import `Profile.css`, add BEM classes |
| `frontend/src/components/AppHeader.tsx` | Import `AppHeader.css`, add BEM classes |
| `frontend/src/components/LoginForm.tsx` | Add BEM classes to form elements |
| `frontend/src/components/SignUpForm.tsx` | Add BEM classes to form elements |
| `frontend/src/components/PasswordChangeForm.tsx` | Add BEM classes to form elements |
| `frontend/src/components/AvatarUpload.tsx` | Add BEM classes to upload area |

### New Test Files

| File | Purpose |
|------|---------|
| `frontend/src/pages/Login.test.tsx` | Auth page structure + BEM class assertions |
| `frontend/src/pages/SignUp.test.tsx` | Auth page structure + BEM class assertions |
| `frontend/src/pages/Dashboard.test.tsx` | Dashboard structure + BEM class assertions |
| `frontend/src/pages/Admin.test.tsx` | Admin page structure + BEM class assertions |
| `frontend/src/pages/Profile.test.tsx` | Profile page structure + BEM class assertions |
| `frontend/src/components/AppHeader.test.tsx` | Header structure + BEM class assertions |

### Reference Files (unchanged)

| File | Role |
|------|------|
| `docs/design.md` | UI Design Document — source of truth |
| `frontend/src/index.css` | CSS design tokens (custom properties) |
| `frontend/src/pages/Landing.css` | Reference for BEM patterns |

---

## Verification Checklist

After implementation, confirm:

- [ ] All five pages use dark theme (`--color-bg-primary` or `--color-bg-secondary`)
- [ ] Typography follows design doc (Syne for headings, Outfit for body)
- [ ] Form inputs have visible focus, hover, and error states
- [ ] Accent colors match design doc (`--color-accent-1` green, `--color-accent-2` red-pink, `--color-accent-3` violet)
- [ ] AppHeader is styled and consistent across dashboard, profile, admin
- [ ] All pages responsive at 375px, 768px, 1280px
- [ ] Body text contrast >= 7:1 (already guaranteed by tokens)
- [ ] All tests pass (`npm test -- --run`)
- [ ] No console errors or warnings in browser
- [ ] Avatar placeholder is visible on dark background
- [ ] Error messages are visible using accent-2 color
