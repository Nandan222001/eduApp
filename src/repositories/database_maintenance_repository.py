from typing import List, Dict, Any, Optional
from sqlalchemy import text
from sqlalchemy.orm import Session
import logging

logger = logging.getLogger(__name__)


class DatabaseMaintenanceRepository:
    """Repository for database maintenance queries."""
    
    @staticmethod
    def get_table_stats(db: Session, table_name: str) -> Dict[str, Any]:
        """Get statistics for a specific table."""
        query = text("""
            SELECT
                TABLE_SCHEMA as schemaname,
                TABLE_NAME as table_name,
                TABLE_ROWS as live_tuples,
                0 as dead_tuples,
                AUTO_INCREMENT as modifications_since_analyze,
                UPDATE_TIME as last_vacuum,
                UPDATE_TIME as last_autovacuum,
                UPDATE_TIME as last_analyze,
                UPDATE_TIME as last_autoanalyze,
                0 as vacuum_count,
                0 as autovacuum_count,
                0 as analyze_count,
                0 as autoanalyze_count
            FROM
                information_schema.TABLES
            WHERE
                TABLE_SCHEMA = DATABASE() AND TABLE_NAME = :table_name
        """)
        
        result = db.execute(query, {"table_name": table_name})
        row = result.fetchone()
        
        if not row:
            return None
        
        return {
            "schema": row[0],
            "table_name": row[1],
            "live_tuples": row[2],
            "dead_tuples": row[3],
            "modifications_since_analyze": row[4],
            "last_vacuum": str(row[5]) if row[5] else None,
            "last_autovacuum": str(row[6]) if row[6] else None,
            "last_analyze": str(row[7]) if row[7] else None,
            "last_autoanalyze": str(row[8]) if row[8] else None,
            "vacuum_count": row[9],
            "autovacuum_count": row[10],
            "analyze_count": row[11],
            "autoanalyze_count": row[12]
        }
    
    @staticmethod
    def get_index_stats(db: Session, index_name: Optional[str] = None) -> List[Dict[str, Any]]:
        """Get statistics for indexes."""
        if index_name:
            query = text("""
                SELECT
                    s.TABLE_SCHEMA as schemaname,
                    s.TABLE_NAME as tablename,
                    s.INDEX_NAME as indexname,
                    0 as idx_scan,
                    0 as idx_tup_read,
                    0 as idx_tup_fetch,
                    CONCAT(ROUND((s.INDEX_LENGTH / 1024 / 1024), 2), ' MB') as index_size,
                    s.INDEX_LENGTH as index_size_bytes
                FROM
                    information_schema.STATISTICS s
                WHERE
                    s.TABLE_SCHEMA = DATABASE() AND s.INDEX_NAME = :index_name
                GROUP BY s.TABLE_SCHEMA, s.TABLE_NAME, s.INDEX_NAME, s.INDEX_LENGTH
            """)
            result = db.execute(query, {"index_name": index_name})
        else:
            query = text("""
                SELECT
                    s.TABLE_SCHEMA as schemaname,
                    s.TABLE_NAME as tablename,
                    s.INDEX_NAME as indexname,
                    0 as idx_scan,
                    0 as idx_tup_read,
                    0 as idx_tup_fetch,
                    CONCAT(ROUND((s.INDEX_LENGTH / 1024 / 1024), 2), ' MB') as index_size,
                    s.INDEX_LENGTH as index_size_bytes
                FROM
                    information_schema.STATISTICS s
                    INNER JOIN information_schema.TABLES t ON s.TABLE_NAME = t.TABLE_NAME AND s.TABLE_SCHEMA = t.TABLE_SCHEMA
                WHERE
                    s.TABLE_SCHEMA = DATABASE()
                GROUP BY s.TABLE_SCHEMA, s.TABLE_NAME, s.INDEX_NAME, s.INDEX_LENGTH
                ORDER BY
                    s.INDEX_LENGTH DESC
            """)
            result = db.execute(query)
        
        rows = result.fetchall()
        
        indexes = []
        for row in rows:
            indexes.append({
                "schema": row[0],
                "table": row[1],
                "index": row[2],
                "scans": row[3],
                "tuples_read": row[4],
                "tuples_fetched": row[5],
                "size": row[6],
                "size_bytes": row[7]
            })
        
        return indexes
    
    @staticmethod
    def get_table_sizes(db: Session, limit: int = 20) -> List[Dict[str, Any]]:
        """Get table sizes ordered by total size."""
        query = text("""
            SELECT
                TABLE_SCHEMA as schemaname,
                TABLE_NAME as tablename,
                CONCAT(ROUND((DATA_LENGTH + INDEX_LENGTH) / 1024 / 1024, 2), ' MB') AS total_size,
                CONCAT(ROUND(DATA_LENGTH / 1024 / 1024, 2), ' MB') AS table_size,
                CONCAT(ROUND(INDEX_LENGTH / 1024 / 1024, 2), ' MB') AS indexes_size,
                (DATA_LENGTH + INDEX_LENGTH) as total_bytes
            FROM
                information_schema.TABLES
            WHERE
                TABLE_SCHEMA = DATABASE()
            ORDER BY
                (DATA_LENGTH + INDEX_LENGTH) DESC
            LIMIT :limit
        """)
        
        result = db.execute(query, {"limit": limit})
        rows = result.fetchall()
        
        tables = []
        for row in rows:
            tables.append({
                "schema": row[0],
                "table": row[1],
                "total_size": row[2],
                "table_size": row[3],
                "indexes_size": row[4],
                "total_bytes": row[5]
            })
        
        return tables
    
    @staticmethod
    def get_long_running_queries(db: Session, min_duration_seconds: int = 60) -> List[Dict[str, Any]]:
        """Get currently running queries that exceed the minimum duration."""
        query = text("""
            SELECT
                p.ID as pid,
                p.USER as usename,
                p.DB as datname,
                p.COMMAND as state,
                LEFT(p.INFO, 200) as query_sample,
                p.TIME as duration_seconds,
                NOW() - INTERVAL p.TIME SECOND as query_start,
                NOW() - INTERVAL p.TIME SECOND as state_change,
                NULL as wait_event_type,
                NULL as wait_event
            FROM
                information_schema.PROCESSLIST p
            WHERE
                p.COMMAND != 'Sleep'
                AND p.INFO NOT LIKE '%PROCESSLIST%'
                AND p.TIME > :min_duration
            ORDER BY
                p.TIME DESC
        """)
        
        result = db.execute(query, {"min_duration": min_duration_seconds})
        rows = result.fetchall()
        
        queries = []
        for row in rows:
            queries.append({
                "pid": row[0],
                "user": row[1],
                "database": row[2],
                "state": row[3],
                "query_sample": row[4],
                "duration_seconds": float(row[5]) if row[5] else 0,
                "query_start": str(row[6]),
                "state_change": str(row[7]) if row[7] else None,
                "wait_event_type": row[8],
                "wait_event": row[9]
            })
        
        return queries
    
    @staticmethod
    def get_duplicate_indexes(db: Session) -> List[Dict[str, Any]]:
        """Identify duplicate indexes (indexes on same columns)."""
        query = text("""
            SELECT
                s.TABLE_NAME as table_name,
                GROUP_CONCAT(DISTINCT s.INDEX_NAME) as duplicate_indexes,
                GROUP_CONCAT(DISTINCT CONCAT(ROUND(t.INDEX_LENGTH / 1024 / 1024, 2), ' MB')) as sizes,
                GROUP_CONCAT(DISTINCT t.INDEX_LENGTH) as size_bytes
            FROM
                information_schema.STATISTICS s
                INNER JOIN information_schema.TABLES t ON s.TABLE_NAME = t.TABLE_NAME AND s.TABLE_SCHEMA = t.TABLE_SCHEMA
            WHERE
                s.TABLE_SCHEMA = DATABASE()
            GROUP BY
                s.TABLE_NAME, s.COLUMN_NAME
            HAVING
                COUNT(DISTINCT s.INDEX_NAME) > 1
        """)
        
        result = db.execute(query)
        rows = result.fetchall()
        
        duplicates = []
        for row in rows:
            duplicates.append({
                "table": str(row[0]),
                "indexes": row[1].split(',') if row[1] else [],
                "sizes": row[2].split(',') if row[2] else [],
                "size_bytes": [int(x) for x in row[3].split(',')] if row[3] else []
            })
        
        return duplicates
    
    @staticmethod
    def get_missing_indexes(db: Session, min_seq_scans: int = 1000) -> List[Dict[str, Any]]:
        """Suggest tables that might benefit from indexes based on table scan estimates."""
        query = text("""
            SELECT
                TABLE_SCHEMA as schemaname,
                TABLE_NAME as table_name,
                0 as seq_scan,
                TABLE_ROWS as seq_tup_read,
                0 as idx_scan,
                0.0 as index_usage_percent,
                TABLE_ROWS as live_tuples,
                CONCAT(ROUND((DATA_LENGTH) / 1024 / 1024, 2), ' MB') as table_size
            FROM
                information_schema.TABLES
            WHERE
                TABLE_SCHEMA = DATABASE()
                AND TABLE_ROWS > :min_seq_scans
            ORDER BY
                TABLE_ROWS DESC
        """)
        
        result = db.execute(query, {"min_seq_scans": min_seq_scans})
        rows = result.fetchall()
        
        tables = []
        for row in rows:
            tables.append({
                "schema": row[0],
                "table": row[1],
                "seq_scan": row[2],
                "seq_tup_read": row[3],
                "idx_scan": row[4],
                "index_usage_percent": float(row[5]) if row[5] else 0,
                "live_tuples": row[6],
                "table_size": row[7]
            })
        
        return tables
    
    @staticmethod
    def get_bloat_estimate(db: Session) -> List[Dict[str, Any]]:
        """Estimate table and index bloat (simplified for MySQL)."""
        query = text("""
            SELECT
                TABLE_SCHEMA as schemaname,
                TABLE_NAME as tablename,
                1.0 AS table_bloat_ratio,
                0 AS table_waste_bytes,
                '0 bytes' AS table_waste,
                CONCAT(ROUND((DATA_LENGTH + INDEX_LENGTH) / 1024 / 1024, 2), ' MB') as table_size
            FROM
                information_schema.TABLES
            WHERE
                TABLE_SCHEMA = DATABASE()
            ORDER BY
                (DATA_LENGTH + INDEX_LENGTH) DESC
            LIMIT 20
        """)
        
        try:
            result = db.execute(query)
            rows = result.fetchall()
            
            bloat = []
            for row in rows:
                bloat.append({
                    "schema": row[0],
                    "table": row[1],
                    "bloat_ratio": float(row[2]) if row[2] else 0,
                    "waste_bytes": row[3],
                    "waste": row[4],
                    "table_size": row[5]
                })
            
            return bloat
        except Exception as e:
            logger.error(f"Error estimating bloat: {str(e)}")
            return []
    
    @staticmethod
    def get_autovacuum_progress(db: Session) -> List[Dict[str, Any]]:
        """Get current database maintenance progress (not applicable to MySQL - auto-optimization is handled differently)."""
        return []
    
    @staticmethod
    def reset_query_statistics(db: Session) -> bool:
        """Reset query statistics (MySQL equivalent)."""
        try:
            db.execute(text("FLUSH STATUS"))
            return True
        except Exception as e:
            logger.error(f"Error resetting query statistics: {str(e)}")
            return False
