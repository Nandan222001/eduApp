from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from src.database import get_db
from src.services.database_maintenance_service import DatabaseMaintenanceService
from src.dependencies.auth import get_current_user, require_super_admin
from src.models.user import User
from src.repositories.database_maintenance_repository import DatabaseMaintenanceRepository

router = APIRouter(prefix="/database-maintenance", tags=["Database Maintenance"])


@router.post("/vacuum-analyze", status_code=status.HTTP_202_ACCEPTED)
async def trigger_vacuum_analyze(
    current_user: User = Depends(require_super_admin)
):
    """
    Trigger OPTIMIZE TABLE on all tables (MySQL database maintenance).
    Requires super admin privileges.
    """
    result = DatabaseMaintenanceService.run_vacuum_analyze()
    return result


@router.get("/index-recommendations")
async def get_index_recommendations(
    current_user: User = Depends(require_super_admin)
):
    """
    Get recommendations for unused or rarely used indexes.
    Requires super admin privileges.
    """
    result = DatabaseMaintenanceService.get_index_recommendations()
    return result


@router.post("/cleanup-dead-tuples", status_code=status.HTTP_202_ACCEPTED)
async def cleanup_dead_tuples(
    current_user: User = Depends(require_super_admin)
):
    """
    Trigger table optimization task (MySQL database maintenance).
    Requires super admin privileges.
    """
    result = DatabaseMaintenanceService.cleanup_dead_tuples()
    return result


@router.get("/slow-queries")
async def get_slow_queries(
    current_user: User = Depends(require_super_admin)
):
    """
    Get slow query report from performance_schema.
    Requires super admin privileges.
    """
    result = DatabaseMaintenanceService.get_slow_queries()
    return result


@router.post("/create-partitions", status_code=status.HTTP_202_ACCEPTED)
async def create_partitions(
    current_user: User = Depends(require_super_admin)
):
    """
    Create monthly partitions for attendance and analytics_events tables.
    Requires super admin privileges.
    """
    result = DatabaseMaintenanceService.create_partitions()
    return result


@router.post("/cleanup-old-partitions", status_code=status.HTTP_202_ACCEPTED)
async def cleanup_old_partitions(
    months_to_keep: int = 12,
    current_user: User = Depends(require_super_admin)
):
    """
    Cleanup old partitions older than specified months.
    Requires super admin privileges.
    """
    result = DatabaseMaintenanceService.cleanup_old_partitions(months_to_keep)
    return result


@router.get("/table-bloat")
async def get_table_bloat_report(
    current_user: User = Depends(require_super_admin)
):
    """
    Get table bloat report showing largest tables.
    Requires super admin privileges.
    """
    result = DatabaseMaintenanceService.get_table_bloat_report()
    return result


@router.post("/reindex", status_code=status.HTTP_202_ACCEPTED)
async def reindex_tables(
    tables: Optional[List[str]] = None,
    current_user: User = Depends(require_super_admin)
):
    """
    Rebuild indexes for specified tables.
    Requires super admin privileges.
    """
    result = DatabaseMaintenanceService.reindex_tables(tables)
    return result


@router.post("/update-statistics", status_code=status.HTTP_202_ACCEPTED)
async def update_statistics(
    current_user: User = Depends(require_super_admin)
):
    """
    Force update of table statistics for query optimizer (ANALYZE TABLE).
    Requires super admin privileges.
    """
    result = DatabaseMaintenanceService.update_statistics()
    return result


@router.get("/stats")
async def get_database_stats(
    current_user: User = Depends(require_super_admin)
):
    """
    Get current database statistics including size, connections, and cache hit ratio.
    Requires super admin privileges.
    """
    result = DatabaseMaintenanceService.get_database_stats()
    return result


@router.get("/partitions")
async def get_partition_info(
    current_user: User = Depends(require_super_admin)
):
    """
    Get information about existing partitions.
    Requires super admin privileges.
    """
    result = DatabaseMaintenanceService.get_partition_info()
    return result


@router.get("/schedule")
async def get_maintenance_schedule(
    current_user: User = Depends(require_super_admin)
):
    """
    Get the configured maintenance schedule.
    Requires super admin privileges.
    """
    result = DatabaseMaintenanceService.get_maintenance_schedule()
    return result


