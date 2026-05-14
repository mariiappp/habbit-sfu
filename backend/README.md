## Backend API

FastAPI backend for a habit and deadline tracking platform with Moodle integration.

### Tech stack

- FastAPI
- SQLAlchemy (async)
- PostgreSQL (prod), SQLite (tests)
- Alembic
- httpx
- Poetry

### Project structure

- app/api: HTTP routes and dependencies
- app/clients: external clients (Moodle)
- app/core: settings
- app/db: async DB session
- app/domain: ORM models and Pydantic schemas
- app/repositories: data access layer
- app/services: business logic
- tests: API, service, repository, client tests

### Configuration

All settings come from environment variables (prefix `APP_`). Common ones:

- `APP_PROJECT_NAME`
- `APP_VERSION`
- `APP_API_V1_PREFIX`
- `APP_DATABASE_URL`
- `APP_DEBUG`
- `APP_MOODLE_URL`

Example `.env`:

```
APP_PROJECT_NAME=Habbit SFU API
APP_VERSION=0.1.0
APP_API_V1_PREFIX=/api/v1
APP_DATABASE_URL=postgresql+asyncpg://user:password@localhost:5432/appdb
APP_DEBUG=false
APP_MOODLE_URL=https://e.sfu-kras.ru
```

### Models

- **User**: local user linked to Moodle (`moodle_id`, `username`, `fullname`, `email`, `is_active`).
- **Habit**: habit owned by a user (`title`, `description`, `recurrence`).
- **HabitCompletion**: completion event (`completed_at`, `note`).
- **DailyAdvice**: per-user advice by date (`advice_date`, `content`).

### Services

- **UserService**: Moodle auth and user sync.
- **HabitService**: habit CRUD, completion tracking, calendar history.

### API endpoints

Base prefix: `/api/v1`

Auth:
- `POST /auth/moodle`

Health:
- `GET /health`

Moodle:
- `GET /moodle/courses?wstoken=...`

Habits:
- `POST /habits?wstoken=...`
- `GET /habits?wstoken=...`
- `GET /habits/{habit_id}?wstoken=...`
- `PATCH /habits/{habit_id}?wstoken=...`
- `DELETE /habits/{habit_id}?wstoken=...`
- `POST /habits/{habit_id}/completions?wstoken=...`
- `GET /habits/{habit_id}/completions?wstoken=...&limit=30`
- `DELETE /habits/{habit_id}/completions/{completion_id}?wstoken=...`
- `GET /habits/{habit_id}/history?wstoken=...&start_date=YYYY-MM-DD&end_date=YYYY-MM-DD`

### Auth model

The API uses Moodle `wstoken` passed as query parameter `wstoken`.

### Run locally

```
poetry install --with dev --no-interaction --no-ansi
poetry run uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
```

### Migrations

```
poetry run alembic upgrade head
```

### Tests

```
poetry run pytest -q
```

### Example request

```
curl -X POST "http://localhost:8000/api/v1/habits?wstoken=TOKEN" \
	-H "accept: application/json" \
	-H "Content-Type: application/json" \
	-d '{"title":"Read","description":"Daily","recurrence":"daily"}'
```
