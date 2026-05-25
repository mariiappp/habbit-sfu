"""User streak repository for asynchronous data access."""
from datetime import date

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.domain.models.user_streaks import UserStreak


class UserStreakRepository:
    """Data access layer for UserStreak entity."""

    def __init__(self, session: AsyncSession) -> None:
        self.session = session

    async def get_by_user(self, user_id: int) -> UserStreak | None:
        """Fetch streak for a user."""
        stmt = select(UserStreak).where(UserStreak.user_id == user_id)
        result = await self.session.execute(stmt)
        return result.scalar_one_or_none()

    async def upsert(self, user_id: int, current_streak: int, last_date: date | None) -> UserStreak:
        """Create or update streak for a user."""
        existing = await self.get_by_user(user_id)
        if existing:
            existing.current_streak = current_streak
            existing.last_streak_date = last_date
            await self.session.flush()
            await self.session.refresh(existing)
            return existing

        streak = UserStreak(
            user_id=user_id,
            current_streak=current_streak,
            last_streak_date=last_date,
        )
        self.session.add(streak)
        await self.session.flush()
        await self.session.refresh(streak)
        return streak
