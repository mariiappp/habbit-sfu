"""Health check response schemas.

Pydantic models for API contracts. Used for request/response validation
and automatic OpenAPI documentation generation.
"""
from pydantic import BaseModel, Field


class HealthResponse(BaseModel):
    """Response schema for health check endpoints."""
    status: str = Field(default="ok", description="Current operational status")
    version: str = Field(..., description="Application semantic version (SemVer)")
    environment: str = Field(..., description="Deployment environment (development/production)")

    model_config = {
        "json_schema_extra": {
            "examples": [
                {
                    "status": "ok",
                    "version": "1.0.0",
                    "environment": "production"
                }
            ]
        }
    }