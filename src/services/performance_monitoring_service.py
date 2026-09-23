from datetime import datetime, timedelta
from typing import List, Dict, Any, Optional
from sqlalchemy import func, and_, desc, distinct, Integer, case
from sqlalchemy.orm import Session
from src.models.performance_monitoring import (
    APIPerformanceMetric,
    DatabaseQueryMetric,
    CacheMetric,
    TaskQueueMetric,
    ResourceUtilizationMetric,
    PerformanceAlert,
    AlertSeverity,
    AlertStatus,
)
from src.schemas.performance_monitoring import (
    TimeRange,
    APIEndpointStats,
    APIPerformanceOverview,
    DatabaseQueryStats,
    DatabasePerformanceOverview,
    CachePerformanceStats,
    CachePerformanceOverview,
    TaskQueueStats,
    TaskQueueOverview,
    ResourceUtilizationStats,
    ResourceUtilizationOverview,
    ActiveUserStats,
    ActiveUsersOverview,
    PerformanceAlertResponse,
    PerformanceAlertsOverview,
    PerformanceDashboardData,
    PerformanceThresholds,
)
from src.redis_client import redis_client
import json


class PerformanceMonitoringService:
    def __init__(self, db: Session):
        self.db = db
        self.thresholds = PerformanceThresholds()
    
    def _get_time_range(self, time_range: TimeRange, start_time: datetime = None, end_time: datetime = None):
        """Get start and end times based on time range"""
        now = datetime.utcnow()
        
        if time_range == TimeRange.CUSTOM:
            return start_time or now - timedelta(hours=24), end_time or now
        elif time_range == TimeRange.LAST_HOUR:
            return now - timedelta(hours=1), now
        elif time_range == TimeRange.LAST_24_HOURS:
            return now - timedelta(hours=24), now
        elif time_range == TimeRange.LAST_7_DAYS:
            return now - timedelta(days=7), now
        elif time_range == TimeRange.LAST_30_DAYS:
            return now - timedelta(days=30), now
        
        return now - timedelta(hours=24), now
    
    def get_api_performance(
        self, start_time: datetime, end_time: datetime, institution_id: int = None
    ) -> APIPerformanceOverview:
        """Get API performance overview"""
        
        query = self.db.query(APIPerformanceMetric).filter(
            APIPerformanceMetric.timestamp.between(start_time, end_time)
        )
        
        if institution_id:
            query = query.filter(APIPerformanceMetric.institution_id == institution_id)
        
        total_requests = query.count()
        
        avg_response_time = query.with_entities(
            func.avg(APIPerformanceMetric.response_time_ms)
        ).scalar() or 0.0
        
        error_count = query.filter(APIPerformanceMetric.status_code >= 400).count()
        error_rate = (error_count / total_requests * 100) if total_requests > 0 else 0.0
        
        slowest_endpoints = self._get_slowest_endpoints(start_time, end_time, institution_id)
        most_used_endpoints = self._get_most_used_endpoints(start_time, end_time, institution_id)
        error_endpoints = self._get_error_endpoints(start_time, end_time, institution_id)
        
        requests_by_status = self._get_requests_by_status(start_time, end_time, institution_id)
        requests_over_time = self._get_requests_over_time(start_time, end_time, institution_id)
        
        return APIPerformanceOverview(
            total_requests=total_requests,
            avg_response_time_ms=round(avg_response_time, 2),
            error_rate=round(error_rate, 2),
            slowest_endpoints=slowest_endpoints[:10],
            most_used_endpoints=most_used_endpoints[:10],
            error_endpoints=error_endpoints[:10],
            requests_by_status=requests_by_status,
            requests_over_time=requests_over_time,
        )
    
    def _get_slowest_endpoints(
        self, start_time: datetime, end_time: datetime, institution_id: int = None
    ) -> List[APIEndpointStats]:
        """Get slowest API endpoints"""
        
        query = self.db.query(
            APIPerformanceMetric.endpoint,
            APIPerformanceMetric.method,
            func.count(APIPerformanceMetric.id).label('total_requests'),
            func.avg(APIPerformanceMetric.response_time_ms).label('avg_response_time'),
            func.min(APIPerformanceMetric.response_time_ms).label('min_response_time'),
            func.max(APIPerformanceMetric.response_time_ms).label('max_response_time'),
        ).filter(
            APIPerformanceMetric.timestamp.between(start_time, end_time)
        )
        
        if institution_id:
            query = query.filter(APIPerformanceMetric.institution_id == institution_id)
        
        results = query.group_by(
            APIPerformanceMetric.endpoint,
            APIPerformanceMetric.method
        ).order_by(desc('avg_response_time')).limit(10).all()
        
        endpoints = []
        for result in results:
            error_count = self.db.query(func.count(APIPerformanceMetric.id)).filter(
                APIPerformanceMetric.endpoint == result.endpoint,
                APIPerformanceMetric.method == result.method,
                APIPerformanceMetric.status_code >= 400,
                APIPerformanceMetric.timestamp.between(start_time, end_time)
            ).scalar() or 0
            
            endpoints.append(APIEndpointStats(
                endpoint=result.endpoint,
                method=result.method,
                total_requests=result.total_requests,
                avg_response_time_ms=round(result.avg_response_time, 2),
                min_response_time_ms=round(result.min_response_time, 2),
                max_response_time_ms=round(result.max_response_time, 2),
                p50_response_time_ms=0.0,
                p95_response_time_ms=0.0,
                p99_response_time_ms=0.0,
                error_rate=round((error_count / result.total_requests * 100), 2) if result.total_requests > 0 else 0.0,
                success_rate=round(((result.total_requests - error_count) / result.total_requests * 100), 2) if result.total_requests > 0 else 0.0,
                total_errors=error_count,
                requests_per_minute=round(result.total_requests / ((end_time - start_time).total_seconds() / 60), 2),
            ))
        
        return endpoints
    
    def _get_most_used_endpoints(
        self, start_time: datetime, end_time: datetime, institution_id: int = None
    ) -> List[APIEndpointStats]:
        """Get most used API endpoints"""
        
        query = self.db.query(
            APIPerformanceMetric.endpoint,
            APIPerformanceMetric.method,
            func.count(APIPerformanceMetric.id).label('total_requests'),
            func.avg(APIPerformanceMetric.response_time_ms).label('avg_response_time'),
            func.min(APIPerformanceMetric.response_time_ms).label('min_response_time'),
            func.max(APIPerformanceMetric.response_time_ms).label('max_response_time'),
        ).filter(
            APIPerformanceMetric.timestamp.between(start_time, end_time)
        )
        
        if institution_id:
            query = query.filter(APIPerformanceMetric.institution_id == institution_id)
        
        results = query.group_by(
            APIPerformanceMetric.endpoint,
            APIPerformanceMetric.method
        ).order_by(desc('total_requests')).limit(10).all()
        
        endpoints = []
        for result in results:
            error_count = self.db.query(func.count(APIPerformanceMetric.id)).filter(
                APIPerformanceMetric.endpoint == result.endpoint,
                APIPerformanceMetric.method == result.method,
                APIPerformanceMetric.status_code >= 400,
                APIPerformanceMetric.timestamp.between(start_time, end_time)
            ).scalar() or 0
            
            endpoints.append(APIEndpointStats(
                endpoint=result.endpoint,
                method=result.method,
                total_requests=result.total_requests,
                avg_response_time_ms=round(result.avg_response_time, 2),
                min_response_time_ms=round(result.min_response_time, 2),
                max_response_time_ms=round(result.max_response_time, 2),
                p50_response_time_ms=0.0,
                p95_response_time_ms=0.0,
                p99_response_time_ms=0.0,
                error_rate=round((error_count / result.total_requests * 100), 2) if result.total_requests > 0 else 0.0,
                success_rate=round(((result.total_requests - error_count) / result.total_requests * 100), 2) if result.total_requests > 0 else 0.0,
                total_errors=error_count,
                requests_per_minute=round(result.total_requests / ((end_time - start_time).total_seconds() / 60), 2),
            ))
        
        return endpoints
    
    def _get_error_endpoints(
        self, start_time: datetime, end_time: datetime, institution_id: int = None
    ) -> List[APIEndpointStats]:
        """Get endpoints with most errors"""
        
        query = self.db.query(
            APIPerformanceMetric.endpoint,
            APIPerformanceMetric.method,
            func.count(APIPerformanceMetric.id).label('error_count'),
        ).filter(
            APIPerformanceMetric.timestamp.between(start_time, end_time),
            APIPerformanceMetric.status_code >= 400
        )
        
        if institution_id:
            query = query.filter(APIPerformanceMetric.institution_id == institution_id)
        
        results = query.group_by(
            APIPerformanceMetric.endpoint,
            APIPerformanceMetric.method
        ).order_by(desc('error_count')).limit(10).all()
        
        endpoints = []
        for result in results:
            total_requests = self.db.query(func.count(APIPerformanceMetric.id)).filter(
                APIPerformanceMetric.endpoint == result.endpoint,
                APIPerformanceMetric.method == result.method,
                APIPerformanceMetric.timestamp.between(start_time, end_time)
            ).scalar() or 0
            
            avg_response = self.db.query(func.avg(APIPerformanceMetric.response_time_ms)).filter(
                APIPerformanceMetric.endpoint == result.endpoint,
                APIPerformanceMetric.method == result.method,
                APIPerformanceMetric.timestamp.between(start_time, end_time)
            ).scalar() or 0.0
            
            endpoints.append(APIEndpointStats(
                endpoint=result.endpoint,
                method=result.method,
                total_requests=total_requests,
                avg_response_time_ms=round(avg_response, 2),
                min_response_time_ms=0.0,
                max_response_time_ms=0.0,
                p50_response_time_ms=0.0,
                p95_response_time_ms=0.0,
                p99_response_time_ms=0.0,
                error_rate=round((result.error_count / total_requests * 100), 2) if total_requests > 0 else 0.0,
                success_rate=round(((total_requests - result.error_count) / total_requests * 100), 2) if total_requests > 0 else 0.0,
                total_errors=result.error_count,
                requests_per_minute=0.0,
            ))
        
        return endpoints
    
    def _get_requests_by_status(
        self, start_time: datetime, end_time: datetime, institution_id: int = None
    ) -> Dict[int, int]:
        """Get request counts by status code"""
        
        query = self.db.query(
            APIPerformanceMetric.status_code,
            func.count(APIPerformanceMetric.id).label('count')
        ).filter(
            APIPerformanceMetric.timestamp.between(start_time, end_time)
        )
        
        if institution_id:
            query = query.filter(APIPerformanceMetric.institution_id == institution_id)
        
        results = query.group_by(APIPerformanceMetric.status_code).all()
        
        return {result.status_code: result.count for result in results}
    
    def _get_requests_over_time(
        self, start_time: datetime, end_time: datetime, institution_id: int = None
    ) -> List[Dict[str, Any]]:
        """Get request counts over time"""
        
        interval = self._calculate_time_interval(start_time, end_time)
        
        if interval == 'minute':
            trunc_expr = func.date_format(APIPerformanceMetric.timestamp, '%Y-%m-%d %H:%i:00')
        elif interval == 'hour':
            trunc_expr = func.date_format(APIPerformanceMetric.timestamp, '%Y-%m-%d %H:00:00')
        else:
            trunc_expr = func.date_format(APIPerformanceMetric.timestamp, '%Y-%m-%d')
        
        query = self.db.query(
            trunc_expr.label('time_bucket'),
            func.count(APIPerformanceMetric.id).label('requests'),
            func.avg(APIPerformanceMetric.response_time_ms).label('avg_response_time'),
        ).filter(
            APIPerformanceMetric.timestamp.between(start_time, end_time)
        )
        
        if institution_id:
            query = query.filter(APIPerformanceMetric.institution_id == institution_id)
        
        results = query.group_by('time_bucket').order_by('time_bucket').all()
        
        return [
            {
                'timestamp': result.time_bucket,
                'requests': result.requests,
                'avg_response_time_ms': round(result.avg_response_time, 2),
            }
            for result in results
        ]
    
    def _calculate_time_interval(self, start_time: datetime, end_time: datetime) -> str:
        """Calculate appropriate time interval for grouping"""
        duration = end_time - start_time
        
        if duration <= timedelta(hours=1):
            return 'minute'
        elif duration <= timedelta(hours=24):
            return 'hour'
        elif duration <= timedelta(days=7):
            return 'day'
        else:
            return 'day'
    
    def get_database_performance(
        self, start_time: datetime, end_time: datetime, institution_id: int = None
    ) -> DatabasePerformanceOverview:
        """Get database performance overview"""
        
        query = self.db.query(DatabaseQueryMetric).filter(
            DatabaseQueryMetric.timestamp.between(start_time, end_time)
        )
        
        if institution_id:
            query = query.filter(DatabaseQueryMetric.institution_id == institution_id)
        
        total_queries = query.count()
        
        avg_query_time = query.with_entities(
            func.avg(DatabaseQueryMetric.execution_time_ms)
        ).scalar() or 0.0
        
        slow_queries_count = query.filter(DatabaseQueryMetric.is_slow == True).count()
        
        slowest_queries = self._get_slowest_queries(start_time, end_time, institution_id)
        
        queries_by_type = {}
        type_results = query.with_entities(
            DatabaseQueryMetric.query_type,
            func.count(DatabaseQueryMetric.id)
        ).group_by(DatabaseQueryMetric.query_type).all()
        
        for result in type_results:
            queries_by_type[result[0]] = result[1]
        
        queries_by_table = {}
        table_results = query.filter(
            DatabaseQueryMetric.table_name.isnot(None)
        ).with_entities(
            DatabaseQueryMetric.table_name,
            func.count(DatabaseQueryMetric.id)
        ).group_by(DatabaseQueryMetric.table_name).all()
        
        for result in table_results:
            queries_by_table[result[0]] = result[1]
        
        queries_over_time = self._get_queries_over_time(start_time, end_time, institution_id)
        
        return DatabasePerformanceOverview(
            total_queries=total_queries,
            avg_query_time_ms=round(avg_query_time, 2),
            slow_queries_count=slow_queries_count,
            slowest_queries=slowest_queries[:10],
            queries_by_type=queries_by_type,
            queries_by_table=queries_by_table,
            queries_over_time=queries_over_time,
        )
    
    def _get_slowest_queries(
        self, start_time: datetime, end_time: datetime, institution_id: int = None
    ) -> List[DatabaseQueryStats]:
        """Get slowest database queries"""
        
        query = self.db.query(
            DatabaseQueryMetric.query_hash,
            DatabaseQueryMetric.query_type,
            DatabaseQueryMetric.table_name,
            func.count(DatabaseQueryMetric.id).label('execution_count'),
            func.avg(DatabaseQueryMetric.execution_time_ms).label('avg_execution_time'),
            func.min(DatabaseQueryMetric.execution_time_ms).label('min_execution_time'),
            func.max(DatabaseQueryMetric.execution_time_ms).label('max_execution_time'),
            func.sum(DatabaseQueryMetric.execution_time_ms).label('total_execution_time'),
            func.sum(func.cast(DatabaseQueryMetric.is_slow, Integer)).label('slow_count'),
            func.sum(func.coalesce(DatabaseQueryMetric.rows_affected, 0)).label('total_rows'),
        ).filter(
            DatabaseQueryMetric.timestamp.between(start_time, end_time)
        )
        
        if institution_id:
            query = query.filter(DatabaseQueryMetric.institution_id == institution_id)
        
        results = query.group_by(
            DatabaseQueryMetric.query_hash,
            DatabaseQueryMetric.query_type,
            DatabaseQueryMetric.table_name
        ).order_by(desc('avg_execution_time')).limit(10).all()
        
        return [
            DatabaseQueryStats(
                query_hash=result.query_hash,
                query_type=result.query_type,
                table_name=result.table_name,
                execution_count=result.execution_count,
                avg_execution_time_ms=round(result.avg_execution_time, 2),
                min_execution_time_ms=round(result.min_execution_time, 2),
                max_execution_time_ms=round(result.max_execution_time, 2),
                total_execution_time_ms=round(result.total_execution_time, 2),
                slow_query_count=result.slow_count,
                total_rows_affected=result.total_rows,
            )
            for result in results
        ]
    
    def _get_queries_over_time(
        self, start_time: datetime, end_time: datetime, institution_id: int = None
    ) -> List[Dict[str, Any]]:
        """Get query counts over time"""
        
        interval = self._calculate_time_interval(start_time, end_time)
        
        if interval == 'minute':
            trunc_expr = func.date_format(DatabaseQueryMetric.timestamp, '%Y-%m-%d %H:%i:00')
        elif interval == 'hour':
            trunc_expr = func.date_format(DatabaseQueryMetric.timestamp, '%Y-%m-%d %H:00:00')
        else:
            trunc_expr = func.date_format(DatabaseQueryMetric.timestamp, '%Y-%m-%d')
        
        query = self.db.query(
            trunc_expr.label('time_bucket'),
            func.count(DatabaseQueryMetric.id).label('queries'),
            func.avg(DatabaseQueryMetric.execution_time_ms).label('avg_execution_time'),
        ).filter(
            DatabaseQueryMetric.timestamp.between(start_time, end_time)
        )
        
        if institution_id:
            query = query.filter(DatabaseQueryMetric.institution_id == institution_id)
        
        results = query.group_by('time_bucket').order_by('time_bucket').all()
        
        return [
            {
                'timestamp': result.time_bucket,
                'queries': result.queries,
                'avg_execution_time_ms': round(result.avg_execution_time, 2),
            }
            for result in results
        ]
    
    def get_cache_performance(
        self, start_time: datetime, end_time: datetime, institution_id: int = None
    ) -> CachePerformanceOverview:
        """Get cache performance overview"""
        
        query = self.db.query(CacheMetric).filter(
            CacheMetric.timestamp.between(start_time, end_time)
        )
        
        if institution_id:
            query = query.filter(CacheMetric.institution_id == institution_id)
        
        total_operations = query.count()
        
        total_hits = query.filter(CacheMetric.hit == True).count()
        total_misses = query.filter(CacheMetric.hit == False).count()
        
        overall_hit_rate = (total_hits / total_operations * 100) if total_operations > 0 else 0.0
        
        avg_operation_time = query.with_entities(
            func.avg(CacheMetric.execution_time_ms)
        ).scalar() or 0.0
        
        cache_stats_by_pattern = self._get_cache_stats_by_pattern(start_time, end_time, institution_id)
        operations_over_time = self._get_cache_operations_over_time(start_time, end_time, institution_id)
        
        return CachePerformanceOverview(
            total_operations=total_operations,
            total_hits=total_hits,
            total_misses=total_misses,
            overall_hit_rate=round(overall_hit_rate, 2),
            avg_operation_time_ms=round(avg_operation_time, 2),
            cache_stats_by_pattern=cache_stats_by_pattern[:10],
            operations_over_time=operations_over_time,
        )
    
    def _get_cache_stats_by_pattern(
        self, start_time: datetime, end_time: datetime, institution_id: int = None
    ) -> List[CachePerformanceStats]:
        """Get cache stats grouped by key pattern"""
        
        query = self.db.query(
            CacheMetric.cache_key_pattern,
            func.count(CacheMetric.id).label('total_operations'),
            func.sum(func.cast(CacheMetric.hit, Integer)).label('hits'),
            func.avg(CacheMetric.execution_time_ms).label('avg_execution_time'),
            func.sum(func.coalesce(CacheMetric.value_size_bytes, 0)).label('total_size'),
        ).filter(
            CacheMetric.timestamp.between(start_time, end_time)
        )
        
        if institution_id:
            query = query.filter(CacheMetric.institution_id == institution_id)
        
        results = query.group_by(CacheMetric.cache_key_pattern).all()
        
        stats = []
        for result in results:
            misses = result.total_operations - (result.hits or 0)
            hit_rate = ((result.hits or 0) / result.total_operations * 100) if result.total_operations > 0 else 0.0
            
            stats.append(CachePerformanceStats(
                cache_key_pattern=result.cache_key_pattern,
                total_operations=result.total_operations,
                hits=result.hits or 0,
                misses=misses,
                hit_rate=round(hit_rate, 2),
                avg_execution_time_ms=round(result.avg_execution_time, 2),
                total_size_bytes=result.total_size,
            ))
        
        return sorted(stats, key=lambda x: x.total_operations, reverse=True)
    
    def _get_cache_operations_over_time(
        self, start_time: datetime, end_time: datetime, institution_id: int = None
    ) -> List[Dict[str, Any]]:
        """Get cache operations over time"""
        
        interval = self._calculate_time_interval(start_time, end_time)
        
        if interval == 'minute':
            trunc_expr = func.date_format(CacheMetric.timestamp, '%Y-%m-%d %H:%i:00')
        elif interval == 'hour':
            trunc_expr = func.date_format(CacheMetric.timestamp, '%Y-%m-%d %H:00:00')
        else:
            trunc_expr = func.date_format(CacheMetric.timestamp, '%Y-%m-%d')
        
        query = self.db.query(
            trunc_expr.label('time_bucket'),
            func.count(CacheMetric.id).label('operations'),
            func.sum(func.cast(CacheMetric.hit, Integer)).label('hits'),
        ).filter(
            CacheMetric.timestamp.between(start_time, end_time)
        )
        
        if institution_id:
            query = query.filter(CacheMetric.institution_id == institution_id)
        
        results = query.group_by('time_bucket').order_by('time_bucket').all()
        
        return [
            {
                'timestamp': result.time_bucket,
                'operations': result.operations,
                'hits': result.hits or 0,
                'hit_rate': round(((result.hits or 0) / result.operations * 100), 2) if result.operations > 0 else 0.0,
            }
            for result in results
        ]
    
    def get_task_queue_performance(
        self, start_time: datetime, end_time: datetime, institution_id: int = None
    ) -> TaskQueueOverview:
        """Get task queue performance overview"""
        
        query = self.db.query(TaskQueueMetric).filter(
            TaskQueueMetric.timestamp.between(start_time, end_time)
        )
        
        if institution_id:
            query = query.filter(TaskQueueMetric.institution_id == institution_id)
        
        total_tasks = query.count()
        active_tasks = query.filter(TaskQueueMetric.status.in_(['PENDING', 'STARTED', 'RETRY'])).count()
        completed_tasks = query.filter(TaskQueueMetric.status == 'SUCCESS').count()
        failed_tasks = query.filter(TaskQueueMetric.status == 'FAILURE').count()
        
        avg_execution_time = query.filter(
            TaskQueueMetric.execution_time_ms.isnot(None)
        ).with_entities(
            func.avg(TaskQueueMetric.execution_time_ms)
        ).scalar() or 0.0
        
        avg_wait_time = query.filter(
            TaskQueueMetric.queue_wait_time_ms.isnot(None)
        ).with_entities(
            func.avg(TaskQueueMetric.queue_wait_time_ms)
        ).scalar() or 0.0
        
        task_stats = self._get_task_stats(start_time, end_time, institution_id)
        tasks_over_time = self._get_tasks_over_time(start_time, end_time, institution_id)
        
        return TaskQueueOverview(
            total_tasks=total_tasks,
            active_tasks=active_tasks,
            completed_tasks=completed_tasks,
            failed_tasks=failed_tasks,
            avg_execution_time_ms=round(avg_execution_time, 2),
            avg_wait_time_ms=round(avg_wait_time, 2),
            task_stats=task_stats[:10],
            tasks_over_time=tasks_over_time,
        )
    
    def _get_task_stats(
        self, start_time: datetime, end_time: datetime, institution_id: int = None
    ) -> List[TaskQueueStats]:
        """Get task stats grouped by task name"""
        
        query = self.db.query(
            TaskQueueMetric.task_name,
            func.count(TaskQueueMetric.id).label('total_tasks'),
            func.sum(case((TaskQueueMetric.status == 'SUCCESS', 1), else_=0)).label('successful'),
            func.sum(case((TaskQueueMetric.status == 'FAILURE', 1), else_=0)).label('failed'),
            func.sum(case((TaskQueueMetric.status.in_(['PENDING', 'STARTED', 'RETRY']), 1), else_=0)).label('pending'),
            func.avg(TaskQueueMetric.execution_time_ms).label('avg_execution_time'),
            func.avg(TaskQueueMetric.queue_wait_time_ms).label('avg_wait_time'),
            func.avg(TaskQueueMetric.retries).label('avg_retries'),
        ).filter(
            TaskQueueMetric.timestamp.between(start_time, end_time)
        )
        
        if institution_id:
            query = query.filter(TaskQueueMetric.institution_id == institution_id)
        
        results = query.group_by(TaskQueueMetric.task_name).all()
        
        return [
            TaskQueueStats(
                task_name=result.task_name,
                total_tasks=result.total_tasks,
                successful_tasks=result.successful,
                failed_tasks=result.failed,
                pending_tasks=result.pending,
                avg_execution_time_ms=round(result.avg_execution_time or 0.0, 2),
                avg_wait_time_ms=round(result.avg_wait_time or 0.0, 2),
                avg_retries=round(result.avg_retries, 2),
                error_rate=round((result.failed / result.total_tasks * 100), 2) if result.total_tasks > 0 else 0.0,
            )
            for result in results
        ]
    
    def _get_tasks_over_time(
        self, start_time: datetime, end_time: datetime, institution_id: int = None
    ) -> List[Dict[str, Any]]:
        """Get task counts over time"""
        
        interval = self._calculate_time_interval(start_time, end_time)
        
        if interval == 'minute':
            trunc_expr = func.date_format(TaskQueueMetric.timestamp, '%Y-%m-%d %H:%i:00')
        elif interval == 'hour':
            trunc_expr = func.date_format(TaskQueueMetric.timestamp, '%Y-%m-%d %H:00:00')
        else:
            trunc_expr = func.date_format(TaskQueueMetric.timestamp, '%Y-%m-%d')
        
        query = self.db.query(
            trunc_expr.label('time_bucket'),
            func.count(TaskQueueMetric.id).label('tasks'),
            func.sum(case((TaskQueueMetric.status == 'SUCCESS', 1), else_=0)).label('successful'),
            func.sum(case((TaskQueueMetric.status == 'FAILURE', 1), else_=0)).label('failed'),
        ).filter(
            TaskQueueMetric.timestamp.between(start_time, end_time)
        )
        
        if institution_id:
            query = query.filter(TaskQueueMetric.institution_id == institution_id)
        
        results = query.group_by('time_bucket').order_by('time_bucket').all()
        
        return [
            {
                'timestamp': result.time_bucket,
                'tasks': result.tasks,
                'successful': result.successful,
                'failed': result.failed,
            }
            for result in results
        ]
    
    def get_resource_utilization(
        self, start_time: datetime, end_time: datetime
    ) -> ResourceUtilizationOverview:
        """Get resource utilization overview"""
        
        query = self.db.query(ResourceUtilizationMetric).filter(
            ResourceUtilizationMetric.timestamp.between(start_time, end_time)
        )
        
        latest = query.order_by(desc(ResourceUtilizationMetric.timestamp)).first()
        
        if not latest:
            return ResourceUtilizationOverview(
                current_cpu_percent=0.0,
                current_memory_percent=0.0,
                current_memory_used_mb=0.0,
                current_disk_percent=0.0,
                current_active_connections=0,
                current_active_sessions=0,
                avg_cpu_percent=0.0,
                avg_memory_percent=0.0,
                peak_cpu_percent=0.0,
                peak_memory_percent=0.0,
                utilization_over_time=[],
            )
        
        avg_cpu = query.with_entities(func.avg(ResourceUtilizationMetric.cpu_percent)).scalar() or 0.0
        avg_memory = query.with_entities(func.avg(ResourceUtilizationMetric.memory_percent)).scalar() or 0.0
        peak_cpu = query.with_entities(func.max(ResourceUtilizationMetric.cpu_percent)).scalar() or 0.0
        peak_memory = query.with_entities(func.max(ResourceUtilizationMetric.memory_percent)).scalar() or 0.0
        
        utilization_over_time = []
        results = query.order_by(ResourceUtilizationMetric.timestamp).all()
        
        for result in results:
            utilization_over_time.append(ResourceUtilizationStats(
                timestamp=result.timestamp,
                cpu_percent=result.cpu_percent,
                memory_percent=result.memory_percent,
                memory_used_mb=result.memory_used_mb,
                disk_percent=result.disk_percent,
                active_connections=result.active_connections,
                active_sessions=result.active_sessions,
            ))
        
        return ResourceUtilizationOverview(
            current_cpu_percent=latest.cpu_percent or 0.0,
            current_memory_percent=latest.memory_percent or 0.0,
            current_memory_used_mb=latest.memory_used_mb or 0.0,
            current_disk_percent=latest.disk_percent or 0.0,
            current_active_connections=latest.active_connections or 0,
            current_active_sessions=latest.active_sessions or 0,
            avg_cpu_percent=round(avg_cpu, 2),
            avg_memory_percent=round(avg_memory, 2),
            peak_cpu_percent=round(peak_cpu, 2),
            peak_memory_percent=round(peak_memory, 2),
            utilization_over_time=utilization_over_time,
        )
    
    async def get_active_users(
        self, start_time: datetime, end_time: datetime, institution_id: int = None
    ) -> ActiveUsersOverview:
        """Get active users overview"""
        
        query = self.db.query(APIPerformanceMetric).filter(
            APIPerformanceMetric.timestamp.between(start_time, end_time),
            APIPerformanceMetric.user_id.isnot(None)
        )
        
        if institution_id:
            query = query.filter(APIPerformanceMetric.institution_id == institution_id)
        
        total_unique_users = query.with_entities(
            func.count(distinct(APIPerformanceMetric.user_id))
        ).scalar() or 0
        
        current_active_users = 0
        if redis_client:
            try:
                keys = await redis_client.keys("session:*")
                current_active_users = len(keys)
            except Exception:
                pass
        
        active_users_over_time = self._get_active_users_over_time(start_time, end_time, institution_id)
        
        peak_active_users = max([stat['active_users'] for stat in active_users_over_time]) if active_users_over_time else 0
        avg_active_users = sum([stat['active_users'] for stat in active_users_over_time]) / len(active_users_over_time) if active_users_over_time else 0
        
        return ActiveUsersOverview(
            current_active_users=current_active_users,
            peak_active_users=peak_active_users,
            avg_active_users=round(avg_active_users, 2),
            total_unique_users=total_unique_users,
            active_users_over_time=[
                ActiveUserStats(
                    timestamp=datetime.fromisoformat(stat['timestamp']),
                    active_users=stat['active_users'],
                    new_sessions=stat.get('new_sessions', 0),
                    total_sessions=stat.get('total_sessions', 0),
                )
                for stat in active_users_over_time
            ],
        )
    
    def _get_active_users_over_time(
        self, start_time: datetime, end_time: datetime, institution_id: int = None
    ) -> List[Dict[str, Any]]:
        """Get active user counts over time"""
        
        interval = self._calculate_time_interval(start_time, end_time)
        
        if interval == 'minute':
            trunc_expr = func.date_format(APIPerformanceMetric.timestamp, '%Y-%m-%d %H:%i:00')
        elif interval == 'hour':
            trunc_expr = func.date_format(APIPerformanceMetric.timestamp, '%Y-%m-%d %H:00:00')
        else:
            trunc_expr = func.date_format(APIPerformanceMetric.timestamp, '%Y-%m-%d')
        
        query = self.db.query(
            trunc_expr.label('time_bucket'),
            func.count(distinct(APIPerformanceMetric.user_id)).label('active_users'),
        ).filter(
            APIPerformanceMetric.timestamp.between(start_time, end_time),
            APIPerformanceMetric.user_id.isnot(None)
        )
        
        if institution_id:
            query = query.filter(APIPerformanceMetric.institution_id == institution_id)
        
        results = query.group_by('time_bucket').order_by('time_bucket').all()
        
        return [
            {
                'timestamp': result.time_bucket,
                'active_users': result.active_users,
                'new_sessions': 0,
                'total_sessions': 0,
            }
            for result in results
        ]
    
    def get_performance_alerts(
        self, start_time: datetime, end_time: datetime, institution_id: int = None, status: AlertStatus = None
    ) -> PerformanceAlertsOverview:
        """Get performance alerts overview"""
        
        query = self.db.query(PerformanceAlert).filter(
            PerformanceAlert.timestamp.between(start_time, end_time)
        )
        
        if institution_id:
            query = query.filter(PerformanceAlert.institution_id == institution_id)
        
        if status:
            query = query.filter(PerformanceAlert.status == status)
        
        total_alerts = query.count()
        active_alerts = query.filter(PerformanceAlert.status == AlertStatus.ACTIVE).count()
        critical_alerts = query.filter(PerformanceAlert.severity == AlertSeverity.CRITICAL).count()
        
        alerts_by_severity = {}
        severity_results = query.with_entities(
            PerformanceAlert.severity,
            func.count(PerformanceAlert.id)
        ).group_by(PerformanceAlert.severity).all()
        
        for result in severity_results:
            alerts_by_severity[result[0].value] = result[1]
        
        alerts_by_type = {}
        type_results = query.with_entities(
            PerformanceAlert.alert_type,
            func.count(PerformanceAlert.id)
        ).group_by(PerformanceAlert.alert_type).all()
        
        for result in type_results:
            alerts_by_type[result[0]] = result[1]
        
        recent_alerts = query.order_by(desc(PerformanceAlert.timestamp)).limit(20).all()
        
        return PerformanceAlertsOverview(
            total_alerts=total_alerts,
            active_alerts=active_alerts,
            critical_alerts=critical_alerts,
            alerts_by_severity=alerts_by_severity,
            alerts_by_type=alerts_by_type,
            recent_alerts=[PerformanceAlertResponse.from_orm(alert) for alert in recent_alerts],
        )
    
    async def get_dashboard_data(
        self, time_range: TimeRange, start_time: datetime = None, end_time: datetime = None, institution_id: int = None
    ) -> PerformanceDashboardData:
        """Get complete performance dashboard data"""

        start, end = self._get_time_range(time_range, start_time, end_time)

        return PerformanceDashboardData(
            time_range=time_range,
            start_time=start,
            end_time=end,
            api_performance=self.get_api_performance(start, end, institution_id),
            database_performance=self.get_database_performance(start, end, institution_id),
            cache_performance=self.get_cache_performance(start, end, institution_id),
            task_queue_performance=self.get_task_queue_performance(start, end, institution_id),
            resource_utilization=self.get_resource_utilization(start, end),
            active_users=await self.get_active_users(start, end, institution_id),
            alerts=self.get_performance_alerts(start, end, institution_id),
        )
    
    def acknowledge_alerts(self, alert_ids: List[int], user_id: int):
        """Acknowledge alerts"""
        self.db.query(PerformanceAlert).filter(
            PerformanceAlert.id.in_(alert_ids)
        ).update({
            'status': AlertStatus.ACKNOWLEDGED,
            'acknowledged_by': user_id,
            'acknowledged_at': datetime.utcnow(),
        }, synchronize_session=False)
        self.db.commit()
    
    def resolve_alerts(self, alert_ids: List[int]):
        """Resolve alerts"""
        self.db.query(PerformanceAlert).filter(
            PerformanceAlert.id.in_(alert_ids)
        ).update({
            'status': AlertStatus.RESOLVED,
            'resolved_at': datetime.utcnow(),
        }, synchronize_session=False)
        self.db.commit()
    
    def create_alert(
        self,
        alert_type: str,
        severity: AlertSeverity,
        title: str,
        description: str,
        metric_value: float = None,
        threshold_value: float = None,
        affected_resource: str = None,
        institution_id: int = None,
        metadata: dict = None,
    ) -> PerformanceAlert:
        """Create a new performance alert"""
        alert = PerformanceAlert(
            alert_type=alert_type,
            severity=severity,
            title=title,
            description=description,
            metric_value=metric_value,
            threshold_value=threshold_value,
            affected_resource=affected_resource,
            institution_id=institution_id,
            metadata_json=metadata,
        )
        self.db.add(alert)
        self.db.commit()
        self.db.refresh(alert)
        return alert
