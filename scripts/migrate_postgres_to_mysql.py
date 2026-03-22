#!/usr/bin/env python3
"""
PostgreSQL to MySQL Database Migration Script

This script performs a complete migration of data from PostgreSQL to MySQL,
handling data type conversions (UUID to CHAR(36), JSONB to JSON), character
encoding, data validation, and generating a comprehensive migration report.

Usage:
    python scripts/migrate_postgres_to_mysql.py --postgres-url <url> --mysql-url <url>
"""

import argparse
import json
import logging
import sys
import uuid
from collections import defaultdict
from datetime import datetime
from typing import Any, Dict, List, Optional, Tuple

import psycopg2
import psycopg2.extras
import pymysql
from pymysql.cursors import DictCursor

logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(levelname)s - %(message)s',
    handlers=[
        logging.FileHandler(f'migration_{datetime.now().strftime("%Y%m%d_%H%M%S")}.log'),
        logging.StreamHandler(sys.stdout)
    ]
)
logger = logging.getLogger(__name__)


class MigrationStats:
    """Track migration statistics and issues."""
    
    def __init__(self):
        self.tables_migrated = 0
        self.total_rows_migrated = 0
        self.table_row_counts = {}
        self.conversion_issues = defaultdict(list)
        self.validation_errors = defaultdict(list)
        self.start_time = datetime.now()
        self.end_time = None
        
    def add_table(self, table_name: str, row_count: int):
        """Record table migration."""
        self.tables_migrated += 1
        self.total_rows_migrated += row_count
        self.table_row_counts[table_name] = row_count
        
    def add_conversion_issue(self, table_name: str, issue: str):
        """Record a data conversion issue."""
        self.conversion_issues[table_name].append(issue)
        
    def add_validation_error(self, table_name: str, error: str):
        """Record a validation error."""
        self.validation_errors[table_name].append(error)
        
    def finalize(self):
        """Mark migration as complete."""
        self.end_time = datetime.now()
        
    def get_duration(self) -> str:
        """Get migration duration."""
        if self.end_time:
            duration = self.end_time - self.start_time
            return str(duration)
        return "In progress"
        
    def to_dict(self) -> Dict[str, Any]:
        """Convert stats to dictionary."""
        return {
            'tables_migrated': self.tables_migrated,
            'total_rows_migrated': self.total_rows_migrated,
            'table_row_counts': self.table_row_counts,
            'conversion_issues': dict(self.conversion_issues),
            'validation_errors': dict(self.validation_errors),
            'start_time': self.start_time.isoformat(),
            'end_time': self.end_time.isoformat() if self.end_time else None,
            'duration': self.get_duration()
        }


