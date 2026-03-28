# Migration Quick Reference Guide

Quick reference for common migration operations and safety checks.

## Command Reference

### Basic Commands

```bash
# Check current migration version
alembic current

# Show migration history
alembic history

# Upgrade to latest
alembic upgrade head

# Upgrade to specific version
alembic upgrade 041

# Downgrade one version
alembic downgrade -1

# Downgrade to specific version
alembic downgrade 040

# Show SQL without executing
alembic upgrade head --sql
```

### Testing Commands

```bash
# Test rollback for specific migration
python scripts/migration_test/test_rollback.py --migration 041

# Test recent 5 migrations
python scripts/migration_test/test_rollback.py --count 5

# Run all migration tests
python scripts/migration_test/run_all_tests.sh
```

### Monitoring Commands

```bash
# Check migration status via API
curl http://localhost:8000/api/v1/migrations/status | jq

# Check health
curl http://localhost:8000/api/v1/migrations/health | jq

# Get recent migrations
curl http://localhost:8000/api/v1/migrations/recent?limit=10 | jq

# Get failed migrations
curl http://localhost:8000/api/v1/migrations/failed?days=7 | jq

# Export metrics
curl -X POST http://localhost:8000/api/v1/migrations/export?output_file=metrics.json
```

## Code Templates

### Basic Migration Template

```python
"""descriptive name

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


@track_migration_duration("043_descriptive_name")
def upgrade() -> None:
    with migration_transaction("043_descriptive_name"):
        conn = op.get_bind()
        # Your changes here


def downgrade() -> None:
    with migration_transaction("043_descriptive_name_downgrade"):
        conn = op.get_bind()
        # Your rollback here
```

### Create Table Safely

```python
table_name = 'my_table'
table_exists = conn.execute(sa.text("""
    SELECT EXISTS (
        SELECT 1 FROM information_schema.tables 
        WHERE table_name = :table_name
    )
"""), {'table_name': table_name}).scalar()

if not table_exists:
    op.create_table(
        table_name,
        sa.Column('id', sa.Integer(), nullable=False),
        sa.Column('institution_id', sa.Integer(), nullable=False),
        sa.Column('name', sa.String(255), nullable=False),
        sa.Column('created_at', sa.DateTime(), server_default=sa.text('NOW()')),
        sa.PrimaryKeyConstraint('id'),
        sa.ForeignKeyConstraint(['institution_id'], ['institutions.id'], ondelete='CASCADE')
    )
    
    op.create_index('ix_my_table_institution_id', table_name, ['institution_id'])
```

### Add Column Safely

```python
column_name = 'new_column'
column_exists = conn.execute(sa.text("""
    SELECT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = :table_name 
        AND column_name = :column_name
    )
"""), {'table_name': 'my_table', 'column_name': column_name}).scalar()

if not column_exists:
    # Add as nullable first
    op.add_column('my_table', sa.Column(column_name, sa.String(100), nullable=True))
    
    # Populate existing rows
    op.execute("UPDATE my_table SET new_column = 'default' WHERE new_column IS NULL")
    
    # Make NOT NULL
    op.alter_column('my_table', column_name, nullable=False)
```

### Create Index Safely

```python
index_name = 'ix_my_table_composite'
index_exists = conn.execute(sa.text("""
    SELECT EXISTS (
        SELECT 1 FROM pg_indexes 
        WHERE indexname = :index_name
    )
"""), {'index_name': index_name}).scalar()

if not index_exists:
    op.create_index(index_name, 'my_table', ['institution_id', 'status'])
```

### Add Unique Constraint Safely

```python
constraint_name = 'uq_my_table_name'
constraint_exists = conn.execute(sa.text("""
    SELECT EXISTS (
        SELECT 1 FROM information_schema.table_constraints 
        WHERE constraint_name = :constraint_name
    )
"""), {'constraint_name': constraint_name}).scalar()

if not constraint_exists:
    # Check for duplicates
    duplicates = conn.execute(sa.text("""
        SELECT name, COUNT(*) 
        FROM my_table 
        GROUP BY name 
        HAVING COUNT(*) > 1
    """)).fetchall()
    
    if duplicates:
        print(f"WARNING: {len(duplicates)} duplicates found")
        # Handle duplicates...
    
    op.create_unique_constraint(constraint_name, 'my_table', ['name'])
```

### Create Enum Type Safely

```python
enum_name = 'status_enum'
enum_exists = conn.execute(sa.text("""
    SELECT EXISTS (
        SELECT 1 FROM pg_type WHERE typname = :enum_name
    )
"""), {'enum_name': enum_name}).scalar()

if not enum_exists:
    op.execute(f"CREATE TYPE {enum_name} AS ENUM ('pending', 'active', 'inactive')")
```

## SQL Snippets

### Check Migration Status

```sql
-- Current alembic version
SELECT * FROM alembic_version;

-- Recent migration executions
SELECT 
    migration_name,
    duration_seconds,
    status,
    executed_at
FROM migration_execution_metrics
ORDER BY executed_at DESC
LIMIT 10;

-- Failed migrations
SELECT * FROM migration_execution_metrics 
WHERE status = 'failed' 
ORDER BY executed_at DESC;

-- Migration statistics
SELECT 
    COUNT(*) as total,
    COUNT(CASE WHEN status = 'success' THEN 1 END) as successful,
    COUNT(CASE WHEN status = 'failed' THEN 1 END) as failed,
    AVG(duration_seconds) as avg_duration,
    MAX(duration_seconds) as max_duration
FROM migration_execution_metrics;
```

