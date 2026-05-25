"""Service & external client dependencies."""
from typing import Annotated

from fastapi import Depends

from app.api.deps.repositories import (
    UserRepoDep,
    HabitRepoDep,
    HabitCompletionRepoDep,
    DailyAdviceRepoDep,
    TaskRepoDep,
    UserStreakRepoDep,
)
from app.clients.moodle import MoodleClient
from app.core.config import settings
from app.services.users import UserService
from app.services.habits import HabitService
from app.services.moodle import MoodleService
from app.services.advice import AdviceService
from app.services.dashboard import DashboardService
from app.services.tasks import TaskService


def get_moodle_client() -> MoodleClient:
    """Creates fresh Moodle client per request (stateless for auth)."""
    return MoodleClient(base_url=settings.moodle_url)


MoodleClientDep = Annotated[MoodleClient, Depends(get_moodle_client)]


def get_user_service(
    repo: UserRepoDep,
    moodle: MoodleClientDep,
) -> UserService:
    """Assembles UserService with injected repo and Moodle client."""
    return UserService(repo=repo, moodle=moodle)


UserServiceDep = Annotated[UserService, Depends(get_user_service)]


def get_habit_service(
    users: UserRepoDep,
    habits: HabitRepoDep,
    completions: HabitCompletionRepoDep,
    streaks: UserStreakRepoDep,
    moodle: MoodleClientDep,
) -> HabitService:
    """Assembles HabitService with injected repos and Moodle client."""
    return HabitService(
        users=users,
        habits=habits,
        completions=completions,
        streaks=streaks,
        moodle=moodle,
    )


HabitServiceDep = Annotated[HabitService, Depends(get_habit_service)]


def get_moodle_service(
    moodle: MoodleClientDep,
) -> MoodleService:
    """Assembles MoodleService with injected Moodle client."""
    return MoodleService(moodle=moodle)


MoodleServiceDep = Annotated[MoodleService, Depends(get_moodle_service)]


def get_advice_service(
    users: UserRepoDep,
    advice: DailyAdviceRepoDep,
    moodle: MoodleClientDep,
) -> AdviceService:
    """Assembles AdviceService with injected repos and Moodle client."""
    return AdviceService(users=users, advice=advice, moodle=moodle)


AdviceServiceDep = Annotated[AdviceService, Depends(get_advice_service)]


def get_dashboard_service(
    users: UserRepoDep,
    habits: HabitRepoDep,
    completions: HabitCompletionRepoDep,
    tasks: TaskRepoDep,
    moodle: MoodleClientDep,
) -> DashboardService:
    """Assembles DashboardService with injected repos and Moodle client."""
    return DashboardService(
        users=users,
        habits=habits,
        completions=completions,
        tasks=tasks,
        moodle=moodle,
    )


DashboardServiceDep = Annotated[DashboardService, Depends(get_dashboard_service)]


def get_task_service(
    users: UserRepoDep,
    tasks: TaskRepoDep,
    moodle: MoodleClientDep,
) -> TaskService:
    """Assembles TaskService with injected repos and Moodle client."""
    return TaskService(users=users, tasks=tasks, moodle=moodle)


TaskServiceDep = Annotated[TaskService, Depends(get_task_service)]