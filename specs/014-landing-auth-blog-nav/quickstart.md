# Quickstart: Landing Sign In/Sign Up, Blog Nav, Manage Posts Rename (014-landing-auth-blog-nav)

## What this feature does

- **Landing page**: Shows "Sign in" and "Sign up" in both the hero CTA and in a persistent header/nav (e.g. top-right). Same labels used app-wide for auth entry points.
- **Visitor nav**: When not logged in, the header shows **Blog** (→ `/blog`), **Sign in** (→ `/login`), **Sign up** (→ `/signup`) so visitors can read the blog and sign in/up without going to the landing first.
- **Logged-in nav**: Order is **Dashboard**, **Blog** (→ `/blog`), **Profile**, then role-based **Campaigns** (buyer/admin), **Manage posts** (→ `/blog/manage`) (content_manager/admin), **Admin** (admin). "Blog" opens the public listing; "Manage posts" opens the post management area.
- **Manage area**: All user-visible labels for the management area use **"Manage posts"**: nav link, BlogManagePage heading, BlogManageEditPage title/breadcrumb and back link.

## Run the app

Use the existing dev setup (no new services):

```bash
# From repo root
docker compose -f docker/docker-compose.dev.yml up -d
# Or run backend and frontend locally per project docs.
```

Open the frontend (e.g. http://localhost:3000).

## Manual test

1. **Landing (visitor)**  
   Go to **http://localhost:3000**. You should see "Sign in" and "Sign up" in the hero CTA and in the header/nav. Header should also show **Blog**. Click Blog → you land on `/blog`. Click Sign in → login page. Sign up → signup page.

2. **Blog as visitor**  
   Go to **http://localhost:3000/blog** (or click Blog from landing). Header shows Blog, Sign in, Sign up. Blog listing loads.

3. **Logged-in nav**  
   Log in as a user with Dashboard access. Nav order: Dashboard, Blog, Profile (and Campaigns/Manage posts/Admin by role). **Blog** links to `/blog` (public listing). If you have content_manager or admin role, **Manage posts** links to `/blog/manage`.

4. **Manage posts area**  
   As content_manager or admin, open **Manage posts** from the nav. Manage list and edit pages show "Manage posts" in the heading and breadcrumb/back link (not "Blog" or "Blog Posts").

## Automated tests

- **Unit**: AppHeader (visitor nav: Blog, Sign in, Sign up; logged-in order and labels; Manage posts only for content_manager/admin). Landing (Sign in/Sign up in hero and header). BlogManagePage/BlogManageEditPage ("Manage posts" in title/heading).
- **E2E**: Playwright — landing shows Sign in/Sign up in header; visitor can open Blog; after login, nav has Dashboard, Blog, Profile; content_manager sees Manage posts and it goes to /blog/manage.

```bash
cd frontend && npm run test
# E2E: npm run e2e:test
```