### Check Database Objects

```sql
-- List all tables
SELECT tablename FROM pg_tables 
WHERE schemaname = 'public' 
ORDER BY tablename;

-- Check if table exists
SELECT EXISTS (
    SELECT 1 FROM information_schema.tables 
    WHERE table_name = 'my_table'
);

-- List columns in table
SELECT column_name, data_type, is_nullable, column_default
FROM information_schema.columns
WHERE table_name = 'my_table';

-- List indexes
SELECT indexname, indexdef
FROM pg_indexes
WHERE tablename = 'my_table';

-- List constraints
SELECT constraint_name, constraint_type
FROM information_schema.table_constraints
WHERE table_name = 'my_table';

-- List foreign keys
SELECT
    tc.constraint_name,
    tc.table_name,
    kcu.column_name,
    ccu.table_name AS foreign_table_name,
    ccu.column_name AS foreign_column_name
FROM information_schema.table_constraints AS tc
JOIN information_schema.key_column_usage AS kcu
    ON tc.constraint_name = kcu.constraint_name
JOIN information_schema.constraint_column_usage AS ccu
    ON ccu.constraint_name = tc.constraint_name
WHERE tc.constraint_type = 'FOREIGN KEY'
AND tc.table_name = 'my_table';
```

### Performance Monitoring

```sql
-- Table sizes
SELECT 
    schemaname,
    tablename,
    pg_size_pretty(pg_total_relation_size(schemaname||'.'||tablename)) AS size
FROM pg_tables
WHERE schemaname = 'public'
ORDER BY pg_total_relation_size(schemaname||'.'||tablename) DESC;

-- Index sizes
SELECT
    schemaname,
    tablename,
    indexname,
    pg_size_pretty(pg_relation_size(indexrelid)) AS index_size
FROM pg_indexes
JOIN pg_class ON pg_indexes.indexname = pg_class.relname
WHERE schemaname = 'public'
ORDER BY pg_relation_size(indexrelid) DESC;

-- Active queries
SELECT 
    pid,
    usename,
    state,
    query_start,
    now() - query_start AS duration,
    query
FROM pg_stat_activity
WHERE state != 'idle'
ORDER BY query_start;

-- Locks
SELECT 
    pid,
    usename,
    pg_blocking_pids(pid) as blocked_by,
    query
FROM pg_stat_activity
WHERE cardinality(pg_blocking_pids(pid)) > 0;
```

## Emergency Procedures

### Quick Rollback

```bash
# 1. Check current version
alembic current

# 2. Downgrade
alembic downgrade -1

# 3. Verify
alembic current
curl http://localhost:8000/health | jq '.migrations'
```

### Restore from Backup

```bash
# 1. Stop application
aws ecs update-service --desired-count 0 ...

# 2. Restore database
./scripts/deployment/restore_backup.sh prod latest

# 3. Verify and restart
curl http://localhost:8000/health
```

### Fix Alembic Version

```sql
-- Check current version
SELECT * FROM alembic_version;

-- Fix version
UPDATE alembic_version SET version_num = '041';

-- Verify
SELECT * FROM alembic_version;
```

## Deployment Checklist

### Pre-Deployment

- [ ] Migration tested locally
- [ ] Rollback tested
- [ ] Peer reviewed
- [ ] Documentation updated
- [ ] Team notified
- [ ] Deployment window scheduled

### During Deployment

- [ ] Database backup created
- [ ] Migration logs monitored
- [ ] Health checks passing
- [ ] No errors in logs

### Post-Deployment

- [ ] Migration status verified
- [ ] Application functioning
- [ ] Performance normal
- [ ] Data integrity confirmed
- [ ] Documentation updated

## Troubleshooting

### Migration Stuck

```sql
-- Check for long-running queries
SELECT * FROM pg_stat_activity 
WHERE state != 'idle' 
AND query_start < now() - interval '5 minutes';

-- Kill query
SELECT pg_terminate_backend(<pid>);
```

### Metrics Table Missing

```bash
# Create metrics table
alembic upgrade 041
```

### Version Mismatch

```bash
# Check status
alembic current
alembic heads

# Fix if needed
alembic stamp head
```

## Useful Aliases

Add to your `.bashrc` or `.zshrc`:

```bash
# Alembic shortcuts
alias amc='alembic current'
alias amh='alembic history'
alias amu='alembic upgrade head'
alias amd='alembic downgrade -1'
alias ams='alembic show'

# Migration testing
alias amt='python scripts/migration_test/test_rollback.py'

# Migration monitoring
alias amstat='curl http://localhost:8000/api/v1/migrations/status | jq'
alias amhealth='curl http://localhost:8000/api/v1/migrations/health | jq'
```

## Quick Links

- [Migration Naming Convention](./MIGRATION_NAMING_CONVENTION.md)
- [Migration Rollback Playbook](./MIGRATION_ROLLBACK_PLAYBOOK.md)
- [Migration Safety System](./MIGRATION_SAFETY_SYSTEM.md)
- [Example Safe Migration](../alembic/versions/042_example_safe_migration.py)

---

**Last Updated**: 2024-01-20  
**Version**: 1.0
