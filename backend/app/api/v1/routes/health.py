"""Health check endpoints for liveness and readiness probes.

Provides standard Kubernetes-compatible health endpoints.
"""
from fastapi import APIRouter, status

from pydantic import BaseModel, Field

from app.domain.schemas.health import HealthResponse
from app.core.config import settings

router = APIRouter()


@router.get(
    "/health",
    response_model=HealthResponse,
    status_code=status.HTTP_200_OK,
    tags=["health"],
    summary="Liveness probe",
    description="Returns basic application status. Used by orchestrators "
                "to determine if the container is running."
)
async def liveness_check() -> HealthResponse:
    """Basic liveness check endpoint."""
    return HealthResponse(
        status="ok",
        version=settings.version,
        environment="development" if settings.debug else "production",
    )
