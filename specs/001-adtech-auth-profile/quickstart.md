# Quickstart: Adtech Landing & Profile Auth

## Prerequisites

- Docker and Docker Compose installed
- Python 3.12 (for optional local tooling)  
- Node.js LTS (for optional local frontend tooling)

## Environment Configuration

1. Copy the example env file and fill in values:

```bash
cp .env.example .env
```

2. Ensure at minimum:

- `POSTGRES_USER`, `POSTGRES_PASSWORD`, `POSTGRES_DB`
- `DATABASE_URL` (used by backend)
- `SECRET_KEY` (for auth/session signing)
- `APP_ENV` (e.g., `development`)

All configuration is read from environment variables; do not hard-code secrets.

## Running the Stack (Docker)

From the repository root:

```bash
docker compose -f docker/docker-compose.dev.yml up --build
```

This will:

- Start PostgreSQL
- Build and run the backend container
- Build and run the frontend container

The backend container entrypoint runs `backend/scripts/start.sh`, which:

- Applies Alembic migrations via `backend/scripts/migrate.sh`
- Starts the FastAPI app server

## Accessing the App

- Landing page: `http://localhost:3000/` (served by the frontend)
- Backend API (for debugging): `http://localhost:8000/docs` (FastAPI docs)

## Local Development (Optional)

You can also run services locally outside Docker for faster inner-loop work:

1. Start PostgreSQL (e.g., via Docker or local install).
2. Export environment variables from `.env`.
3. Run backend migrations:

```bash
cd backend
./scripts/migrate.sh upgrade head
```

4. Start the backend server (from `backend/` with `src` on Python path):

```bash
cd backend
uv run uvicorn app.main:app --reload
```

Or: `PYTHONPATH=src uvicorn app.main:app --reload`

5. Start the frontend dev server:

```bash
cd frontend
npm install
npm run dev
```

## Testing

- Backend tests (from repo root or `backend/`):

```bash
cd backend
uv run pytest
```

Or: `PYTHONPATH=src pytest` (with backend deps installed).

- Frontend tests:

```bash
cd frontend
npm run test:run
```

Or: `npx vitest run`

All new behavior MUST be covered by automated tests written before implementation (TDD).