@router.delete("/indexes/{index_name}")
async def drop_unused_index(
    index_name: str,
    current_user: User = Depends(require_super_admin)
):
    """
    Drop a specific unused index.
    Requires super admin privileges.
    WARNING: This operation cannot be undone easily.
    """
    result = DatabaseMaintenanceService.drop_unused_index(index_name)
    return result


@router.post("/enable-performance-schema", status_code=status.HTTP_201_CREATED)
async def enable_performance_schema(
    current_user: User = Depends(require_super_admin)
):
    """
    Enable performance_schema for query performance tracking in MySQL.
    Requires super admin privileges.
    """
    result = DatabaseMaintenanceService.enable_performance_schema()
    return result


@router.get("/table-stats/{table_name}")
async def get_table_stats(
    table_name: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_super_admin)
):
    """
    Get detailed statistics for a specific table.
    Requires super admin privileges.
    """
    stats = DatabaseMaintenanceRepository.get_table_stats(db, table_name)
    if not stats:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Table {table_name} not found"
        )
    return {"status": "success", "data": stats}


@router.get("/index-stats")
async def get_index_stats(
    index_name: Optional[str] = None,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_super_admin)
):
    """
    Get statistics for all indexes or a specific index.
    Requires super admin privileges.
    """
    stats = DatabaseMaintenanceRepository.get_index_stats(db, index_name)
    return {"status": "success", "count": len(stats), "data": stats}


@router.get("/table-sizes")
async def get_table_sizes(
    limit: int = 20,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_super_admin)
):
    """
    Get table sizes ordered by total size.
    Requires super admin privileges.
    """
    sizes = DatabaseMaintenanceRepository.get_table_sizes(db, limit)
    return {"status": "success", "count": len(sizes), "data": sizes}


@router.get("/long-running-queries")
async def get_long_running_queries(
    min_duration_seconds: int = 60,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_super_admin)
):
    """
    Get currently running queries that exceed the minimum duration.
    Requires super admin privileges.
    """
    queries = DatabaseMaintenanceRepository.get_long_running_queries(db, min_duration_seconds)
    return {"status": "success", "count": len(queries), "data": queries}


@router.get("/duplicate-indexes")
async def get_duplicate_indexes(
    db: Session = Depends(get_db),
    current_user: User = Depends(require_super_admin)
):
    """
    Identify duplicate indexes (indexes on same columns).
    Requires super admin privileges.
    """
    duplicates = DatabaseMaintenanceRepository.get_duplicate_indexes(db)
    return {"status": "success", "count": len(duplicates), "data": duplicates}


@router.get("/missing-indexes")
async def get_missing_indexes(
    min_seq_scans: int = 1000,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_super_admin)
):
    """
    Suggest tables that might benefit from indexes based on sequential scan counts.
    Requires super admin privileges.
    """
    suggestions = DatabaseMaintenanceRepository.get_missing_indexes(db, min_seq_scans)
    return {"status": "success", "count": len(suggestions), "data": suggestions}


@router.get("/bloat-estimate")
async def get_bloat_estimate(
    db: Session = Depends(get_db),
    current_user: User = Depends(require_super_admin)
):
    """
    Get estimated table and index bloat.
    Requires super admin privileges.
    """
    bloat = DatabaseMaintenanceRepository.get_bloat_estimate(db)
    return {"status": "success", "count": len(bloat), "data": bloat}


@router.get("/maintenance-progress")
async def get_maintenance_progress(
    db: Session = Depends(get_db),
    current_user: User = Depends(require_super_admin)
):
    """
    Get current database maintenance progress.
    Requires super admin privileges.
    """
    progress = DatabaseMaintenanceRepository.get_autovacuum_progress(db)
    return {"status": "success", "count": len(progress), "data": progress}


@router.post("/reset-query-stats", status_code=status.HTTP_200_OK)
async def reset_query_statistics(
    db: Session = Depends(get_db),
    current_user: User = Depends(require_super_admin)
):
    """
    Reset performance_schema statistics.
    Requires super admin privileges.
    WARNING: This will clear all query statistics.
    """
    success = DatabaseMaintenanceRepository.reset_query_statistics(db)
    if success:
        return {"status": "success", "message": "Query statistics have been reset"}
    else:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to reset query statistics"
        )
