"""Test configuration: real PostgreSQL via testcontainers."""
import pytest
import pytest_asyncio
from sqlalchemy.ext.asyncio import create_async_engine, async_sessionmaker, AsyncSession
from sqlalchemy.pool import NullPool
from testcontainers.postgres import PostgresContainer

from app.domain.models import Base  # ← Проверь путь!


@pytest.fixture(scope="session")
def postgres_container():
    """Start PostgreSQL container once per test session."""
    with PostgresContainer("postgres:16-alpine", driver="asyncpg") as pg:
        yield pg


@pytest_asyncio.fixture(scope="session")
async def engine(postgres_container: PostgresContainer):
    """Create async engine with NullPool for test isolation."""
    # Получаем URL и форсируем asyncpg диалект
    sync_url = postgres_container.get_connection_url()
    async_url = f"postgresql+asyncpg://{sync_url.split('://', 1)[1]}"

    # NullPool предотвращает утечки соединений между тестами
    eng = create_async_engine(
        async_url,
        echo=False,
        pool_pre_ping=True,
        poolclass=NullPool,
    )
    
    # Создаём таблицы БЕЗ вложенных транзакций
    async with eng.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)
    
    yield eng
    await eng.dispose()


@pytest_asyncio.fixture
async def db_session(engine):
    """Provide isolated session per test. Rolls back after each test."""
    factory = async_sessionmaker(
        bind=engine,
        class_=AsyncSession,
        expire_on_commit=False,
        autocommit=False,
        autoflush=False,
    )
    async with factory() as session:
        yield session
        # Откатываем все изменения → полная изоляция тестов
        await session.rollback()
        await session.close()


@pytest.fixture
def user_repo(db_session: AsyncSession):
    """Inject UserRepository bound to the current test session."""
    from app.repositories.users import UserRepository
    return UserRepository(session=db_session)