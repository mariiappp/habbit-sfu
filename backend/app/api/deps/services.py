"""Service & external client dependencies."""
from typing import Annotated

from fastapi import Depends

from app.api.deps.repositories import UserRepoDep
from app.clients.moodle import MoodleClient
from app.core.config import settings
from app.services.users import UserService


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