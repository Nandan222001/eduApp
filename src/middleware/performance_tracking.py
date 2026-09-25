import time
import asyncio
import psutil
from typing import Callable
from fastapi import Request, Response
from starlette.middleware.base import BaseHTTPMiddleware
from sqlalchemy.orm import Session
from src.database import SessionLocal
from src.models.performance_monitoring import (
    APIPerformanceMetric,
    ResourceUtilizationMetric,
)
from src.redis_client import get_redis


class PerformanceTrackingMiddleware(BaseHTTPMiddleware):
    """Middleware to track API performance metrics"""
    
    def __init__(self, app):
        super().__init__(app)
        self.performance_tracking_enabled = True
    
    async def dispatch(self, request: Request, call_next: Callable) -> Response:
        if not self.performance_tracking_enabled:
            return await call_next(request)
        
        start_time = time.time()
        request_size = int(request.headers.get("content-length", 0))
        
        response = None
        error_message = None
        status_code = 500
        
        try:
            response = await call_next(request)
            status_code = response.status_code
        except Exception as e:
            error_message = str(e)
            raise
        finally:
            end_time = time.time()
            response_time_ms = (end_time - start_time) * 1000
            
            response_size = 0
            if response:
                response_size = int(response.headers.get("content-length", 0))
            
            user_id = None
            institution_id = None
            if hasattr(request.state, "user"):
                user = request.state.user
                if user:
                    user_id = user.id
                    institution_id = user.institution_id
            
            asyncio.create_task(
                self._save_api_metric(
                    endpoint=str(request.url.path),
                    method=request.method,
                    status_code=status_code,
                    response_time_ms=response_time_ms,
                    request_size_bytes=request_size,
                    response_size_bytes=response_size,
                    user_id=user_id,
                    institution_id=institution_id,
                    error_message=error_message,
                )
            )
        
        return response
    
    async def _save_api_metric(
        self,
        endpoint: str,
        method: str,
        status_code: int,
        response_time_ms: float,
        request_size_bytes: int,
        response_size_bytes: int,
        user_id: int = None,
        institution_id: int = None,
        error_message: str = None,
    ):
        try:
            db: Session = SessionLocal()
            try:
                metric = APIPerformanceMetric(
                    endpoint=endpoint,
                    method=method,
                    status_code=status_code,
                    response_time_ms=response_time_ms,
                    request_size_bytes=request_size_bytes,
                    response_size_bytes=response_size_bytes,
                    user_id=user_id,
                    institution_id=institution_id,
                    error_message=error_message,
                )
                db.add(metric)
                db.commit()

                if await get_redis():
                    await self._update_realtime_metrics(
                        endpoint, method, response_time_ms, status_code
                    )
            finally:
                db.close()
        except Exception:
            pass
    
    async def _update_realtime_metrics(
        self, endpoint: str, method: str, response_time_ms: float, status_code: int
    ):
        try:
            redis_client = await get_redis()
            if redis_client:
                key = f"realtime:api:{endpoint}:{method}"
                await redis_client.lpush(
                    key, f"{response_time_ms}:{status_code}:{int(time.time())}"
                )
                await redis_client.ltrim(key, 0, 99)
                await redis_client.expire(key, 3600)
        except Exception:
            pass


async def collect_resource_metrics():
    """Background task to collect resource utilization metrics"""
    while True:
        try:
            db: Session = SessionLocal()
            try:
                cpu_percent = psutil.cpu_percent(interval=1)
                memory = psutil.virtual_memory()
                disk = psutil.disk_usage('/')
                
                net_io = psutil.net_io_counters()
                
                active_connections = len(psutil.net_connections())
                
                active_sessions = 0
                redis_client = await get_redis()
                if redis_client:
                    keys = await redis_client.keys("session:*")
                    active_sessions = len(keys)
                
                metric = ResourceUtilizationMetric(
                    metric_type="system",
                    cpu_percent=cpu_percent,
                    memory_percent=memory.percent,
                    memory_used_mb=memory.used / (1024 * 1024),
                    memory_available_mb=memory.available / (1024 * 1024),
                    disk_percent=disk.percent,
                    disk_used_gb=disk.used / (1024 * 1024 * 1024),
                    disk_available_gb=disk.free / (1024 * 1024 * 1024),
                    network_bytes_sent=net_io.bytes_sent,
                    network_bytes_recv=net_io.bytes_recv,
                    active_connections=active_connections,
                    active_sessions=active_sessions,
                    server_name="main",
                )
                db.add(metric)
                db.commit()
            finally:
                db.close()
        except Exception:
            pass
        
        await asyncio.sleep(60)
