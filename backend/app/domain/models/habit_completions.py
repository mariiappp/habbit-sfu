"""Habit completion tracking model."""
from datetime import datetime
from sqlalchemy import ForeignKey, String, Index, func
from sqlalchemy.orm import Mapped, mapped_column

from app.domain.models import Base


class HabitCompletion(Base):
    """Tracks individual completion events for user habits."""
    __tablename__ = "habit_completions"

    # Foreign keys with cascade delete
    habit_id: Mapped[int] = mapped_column(
        ForeignKey("habits.id", ondelete="CASCADE"),
        nullable=False, index=True
    )
    user_id: Mapped[int] = mapped_column(
        ForeignKey("users.id", ondelete="CASCADE"),
        nullable=False, index=True
    )

    # Completion metadata
    completed_at: Mapped[datetime] = mapped_column(
        server_default=func.now(), nullable=False, index=True
    )
    note: Mapped[str | None] = mapped_column(String(500), nullable=True)

    # Composite index for fast streak/history queries
    __table_args__ = (
        Index("ix_habit_completions_habit_date", "habit_id", "completed_at"),
    )

    def __repr__(self) -> str:
        return (
            f"<HabitCompletion(id={self.id}, habit_id={self.habit_id}, "
            f"completed_at={self.completed_at.isoformat()})>"
        )