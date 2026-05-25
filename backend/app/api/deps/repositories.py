"""Repository dependencies."""
from typing import Annotated

from fastapi import Depends

from app.api.deps.database import DbSessionDep
from app.repositories.users import UserRepository
from app.repositories.habits import HabitRepository
from app.repositories.habit_completions import HabitCompletionRepository
from app.repositories.daily_advice import DailyAdviceRepository
from app.repositories.tasks import TaskRepository
from app.repositories.user_streaks import UserStreakRepository


def get_user_repo(db: DbSessionDep) -> UserRepository:
    """Injects UserRepository bound to current request session."""
    return UserRepository(session=db)

def get_habit_repo(db: DbSessionDep) -> HabitRepository:
    """Injects HabitRepository bound to current request session."""
    return HabitRepository(session=db)


def get_habit_completion_repo(db: DbSessionDep) -> HabitCompletionRepository:
    """Injects HabitCompletionRepository bound to current request session."""
    return HabitCompletionRepository(session=db)


UserRepoDep = Annotated[UserRepository, Depends(get_user_repo)]
HabitRepoDep = Annotated[HabitRepository, Depends(get_habit_repo)]
HabitCompletionRepoDep = Annotated[HabitCompletionRepository, Depends(get_habit_completion_repo)]


def get_daily_advice_repo(db: DbSessionDep) -> DailyAdviceRepository:
    """Injects DailyAdviceRepository bound to current request session."""
    return DailyAdviceRepository(session=db)


DailyAdviceRepoDep = Annotated[DailyAdviceRepository, Depends(get_daily_advice_repo)]


def get_task_repo(db: DbSessionDep) -> TaskRepository:
    """Injects TaskRepository bound to current request session."""
    return TaskRepository(session=db)


TaskRepoDep = Annotated[TaskRepository, Depends(get_task_repo)]


def get_user_streak_repo(db: DbSessionDep) -> UserStreakRepository:
    """Injects UserStreakRepository bound to current request session."""
    return UserStreakRepository(session=db)


UserStreakRepoDep = Annotated[UserStreakRepository, Depends(get_user_streak_repo)]