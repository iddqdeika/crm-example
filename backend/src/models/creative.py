"""Creative model."""
import uuid
from datetime import datetime

from sqlalchemy import DateTime, ForeignKey, Integer, String
from sqlalchemy.orm import Mapped, mapped_column, relationship

from .base import Base

ALLOWED_AD_TYPES = {"banner", "native", "video"}


class Creative(Base):
    __tablename__ = "creatives"

    id: Mapped[uuid.UUID] = mapped_column(primary_key=True, default=uuid.uuid4)
    ad_group_id: Mapped[uuid.UUID] = mapped_column(
        ForeignKey("ad_groups.id", ondelete="CASCADE"), nullable=False
    )
    name: Mapped[str] = mapped_column(String(255), nullable=False)
    ad_type: Mapped[str] = mapped_column(String(64), nullable=False)
    click_url: Mapped[str | None] = mapped_column(String(2048), nullable=True)
    icon_storage_path: Mapped[str | None] = mapped_column(String(512), nullable=True)
    image_storage_path: Mapped[str | None] = mapped_column(String(512), nullable=True)
    sort_order: Mapped[int] = mapped_column(Integer, nullable=False, default=0)
    created_at: Mapped[datetime] = mapped_column(DateTime, nullable=False, default=datetime.utcnow)
    updated_at: Mapped[datetime] = mapped_column(
        DateTime, nullable=False, default=datetime.utcnow, onupdate=datetime.utcnow
    )

    ad_group = relationship("AdGroup", back_populates="creatives")
