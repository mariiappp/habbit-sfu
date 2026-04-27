"""Minimal integration tests for UserRepository."""
import asyncio
from app.repositories.users import UserRepository


def test_upsert_creates_new_user(user_repo: UserRepository):
    """Upsert should insert a new record when moodle_id is absent."""
    async def _run():
        user = await user_repo.upsert_on_auth(
            moodle_id=1001, username="test", fullname="Test User"
        )
        assert user.id is not None
        assert user.moodle_id == 1001
        assert user.username == "test"
    asyncio.run(_run())


def test_upsert_updates_existing_user(user_repo: UserRepository):
    """Upsert should update fields when moodle_id already exists."""
    async def _run():
        first = await user_repo.upsert_on_auth(moodle_id=2002, username="old", fullname="Old")
        second = await user_repo.upsert_on_auth(moodle_id=2002, username="new", fullname="New")
        assert second.id == first.id
        assert second.username == "new"
        assert second.fullname == "New"
    asyncio.run(_run())


def test_get_by_moodle_id_returns_none(user_repo: UserRepository):
    """Query should return None for non-existent moodle_id."""
    async def _run():
        result = await user_repo.get_by_moodle_id(9999)
        assert result is None
    asyncio.run(_run())