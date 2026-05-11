"""Repository tests for habits."""
from app.domain.models.habits import HabitRecurrence
from app.repositories.habits import HabitRepository
from app.repositories.users import UserRepository


async def test_habit_crud(db_session):
    users = UserRepository(session=db_session)
    habits = HabitRepository(session=db_session)

    user = await users.create(
        moodle_id=101,
        username="tester",
        fullname="Tester",
        email=None,
        is_active=True,
    )

    habit = await habits.create(
        user_id=user.id,
        title="Read",
        description="Read daily",
        recurrence=HabitRecurrence.DAILY,
    )
    fetched = await habits.get_by_id(habit.id, user_id=user.id)
    assert fetched is not None
    assert fetched.title == "Read"

    updated = await habits.update(habit, {"title": "Read more"})
    assert updated.title == "Read more"

    all_for_user = await habits.get_all_by_user(user.id)
    assert len(all_for_user) == 1

    await habits.delete(habit)
    missing = await habits.get_by_id(habit.id, user_id=user.id)
    assert missing is None
