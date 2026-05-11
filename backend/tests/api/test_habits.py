"""API tests for habit endpoints."""
from datetime import date


async def test_create_and_list_habits(client):
    token = "test-token"
    payload = {
        "title": "Read 10 pages",
        "description": "Daily reading",
        "recurrence": "daily",
    }

    create_resp = await client.post(
        "/api/v1/habits",
        params={"wstoken": token},
        json=payload,
    )
    assert create_resp.status_code == 201
    created = create_resp.json()
    assert created["title"] == payload["title"]
    assert created["recurrence"] == payload["recurrence"]

    list_resp = await client.get(
        "/api/v1/habits",
        params={"wstoken": token},
    )
    assert list_resp.status_code == 200
    items = list_resp.json()
    assert len(items) == 1
    assert items[0]["id"] == created["id"]


async def test_update_and_delete_habit(client):
    token = "test-token"
    create_resp = await client.post(
        "/api/v1/habits",
        params={"wstoken": token},
        json={"title": "Workout", "recurrence": "weekly"},
    )
    habit_id = create_resp.json()["id"]

    update_resp = await client.patch(
        f"/api/v1/habits/{habit_id}",
        params={"wstoken": token},
        json={"title": "Workout (updated)"},
    )
    assert update_resp.status_code == 200
    assert update_resp.json()["title"] == "Workout (updated)"

    delete_resp = await client.delete(
        f"/api/v1/habits/{habit_id}",
        params={"wstoken": token},
    )
    assert delete_resp.status_code == 204


async def test_completion_and_history(client):
    token = "test-token"
    create_resp = await client.post(
        "/api/v1/habits",
        params={"wstoken": token},
        json={"title": "Meditation", "recurrence": "daily"},
    )
    habit_id = create_resp.json()["id"]

    completion_resp = await client.post(
        f"/api/v1/habits/{habit_id}/completions",
        params={"wstoken": token},
        json={"note": "Done"},
    )
    assert completion_resp.status_code == 200

    list_resp = await client.get(
        f"/api/v1/habits/{habit_id}/completions",
        params={"wstoken": token},
    )
    assert list_resp.status_code == 200
    items = list_resp.json()
    assert len(items) == 1

    today = date.today().isoformat()
    history_resp = await client.get(
        f"/api/v1/habits/{habit_id}/history",
        params={"wstoken": token, "start_date": today, "end_date": today},
    )
    assert history_resp.status_code == 200
    history = history_resp.json()
    assert history["days"][0]["completed"] is True
