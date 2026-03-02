"""AdGroup model."""
import uuid
from datetime import datetime

from sqlalchemy import DateTime, ForeignKey, Integer, String, Text
from sqlalchemy.orm import Mapped, mapped_column, relationship

from .base import Base


class AdGroup(Base):
    __tablename__ = "ad_groups"

    id: Mapped[uuid.UUID] = mapped_column(primary_key=True, default=uuid.uuid4)
    campaign_id: Mapped[uuid.UUID] = mapped_column(
        ForeignKey("campaigns.id", ondelete="CASCADE"), nullable=False
    )
    country_targets: Mapped[str | None] = mapped_column(Text, nullable=True)
    platform_targets: Mapped[str | None] = mapped_column(Text, nullable=True)
    browser_targets: Mapped[str | None] = mapped_column(Text, nullable=True)
    timezone_targets: Mapped[str | None] = mapped_column(Text, nullable=True)
    ssp_id_whitelist: Mapped[str | None] = mapped_column(Text, nullable=True)
    ssp_id_blacklist: Mapped[str | None] = mapped_column(Text, nullable=True)
    source_id_whitelist: Mapped[str | None] = mapped_column(Text, nullable=True)
    source_id_blacklist: Mapped[str | None] = mapped_column(Text, nullable=True)
    sort_order: Mapped[int] = mapped_column(Integer, nullable=False, default=0)
    created_at: Mapped[datetime] = mapped_column(DateTime, nullable=False, default=datetime.utcnow)
    updated_at: Mapped[datetime] = mapped_column(
        DateTime, nullable=False, default=datetime.utcnow, onupdate=datetime.utcnow
    )

    campaign = relationship("Campaign", back_populates="ad_groups")
    creatives = relationship("Creative", back_populates="ad_group", cascade="all, delete-orphan")
