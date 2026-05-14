"""Moodle integration service layer."""
from __future__ import annotations

from typing import Any

from app.clients.moodle import MoodleClient


class MoodleService:
    """Service for Moodle data retrieval via wstoken."""

    def __init__(self, moodle: MoodleClient) -> None:
        self.moodle = moodle

    async def close(self) -> None:
        """Close underlying HTTP client if owned."""
        await self.moodle.aclose()

    async def _set_token(self, token: str) -> None:
        self.moodle.wstoken = token

    async def get_current_user(self, token: str) -> dict[str, Any]:
        await self._set_token(token)
        return await self.moodle.get_current_user()

    async def get_user_courses(self, token: str) -> list[dict[str, Any]]:
        await self._set_token(token)
        profile = await self.moodle.get_current_user()
        user_id = profile.get("userid")
        if not user_id:
            raise ValueError("Moodle profile has no user id")
        return await self.moodle.get_user_courses(user_id)

    async def get_course_contents(self, token: str, course_id: int) -> list[dict[str, Any]]:
        await self._set_token(token)
        return await self.moodle.request(
            "core_course_get_contents",
            {"courseid": course_id},
        )

    async def get_completion_status(self, token: str, course_id: int) -> dict[str, Any]:
        await self._set_token(token)
        profile = await self.moodle.get_current_user()
        user_id = profile.get("userid")
        if not user_id:
            raise ValueError("Moodle profile has no user id")
        return await self.moodle.request(
            "core_completion_get_activities_completion_status",
            {"courseid": course_id, "userid": user_id},
        )

    async def get_assignments(self, token: str, course_ids: list[int] | None) -> dict[str, Any]:
        await self._set_token(token)
        params: dict[str, Any] = {}
        if course_ids:
            for index, course_id in enumerate(course_ids):
                params[f"courseids[{index}]"] = course_id
        return await self.moodle.request("mod_assign_get_assignments", params)

    async def get_calendar_events(
        self,
        token: str,
        time_from: int | None,
        time_to: int | None,
        limit_from: int | None,
        limit_num: int | None,
    ) -> dict[str, Any]:
        await self._set_token(token)
        params: dict[str, Any] = {}
        if time_from is not None:
            params["timesortfrom"] = time_from
        if time_to is not None:
            params["timesortto"] = time_to
        if limit_from is not None:
            params["limitfrom"] = limit_from
        if limit_num is not None:
            params["limitnum"] = limit_num
        return await self.moodle.request("core_calendar_get_action_events_by_timesort", params)

    async def get_grade_items(self, token: str, course_id: int) -> dict[str, Any]:
        await self._set_token(token)
        profile = await self.moodle.get_current_user()
        user_id = profile.get("userid")
        if not user_id:
            raise ValueError("Moodle profile has no user id")
        return await self.moodle.request(
            "gradereport_user_get_grade_items",
            {"courseid": course_id, "userid": user_id},
        )

    async def get_course_grades(self, token: str) -> dict[str, Any]:
        await self._set_token(token)
        profile = await self.moodle.get_current_user()
        user_id = profile.get("userid")
        if not user_id:
            raise ValueError("Moodle profile has no user id")
        return await self.moodle.request(
            "gradereport_overview_get_course_grades",
            {"userid": user_id},
        )
