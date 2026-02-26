"""Auth routes: signup, login, logout."""
from fastapi import APIRouter, Depends, HTTPException, Request, status
from fastapi.responses import JSONResponse, Response
from sqlalchemy.ext.asyncio import AsyncSession

from core.auth import get_current_session
from core.database import get_db
from core.settings import get_settings
from models.session import AuthenticationSession
from models.user import User
from schemas.auth import LoginRequest, SignUpRequest
from services.auth_service import (
    authenticate_user,
    create_session,
    create_user,
    get_user_by_email,
    revoke_session,
)

router = APIRouter(prefix="/auth", tags=["auth"])
_settings = get_settings()


def _set_session_cookie(response: JSONResponse, session_id: str) -> None:
    response.set_cookie(
        key=_settings.session_cookie_name,
        value=session_id,
        httponly=True,
        secure=_settings.app_env == "production",
        samesite="lax",
        max_age=_settings.session_ttl_seconds,
    )


@router.post("/signup")
async def signup(
    body: SignUpRequest,
    request: Request,
    db: AsyncSession = Depends(get_db),
) -> JSONResponse:
    existing = await get_user_by_email(db, body.email)
    if existing:
        raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail="Email already in use")
    user = await create_user(db, body.email, body.password, body.display_name)
    session = await create_session(
        db,
        user.id,
        ip_address=request.client.host if request.client else None,
        user_agent=request.headers.get("user-agent"),
    )
    res = JSONResponse(content={"message": "User created"}, status_code=status.HTTP_201_CREATED)
    _set_session_cookie(res, str(session.id))
    return res


@router.post("/login")
async def login(
    body: LoginRequest,
    request: Request,
    db: AsyncSession = Depends(get_db),
) -> JSONResponse:
    user = await authenticate_user(db, body.email, body.password)
    if not user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid credentials",
        )
    session = await create_session(
        db,
        user.id,
        ip_address=request.client.host if request.client else None,
        user_agent=request.headers.get("user-agent"),
    )
    res = JSONResponse(content={"message": "OK"}, status_code=status.HTTP_200_OK)
    _set_session_cookie(res, str(session.id))
    return res


@router.post("/logout", status_code=status.HTTP_204_NO_CONTENT)
async def logout(
    session: AuthenticationSession = Depends(get_current_session),
    db: AsyncSession = Depends(get_db),
) -> Response:
    await revoke_session(db, session.id)
    res = Response(status_code=status.HTTP_204_NO_CONTENT)
    res.delete_cookie(key=_settings.session_cookie_name)
    return res
