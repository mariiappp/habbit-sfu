"""Moodle data endpoints (token-protected)."""
from fastapi import APIRouter, HTTPException, status

from app.api.deps.auth import MoodleTokenDep
from app.api.deps.services import MoodleClientDep
from app.clients.exceptions import MoodleAPIError
from app.domain.schemas.moodle import MoodleCourse

router = APIRouter()


@router.get(
    "/moodle/courses",
    response_model=list[MoodleCourse],
    status_code=status.HTTP_200_OK,
    responses={
        401: {
            "description": "Missing or invalid token",
        },
        502: {
            "description": "Moodle API unavailable",
        },
    },
)
async def get_user_courses(
    token: MoodleTokenDep,
    moodle: MoodleClientDep,
) -> list[MoodleCourse]:
    """Return Moodle courses for the authenticated user."""
    moodle.wstoken = token
    try:
        profile = await moodle.get_current_user()
        user_id = profile.get("userid")
        if not user_id:
            raise HTTPException(
                status_code=status.HTTP_502_BAD_GATEWAY,
                detail={
                    "error": "moodle_profile_invalid",
                    "error_description": "Moodle profile has no user id",
                },
            )
        courses = await moodle.get_user_courses(user_id)
        return [MoodleCourse.model_validate(item) for item in courses]
    except MoodleAPIError as exc:
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
    finally:
        await moodle.aclose()
