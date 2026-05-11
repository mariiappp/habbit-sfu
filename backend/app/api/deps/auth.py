"""Authentication dependencies for API routes."""
from typing import Annotated

from fastapi import Depends, HTTPException, Query, status
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer

security = HTTPBearer(auto_error=False)


def get_bearer_token(
    credentials: HTTPAuthorizationCredentials | None = Depends(security),
) -> str:
    """Extract bearer token from Authorization header."""
    if credentials is None or not credentials.credentials:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail={
                "error": "not_authenticated",
                "error_description": "Missing or invalid Authorization header",
            },
        )
    return credentials.credentials


BearerTokenDep = Annotated[str, Depends(get_bearer_token)]


def get_moodle_wstoken(
    wstoken: str | None = Query(default=None, min_length=8, description="Moodle wstoken"),
) -> str:
    """Extract Moodle wstoken from query parameters (wstoken=...)."""
    if not wstoken:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail={
                "error": "not_authenticated",
                "error_description": "Missing wstoken query parameter",
            },
        )
    return wstoken


MoodleTokenDep = Annotated[str, Depends(get_moodle_wstoken)]
