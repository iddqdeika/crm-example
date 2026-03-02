# Routing Contract: API vs Page Routes

## API Routes (all under `/api` prefix)

All backend endpoints are served under `/api`. The prefix is applied at the FastAPI application level.

| Before | After | Method(s) |
|--------|-------|-----------|
| `/auth/signup` | `/api/auth/signup` | POST |
| `/auth/login` | `/api/auth/login` | POST |
| `/auth/logout` | `/api/auth/logout` | POST |
| `/me/profile` | `/api/me/profile` | GET |
| `/me/password` | `/api/me/password` | PATCH |
| `/me/avatar` | `/api/me/avatar` | POST, DELETE |
| `/me/session/touch` | `/api/me/session/touch` | POST |
| `/me/column-config` | `/api/me/column-config` | GET, PUT |
| `/campaigns` | `/api/campaigns` | GET, POST |
| `/campaigns/{id}` | `/api/campaigns/{id}` | GET, PATCH |
| `/admin/users` | `/api/admin/users` | GET |
| `/admin/users/{id}` | `/api/admin/users/{id}` | GET, PATCH |
| `/health` | `/api/health` | GET |
| `/docs` | `/api/docs` | GET |
| `/openapi.json` | `/api/openapi.json` | GET |

## Page Routes (SPA, served as `index.html`)

All paths not matching `/api/...` serve the SPA's `index.html`. The SPA's client-side router handles these paths.

| Path | Page |
|------|------|
| `/` | Landing |
| `/login` | Login |
| `/signup` | Sign Up |
| `/dashboard` | Dashboard |
| `/profile` | Profile |
| `/campaigns` | Campaign List |
| `/campaigns/new` | Create Campaign |
| `/campaigns/:id` | Edit Campaign |
| `/admin` | Admin Panel |

## Proxy Rules

### Development (Vite)

Single proxy rule: `/api` → `http://localhost:8000`

### Production (Nginx)

```
location /api/ {
    proxy_pass http://backend:8000;
    ...
}
location / {
    try_files $uri $uri/ /index.html;
}
```
