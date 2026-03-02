"""Create creatives table.

Revision ID: 20260227_006
Revises: 20260227_005
Create Date: 2026-02-27
"""
from typing import Sequence, Union

from alembic import op

revision: str = "20260227_006"
down_revision: Union[str, None] = "20260227_005"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.execute("""
        CREATE TABLE IF NOT EXISTS creatives (
            id UUID NOT NULL,
            ad_group_id UUID NOT NULL REFERENCES ad_groups(id) ON DELETE CASCADE,
            name VARCHAR(255) NOT NULL,
            ad_type VARCHAR(64) NOT NULL,
            click_url VARCHAR(2048),
            icon_storage_path VARCHAR(512),
            image_storage_path VARCHAR(512),
            sort_order INTEGER NOT NULL DEFAULT 0,
            created_at TIMESTAMP NOT NULL DEFAULT now(),
            updated_at TIMESTAMP NOT NULL DEFAULT now(),
            PRIMARY KEY (id)
        );
    """)
    op.execute("CREATE INDEX IF NOT EXISTS ix_creatives_ad_group_id ON creatives (ad_group_id);")


def downgrade() -> None:
    op.drop_index("ix_creatives_ad_group_id", "creatives")
    op.drop_table("creatives")
