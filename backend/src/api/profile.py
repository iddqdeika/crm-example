"""Profile routes: GET /me/profile, PATCH /me/password, POST/DELETE /me/avatar."""
from fastapi import APIRouter, Depends, File, HTTPException, Request, Response, status, UploadFile
from sqlalchemy.ext.asyncio import AsyncSession

from core.auth import get_current_session, get_current_user
from core.database import get_db
from core.session_cache import SessionCache, get_session_cache
from core.settings import Settings, get_settings
from core.storage import StorageClient, StorageError, get_storage_client
from models.session import AuthenticationSession
from models.user import User
from schemas.profile import PasswordUpdateRequest, ProfileResponse
from services.auth_service import change_password, touch_session
from services.avatar_service import upload_avatar, remove_avatar
from services.profile_service import get_profile_for_response

router = APIRouter(prefix="/me", tags=["profile"])


@router.get("/profile", response_model=ProfileResponse)
async def get_my_profile(
    request: Request,
    session: AuthenticationSession = Depends(get_current_session),
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
    storage: StorageClient = Depends(get_storage_client),
    settings: Settings = Depends(get_settings),
) -> ProfileResponse:
    data = await get_profile_for_response(db, current_user, storage=storage, session=session, settings=settings)
    return ProfileResponse(**data)


@router.post("/session/touch")
async def session_touch(
    session: AuthenticationSession = Depends(get_current_session),
    cache: SessionCache = Depends(get_session_cache),
    settings: Settings = Depends(get_settings),
) -> dict:
    new_exp = await touch_session(session, cache, settings=settings)
    return {"inactivity_expires_at": new_exp.isoformat() + "Z"}


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
    storage: StorageClient = Depends(get_storage_client),
    file: UploadFile = File(...),
) -> dict:
    if not file.content_type or not file.content_type.startswith("image/"):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Unsupported image type. Allowed: JPEG, PNG, GIF, WebP.",
        )
    content = await file.read()
    try:
        avatar = await upload_avatar(
            db,
            current_user,
            content,
            file.content_type,
            file.filename or "image",
            storage_client=storage,
        )
    except ValueError as e:
        msg = str(e)
        if "too large" in msg.lower():
            detail = "File too large. Maximum allowed size is 5 MB."
        else:
            detail = "Unsupported image type. Allowed: JPEG, PNG, GIF, WebP."
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=detail)
    except StorageError:
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail="Storage service unavailable. Please try again.",
        )

    avatar_url = await storage.get_presigned_url(avatar.storage_path)
    return {
        "id": str(avatar.id),
        "avatar_url": avatar_url,
        "content_type": avatar.content_type,
        "file_size_bytes": avatar.file_size_bytes,
    }


@router.delete("/avatar", status_code=status.HTTP_204_NO_CONTENT)
async def delete_avatar(
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
    storage: StorageClient = Depends(get_storage_client),
) -> Response:
    await remove_avatar(db, current_user, storage_client=storage)
    return Response(status_code=status.HTTP_204_NO_CONTENT)
