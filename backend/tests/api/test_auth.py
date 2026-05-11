"""API tests for auth endpoint."""


async def test_auth_moodle_success(client):
    payload = {
        "username": "test.user",
        "password": "goodpass",
        "service": "moodle_mobile_app",
    }
    resp = await client.post("/api/v1/auth/moodle", json=payload)
    assert resp.status_code == 200
    body = resp.json()
    assert body["access_token"] == "test-token"


async def test_auth_moodle_invalid_password(client):
    payload = {
        "username": "test.user",
        "password": "invalid8",
        "service": "moodle_mobile_app",
    }
    resp = await client.post("/api/v1/auth/moodle", json=payload)
    assert resp.status_code == 502
