"""Moodle 3.9 async API client."""
from typing import Any

import httpx

from app.clients.exceptions import MoodleAPIError


class MoodleClient:
    """Async Moodle REST client with per-user authentication."""

    def __init__(
        self,
        base_url: str,
        wstoken: str | None = None,
        http_client: httpx.AsyncClient | None = None,
    ) -> None:
        self.base_url = base_url.rstrip("/")
        self.wstoken = wstoken
        self._http = http_client
        self._owns_http_client = http_client is None

    async def _get_http_client(self) -> httpx.AsyncClient:
        """Lazy-initialize httpx client if not injected."""
        if self._http is None:
            self._http = httpx.AsyncClient(
                timeout=15.0,
                follow_redirects=True,
                limits=httpx.Limits(max_connections=10, max_keepalive_connections=5),
            )
        return self._http

    async def auth(self, username: str, password: str, service: str = "moodle_mobile_app") -> str:
        """Authenticate user and cache wstoken."""
        client = await self._get_http_client()
        payload = {
            "username": username,
            "password": password,
            "service": service,
        }
        try:
            resp = await client.post(f"{self.base_url}/login/token.php", data=payload)
            resp.raise_for_status()
            data = resp.json()
        except httpx.HTTPError as exc:
            raise MoodleAPIError(f"Moodle auth HTTP error: {exc}") from exc
        except ValueError as exc:
            raise MoodleAPIError("Moodle auth returned non-JSON response") from exc

        if "error" in data:
            raise MoodleAPIError(f"Moodle auth failed: {data['error']}")
        if "token" not in data:
            raise MoodleAPIError("Moodle auth returned no token")

        self.wstoken = data["token"]
        return self.wstoken

    async def request(self, function: str, params: dict[str, Any] | None = None) -> dict[str, Any]:
        """Execute Moodle REST function with wstoken."""
        if not self.wstoken:
            raise MoodleAPIError("wstoken not set. Call auth() first")

        client = await self._get_http_client()
        payload = {
            "wstoken": self.wstoken,
            "wsfunction": function,
            "moodlewsrestformat": "json",
            **(params or {}),
        }
        try:
            resp = await client.post(f"{self.base_url}/webservice/rest/server.php", data=payload)
            resp.raise_for_status()
            data = resp.json()
        except httpx.HTTPError as exc:
            raise MoodleAPIError(f"Moodle API HTTP error: {exc}") from exc
        except ValueError as exc:
            raise MoodleAPIError("Moodle API returned non-JSON response") from exc

        if isinstance(data, dict) and "exception" in data:
            raise MoodleAPIError(data.get("message", "Unknown Moodle error"))
        return data

    async def get_current_user(self) -> dict[str, Any]:
        """Fetch authenticated user profile (core_webservice_get_site_info)."""
        return await self.request("core_webservice_get_site_info")

    async def get_user_courses(self, user_id: int) -> list[dict[str, Any]]:
        """Fetch enrolled courses for a user (core_enrol_get_users_courses)."""
        return await self.request("core_enrol_get_users_courses", {"userid": user_id})

    async def get_users_by_field(self, field: str, values: list[str]) -> list[dict[str, Any]]:
        """Fetch users by field (core_user_get_users_by_field)."""
        if not values:
            return []
        params: dict[str, Any] = {"field": field}
        for index, value in enumerate(values):
            params[f"values[{index}]"] = value
        return await self.request("core_user_get_users_by_field", params)

    async def get_courses(self, course_ids: list[int] | None = None) -> list[dict[str, Any]]:
        """Fetch courses by ids or all courses (core_course_get_courses)."""
        params: dict[str, Any] = {}
        if course_ids:
            for index, course_id in enumerate(course_ids):
                params[f"options[ids][{index}]"] = course_id
        return await self.request("core_course_get_courses", params)

    async def aclose(self) -> None:
        """Close HTTP client if we own it."""
        if self._owns_http_client and self._http and not self._http.is_closed:
            await self._http.aclose()

    async def get_submission_status(self, assign_id: int) -> dict[str, Any]:
        """Fetch submission status for current user (mod_assign_get_submission_status)."""
        return await self.request(
            "mod_assign_get_submission_status",
            {"assignid": assign_id},
        )

    async def get_submissions(self, assignment_ids: list[int]) -> dict[str, Any]:
        """Fetch submissions for assignments (mod_assign_get_submissions)."""
        params: dict[str, Any] = {}
        for index, assignment_id in enumerate(assignment_ids):
            params[f"assignmentids[{index}]"] = assignment_id
        return await self.request("mod_assign_get_submissions", params)

    async def get_grades_table(self, course_id: int, user_id: int | None = None) -> dict[str, Any]:
        """Fetch grade table for a user in course (gradereport_user_get_grades_table)."""
        params: dict[str, Any] = {"courseid": course_id}
        if user_id is not None:
            params["userid"] = user_id
        return await self.request("gradereport_user_get_grades_table", params)

    async def get_grades(
        self,
        course_id: int,
        component: str,
        activity_id: int,
        user_ids: list[int] | None = None,
        group_id: int | None = None,
    ) -> dict[str, Any]:
        """Fetch grades for a specific activity (core_grades_get_grades)."""
        params: dict[str, Any] = {
            "courseid": course_id,
            "component": component,
            "activityid": activity_id,
        }
        if user_ids:
            for index, user_id in enumerate(user_ids):
                params[f"userids[{index}]"] = user_id
        if group_id is not None:
            params["groupid"] = group_id
        return await self.request("core_grades_get_grades", params)

    async def get_calendar_events(
        self,
        course_ids: list[int] | None = None,
        group_ids: list[int] | None = None,
        user_ids: list[int] | None = None,
        time_from: int | None = None,
        time_to: int | None = None,
        include_site_events: bool | None = None,
        include_user_events: bool | None = None,
        include_group_events: bool | None = None,
    ) -> dict[str, Any]:
        """Fetch calendar events (core_calendar_get_calendar_events)."""
        params: dict[str, Any] = {}
        if course_ids:
            for index, course_id in enumerate(course_ids):
                params[f"events[courseids][{index}]"] = course_id
        if group_ids:
            for index, group_id in enumerate(group_ids):
                params[f"events[groupids][{index}]"] = group_id
        if user_ids:
            for index, user_id in enumerate(user_ids):
                params[f"events[userids][{index}]"] = user_id

        options: dict[str, Any] = {}
        if time_from is not None:
            options["timefrom"] = time_from
        if time_to is not None:
            options["timeuntil"] = time_to
        if include_site_events is not None:
            options["siteevents"] = int(include_site_events)
        if include_user_events is not None:
            options["userevents"] = int(include_user_events)
        if include_group_events is not None:
            options["groupevents"] = int(include_group_events)
        for key, value in options.items():
            params[f"options[{key}]"] = value

        return await self.request("core_calendar_get_calendar_events", params)

    async def get_course_updates_since(self, course_id: int, since: int) -> dict[str, Any]:
        """Fetch course updates since timestamp (core_course_get_updates_since)."""
        return await self.request(
            "core_course_get_updates_since",
            {"courseid": course_id, "since": since},
        )

    async def get_messages(
        self,
        user_id_to: int,
        user_id_from: int | None = None,
        message_type: str | None = None,
        read: bool | None = None,
        newest_first: bool | None = None,
        limit_from: int | None = None,
        limit_num: int | None = None,
    ) -> dict[str, Any]:
        """Fetch messages for a user (core_message_get_messages)."""
        params: dict[str, Any] = {"useridto": user_id_to}
        if user_id_from is not None:
            params["useridfrom"] = user_id_from
        if message_type is not None:
            params["type"] = message_type
        if read is not None:
            params["read"] = int(read)
        if newest_first is not None:
            params["newestfirst"] = int(newest_first)
        if limit_from is not None:
            params["limitfrom"] = limit_from
        if limit_num is not None:
            params["limitnum"] = limit_num
        return await self.request("core_message_get_messages", params)
