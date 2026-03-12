from contextlib import asynccontextmanager
from fastapi import FastAPI
from src.config import settings
from src.redis_client import init_redis, close_redis
from src.api.v1 import api_router
from src.middleware.tenant_context import TenantContextMiddleware
from src.middleware.sentry_middleware import init_sentry


@asynccontextmanager
async def lifespan(app: FastAPI):
    init_sentry()
    await init_redis()
    yield
    await close_redis()


app = FastAPI(
    title=settings.app_name,
    version="0.1.0",
    debug=settings.debug,
    lifespan=lifespan,
)

app.add_middleware(TenantContextMiddleware)

app.include_router(api_router, prefix="/api/v1")


@app.get("/")
async def root():
    return {"message": "Welcome to FastAPI", "status": "running"}


@app.get("/health")
async def health_check():
    from src.database import SessionLocal
    from src.redis_client import get_redis_client
    
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
        redis = await get_redis_client()
        await redis.ping()
        health_status["redis"] = "connected"
    except Exception as e:
        health_status["redis"] = f"error: {str(e)}"
        health_status["status"] = "unhealthy"
    
    return health_status
