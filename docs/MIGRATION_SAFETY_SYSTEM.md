# Migration Safety System

This document provides a comprehensive overview of the migration safety system implemented in this project.

## Overview

The migration safety system includes:

1. **Transaction Wrapping** - Automatic rollback on failures
2. **Duration Monitoring** - Track and alert on slow migrations
3. **Rollback Testing** - Automated testing of migration reversibility
4. **Database Backups** - Automatic backups before production migrations
5. **Version Checking** - Application startup warnings for pending migrations
6. **Naming Conventions** - Standardized migration naming and structure
7. **Rollback Playbook** - Step-by-step recovery procedures

## Components

### 1. Migration Utilities (`alembic/migration_utils.py`)

Provides helper functions for safe migrations:

#### Transaction Management

```python
from alembic.migration_utils import migration_transaction

def upgrade() -> None:
    with migration_transaction("041_add_feature"):
        op.create_table(...)
        op.create_index(...)
```

Benefits:
- Automatic BEGIN/COMMIT/ROLLBACK
- Atomicity - all operations succeed or all fail
- Duration logging

#### Duration Tracking

```python
from alembic.migration_utils import track_migration_duration

@track_migration_duration("041_add_feature")
def upgrade() -> None:
    # Migration operations
    pass
```

Benefits:
- Automatic timing
- Stores metrics in database
- Enables performance analysis
- Triggers alerts on slow migrations

#### Existence Check Helpers

```python
from alembic.migration_utils import (
    check_table_exists,
    check_column_exists,
    check_constraint_exists,
    check_index_exists
)

if not check_table_exists('my_table'):
    op.create_table('my_table', ...)
```

### 2. Version Checker (`src/utils/migration_checker.py`)

Checks migration status on application startup:

```python
from src.utils.migration_checker import warn_if_migrations_pending

# In application startup
db = SessionLocal()
warn_if_migrations_pending(db, fail_on_pending=False)
```

Features:
- Compares database version with code version
- Logs warnings if migrations are pending
- Can optionally fail startup if behind
- Exposed in health check endpoint

### 3. Migration Monitoring (`src/utils/migration_monitoring.py`)

Tracks and analyzes migration execution:

#### Get Recent Migrations

```python
from src.utils.migration_monitoring import get_recent_migrations

migrations = get_recent_migrations(db, limit=10)
for m in migrations:
    print(f"{m.migration_name}: {m.duration_seconds}s - {m.status}")
```

#### Check Migration Health

```python
from src.utils.migration_monitoring import check_migration_health

health = check_migration_health(db)
if health['status'] != 'healthy':
    print(f"Issues: {health['issues']}")
```

#### Alert on Failures

```python
from src.utils.migration_monitoring import alert_on_migration_failure

alert_on_migration_failure(
    migration_name="041_add_feature",
    error_message=str(error),
    duration=duration
)
```

### 4. Rollback Testing (`scripts/migration_test/test_rollback.py`)

Automated testing framework for migration rollbacks:

```bash
# Test specific migration
python scripts/migration_test/test_rollback.py --migration 041

# Test recent 5 migrations
python scripts/migration_test/test_rollback.py --count 5
```

Test sequence:
1. Record current state
2. Downgrade one version
3. Verify data integrity
4. Upgrade back to current
5. Verify data integrity again

### 5. Migration API Endpoints (`src/api/v1/migrations.py`)

REST API for migration monitoring:

#### Check Status
```bash
GET /api/v1/migrations/status
```

Response:
```json
{
  "is_up_to_date": true,
  "current_version": "041",
  "latest_version": "041",
  "message": "Database is at latest migration version: 041"
}
```

#### Health Check
```bash
GET /api/v1/migrations/health
```

Response:
```json
{
  "status": "healthy",
  "issues": [],
  "statistics": {
    "total_executions": 41,
    "successful": 41,
    "failed": 0,
    "success_rate": 100.0,
    "avg_duration_seconds": 2.5
  },
  "recent_migrations": [...]
}
```

#### Get Recent Migrations
```bash
GET /api/v1/migrations/recent?limit=10
```

#### Get Failed Migrations
```bash
GET /api/v1/migrations/failed?days=7
```

#### Get Slow Migrations
```bash
GET /api/v1/migrations/slow?threshold_seconds=60
```

#### Export Metrics
```bash
POST /api/v1/migrations/export?output_file=metrics.json
```

#### Cleanup Old Metrics
```bash
POST /api/v1/migrations/cleanup?days=90
```

### 6. Deployment Integration

