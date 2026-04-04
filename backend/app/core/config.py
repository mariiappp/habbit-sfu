"""Application configuration management.

Loads and validates environment variables using Pydantic Settings.
Ensures type safety, strict validation.
"""
from pydantic import Field, PostgresDsn, field_validator
from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    """Core application settings loaded from environment variables.

    All fields are validated at startup. Missing or invalid variables
    will raise a ValidationError.
    """
    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        case_sensitive=False,
        env_prefix="APP_",
        extra="ignore",
    )

    # Project metadata
    project_name: str = Field(default="FastAPI Production Template", description="Human-readable project name")
    version: str = Field(default="0.1.0", description="Application version (SemVer)")
    api_v1_prefix: str = Field(default="/api/v1", description="Base prefix for all v1 API routes")

    # Runtime settings
    debug: bool = Field(default=False, description="Enable debug mode (disable in production)")
    log_level: str = Field(default="INFO", description="Logging level")

    # Database
    database_url: PostgresDsn = Field(
        default="postgresql+asyncpg://user:password@localhost:5432/appdb",
        description="Asynchronous PostgreSQL connection string"
    )

    # Security
    secret_key: str = Field(
        default="SECRET_SECRET_SECRET_SECRET_SECRET_SECRET",
        min_length=32,
        description="Cryptographic secret key for JWT/token signing"
    )

    # Network: stored as comma-separated string
    allowed_hosts: str = Field(
        default="localhost,127.0.0.1",
        description="Comma-separated list of allowed hosts for CORS and host header validation"
    )

    @field_validator("log_level")
    @classmethod
    def normalize_log_level(cls, value: str) -> str:
        """Normalize log level to uppercase."""
        return value.upper()

    @property
    def allowed_hosts_list(self) -> list[str]:
        """Return allowed hosts as a parsed list of strings."""
        return [host.strip() for host in self.allowed_hosts.split(",") if host.strip()]


# Singleton instance
settings = Settings()