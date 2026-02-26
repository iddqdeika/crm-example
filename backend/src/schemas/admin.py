"""Pydantic schemas for admin API."""
from pydantic import BaseModel


class AdminUserSummary(BaseModel):
    id: str
    email: str
    display_name: str
    role: str
    is_active: bool


class AdminUserListResponse(BaseModel):
    items: list[AdminUserSummary]
    total: int


class AdminUserResponse(BaseModel):
    id: str
    email: str
    display_name: str
    role: str
    is_active: bool


class AdminUserUpdateRequest(BaseModel):
    role: str | None = None  # "standard" | "admin"
    is_active: bool | None = None
