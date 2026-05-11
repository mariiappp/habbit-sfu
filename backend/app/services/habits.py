"""Habit business logic layer."""
from __future__ import annotations

from dataclasses import dataclass
from datetime import date, timedelta

from app.clients.exceptions import MoodleAPIError
from app.clients.moodle import MoodleClient
from app.domain.models.habits import Habit
from app.domain.models.habit_completions import HabitCompletion
from app.domain.models.users import User
from app.repositories.habits import HabitRepository
from app.repositories.habit_completions import HabitCompletionRepository
from app.repositories.users import UserRepository


class HabitNotFoundError(Exception):
    """Habit was not found for the user."""


class CompletionNotFoundError(Exception):
    """Completion record was not found for the user."""


class InvalidDateRangeError(Exception):
    """Date range is invalid."""


class MoodleProfileError(Exception):
    """Moodle profile response is invalid."""


@dataclass
class HabitHistoryDay:
    date: date
    completed: bool
    completion_id: int | None


@dataclass
class HabitHistory:
    habit: Habit
    start_date: date
    end_date: date
    days: list[HabitHistoryDay]


class HabitService:
    """Service for habit CRUD and completion history."""

    def __init__(
        self,
        users: UserRepository,
        habits: HabitRepository,
        completions: HabitCompletionRepository,
        moodle: MoodleClient,
    ) -> None:
        self.users = users
        self.habits = habits
        self.completions = completions
        self.moodle = moodle

    async def _resolve_user(self, token: str) -> User:
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
        return user

    async def create_habit(
        self,
        token: str,
        title: str,
        description: str | None,
        recurrence,
    ) -> Habit:
        user = await self._resolve_user(token)
        return await self.habits.create(
            user_id=user.id,
            title=title,
            description=description,
            recurrence=recurrence,
        )

    async def list_habits(self, token: str) -> list[Habit]:
        user = await self._resolve_user(token)
        return await self.habits.get_all_by_user(user.id)

    async def get_habit(self, token: str, habit_id: int) -> Habit:
        user = await self._resolve_user(token)
        habit = await self.habits.get_by_id(habit_id, user_id=user.id)
        if habit is None:
            raise HabitNotFoundError("Habit not found")
        return habit

    async def update_habit(self, token: str, habit_id: int, update_data: dict) -> Habit:
        habit = await self.get_habit(token, habit_id)
        return await self.habits.update(habit, update_data)

    async def delete_habit(self, token: str, habit_id: int) -> None:
        habit = await self.get_habit(token, habit_id)
        await self.habits.delete(habit)

    async def complete_habit(
        self,
        token: str,
        habit_id: int,
        note: str | None,
    ) -> HabitCompletion:
        habit = await self.get_habit(token, habit_id)
        existing = await self.completions.get_today(
            habit_id=habit.id,
            user_id=habit.user_id,
        )
        if existing:
            return existing
        return await self.completions.create(
            habit_id=habit.id,
            user_id=habit.user_id,
            note=note,
        )

    async def list_completions(self, token: str, habit_id: int, limit: int) -> list[HabitCompletion]:
        habit = await self.get_habit(token, habit_id)
        return await self.completions.get_recent(
            habit_id=habit.id,
            user_id=habit.user_id,
            limit=limit,
        )

    async def delete_completion(self, token: str, habit_id: int, completion_id: int) -> None:
        habit = await self.get_habit(token, habit_id)
        deleted = await self.completions.delete(
            completion_id=completion_id,
            user_id=habit.user_id,
        )
        if not deleted:
            raise CompletionNotFoundError("Completion not found")

    async def history(
        self,
        token: str,
        habit_id: int,
        start_date: date | None,
        end_date: date | None,
    ) -> HabitHistory:
        habit = await self.get_habit(token, habit_id)
        if end_date is None:
            end_date = date.today()
        if start_date is None:
            start_date = end_date - timedelta(days=30)
        if start_date > end_date:
            raise InvalidDateRangeError("start_date must be <= end_date")

        records = await self.completions.get_in_range(
            habit_id=habit.id,
            user_id=habit.user_id,
            start_date=start_date,
            end_date=end_date,
        )
        by_date: dict[date, int] = {}
        for item in records:
            by_date[item.completed_at.date()] = item.id

        days: list[HabitHistoryDay] = []
        current = start_date
        while current <= end_date:
            completion_id = by_date.get(current)
            days.append(
                HabitHistoryDay(
                    date=current,
                    completed=completion_id is not None,
                    completion_id=completion_id,
                )
            )
            current += timedelta(days=1)

        return HabitHistory(
            habit=habit,
            start_date=start_date,
            end_date=end_date,
            days=days,
        )
