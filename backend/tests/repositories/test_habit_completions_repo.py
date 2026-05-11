"""Repository tests for habit completions."""
from datetime import date, timedelta

from app.domain.models.habits import HabitRecurrence
from app.repositories.habit_completions import HabitCompletionRepository
from app.repositories.habits import HabitRepository
from app.repositories.users import UserRepository


async def test_completion_flow(db_session):
    users = UserRepository(session=db_session)
    habits = HabitRepository(session=db_session)
    completions = HabitCompletionRepository(session=db_session)

    user = await users.create(
        moodle_id=201,
        username="tester",
        fullname="Tester",
        email=None,
        is_active=True,
    )
    habit = await habits.create(
        user_id=user.id,
        title="Workout",
        description=None,
        recurrence=HabitRecurrence.DAILY,
    )

    completion = await completions.create(
        habit_id=habit.id,
        user_id=user.id,
        note="done",
    )
    today = date.today()
    found_today = await completions.get_today(habit.id, user.id)
    assert found_today is not None
    assert found_today.id == completion.id

    recent = await completions.get_recent(habit.id, user.id, limit=10)
    assert len(recent) == 1

    in_range = await completions.get_in_range(
        habit.id,
        user.id,
        start_date=today - timedelta(days=1),
        end_date=today + timedelta(days=1),
    )
    assert len(in_range) == 1

    deleted = await completions.delete(completion.id, user.id)
    assert deleted is True
