"""FastAPI application entry point."""
from fastapi import APIRouter, FastAPI
from fastapi.exceptions import RequestValidationError

from api.admin import router as admin_router
from api.auth import router as auth_router
from api.campaign import router as campaign_router
from api.column_config import router as column_config_router
from api.profile import router as profile_router
from core.logging import (
    generic_exception_handler,
    setup_logging,
    validation_exception_handler,
)

setup_logging()

app = FastAPI(
    title="Qualityboard API",
    version="0.1.0",
    docs_url="/api/docs",
    openapi_url="/api/openapi.json",
)
app.add_exception_handler(RequestValidationError, validation_exception_handler)
app.add_exception_handler(Exception, generic_exception_handler)

api_router = APIRouter(prefix="/api")
api_router.include_router(auth_router)
api_router.include_router(profile_router)
api_router.include_router(campaign_router)
api_router.include_router(column_config_router)
api_router.include_router(admin_router)


@api_router.get("/health")
def health():
    return {"status": "ok"}


app.include_router(api_router)
