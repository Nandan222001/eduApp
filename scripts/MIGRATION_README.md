# PostgreSQL to MySQL Migration Script

## Overview

The `migrate_postgres_to_mysql.py` script provides a comprehensive solution for migrating data from PostgreSQL to MySQL databases. It handles all the complexities of data type conversions, character encoding, and validation.

## Features

- ✅ **Automatic Data Type Conversion**: UUID → CHAR(36), JSONB → JSON
- ✅ **Character Encoding**: Ensures proper UTF-8/utf8mb4 encoding
- ✅ **Batch Processing**: Configurable batch sizes for efficient migration
- ✅ **Foreign Key Handling**: Temporarily disables FK checks during migration
- ✅ **Data Validation**: Validates row counts and sample data post-migration
- ✅ **Comprehensive Reporting**: Generates detailed JSON reports with statistics
- ✅ **Error Recovery**: Continues migration even if individual rows fail
- ✅ **Logging**: Detailed logs to both console and file

## Prerequisites

Install required dependencies:

```bash
pip install psycopg2-binary pymysql
```

Or add to your `pyproject.toml`:

```toml
[tool.poetry.dependencies]
psycopg2-binary = "^2.9.9"
pymysql = "^1.1.0"
```

## Usage

### Basic Migration

```bash
python scripts/migrate_postgres_to_mysql.py \
  --postgres-url "postgresql://user:password@localhost:5432/source_db" \
  --mysql-url "mysql+pymysql://user:password@localhost:3306/target_db"
```

### With Custom Options

```bash
python scripts/migrate_postgres_to_mysql.py \
  --postgres-url "postgresql://user:password@postgres-host:5432/source_db" \
  --mysql-url "mysql+pymysql://user:password@mysql-host:3306/target_db" \
  --batch-size 500 \
  --exclude alembic_version \
  --exclude temporary_table \
  --report-file migration_report.json
```

## Command Line Options

| Option | Required | Default | Description |
|--------|----------|---------|-------------|
| `--postgres-url` | Yes | - | PostgreSQL connection URL |
| `--mysql-url` | Yes | - | MySQL connection URL |
| `--batch-size` | No | 1000 | Number of rows to process per batch |
| `--exclude` | No | [] | Tables to exclude (can be specified multiple times) |
| `--report-file` | No | Auto-generated | Output file for migration report |

## Data Type Conversions

The script automatically handles the following conversions:

| PostgreSQL Type | MySQL Type | Conversion Method |
|----------------|------------|-------------------|
| UUID | CHAR(36) | String conversion |
| JSONB | JSON | JSON serialization |
| JSON | JSON | Validation and passthrough |
| ARRAY[] | JSON | JSON array serialization |
| BOOLEAN | TINYINT(1) | Boolean conversion |
| TEXT/VARCHAR | TEXT/VARCHAR | UTF-8 encoding |
| TIMESTAMP | DATETIME | Direct mapping |
| NUMERIC | DECIMAL | Precision preserved |

## Migration Process

1. **Connection**: Establishes connections to both databases
2. **Discovery**: Lists all tables from PostgreSQL
3. **Schema Analysis**: Retrieves column information for each table
4. **Foreign Key Disable**: Temporarily disables MySQL FK checks
5. **Data Migration**: For each table:
   - Clears existing MySQL data (TRUNCATE)
   - Fetches data in batches from PostgreSQL
   - Converts data types
   - Inserts into MySQL
   - Validates row counts
6. **Foreign Key Enable**: Re-enables MySQL FK checks
7. **Report Generation**: Creates detailed migration report

## Output Files

### Log File

Generated as `migration_YYYYMMDD_HHMMSS.log` containing:
- Connection status
- Table-by-table progress
- Conversion warnings
- Error details

### Report File

Generated as `migration_report_YYYYMMDD_HHMMSS.json` containing:

```json
{
  "migration_summary": {
    "total_tables": 45,
    "total_rows": 125000,
    "duration": "0:05:23.456789",
    "start_time": "2024-01-15T10:30:00",
    "end_time": "2024-01-15T10:35:23"
  },
  "table_details": {
    "users": 1500,
    "institutions": 25,
    "students": 50000
  },
  "conversion_issues": {
    "analytics_events": [
      "Invalid JSON in properties: {...}"
    ]
  },
  "validation_errors": {},
  "success": true
}
```

