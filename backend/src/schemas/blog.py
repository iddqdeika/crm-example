"""Pydantic schemas for blog posts."""
import re
import uuid
from datetime import datetime

from pydantic import BaseModel, ConfigDict, Field


def _strip_html(html: str) -> str:
    """Remove HTML tags and return plain text."""
    return re.sub(r"<[^>]+>", "", html)


def _excerpt(html: str, length: int = 200) -> str:
    plain = _strip_html(html).strip()
    if len(plain) <= length:
        return plain
    return plain[:length].rstrip() + "…"


class BlogPostCreate(BaseModel):
    title: str = Field(..., min_length=1, max_length=255)
    body: str = Field(..., min_length=1)
    author: str | None = Field(None, max_length=255)
    slug: str = Field(..., min_length=1, max_length=100)
    status: str = Field("draft", pattern="^(draft|published)$")
    seo_title: str | None = Field(None, max_length=60)
    meta_description: str | None = Field(None, max_length=160)


class BlogPostUpdate(BaseModel):
    title: str | None = Field(None, min_length=1, max_length=255)
    body: str | None = Field(None, min_length=1)
    author: str | None = Field(None, max_length=255)
    slug: str | None = Field(None, min_length=1, max_length=100)
    status: str | None = Field(None, pattern="^(draft|published)$")
    seo_title: str | None = Field(None, max_length=60)
    meta_description: str | None = Field(None, max_length=160)


class BlogPostResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: uuid.UUID
    title: str
    body: str
    author_display: str
    creator_id: uuid.UUID
    creator_display_name: str
    created_at: datetime
    updated_at: datetime
    is_edited: bool
    slug: str | None = None
    status: str = "draft"
    seo_title: str | None = None
    meta_description: str | None = None


class BlogPostSummary(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: uuid.UUID
    title: str
    body_excerpt: str
    author_display: str
    created_at: datetime
    updated_at: datetime
    is_edited: bool
    slug: str | None = None
    status: str = "draft"


class BlogPostListResponse(BaseModel):
    items: list[BlogPostSummary]
    total: int


class BlogSearchHit(BaseModel):
    id: str
    title: str
    body_snippet: str
    author_display: str
    created_at_ts: int
    is_search_result: bool = True
    slug: str = ""


class BlogSearchListResponse(BaseModel):
    items: list[BlogSearchHit]
    total: int
