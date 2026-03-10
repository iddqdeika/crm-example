"""Dashboard counts aggregation (feature 016)."""
from uuid import UUID

from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession

from models.blog_post import BlogPost
from models.user import User, UserRole
from services.campaign_service import list_campaigns


async def get_dashboard_counts(db: AsyncSession, user_id: UUID, role: UserRole) -> dict[str, int]:
    """
    Return role-based counts. Only keys for the current role are included.
    - buyer: campaigns (own)
    - content_manager: drafts, published
    - admin: campaigns (all), drafts, published, users
    """
    result: dict[str, int] = {}
    is_admin = role == UserRole.admin

    if role == UserRole.buyer or role == UserRole.admin:
        _, total = await list_campaigns(
            db, user_id, is_admin=is_admin, page=1, page_size=1
        )
        result["campaigns"] = total

    if role == UserRole.content_manager or role == UserRole.admin:
        draft_q = select(func.count()).select_from(BlogPost).where(BlogPost.status == "draft")
        pub_q = select(func.count()).select_from(BlogPost).where(BlogPost.status == "published")
        draft_res = await db.execute(draft_q)
        pub_res = await db.execute(pub_q)
        result["drafts"] = draft_res.scalar_one() or 0
        result["published"] = pub_res.scalar_one() or 0

    if role == UserRole.admin:
        user_q = select(func.count()).select_from(User)
        user_res = await db.execute(user_q)
        result["users"] = user_res.scalar_one() or 0

    return result
