"""Add content_manager role and create blog_posts table.

Revision ID: 20260302_001
Revises: 20260227_007
Create Date: 2026-03-02

"""
from typing import Sequence, Union

import sqlalchemy as sa
from alembic import op

revision: str = "20260302_001"
down_revision: Union[str, None] = "20260227_007"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    # Add content_manager to the userrole enum.
    # ALTER TYPE ... ADD VALUE must run outside a transaction in PostgreSQL.
    with op.get_context().autocommit_block():
        op.execute("ALTER TYPE userrole ADD VALUE IF NOT EXISTS 'content_manager'")

    op.create_table(
        "blog_posts",
        sa.Column("id", sa.UUID(), nullable=False),
        sa.Column("title", sa.String(255), nullable=False),
        sa.Column("body", sa.Text(), nullable=False),
        sa.Column("author", sa.String(255), nullable=True),
        sa.Column("creator_id", sa.UUID(), nullable=False),
        sa.Column("created_at", sa.DateTime(), nullable=False, server_default=sa.func.now()),
        sa.Column("updated_at", sa.DateTime(), nullable=False, server_default=sa.func.now()),
        sa.ForeignKeyConstraint(["creator_id"], ["users.id"], ondelete="RESTRICT"),
        sa.PrimaryKeyConstraint("id"),
    )
    op.create_index("idx_blog_posts_created_at", "blog_posts", ["created_at"])
    op.create_index("idx_blog_posts_creator_id", "blog_posts", ["creator_id"])


def downgrade() -> None:
    op.drop_index("idx_blog_posts_creator_id", table_name="blog_posts")
    op.drop_index("idx_blog_posts_created_at", table_name="blog_posts")
    op.drop_table("blog_posts")
    # PostgreSQL does not support removing enum values; leave content_manager in enum.
