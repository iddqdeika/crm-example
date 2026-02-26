"""FastAPI application entry point."""
from fastapi import FastAPI
from fastapi.exceptions import RequestValidationError

from api.admin import router as admin_router
from api.auth import router as auth_router
from api.profile import router as profile_router
from core.logging import (
    generic_exception_handler,
    setup_logging,
    validation_exception_handler,
)

setup_logging()

app = FastAPI(title="Qualityboard API", version="0.1.0")
app.add_exception_handler(RequestValidationError, validation_exception_handler)
app.add_exception_handler(Exception, generic_exception_handler)
app.include_router(auth_router)
app.include_router(profile_router)
app.include_router(admin_router)


@app.get("/health")
def health():
    return {"status": "ok"}
