"""Service tests for user authentication."""
from app.clients.exceptions import MoodleAPIError
from app.services.users import UserService


class FakeMoodleClient:
    def __init__(self) -> None:
        self.wstoken = None

    async def auth(self, username: str, password: str, service: str = "moodle_mobile_app") -> str:
        if password == "invalid":
            raise MoodleAPIError("invalid login")
        self.wstoken = "token"
        return self.wstoken

    async def get_current_user(self):
        return {
            "userid": 555,
            "username": "tester",
            "fullname": "Tester",
            "email": "tester@example.com",
        }


async def test_authenticate(db_session):
    from app.repositories.users import UserRepository

    service = UserService(repo=UserRepository(session=db_session), moodle=FakeMoodleClient())
    result = await service.authenticate("tester", "ok")
    assert result["access_token"] == "token"


async def test_authenticate_invalid(db_session):
    from app.repositories.users import UserRepository

    service = UserService(repo=UserRepository(session=db_session), moodle=FakeMoodleClient())
    try:
        await service.authenticate("tester", "invalid")
    except MoodleAPIError:
        assert True
    else:
        assert False
