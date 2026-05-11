"""Service tests for habit logic."""
from datetime import date, timedelta

from app.clients.exceptions import MoodleAPIError
from app.domain.models.habits import HabitRecurrence
from app.services.habits import HabitService, InvalidDateRangeError


class FakeMoodleClient:
    def __init__(self) -> None:
        self.wstoken = None

    async def get_current_user(self):
        if not self.wstoken or self.wstoken == "invalid":
            raise MoodleAPIError("Invalid wstoken")
        return {
            "userid": 1001,
            "username": "test.user",
            "fullname": "Test User",
            "email": "test.user@example.com",
        }


async def test_create_and_history(db_session):
    from app.repositories.users import UserRepository
    from app.repositories.habits import HabitRepository
    from app.repositories.habit_completions import HabitCompletionRepository

    service = HabitService(
        users=UserRepository(session=db_session),
        habits=HabitRepository(session=db_session),
        completions=HabitCompletionRepository(session=db_session),
        moodle=FakeMoodleClient(),
    )

    habit = await service.create_habit(
        token="ok",
        title="Read 10 pages",
        description=None,
        recurrence=HabitRecurrence.DAILY,
    )

    completion = await service.complete_habit(
        token="ok",
        habit_id=habit.id,
        note="done",
    )
    assert completion.habit_id == habit.id

    today = date.today()
    history = await service.history(
        token="ok",
        habit_id=habit.id,
        start_date=today,
        end_date=today,
    )
    assert history.days[0].completed is True


async def test_invalid_date_range(db_session):
    from app.repositories.users import UserRepository
    from app.repositories.habits import HabitRepository
    from app.repositories.habit_completions import HabitCompletionRepository

    service = HabitService(
        users=UserRepository(session=db_session),
        habits=HabitRepository(session=db_session),
        completions=HabitCompletionRepository(session=db_session),
        moodle=FakeMoodleClient(),
    )

    habit = await service.create_habit(
        token="ok",
        title="Workout",
        description=None,
        recurrence=HabitRecurrence.DAILY,
    )

    start = date.today()
    end = start.replace() - timedelta(days=1)
    try:
        await service.history(token="ok", habit_id=habit.id, start_date=start, end_date=end)
    except InvalidDateRangeError:
        assert True
    else:
        assert False