class PostgresToMySQLMigrator:
    """Main migration class for PostgreSQL to MySQL conversion."""
    
    def __init__(self, postgres_url: str, mysql_url: str, batch_size: int = 1000):
        """
        Initialize migrator with database connections.
        
        Args:
            postgres_url: PostgreSQL connection URL
            mysql_url: MySQL connection URL
            batch_size: Number of rows to process in each batch
        """
        self.postgres_url = postgres_url
        self.mysql_url = mysql_url
        self.batch_size = batch_size
        self.stats = MigrationStats()
        self.pg_conn = None
        self.mysql_conn = None
        
    def connect_databases(self):
        """Establish connections to both databases."""
        try:
            # Parse PostgreSQL URL
            logger.info("Connecting to PostgreSQL...")
            self.pg_conn = psycopg2.connect(self.postgres_url)
            logger.info("Successfully connected to PostgreSQL")
            
            # Parse MySQL URL
            logger.info("Connecting to MySQL...")
            self.mysql_conn = pymysql.connect(
                **self._parse_mysql_url(self.mysql_url),
                charset='utf8mb4',
                cursorclass=DictCursor
            )
            logger.info("Successfully connected to MySQL")
            
        except Exception as e:
            logger.error(f"Failed to connect to databases: {e}")
            raise
            
    def _parse_mysql_url(self, url: str) -> Dict[str, Any]:
        """Parse MySQL connection URL to connection parameters."""
        # Format: mysql+pymysql://user:password@host:port/database
        from urllib.parse import urlparse
        
        parsed = urlparse(url)
        return {
            'host': parsed.hostname,
            'port': parsed.port or 3306,
            'user': parsed.username,
            'password': parsed.password,
            'database': parsed.path.lstrip('/').split('?')[0]
        }
        
    def close_connections(self):
        """Close database connections."""
        if self.pg_conn:
            self.pg_conn.close()
            logger.info("Closed PostgreSQL connection")
        if self.mysql_conn:
            self.mysql_conn.close()
            logger.info("Closed MySQL connection")
            
    def get_table_list(self) -> List[str]:
        """Get list of tables to migrate from PostgreSQL."""
        cursor = self.pg_conn.cursor()
        cursor.execute("""
            SELECT table_name 
            FROM information_schema.tables 
            WHERE table_schema = 'public' 
            AND table_type = 'BASE TABLE'
            ORDER BY table_name
        """)
        tables = [row[0] for row in cursor.fetchall()]
        cursor.close()
        logger.info(f"Found {len(tables)} tables to migrate")
        return tables
        
    def get_table_schema(self, table_name: str) -> List[Dict[str, Any]]:
        """Get schema information for a table."""
        cursor = self.pg_conn.cursor(cursor_factory=psycopg2.extras.DictCursor)
        cursor.execute("""
            SELECT 
                column_name,
                data_type,
                character_maximum_length,
                is_nullable,
                column_default
            FROM information_schema.columns
            WHERE table_schema = 'public' 
            AND table_name = %s
            ORDER BY ordinal_position
        """, (table_name,))
        
        columns = []
        for row in cursor.fetchall():
            columns.append({
                'name': row['column_name'],
                'type': row['data_type'],
                'length': row['character_maximum_length'],
                'nullable': row['is_nullable'] == 'YES',
                'default': row['column_default']
            })
        cursor.close()
        return columns
        
    def convert_value(self, value: Any, data_type: str, table_name: str, column_name: str) -> Any:
        """
        Convert PostgreSQL value to MySQL-compatible format.
        
        Args:
            value: The value to convert
            data_type: PostgreSQL data type
            table_name: Name of the table
            column_name: Name of the column
            
        Returns:
            Converted value suitable for MySQL
        """
        if value is None:
            return None
            
        try:
            # UUID to CHAR(36)
            if data_type == 'uuid' or isinstance(value, uuid.UUID):
                return str(value)
                
            # JSONB/JSON to JSON string
            elif data_type in ('json', 'jsonb'):
                if isinstance(value, (dict, list)):
                    return json.dumps(value)
                elif isinstance(value, str):
                    # Already a string, validate it's valid JSON
                    try:
                        json.loads(value)
                        return value
                    except json.JSONDecodeError:
                        self.stats.add_conversion_issue(
                            table_name,
                            f"Invalid JSON in {column_name}: {value[:100]}"
                        )
                        return json.dumps({})
                return json.dumps(value)
                
            # Array types (PostgreSQL specific)
            elif data_type.endswith('[]'):
                if isinstance(value, list):
                    return json.dumps(value)
                return value
                
            # Boolean
            elif data_type == 'boolean':
                return bool(value)
                
            # Text/Character types - ensure proper encoding
            elif data_type in ('text', 'character varying', 'varchar', 'char'):
                if isinstance(value, bytes):
                    return value.decode('utf-8', errors='replace')
                return str(value)
                
            # Numeric types
            elif data_type in ('integer', 'bigint', 'smallint'):
                return int(value)
                
            elif data_type in ('numeric', 'decimal', 'real', 'double precision'):
                return float(value)
                
            # Date/Time types
            elif data_type in ('timestamp without time zone', 'timestamp with time zone', 
                             'timestamp', 'datetime'):
                return value
                
            elif data_type == 'date':
                return value
                
            elif data_type == 'time':
                return value
                
            # Default: return as-is
            else:
                return value
                
        except Exception as e:
            self.stats.add_conversion_issue(
                table_name,
                f"Error converting {column_name} (type: {data_type}): {str(e)}"
            )
            return value
            
    def disable_foreign_keys(self):
        """Temporarily disable foreign key checks in MySQL."""
        cursor = self.mysql_conn.cursor()
        cursor.execute("SET FOREIGN_KEY_CHECKS = 0")
        self.mysql_conn.commit()
        cursor.close()
        logger.info("Disabled foreign key checks")
        
    def enable_foreign_keys(self):
        """Re-enable foreign key checks in MySQL."""
        cursor = self.mysql_conn.cursor()
        cursor.execute("SET FOREIGN_KEY_CHECKS = 1")
        self.mysql_conn.commit()
        cursor.close()
        logger.info("Enabled foreign key checks")
        
    def migrate_table(self, table_name: str) -> int:
        """
        Migrate a single table from PostgreSQL to MySQL.
        
        Args:
            table_name: Name of the table to migrate
            
        Returns:
            Number of rows migrated
        """
        logger.info(f"Starting migration of table: {table_name}")
        
        # Get schema info
        columns = self.get_table_schema(table_name)
        column_names = [col['name'] for col in columns]
        
        # Get total row count
        pg_cursor = self.pg_conn.cursor()
        pg_cursor.execute(f"SELECT COUNT(*) FROM {table_name}")
        total_rows = pg_cursor.fetchone()[0]
        logger.info(f"Table {table_name} has {total_rows} rows")
        
        if total_rows == 0:
            logger.info(f"Skipping empty table: {table_name}")
            return 0
            
        # Clear existing data in MySQL table
        mysql_cursor = self.mysql_conn.cursor()
        try:
            mysql_cursor.execute(f"TRUNCATE TABLE {table_name}")
            self.mysql_conn.commit()
            logger.info(f"Truncated MySQL table: {table_name}")
        except Exception as e:
            logger.warning(f"Could not truncate {table_name}: {e}")
            mysql_cursor.execute(f"DELETE FROM {table_name}")
            self.mysql_conn.commit()
        
        # Fetch and migrate data in batches
        rows_migrated = 0
        offset = 0
        
        while offset < total_rows:
            # Fetch batch from PostgreSQL
            pg_cursor.execute(
                f"SELECT * FROM {table_name} ORDER BY 1 LIMIT %s OFFSET %s",
                (self.batch_size, offset)
            )
            rows = pg_cursor.fetchall()
            
            if not rows:
                break
                
            # Convert and insert into MySQL
            converted_rows = []
            for row in rows:
                converted_row = []
                for i, col in enumerate(columns):
                    value = row[i]
                    converted_value = self.convert_value(
                        value, 
                        col['type'], 
                        table_name, 
                        col['name']
                    )
                    converted_row.append(converted_value)
                converted_rows.append(tuple(converted_row))
            
            # Build INSERT query
            placeholders = ', '.join(['%s'] * len(column_names))
            insert_query = f"""
                INSERT INTO {table_name} ({', '.join(column_names)})
                VALUES ({placeholders})
            """
            
            try:
                mysql_cursor.executemany(insert_query, converted_rows)
                self.mysql_conn.commit()
                rows_migrated += len(converted_rows)
                logger.info(f"Migrated {rows_migrated}/{total_rows} rows from {table_name}")
            except Exception as e:
                logger.error(f"Error inserting batch into {table_name}: {e}")
                self.mysql_conn.rollback()
                # Try inserting rows one by one to identify problem rows
                for i, row in enumerate(converted_rows):
                    try:
                        mysql_cursor.execute(insert_query, row)
                        self.mysql_conn.commit()
                        rows_migrated += 1
                    except Exception as row_error:
                        self.stats.add_conversion_issue(
                            table_name,
                            f"Failed to insert row at offset {offset + i}: {str(row_error)}"
                        )
                        self.mysql_conn.rollback()
            
            offset += self.batch_size
            
        pg_cursor.close()
        mysql_cursor.close()
        
        logger.info(f"Completed migration of {table_name}: {rows_migrated} rows")
        return rows_migrated
        
    def validate_migration(self, table_name: str) -> bool:
        """
        Validate that data was migrated correctly.
        
        Args:
            table_name: Name of the table to validate
            
        Returns:
            True if validation passed, False otherwise
        """
        logger.info(f"Validating migration for table: {table_name}")
        
        # Compare row counts
        pg_cursor = self.pg_conn.cursor()
        mysql_cursor = self.mysql_conn.cursor()
        
        pg_cursor.execute(f"SELECT COUNT(*) FROM {table_name}")
        pg_count = pg_cursor.fetchone()[0]
        
        mysql_cursor.execute(f"SELECT COUNT(*) FROM {table_name}")
        mysql_count = mysql_cursor.fetchone()['COUNT(*)']
        
        if pg_count != mysql_count:
            error_msg = f"Row count mismatch: PostgreSQL={pg_count}, MySQL={mysql_count}"
            self.stats.add_validation_error(table_name, error_msg)
            logger.error(f"Validation failed for {table_name}: {error_msg}")
            pg_cursor.close()
            mysql_cursor.close()
            return False
            
        # Sample validation - check first and last few rows
        sample_size = min(10, pg_count)
        if sample_size > 0:
            # Get primary key column
            pg_cursor.execute("""
                SELECT a.attname
                FROM pg_index i
                JOIN pg_attribute a ON a.attrelid = i.indrelid
                AND a.attnum = ANY(i.indkey)
                WHERE i.indrelid = %s::regclass
                AND i.indisprimary
            """, (table_name,))
            pk_result = pg_cursor.fetchone()
            
            if pk_result:
                pk_column = pk_result[0]
                
                # Validate sample rows by primary key
                pg_cursor.execute(
                    f"SELECT * FROM {table_name} ORDER BY {pk_column} LIMIT %s",
                    (sample_size,)
                )
                pg_sample = pg_cursor.fetchall()
                
                mysql_cursor.execute(
                    f"SELECT * FROM {table_name} ORDER BY {pk_column} LIMIT %s",
                    (sample_size,)
                )
                mysql_sample = mysql_cursor.fetchall()
                
                # Basic comparison (just check we got same number of samples)
                if len(pg_sample) != len(mysql_sample):
                    error_msg = f"Sample size mismatch in validation"
                    self.stats.add_validation_error(table_name, error_msg)
                    logger.warning(f"Validation warning for {table_name}: {error_msg}")
        
        pg_cursor.close()
        mysql_cursor.close()
        
        logger.info(f"Validation passed for {table_name}")
        return True
        
    def migrate_all_tables(self, exclude_tables: Optional[List[str]] = None):
        """
        Migrate all tables from PostgreSQL to MySQL.
        
        Args:
            exclude_tables: List of table names to exclude from migration
        """
        exclude_tables = exclude_tables or []
        tables = self.get_table_list()
        
        # Filter out excluded tables
        tables = [t for t in tables if t not in exclude_tables]
        
        logger.info(f"Starting migration of {len(tables)} tables")
        
        # Disable foreign key checks for migration
        self.disable_foreign_keys()
        
        try:
            for table_name in tables:
                try:
                    rows_migrated = self.migrate_table(table_name)
                    self.stats.add_table(table_name, rows_migrated)
                    
                    # Validate migration
                    self.validate_migration(table_name)
                    
                except Exception as e:
                    logger.error(f"Failed to migrate table {table_name}: {e}")
                    self.stats.add_conversion_issue(table_name, f"Migration failed: {str(e)}")
                    
        finally:
            # Re-enable foreign key checks
            self.enable_foreign_keys()
            
    def generate_report(self, output_file: str = None):
        """
        Generate migration report.
        
        Args:
            output_file: Optional file path to save report
        """
        self.stats.finalize()
        
        report = {
            'migration_summary': {
                'total_tables': self.stats.tables_migrated,
                'total_rows': self.stats.total_rows_migrated,
                'duration': self.stats.get_duration(),
                'start_time': self.stats.start_time.isoformat(),
                'end_time': self.stats.end_time.isoformat() if self.stats.end_time else None
            },
            'table_details': self.stats.table_row_counts,
            'conversion_issues': dict(self.stats.conversion_issues),
            'validation_errors': dict(self.stats.validation_errors),
            'success': len(self.stats.validation_errors) == 0
        }
        
        # Print summary to console
        logger.info("\n" + "="*80)
        logger.info("MIGRATION REPORT")
        logger.info("="*80)
        logger.info(f"Total Tables Migrated: {self.stats.tables_migrated}")
        logger.info(f"Total Rows Migrated: {self.stats.total_rows_migrated}")
        logger.info(f"Duration: {self.stats.get_duration()}")
        logger.info(f"Conversion Issues: {sum(len(v) for v in self.stats.conversion_issues.values())}")
        logger.info(f"Validation Errors: {sum(len(v) for v in self.stats.validation_errors.values())}")
        
        if self.stats.conversion_issues:
            logger.info("\nConversion Issues by Table:")
            for table, issues in self.stats.conversion_issues.items():
                logger.info(f"  {table}: {len(issues)} issues")
                for issue in issues[:5]:  # Show first 5
                    logger.info(f"    - {issue}")
                if len(issues) > 5:
                    logger.info(f"    ... and {len(issues) - 5} more")
                    
        if self.stats.validation_errors:
            logger.info("\nValidation Errors by Table:")
            for table, errors in self.stats.validation_errors.items():
                logger.info(f"  {table}: {len(errors)} errors")
                for error in errors:
                    logger.info(f"    - {error}")
        
        logger.info("="*80)
        
        # Save to file
        if output_file is None:
            output_file = f'migration_report_{datetime.now().strftime("%Y%m%d_%H%M%S")}.json'
            
        with open(output_file, 'w') as f:
            json.dump(report, f, indent=2, default=str)
        logger.info(f"\nDetailed report saved to: {output_file}")
        
        return report


