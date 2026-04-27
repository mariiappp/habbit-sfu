"""SQLAlchemy models package.

Declares the shared declarative base with common columns
and registers all domain models for Alembic auto-detection.
"""
from datetime import datetime

from sqlalchemy import func
from sqlalchemy.orm import DeclarativeBase, Mapped, mapped_column


class Base(DeclarativeBase):
    """Abstract base class for all database models.

    Provides shared infrastructure columns:
    - id: Auto-incrementing primary key
    - created_at: Immutable timestamp of record creation
    - updated_at: Timestamp updated on every ORM flush
    """
    __abstract__ = True

    id: Mapped[int] = mapped_column(primary_key=True, autoincrement=True)
    created_at: Mapped[datetime] = mapped_column(
        server_default=func.now(), nullable=False
    )
    updated_at: Mapped[datetime] = mapped_column(
        server_default=func.now(),
        onupdate=func.now(),
        nullable=False,
    )


# Model Registration
from app.domain.models.users import User

__all__ = ["Base", "User"]