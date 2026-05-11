"""Schemas for habits and completion history."""
from datetime import date, datetime

from pydantic import BaseModel, Field

from app.domain.models.habits import HabitRecurrence


class HabitCreateRequest(BaseModel):
    """Request to create a habit."""
    title: str = Field(..., min_length=1, max_length=100, description="Habit title")
    description: str | None = Field(default=None, max_length=500, description="Habit description")
    recurrence: HabitRecurrence = Field(default=HabitRecurrence.DAILY, description="Recurrence type")


class HabitUpdateRequest(BaseModel):
    """Request to update a habit."""
    title: str | None = Field(default=None, min_length=1, max_length=100)
    description: str | None = Field(default=None, max_length=500)
    recurrence: HabitRecurrence | None = Field(default=None)


class HabitResponse(BaseModel):
    """Habit response schema."""
    id: int
    user_id: int
    title: str
    description: str | None
    recurrence: HabitRecurrence
    created_at: datetime
    updated_at: datetime

    model_config = {"from_attributes": True}


class HabitCompletionCreateRequest(BaseModel):
    """Request to mark a habit as completed."""
    note: str | None = Field(default=None, max_length=500, description="Optional completion note")


class HabitCompletionResponse(BaseModel):
    """Completion response schema."""
    id: int
    habit_id: int
    user_id: int
    completed_at: datetime
    note: str | None

    model_config = {"from_attributes": True}


class HabitHistoryDay(BaseModel):
    """Calendar day status for a habit."""
    date: date
    completed: bool
    completion_id: int | None = None


class HabitHistoryResponse(BaseModel):
    """Calendar history response for a habit."""
    habit_id: int
    recurrence: HabitRecurrence
    start_date: date
    end_date: date
    days: list[HabitHistoryDay]
