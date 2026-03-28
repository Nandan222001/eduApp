# Migration Testing Quick Reference

Quick reference guide for testing database migrations.

## Quick Start

```bash
# Setup test database
createdb test_migrations_db

# Run all migration tests
pytest tests/migration/ -v

# Check schema integrity
python scripts/check_schema_integrity.py -v
```

## Common Test Commands

### Basic Tests

```bash
# All migration tests
pytest tests/migration/ -v

# Forward migration only
pytest tests/migration/test_migrations.py::TestMigrations::test_forward_migration_from_scratch -v

# Backward migration
pytest tests/migration/test_migrations.py::TestMigrations::test_backward_migration_last_5 -v

# Idempotency test
pytest tests/migration/test_migrations.py::TestMigrations::test_migration_idempotency -v
```

### Foreign Keys & Constraints

```bash
# Test foreign keys
pytest tests/migration/test_migrations.py::TestMigrations::test_foreign_key_constraints -v

# Check schema integrity
python scripts/check_schema_integrity.py --database-url mysql+pymysql://user:pass@host/db
```

### Performance Tests

```bash
# Index performance
pytest tests/migration/test_migrations.py::TestMigrations::test_index_creation_and_performance -v

# Migration timing
pytest tests/migration/test_migrations.py::TestMigrationPerformance::test_migration_execution_time -v
```

### Data Integrity

```bash
# Test data preservation
pytest tests/migration/test_migrations.py::TestMigrationDataIntegrity::test_data_preserved_after_downgrade_upgrade -v
```

## Production-Like Testing

```bash
# Small dataset (1K records)
python scripts/test_migrations_production_like.py --size small

# Medium dataset (10K records)
python scripts/test_migrations_production_like.py --size medium

# Large dataset (100K records)
python scripts/test_migrations_production_like.py --size large

# Custom database
python scripts/test_migrations_production_like.py \
    --database-url mysql+pymysql://user:pass@host/testdb \
    --size medium
```

## Manual Migration Testing

### Test Forward Migration

```bash
# 1. Create test database
createdb test_manual_db

# 2. Set database URL
export DATABASE_URL="mysql+pymysql://root:password@localhost:3306/test_manual_db?charset=utf8mb4"

# 3. Run migration
alembic upgrade head

# 4. Verify
alembic current
python scripts/check_schema_integrity.py

# 5. Cleanup
dropdb test_manual_db
```

### Test Backward Migration

```bash
# 1. Upgrade to HEAD
alembic upgrade head

# 2. Downgrade one step
alembic downgrade -1

# 3. Verify schema
python scripts/check_schema_integrity.py

# 4. Re-upgrade
alembic upgrade head

# 5. Verify again
python scripts/check_schema_integrity.py
```

### Test Specific Migration

```bash
# Upgrade to specific revision
alembic upgrade <revision>

# Downgrade to specific revision
alembic downgrade <revision>

# Check current revision
alembic current

# View history
alembic history --verbose
```

## Rollback Testing

### Safe Rollback Test

```bash
# 1. Backup first
pg_dump -Fc database_name > backup.dump

# 2. Downgrade
alembic downgrade -1

# 3. Verify
python scripts/check_schema_integrity.py
pytest tests/integration/ -v

# 4. If successful, upgrade back
alembic upgrade head

# 5. If failed, restore
pg_restore -d database_name backup.dump
```

### Emergency Rollback

```bash
# Quick rollback script
./scripts/quick_rollback.sh 1

# Or manually:
pg_dump -Fc db_name > emergency_backup.dump
alembic downgrade -1
python scripts/check_schema_integrity.py
```

## Verification Commands

### Schema Checks

```bash
# Full integrity check
python scripts/check_schema_integrity.py -v

# Check specific table
psql -d database_name -c "\d table_name"

# List all tables
psql -d database_name -c "\dt"

# List foreign keys
psql -d database_name -c "SELECT * FROM information_schema.table_constraints WHERE constraint_type = 'FOREIGN KEY';"
```

### Data Checks

```sql
-- Count records per table
SELECT 
    schemaname,
    tablename,
    n_live_tup as row_count
FROM pg_stat_user_tables
ORDER BY n_live_tup DESC;

-- Check for orphaned records
SELECT c.*
FROM child_table c
LEFT JOIN parent_table p ON c.parent_id = p.id
WHERE p.id IS NULL;

-- Check for NULL foreign keys
SELECT COUNT(*) FROM users WHERE institution_id IS NULL;
```

### Performance Checks

```sql
-- Check slow queries
SELECT 
    pid,
    now() - pg_stat_activity.query_start AS duration,
    query,
    state
FROM pg_stat_activity
WHERE state != 'idle'
    AND now() - pg_stat_activity.query_start > interval '5 seconds'
ORDER BY duration DESC;

-- Check index usage
SELECT 
    schemaname,
    tablename,
    indexname,
    idx_scan as index_scans
FROM pg_stat_user_indexes
ORDER BY idx_scan ASC;

-- Check missing indexes on foreign keys
SELECT DISTINCT
    tc.table_name,
    kcu.column_name
FROM information_schema.table_constraints tc
JOIN information_schema.key_column_usage kcu
    ON tc.constraint_name = kcu.constraint_name
WHERE tc.constraint_type = 'FOREIGN KEY'
    AND NOT EXISTS (
        SELECT 1 
        FROM pg_indexes 
        WHERE tablename = tc.table_name 
        AND indexdef LIKE '%' || kcu.column_name || '%'
    );
```

## Environment Variables

