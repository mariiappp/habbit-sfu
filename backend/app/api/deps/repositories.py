"""Repository dependencies."""
from typing import Annotated

from fastapi import Depends

from app.api.deps.database import DbSessionDep
from app.repositories.users import UserRepository
from app.repositories.habits import HabitRepository


def get_user_repo(db: DbSessionDep) -> UserRepository:
    """Injects UserRepository bound to current request session."""
    return UserRepository(session=db)

def get_habit_repo(db: DbSessionDep) -> HabitRepository:
    """Injects HabitRepository bound to current request session."""
    return HabitRepository(session=db)


UserRepoDep = Annotated[UserRepository, Depends(get_user_repo)]
HabitRepoDep = Annotated[HabitRepository, Depends(get_habit_repo)]