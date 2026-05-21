"""Home dashboard aggregation service."""
from __future__ import annotations

from datetime import date, timedelta

from app.clients.moodle import MoodleClient
from app.domain.models.users import User
from app.repositories.habits import HabitRepository
from app.repositories.habit_completions import HabitCompletionRepository
from app.repositories.users import UserRepository
from app.repositories.tasks import TaskRepository
from app.domain.models.habits import HabitRecurrence


class MoodleProfileError(Exception):
    """Moodle profile response is invalid."""


class DashboardService:
    """Service for assembling home screen metrics."""

    def __init__(
        self,
        users: UserRepository,
        habits: HabitRepository,
        completions: HabitCompletionRepository,
        tasks: TaskRepository,
        moodle: MoodleClient,
    ) -> None:
        self.users = users
        self.habits = habits
        self.completions = completions
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

    @staticmethod
    def _week_bounds(target_date: date) -> tuple[date, date]:
        start = target_date - timedelta(days=target_date.weekday())
        end = start + timedelta(days=6)
        return start, end

    @staticmethod
    def _day_labels() -> list[str]:
        return ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"]

    @staticmethod
    def _month_bounds(target_date: date) -> tuple[date, date]:
        start = date(target_date.year, target_date.month, 1)
        if target_date.month == 12:
            end = date(target_date.year + 1, 1, 1) - timedelta(days=1)
        else:
            end = date(target_date.year, target_date.month + 1, 1) - timedelta(days=1)
        return start, end

    @staticmethod
    def _is_active(habit, target_date: date) -> bool:
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
        habit,
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

    async def get_home_dashboard(self, token: str, target_date: date) -> dict:
        user, profile = await self._resolve_user(token)

        habits = await self.habits.get_all_by_user(user.id)
        habit_ids = {habit.id for habit in habits}
        habits_total = len(habits)

        week_start, week_end = self._week_bounds(target_date)
        month_start, month_end = self._month_bounds(target_date)

        completions = await self.completions.get_user_completions_in_range(
            user_id=user.id,
            start_date=month_start,
            end_date=month_end,
        )

        completions_by_habit: dict[int, set[date]] = {habit.id: set() for habit in habits}
        completions_by_date: dict[date, set[int]] = {}
        for completion in completions:
            if completion.habit_id not in habit_ids:
                continue
            completion_date = completion.completed_at.date()
            completions_by_habit.setdefault(completion.habit_id, set()).add(completion_date)
            completions_by_date.setdefault(completion_date, set()).add(completion.habit_id)

        habits_done = sum(
            1
            for habit in habits
            if self._is_habit_satisfied(
                habit,
                target_date,
                completions_by_habit.get(habit.id, set()),
            )
        )

        tasks_today = await self.tasks.get_by_user_date_range(
            user_id=user.id,
            start_date=target_date,
            end_date=target_date,
        )
        tasks_total = len(tasks_today)
        tasks_done = len([task for task in tasks_today if task.is_done])
        missed_deadlines = len(
            await self.tasks.get_before_date(
                user_id=user.id,
                before_date=target_date,
                include_done=False,
            )
        )
        tasks_progress = tasks_done / max(tasks_total, 1)
        habits_progress = habits_done / max(habits_total, 1)
        average_balance = round(((tasks_progress + habits_progress) / 2) * 100)

        productivity_chart = []
        labels = self._day_labels()
        for index, day_label in enumerate(labels):
            current_day = week_start + timedelta(days=index)
            completed = len(completions_by_date.get(current_day, set()))
            value = round((completed / habits_total) * 100) if habits_total else 0
            productivity_chart.append({
                "day": day_label,
                "value": value,
                "dayIndex": index,
            })

        return {
            "user": {
                "firstName": profile.get("firstname") or profile.get("fullname"),
                "lastName": profile.get("lastname"),
            },
            "tasks": {
                "done": tasks_done,
                "total": tasks_total,
            },
            "habits": {
                "done": habits_done,
                "total": habits_total,
            },
            "weeklySummary": {
                "missedDeadlines": missed_deadlines,
                "completedTasks": tasks_done,
                "averageBalance": average_balance,
                "averageScreenTime": 0,
            },
            "productivityChart": productivity_chart,
            "advice": None,
        }

    async def close(self) -> None:
        await self.moodle.aclose()
