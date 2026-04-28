"""Custom exceptions for external API clients."""


class MoodleAPIError(Exception):
    """Base exception for university/Moodle API failures."""

class MoodleAuthError(Exception):
    """Base exception for auth API failures."""