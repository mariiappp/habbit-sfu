"""User streak persistence model."""
from datetime import date

from sqlalchemy import Date, ForeignKey, Index, Integer
from sqlalchemy.orm import Mapped, mapped_column

from app.domain.models import Base


class UserStreak(Base):
    """Stores daily streak information per user."""

    __tablename__ = "user_streaks"

    user_id: Mapped[int] = mapped_column(
        ForeignKey("users.id", ondelete="CASCADE"),
        unique=True,
        index=True,
        nullable=False,
    )
    current_streak: Mapped[int] = mapped_column(Integer, default=0, nullable=False)
    last_streak_date: Mapped[date | None] = mapped_column(Date, nullable=True)

    __table_args__ = (
        Index("ix_user_streaks_user_date", "user_id", "last_streak_date"),
    )

    def __repr__(self) -> str:
        return (
            f"<UserStreak(user_id={self.user_id}, "
            f"current_streak={self.current_streak}, "
            f"last_streak_date={self.last_streak_date})>"
        )
