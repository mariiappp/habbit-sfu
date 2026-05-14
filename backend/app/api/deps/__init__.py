"""Centralized exports for API dependencies."""
from app.api.deps.database import DbSessionDep
from app.api.deps.repositories import UserRepoDep, HabitRepoDep, HabitCompletionRepoDep
from app.api.deps.services import UserServiceDep, HabitServiceDep, MoodleServiceDep
from app.api.deps.auth import BearerTokenDep, MoodleTokenDep

__all__ = [
	"DbSessionDep",
	"UserRepoDep",
	"HabitRepoDep",
	"HabitCompletionRepoDep",
	"UserServiceDep",
	"HabitServiceDep",
	"MoodleServiceDep",
	"BearerTokenDep",
	"MoodleTokenDep",
]