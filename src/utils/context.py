from contextvars import ContextVar
from typing import Optional
from pydantic import BaseModel


class RequestContext(BaseModel):
    user_id: Optional[int] = None
    institution_id: Optional[int] = None
    role_id: Optional[int] = None
    email: Optional[str] = None
    is_superuser: bool = False
    permissions: list[str] = []


request_context: ContextVar[Optional[RequestContext]] = ContextVar(
    "request_context", default=None
)


def set_request_context(context: RequestContext) -> None:
    request_context.set(context)


def get_request_context() -> Optional[RequestContext]:
    return request_context.get()


def get_current_institution_id() -> int:
    context = get_request_context()
    if not context or context.institution_id is None:
        raise RuntimeError("Institution context is not available")
    return context.institution_id


def clear_request_context() -> None:
    request_context.set(None)
