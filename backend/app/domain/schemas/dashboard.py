"""Schemas for home dashboard responses."""
from pydantic import BaseModel, Field

from app.domain.schemas.advice import DailyAdviceResponse


class DashboardUser(BaseModel):
    """Minimal user payload for the home dashboard."""

    firstName: str | None = None
    lastName: str | None = None


class DashboardCounters(BaseModel):
    """Done/total counters for dashboard tiles."""

    done: int = Field(default=0, ge=0)
    total: int = Field(default=0, ge=0)


class WeeklySummary(BaseModel):
    """Weekly summary cards on the home screen."""

    missedDeadlines: int = Field(default=0, ge=0)
    completedTasks: int = Field(default=0, ge=0)
    averageBalance: int = Field(default=0, ge=0, le=100)
    averageScreenTime: int = Field(default=0, ge=0)


class ProductivityPoint(BaseModel):
    """Single day productivity data point."""

    day: str
    value: int = Field(default=0, ge=0, le=100)
    dayIndex: int | None = Field(default=None, ge=0, le=6)


class HomeDashboardResponse(BaseModel):
    """Aggregated home dashboard response."""

    user: DashboardUser
    tasks: DashboardCounters
    habits: DashboardCounters
    weeklySummary: WeeklySummary
    productivityChart: list[ProductivityPoint]
    advice: DailyAdviceResponse | None = None
