"""Repository dependencies."""
from typing import Annotated

from fastapi import Depends

from app.api.deps.database import DbSessionDep
from app.repositories.users import UserRepository


def get_user_repo(db: DbSessionDep) -> UserRepository:
    """Injects UserRepository bound to current request session."""
    return UserRepository(session=db)


UserRepoDep = Annotated[UserRepository, Depends(get_user_repo)]