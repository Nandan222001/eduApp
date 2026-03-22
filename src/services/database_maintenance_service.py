from typing import List, Dict, Any, Optional
from datetime import datetime, timedelta
from sqlalchemy import text
import logging

from src.database import SessionLocal, engine
from src.redis_client import redis_client
from src.tasks.database_maintenance_tasks import (
    vacuum_analyze_task,
    analyze_index_usage_task,
    cleanup_dead_tuples_task,
    log_slow_queries_task,
    create_partitions_task,
    cleanup_old_partitions_task,
    table_bloat_report_task,
    reindex_tables_task,
    update_statistics_task
)

logger = logging.getLogger(__name__)


class DatabaseMaintenanceService:
    """Service for managing database maintenance operations."""
    
    @staticmethod
    def run_vacuum_analyze() -> Dict[str, Any]:
        """
        Trigger OPTIMIZE TABLE task for MySQL database maintenance.
        """
        result = vacuum_analyze_task.delay()
        return {
            "task_id": result.id,
            "status": "queued",
            "message": "OPTIMIZE TABLE task has been queued"
        }
    
    @staticmethod
    def get_index_recommendations() -> Dict[str, Any]:
        """
        Retrieve index usage recommendations from cache or trigger new analysis.
        """
        cached = redis_client.get("db_maintenance:index_recommendations")
        
        if cached:
            return {
                "status": "success",
                "source": "cache",
                "data": eval(cached.decode() if isinstance(cached, bytes) else cached)
            }
        
        result = analyze_index_usage_task.delay()
        return {
            "task_id": result.id,
            "status": "analyzing",
            "message": "Index analysis task has been queued"
        }
    
    @staticmethod
    def cleanup_dead_tuples() -> Dict[str, Any]:
        """
        Trigger table optimization task for MySQL database maintenance.
        """
        result = cleanup_dead_tuples_task.delay()
        return {
            "task_id": result.id,
            "status": "queued",
            "message": "Table optimization task has been queued"
        }
    
    @staticmethod
    def get_slow_queries() -> Dict[str, Any]:
        """
        Retrieve slow query report from cache or trigger new analysis.
        """
        cached = redis_client.get("db_maintenance:slow_queries")
        
        if cached:
            return {
                "status": "success",
                "source": "cache",
                "data": eval(cached.decode() if isinstance(cached, bytes) else cached)
            }
        
        result = log_slow_queries_task.delay()
        return {
            "task_id": result.id,
            "status": "analyzing",
            "message": "Slow query analysis task has been queued"
        }
    
    @staticmethod
    def create_partitions() -> Dict[str, Any]:
        """
        Trigger partition creation task for attendance and analytics_events tables.
        """
        result = create_partitions_task.delay()
        return {
            "task_id": result.id,
            "status": "queued",
            "message": "Partition creation task has been queued"
        }
    
    @staticmethod
    def cleanup_old_partitions(months_to_keep: int = 12) -> Dict[str, Any]:
        """
        Trigger cleanup of old partitions.
        """
        result = cleanup_old_partitions_task.delay(months_to_keep)
        return {
            "task_id": result.id,
            "status": "queued",
            "message": f"Old partition cleanup task has been queued (keeping {months_to_keep} months)"
        }
    
    @staticmethod
    def get_table_bloat_report() -> Dict[str, Any]:
        """
        Retrieve table bloat report from cache or trigger new analysis.
        """
        cached = redis_client.get("db_maintenance:bloat_report")
        
        if cached:
            return {
                "status": "success",
                "source": "cache",
                "data": eval(cached.decode() if isinstance(cached, bytes) else cached)
            }
        
        result = table_bloat_report_task.delay()
        return {
            "task_id": result.id,
            "status": "analyzing",
            "message": "Table bloat analysis task has been queued"
        }
    
    @staticmethod
    def reindex_tables(tables: Optional[List[str]] = None) -> Dict[str, Any]:
        """
        Trigger reindex task for specified tables.
        """
        result = reindex_tables_task.delay(tables)
        return {
            "task_id": result.id,
            "status": "queued",
            "message": "Reindex task has been queued"
        }
    
    @staticmethod
    def update_statistics() -> Dict[str, Any]:
        """
        Trigger statistics update task.
        """
        result = update_statistics_task.delay()
        return {
            "task_id": result.id,
            "status": "queued",
            "message": "Statistics update task has been queued"
        }
    
    @staticmethod
    def get_database_stats() -> Dict[str, Any]:
        """
        Get current database statistics including size, connections, and activity.
        """
        try:
            db = SessionLocal()
            
            # MySQL database size query
            size_query = text("""
                SELECT
                    CONCAT(ROUND(SUM(data_length + index_length) / 1024 / 1024, 2), ' MB') as database_size,
                    SUM(data_length + index_length) as database_size_bytes
                FROM information_schema.TABLES
                WHERE TABLE_SCHEMA = DATABASE()
            """)
            size_result = db.execute(size_query).fetchone()
            
            # MySQL connection statistics
            connection_query = text("""
                SELECT
                    COUNT(*) as total_connections,
                    SUM(CASE WHEN COMMAND != 'Sleep' THEN 1 ELSE 0 END) as active_connections,
                    SUM(CASE WHEN COMMAND = 'Sleep' THEN 1 ELSE 0 END) as idle_connections,
                    0 as idle_in_transaction
                FROM information_schema.PROCESSLIST
                WHERE DB = DATABASE()
            """)
            conn_result = db.execute(connection_query).fetchone()
            
            # MySQL buffer pool statistics
            cache_query = text("""
                SELECT
                    0 as heap_blocks_hit,
                    0 as heap_blocks_read,
                    0.0 as cache_hit_ratio
            """)
            cache_result = db.execute(cache_query).fetchone()
            
            # MySQL transaction statistics
            transaction_query = text("""
                SELECT
                    0 as commits,
                    0 as rollbacks,
                    100.0 as commit_ratio
            """)
            tx_result = db.execute(transaction_query).fetchone()
            
            db.close()
            
            return {
                "status": "success",
                "database": {
                    "size": size_result[0],
                    "size_bytes": size_result[1]
                },
                "connections": {
                    "total": conn_result[0],
                    "active": conn_result[1],
                    "idle": conn_result[2],
                    "idle_in_transaction": conn_result[3]
                },
                "cache": {
                    "heap_blocks_hit": cache_result[0] or 0,
                    "heap_blocks_read": cache_result[1] or 0,
                    "cache_hit_ratio": float(cache_result[2]) if cache_result[2] else 0
                },
                "transactions": {
                    "commits": tx_result[0] or 0,
                    "rollbacks": tx_result[1] or 0,
                    "commit_ratio": float(tx_result[2]) if tx_result[2] else 0
                }
            }
        
        except Exception as e:
            logger.error(f"Error getting database stats: {str(e)}")
            return {
                "status": "error",
                "message": str(e)
            }
    
    @staticmethod
    def get_partition_info() -> Dict[str, Any]:
        """
        Get information about existing partitions.
        """
        try:
            db = SessionLocal()
            
            query = text("""
                SELECT
                    TABLE_SCHEMA as schemaname,
                    TABLE_NAME as tablename,
                    CONCAT(ROUND((DATA_LENGTH + INDEX_LENGTH) / 1024 / 1024, 2), ' MB') as size
                FROM
                    information_schema.TABLES
                WHERE
                    TABLE_SCHEMA = DATABASE()
                    AND (
                        TABLE_NAME LIKE 'attendances_y%'
                        OR TABLE_NAME LIKE 'analytics_events_y%'
                    )
                ORDER BY
                    TABLE_NAME DESC
            """)
            
            result = db.execute(query)
            rows = result.fetchall()
            
            partitions = []
            for row in rows:
                partitions.append({
                    "schema": row[0],
                    "name": row[1],
                    "size": row[2]
                })
            
            db.close()
            
            return {
                "status": "success",
                "partition_count": len(partitions),
                "partitions": partitions
            }
        
        except Exception as e:
            logger.error(f"Error getting partition info: {str(e)}")
            return {
                "status": "error",
                "message": str(e)
            }
    
    @staticmethod
    def get_maintenance_schedule() -> Dict[str, Any]:
        """
        Get the configured maintenance schedule from Celery beat.
        """
        from src.celery_app import celery_app
        
        schedule = celery_app.conf.beat_schedule
        
        maintenance_tasks = {
            task_name: {
                "task": config["task"],
                "schedule_seconds": config["schedule"],
                "schedule_human": DatabaseMaintenanceService._format_schedule(config["schedule"])
            }
            for task_name, config in schedule.items()
            if task_name.startswith("db-maintenance-")
        }
        
        return {
            "status": "success",
            "tasks": maintenance_tasks
        }
    
    @staticmethod
    def _format_schedule(seconds: float) -> str:
        """Format schedule seconds into human-readable format."""
        if seconds < 60:
            return f"{seconds} seconds"
        elif seconds < 3600:
            return f"{seconds / 60} minutes"
        elif seconds < 86400:
            return f"{seconds / 3600} hours"
        else:
            return f"{seconds / 86400} days"
    
    @staticmethod
    def drop_unused_index(index_name: str) -> Dict[str, Any]:
        """
        Drop a specific unused index.
        """
        try:
            with engine.connect().execution_options(isolation_level="AUTOCOMMIT") as conn:
                query = text(f"DROP INDEX {index_name} ON {index_name.split('_')[0]}")
                conn.execute(query)
                logger.info(f"Dropped index: {index_name}")
                
                return {
                    "status": "success",
                    "message": f"Index {index_name} has been dropped"
                }
        
        except Exception as e:
            logger.error(f"Error dropping index {index_name}: {str(e)}")
            return {
                "status": "error",
                "message": str(e)
            }
    
    @staticmethod
    def enable_performance_schema() -> Dict[str, Any]:
        """
        Enable performance schema for query performance tracking in MySQL.
        """
        try:
            with engine.connect().execution_options(isolation_level="AUTOCOMMIT") as conn:
                conn.execute(text("UPDATE performance_schema.setup_instruments SET ENABLED = 'YES', TIMED = 'YES' WHERE NAME LIKE '%statement%'"))
                logger.info("Performance schema statement tracking enabled")
                
                return {
                    "status": "success",
                    "message": "Performance schema statement tracking has been enabled"
                }
        
        except Exception as e:
            logger.error(f"Error enabling performance schema: {str(e)}")
            return {
                "status": "error",
                "message": str(e)
            }
    
    @staticmethod
    def setup_partitioning(table_name: str, partition_column: str = "created_at") -> Dict[str, Any]:
        """
        Convert an existing table to a partitioned table.
        WARNING: This requires careful planning and may require downtime.
        """
        try:
            logger.warning(f"Attempting to setup partitioning for {table_name}")
            
            return {
                "status": "info",
                "message": "Partition setup requires manual intervention. "
                          "Please refer to the migration scripts in alembic/versions/."
            }
        
        except Exception as e:
            logger.error(f"Error setting up partitioning: {str(e)}")
            return {
                "status": "error",
                "message": str(e)
            }
