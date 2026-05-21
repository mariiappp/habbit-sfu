"""Task endpoints."""
from datetime import date as date_type

from fastapi import APIRouter, HTTPException, status

from app.api.deps import MoodleTokenDep
from app.api.deps.services import TaskServiceDep
from app.clients.exceptions import MoodleAPIError
from app.domain.schemas.tasks import TaskCreateRequest, TaskUpdateRequest, TaskResponse
from app.services.tasks import TaskNotFoundError, MoodleProfileError

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
    if isinstance(exc, TaskNotFoundError):
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail={
                "error": "task_not_found",
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


@router.get(
    "/tasks",
    response_model=list[TaskResponse],
    status_code=status.HTTP_200_OK,
)
async def list_tasks(
    token: MoodleTokenDep,
    service: TaskServiceDep,
    start_date: date_type | None = None,
    end_date: date_type | None = None,
) -> list[TaskResponse]:
    """List tasks for the current user, optionally in a date range."""
    try:
        tasks = await service.list_tasks(
            token=token,
            start_date=start_date,
            end_date=end_date,
        )
        return [TaskResponse.model_validate(item) for item in tasks]
    except MoodleAPIError as exc:
        raise_moodle_error(exc)
    except Exception as exc:
        raise_domain_error(exc)
    finally:
        await service.close()


@router.get(
    "/tasks/{task_id}",
    response_model=TaskResponse,
    status_code=status.HTTP_200_OK,
)
async def get_task(
    task_id: int,
    token: MoodleTokenDep,
    service: TaskServiceDep,
) -> TaskResponse:
    """Get task by id for the current user."""
    try:
        task = await service.get_task(token=token, task_id=task_id)
        return TaskResponse.model_validate(task)
    except MoodleAPIError as exc:
        raise_moodle_error(exc)
    except Exception as exc:
        raise_domain_error(exc)
    finally:
        await service.close()


@router.post(
    "/tasks",
    response_model=TaskResponse,
    status_code=status.HTTP_201_CREATED,
)
async def create_task(
    payload: TaskCreateRequest,
    token: MoodleTokenDep,
    service: TaskServiceDep,
) -> TaskResponse:
    """Create a new task for the current user."""
    try:
        task = await service.create_task(
            token=token,
            payload=payload.model_dump(),
        )
        return TaskResponse.model_validate(task)
    except MoodleAPIError as exc:
        raise_moodle_error(exc)
    except Exception as exc:
        raise_domain_error(exc)
    finally:
        await service.close()


@router.patch(
    "/tasks/{task_id}",
    response_model=TaskResponse,
    status_code=status.HTTP_200_OK,
)
async def update_task(
    task_id: int,
    payload: TaskUpdateRequest,
    token: MoodleTokenDep,
    service: TaskServiceDep,
) -> TaskResponse:
    """Update a task for the current user."""
    try:
        update_data = payload.model_dump(exclude_unset=True)
        task = await service.update_task(
            token=token,
            task_id=task_id,
            update_data=update_data,
        )
        return TaskResponse.model_validate(task)
    except MoodleAPIError as exc:
        raise_moodle_error(exc)
    except Exception as exc:
        raise_domain_error(exc)
    finally:
        await service.close()


@router.delete(
    "/tasks/{task_id}",
    status_code=status.HTTP_204_NO_CONTENT,
)
async def delete_task(
    task_id: int,
    token: MoodleTokenDep,
    service: TaskServiceDep,
) -> None:
    """Delete a task for the current user."""
    try:
        await service.delete_task(token=token, task_id=task_id)
    except MoodleAPIError as exc:
        raise_moodle_error(exc)
    except Exception as exc:
        raise_domain_error(exc)
    finally:
        await service.close()
