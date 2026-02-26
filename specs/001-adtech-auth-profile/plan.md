# Implementation Plan: Adtech Landing & Profile Auth

**Branch**: `001-adtech-auth-profile` | **Date**: 2026-02-26 | **Spec**: `specs/001-adtech-auth-profile/spec.md`
**Input**: Feature specification from `specs/001-adtech-auth-profile/spec.md`

**Note**: This template is filled in by the `/speckit.plan` command. See `.specify/templates/plan-template.md` for the execution workflow.

## Summary

Adtech-themed web application that provides a marketing landing page, secure authentication,
and a profile area where users (with standard or admin roles) can view and update their
account details, including password and avatar. Implementation will use a FastAPI +
PostgreSQL backend and a React + TypeScript frontend, fully Dockerized with env-based
configuration, startup scripts, and explicit migration scripts, following TDD and
microservice-friendly boundaries.

## Technical Context

**Language/Version**: Backend: Python 3.12 (FastAPI); Frontend: TypeScript + React  
**Primary Dependencies**: FastAPI, SQLAlchemy, Alembic, Uvicorn, PostgreSQL, React, React Router, React Testing Library  
**Storage**: PostgreSQL for user, profile, avatar metadata, and session data  
**Testing**: pytest (backend unit/integration/contract), React Testing Library + Jest/Vitest (frontend)  
**Target Platform**: Linux containers (Docker), orchestrated locally via Docker Compose  
**Project Type**: Web application with separate backend API and frontend SPA  
**Performance Goals**: Auth/profile endpoints p95 < 500ms under normal load; landing page first contentful paint under 2s on typical broadband  
**Constraints**: All deployable apps MUST be Dockerized; startup scripts and migration scripts MUST be present; configuration MUST come from environment variables; TDD and Red-Green-Refactor are mandatory.  
**Scale/Scope**: Initial rollout for a single adtech tenant, supporting up to ~10k registered users and low-to-moderate concurrent traffic; designed to evolve into separate auth/profile services if needed.

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

- The plan MUST identify automated tests for each user story that will be written and run
  before implementation work (TDD + Red-Green-Refactor).
- The plan MUST describe service boundaries, data ownership, and external contracts for any
  microservices involved in this feature.
- The plan MUST specify how each affected service will be built and delivered as a Docker
  image, including how it is run locally and in CI.
- Any deviation from the constitution (e.g., temporarily skipping tests, coupling between
  services, or non-containerized components) MUST be recorded in the Complexity Tracking
  section with a rationale and a time-bounded remediation plan.

## Project Structure

### Documentation (this feature)

```text
specs/001-adtech-auth-profile/
├── plan.md
├── research.md
├── data-model.md
├── quickstart.md
├── contracts/
└── tasks.md             # Created by /speckit.tasks
```

### Source Code (repository root)

```text
backend/
├── src/
│   ├── api/             # FastAPI routers (auth, profile, admin)
│   ├── models/          # SQLAlchemy models (User, Profile, Avatar, Session)
│   ├── services/        # Domain services (auth, profile management, avatar handling)
│   ├── schemas/         # Pydantic models for request/response payloads
│   └── core/            # Settings, logging, security utilities
├── migrations/          # Alembic migration scripts
├── scripts/
│   ├── start.sh         # Backend startup script (runs migrations, then app)
│   └── migrate.sh       # Explicit migration helper (upgrade/downgrade)
├── Dockerfile           # Backend Docker image
└── tests/
    ├── unit/
    ├── integration/
    └── contract/

frontend/
├── src/
│   ├── assets/
│   ├── components/      # Reusable UI components
│   ├── hooks/           # Custom React hooks
│   ├── pages/           # Landing, auth, profile, admin views
│   ├── services/        # API client for backend
│   ├── types/           # Shared TypeScript types
│   └── utils/
├── public/
├── Dockerfile           # Frontend Docker image
└── tests/               # Frontend unit/integration tests (colocated or mirrored)

docker/
├── docker-compose.dev.yml
└── docker-compose.prod.yml
```

**Structure Decision**: Web application with separate `backend/` and `frontend/` projects,
each Dockerized, sharing a PostgreSQL database via Docker Compose. Backend follows typical
FastAPI layering; frontend follows modern React + TypeScript structure with tests colocated
near components. Scripts under `backend/scripts/` provide startup and migration flows aligned
with the Docker entrypoints.

## Complexity Tracking

> **Fill ONLY if Constitution Check has violations that must be justified**

| Violation | Why Needed | Simpler Alternative Rejected Because |
|-----------|------------|-------------------------------------|
| [e.g., 4th project] | [current need] | [why 3 projects insufficient] |
| [e.g., Repository pattern] | [specific problem] | [why direct DB access insufficient] |
