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

    async def get_users_by_field(
        self,
        token: str,
        field: str,
        values: list[str],
    ) -> list[dict[str, Any]]:
        await self._set_token(token)
        return await self.moodle.get_users_by_field(field=field, values=values)

    async def get_courses(
        self,
        token: str,
        course_ids: list[int] | None,
    ) -> list[dict[str, Any]]:
        await self._set_token(token)
        return await self.moodle.get_courses(course_ids=course_ids)

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

    async def get_submission_status(self, token: str, assignment_id: int) -> dict[str, Any]:
        await self._set_token(token)
        return await self.moodle.get_submission_status(assign_id=assignment_id)

    async def get_submissions(self, token: str, assignment_ids: list[int]) -> dict[str, Any]:
        await self._set_token(token)
        return await self.moodle.get_submissions(assignment_ids)

    async def get_calendar_events(
        self,
        token: str,
        course_ids: list[int] | None,
        group_ids: list[int] | None,
        user_ids: list[int] | None,
        time_from: int | None,
        time_to: int | None,
        include_site_events: bool | None,
        include_user_events: bool | None,
        include_group_events: bool | None,
    ) -> dict[str, Any]:
        await self._set_token(token)
        return await self.moodle.get_calendar_events(
            course_ids=course_ids,
            group_ids=group_ids,
            user_ids=user_ids,
            time_from=time_from,
            time_to=time_to,
            include_site_events=include_site_events,
            include_user_events=include_user_events,
            include_group_events=include_group_events,
        )

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

    async def get_grades_table(
        self,
        token: str,
        course_id: int,
        user_id: int | None,
    ) -> dict[str, Any]:
        await self._set_token(token)
        if user_id is None:
            profile = await self.moodle.get_current_user()
            user_id = profile.get("userid")
            if not user_id:
                raise ValueError("Moodle profile has no user id")
        return await self.moodle.get_grades_table(course_id=course_id, user_id=user_id)

    async def get_grades(
        self,
        token: str,
        course_id: int,
        component: str,
        activity_id: int,
        user_ids: list[int] | None,
        group_id: int | None,
    ) -> dict[str, Any]:
        await self._set_token(token)
        return await self.moodle.get_grades(
            course_id=course_id,
            component=component,
            activity_id=activity_id,
            user_ids=user_ids,
            group_id=group_id,
        )

    async def get_course_updates_since(self, token: str, course_id: int, since: int) -> dict[str, Any]:
        await self._set_token(token)
        return await self.moodle.get_course_updates_since(course_id=course_id, since=since)

    async def get_messages(
        self,
        token: str,
        user_id_to: int,
        user_id_from: int | None,
        message_type: str | None,
        read: bool | None,
        newest_first: bool | None,
        limit_from: int | None,
        limit_num: int | None,
    ) -> dict[str, Any]:
        await self._set_token(token)
        return await self.moodle.get_messages(
            user_id_to=user_id_to,
            user_id_from=user_id_from,
            message_type=message_type,
            read=read,
            newest_first=newest_first,
            limit_from=limit_from,
            limit_num=limit_num,
        )
