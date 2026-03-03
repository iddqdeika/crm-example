# Research: Landing Sign In/Sign Up, Blog Nav, Manage Posts Rename

**Feature**: 014-landing-auth-blog-nav  
**Purpose**: Resolve visitor header, nav order, and label placement so implementation matches the spec.

---

## 1. Visitor header and landing "Sign in" / "Sign up"

**Decision**: Extend **AppHeader** so that when `!user` it renders a visitor nav instead of returning null. Visitor nav shows: **Blog** (link to `/blog`), **Sign in** (link to `/login`), **Sign up** (link to `/signup`). This header appears on all public routes (/, /login, /signup, /blog, /blog/post/:slug). The landing page already has "Sign up" and "Sign in" in the hero CTA; with the header visible on `/`, we satisfy "both hero and persistent header/nav" without a second component.

**Rationale**: One header component keeps layout and styling consistent and avoids duplicating nav logic. App already renders `<AppHeader />` in AppRoutes for every route; changing it to show visitor content when `!user` is the smallest change.

**Alternatives considered**:
- **Separate VisitorHeader component**: Clear separation but two header components to maintain and layout must choose which to show; no spec requirement for separation.
- **Header only on landing**: Spec says "persistent header or nav (e.g. top-right) on the landing page"; showing the same header on blog/public pages gives visitors a consistent way to reach Blog and Sign in/Sign up from anywhere.

---

## 2. Logged-in nav order and "Blog" vs "Manage posts"

**Decision**: For logged-in users, **AppHeader** nav order: **Dashboard**, **Blog** (→ `/blog`), **Profile**, then role-based: **Campaigns** (buyer/admin), **Manage posts** (→ `/blog/manage`) (content_manager/admin), **Admin** (admin). So "Blog" is always the second item (public listing); "Manage posts" is the management area and appears only for content_manager and admin, as the fifth item (after Profile, and after Campaigns if present).

**Rationale**: Spec requires "Blog" between Dashboard and Profile; "Manage posts" as fourth item after Profile. Campaigns and Admin are existing role-based items; inserting "Manage posts" after Profile keeps the spec order (Dashboard, Blog, Profile, Manage posts) and we add Campaigns/Admin after that per existing behavior.

**Implementation note**: Today the header shows "Blog" linking to `/blog/manage` for content_manager/admin. Change that link label to "Manage posts" and add a new "Blog" link to `/blog` between Dashboard and Profile. All users (including non–content-managers) see Dashboard, Blog, Profile so they can open the public blog.

---

## 3. Manage area labels ("Manage posts")

**Decision**: Use the exact label **"Manage posts"** everywhere for the management area: AppHeader link text, BlogManagePage page heading (replace "Blog Posts"), BlogManageEditPage title/breadcrumb and "Back to" link (e.g. "← Back to Manage posts" or "← Manage posts"). No "or equivalent"; spec locks to "Manage posts".

**Rationale**: Spec and clarifications lock the label to "Manage posts" for implementation and acceptance tests.

**Alternatives considered**: None; spec is explicit.

---

## 4. Routes and permissions

**Decision**: No route changes. `/blog` remains the public listing; `/blog/manage`, `/blog/manage/new`, `/blog/manage/:id` remain the management routes, protected by ContentManagerRoute. Only labels and nav entries change.

**Rationale**: Spec does not ask for new URLs; only naming and placement in the UI.