```bash
# Test database
export TEST_MIGRATION_DATABASE_URL="mysql+pymysql://root:password@localhost:3306/test_migrations_db?charset=utf8mb4"

# Production database (for schema comparison)
export DATABASE_URL="mysql+pymysql://user:pass@host:3306/prod_db?charset=utf8mb4"

# Alembic config
export ALEMBIC_CONFIG="alembic.ini"
```

## Common Issues & Solutions

### Issue: Test database doesn't exist
```bash
createdb test_migrations_db
```

### Issue: Permission denied
```bash
mysql -u root -p -e "GRANT ALL PRIVILEGES ON test_migrations_db.* TO 'testuser'@'localhost';"
mysql -u root -p -e "FLUSH PRIVILEGES;"
```

### Issue: Connection limit exceeded
```sql
SELECT pg_terminate_backend(pid)
FROM pg_stat_activity
WHERE state = 'idle' AND datname = 'test_migrations_db';
```

### Issue: Migration stuck
```bash
# Check for locks
SELECT * FROM pg_locks WHERE NOT granted;

# Kill blocking queries
SELECT pg_terminate_backend(pid)
FROM pg_stat_activity
WHERE state = 'active' AND pid != pg_backend_pid();
```

### Issue: Orphaned records after downgrade
```sql
-- Find orphans
SELECT c.* FROM child_table c
LEFT JOIN parent_table p ON c.parent_id = p.id
WHERE p.id IS NULL;

-- Clean up (careful!)
DELETE FROM child_table c
WHERE NOT EXISTS (
    SELECT 1 FROM parent_table p WHERE p.id = c.parent_id
);
```

## Pre-Deployment Checklist

Before deploying migrations to production:

- [ ] Run full test suite: `pytest tests/migration/ -v`
- [ ] Test with production-like data: `python scripts/test_migrations_production_like.py --size large`
- [ ] Verify schema integrity: `python scripts/check_schema_integrity.py -v`
- [ ] Test rollback procedure: `alembic downgrade -1 && alembic upgrade head`
- [ ] Check migration duration acceptable: Should complete in < 5 minutes
- [ ] Verify no data loss: Run data integrity tests
- [ ] Test application with new schema: `pytest tests/integration/ -v`
- [ ] Document rollback steps: Update rollback procedures
- [ ] Create database backup: `pg_dump -Fc db > backup.dump`
- [ ] Schedule maintenance window: If needed
- [ ] Notify stakeholders: Before deployment

## Monitoring During Migration

```bash
# Watch migration progress
watch -n 1 'alembic current'

# Monitor database connections
watch -n 1 'psql -c "SELECT count(*) FROM pg_stat_activity"'

# Monitor table sizes
watch -n 5 'psql -c "SELECT tablename, pg_size_pretty(pg_total_relation_size(tablename::regclass)) FROM pg_tables WHERE schemaname = '\''public'\'' ORDER BY pg_total_relation_size(tablename::regclass) DESC LIMIT 10"'

# Monitor locks
watch -n 1 'psql -c "SELECT COUNT(*) FROM pg_locks WHERE NOT granted"'

# Monitor slow queries
watch -n 5 'psql -c "SELECT pid, now() - query_start AS duration, query FROM pg_stat_activity WHERE state != '\''idle'\'' ORDER BY duration DESC LIMIT 5"'
```

## Post-Migration Verification

```bash
# 1. Check revision
alembic current

# 2. Verify schema
python scripts/check_schema_integrity.py -v

# 3. Run tests
pytest tests/integration/ -v -x

# 4. Check application health
curl http://localhost:8000/health

# 5. Monitor logs
tail -f /var/log/app/error.log

# 6. Check performance
python scripts/benchmark_queries.py
```

## Useful Alembic Commands

```bash
# Show current revision
alembic current

# Show migration history
alembic history

# Show verbose history
alembic history --verbose

# Upgrade to HEAD
alembic upgrade head

# Downgrade one step
alembic downgrade -1

# Downgrade to specific revision
alembic downgrade <revision>

# Upgrade to specific revision
alembic upgrade <revision>

# Generate new migration
alembic revision -m "description"

# Auto-generate migration
alembic revision --autogenerate -m "description"

# Mark database at specific revision (without running migrations)
alembic stamp <revision>

# Show SQL for upgrade
alembic upgrade head --sql

# Show SQL for downgrade
alembic downgrade -1 --sql
```

## Testing Checklist

### Before Each Release

- [ ] All migration tests pass
- [ ] Forward migration successful
- [ ] Backward migration successful (last 5)
- [ ] Idempotency verified
- [ ] Foreign keys valid
- [ ] Indexes created
- [ ] No orphaned records
- [ ] RLS policies correct
- [ ] Performance acceptable
- [ ] Rollback tested

### Weekly

- [ ] Test with production-like data
- [ ] Review migration metrics
- [ ] Check schema drift
- [ ] Update documentation

### Monthly

- [ ] Full schema integrity audit
- [ ] Performance benchmarking
- [ ] Review rollback procedures
- [ ] Update testing scripts

## Quick Reference Card

**Print this section for your desk!**

```
MIGRATION TESTING - QUICK COMMANDS

Run Tests:
  pytest tests/migration/ -v

Check Integrity:
  python scripts/check_schema_integrity.py -v

Prod-Like Test:
  python scripts/test_migrations_production_like.py --size medium

Forward:
  alembic upgrade head

Backward:
  alembic downgrade -1

Verify:
  alembic current
  python scripts/check_schema_integrity.py

Emergency Backup:
  pg_dump -Fc db_name > emergency_backup.dump

Emergency Restore:
  pg_restore -d db_name emergency_backup.dump

For help: docs/MIGRATION_ROLLBACK_PROCEDURES.md
```

---

**Last Updated**: 2024-01-20  
**Version**: 1.0
