from contextlib import asynccontextmanager
import asyncio
from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from slowapi import _rate_limit_exceeded_handler
from slowapi.errors import RateLimitExceeded
from src.config import settings
from src.redis_client import init_redis, close_redis
from src.api.v1 import api_router
from src.middleware.tenant_context import TenantContextMiddleware
from src.middleware.sentry_middleware import init_sentry
from src.middleware.rate_limit import limiter, rate_limit_exceeded_handler
from src.middleware.rate_limit_headers import RateLimitHeadersMiddleware

try:
    from src.middleware.performance_tracking import (
        PerformanceTrackingMiddleware,
        collect_resource_metrics,
    )
    PERFORMANCE_TRACKING_AVAILABLE = True
except ImportError:
    PERFORMANCE_TRACKING_AVAILABLE = False


@asynccontextmanager
async def lifespan(app: FastAPI):
    init_sentry()
    try:
        await init_redis()
    except Exception:
        # Allow local development boot without Redis.
        pass
    
    # Check migration status on startup
    from src.utils.migration_checker import warn_if_migrations_pending
    from src.database import SessionLocal
    
    db = SessionLocal()
    try:
        # Check if migrations are up to date (warn only, don't fail startup)
        warn_if_migrations_pending(db, fail_on_pending=False)
    except Exception as e:
        # Log error but don't fail startup
        import logging
        logger = logging.getLogger(__name__)
        logger.error(f"Failed to check migration status: {e}")
    finally:
        db.close()
    
    # Ensure tables that don't have Alembic migrations yet are created.
    try:
        from src.database import engine
        from src.models.academic import Syllabus
        from src.models.student import Parent, StudentParent, Student
        for table_model in [Syllabus, Parent, Student, StudentParent]:
            table_model.__table__.create(bind=engine, checkfirst=True)
    except Exception as _exc:
        import logging
        logging.getLogger(__name__).warning("Could not create tables: %s", _exc)

    # Start background resource monitoring when optional dependencies are present.
    resource_task = None
    if PERFORMANCE_TRACKING_AVAILABLE:
        resource_task = asyncio.create_task(collect_resource_metrics())
    
    yield
    
    # Cancel background tasks
    if resource_task:
        resource_task.cancel()
    
    await close_redis()


app = FastAPI(
    title=settings.app_name,
    version="0.1.0",
    debug=settings.debug,
    lifespan=lifespan,
)

app.state.limiter = limiter
app.add_exception_handler(RateLimitExceeded, rate_limit_exceeded_handler)

app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "https://edu-learn.nmtsolution.com",
        "http://localhost:3000",
        "http://localhost:5173",
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

if PERFORMANCE_TRACKING_AVAILABLE:
    app.add_middleware(PerformanceTrackingMiddleware)
app.add_middleware(RateLimitHeadersMiddleware)
app.add_middleware(TenantContextMiddleware)

app.include_router(api_router, prefix="/api/v1")
app.include_router(api_router, prefix="/api")


@app.get("/")
async def root():
    return {"message": "Welcome to FastAPI", "status": "running"}


@app.get("/health")
async def health_check():
    from src.database import SessionLocal
    from src.redis_client import get_redis
    from src.utils.migration_checker import get_migration_health_check
    
    health_status = {
        "status": "healthy",
        "environment": settings.app_env,
        "version": "0.1.0"
    }
    
    try:
        db = SessionLocal()
        db.execute("SELECT 1")
        db.close()
        health_status["database"] = "connected"
    except Exception as e:
        health_status["database"] = f"error: {str(e)}"
        health_status["status"] = "unhealthy"
    
    try:
        redis = await get_redis()
        await redis.ping()
        health_status["redis"] = "connected"
    except Exception as e:
        health_status["redis"] = f"error: {str(e)}"
        health_status["status"] = "unhealthy"
    
    # Add migration status to health check
    try:
        migration_status = get_migration_health_check()
        health_status["migrations"] = migration_status
        if not migration_status.get("migrations_up_to_date", False):
            health_status["status"] = "degraded"
    except Exception as e:
        health_status["migrations"] = {"error": str(e)}
    
    return health_status
