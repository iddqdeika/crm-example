"""Blog API: public read endpoints + protected management endpoints."""
import uuid

from fastapi import APIRouter, Depends, HTTPException, Query, UploadFile, status
from fastapi.responses import RedirectResponse
from sqlalchemy.ext.asyncio import AsyncSession

from core.auth import get_current_user, get_optional_user
from core.database import get_db
from core.storage import StorageClient, get_storage_client
from models.user import User, UserRole
from schemas.blog import (
    BlogPostCreate,
    BlogPostListResponse,
    BlogPostResponse,
    BlogPostUpdate,
    BlogSearchListResponse,
)
from services import blog_service
from services.blog_search_service import BlogSearchService, get_search_service

router = APIRouter(prefix="/blog", tags=["blog"])

_ALLOWED_IMAGE_TYPES = {"image/jpeg", "image/png", "image/gif", "image/webp"}
_MAX_IMAGE_BYTES = 5 * 1024 * 1024
_EXT_MAP = {
    "image/jpeg": ".jpg",
    "image/png": ".png",
    "image/gif": ".gif",
    "image/webp": ".webp",
}


def _require_blog_role(user: User) -> None:
    if user.role not in (UserRole.content_manager, UserRole.admin):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Insufficient permissions",
        )


# ---------------------------------------------------------------------------
# Public read endpoints (no auth required)
# ---------------------------------------------------------------------------


@router.get("/posts", response_model=BlogPostListResponse | BlogSearchListResponse)
async def get_posts(
    q: str | None = Query(None, description="Fulltext search query (uses Meilisearch)"),
    search: str | None = Query(None, description="Management list keyword filter (ILIKE)"),
    sort_by: str | None = Query(None),
    sort_dir: str | None = Query(None),
    limit: int = Query(20, ge=1, le=100),
    page: int = Query(1, ge=1),
    db: AsyncSession = Depends(get_db),
    _current_user: User | None = Depends(get_optional_user),
    search_service: BlogSearchService = Depends(get_search_service),
) -> BlogPostListResponse | BlogSearchListResponse:
    if q:
        return search_service.search(q, limit=limit, page=page)
    public_only = _current_user is None
    return await blog_service.list_posts(
        db,
        limit=limit,
        page=page,
        search=search,
        sort_by=sort_by,
        sort_dir=sort_dir,
        public_only=public_only,
    )


@router.get("/posts/by-slug/{slug}", response_model=BlogPostResponse)
async def get_post_by_slug(
    slug: str,
    db: AsyncSession = Depends(get_db),
) -> BlogPostResponse | RedirectResponse:
    from services import blog_service as blog_svc
    try:
        response, redirect_slug = await blog_svc.get_post_by_slug(db, slug)
    except HTTPException:
        raise
    if redirect_slug:
        return RedirectResponse(
            url=f"/blog/post/{redirect_slug}",
            status_code=status.HTTP_301_MOVED_PERMANENTLY,
            headers={"X-Redirect-Slug": redirect_slug},
        )
    return response


@router.get("/posts/check-slug")
async def check_slug(
    slug: str = Query(..., min_length=1, max_length=100),
    exclude_post_id: uuid.UUID | None = Query(None),
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> dict:
    _require_blog_role(current_user)
    from services import blog_service as blog_svc
    available = await blog_svc.check_slug_available(
        db, slug, exclude_post_id=exclude_post_id
    )
    return {"available": available, "message": None if available else "This URL is already taken"}


@router.get("/posts/{post_id}", response_model=BlogPostResponse)
async def get_post(
    post_id: uuid.UUID,
    db: AsyncSession = Depends(get_db),
    current_user: User | None = Depends(get_optional_user),
) -> BlogPostResponse:
    require_published = current_user is None
    return await blog_service.get_post(
        db, post_id, require_published_or_authenticated=require_published
    )


# ---------------------------------------------------------------------------
# Protected management endpoints
# ---------------------------------------------------------------------------


@router.post("/posts", response_model=BlogPostResponse, status_code=status.HTTP_201_CREATED)
async def create_post(
    body: BlogPostCreate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
    search_service: BlogSearchService = Depends(get_search_service),
) -> BlogPostResponse:
    _require_blog_role(current_user)
    return await blog_service.create_post(db, current_user.id, body, search_service)


@router.patch("/posts/{post_id}", response_model=BlogPostResponse)
async def update_post(
    post_id: uuid.UUID,
    body: BlogPostUpdate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
    search_service: BlogSearchService = Depends(get_search_service),
) -> BlogPostResponse:
    _require_blog_role(current_user)
    return await blog_service.update_post(db, post_id, body, search_service)


@router.delete("/posts/{post_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_post(
    post_id: uuid.UUID,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
    search_service: BlogSearchService = Depends(get_search_service),
) -> None:
    _require_blog_role(current_user)
    await blog_service.delete_post(db, post_id, search_service)


@router.post("/rebuild-index")
async def rebuild_blog_search_index(
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
    search_service: BlogSearchService = Depends(get_search_service),
) -> dict:
    """Clear and rebuild the blog search index from published posts. Requires content_manager or admin."""
    _require_blog_role(current_user)
    count = await blog_service.rebuild_search_index(db, search_service)
    return {"indexed": count}


@router.post("/images", status_code=status.HTTP_201_CREATED)
async def upload_image(
    file: UploadFile,
    current_user: User = Depends(get_current_user),
    storage: StorageClient = Depends(get_storage_client),
) -> dict:
    _require_blog_role(current_user)
    content_type = file.content_type or ""
    if content_type not in _ALLOWED_IMAGE_TYPES:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Unsupported file type. Allowed: jpeg, png, gif, webp",
        )
    data = await file.read()
    if len(data) > _MAX_IMAGE_BYTES:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="File exceeds maximum size of 5 MB",
        )
    from core.settings import get_settings

    ext = _EXT_MAP.get(content_type, ".bin")
    image_id = uuid.uuid4()
    key = f"blog-images/{image_id}{ext}"
    await storage.put_object(key, data, content_type)

    settings = get_settings()
    url = f"{settings.storage_public_url}/{settings.storage_bucket}/{key}"
    return {"url": url}
