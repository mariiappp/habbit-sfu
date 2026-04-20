"""Authentication endpoints for Moodle integration."""
from fastapi import APIRouter, Depends, HTTPException, status

from app.clients.moodle import MoodleClient
from app.clients.exceptions import MoodleAPIError
from app.core.config import settings
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
) -> MoodleAuthResponse:
    """Authenticate user against Moodle and return wstoken.

    This endpoint proxies Moodle's /login/token.php and returns
    a token that can be used in X-Moodle-Token header for subsequent requests.

    Security note: Tokens are NOT stored server-side. Client is responsible
    for secure token storage (e.g., httpOnly cookie, secure localStorage).
    """
    # Create lightweight client for auth (no shared pool needed for single call)
    moodle = MoodleClient(base_url=settings.moodle_url)

    try:
        # Call Moodle auth endpoint → get wstoken
        wstoken = await moodle.auth(
            username=credentials.username,
            password=credentials.password,
            service=credentials.service,
        )

        # Return token to client
        return MoodleAuthResponse(access_token=wstoken)

    except MoodleAPIError as exc:
        # Map Moodle errors to HTTP 401
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
                error="moodle_unavailable",
                error_description=f"Moodle API error: {exc}",
            ).model_dump(),
        )
    finally:
        # Ensure HTTP client is closed if we created it internally
        await moodle.aclose()