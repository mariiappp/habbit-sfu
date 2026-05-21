"""Task database model."""
from datetime import date

from sqlalchemy import Boolean, Date, ForeignKey, Index, String
from sqlalchemy.orm import Mapped, mapped_column

from app.domain.models import Base


class Task(Base):
    """User task entity for calendar planning."""

    __tablename__ = "tasks"

    user_id: Mapped[int] = mapped_column(
        ForeignKey("users.id", ondelete="CASCADE"),
        index=True,
        nullable=False,
    )

    title: Mapped[str] = mapped_column(String(200), nullable=False)
    task_type: Mapped[str | None] = mapped_column(String(120), nullable=True)
    subject: Mapped[str | None] = mapped_column(String(200), nullable=True)
    deadline: Mapped[date] = mapped_column(Date, nullable=False, index=True)
    link: Mapped[str | None] = mapped_column(String(1000), nullable=True)
    is_done: Mapped[bool] = mapped_column(Boolean, default=False, nullable=False)

    __table_args__ = (
        Index("ix_tasks_user_deadline", "user_id", "deadline"),
    )

    def __repr__(self) -> str:
        return f"<Task(id={self.id}, user_id={self.user_id}, deadline={self.deadline})>"
