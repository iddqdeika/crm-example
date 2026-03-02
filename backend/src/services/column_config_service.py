"""Column configuration service — CRUD per user/context."""
import json
from uuid import UUID

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from models.column_config import ColumnConfiguration

DEFAULT_CAMPAIGN_COLUMNS = ["name", "budget", "status", "owner", "created_at", "updated_at"]


async def get_column_config(
    db: AsyncSession,
    user_id: UUID,
    context: str,
) -> list[str]:
    result = await db.execute(
        select(ColumnConfiguration).where(
            ColumnConfiguration.user_id == user_id,
            ColumnConfiguration.context == context,
        )
    )
    config = result.scalar_one_or_none()
    if config is None:
        if context == "campaigns":
            return list(DEFAULT_CAMPAIGN_COLUMNS)
        return []
    return json.loads(config.column_ids)


async def save_column_config(
    db: AsyncSession,
    user_id: UUID,
    context: str,
    column_ids: list[str],
) -> list[str]:
    if not column_ids:
        raise ValueError("At least one column is required")
    result = await db.execute(
        select(ColumnConfiguration).where(
            ColumnConfiguration.user_id == user_id,
            ColumnConfiguration.context == context,
        )
    )
    config = result.scalar_one_or_none()
    serialized = json.dumps(column_ids)
    if config is None:
        config = ColumnConfiguration(
            user_id=user_id,
            context=context,
            column_ids=serialized,
        )
        db.add(config)
    else:
        config.column_ids = serialized
    await db.flush()
    return column_ids
