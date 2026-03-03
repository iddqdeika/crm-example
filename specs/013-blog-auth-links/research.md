# Research: Blog Login and Register Links

**Feature**: 013-blog-auth-links  
**Purpose**: Resolve how to show auth links on blog pages and redirect back to the same page after login/register.

---

## 1. Redirect-after-auth from blog

**Decision**: Use the existing **sessionStorage `redirectAfterLogin`** pattern already used by the app for session-expiry flows. When the user clicks "Log in" or "Register" from a blog page, set `sessionStorage.setItem("redirectAfterLogin", currentPath)` (e.g. `/blog` or `/blog/post/<slug>`) before navigating to `/login` or `/signup`. After successful login, `AuthContext.login()` already reads `redirectAfterLogin` and redirects via `window.location.href`; after signup, the SignUp page must be updated to do the same so that post-registration redirect respects the same key.

**Rationale**: No new mechanism; reuse keeps behavior consistent and avoids duplicate state. The blog is just another "origin" that can set the redirect; landing and other pages do not set it when linking to login/signup unless we add that elsewhere (out of scope).

**Alternatives considered**:
- **Query param `?redirect=/blog/post/foo`**: Works but duplicates logic and would require Login/SignUp to read from URL and write to sessionStorage; existing pattern is sessionStorage-only, so we stick with it.
- **Server-side redirect URL**: Not needed; redirect is client-side after auth success.

**Implementation note**: Links on blog listing and post pages must set `redirectAfterLogin` to `location.pathname` (and optionally `pathname + search` if we need to preserve query) before navigating. Use `Link` with an `onClick` that sets sessionStorage, or a small wrapper that sets it and navigates programmatically.

---

## 2. Where to render the links (placement)

**Decision**: Add a small **auth prompt block** (e.g. "Log in" and "Register" links or buttons) in the blog layout so it appears on both the blog listing page and the individual post page when the user is not authenticated. Placement: above the main content or in a consistent spot (e.g. top of the content area, or in the blog page header) so it is visible without scrolling on typical viewports. Exact placement is a design decision; the spec allows "blog content area, header within the blog section, or a consistent placement."

**Rationale**: Single placement pattern for both pages keeps implementation simple and avoids duplicating markup. Reusing the same component or pattern on both BlogPage and BlogPostPage satisfies FR-001 and FR-002.

**Alternatives considered**:
- **Only in global header**: Spec says links may be in the blog area; if the app already has header login/register, blog-specific links are additive so users who are focused on blog content see the option without scrolling to the top.
- **Floating/sticky bar**: More intrusive; simple inline links are sufficient per spec.

**Implementation note**: Use `useAuth()` to get `user`; when `!user`, render the links. When `user` is present, do not render them (FR-005). No new backend or API.
