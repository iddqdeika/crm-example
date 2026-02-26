"""Pydantic schemas for profile API."""
from pydantic import BaseModel, Field


class ProfileResponse(BaseModel):
    id: str
    display_name: str
    email: str
    avatar_url: str | None
    role: str | None = None  # "standard" | "admin", for current user only


class PasswordUpdateRequest(BaseModel):
    current_password: str
    new_password: str = Field(..., min_length=8)
