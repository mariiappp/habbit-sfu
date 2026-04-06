"""Database dependencies."""
from collections.abc import AsyncGenerator
from typing import Annotated

from fastapi import Depends
from sqlalchemy.ext.asyncio import AsyncSession

from app.db.session import get_session_context


async def get_db_session() -> AsyncGenerator[AsyncSession, None]:
    """Inject database session."""
    async with get_session_context() as session:
        yield session


DbSessionDep = Annotated[AsyncSession, Depends(get_db_session)]