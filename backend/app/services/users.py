"""User authentication and synchronization service."""
from app.clients.moodle import MoodleClient
from app.repositories.users import UserRepository
from app.domain.models.users import User


class UserService:
    """Orchestrates Moodle authentication and local user sync."""

    def __init__(self, repo: UserRepository, moodle: MoodleClient) -> None:
        self.repo = repo
        self.moodle = moodle

    async def authenticate(
        self, username: str, password: str, service: str = "moodle_mobile_app"
    ) -> dict[str, str | User]:
        """Authenticate against Moodle, sync local user, return token and user record."""
        # 1. Get Moodle wstoken (caches it in client instance)
        wstoken = await self.moodle.auth(username, password, service)
        
        # 2. Fetch authenticated user profile from Moodle
        profile = await self.moodle.get_current_user()
        
        # 3. Create or update local user (atomic UPSERT)
        user = await self.repo.upsert_on_auth(
            moodle_id=profile["userid"],
            username=profile.get("username", username),
            fullname=profile.get("fullname", username),
            email=profile.get("email"),
        )
        
        return {"access_token": wstoken, "user": user}