"""Daily advice model for personalized user tips."""
from datetime import date
from sqlalchemy import String, ForeignKey, Index, UniqueConstraint
from sqlalchemy.orm import Mapped, mapped_column

from app.domain.models import Base


class DailyAdvice(Base):
    """Stores a unique daily advice/tip for each user."""
    __tablename__ = "daily_advice"

    user_id: Mapped[int] = mapped_column(
        ForeignKey("users.id", ondelete="CASCADE"),
        nullable=False, index=True,
        comment="Owner of this advice record"
    )
    advice_date: Mapped[date] = mapped_column(
        nullable=False, index=True,
        comment="Date this advice applies to (YYYY-MM-DD)"
    )
    content: Mapped[str] = mapped_column(
        String(1000), nullable=False,
        comment="Personalized advice text"
    )

    __table_args__ = (
        # Hard guarantee: max 1 advice per user per day
        UniqueConstraint("user_id", "advice_date", name="uq_daily_advice_user_date"),
        # Optimized lookups for calendar/history queries
        Index("ix_daily_advice_user_date", "user_id", "advice_date"),
    )

    def __repr__(self) -> str:
        return f"<DailyAdvice(id={self.id}, user_id={self.user_id}, date={self.advice_date})>"