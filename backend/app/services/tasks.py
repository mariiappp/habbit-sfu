"""Task service layer."""
from __future__ import annotations

from datetime import date

from app.clients.moodle import MoodleClient
from app.domain.models.users import User
from app.repositories.tasks import TaskRepository
from app.repositories.users import UserRepository


class TaskNotFoundError(Exception):
    """Task was not found for the user."""


class MoodleProfileError(Exception):
    """Moodle profile response is invalid."""


class TaskService:
    """Service for task CRUD operations."""

    def __init__(
        self,
        users: UserRepository,
        tasks: TaskRepository,
        moodle: MoodleClient,
    ) -> None:
        self.users = users
        self.tasks = tasks
        self.moodle = moodle

    async def _resolve_user(self, token: str) -> tuple[User, dict]:
        self.moodle.wstoken = token
        profile = await self.moodle.get_current_user()
        moodle_id = profile.get("userid")
        if not moodle_id:
            raise MoodleProfileError("Moodle profile has no user id")
        user = await self.users.get_by_moodle_id(moodle_id)
        if user is None:
            user = await self.users.create(
                moodle_id=moodle_id,
                username=profile.get("username", str(moodle_id)),
                fullname=profile.get("fullname", str(moodle_id)),
                email=profile.get("email"),
                is_active=True,
            )
        return user, profile

    async def list_tasks(
        self,
        token: str,
        start_date: date | None,
        end_date: date | None,
    ) -> list:
        user, _profile = await self._resolve_user(token)
        if start_date and end_date:
            return await self.tasks.get_by_user_date_range(user.id, start_date, end_date)
        return await self.tasks.get_all_by_user(user.id)

    async def get_task(self, token: str, task_id: int):
        user, _profile = await self._resolve_user(token)
        task = await self.tasks.get_by_id(task_id, user_id=user.id)
        if task is None:
            raise TaskNotFoundError("Task not found")
        return task

    async def create_task(self, token: str, payload: dict) -> object:
        user, _profile = await self._resolve_user(token)
        return await self.tasks.create(user_id=user.id, **payload)

    async def update_task(self, token: str, task_id: int, update_data: dict) -> object:
        task = await self.get_task(token, task_id)
        return await self.tasks.update(task, update_data)

    async def delete_task(self, token: str, task_id: int) -> None:
        task = await self.get_task(token, task_id)
        await self.tasks.delete(task)

    async def get_missed_deadlines(self, token: str, target_date: date) -> int:
        user, _profile = await self._resolve_user(token)
        tasks = await self.tasks.get_before_date(user.id, target_date, include_done=False)
        return len(tasks)

    async def close(self) -> None:
        await self.moodle.aclose()
