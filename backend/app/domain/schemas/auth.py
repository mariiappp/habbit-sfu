"""Authentication request/response schemas."""
from pydantic import BaseModel, Field, field_validator


class MoodleAuthRequest(BaseModel):
    """Request schema for Moodle authentication."""
    username: str = Field(..., min_length=3, max_length=100, description="Moodle username")
    password: str = Field(..., min_length=8, max_length=128, description="Moodle password")
    service: str = Field(default="moodle_mobile_app", description="Moodle web service name")

    @field_validator("username", "password")
    @classmethod
    def strip_whitespace(cls, value: str) -> str:
        """Remove leading/trailing whitespace from credentials."""
        return value.strip() if value else value


class MoodleAuthResponse(BaseModel):
    """Response schema after successful Moodle authentication."""
    access_token: str = Field(..., description="Moodle wstoken for subsequent API calls")
    token_type: str = Field(default="Bearer", description="Token type for Authorization header")
    expires_in: int | None = Field(default=None, description="Token TTL in seconds (if known)")

    model_config = {
        "json_schema_extra": {
            "examples": [{
                "access_token": "435864eceef357e18e36647d53724464",
                "token_type": "Bearer",
                "expires_in": None
            }]
        }
    }


class AuthError(BaseModel):
    """Standardized error response for authentication failures."""
    error: str = Field(..., description="Machine-readable error code")
    error_description: str = Field(..., description="Human-readable error message")

    model_config = {
        "json_schema_extra": {
            "examples": [{
                "error": "invalid_credentials",
                "error_description": "Username or password is incorrect"
            }]
        }
    }