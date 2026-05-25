"""Habit CRUD and completion tracking endpoints."""
from datetime import date

from fastapi import APIRouter, HTTPException, status

from app.api.deps import MoodleTokenDep
from app.api.deps.services import HabitServiceDep
from app.clients.exceptions import MoodleAPIError
from app.domain.schemas.habits import (
    HabitCreateRequest,
    HabitUpdateRequest,
    HabitResponse,
    HabitCompletionCreateRequest,
    HabitCompletionResponse,
    HabitHistoryDay,
    HabitHistoryResponse,
)
from app.domain.schemas.streaks import StreakResponse
from app.services.habits import (
    HabitNotFoundError,
    CompletionNotFoundError,
    InvalidDateRangeError,
    MoodleProfileError,
)

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
    """Normalize domain errors to HTTP responses."""
    if isinstance(exc, HabitNotFoundError):
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail={
                "error": "habit_not_found",
                "error_description": str(exc),
            },
        )
    if isinstance(exc, CompletionNotFoundError):
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail={
                "error": "completion_not_found",
                "error_description": str(exc),
            },
        )
    if isinstance(exc, InvalidDateRangeError):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail={
                "error": "invalid_date_range",
                "error_description": str(exc),
            },
        )
    if isinstance(exc, MoodleProfileError):
        raise HTTPException(
            status_code=status.HTTP_502_BAD_GATEWAY,
            detail={
                "error": "moodle_profile_invalid",
                "error_description": str(exc),
            },
        )
    raise exc


@router.post(
    "/habits",
    response_model=HabitResponse,
    status_code=status.HTTP_201_CREATED,
)
async def create_habit(
    payload: HabitCreateRequest,
    token: MoodleTokenDep,
    service: HabitServiceDep,
) -> HabitResponse:
    """Create a new habit for the current user."""
    try:
        habit = await service.create_habit(
            token=token,
            title=payload.title,
            description=payload.description,
            recurrence=payload.recurrence,
        )
        return HabitResponse.model_validate(habit)
    except MoodleAPIError as exc:
        raise_moodle_error(exc)
    except Exception as exc:
        raise_domain_error(exc)


@router.get(
    "/habits",
    response_model=list[HabitResponse],
    status_code=status.HTTP_200_OK,
)
async def list_habits(
    token: MoodleTokenDep,
    service: HabitServiceDep,
) -> list[HabitResponse]:
    """List all habits for the current user."""
    try:
        records = await service.list_habits(token=token)
        return [HabitResponse.model_validate(habit) for habit in records]
    except MoodleAPIError as exc:
        raise_moodle_error(exc)
    except Exception as exc:
        raise_domain_error(exc)


@router.get(
    "/habits/streak",
    response_model=StreakResponse,
    status_code=status.HTTP_200_OK,
)
async def get_streak(
    token: MoodleTokenDep,
    service: HabitServiceDep,
) -> StreakResponse:
    """Return current streak for the user."""
    try:
        payload = await service.get_streak(token=token)
        return StreakResponse(**payload)
    except MoodleAPIError as exc:
        raise_moodle_error(exc)
    except Exception as exc:
        raise_domain_error(exc)


@router.get(
    "/habits/{habit_id}",
    response_model=HabitResponse,
    status_code=status.HTTP_200_OK,
)
async def get_habit(
    habit_id: int,
    token: MoodleTokenDep,
    service: HabitServiceDep,
) -> HabitResponse:
    """Get a habit by id for the current user."""
    try:
        habit = await service.get_habit(token=token, habit_id=habit_id)
        return HabitResponse.model_validate(habit)
    except MoodleAPIError as exc:
        raise_moodle_error(exc)
    except Exception as exc:
        raise_domain_error(exc)


