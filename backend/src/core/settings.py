"""Application settings from environment variables."""
import uuid
from pydantic import field_validator
from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        extra="ignore",
    )

    app_env: str = "development"
    database_url: str = "postgresql+asyncpg://postgres:changeme@localhost:5432/qualityboard"
    secret_key: str = "change-me-in-production-min-32-chars"

    # Session
    session_cookie_name: str = "session"
    session_inactivity_timeout_seconds: int = 1800
    session_max_lifetime_seconds: int = 86400 * 8
    session_warning_seconds: int = 300

    # Redis
    redis_url: str = "redis://localhost:6379"

    # Campaign management: user ID to reassign campaigns when owner is deleted
    designated_system_owner_id: uuid.UUID | None = None

    @field_validator("designated_system_owner_id", mode="before")
    @classmethod
    def empty_str_to_none(cls, v: object) -> uuid.UUID | None:
        if v == "" or v is None:
            return None
        return v if isinstance(v, uuid.UUID) else uuid.UUID(str(v))

    # Object storage (MinIO / S3-compatible)
    storage_endpoint_url: str = "http://localhost:9000"
    storage_public_url: str = "http://localhost:9000"
    storage_access_key: str = "minioadmin"
    storage_secret_key: str = "minioadmin"
    storage_bucket: str = "qualityboard-media"


def get_settings() -> Settings:
    return Settings()
