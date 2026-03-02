"""Add buyer value to userrole enum.

Revision ID: 20260227_003
Revises: 20260227_002
Create Date: 2026-02-27

"""
from typing import Sequence, Union

from alembic import op

revision: str = "20260227_003"
down_revision: Union[str, None] = "20260227_002"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.execute("ALTER TYPE userrole ADD VALUE 'buyer'")


def downgrade() -> None:
    # PostgreSQL does not support removing an enum value; leave enum as-is.
    pass
