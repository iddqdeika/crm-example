"""Add slug, status, seo_title, meta_description to blog_posts; create blog_slug_history.

Revision ID: 20260302_002
Revises: 20260302_001
Create Date: 2026-03-02

"""
from typing import Sequence, Union

import sqlalchemy as sa
from alembic import op

revision: str = "20260302_002"
down_revision: Union[str, None] = "20260302_001"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.add_column("blog_posts", sa.Column("slug", sa.String(100), nullable=True))
    op.add_column(
        "blog_posts",
        sa.Column("status", sa.String(20), nullable=False, server_default="published"),
    )
    op.add_column("blog_posts", sa.Column("seo_title", sa.String(60), nullable=True))
    op.add_column("blog_posts", sa.Column("meta_description", sa.String(160), nullable=True))

    op.create_table(
        "blog_slug_history",
        sa.Column("id", sa.UUID(), nullable=False),
        sa.Column("blog_post_id", sa.UUID(), nullable=False),
        sa.Column("slug", sa.String(100), nullable=False),
        sa.Column("created_at", sa.DateTime(), nullable=False, server_default=sa.func.now()),
        sa.ForeignKeyConstraint(["blog_post_id"], ["blog_posts.id"], ondelete="CASCADE"),
        sa.PrimaryKeyConstraint("id"),
    )
    op.create_index(
        "ix_blog_slug_history_slug",
        "blog_slug_history",
        ["slug"],
        unique=True,
    )
    op.create_index(
        "ix_blog_slug_history_blog_post_id",
        "blog_slug_history",
        ["blog_post_id"],
    )

    # Partial unique index: slug unique only among published posts
    with op.get_context().autocommit_block():
        op.execute(
            """
            CREATE UNIQUE INDEX ix_blog_posts_slug_published
            ON blog_posts (slug)
            WHERE status = 'published'
            """
        )


def downgrade() -> None:
    with op.get_context().autocommit_block():
        op.execute("DROP INDEX IF EXISTS ix_blog_posts_slug_published")
    op.drop_index("ix_blog_slug_history_blog_post_id", table_name="blog_slug_history")
    op.drop_index("ix_blog_slug_history_slug", table_name="blog_slug_history")
    op.drop_table("blog_slug_history")
    op.drop_column("blog_posts", "meta_description")
    op.drop_column("blog_posts", "seo_title")
    op.drop_column("blog_posts", "status")
    op.drop_column("blog_posts", "slug")
