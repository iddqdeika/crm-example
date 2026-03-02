"""Create column_configurations table.

Revision ID: 20260227_007
Revises: 20260227_006
Create Date: 2026-02-27
"""
from typing import Sequence, Union

from alembic import op

revision: str = "20260227_007"
down_revision: Union[str, None] = "20260227_006"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.execute("""
        CREATE TABLE IF NOT EXISTS column_configurations (
            id UUID NOT NULL,
            user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
            context VARCHAR(64) NOT NULL,
            column_ids TEXT NOT NULL,
            updated_at TIMESTAMP NOT NULL DEFAULT now(),
            PRIMARY KEY (id),
            CONSTRAINT uq_column_config_user_context UNIQUE (user_id, context)
        );
    """)
    op.execute("CREATE INDEX IF NOT EXISTS ix_column_config_user ON column_configurations (user_id);")


def downgrade() -> None:
    op.drop_index("ix_column_config_user", "column_configurations")
    op.drop_table("column_configurations")
