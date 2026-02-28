# Data Model: Apply UI Design System to App Pages

**Feature**: 003-fix-ui-design-pages
**Date**: 2026-02-27

---

This feature introduces no backend data model changes. All changes are static frontend artifacts (CSS files and minor JSX class name additions). The "data model" below describes the CSS artifact structure and the BEM class map for each page.

---

## CSS Artifacts

| File | BEM Block | Imported By | Purpose |
|------|-----------|-------------|---------|
| `frontend/src/pages/auth.css` | `.auth` | `Login.tsx`, `SignUp.tsx` | Shared auth page layout + form styling |
| `frontend/src/pages/Dashboard.css` | `.dashboard` | `Dashboard.tsx` | Dashboard page layout |
| `frontend/src/pages/Admin.css` | `.admin` | `Admin.tsx` | Admin page layout + user list + detail panel |
| `frontend/src/pages/Profile.css` | `.profile` | `Profile.tsx` | Profile page layout + sections |
| `frontend/src/components/AppHeader.css` | `.app-header` | `AppHeader.tsx` | Navigation header bar |

---

## BEM Class Map

### `.auth` (auth.css)

| Class | Element | Role |
|-------|---------|------|
| `.auth` | `<div>` wrapper | Page-level container, centers content |
| `.auth__heading` | `<h1>` | Page title (Syne 700, font-size-h2) |
| `.auth__form` | `<form>` | Form container with vertical flex layout |
| `.auth__field` | `<label>` | Label + input group |
| `.auth__label` | `<span>` inside label | Label text styling |
| `.auth__input` | `<input>` | Text/password/email input |
| `.auth__input:focus-visible` | — | Focus ring using accent-3 |
| `.auth__btn` | `<button type="submit">` | Primary submit button (accent-1 bg) |
| `.auth__btn:hover` | — | Hover lift + glow |
| `.auth__error` | `<p role="alert">` | Error message (accent-2 color) |
| `.auth__footer` | `<p>` below form | Navigation link to alternate auth page |
| `.auth__link` | `<a>` | Link to login/signup (accent-3) |

### `.dashboard` (Dashboard.css)

| Class | Element | Role |
|-------|---------|------|
| `.dashboard` | `<div>` wrapper | Page container |
| `.dashboard__heading` | `<h1>` | Page title |
| `.dashboard__welcome` | `<p>` | Welcome message |

### `.admin` (Admin.css)

| Class | Element | Role |
|-------|---------|------|
| `.admin` | `<div>` wrapper | Page container |
| `.admin__heading` | `<h1>` | Page title |
| `.admin__count` | `<p>` | Total user count |
| `.admin__list` | `<ul>` | User list |
| `.admin__item` | `<li>` | User list item |
| `.admin__user-btn` | `<button>` | User selection button |
| `.admin__user-btn--inactive` | modifier | Dimmed style for inactive users |
| `.admin__detail` | `<div>` | User detail card (elevated bg) |
| `.admin__detail-heading` | `<h2>` | User email heading |
| `.admin__detail-name` | `<p>` | Display name |
| `.admin__detail-field` | `<label>` | Role select / active checkbox |
| `.admin__detail-select` | `<select>` | Role dropdown |
| `.admin__detail-checkbox` | `<input[checkbox]>` | Active toggle |
| `.admin__detail-actions` | `<div>` | Save/Close button group |
| `.admin__btn` | `<button>` | Action button |
| `.admin__btn--primary` | modifier | Save button (accent-1) |
| `.admin__btn--ghost` | modifier | Close button (transparent) |

### `.profile` (Profile.css)

| Class | Element | Role |
|-------|---------|------|
| `.profile` | `<div>` wrapper | Page container |
| `.profile__heading` | `<h1>` | Page title |
| `.profile__info` | `<div>` | User info section |
| `.profile__name` | `<p>` | Display name |
| `.profile__email` | `<p>` | Email address |
| `.profile__avatar` | `<img>` | Avatar image |
| `.profile__avatar-placeholder` | `<div>` | Avatar placeholder (elevated bg, icon) |
| `.profile__section` | `<section>` | Section wrapper (password, avatar) |
| `.profile__section-heading` | `<h2>` | Section title |

### `.app-header` (AppHeader.css)

| Class | Element | Role |
|-------|---------|------|
| `.app-header` | `<header>` | Sticky nav bar |
| `.app-header__nav` | `<nav>` | Link group |
| `.app-header__link` | `<a>` | Navigation link |
| `.app-header__link--active` | modifier | Current page highlight |
| `.app-header__user` | `<span>` | Display name text |
| `.app-header__logout` | `<button>` | Logout button (ghost style) |
