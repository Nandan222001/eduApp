import json
from typing import Optional, Dict, Any
from datetime import timedelta
from redis.asyncio import Redis
from src.config import settings


class SessionManager:
    def __init__(self, redis_client: Optional[Redis]):
        self.redis = redis_client
        self.prefix = "session:"
        self.refresh_prefix = "refresh:"

    @property
    def _available(self) -> bool:
        return self.redis is not None

    async def create_session(
        self, user_id: int, session_data: Dict[str, Any], token: str
    ) -> None:
        if not self._available:
            return
        key = f"{self.prefix}{user_id}:{token}"
        await self.redis.setex(
            key,
            timedelta(minutes=settings.access_token_expire_minutes),
            json.dumps(session_data),
        )

    async def get_session(self, user_id: int, token: str) -> Optional[Dict[str, Any]]:
        if not self._available:
            return None
        key = f"{self.prefix}{user_id}:{token}"
        data = await self.redis.get(key)
        if data:
            return json.loads(data)
        return None

    async def delete_session(self, user_id: int, token: str) -> None:
        if not self._available:
            return
        key = f"{self.prefix}{user_id}:{token}"
        await self.redis.delete(key)

    async def delete_all_user_sessions(self, user_id: int) -> None:
        if not self._available:
            return
        pattern = f"{self.prefix}{user_id}:*"
        cursor = 0
        while True:
            cursor, keys = await self.redis.scan(cursor, match=pattern, count=100)
            if keys:
                await self.redis.delete(*keys)
            if cursor == 0:
                break

    async def store_refresh_token(self, user_id: int, refresh_token: str) -> None:
        if not self._available:
            return
        key = f"{self.refresh_prefix}{user_id}:{refresh_token}"
        await self.redis.setex(
            key,
            timedelta(days=settings.refresh_token_expire_days),
            "1",
        )

    async def verify_refresh_token(self, user_id: int, refresh_token: str) -> bool:
        if not self._available:
            return True  # allow token refresh when Redis is unavailable
        key = f"{self.refresh_prefix}{user_id}:{refresh_token}"
        exists = await self.redis.exists(key)
        return exists > 0

    async def revoke_refresh_token(self, user_id: int, refresh_token: str) -> None:
        if not self._available:
            return
        key = f"{self.refresh_prefix}{user_id}:{refresh_token}"
        await self.redis.delete(key)

    async def revoke_all_refresh_tokens(self, user_id: int) -> None:
        if not self._available:
            return
        pattern = f"{self.refresh_prefix}{user_id}:*"
        cursor = 0
        while True:
            cursor, keys = await self.redis.scan(cursor, match=pattern, count=100)
            if keys:
                await self.redis.delete(*keys)
            if cursor == 0:
                break
