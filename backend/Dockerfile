# Multi-stage backend image: build deps, then runtime as non-root.
# Copy dependency manifests first so pip install is cached until they change.
FROM python:3.12-slim AS builder
WORKDIR /app
RUN pip install --no-cache-dir uv
COPY pyproject.toml uv.lock ./
RUN uv export --no-emit-project --no-dev -o requirements.txt && \
    uv pip install --system -r requirements.txt
COPY src ./src
RUN uv pip install --system --no-deps .

FROM python:3.12-slim AS runtime
WORKDIR /app
RUN useradd --create-home --shell /bin/bash appuser
COPY --from=builder /usr/local/lib/python3.12/site-packages /usr/local/lib/python3.12/site-packages
COPY --from=builder /usr/local/bin /usr/local/bin
COPY src ./src
COPY migrations ./migrations
COPY alembic.ini ./
COPY scripts/start.sh ./scripts/start.sh
RUN chmod +x ./scripts/start.sh && chown -R appuser:appuser /app
USER appuser
ENV PYTHONUNBUFFERED=1
EXPOSE 8000
CMD ["./scripts/start.sh"]
