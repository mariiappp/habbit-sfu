"""Schemas for user streak responses."""
from datetime import date

from pydantic import BaseModel, Field


class StreakResponse(BaseModel):
    """Streak response payload."""

    current_streak: int = Field(default=0, ge=0)
    last_streak_date: date | None = None

    model_config = {
        "json_schema_extra": {
            "examples": [
                {"current_streak": 3, "last_streak_date": "2026-05-25"}
            ]
        }
    }
