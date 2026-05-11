"""Test configuration: async SQLite database and FastAPI client."""
import pytest
import pytest_asyncio
from httpx import ASGITransport, AsyncClient
from sqlalchemy.ext.asyncio import create_async_engine, async_sessionmaker, AsyncSession
from sqlalchemy.pool import StaticPool

from app.domain.models import Base


@pytest_asyncio.fixture(scope="session")
async def engine():
    """Create async SQLite engine for tests."""
    eng = create_async_engine(
        "sqlite+aiosqlite:///:memory:",
        echo=False,
        poolclass=StaticPool,
        connect_args={"check_same_thread": False},
    )

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


@pytest_asyncio.fixture
async def app(db_session: AsyncSession):
    """FastAPI app with dependency overrides for tests."""
    from app.main import create_app
    from app.api.deps.database import get_db_session
    from app.api.deps.services import get_moodle_client
    from app.clients.exceptions import MoodleAPIError

    class FakeMoodleClient:
        def __init__(self) -> None:
            self.wstoken: str | None = None

        async def auth(self, username: str, password: str, service: str = "moodle_mobile_app") -> str:
            if password.startswith("invalid"):
                raise MoodleAPIError("invalid login")
            self.wstoken = "test-token"
            return self.wstoken

        async def get_current_user(self):
            if not self.wstoken or self.wstoken == "invalid":
                raise MoodleAPIError("Invalid wstoken")
            return {
                "userid": 1001,
                "username": "test.user",
                "fullname": "Test User",
                "email": "test.user@example.com",
            }

        async def get_user_courses(self, user_id: int):
            return [
                {
                    "id": 1,
                    "fullname": "Intro to Testing",
                    "shortname": "TEST101",
                    "summary": "<p>Test course</p>",
                    "startdate": 0,
                    "enddate": 0,
                }
            ]

        async def aclose(self) -> None:
            return None

    async def override_get_db_session():
        yield db_session

    def override_get_moodle_client() -> FakeMoodleClient:
        return FakeMoodleClient()

    application = create_app()
    application.dependency_overrides[get_db_session] = override_get_db_session
    application.dependency_overrides[get_moodle_client] = override_get_moodle_client

    yield application
    application.dependency_overrides.clear()


@pytest_asyncio.fixture
async def client(app):
    """Async HTTP client for FastAPI app."""
    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as http_client:
        yield http_client