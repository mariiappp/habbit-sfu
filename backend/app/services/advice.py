"""Daily advice service layer."""
from __future__ import annotations

from datetime import date
from typing import Sequence

from app.clients.moodle import MoodleClient
from app.domain.models.users import User
from app.repositories.daily_advice import DailyAdviceRepository
from app.repositories.users import UserRepository


class MoodleProfileError(Exception):
    """Moodle profile response is invalid."""


class AdviceService:
    """Service for daily advice retrieval and storage."""

    def __init__(
        self,
        users: UserRepository,
        advice: DailyAdviceRepository,
        moodle: MoodleClient,
    ) -> None:
        self.users = users
        self.advice = advice
        self.moodle = moodle

    async def _resolve_user(self, token: str) -> tuple[User, dict]:
        self.moodle.wstoken = token
        profile = await self.moodle.get_current_user()
        moodle_id = profile.get("userid")
        if not moodle_id:
            raise MoodleProfileError("Moodle profile has no user id")
        user = await self.users.get_by_moodle_id(moodle_id)
        if user is None:
            user = await self.users.create(
                moodle_id=moodle_id,
                username=profile.get("username", str(moodle_id)),
                fullname=profile.get("fullname", str(moodle_id)),
                email=profile.get("email"),
                is_active=True,
            )
        return user, profile

    def _pick_tip(self, tips: Sequence[str], user_id: int, target_date: date) -> str:
        if not tips:
            return "Stay focused and keep a steady pace."
        seed = f"{user_id}-{target_date.isoformat()}"
        index = abs(hash(seed)) % len(tips)
        return tips[index]

    async def get_daily_advice(
        self,
        token: str,
        target_date: date,
        tips: Sequence[str] | None = None,
    ) -> dict:
        user, _profile = await self._resolve_user(token)

        existing = await self.advice.get_for_date(user.id, target_date)
        if existing:
            return {
                "text": existing.content,
                "progress": 0,
                "locked": False,
                "advice_date": existing.advice_date,
            }

        tip_list = tips or (
            "Work in short bursts to keep momentum.",
            "Prioritize the hardest task first.",
            "Review deadlines each morning.",
            "Focus on one task at a time.",
            "Take a short break after each sprint.",
        )
        content = self._pick_tip(tip_list, user.id, target_date)
        advice = await self.advice.upsert_for_date(user.id, target_date, content)

        return {
            "text": advice.content,
            "progress": 0,
            "locked": False,
            "advice_date": advice.advice_date,
        }

    async def close(self) -> None:
        await self.moodle.aclose()
