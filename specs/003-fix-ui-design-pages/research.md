# Research: Apply UI Design System to App Pages

**Feature**: 003-fix-ui-design-pages
**Date**: 2026-02-27

---

## R1 — CSS Architecture for Shared Form Styles

**Decision**: Create a single shared `auth.css` file for common auth-page and form styles, imported by both `Login.tsx` and `SignUp.tsx`. Page-specific overrides (if any) go in the page file that imports `auth.css`.

**Rationale**: Login and SignUp share identical form structure (`auth-page` wrapper, `auth-form` form, same input/button/error patterns). A shared CSS file eliminates duplication, ensures visual consistency, and makes maintenance easier. The Landing page uses a single `Landing.css` — auth pages should follow the same granularity (one CSS file per visual "type").

**Alternatives considered**:
- Per-page CSS files (Login.css + SignUp.css): Rejected because 90%+ of styles would be duplicated.
- Global styles in index.css: Rejected because form styles are not truly global — only auth pages use them. Keeps index.css focused on tokens and resets.
- CSS modules: Rejected because the project uses plain CSS with BEM naming (established in feature 002). Introducing modules would be a convention change.

---

## R2 — BEM Naming Convention for New Components

**Decision**: Follow the same BEM convention established by `Landing.css`. Each CSS file uses a top-level block name matching the component's semantic role:

| Component | BEM Block | File |
|-----------|-----------|------|
| Auth pages (Login/SignUp) | `.auth` | `auth.css` |
| Dashboard | `.dashboard` | `Dashboard.css` |
| Admin | `.admin` | `Admin.css` |
| Profile | `.profile` | `Profile.css` |
| AppHeader | `.app-header` | `AppHeader.css` |

Elements use double underscore: `.auth__heading`, `.auth__form`, `.dashboard__welcome`.
Modifiers use double hyphen: `.auth__btn--primary`, `.admin__user--inactive`.

**Rationale**: Consistent with Landing.css patterns. BEM provides flat specificity and self-documenting class names. Existing HTML already uses some of these names (e.g., `className="auth-page"`, `className="dashboard"`, `className="admin-page"`) — we'll align them to BEM or keep compatible names.

**Alternatives considered**:
- Utility-first (Tailwind-like): Rejected — project doesn't use Tailwind; adding it would be a convention change.
- Styled-components: Rejected — project uses plain CSS.

---

## R3 — Shared Form Element Styles

**Decision**: Define reusable form input/button/label/error styles in `auth.css` using BEM classes that the form components (LoginForm, SignUpForm, PasswordChangeForm) already partially use (`auth-form`, `auth-form__error`). Extend with:

- `.auth__input` — styled text/password/email inputs
- `.auth__label` — styled labels
- `.auth__btn` — styled submit buttons (primary accent)
- `.auth__error` — error message styling (accent-2 color)
- `.auth__link` — navigation links below forms

These classes will be added to the JSX of form components. PasswordChangeForm on the Profile page will import `auth.css` indirectly through Profile importing shared form classes or by reusing the same BEM classes.

**Rationale**: LoginForm and SignUpForm already use `className="auth-form"` and `className="auth-form__error"`. Extending this naming is natural. PasswordChangeForm uses no class names — adding them is non-breaking.

**Alternatives considered**:
- Separate `forms.css`: Possible, but since all form styling lives exclusively on auth-like pages, `auth.css` is the natural home. If forms appear elsewhere in the future, extraction is trivial.

---

## R4 — Admin Page Detail Panel Styling

**Decision**: Style the `AdminUserDetail` inline component as a card/elevated surface using `--color-bg-elevated` background with a subtle border. The user list becomes a styled list with hover states. The select dropdown and checkbox receive the same input treatment as auth forms.

**Rationale**: The Admin page has unique UI elements (user list, detail panel with select/checkbox) not found on other pages. These need specific styles while reusing the design tokens. The elevated surface pattern is defined in `docs/design.md` for "hover states, elevated surfaces."

**Alternatives considered**:
- Modal overlay for detail: Rejected — the current inline pattern works well and avoids added complexity.
- Reusing auth form styles verbatim: Partially adopted for select/checkbox inputs, but the detail panel needs its own card-like treatment.

---

## R5 — AppHeader Styling Approach

**Decision**: Style AppHeader as a fixed or sticky navigation bar with dark theme (`--color-bg-secondary`), horizontal link layout, and accent hover states. Links use `--color-text-secondary` at rest, `--color-text-primary` on hover, with `--color-accent-3` for focus-visible. The logout button uses a ghost style (transparent background, text color).

**Rationale**: The header appears on all authenticated pages and sets the visual tone for the app interior. A dark secondary background differentiates it from the page body while maintaining cohesion. Sticky positioning keeps navigation accessible during scroll.

**Alternatives considered**:
- Transparent header over page content: Rejected — creates readability issues with varying page backgrounds.
- Primary background (same as body): Rejected — no visual separation between header and content.

---

## R6 — Testing Strategy for CSS-Only Changes

**Decision**: Write structural tests (Vitest + React Testing Library) that verify:
1. Correct BEM class names are present on key elements (ensures CSS selectors will match).
2. Accessibility attributes (roles, labels, landmarks) are correct.
3. Navigation links are present with correct hrefs.

Visual correctness is verified manually / via browser review (web-design-reviewer skill).

**Rationale**: CSS-only changes don't alter component logic, but TDD requires tests. Testing class name presence ensures that styling hooks are in place. This matches the approach used for Landing.test.tsx in feature 002. Visual pixel-perfect testing requires browser automation (out of scope for unit tests).

**Alternatives considered**:
- Snapshot tests: Rejected — too brittle for styling changes; any HTML change causes failures.
- Visual regression tests (e.g., Chromatic): Good for future adoption but not yet set up in the project.
