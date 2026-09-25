from typing import Optional, Callable
from fastapi import Request, HTTPException, status
from slowapi import Limiter
from slowapi.util import get_remote_address
from slowapi.errors import RateLimitExceeded
from src.redis_client import get_redis
from src.utils.security import decode_token
from src.config import settings
import json


def get_user_identifier(request: Request) -> str:
    auth_header = request.headers.get("Authorization")
    
    if auth_header and auth_header.startswith("Bearer "):
        token = auth_header.replace("Bearer ", "")
        payload = decode_token(token)
        
        if payload and payload.get("sub"):
            user_id = payload.get("sub")
            role_slug = payload.get("role_slug", "guest")
            return f"user:{user_id}:{role_slug}"
    
    return get_remote_address(request)


def get_rate_limit_for_role(role_slug: Optional[str] = None) -> str:
    role_limits = {
        "super_admin": "1000/minute",
        "institution_admin": "500/minute",
        "manager": "300/minute",
        "teacher": "200/minute",
        "staff": "150/minute",
        "student": "100/minute",
        "parent": "100/minute",
    }
    
    if role_slug and role_slug in role_limits:
        return role_limits[role_slug]
    
    return "50/minute"


def get_role_from_request(request: Request) -> Optional[str]:
    auth_header = request.headers.get("Authorization")
    
    if auth_header and auth_header.startswith("Bearer "):
        token = auth_header.replace("Bearer ", "")
        payload = decode_token(token)
        
        if payload:
            return payload.get("role_slug")
    
    return None


async def log_rate_limit_violation(
    request: Request,
    user_id: Optional[int],
    role_slug: Optional[str],
    limit: str
) -> None:
    redis_client = await get_redis()
    if not redis_client:
        return

    violation_data = {
        "user_id": user_id,
        "role_slug": role_slug or "anonymous",
        "path": request.url.path,
        "method": request.method,
        "ip_address": get_remote_address(request),
        "limit": limit,
        "timestamp": request.state.timestamp if hasattr(request.state, "timestamp") else None,
    }
    
    violation_key = f"rate_limit:violations:{request.url.path}"
    
    await redis_client.lpush(violation_key, json.dumps(violation_data))
    await redis_client.ltrim(violation_key, 0, 999)
    await redis_client.expire(violation_key, 86400)
    
    stats_key = f"rate_limit:stats:daily"
    await redis_client.hincrby(stats_key, "total_violations", 1)
    await redis_client.expire(stats_key, 86400)
    
    if user_id:
        user_stats_key = f"rate_limit:stats:user:{user_id}"
        await redis_client.hincrby(user_stats_key, "violations", 1)
        await redis_client.expire(user_stats_key, 86400)


limiter = Limiter(
    key_func=get_user_identifier,
    storage_uri=settings.redis_url,
    strategy="fixed-window",
    headers_enabled=True,
    swallow_errors=False,
)


async def rate_limit_exceeded_handler(request: Request, exc: RateLimitExceeded) -> dict:
    role_slug = get_role_from_request(request)
    
    auth_header = request.headers.get("Authorization")
    user_id = None
    
    if auth_header and auth_header.startswith("Bearer "):
        token = auth_header.replace("Bearer ", "")
        payload = decode_token(token)
        if payload:
            user_id = payload.get("sub")
    
    await log_rate_limit_violation(request, user_id, role_slug, str(exc.detail))
    
    retry_after = getattr(exc, "retry_after", 60)
    
    error_messages = {
        "super_admin": "Rate limit exceeded. Please try again in a moment.",
        "institution_admin": "Rate limit exceeded. Please try again in a moment.",
        "manager": "Rate limit exceeded. Your account allows up to 300 requests per minute.",
        "teacher": "Rate limit exceeded. Your account allows up to 200 requests per minute.",
        "staff": "Rate limit exceeded. Your account allows up to 150 requests per minute.",
        "student": "Rate limit exceeded. Your account allows up to 100 requests per minute.",
        "parent": "Rate limit exceeded. Your account allows up to 100 requests per minute.",
    }
    
    message = error_messages.get(
        role_slug,
        "Rate limit exceeded. Anonymous users are limited to 50 requests per minute. Please sign in for higher limits."
    )
    
    raise HTTPException(
        status_code=status.HTTP_429_TOO_MANY_REQUESTS,
        detail={
            "error": "rate_limit_exceeded",
            "message": message,
            "retry_after": retry_after,
            "limit": get_rate_limit_for_role(role_slug),
            "upgrade_message": "Consider upgrading your role for higher rate limits." if not role_slug or role_slug in ["student", "parent"] else None,
        },
        headers={"Retry-After": str(retry_after)},
    )
