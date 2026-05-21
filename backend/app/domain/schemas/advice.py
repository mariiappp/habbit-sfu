"""Schemas for daily advice responses."""
from datetime import date

from pydantic import BaseModel, Field


class DailyAdviceResponse(BaseModel):
    """Daily advice payload for the client."""

    text: str = Field(..., description="Advice text")
    progress: int = Field(default=0, ge=0, le=100, description="Progress percent")
    locked: bool = Field(default=False, description="Whether advice is locked")
    advice_date: date | None = Field(default=None, description="Date the advice applies to")
