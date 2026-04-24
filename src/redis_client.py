from typing import Optional
import redis.asyncio as redis
from src.config import settings

redis_client: Optional[redis.Redis] = None


async def get_redis() -> Optional[redis.Redis]:
    return redis_client


async def init_redis() -> None:
    global redis_client
    client = redis.from_url(
        settings.redis_url,
        encoding="utf-8",
        decode_responses=True,
        socket_connect_timeout=2,
        socket_timeout=2,
        retry_on_timeout=False,
    )
    redis_client = client


async def close_redis() -> None:
    global redis_client
    if redis_client:
        await redis_client.close()
        redis_client = None
