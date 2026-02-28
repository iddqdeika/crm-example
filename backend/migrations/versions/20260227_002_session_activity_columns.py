"""Add absolute_expires_at and last_active_at columns to authentication_sessions.

Revision ID: 20260227_002
Revises: 20260226_001
Create Date: 2026-02-27

"""
from typing import Sequence, Union

import sqlalchemy as sa
from alembic import op

revision: str = "20260227_002"
down_revision: Union[str, None] = "20260226_002"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.add_column(
        "authentication_sessions",
        sa.Column(
            "absolute_expires_at",
            sa.DateTime(),
            nullable=False,
            server_default=sa.text("NOW() + INTERVAL '8 hours'"),
        ),
    )
    op.add_column(
        "authentication_sessions",
        sa.Column("last_active_at", sa.DateTime(), nullable=True),
    )
    op.create_index(
        "ix_authentication_sessions_expires_at",
        "authentication_sessions",
        ["expires_at"],
    )
    op.create_index(
        "ix_authentication_sessions_absolute_expires_at",
        "authentication_sessions",
        ["absolute_expires_at"],
    )


def downgrade() -> None:
    op.drop_index("ix_authentication_sessions_absolute_expires_at", "authentication_sessions")
    op.drop_index("ix_authentication_sessions_expires_at", "authentication_sessions")
    op.drop_column("authentication_sessions", "last_active_at")
    op.drop_column("authentication_sessions", "absolute_expires_at")
