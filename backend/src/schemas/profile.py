"""Pydantic schemas for profile API."""
from datetime import datetime

from pydantic import BaseModel, Field


class ProfileResponse(BaseModel):
    id: str
    display_name: str
    email: str
    avatar_url: str | None
    role: str | None = None  # "standard" | "admin", for current user only
    session_inactivity_expires_at: datetime | None = None
    session_absolute_expires_at: datetime | None = None
    session_warning_seconds: int = 300


class PasswordUpdateRequest(BaseModel):
    current_password: str
    new_password: str = Field(..., min_length=8)
