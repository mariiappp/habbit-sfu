"""Moodle data endpoints (token-protected)."""
from fastapi import APIRouter, HTTPException, status

from app.api.deps.auth import MoodleTokenDep
from app.api.deps.services import MoodleServiceDep
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
    service: MoodleServiceDep,
) -> list[MoodleCourse]:
    """Return Moodle courses for the authenticated user."""
    try:
        courses = await service.get_user_courses(token=token)
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
        await service.close()


@router.get(
    "/moodle/courses/{course_id}/contents",
    response_model=list[dict],
    status_code=status.HTTP_200_OK,
)
async def get_course_contents(
    course_id: int,
    token: MoodleTokenDep,
    service: MoodleServiceDep,
) -> list[dict]:
    """Return course contents (sections and modules)."""
    try:
        return await service.get_course_contents(token=token, course_id=course_id)
    except MoodleAPIError as exc:
        raise HTTPException(
            status_code=status.HTTP_502_BAD_GATEWAY,
            detail={
                "error": "moodle_unavailable",
                "error_description": f"Moodle API error: {exc}",
            },
        )
    finally:
        await service.close()


@router.get(
    "/moodle/courses/{course_id}/completion-status",
    response_model=dict,
    status_code=status.HTTP_200_OK,
)
async def get_completion_status(
    course_id: int,
    token: MoodleTokenDep,
    service: MoodleServiceDep,
) -> dict:
    """Return completion status for activities in a course."""
    try:
        return await service.get_completion_status(token=token, course_id=course_id)
    except MoodleAPIError as exc:
        raise HTTPException(
            status_code=status.HTTP_502_BAD_GATEWAY,
            detail={
                "error": "moodle_unavailable",
                "error_description": f"Moodle API error: {exc}",
            },
        )
    finally:
        await service.close()


@router.get(
    "/moodle/assignments",
    response_model=dict,
    status_code=status.HTTP_200_OK,
)
async def get_assignments(
    token: MoodleTokenDep,
    service: MoodleServiceDep,
    course_ids: str | None = None,
) -> dict:
    """Return assignments, optionally filtered by course ids (comma-separated)."""
    try:
        parsed_ids = [int(item) for item in course_ids.split(",") if item] if course_ids else None
        return await service.get_assignments(token=token, course_ids=parsed_ids)
    except ValueError:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail={
                "error": "invalid_course_ids",
                "error_description": "course_ids must be comma-separated integers",
            },
        )
    except MoodleAPIError as exc:
        raise HTTPException(
            status_code=status.HTTP_502_BAD_GATEWAY,
            detail={
                "error": "moodle_unavailable",
                "error_description": f"Moodle API error: {exc}",
            },
        )
    finally:
        await service.close()


@router.get(
    "/moodle/calendar/events",
    response_model=dict,
    status_code=status.HTTP_200_OK,
)
async def get_calendar_events(
    token: MoodleTokenDep,
    service: MoodleServiceDep,
    time_from: int | None = None,
    time_to: int | None = None,
    limit_from: int | None = None,
    limit_num: int | None = None,
) -> dict:
    """Return calendar events ordered by time."""
    try:
        return await service.get_calendar_events(
            token=token,
            time_from=time_from,
            time_to=time_to,
            limit_from=limit_from,
            limit_num=limit_num,
        )
    except MoodleAPIError as exc:
        raise HTTPException(
            status_code=status.HTTP_502_BAD_GATEWAY,
            detail={
                "error": "moodle_unavailable",
                "error_description": f"Moodle API error: {exc}",
            },
        )
    finally:
        await service.close()


@router.get(
    "/moodle/courses/{course_id}/grade-items",
    response_model=dict,
    status_code=status.HTTP_200_OK,
)
async def get_grade_items(
    course_id: int,
    token: MoodleTokenDep,
    service: MoodleServiceDep,
) -> dict:
    """Return grade items for current user in a course."""
    try:
        return await service.get_grade_items(token=token, course_id=course_id)
    except MoodleAPIError as exc:
        raise HTTPException(
            status_code=status.HTTP_502_BAD_GATEWAY,
            detail={
                "error": "moodle_unavailable",
                "error_description": f"Moodle API error: {exc}",
            },
        )
    finally:
        await service.close()


@router.get(
    "/moodle/grades/overview",
    response_model=dict,
    status_code=status.HTTP_200_OK,
)
async def get_course_grades(
    token: MoodleTokenDep,
    service: MoodleServiceDep,
) -> dict:
    """Return overview grades for current user across courses."""
    try:
        return await service.get_course_grades(token=token)
    except MoodleAPIError as exc:
        raise HTTPException(
            status_code=status.HTTP_502_BAD_GATEWAY,
            detail={
                "error": "moodle_unavailable",
                "error_description": f"Moodle API error: {exc}",
            },
        )
    finally:
        await service.close()
