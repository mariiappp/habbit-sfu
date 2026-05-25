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

        tasks_in_week = await self.tasks.get_by_user_date_range(
            user_id=user.id,
            start_date=week_start,
            end_date=week_end,
        )
        tasks_by_date: dict[date, list] = {}
        for task in tasks_in_week:
            tasks_by_date.setdefault(task.deadline, []).append(task)

        missed_deadlines = len(
            [
                task
                for task in tasks_in_week
                if task.deadline < target_date and not task.is_done
            ]
        )

        productivity_chart = []
        day_balances: list[int] = []
        completed_tasks_week = 0
        labels = self._day_labels()
        for index, day_label in enumerate(labels):
            current_day = week_start + timedelta(days=index)
            tasks_for_day = tasks_by_date.get(current_day, [])
            tasks_total_day = len(tasks_for_day)
            tasks_done_day = len([task for task in tasks_for_day if task.is_done])
            completed_tasks_week += tasks_done_day

            habits_active_day = sum(
                1 for habit in habits if self._is_active(habit, current_day)
            )
            habits_done_day = len(completions_by_date.get(current_day, set()))

            components = []
            if habits_active_day > 0:
                components.append(habits_done_day / habits_active_day)
            if tasks_total_day > 0:
                components.append(tasks_done_day / tasks_total_day)

            day_balance = round((sum(components) / len(components)) * 100) if components else 0
            if current_day <= target_date:
                day_balances.append(day_balance)

            productivity_chart.append({
                "day": day_label,
                "value": day_balance,
                "dayIndex": index,
            })

        average_balance = round(sum(day_balances) / len(day_balances)) if day_balances else 0

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
                "completedTasks": completed_tasks_week,
                "averageBalance": average_balance,
                "averageScreenTime": 0,
            },
            "productivityChart": productivity_chart,
            "advice": None,
        }

    async def close(self) -> None:
        await self.moodle.aclose()
