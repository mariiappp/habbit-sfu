"""Database session management.

Provides asynchronous database engine, session factory,
and dependency injection for FastAPI route handlers.
"""
from collections.abc import AsyncGenerator
from contextlib import asynccontextmanager
from typing import Final

from sqlalchemy.ext.asyncio import (
    AsyncEngine,
    AsyncSession,
    async_sessionmaker,
    create_async_engine
)

from app.core.config import settings

# Engine singleton
_engine: AsyncEngine | None = None

# Session factory
_session_factory: async_sessionmaker[AsyncSession] | None = None


def get_engine() -> AsyncEngine:
    """Return or create the async database engine.

    Lazy initialization.
    """
    global _engine
    if _engine is None:
        _engine = create_async_engine(
            url=str(settings.database_url),
            pool_pre_ping=True,
            pool_size=settings.db_pool_size,
            max_overflow=settings.db_max_overflow,
            pool_timeout=settings.db_pool_timeout,
            pool_recycle=settings.db_pool_recycle,
            echo=settings.debug,
        )
    return _engine


def get_session_factory() -> async_sessionmaker[AsyncSession]:
    """Return or create the async session factory.

    Lazy initialization.
    """
    global _session_factory
    if _session_factory is None:
        engine = get_engine()
        _session_factory = async_sessionmaker(
            bind=engine,
            class_=AsyncSession,
            expire_on_commit=False,
            autoflush=False,
        )
    return _session_factory


async def init_database() -> None:
    """Initialize database connections.

    Initialize database connections.
    """
    # Force engine initialization
    get_engine()


async def close_database() -> None:
    """Gracefully close all database connections.

    Gracefully close all database connections.
    """
    global _engine
    if _engine is not None:
        await _engine.dispose()
        _engine = None


async def get_session_context() -> AsyncGenerator[AsyncSession, None]:
    """Context manager for database sessions.

    Context manager for database sessions.
    """
    factory = get_session_factory()
    session = factory()
    try:
        yield session
        await session.commit()
    except Exception:
        await session.rollback()
        raise
    finally:
        await session.close()


