<!--
Sync Impact Report

- Version change: UNSET → 1.0.0
- Modified principles:
  - Core Principles template → concrete Qualityboard principles:
    1) Testability First
    2) Test-Driven Development
    3) Red-Green-Refactor
    4) Microservices by Design
    5) Docker-First Delivery
- Added sections:
  - Architecture & Deployment Constraints
  - Development Workflow & Quality Gates
- Removed sections:
  - None (all template sections were specialized, not removed)
- Templates:
  - .specify/templates/plan-template.md → ✅ updated (Constitution Check gates now reflect TDD, microservices, Docker)
  - .specify/templates/spec-template.md → ✅ aligned (no change required)
  - .specify/templates/tasks-template.md → ✅ updated (tests/tasks wording aligned with TDD requirement)
  - .specify/templates/commands/* → ⚠ pending (no commands directory present in repository)
  - README.md → ⚠ pending (file not found; create/update to reference constitution if needed)
  - docs/quickstart.md → ⚠ pending (file not found; create/update to reference runtime practices if needed)
- Deferred TODOs:
  - None; all placeholders in this constitution have been concretely defined.
-->

# Qualityboard Constitution

## Core Principles

### I. Testability First

- All new code MUST be independently testable via automated tests without relying on external
  services or shared mutable global state.
- Public behaviors MUST be verifiable by fast, deterministic tests at appropriate levels
  (unit, contract, integration) that can run in CI on every change.
- Dependencies MUST be invertible or mockable so that each component can be exercised in
  isolation with predictable inputs and outputs.
- Any change that reduces testability (e.g., tighter coupling, hidden I/O, implicit globals)
  MUST include a refactoring plan that restores or improves testability.
- **Rationale**: High testability keeps the system evolvable, reduces regression risk, and
  enables confident, rapid iteration.

### II. Test-Driven Development

- For every behavior change, tests MUST be written before production code that satisfies them.
- Each user story and task MUST specify at least one automated test that will fail before
  implementation begins and pass when the work is complete.
- Commits MUST NOT introduce new production behavior without corresponding tests that
  demonstrate that behavior.
- Pull requests MUST clearly indicate which tests cover the change; reviewers MUST reject
  changes that add or modify behavior without tests unless a one-time exception is explicitly
  documented and justified.
- **Rationale**: TDD enforces clarity of intent, prevents untested behavior from creeping in,
  and provides living documentation of system behavior.

### III. Red-Green-Refactor

- Work on behavior changes MUST follow the Red-Green-Refactor loop:
  1) Red: write a failing test that expresses the desired behavior;
  2) Green: implement the minimal code required to make the test pass;
  3) Refactor: improve the design while keeping the test suite green.
- Refactoring steps MUST be small, with tests run frequently enough that breakage is detected
  within minutes.
- Code that passes tests but is clearly in the "Green" state (duplicated, unclear, or ad hoc)
  MUST be followed by explicit Refactor steps before considering the work complete.
- CI pipelines MUST fail if test suites fail; merging with failing tests is prohibited.
- **Rationale**: The Red-Green-Refactor discipline ensures that design improvements are always
  backed by a safety net of tests and that behavior remains stable as the system evolves.

### IV. Microservices by Design

- System functionality MUST be decomposed into services with clear ownership of data and
  behavior; each service MUST be independently deployable.
- Service boundaries MUST be defined by stable contracts (e.g., HTTP/JSON APIs, messaging
  schemas) that are versioned and tested via automated contract tests.
- Cross-service calls MUST only occur through these explicit contracts; direct database access
  across service boundaries is prohibited.
- Each microservice MUST have its own lifecycle (versioning, deployment, rollback strategy)
  and MUST be operable (health checks, logs, metrics) without depending on internal details
  of other services.
- **Rationale**: Microservices with clear contracts enable independent deployment, scaling,
  and evolution of different parts of the system.

### V. Docker-First Delivery

- Every deployable service or application MUST build into a reproducible Docker image, with
  all runtime dependencies defined in code (e.g., Dockerfiles, compose manifests).
- Local development environments, CI pipelines, and production deployments MUST use the same
  image definition for a given service version.
- Docker images MUST expose clear configuration points (environment variables, configuration
  files) so that the same image can be promoted across environments without code changes.
- CI pipelines MUST build, scan, and smoke-test Docker images before they are eligible for
  deployment.
- **Rationale**: Docker-first delivery guarantees consistent environments, simplifies
  deployment, and reduces "works on my machine" failures.

## Architecture & Deployment Constraints

- Service design MUST respect the `Microservices by Design` principle:
  - Each service owns its data stores and contracts.
  - Communication between services MUST occur only through well-specified, versioned
    interfaces.
  - Breaking contract changes MUST be introduced via compatible versions and explicit
    migration plans.
- Deployments MUST be expressed as code:
  - Dockerfiles, docker-compose files, Kubernetes manifests, or equivalent MUST live in the
    repository and be reviewed like any other code.
  - Environment-specific configuration MUST be externalized (e.g., environment variables,
    configuration files) and MUST NOT be hard-coded.
- Observability for each service (logs, metrics, health endpoints) MUST be sufficient to:
  - Detect failures and degraded performance.
  - Attribute issues to a specific service or contract.
  - Support rollback decisions during incidents.
- Performance, resilience, and security constraints (latency targets, timeouts, retries,
  authentication/authorization) MUST be defined in service contracts and verified in tests.

## Development Workflow & Quality Gates

- Every feature starts with a specification (`spec.md`) that defines user stories and
  independently testable behaviors.
- The implementation plan (`plan.md`) MUST pass a **Constitution Check** before significant
  design or coding:
  - Tests for each story are identified and will be written first (TDD + Red-Green-Refactor).
  - Service boundaries and ownership are described where microservices are involved.
  - Docker image(s) and deployment paths are specified for all deployable components.
  - Any proposed deviations from core principles are listed in the Complexity Tracking section
    with justification and an explicit plan to return to compliance.
- Task lists (`tasks.md`) MUST:
  - Include test tasks for each behavior before implementation tasks.
  - Make explicit which files and services are touched, to preserve microservice boundaries.
  - Group work by independently shippable user stories.
- CI/CD pipelines MUST enforce:
  - All automated tests pass.
  - Docker images build and pass smoke tests.
  - Contract tests between services remain green before promotion to higher environments.

## Governance

- This constitution supersedes all informal practices for design, testing, and deployment in
  the Qualityboard project.
- All changes to architecture, development workflow, or deployment that materially affect
  these principles MUST be reflected here and versioned.
- **Amendment procedure**:
  - Propose a change via pull request that clearly describes:
    - The motivation and impact.
    - The updated constitution text.
    - Required changes to specs, plans, tasks, CI/CD, or runtime documentation.
  - Determine the version bump type:
    - MAJOR: Principle removals or backward-incompatible governance changes.
    - MINOR: New principles or sections, or materially expanded guidance.
    - PATCH: Clarifications, typo fixes, or non-semantic refinements.
  - Obtain approval from the designated maintainers before merging.
  - Update the Sync Impact Report comment at the top of this file to reflect the change.
- **Compliance expectations**:
  - Reviewers MUST verify that feature specs, plans, and task lists align with this
    constitution before approving.
  - CI MUST block merges that violate test or Docker requirements (e.g., missing tests,
    failing test suites, failing image builds).
  - Exceptions MUST be explicitly documented, time-bounded, and tracked to completion.

**Version**: 1.0.0 | **Ratified**: 2026-02-26 | **Last Amended**: 2026-02-26
