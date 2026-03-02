"""Create campaigns table.

Revision ID: 20260227_004
Revises: 20260227_003
Create Date: 2026-02-27

Idempotent: safe to run after a previous failed migration (enum or table may already exist).
"""
from typing import Sequence, Union

from alembic import op

revision: str = "20260227_004"
down_revision: Union[str, None] = "20260227_003"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    # Enum: create only if not present (handles previous failed run that created enum then failed)
    op.execute("""
        DO $$
        BEGIN
            IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'campaignstatus') THEN
                CREATE TYPE campaignstatus AS ENUM ('active', 'pause', 'archive');
            END IF;
        END
        $$;
    """)
    # Table: raw SQL so we never trigger SQLAlchemy's CREATE TYPE; IF NOT EXISTS for idempotence
    op.execute("""
        CREATE TABLE IF NOT EXISTS campaigns (
            id UUID NOT NULL,
            name VARCHAR(255) NOT NULL,
            budget NUMERIC(15, 2) NOT NULL,
            status campaignstatus NOT NULL,
            owner_id UUID NOT NULL REFERENCES users(id) ON DELETE RESTRICT,
            version INTEGER NOT NULL DEFAULT 1,
            created_at TIMESTAMP NOT NULL DEFAULT now(),
            updated_at TIMESTAMP NOT NULL DEFAULT now(),
            PRIMARY KEY (id)
        );
    """)
    # Indexes: IF NOT EXISTS for idempotence
    op.execute("CREATE INDEX IF NOT EXISTS ix_campaigns_owner_id ON campaigns (owner_id);")
    op.execute("CREATE INDEX IF NOT EXISTS ix_campaigns_status ON campaigns (status);")


def downgrade() -> None:
    op.drop_index("ix_campaigns_status", "campaigns")
    op.drop_index("ix_campaigns_owner_id", "campaigns")
    op.drop_table("campaigns")
    op.execute("DROP TYPE campaignstatus")
