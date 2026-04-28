"""Habit database model."""
from enum import Enum

from sqlalchemy import String, Integer, ForeignKey, Enum as SQLEnum
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.domain.models import Base



class HabitRecurrence(str, Enum):
    DAILY = "daily"
    WEEKLY = "weekly"
    MONTHLY = "monthly"
    CUSTOM = "custom"


class Habit(Base):
    """User habit entity with recurrence pattern."""
    __tablename__ = "habits"


    # Foreign key to User
    user_id: Mapped[int] = mapped_column(
        ForeignKey("users.id", ondelete="CASCADE"),
        index=True,  # Ускоряет поиск привычек пользователя
        nullable=False
    )

    # Core fields
    title: Mapped[str] = mapped_column(String(100), nullable=False)
    description: Mapped[str | None] = mapped_column(String(500), nullable=True)
    
    # Recurrence pattern (stored as string enum)
    recurrence: Mapped[HabitRecurrence] = mapped_column(
        SQLEnum(HabitRecurrence, name="habit_recurrence_enum"),
        default=HabitRecurrence.DAILY,
        nullable=False
    )


    def __repr__(self) -> str:
        return f"<Habit(id={self.id}, user_id={self.user_id}, title='{self.title}')>"