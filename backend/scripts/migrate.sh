#!/usr/bin/env bash
# Run Alembic migrations. Usage: ./migrate.sh upgrade head | downgrade -1
set -e
cd "$(dirname "$0")/.."
export PYTHONPATH="${PYTHONPATH:-}:$(pwd)/src"
if [ -f ../.env ]; then set -a; source ../.env; set +a; fi
alembic "$@"