## Error Handling

### Conversion Issues

- Logged but don't stop migration
- Recorded in report
- Problematic data gets default values

### Insert Failures

- Batch failures trigger row-by-row insertion
- Failed rows are logged with details
- Migration continues with remaining data

### Validation Failures

- Row count mismatches are flagged
- Recorded in validation_errors section
- Migration completes but marked as unsuccessful

## Pre-Migration Checklist

1. **Backup Both Databases**: Always backup before migration
2. **Schema Compatibility**: Ensure MySQL schema exists and matches PostgreSQL
3. **Sufficient Space**: Verify MySQL has adequate storage
4. **Network Connectivity**: Test connections to both databases
5. **User Permissions**: Ensure users have:
   - PostgreSQL: SELECT on all tables
   - MySQL: INSERT, DELETE, TRUNCATE on all tables

## Post-Migration Verification

1. **Review Report**: Check `success` flag and validation errors
2. **Check Row Counts**: Verify table row counts match
3. **Sample Data**: Manually verify critical tables
4. **Test Application**: Run application tests against MySQL
5. **Foreign Keys**: Verify FK constraints are working

## Troubleshooting

### Connection Errors

```
Error: Failed to connect to databases
```

- Verify URLs are correct
- Check network connectivity
- Ensure database servers are running
- Verify user credentials

### Character Encoding Issues

```
Conversion Issue: UnicodeDecodeError
```

- Source may have non-UTF8 data
- Script uses 'replace' error handling
- Review conversion_issues in report

### Memory Issues

```
MemoryError during batch processing
```

- Reduce `--batch-size` (try 100 or 500)
- Process large tables separately
- Increase available memory

### Foreign Key Violations

```
Error: Cannot add or update a child row
```

- Ensure migration order respects dependencies
- Verify foreign key checks are disabled
- Check for orphaned records in source

## Advanced Usage

### Migration Order

For tables with complex dependencies, migrate in this order:

1. Independent tables (no foreign keys)
2. Parent tables
3. Child tables
4. Junction/mapping tables

### Selective Migration

Migrate specific tables by excluding others:

```bash
python scripts/migrate_postgres_to_mysql.py \
  --postgres-url "..." \
  --mysql-url "..." \
  --exclude alembic_version \
  --exclude temp_% \
  --exclude staging_%
```

### Large Database Migration

For databases > 100GB:

1. Reduce batch size: `--batch-size 100`
2. Migrate tables individually with exclusions
3. Run during low-traffic periods
4. Monitor disk space continuously

## Performance Tips

- **Batch Size**: Larger batches = faster, but more memory
- **Indexes**: Consider disabling MySQL indexes before migration
- **Parallel Processing**: Migrate independent tables in parallel
- **Network**: Use direct DB server connections (not tunnels)

## Security Considerations

- **Credentials**: Never commit connection URLs to version control
- **Environment Variables**: Use env vars for sensitive data
- **Audit Logs**: Review both database audit logs
- **Access Control**: Limit migration user permissions

## Example Workflow

```bash
# 1. Backup databases
pg_dump -h localhost -U user source_db > backup_pg.sql
mysqldump -h localhost -u user target_db > backup_mysql.sql

# 2. Run migration
python scripts/migrate_postgres_to_mysql.py \
  --postgres-url "postgresql://user:pass@localhost:5432/source_db" \
  --mysql-url "mysql+pymysql://user:pass@localhost:3306/target_db" \
  --batch-size 1000 \
  --exclude alembic_version

# 3. Review report
cat migration_report_*.json | jq '.migration_summary'

# 4. Validate critical tables
mysql -h localhost -u user -p target_db -e "SELECT COUNT(*) FROM users;"
psql -h localhost -U user source_db -c "SELECT COUNT(*) FROM users;"

# 5. Test application
pytest tests/integration/
```

## Support

For issues or questions:
1. Check the generated log file for details
2. Review the migration report JSON
3. Verify database connectivity and permissions
4. Consult PostgreSQL/MySQL documentation for data type compatibility
