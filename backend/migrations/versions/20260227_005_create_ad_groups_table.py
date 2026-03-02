"""Create ad_groups table.

Revision ID: 20260227_005
Revises: 20260227_004
Create Date: 2026-02-27

"""
from typing import Sequence, Union

from alembic import op

revision: str = "20260227_005"
down_revision: Union[str, None] = "20260227_004"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.execute("""
        CREATE TABLE IF NOT EXISTS ad_groups (
            id UUID NOT NULL,
            campaign_id UUID NOT NULL REFERENCES campaigns(id) ON DELETE CASCADE,
            country_targets TEXT,
            platform_targets TEXT,
            browser_targets TEXT,
            timezone_targets TEXT,
            ssp_id_whitelist TEXT,
            ssp_id_blacklist TEXT,
            source_id_whitelist TEXT,
            source_id_blacklist TEXT,
            sort_order INTEGER NOT NULL DEFAULT 0,
            created_at TIMESTAMP NOT NULL DEFAULT now(),
            updated_at TIMESTAMP NOT NULL DEFAULT now(),
            PRIMARY KEY (id)
        );
    """)
    op.execute("CREATE INDEX IF NOT EXISTS ix_ad_groups_campaign_id ON ad_groups (campaign_id);")


def downgrade() -> None:
    op.drop_index("ix_ad_groups_campaign_id", "ad_groups")
    op.drop_table("ad_groups")
