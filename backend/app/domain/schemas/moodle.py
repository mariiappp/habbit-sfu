"""Schemas for Moodle API responses."""
from pydantic import BaseModel, Field


class MoodleCourse(BaseModel):
    """Course item returned by Moodle core_enrol_get_users_courses."""
    id: int = Field(..., description="Course ID")
    fullname: str | None = Field(default=None, description="Full course name")
    shortname: str | None = Field(default=None, description="Short course name")
    summary: str | None = Field(default=None, description="Course summary (HTML)")
    startdate: int | None = Field(default=None, description="Course start date (Unix timestamp)")
    enddate: int | None = Field(default=None, description="Course end date (Unix timestamp)")

    model_config = {"extra": "ignore"}
