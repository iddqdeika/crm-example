# Quickstart: Blog Login and Register Links (013-blog-auth-links)

## What this feature does

- **Blog listing** (`/blog`) and **blog post** (`/blog/post/:slug`) show "Log in" and "Register" links when the user is not logged in.
- Clicking either link sends the user to `/login` or `/signup` and stores the current page URL so that after successful auth they are sent back to that same blog page.
- Logged-in users do not see these links on blog pages.

## Run the app

Use the existing dev setup (no new services):

```bash
# From repo root: start backend + frontend (e.g. Docker Compose or local)
docker compose -f docker/docker-compose.dev.yml up -d
# Or run backend and frontend locally per project docs.
```

Open the frontend (e.g. http://localhost:3000). Ensure you are **logged out**.

## Manual test

1. Go to **http://localhost:3000/blog**. You should see "Log in" and "Register" (or equivalent) in the blog area.
2. Click **Log in**. You should land on the login page. Sign in. You should be redirected back to `/blog`.
3. Log out, go to a **blog post** (e.g. http://localhost:3000/blog/post/some-slug). You should see "Log in" and "Register". Click **Register**, complete signup. You should be redirected back to that same post URL.
4. While **logged in**, open `/blog` and a blog post. You should **not** see "Log in" or "Register" in the blog content area.

## Automated tests

- **Unit**: Run frontend tests for the component(s) that render the links and set `redirectAfterLogin` (e.g. `BlogPage`, `BlogPostPage`, or `BlogAuthLinks`), and for `SignUp` redirect-after-signup behavior.
- **E2E** (optional): Add a Playwright scenario in `frontend/e2e/07-blog-section.spec.ts`: open blog as unauthenticated, see links, click Login, log in, assert URL is back on blog or post.

```bash
cd frontend && npm run test
# E2E (if added): npm run e2e:test
```
