"""Centralized exports for API dependencies."""
from app.api.deps.database import DbSessionDep
from app.api.deps.repositories import UserRepoDep
from app.api.deps.services import UserServiceDep

__all__ = ["DbSessionDep", "UserRepoDep", "UserServiceDep"]