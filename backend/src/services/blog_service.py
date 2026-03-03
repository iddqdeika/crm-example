"""CRUD service for blog posts."""
import uuid
from datetime import datetime

from fastapi import HTTPException, status
from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from core.slug import is_valid_slug, slugify
from models.blog_post import BlogPost
from models.blog_slug_history import BlogSlugHistory
from schemas.blog import (
    BlogPostCreate,
    BlogPostListResponse,
    BlogPostResponse,
    BlogPostSummary,
    BlogPostUpdate,
    _excerpt,
)


def _build_response(post: BlogPost) -> BlogPostResponse:
    creator_name = post.creator.display_name if post.creator else ""
    author_display = post.author if post.author else creator_name
    is_edited = post.updated_at != post.created_at
    return BlogPostResponse(
        id=post.id,
        title=post.title,
        body=post.body,
        author_display=author_display,
        creator_id=post.creator_id,
        creator_display_name=creator_name,
        created_at=post.created_at,
        updated_at=post.updated_at,
        is_edited=is_edited,
        slug=getattr(post, "slug", None),
        status=getattr(post, "status", "draft"),
        seo_title=getattr(post, "seo_title", None),
        meta_description=getattr(post, "meta_description", None),
    )


def _build_summary(post: BlogPost) -> BlogPostSummary:
    creator_name = post.creator.display_name if post.creator else ""
    author_display = post.author if post.author else creator_name
    is_edited = post.updated_at != post.created_at
    return BlogPostSummary(
        id=post.id,
        title=post.title,
        body_excerpt=_excerpt(post.body),
        author_display=author_display,
        created_at=post.created_at,
        updated_at=post.updated_at,
        is_edited=is_edited,
        slug=getattr(post, "slug", None),
        status=getattr(post, "status", "draft"),
    )


async def list_posts(
    db: AsyncSession,
    limit: int = 20,
    page: int = 1,
    search: str | None = None,
    sort_by: str | None = None,
    sort_dir: str | None = None,
    public_only: bool = False,
) -> BlogPostListResponse:
    offset = (page - 1) * limit

    stmt = select(BlogPost).options(selectinload(BlogPost.creator))

    if public_only:
        stmt = stmt.where(BlogPost.status == "published")

    if search:
        term = f"%{search}%"
        from sqlalchemy import or_
        stmt = stmt.where(
            or_(
                BlogPost.title.ilike(term),
                BlogPost.body.ilike(term),
            )
        )

    if sort_by == "title":
        col = BlogPost.title
    else:
        col = BlogPost.created_at

    if sort_dir == "asc":
        stmt = stmt.order_by(col.asc())
    else:
        stmt = stmt.order_by(col.desc())

    count_stmt = select(func.count()).select_from(stmt.subquery())
    total_result = await db.execute(count_stmt)
    total = total_result.scalar_one()

    stmt = stmt.offset(offset).limit(limit)
    result = await db.execute(stmt)
    posts = result.scalars().all()

    return BlogPostListResponse(
        items=[_build_summary(p) for p in posts],
        total=total,
    )


async def check_slug_available(
    db: AsyncSession,
    slug: str,
    *,
    exclude_post_id: uuid.UUID | None = None,
) -> bool:
    """Return True if slug is not used by any published post (or only by exclude_post_id)."""
    slug_val = slug.strip().lower()
    if not is_valid_slug(slug_val):
        return False
    stmt = select(BlogPost.id).where(
        BlogPost.status == "published",
        BlogPost.slug == slug_val,
    )
    if exclude_post_id is not None:
        stmt = stmt.where(BlogPost.id != exclude_post_id)
    result = await db.execute(stmt.limit(1))
    return result.scalar_one_or_none() is None


async def get_post_by_slug(
    db: AsyncSession,
    slug: str,
) -> tuple[BlogPostResponse | None, str | None]:
    """
    Resolve post by slug. Returns (response, None) for 200, (None, redirect_slug) for 301, or raise 404.
    """
    slug_val = slug.strip().lower()
    if not slug_val:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Post not found")

    # 1) Published post with this slug
    result = await db.execute(
        select(BlogPost)
        .options(selectinload(BlogPost.creator))
        .where(BlogPost.slug == slug_val, BlogPost.status == "published")
    )
    post = result.scalar_one_or_none()
    if post:
        return _build_response(post), None

    # 2) Slug in history -> 301 to current slug
    result = await db.execute(
        select(BlogSlugHistory)
        .options(selectinload(BlogSlugHistory.blog_post).selectinload(BlogPost.creator))
        .where(BlogSlugHistory.slug == slug_val)
    )
    history_row = result.scalar_one_or_none()
    if history_row and history_row.blog_post and history_row.blog_post.status == "published":
        return None, history_row.blog_post.slug or ""

    raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Post not found")


