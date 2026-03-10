# Qualityboard

Adtech campaign management platform: auth, profiles, campaigns, admin, and a public blog with content management.

- **Stack**: FastAPI (Python 3.12) + React 18 (TypeScript, Vite). PostgreSQL, Redis, MinIO, Meilisearch. Docker Compose for dev/e2e/prod.
- **Docs**: [Architecture, testing, quick start → docs/README.md](docs/README.md)
- **Specs**: Feature specs and tasks live under `specs/` (e.g. `specs/014-landing-auth-blog-nav/`).

```bash
docker compose -f docker/docker-compose.dev.yml up --build
# Frontend http://localhost:3000 · API http://localhost:8000/api/docs
```
