"""Admin routes: list users, get/update user. Admin role required."""
from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException, Query, status
from fastapi.responses import Response
from sqlalchemy import select, func
from sqlalchemy.ext.asyncio import AsyncSession

from core.auth import get_current_user
from core.database import get_db
from models.user import User, UserRole
from schemas.admin import (
    AdminUserListResponse,
    AdminUserResponse,
    AdminUserSummary,
    AdminUserUpdateRequest,
)

router = APIRouter(prefix="/admin", tags=["admin"])


def require_admin(current_user: User = Depends(get_current_user)) -> User:
    if current_user.role != UserRole.admin:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Admin role required",
        )
    return current_user


@router.get("/users", response_model=AdminUserListResponse)
async def list_users(
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_admin),
    page: int = Query(1, ge=1),
    page_size: int = Query(20, ge=1, le=100),
    email: str | None = Query(None),
) -> AdminUserListResponse:
    q = select(User)
    count_q = select(func.count()).select_from(User)
    if email:
        q = q.where(User.email.ilike(f"%{email}%"))
        count_q = count_q.where(User.email.ilike(f"%{email}%"))
    total_result = await db.execute(count_q)
    total = total_result.scalar() or 0
    q = q.offset((page - 1) * page_size).limit(page_size).order_by(User.email)
    result = await db.execute(q)
    users = result.scalars().all()
    items = [
        {
            "id": str(u.id),
            "email": u.email,
            "display_name": u.display_name,
            "role": u.role.value,
            "is_active": u.is_active,
        }
        for u in users
    ]
    return AdminUserListResponse(
        items=[AdminUserSummary(**x) for x in items],
        total=total,
    )


@router.get("/users/{user_id}", response_model=AdminUserResponse)
async def get_user(
    user_id: UUID,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_admin),
) -> AdminUserResponse:
    result = await db.execute(select(User).where(User.id == user_id))
    user = result.scalar_one_or_none()
    if not user:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="User not found")
    return AdminUserResponse(
        id=str(user.id),
        email=user.email,
        display_name=user.display_name,
        role=user.role.value,
        is_active=user.is_active,
    )


@router.patch("/users/{user_id}", status_code=status.HTTP_204_NO_CONTENT)
async def update_user(
    user_id: UUID,
    body: AdminUserUpdateRequest,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_admin),
) -> Response:
    result = await db.execute(select(User).where(User.id == user_id))
    user = result.scalar_one_or_none()
    if not user:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="User not found")
    if body.role is not None:
        try:
            user.role = UserRole(body.role)
        except ValueError:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Invalid role",
            )
    if body.is_active is not None:
        user.is_active = body.is_active
    await db.flush()
    return Response(status_code=status.HTTP_204_NO_CONTENT)