The deployment script (`scripts/deployment/deploy.sh`) automatically:

1. **Creates RDS Snapshot** (Production only)
   - Waits for completion before proceeding
   - Names: `{project}-{env}-pre-migration-{timestamp}`

2. **Creates Logical Backup** (Production only)
   - Uses pg_dump for faster restore
   - Uploads to S3
   - Path: `s3://{project}-{env}-backups/migrations/{timestamp}/`

3. **Runs Migrations**
   - Executes via ECS task
   - Waits for completion
   - Logs duration

4. **Monitors Migration Metrics**
   - Tracks in migration_execution_metrics table
   - Sends alerts on failures

### 7. Backup Restoration (`scripts/deployment/restore_backup.sh`)

Emergency restoration script:

```bash
# Restore latest backup
./scripts/deployment/restore_backup.sh prod latest

# Restore specific backup
./scripts/deployment/restore_backup.sh prod 20240120-100000
```

Features:
- Multiple confirmation prompts
- Creates emergency backup before restore
- Stops application during restore
- Verifies restoration
- Updates configuration
- Restarts application

## Usage Guide

### Creating a New Migration

1. **Determine sequence number**
   ```bash
   ls alembic/versions/ | grep -E "^[0-9]{3}_" | sort | tail -1
   ```

2. **Create migration file**
   ```bash
   touch alembic/versions/043_add_new_feature.py
   ```

3. **Use the template**
   ```python
   """add new feature
   
   Revision ID: 043
   Revises: 042
   Create Date: 2024-01-20 12:00:00.000000
   """
   from alembic import op
   import sqlalchemy as sa
   from alembic.migration_utils import migration_transaction, track_migration_duration
   
   revision = '043'
   down_revision = '042'
   branch_labels = None
   depends_on = None
   
   @track_migration_duration("043_add_new_feature")
   def upgrade() -> None:
       with migration_transaction("043_add_new_feature"):
           # Your migrations here
           pass
   
   def downgrade() -> None:
       with migration_transaction("043_add_new_feature_downgrade"):
           # Your rollback here
           pass
   ```

4. **Test the migration**
   ```bash
   # Upgrade
   alembic upgrade head
   
   # Test rollback
   python scripts/migration_test/test_rollback.py --migration 043
   
   # Downgrade
   alembic downgrade -1
   
   # Re-upgrade
   alembic upgrade head
   ```

### Best Practices Checklist

Before deploying a migration:

- [ ] Used transaction wrapping
- [ ] Added duration tracking
- [ ] Included existence checks
- [ ] Implemented safe downgrade
- [ ] Tested upgrade locally
- [ ] Tested downgrade locally
- [ ] Ran rollback tests
- [ ] Peer reviewed code
- [ ] Documented changes
- [ ] Updated naming convention docs
- [ ] Scheduled deployment window
- [ ] Team notified

### Monitoring Migration Health

#### Via API

```bash
# Check overall health
curl http://localhost:8000/api/v1/migrations/health | jq

# Check if up to date
curl http://localhost:8000/api/v1/migrations/status | jq

# Get recent failures
curl http://localhost:8000/api/v1/migrations/failed?days=7 | jq
```

#### Via Database

```sql
-- Recent migrations
SELECT 
    migration_name,
    duration_seconds,
    status,
    executed_at
FROM migration_execution_metrics
ORDER BY executed_at DESC
LIMIT 10;

-- Failed migrations
SELECT 
    migration_name,
    error_message,
    executed_at
FROM migration_execution_metrics
WHERE status = 'failed'
ORDER BY executed_at DESC;

-- Slow migrations
SELECT 
    migration_name,
    duration_seconds,
    executed_at
FROM migration_execution_metrics
WHERE duration_seconds > 60
ORDER BY duration_seconds DESC;

-- Statistics
SELECT 
    COUNT(*) as total,
    COUNT(CASE WHEN status = 'success' THEN 1 END) as successful,
    COUNT(CASE WHEN status = 'failed' THEN 1 END) as failed,
    AVG(duration_seconds) as avg_duration
FROM migration_execution_metrics;
```

### Emergency Procedures

#### If Migration Fails

1. **Check Error**
   ```sql
   SELECT * FROM migration_execution_metrics 
   WHERE status = 'failed' 
   ORDER BY executed_at DESC 
   LIMIT 1;
   ```

2. **Attempt Rollback**
   ```bash
   alembic downgrade -1
   ```

