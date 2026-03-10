from contextlib import asynccontextmanager
from fastapi import FastAPI
from src.config import settings
from src.redis_client import init_redis, close_redis
from src.api.v1 import api_router
from src.middleware.tenant_context import TenantContextMiddleware


@asynccontextmanager
async def lifespan(app: FastAPI):
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
    return {"status": "healthy", "environment": settings.app_env}
