"""Moodle data endpoints (token-protected)."""
from fastapi import APIRouter, HTTPException, status

from app.api.deps.auth import MoodleTokenDep
from app.api.deps.services import MoodleServiceDep
from app.clients.exceptions import MoodleAPIError
from app.domain.schemas.moodle import MoodleCourse

router = APIRouter()


def parse_csv_ints(value: str | None, field_name: str) -> list[int] | None:
    if value is None:
        return None
    try:
        return [int(item) for item in value.split(",") if item]
    except ValueError as exc:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail={
                "error": f"invalid_{field_name}",
                "error_description": f"{field_name} must be comma-separated integers",
            },
        ) from exc


def parse_csv_strings(value: str | None) -> list[str] | None:
    if value is None:
        return None
    return [item.strip() for item in value.split(",") if item.strip()]


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
    "/moodle/user",
    response_model=dict,
    status_code=status.HTTP_200_OK,
)
async def get_current_user(
    token: MoodleTokenDep,
    service: MoodleServiceDep,
) -> dict:
    """Return Moodle profile for the authenticated user."""
    try:
        return await service.get_current_user(token=token)
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
    "/moodle/users/by-field",
    response_model=list[dict],
    status_code=status.HTTP_200_OK,
)
async def get_users_by_field(
    field: str,
    values: str,
    token: MoodleTokenDep,
    service: MoodleServiceDep,
) -> list[dict]:
    """Return Moodle users by field/value list."""
    value_list = parse_csv_strings(values) or []
    if not value_list:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail={
                "error": "invalid_values",
                "error_description": "values must contain at least one item",
            },
        )
    try:
        return await service.get_users_by_field(
            token=token,
            field=field,
            values=value_list,
        )
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
    "/moodle/courses/all",
    response_model=list[dict],
    status_code=status.HTTP_200_OK,
)
async def get_courses(
    token: MoodleTokenDep,
    service: MoodleServiceDep,
    course_ids: str | None = None,
) -> list[dict]:
    """Return courses by ids or full catalog (admin permissions required)."""
    parsed_ids = parse_csv_ints(course_ids, "course_ids")
    try:
        return await service.get_courses(token=token, course_ids=parsed_ids)
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
    "/moodle/courses/{course_id}/updates",
    response_model=dict,
    status_code=status.HTTP_200_OK,
)
async def get_course_updates(
    course_id: int,
    token: MoodleTokenDep,
    service: MoodleServiceDep,
    since: int,
) -> dict:
    """Return course updates since Unix timestamp."""
    try:
        return await service.get_course_updates_since(
            token=token,
            course_id=course_id,
            since=since,
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
    "/moodle/assignments/{assignment_id}/submission-status",
    response_model=dict,
    status_code=status.HTTP_200_OK,
)
async def get_submission_status(
    assignment_id: int,
    token: MoodleTokenDep,
    service: MoodleServiceDep,
) -> dict:
    """Return submission status for current user."""
    try:
        return await service.get_submission_status(
            token=token,
            assignment_id=assignment_id,
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
    "/moodle/assignments/submissions",
    response_model=dict,
    status_code=status.HTTP_200_OK,
)
async def get_submissions(
    token: MoodleTokenDep,
    service: MoodleServiceDep,
    assignment_ids: str,
) -> dict:
    """Return submissions for assignment ids (comma-separated)."""
    parsed_ids = parse_csv_ints(assignment_ids, "assignment_ids") or []
    if not parsed_ids:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail={
                "error": "invalid_assignment_ids",
                "error_description": "assignment_ids must contain at least one id",
            },
        )
    try:
        return await service.get_submissions(
            token=token,
            assignment_ids=parsed_ids,
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
    course_ids: str | None = None,
    group_ids: str | None = None,
    user_ids: str | None = None,
    include_site_events: bool | None = None,
    include_user_events: bool | None = None,
    include_group_events: bool | None = None,
) -> dict:
    """Return calendar events (core_calendar_get_calendar_events)."""
    parsed_course_ids = parse_csv_ints(course_ids, "course_ids")
    parsed_group_ids = parse_csv_ints(group_ids, "group_ids")
    parsed_user_ids = parse_csv_ints(user_ids, "user_ids")
    try:
        return await service.get_calendar_events(
            token=token,
            course_ids=parsed_course_ids,
            group_ids=parsed_group_ids,
            user_ids=parsed_user_ids,
            time_from=time_from,
            time_to=time_to,
            include_site_events=include_site_events,
            include_user_events=include_user_events,
            include_group_events=include_group_events,
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
    "/moodle/grades/table",
    response_model=dict,
    status_code=status.HTTP_200_OK,
)
async def get_grades_table(
    token: MoodleTokenDep,
    service: MoodleServiceDep,
    course_id: int,
    user_id: int | None = None,
) -> dict:
    """Return grade table for course and user."""
    try:
        return await service.get_grades_table(
            token=token,
            course_id=course_id,
            user_id=user_id,
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
    "/moodle/grades",
    response_model=dict,
    status_code=status.HTTP_200_OK,
)
async def get_grades(
    token: MoodleTokenDep,
    service: MoodleServiceDep,
    course_id: int,
    component: str,
    activity_id: int,
    user_ids: str | None = None,
    group_id: int | None = None,
) -> dict:
    """Return grades for a specific activity."""
    parsed_user_ids = parse_csv_ints(user_ids, "user_ids")
    try:
        return await service.get_grades(
            token=token,
            course_id=course_id,
            component=component,
            activity_id=activity_id,
            user_ids=parsed_user_ids,
            group_id=group_id,
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


@router.get(
    "/moodle/messages",
    response_model=dict,
    status_code=status.HTTP_200_OK,
)
async def get_messages(
    token: MoodleTokenDep,
    service: MoodleServiceDep,
    user_id_to: int,
    user_id_from: int | None = None,
    message_type: str | None = None,
    read: bool | None = None,
    newest_first: bool | None = None,
    limit_from: int | None = None,
    limit_num: int | None = None,
) -> dict:
    """Return messages for a user."""
    try:
        return await service.get_messages(
            token=token,
            user_id_to=user_id_to,
            user_id_from=user_id_from,
            message_type=message_type,
            read=read,
            newest_first=newest_first,
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
