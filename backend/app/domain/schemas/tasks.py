"""Schemas for task API."""
from datetime import date, datetime

from pydantic import BaseModel, Field


class TaskCreateRequest(BaseModel):
    """Request to create a task."""

    title: str = Field(..., min_length=1, max_length=200)
    task_type: str | None = Field(default=None, max_length=120)
    subject: str | None = Field(default=None, max_length=200)
    deadline: date
    link: str | None = Field(default=None, max_length=1000)


class TaskUpdateRequest(BaseModel):
    """Request to update a task."""

    title: str | None = Field(default=None, min_length=1, max_length=200)
    task_type: str | None = Field(default=None, max_length=120)
    subject: str | None = Field(default=None, max_length=200)
    deadline: date | None = None
    link: str | None = Field(default=None, max_length=1000)
    is_done: bool | None = None


class TaskResponse(BaseModel):
    """Task response schema."""

    id: int
    user_id: int
    title: str
    task_type: str | None
    subject: str | None
    deadline: date
    link: str | None
    is_done: bool
    created_at: datetime
    updated_at: datetime

    model_config = {"from_attributes": True}
