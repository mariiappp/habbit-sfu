"""Habit business logic layer."""
from __future__ import annotations

from dataclasses import dataclass
from datetime import date, timedelta

from app.clients.exceptions import MoodleAPIError
from app.clients.moodle import MoodleClient
from app.domain.models.habits import Habit, HabitRecurrence
from app.domain.models.habit_completions import HabitCompletion
from app.domain.models.users import User
from app.repositories.habits import HabitRepository
from app.repositories.habit_completions import HabitCompletionRepository
from app.repositories.users import UserRepository
from app.repositories.user_streaks import UserStreakRepository


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
        streaks: UserStreakRepository,
        moodle: MoodleClient,
    ) -> None:
        self.users = users
        self.habits = habits
        self.completions = completions
        self.streaks = streaks
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

    @staticmethod
    def _week_bounds(target_date: date) -> tuple[date, date]:
        start = target_date - timedelta(days=target_date.weekday())
        end = start + timedelta(days=6)
        return start, end

    @staticmethod
    def _month_bounds(target_date: date) -> tuple[date, date]:
        start = date(target_date.year, target_date.month, 1)
        if target_date.month == 12:
            end = date(target_date.year + 1, 1, 1) - timedelta(days=1)
        else:
            end = date(target_date.year, target_date.month + 1, 1) - timedelta(days=1)
        return start, end

    @staticmethod
    def _is_active(habit: Habit, target_date: date) -> bool:
        if habit.created_at is None:
            return True
        return habit.created_at.date() <= target_date

    @staticmethod
    def _has_completion(
        completion_dates: set[date],
        start_date: date,
        end_date: date,
    ) -> bool:
        current = start_date
        while current <= end_date:
            if current in completion_dates:
                return True
            current += timedelta(days=1)
        return False

    def _is_habit_satisfied(
        self,
        habit: Habit,
        target_date: date,
        completion_dates: set[date],
    ) -> bool:
        if not self._is_active(habit, target_date):
            return True

        if habit.recurrence == HabitRecurrence.DAILY:
            return target_date in completion_dates
        if habit.recurrence == HabitRecurrence.WEEKLY:
            week_start, week_end = self._week_bounds(target_date)
            created_date = habit.created_at.date() if habit.created_at else week_start
            active_start = max(week_start, created_date)
            return self._has_completion(completion_dates, active_start, week_end)
        if habit.recurrence == HabitRecurrence.MONTHLY:
            month_start, month_end = self._month_bounds(target_date)
            created_date = habit.created_at.date() if habit.created_at else month_start
            active_start = max(month_start, created_date)
            return self._has_completion(completion_dates, active_start, month_end)
        return target_date in completion_dates

    async def get_streak(self, token: str) -> dict:
        user = await self._resolve_user(token)
        habits = await self.habits.get_all_by_user(user.id)
        today = date.today()
        current_week_start, current_week_end = self._week_bounds(today)
        current_month_start, current_month_end = self._month_bounds(today)

        if not habits:
            record = await self.streaks.upsert(user.id, 0, None)
            return {
                "current_streak": record.current_streak,
                "last_streak_date": record.last_streak_date,
            }

        created_dates = [habit.created_at.date() for habit in habits if habit.created_at]
        earliest = min(created_dates) if created_dates else today

        completions = await self.completions.get_user_completions_in_range(
            user_id=user.id,
            start_date=earliest,
            end_date=today,
        )

        completions_by_habit: dict[int, set[date]] = {habit.id: set() for habit in habits}
        for completion in completions:
            if completion.habit_id in completions_by_habit:
                completions_by_habit[completion.habit_id].add(completion.completed_at.date())

        def is_satisfied(day: date) -> bool:
            return all(
                self._is_habit_satisfied_for_streak(
                    habit,
                    day,
                    completions_by_habit.get(habit.id, set()),
                    today,
                    current_week_start,
                    current_week_end,
                    current_month_start,
                    current_month_end,
                )
                for habit in habits
            )

        is_today_satisfied = is_satisfied(today)
        start_day = today if is_today_satisfied else today - timedelta(days=1)

        if start_day < earliest:
            record = await self.streaks.upsert(user.id, 0, None)
            return {
                "current_streak": record.current_streak,
                "last_streak_date": record.last_streak_date,
            }

        streak = 0
        cursor = start_day
        while cursor >= earliest:
            if not is_satisfied(cursor):
                break
            streak += 1
            cursor -= timedelta(days=1)

        last_date = start_day if streak > 0 else None
        record = await self.streaks.upsert(user.id, streak, last_date)
        return {
            "current_streak": record.current_streak,
            "last_streak_date": record.last_streak_date,
        }

    def _is_habit_satisfied_for_streak(
        self,
        habit: Habit,
        target_date: date,
        completion_dates: set[date],
        today: date,
        current_week_start: date,
        current_week_end: date,
        current_month_start: date,
        current_month_end: date,
    ) -> bool:
        if not self._is_active(habit, target_date):
            return True

        if habit.recurrence == HabitRecurrence.DAILY:
            return target_date in completion_dates

        if habit.recurrence == HabitRecurrence.WEEKLY:
            week_start, week_end = self._week_bounds(target_date)
            if week_start <= today <= week_end:
                # Current week: allow pending weekly habits.
                return True
            created_date = habit.created_at.date() if habit.created_at else week_start
            active_start = max(week_start, created_date)
            return self._has_completion(completion_dates, active_start, week_end)

        if habit.recurrence == HabitRecurrence.MONTHLY:
            month_start, month_end = self._month_bounds(target_date)
            if current_month_start <= today <= current_month_end and month_start == current_month_start:
                # Current month: allow pending monthly habits.
                return True
            created_date = habit.created_at.date() if habit.created_at else month_start
            active_start = max(month_start, created_date)
            return self._has_completion(completion_dates, active_start, month_end)

        return target_date in completion_dates

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
