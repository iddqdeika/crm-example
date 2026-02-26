"""Application settings from environment variables."""
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
    session_ttl_seconds: int = 86400 * 7  # 7 days


def get_settings() -> Settings:
    return Settings()
