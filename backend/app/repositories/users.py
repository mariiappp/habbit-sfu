"""User repository for asynchronous data access.

Provides minimal CRUD and UPSERT operations optimized for
Moodle authentication flow (create-or-update on login).
"""
from typing import Any

from sqlalchemy import func, select
from sqlalchemy.dialects.postgresql import insert as pg_insert  # ← КРИТИЧНО для ON CONFLICT
from sqlalchemy.ext.asyncio import AsyncSession

from app.domain.models.users import User


class UserRepository:
    """Data access layer for User entity.

    Manages lifecycle of local user records synchronized from Moodle.
    """

    def __init__(self, session: AsyncSession) -> None:
        self.session = session

    async def get_by_id(self, user_id: int) -> User | None:
        """Fetch user by internal primary key."""
        stmt = select(User).where(User.id == user_id)
        result = await self.session.execute(stmt)
        return result.scalar_one_or_none()

    async def get_by_moodle_id(self, moodle_id: int) -> User | None:
        """Fetch user by external Moodle identifier."""
        stmt = select(User).where(User.moodle_id == moodle_id)
        result = await self.session.execute(stmt)
        return result.scalar_one_or_none()

    async def create(self, **kwargs: Any) -> User:
        """Create a new user record."""
        user = User(**kwargs)
        self.session.add(user)
        await self.session.flush()
        await self.session.refresh(user)
        return user

    async def upsert_on_auth(
        self,
        moodle_id: int,
        username: str,
        fullname: str,
        email: str | None = None,
    ) -> User:
        """Create user or update existing record on authentication.

        Uses PostgreSQL UPSERT (INSERT ... ON CONFLICT) for atomicity.
        Guarantees a single DB round-trip and avoids race conditions.
        """
        stmt = pg_insert(User).values(  # ← Используем PG-диалект
            moodle_id=moodle_id,
            username=username,
            fullname=fullname,
            email=email,
            is_active=True,
        )
        stmt = stmt.on_conflict_do_update(
            index_elements=[User.moodle_id],  # Unique index on moodle_id
            set_={
                "username": username,
                "fullname": fullname,
                "email": email,
                "is_active": True,
                "updated_at": func.now(),
            },
        ).returning(User)

        result = await self.session.execute(stmt)
        await self.session.flush()
        return result.scalar_one()

    async def update(self, user: User, update_data: dict[str, Any]) -> User:
        """Update existing user attributes."""
        for key, value in update_data.items():
            setattr(user, key, value)
        await self.session.flush()
        await self.session.refresh(user)
        return user