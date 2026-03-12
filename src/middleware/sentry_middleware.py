import sentry_sdk
from sentry_sdk.integrations.fastapi import FastApiIntegration
from sentry_sdk.integrations.sqlalchemy import SqlalchemyIntegration
from sentry_sdk.integrations.redis import RedisIntegration
from sentry_sdk.integrations.celery import CeleryIntegration
from src.config import settings


def init_sentry() -> None:
    """Initialize Sentry for error tracking and performance monitoring."""
    if not settings.sentry_dsn:
        return

    sentry_sdk.init(
        dsn=settings.sentry_dsn,
        environment=settings.sentry_environment,
        traces_sample_rate=settings.sentry_traces_sample_rate,
        profiles_sample_rate=settings.sentry_profiles_sample_rate,
        integrations=[
            FastApiIntegration(transaction_style="endpoint"),
            SqlalchemyIntegration(),
            RedisIntegration(),
            CeleryIntegration(),
        ],
        send_default_pii=False,
        attach_stacktrace=True,
        debug=settings.debug,
        before_send=before_send_hook,
    )


def before_send_hook(event, hint):
    """Process events before sending to Sentry."""
    if "exc_info" in hint:
        exc_type, exc_value, tb = hint["exc_info"]
        
        # Filter out certain errors
        if exc_type.__name__ in ["ValidationError", "HTTPException"]:
            # Only send validation errors in production
            if settings.sentry_environment == "development":
                return None
    
    # Add custom tags
    event.setdefault("tags", {})
    event["tags"]["app_version"] = "0.1.0"
    
    return event
