"""Habit completion repository for asynchronous data access."""
from datetime import date, datetime, time
from typing import Any

from sqlalchemy import select, delete
from sqlalchemy.ext.asyncio import AsyncSession

from app.domain.models.habit_completions import HabitCompletion


class HabitCompletionRepository:
    """Data access layer for tracking habit progress."""

    def __init__(self, session: AsyncSession) -> None:
        self.session = session

    async def create(
        self, habit_id: int, user_id: int, note: str | None = None
    ) -> HabitCompletion:
        """Log a new completion event."""
        completion = HabitCompletion(
            habit_id=habit_id, user_id=user_id, note=note
        )
        self.session.add(completion)
        await self.session.flush()
        await self.session.refresh(completion)
        return completion

    async def get_today(self, habit_id: int, user_id: int) -> HabitCompletion | None:
        """Check if habit was already completed today (idempotency guard)."""
        start_of_day = datetime.combine(date.today(), time.min)
        stmt = select(HabitCompletion).where(
            HabitCompletion.habit_id == habit_id,
            HabitCompletion.user_id == user_id,
            HabitCompletion.completed_at >= start_of_day,
        )
        result = await self.session.execute(stmt)
        return result.scalar_one_or_none()

    async def get_recent(
        self, habit_id: int, user_id: int, limit: int = 30
    ) -> list[HabitCompletion]:
        """Fetch latest completions for progress/streak calculation."""
        stmt = (
            select(HabitCompletion)
            .where(
                HabitCompletion.habit_id == habit_id,
                HabitCompletion.user_id == user_id,
            )
            .order_by(HabitCompletion.completed_at.desc())
            .limit(limit)
        )
        result = await self.session.execute(stmt)
        return list(result.scalars().all())

    async def get_in_range(
        self,
        habit_id: int,
        user_id: int,
        start_date: date,
        end_date: date,
    ) -> list[HabitCompletion]:
        """Fetch completion events within date range (inclusive)."""
        start_dt = datetime.combine(start_date, time.min)
        end_dt = datetime.combine(end_date, time.max)
        stmt = (
            select(HabitCompletion)
            .where(
                HabitCompletion.habit_id == habit_id,
                HabitCompletion.user_id == user_id,
                HabitCompletion.completed_at >= start_dt,
                HabitCompletion.completed_at <= end_dt,
            )
            .order_by(HabitCompletion.completed_at.asc())
        )
        result = await self.session.execute(stmt)
        return list(result.scalars().all())

    async def delete(self, completion_id: int, user_id: int) -> bool:
        """Remove a completion log (undo action)."""
        stmt = delete(HabitCompletion).where(
            HabitCompletion.id == completion_id,
            HabitCompletion.user_id == user_id,
        )
        result = await self.session.execute(stmt)
        await self.session.flush()
        return result.rowcount > 0