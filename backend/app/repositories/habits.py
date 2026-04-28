"""Habit repository for asynchronous data access."""
from typing import Any

from sqlalchemy import select, update, delete
from sqlalchemy.ext.asyncio import AsyncSession

from app.domain.models.habits import Habit, HabitRecurrence


class HabitRepository:
    """Data access layer for Habit entity."""

    def __init__(self, session: AsyncSession) -> None:
        self.session = session

    async def create(self, user_id: int, title: str, **kwargs: Any) -> Habit:
        """Create a new habit for a specific user."""
        habit = Habit(user_id=user_id, title=title, **kwargs)
        self.session.add(habit)
        await self.session.flush()
        await self.session.refresh(habit)
        return habit

    async def get_by_id(self, habit_id: int, user_id: int | None = None) -> Habit | None:
        """Fetch habit by ID. Optionally filter by owner user_id for security."""
        stmt = select(Habit).where(Habit.id == habit_id)
        if user_id is not None:
            stmt = stmt.where(Habit.user_id == user_id)
        result = await self.session.execute(stmt)
        return result.scalar_one_or_none()

    async def get_all_by_user(self, user_id: int) -> list[Habit]:
        """Fetch all habits belonging to a specific user."""
        stmt = select(Habit).where(Habit.user_id == user_id).order_by(Habit.created_at.desc())
        result = await self.session.execute(stmt)
        return list(result.scalars().all())

    async def update(self, habit: Habit, update_data: dict[str, Any]) -> Habit:
        """Update habit attributes."""
        for key, value in update_data.items():
            if hasattr(habit, key):
                setattr(habit, key, value)
        await self.session.flush()
        await self.session.refresh(habit)
        return habit

    async def delete(self, habit: Habit) -> None:
        """Soft-delete is preferred in production, but here we do hard delete."""
        await self.session.delete(habit)
        await self.session.flush()