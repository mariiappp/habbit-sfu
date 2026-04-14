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
        resp = await client.post(f"{self.base_url}/login/token.php", data=payload)
        resp.raise_for_status()
        data = resp.json()

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
        resp = await client.post(f"{self.base_url}/webservice/rest/server.php", data=payload)
        resp.raise_for_status()
        data = resp.json()

        if isinstance(data, dict) and "exception" in data:
            raise MoodleAPIError(data.get("message", "Unknown Moodle error"))
        return data

    async def get_current_user(self) -> dict[str, Any]:
        """Fetch authenticated user profile (core_webservice_get_site_info)."""
        return await self.request("core_webservice_get_site_info")

    async def get_user_courses(self, user_id: int) -> list[dict[str, Any]]:
        """Fetch enrolled courses for a user (core_enrol_get_users_courses)."""
        return await self.request("core_enrol_get_users_courses", {"userid": user_id})

    async def aclose(self) -> None:
        """Close HTTP client if we own it."""
        if self._owns_http_client and self._http and not self._http.is_closed:
            await self._http.aclose()