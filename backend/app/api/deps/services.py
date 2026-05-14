"""Service & external client dependencies."""
from typing import Annotated

from fastapi import Depends

from app.api.deps.repositories import UserRepoDep, HabitRepoDep, HabitCompletionRepoDep
from app.clients.moodle import MoodleClient
from app.core.config import settings
from app.services.users import UserService
from app.services.habits import HabitService
from app.services.moodle import MoodleService


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
    moodle: MoodleClientDep,
) -> HabitService:
    """Assembles HabitService with injected repos and Moodle client."""
    return HabitService(
        users=users,
        habits=habits,
        completions=completions,
        moodle=moodle,
    )


HabitServiceDep = Annotated[HabitService, Depends(get_habit_service)]


def get_moodle_service(
    moodle: MoodleClientDep,
) -> MoodleService:
    """Assembles MoodleService with injected Moodle client."""
    return MoodleService(moodle=moodle)


MoodleServiceDep = Annotated[MoodleService, Depends(get_moodle_service)]