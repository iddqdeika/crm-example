"""Dashboard API: GET /api/dashboard/counts (feature 016)."""
from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession

from core.auth import get_current_user
from core.database import get_db
from models.user import User
from services.dashboard_service import get_dashboard_counts

router = APIRouter(prefix="/dashboard", tags=["dashboard"])


@router.get("/counts")
async def get_counts(
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> dict[str, int]:
    """Return role-based counts (campaigns, drafts, published, users). Only keys for current role are present."""
    counts = await get_dashboard_counts(db, current_user.id, current_user.role)
    return counts