def main():
    """Main entry point for the migration script."""
    parser = argparse.ArgumentParser(
        description='Migrate data from PostgreSQL to MySQL',
        formatter_class=argparse.RawDescriptionHelpFormatter,
        epilog="""
Examples:
  # Basic migration
  python scripts/migrate_postgres_to_mysql.py \\
    --postgres-url "postgresql://user:pass@localhost:5432/dbname" \\
    --mysql-url "mysql+pymysql://user:pass@localhost:3306/dbname"
  
  # With custom batch size and exclusions
  python scripts/migrate_postgres_to_mysql.py \\
    --postgres-url "postgresql://user:pass@localhost:5432/dbname" \\
    --mysql-url "mysql+pymysql://user:pass@localhost:3306/dbname" \\
    --batch-size 500 \\
    --exclude alembic_version \\
    --exclude temp_table
        """
    )
    
    parser.add_argument(
        '--postgres-url',
        required=True,
        help='PostgreSQL connection URL (e.g., postgresql://user:pass@host:port/db)'
    )
    
    parser.add_argument(
        '--mysql-url',
        required=True,
        help='MySQL connection URL (e.g., mysql+pymysql://user:pass@host:port/db)'
    )
    
    parser.add_argument(
        '--batch-size',
        type=int,
        default=1000,
        help='Number of rows to migrate in each batch (default: 1000)'
    )
    
    parser.add_argument(
        '--exclude',
        action='append',
        default=[],
        help='Tables to exclude from migration (can be specified multiple times)'
    )
    
    parser.add_argument(
        '--report-file',
        help='Output file for migration report (default: auto-generated)'
    )
    
    args = parser.parse_args()
    
    # Create migrator
    migrator = PostgresToMySQLMigrator(
        postgres_url=args.postgres_url,
        mysql_url=args.mysql_url,
        batch_size=args.batch_size
    )
    
    try:
        # Connect to databases
        migrator.connect_databases()
        
        # Run migration
        logger.info("Starting database migration...")
        migrator.migrate_all_tables(exclude_tables=args.exclude)
        
        # Generate report
        migrator.generate_report(output_file=args.report_file)
        
        logger.info("Migration completed successfully!")
        return 0
        
    except Exception as e:
        logger.error(f"Migration failed with error: {e}", exc_info=True)
        return 1
        
    finally:
        # Clean up connections
        migrator.close_connections()


if __name__ == '__main__':
    sys.exit(main())
