from typing import Callable
from fastapi import Request, Response
from starlette.middleware.base import BaseHTTPMiddleware

from src.utils.context import set_request_context, clear_request_context, RequestContext
from src.utils.security import decode_token
from src.database import SessionLocal, set_rls_context
from src.models.user import User
from src.redis_client import redis_client
from src.utils.session import SessionManager


class TenantContextMiddleware(BaseHTTPMiddleware):
    async def dispatch(self, request: Request, call_next: Callable) -> Response:
        clear_request_context()

        auth_header = request.headers.get("Authorization")
        if auth_header and auth_header.startswith("Bearer "):
            token = auth_header.replace("Bearer ", "")
            payload = decode_token(token)

            if payload and payload.get("type") == "access":
                user_id = payload.get("sub")
                institution_id = payload.get("institution_id")

                if user_id and redis_client:
                    session_manager = SessionManager(redis_client)
                    session_data = await session_manager.get_session(user_id, token)

                    if session_data:
                        db = SessionLocal()
                        try:
                            user = db.query(User).filter(User.id == user_id).first()
                            if user and user.is_active:
                                permissions = []
                                if user.role and user.role.permissions:
                                    permissions = [
                                        f"{p.resource}:{p.action}" for p in user.role.permissions
                                    ]

                                context = RequestContext(
                                    user_id=user.id,
                                    institution_id=user.institution_id,
                                    role_id=user.role_id,
                                    email=user.email,
                                    is_superuser=user.is_superuser,
                                    permissions=permissions,
                                )
                                set_request_context(context)

                                set_rls_context(
                                    db,
                                    institution_id=user.institution_id,
                                    user_id=user.id,
                                    bypass_rls=user.is_superuser,
                                )
                        finally:
                            db.close()

        response = await call_next(request)
        clear_request_context()

        return response
