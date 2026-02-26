"""Profile routes: GET /me/profile, PATCH /me/password, POST/DELETE /me/avatar."""
from pathlib import Path
from uuid import UUID

from fastapi import APIRouter, Depends, File, HTTPException, Request, status, UploadFile
from fastapi.responses import FileResponse, Response
from sqlalchemy import select, and_
from sqlalchemy.ext.asyncio import AsyncSession

from core.auth import get_current_user
from core.database import get_db
from models.avatar import Avatar
from models.user import User
from schemas.profile import PasswordUpdateRequest, ProfileResponse
from services.auth_service import change_password
from services.avatar_service import upload_avatar, remove_avatar
from services.profile_service import get_profile_for_response

router = APIRouter(prefix="/me", tags=["profile"])


@router.get("/profile", response_model=ProfileResponse)
async def get_my_profile(
    request: Request,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
) -> ProfileResponse:
    data = await get_profile_for_response(db, current_user, str(request.base_url))
    return ProfileResponse(**data)


@router.patch("/password", status_code=status.HTTP_204_NO_CONTENT)
async def update_password(
    body: PasswordUpdateRequest,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
) -> Response:
    ok = await change_password(
        db, current_user.id, body.current_password, body.new_password
    )
    if not ok:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Current password incorrect",
        )
    return Response(status_code=status.HTTP_204_NO_CONTENT)


@router.post("/avatar", status_code=status.HTTP_201_CREATED)
async def post_avatar(
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
    file: UploadFile = File(...),
) -> dict:
    if not file.content_type or not file.content_type.startswith("image/"):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Unsupported format",
        )
    content = await file.read()
    try:
        avatar = await upload_avatar(
            db, current_user, content, file.content_type, file.filename or "image"
        )
    except ValueError as e:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(e))
    return {
        "id": str(avatar.id),
        "content_type": avatar.content_type,
        "url": f"/me/avatar/{avatar.id}/image",
    }


@router.delete("/avatar", status_code=status.HTTP_204_NO_CONTENT)
async def delete_avatar(
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
) -> Response:
    await remove_avatar(db, current_user)
    return Response(status_code=status.HTTP_204_NO_CONTENT)


@router.get("/avatar/{avatar_id}/image")
async def get_avatar_image(
    avatar_id: str,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
) -> FileResponse:
    try:
        uid = UUID(avatar_id)
    except ValueError:
        raise HTTPException(status_code=404, detail="Not found")
    result = await db.execute(
        select(Avatar).where(and_(Avatar.id == uid, Avatar.user_id == current_user.id))
    )
    av = result.scalar_one_or_none()
    if not av or not Path(av.storage_path).exists():
        raise HTTPException(status_code=404, detail="Not found")
    return FileResponse(av.storage_path, media_type=av.content_type)