@router.patch(
    "/habits/{habit_id}",
    response_model=HabitResponse,
    status_code=status.HTTP_200_OK,
)
async def update_habit(
    habit_id: int,
    payload: HabitUpdateRequest,
    token: MoodleTokenDep,
    service: HabitServiceDep,
) -> HabitResponse:
    """Update a habit for the current user."""
    try:
        update_data = payload.model_dump(exclude_unset=True)
        habit = await service.update_habit(
            token=token,
            habit_id=habit_id,
            update_data=update_data,
        )
        return HabitResponse.model_validate(habit)
    except MoodleAPIError as exc:
        raise_moodle_error(exc)
    except Exception as exc:
        raise_domain_error(exc)


@router.delete(
    "/habits/{habit_id}",
    status_code=status.HTTP_204_NO_CONTENT,
)
async def delete_habit(
    habit_id: int,
    token: MoodleTokenDep,
    service: HabitServiceDep,
) -> None:
    """Delete a habit for the current user."""
    try:
        await service.delete_habit(token=token, habit_id=habit_id)
    except MoodleAPIError as exc:
        raise_moodle_error(exc)
    except Exception as exc:
        raise_domain_error(exc)


@router.post(
    "/habits/{habit_id}/completions",
    response_model=HabitCompletionResponse,
    status_code=status.HTTP_200_OK,
)
async def complete_habit(
    habit_id: int,
    payload: HabitCompletionCreateRequest,
    token: MoodleTokenDep,
    service: HabitServiceDep,
) -> HabitCompletionResponse:
    """Mark habit as completed for today (idempotent)."""
    try:
        completion = await service.complete_habit(
            token=token,
            habit_id=habit_id,
            note=payload.note,
        )
        return HabitCompletionResponse.model_validate(completion)
    except MoodleAPIError as exc:
        raise_moodle_error(exc)
    except Exception as exc:
        raise_domain_error(exc)


@router.get(
    "/habits/{habit_id}/completions",
    response_model=list[HabitCompletionResponse],
    status_code=status.HTTP_200_OK,
)
async def list_completions(
    habit_id: int,
    token: MoodleTokenDep,
    service: HabitServiceDep,
    limit: int = 30,
) -> list[HabitCompletionResponse]:
    """List recent completions for a habit."""
    try:
        records = await service.list_completions(
            token=token,
            habit_id=habit_id,
            limit=limit,
        )
        return [HabitCompletionResponse.model_validate(item) for item in records]
    except MoodleAPIError as exc:
        raise_moodle_error(exc)
    except Exception as exc:
        raise_domain_error(exc)


@router.delete(
    "/habits/{habit_id}/completions/{completion_id}",
    status_code=status.HTTP_204_NO_CONTENT,
)
async def delete_completion(
    habit_id: int,
    completion_id: int,
    token: MoodleTokenDep,
    service: HabitServiceDep,
) -> None:
    """Delete a completion record (undo)."""
    try:
        await service.delete_completion(
            token=token,
            habit_id=habit_id,
            completion_id=completion_id,
        )
    except MoodleAPIError as exc:
        raise_moodle_error(exc)
    except Exception as exc:
        raise_domain_error(exc)


@router.get(
    "/habits/{habit_id}/history",
    response_model=HabitHistoryResponse,
    status_code=status.HTTP_200_OK,
)
async def habit_history(
    habit_id: int,
    token: MoodleTokenDep,
    service: HabitServiceDep,
    start_date: date | None = None,
    end_date: date | None = None,
) -> HabitHistoryResponse:
    """Return calendar history for a habit in a date range."""
    try:
        history = await service.history(
            token=token,
            habit_id=habit_id,
            start_date=start_date,
            end_date=end_date,
        )
        return HabitHistoryResponse(
            habit_id=history.habit.id,
            recurrence=history.habit.recurrence,
            start_date=history.start_date,
            end_date=history.end_date,
            days=[
                HabitHistoryDay(
                    date=item.date,
                    completed=item.completed,
                    completion_id=item.completion_id,
                )
                for item in history.days
            ],
        )
    except MoodleAPIError as exc:
        raise_moodle_error(exc)
    except Exception as exc:
        raise_domain_error(exc)
