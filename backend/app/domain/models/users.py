"""User database model.

Represents a local user record synchronized with the external Moodle system.
Used for caching, preferences, app-specific flags, and relationship mapping.
"""
from sqlalchemy import String, Boolean
from sqlalchemy.orm import Mapped, mapped_column

from app.domain.models import Base


class User(Base):
    """Local user entity linked to Moodle via external identifier.

    Stores minimal required user data to avoid redundant API calls
    and enable local business logic (roles, notifications, settings).
    """
    __tablename__ = "users"

    # External system linkage
    moodle_id: Mapped[int] = mapped_column(unique=True, nullable=False, index=True)
    username: Mapped[str] = mapped_column(String(100), unique=True, nullable=False, index=True)
    email: Mapped[str | None] = mapped_column(String(255), nullable=True)
    fullname: Mapped[str] = mapped_column(String(255), nullable=False)

    # Application state
    is_active: Mapped[bool] = mapped_column(Boolean, default=True, nullable=False)

    def __repr__(self) -> str:
        """String representation for debugging and structured logging."""
        return (
            f"<User(id={self.id}, username='{self.username}', "
            f"moodle_id={self.moodle_id}, active={self.is_active})>"
        )