async def get_post(
    db: AsyncSession,
    post_id: uuid.UUID,
    *,
    require_published_or_authenticated: bool = False,
) -> BlogPostResponse:
    result = await db.execute(
        select(BlogPost)
        .options(selectinload(BlogPost.creator))
        .where(BlogPost.id == post_id)
    )
    post = result.scalar_one_or_none()
    if not post:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Blog post not found")
    if require_published_or_authenticated and post.status != "published":
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Blog post not found")
    return _build_response(post)


async def create_post(
    db: AsyncSession,
    creator_id: uuid.UUID,
    body: BlogPostCreate,
    search_service=None,
) -> BlogPostResponse:
    now = datetime.utcnow()
    slug_value = (body.slug or slugify(body.title) or "post").strip().lower()
    if not is_valid_slug(slug_value):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Slug must contain only lowercase letters, numbers, and hyphens (e.g. my-post-title)",
        )
    if body.status == "published":
        available = await check_slug_available(db, slug_value)
        if not available:
            raise HTTPException(
                status_code=status.HTTP_409_CONFLICT,
                detail="This URL slug is already used by another published post.",
            )
    post = BlogPost(
        title=body.title,
        body=body.body,
        author=body.author,
        creator_id=creator_id,
        created_at=now,
        updated_at=now,
        slug=slug_value,
        status=body.status,
        seo_title=body.seo_title,
        meta_description=body.meta_description,
    )
    db.add(post)
    await db.flush()
    await db.refresh(post, ["creator"])

    if search_service is not None and body.status == "published":
        creator_name = post.creator.display_name if post.creator else ""
        search_service.upsert(post, creator_name)

    return _build_response(post)


async def update_post(
    db: AsyncSession,
    post_id: uuid.UUID,
    body: BlogPostUpdate,
    search_service=None,
) -> BlogPostResponse:
    result = await db.execute(
        select(BlogPost)
        .options(selectinload(BlogPost.creator))
        .where(BlogPost.id == post_id)
    )
    post = result.scalar_one_or_none()
    if not post:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Blog post not found")

    if body.title is not None:
        post.title = body.title
    if body.body is not None:
        post.body = body.body
    if "author" in body.model_fields_set:
        post.author = body.author
    if body.slug is not None:
        slug_value = body.slug.strip().lower()
        if not is_valid_slug(slug_value):
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Slug must contain only lowercase letters, numbers, and hyphens (e.g. my-post-title)",
            )
        if post.slug and post.slug != slug_value and post.status == "published":
            # Store old slug for 301 redirects
            history = BlogSlugHistory(blog_post_id=post.id, slug=post.slug)
            db.add(history)
        post.slug = slug_value
    if body.status is not None:
        post.status = body.status

    # Enforce slug uniqueness for published posts
    if post.status == "published" and post.slug:
        available = await check_slug_available(db, post.slug, exclude_post_id=post.id)
        if not available:
            raise HTTPException(
                status_code=status.HTTP_409_CONFLICT,
                detail="This URL slug is already used by another published post.",
            )
    if body.seo_title is not None:
        post.seo_title = body.seo_title
    if body.meta_description is not None:
        post.meta_description = body.meta_description
    post.updated_at = datetime.utcnow()

    await db.flush()

    if search_service is not None:
        if post.status == "published":
            creator_name = post.creator.display_name if post.creator else ""
            search_service.upsert(post, creator_name)
        else:
            search_service.delete(post.id)

    return _build_response(post)


async def delete_post(
    db: AsyncSession,
    post_id: uuid.UUID,
    search_service=None,
) -> None:
    result = await db.execute(select(BlogPost).where(BlogPost.id == post_id))
    post = result.scalar_one_or_none()
    if not post:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Blog post not found")

    await db.delete(post)
    await db.flush()

    if search_service is not None:
        search_service.delete(post_id)


async def rebuild_search_index(db: AsyncSession, search_service) -> int:
    """Clear Meilisearch blog_posts index and re-index all published posts. Returns count indexed."""
    search_service.delete_all_documents()
    result = await db.execute(
        select(BlogPost)
        .options(selectinload(BlogPost.creator))
        .where(BlogPost.status == "published")
    )
    posts = result.scalars().all()
    for post in posts:
        creator_name = post.creator.display_name if post.creator else ""
        search_service.upsert(post, creator_name)
    return len(posts)
