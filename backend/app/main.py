"""Main application module for FastAPI.

Initializes the FastAPI instance, configures the application lifecycle,
registers routes.
"""
from contextlib import asynccontextmanager
from typing import AsyncGenerator

from fastapi import FastAPI

from app.api.v1.routes import health, auth, moodle, habits, dashboard, advice, tasks
from app.core.config import settings
from app.db.session import init_database, close_database


@asynccontextmanager
async def lifespan(app: FastAPI) -> AsyncGenerator[None, None]:
    """Manage application lifecycle (startup and shutdown).

    Initialize external resources and close them.
    """
    await init_database()
    
    yield

    await close_database()



def create_app() -> FastAPI:
    """Application factory for FastAPI.

    Returns a fully configured FastAPI instance with routers, middleware,
    and lifecycle management.
    """
    application = FastAPI(
        title=settings.project_name,
        version=settings.version,
        openapi_url=f"{settings.api_v1_prefix}/openapi.json",
        docs_url=f"{settings.api_v1_prefix}/docs",
        redoc_url=f"{settings.api_v1_prefix}/redoc",
        lifespan=lifespan,
    )

    # Register API routes
    application.include_router(
        health.router,
        prefix=settings.api_v1_prefix,
        tags=["health"],
    )
    application.include_router(
        auth.router,
        prefix=settings.api_v1_prefix,
        tags=["auth"],
    )
    application.include_router(
        moodle.router,
        prefix=settings.api_v1_prefix,
        tags=["moodle"],
    )
    application.include_router(
        habits.router,
        prefix=settings.api_v1_prefix,
        tags=["habits"],
    )
    application.include_router(
        dashboard.router,
        prefix=settings.api_v1_prefix,
        tags=["dashboard"],
    )
    application.include_router(
        advice.router,
        prefix=settings.api_v1_prefix,
        tags=["advice"],
    )
    application.include_router(
        tasks.router,
        prefix=settings.api_v1_prefix,
        tags=["tasks"],
    )

    return application


app = create_app()