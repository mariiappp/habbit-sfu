"""Unit tests for Moodle client."""
import httpx
import pytest

from app.clients.exceptions import MoodleAPIError
from app.clients.moodle import MoodleClient


@pytest.mark.asyncio
async def test_auth_success():
    async def handler(request: httpx.Request) -> httpx.Response:
        return httpx.Response(200, json={"token": "abc"})

    transport = httpx.MockTransport(handler)
    async with httpx.AsyncClient(transport=transport, base_url="https://example.test") as http_client:
        client = MoodleClient(base_url="https://example.test", http_client=http_client)
        token = await client.auth("user", "pass")
        assert token == "abc"


@pytest.mark.asyncio
async def test_auth_error():
    async def handler(request: httpx.Request) -> httpx.Response:
        return httpx.Response(200, json={"error": "invalid"})

    transport = httpx.MockTransport(handler)
    async with httpx.AsyncClient(transport=transport, base_url="https://example.test") as http_client:
        client = MoodleClient(base_url="https://example.test", http_client=http_client)
        with pytest.raises(MoodleAPIError):
            await client.auth("user", "pass")


@pytest.mark.asyncio
async def test_request_success():
    async def handler(request: httpx.Request) -> httpx.Response:
        return httpx.Response(200, json={"userid": 1})

    transport = httpx.MockTransport(handler)
    async with httpx.AsyncClient(transport=transport, base_url="https://example.test") as http_client:
        client = MoodleClient(base_url="https://example.test", wstoken="token", http_client=http_client)
        data = await client.request("core_webservice_get_site_info")
        assert data["userid"] == 1


@pytest.mark.asyncio
async def test_request_exception():
    async def handler(request: httpx.Request) -> httpx.Response:
        return httpx.Response(200, json={"exception": "invalidtoken", "message": "Invalid token"})

    transport = httpx.MockTransport(handler)
    async with httpx.AsyncClient(transport=transport, base_url="https://example.test") as http_client:
        client = MoodleClient(base_url="https://example.test", wstoken="token", http_client=http_client)
        with pytest.raises(MoodleAPIError):
            await client.request("core_webservice_get_site_info")
