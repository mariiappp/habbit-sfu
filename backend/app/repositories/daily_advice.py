"""Daily advice repository for asynchronous data access."""
from datetime import date
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.domain.models.daily_advice import DailyAdvice


class DailyAdviceRepository:
    """Data access layer for personalized daily advice."""

    def __init__(self, session: AsyncSession) -> None:
        self.session = session

    async def get_today(self, user_id: int) -> DailyAdvice | None:
        """Fetch today's advice for a specific user."""
        stmt = select(DailyAdvice).where(
            DailyAdvice.user_id == user_id,
            DailyAdvice.advice_date == date.today(),
        )
        result = await self.session.execute(stmt)
        return result.scalar_one_or_none()

    async def get_for_date(self, user_id: int, target_date: date) -> DailyAdvice | None:
        """Fetch advice for a specific user and date."""
        stmt = select(DailyAdvice).where(
            DailyAdvice.user_id == user_id,
            DailyAdvice.advice_date == target_date,
        )
        result = await self.session.execute(stmt)
        return result.scalar_one_or_none()

    async def create(self, user_id: int, target_date: date, content: str) -> DailyAdvice:
        """Create a new daily advice entry."""
        advice = DailyAdvice(user_id=user_id, advice_date=target_date, content=content)
        self.session.add(advice)
        await self.session.flush()
        await self.session.refresh(advice)
        return advice

    async def upsert_for_date(self, user_id: int, target_date: date, content: str) -> DailyAdvice:
        """Create or replace advice for a specific date."""
        stmt = select(DailyAdvice).where(
            DailyAdvice.user_id == user_id,
            DailyAdvice.advice_date == target_date,
        )
        result = await self.session.execute(stmt)
        existing = result.scalar_one_or_none()

        if existing:
            existing.content = content
            await self.session.flush()
            await self.session.refresh(existing)
            return existing
        return await self.create(user_id, target_date, content)

    async def get_history(self, user_id: int, limit: int = 30) -> list[DailyAdvice]:
        """Fetch recent advice history (ordered newest → oldest)."""
        stmt = (
            select(DailyAdvice)
            .where(DailyAdvice.user_id == user_id)
            .order_by(DailyAdvice.advice_date.desc())
            .limit(limit)
        )
        result = await self.session.execute(stmt)
        return list(result.scalars().all())