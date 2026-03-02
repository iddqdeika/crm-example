#!/usr/bin/env bash
# Apply migrations then start the FastAPI app.
set -e
cd "$(dirname "$0")/.."
export PYTHONPATH="${PYTHONPATH:-}:$(pwd)/src"
if [ -f ../.env ]; then set -a; source ../.env; set +a; fi

if [ "${SEED_ADMIN:-}" = "true" ]; then
  echo "E2E mode: resetting database..."
  alembic downgrade base 2>/dev/null || true
  echo "E2E mode: flushing Redis..."
  python -c "
import os, redis
r = redis.Redis.from_url(os.environ['REDIS_URL'])
r.flushall()
print('Redis flushed.')
" 2>/dev/null || echo "Redis flush skipped (not critical)."
fi

echo "Running migrations..."
alembic upgrade head

if [ "${SEED_ADMIN:-}" = "true" ]; then
  echo "Seeding admin user..."
  python src/scripts/seed_admin.py
fi
echo "Starting server..."
exec uvicorn app.main:app --host 0.0.0.0 --port 8000
