"""Home dashboard endpoints."""
from datetime import date as date_type

from fastapi import APIRouter, HTTPException, status

from app.api.deps import MoodleTokenDep
from app.api.deps.services import DashboardServiceDep
from app.clients.exceptions import MoodleAPIError
from app.domain.schemas.dashboard import HomeDashboardResponse
from app.services.dashboard import MoodleProfileError

router = APIRouter()


def raise_moodle_error(exc: MoodleAPIError) -> None:
    """Normalize Moodle errors to HTTP responses."""
    message = str(exc).lower()
    if "invalid token" in message or "invalid wstoken" in message:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail={
                "error": "invalid_token",
                "error_description": "Token is invalid or expired",
            },
        )
    raise HTTPException(
        status_code=status.HTTP_502_BAD_GATEWAY,
        detail={
            "error": "moodle_unavailable",
            "error_description": f"Moodle API error: {exc}",
        },
    )


def raise_domain_error(exc: Exception) -> None:
    if isinstance(exc, MoodleProfileError):
        raise HTTPException(
            status_code=status.HTTP_502_BAD_GATEWAY,
            detail={
                "error": "moodle_profile_invalid",
                "error_description": str(exc),
            },
        )
    raise exc


@router.get(
    "/dashboard/home",
    response_model=HomeDashboardResponse,
    status_code=status.HTTP_200_OK,
)
async def get_home_dashboard(
    token: MoodleTokenDep,
    service: DashboardServiceDep,
    date: date_type | None = None,
) -> HomeDashboardResponse:
    """Return aggregated data for the home screen."""
    target_date = date or date_type.today()
    try:
        payload = await service.get_home_dashboard(
            token=token,
            target_date=target_date,
        )
        return HomeDashboardResponse(**payload)
    except MoodleAPIError as exc:
        raise_moodle_error(exc)
    except Exception as exc:
        raise_domain_error(exc)
    finally:
        await service.close()
