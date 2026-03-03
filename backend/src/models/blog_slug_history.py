"""SlugHistory model for 301 redirects from old slugs to current post slug."""
import uuid
from datetime import datetime

from sqlalchemy import DateTime, ForeignKey, String
from sqlalchemy.orm import Mapped, mapped_column, relationship

from .base import Base


class BlogSlugHistory(Base):
    __tablename__ = "blog_slug_history"

    id: Mapped[uuid.UUID] = mapped_column(primary_key=True, default=uuid.uuid4)
    blog_post_id: Mapped[uuid.UUID] = mapped_column(
        ForeignKey("blog_posts.id", ondelete="CASCADE"), nullable=False
    )
    slug: Mapped[str] = mapped_column(String(100), nullable=False, unique=True)
    created_at: Mapped[datetime] = mapped_column(
        DateTime, nullable=False, default=datetime.utcnow
    )

    blog_post = relationship("BlogPost", backref="slug_history")