3. **If Rollback Fails**
   - See [MIGRATION_ROLLBACK_PLAYBOOK.md](./MIGRATION_ROLLBACK_PLAYBOOK.md)
   - Consider database restore

#### If Application Won't Start

1. **Check Migration Status**
   ```bash
   alembic current
   ```

2. **Check for Pending Migrations**
   ```bash
   alembic heads
   alembic history
   ```

3. **Apply Pending Migrations**
   ```bash
   alembic upgrade head
   ```

#### If Database is Corrupted

1. **Stop Application**
   ```bash
   aws ecs update-service --desired-count 0 ...
   ```

2. **Restore from Backup**
   ```bash
   ./scripts/deployment/restore_backup.sh prod latest
   ```

3. **Verify and Restart**

## Configuration

### Environment Variables

```bash
# Database connection
DATABASE_HOST=localhost
DATABASE_PORT=3306
DATABASE_NAME=fastapi_db
DATABASE_USER=root
DATABASE_PASSWORD=password

# Monitoring
SENTRY_DSN=https://...
SLACK_WEBHOOK_URL=https://...

# Alerting thresholds
MIGRATION_SLOW_THRESHOLD_SECONDS=60
MIGRATION_FAILURE_ALERT=true
```

### Alembic Configuration

`alembic.ini`:
```ini
[alembic]
script_location = alembic
prepend_sys_path = .
version_path_separator = os

[loggers]
keys = root,sqlalchemy,alembic

[logger_alembic]
level = INFO
handlers =
qualname = alembic
```

## Metrics Table Schema

The migration_execution_metrics table:

```sql
CREATE TABLE migration_execution_metrics (
    id SERIAL PRIMARY KEY,
    migration_name VARCHAR(255) NOT NULL,
    duration_seconds FLOAT NOT NULL,
    status VARCHAR(50) NOT NULL,  -- 'success' or 'failed'
    error_message TEXT,
    executed_at TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE INDEX ix_migration_metrics_name ON migration_execution_metrics(migration_name);
CREATE INDEX ix_migration_metrics_executed_at ON migration_execution_metrics(executed_at);
CREATE INDEX ix_migration_metrics_status ON migration_execution_metrics(status);
```

## Performance Considerations

### Migration Duration Guidelines

- **Fast** (<10s): Simple operations like adding columns, indexes
- **Medium** (10-60s): Creating tables, adding constraints
- **Slow** (>60s): Data migrations, complex transformations

### Optimization Tips

1. **Create indexes concurrently**
   ```python
   op.execute("CREATE INDEX CONCURRENTLY ix_name ON table(column)")
   ```

2. **Batch large updates**
   ```python
   op.execute("""
       UPDATE large_table 
       SET column = value 
       WHERE id IN (SELECT id FROM large_table LIMIT 1000)
   """)
   ```

3. **Use transactions wisely**
   - Transaction wrapping is great for consistency
   - But long transactions can lock tables
   - Consider breaking very large migrations into smaller ones

## Troubleshooting

### Common Issues

#### Migration Stuck

**Symptom**: Migration running for very long time

**Solution**:
```sql
-- Check for locks
SELECT * FROM pg_stat_activity WHERE state != 'idle';

-- Kill blocking query
SELECT pg_terminate_backend(pid) FROM pg_stat_activity WHERE pid = <pid>;
```

#### Alembic Version Mismatch

**Symptom**: Application shows wrong migration version

**Solution**:
```sql
-- Check alembic_version table
SELECT * FROM alembic_version;

-- Update if needed
UPDATE alembic_version SET version_num = '041';
```

#### Metrics Table Missing

**Symptom**: Warnings about migration_execution_metrics table

**Solution**:
```bash
# Run migration 041 to create the table
alembic upgrade 041
```

## Additional Resources

- [Migration Naming Convention](./MIGRATION_NAMING_CONVENTION.md)
- [Migration Rollback Playbook](./MIGRATION_ROLLBACK_PLAYBOOK.md)
- [Example Safe Migration](../alembic/versions/042_example_safe_migration.py)
- [Migration Template](../alembic/versions/TEMPLATE_autogenerated_migration.py)
- [Alembic Documentation](https://alembic.sqlalchemy.org/)

## Support

For issues or questions:
- Check the [Rollback Playbook](./MIGRATION_ROLLBACK_PLAYBOOK.md)
- Review [Troubleshooting Guide](./TROUBLESHOOTING_GUIDE.md)
- Contact Database Team
- Check #database-migrations Slack channel

---

**Last Updated**: 2024-01-20  
**Version**: 1.0  
**Maintained By**: Database Team
