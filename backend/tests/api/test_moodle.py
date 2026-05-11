"""API tests for Moodle endpoints."""


async def test_moodle_courses(client):
    resp = await client.get("/api/v1/moodle/courses", params={"wstoken": "test-token"})
    assert resp.status_code == 200
    courses = resp.json()
    assert len(courses) == 1
    assert courses[0]["shortname"] == "TEST101"
