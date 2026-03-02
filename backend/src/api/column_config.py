"""Column configuration API — GET/PUT per user/context."""
from fastapi import APIRouter, Depends, HTTPException, Query, status
from pydantic import BaseModel, Field
from sqlalchemy.ext.asyncio import AsyncSession

from core.auth import get_current_user
from core.database import get_db
from models.user import User
from services.column_config_service import get_column_config, save_column_config

router = APIRouter(prefix="/me/column-config", tags=["column-config"])


class ColumnConfigResponse(BaseModel):
    context: str
    column_ids: list[str]


class ColumnConfigPut(BaseModel):
    context: str = Field(..., min_length=1)
    column_ids: list[str] = Field(..., min_length=1)


@router.get("", response_model=ColumnConfigResponse)
async def get_config(
    context: str = Query(..., min_length=1),
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> ColumnConfigResponse:
    cols = await get_column_config(db, current_user.id, context)
    return ColumnConfigResponse(context=context, column_ids=cols)


@router.put("", response_model=ColumnConfigResponse)
async def put_config(
    body: ColumnConfigPut,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> ColumnConfigResponse:
    try:
        cols = await save_column_config(db, current_user.id, body.context, body.column_ids)
    except ValueError as e:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(e)) from e
    return ColumnConfigResponse(context=body.context, column_ids=cols)
