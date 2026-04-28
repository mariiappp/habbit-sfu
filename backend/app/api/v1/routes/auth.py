"""Authentication endpoints for Moodle integration."""
from fastapi import APIRouter, HTTPException, status

from app.api.deps import UserServiceDep
from app.clients.exceptions import MoodleAPIError, MoodleAuthError
from app.domain.schemas.auth import MoodleAuthRequest, MoodleAuthResponse, AuthError

router = APIRouter(tags=["auth"])


@router.post(
    "/auth/moodle",
    response_model=MoodleAuthResponse,
    status_code=status.HTTP_200_OK,
    responses={
        400: {"model": AuthError, "description": "Invalid request format"},
        401: {"model": AuthError, "description": "Authentication failed"},
        502: {"model": AuthError, "description": "Moodle API unavailable"},
    },
)
async def authenticate_moodle(
    credentials: MoodleAuthRequest,
    service: UserServiceDep,
) -> MoodleAuthResponse:
    """Authenticate user against Moodle, sync local DB, and return wstoken.

    Proxies Moodle's /login/token.php, upserts local user record,
    and returns a token for subsequent API calls.

    Security note: Tokens are NOT stored server-side. Client is responsible
    for secure token storage (e.g., httpOnly cookie, secure localStorage).
    """
    try:
        result = await service.authenticate(
            username=credentials.username,
            password=credentials.password,
            service=credentials.service,
        )
        return MoodleAuthResponse(access_token=result["access_token"])

    except MoodleAuthError as exc:
        error_msg = str(exc).lower()
        if "invalid login" in error_msg or "credentials" in error_msg:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail=AuthError(
                    error="invalid_credentials",
                    error_description="Username or password is incorrect",
                ).model_dump(),
            )
        raise HTTPException(
            status_code=status.HTTP_502_BAD_GATEWAY,
            detail=AuthError(
                error="moodle_auth_failed",
                error_description=str(exc),
            ).model_dump(),
        )

    except MoodleAPIError as exc:
        raise HTTPException(
            status_code=status.HTTP_502_BAD_GATEWAY,
            detail=AuthError(
                error="moodle_unavailable",
                error_description=f"Moodle API error: {exc}",
            ).model_dump(),
        )