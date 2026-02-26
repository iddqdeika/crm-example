#!/usr/bin/env bash
# Apply migrations then start the FastAPI app.
set -e
cd "$(dirname "$0")/.."
export PYTHONPATH="${PYTHONPATH:-}:$(pwd)/src"
if [ -f ../.env ]; then set -a; source ../.env; set +a; fi
echo "Running migrations..."
alembic upgrade head
echo "Starting server..."
exec uvicorn app.main:app --host 0.0.0.0 --port 8000
