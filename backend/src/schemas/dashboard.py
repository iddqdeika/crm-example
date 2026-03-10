"""Dashboard API schemas (feature 016)."""
from pydantic import BaseModel, Field


class DashboardCountsResponse(BaseModel):
    """Role-based counts; only keys relevant to the current user role are present."""

    campaigns: int | None = Field(None, description="Count of campaigns (buyer: own; admin: all)")
    drafts: int | None = Field(None, description="Count of blog posts with status draft")
    published: int | None = Field(None, description="Count of blog posts with status published")
    users: int | None = Field(None, description="Count of user accounts (admin only)")

    model_config = {"extra": "forbid"}
