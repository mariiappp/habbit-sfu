"""Repository tests for daily advice."""
from datetime import date, timedelta

from app.repositories.daily_advice import DailyAdviceRepository
from app.repositories.users import UserRepository


async def test_daily_advice_flow(db_session):
    users = UserRepository(session=db_session)
    advice_repo = DailyAdviceRepository(session=db_session)

    user = await users.create(
        moodle_id=301,
        username="tester",
        fullname="Tester",
        email=None,
        is_active=True,
    )
    today = date.today()
    advice = await advice_repo.create(user.id, today, "Stay focused")
    assert advice.content == "Stay focused"

    fetched = await advice_repo.get_today(user.id)
    assert fetched is not None

    updated = await advice_repo.upsert_for_date(user.id, today, "Updated")
    assert updated.content == "Updated"

    yesterday = today - timedelta(days=1)
    await advice_repo.create(user.id, yesterday, "Yesterday")
    history = await advice_repo.get_history(user.id, limit=10)
    assert history[0].advice_date == today
