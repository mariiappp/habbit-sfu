"""Task repository for asynchronous data access."""
from datetime import date
from typing import Any

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.domain.models.tasks import Task


class TaskRepository:
    """Data access layer for Task entity."""

    def __init__(self, session: AsyncSession) -> None:
        self.session = session

    async def create(self, user_id: int, **kwargs: Any) -> Task:
        """Create a new task for a specific user."""
        task = Task(user_id=user_id, **kwargs)
        self.session.add(task)
        await self.session.flush()
        await self.session.refresh(task)
        return task

    async def get_by_id(self, task_id: int, user_id: int | None = None) -> Task | None:
        """Fetch task by ID. Optionally filter by owner user_id."""
        stmt = select(Task).where(Task.id == task_id)
        if user_id is not None:
            stmt = stmt.where(Task.user_id == user_id)
        result = await self.session.execute(stmt)
        return result.scalar_one_or_none()

    async def get_all_by_user(self, user_id: int) -> list[Task]:
        """Fetch all tasks belonging to a specific user."""
        stmt = select(Task).where(Task.user_id == user_id).order_by(Task.deadline.asc())
        result = await self.session.execute(stmt)
        return list(result.scalars().all())

    async def get_by_user_date_range(
        self,
        user_id: int,
        start_date: date,
        end_date: date,
    ) -> list[Task]:
        """Fetch tasks within a date range (inclusive)."""
        stmt = (
            select(Task)
            .where(
                Task.user_id == user_id,
                Task.deadline >= start_date,
                Task.deadline <= end_date,
            )
            .order_by(Task.deadline.asc())
        )
        result = await self.session.execute(stmt)
        return list(result.scalars().all())

    async def get_before_date(
        self,
        user_id: int,
        before_date: date,
        include_done: bool = False,
    ) -> list[Task]:
        """Fetch tasks with deadline before a date."""
        stmt = select(Task).where(
            Task.user_id == user_id,
            Task.deadline < before_date,
        )
        if not include_done:
            stmt = stmt.where(Task.is_done.is_(False))
        result = await self.session.execute(stmt)
        return list(result.scalars().all())

    async def update(self, task: Task, update_data: dict[str, Any]) -> Task:
        """Update task attributes."""
        for key, value in update_data.items():
            if hasattr(task, key):
                setattr(task, key, value)
        await self.session.flush()
        await self.session.refresh(task)
        return task

    async def delete(self, task: Task) -> None:
        """Delete task."""
        await self.session.delete(task)
        await self.session.flush()
