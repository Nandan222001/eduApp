# Database Migration Rollback Procedures

This document provides comprehensive procedures for safely rolling back database migrations in case of issues or failures.

## Table of Contents

1. [Overview](#overview)
2. [Pre-Rollback Checklist](#pre-rollback-checklist)
3. [Rollback Procedures](#rollback-procedures)
4. [Emergency Rollback](#emergency-rollback)
5. [Post-Rollback Verification](#post-rollback-verification)
6. [Common Scenarios](#common-scenarios)
7. [Troubleshooting](#troubleshooting)

---

## Overview

Database rollbacks should be treated as critical operations. Always follow these procedures carefully to minimize risk and ensure data integrity.

### Key Principles

1. **Always backup before rollback** - Create a database backup before any rollback operation
2. **Test in staging first** - Never rollback in production without testing in staging
3. **Coordinate with team** - Ensure all stakeholders are aware of the rollback
4. **Monitor closely** - Watch system metrics and logs during rollback
5. **Document everything** - Keep detailed records of rollback operations

---

## Pre-Rollback Checklist

Before initiating any rollback, complete this checklist:

### 1. Assessment

- [ ] Identify the problematic migration revision
- [ ] Determine the target revision to rollback to
- [ ] Assess the impact on dependent systems
- [ ] Review data that will be affected
- [ ] Estimate rollback duration

### 2. Backup

```bash
# Create full database backup
mysqldump -h localhost -u root -p production_db > "backup_before_rollback_$(date +%Y%m%d_%H%M%S).sql"

# Or with Docker
docker exec mysql_container mysqldump -u root -ppassword production_db > "backup_before_rollback_$(date +%Y%m%d_%H%M%S).sql"

# Verify backup
pg_restore --list backup_before_rollback_*.dump | head -20
```

### 3. Communication

- [ ] Notify development team
- [ ] Inform operations team
- [ ] Alert stakeholders
- [ ] Schedule maintenance window if needed
- [ ] Prepare rollback communication

### 4. Environment Preparation

- [ ] Test rollback in staging environment
- [ ] Verify application can run on previous schema
- [ ] Ensure no running jobs or transactions
- [ ] Stop application servers (if needed)
- [ ] Clear caches

---

## Rollback Procedures

### Standard Rollback (Single Migration)

Use this procedure when rolling back a single recent migration:

```bash
# 1. Check current revision
alembic current

# 2. View migration history
alembic history --verbose

# 3. Rollback one migration
alembic downgrade -1

# 4. Verify new revision
alembic current

# 5. Test database functionality
python scripts/test_schema_integrity.py
```

### Multi-Migration Rollback

When rolling back multiple migrations:

```bash
# 1. Identify target revision
alembic history

# 2. Rollback to specific revision
alembic downgrade <target_revision>

# Example: Rollback to revision 038
alembic downgrade 038

# 3. Verify rollback
alembic current
```

### Rollback to Base

Complete rollback (rarely needed):

```bash
# WARNING: This removes ALL migrations
# Only use in development or with full backup

# 1. Rollback all migrations
alembic downgrade base

# 2. Verify database is at base state
alembic current
# Should return: None
```

### Step-by-Step Rollback

For maximum safety, rollback one migration at a time:

```bash
#!/bin/bash
# rollback_migrations.sh

# Number of migrations to rollback
STEPS=${1:-1}

echo "Rolling back $STEPS migrations..."

for i in $(seq 1 $STEPS); do
    echo "Step $i of $STEPS"
    
    # Get current revision
    CURRENT=$(alembic current | grep -oP '(?<=\()[a-z0-9]+(?=\))')
    echo "Current revision: $CURRENT"
    
    # Rollback one step
    alembic downgrade -1
    
    # Verify success
    if [ $? -ne 0 ]; then
        echo "ERROR: Rollback failed at step $i"
        exit 1
    fi
    
    # Get new revision
    NEW=$(alembic current | grep -oP '(?<=\()[a-z0-9]+(?=\))')
    echo "New revision: $NEW"
    
    # Pause to check logs
    sleep 2
done

echo "Rollback completed successfully"
```

---

## Emergency Rollback

### Critical Production Issue

When a migration causes a critical production issue:

#### Immediate Actions

```bash
# 1. Stop application traffic (if possible)
# Via load balancer or application server

# 2. Create emergency backup
mysqldump -h prod-host -u root -p prod_db > emergency_backup_$(date +%Y%m%d_%H%M%S).sql

# 3. Quick rollback (single migration)
alembic downgrade -1

# 4. Restart application
# Via your deployment system

# 5. Monitor application logs
tail -f /var/log/app/error.log

# 6. Monitor database
mysql -h prod-host -u root -p -D prod_db -e "SHOW PROCESSLIST"
```

#### Data Loss Mitigation

If rollback will cause data loss:

```bash
# 1. Export affected data before rollback
mysql -h prod-host -u root -p prod_db << EOF
SELECT * FROM new_table INTO OUTFILE '/tmp/data_backup_new_table.csv' FIELDS TERMINATED BY ',' ENCLOSED BY '"' LINES TERMINATED BY '\n';
SELECT * FROM modified_table INTO OUTFILE '/tmp/data_backup_modified_table.csv' FIELDS TERMINATED BY ',' ENCLOSED BY '"' LINES TERMINATED BY '\n';
EOF

# 2. Perform rollback
alembic downgrade <target_revision>

# 3. Consider data re-import strategy
# This depends on your specific situation
```

### Emergency Contacts

Keep this information readily available:

- **Database Administrator**: [Contact Info]
- **Lead Developer**: [Contact Info]
- **DevOps Lead**: [Contact Info]
- **On-Call Engineer**: [On-call system]

---

## Post-Rollback Verification

After completing a rollback, perform these verification steps:

### 1. Database Schema Verification

```bash
# Run schema integrity tests
python scripts/test_schema_integrity.py

# Check for orphaned data
python scripts/check_orphaned_records.py

# Verify foreign key constraints
psql -d database_name << EOF
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
ORDER BY tc.table_name;
EOF
```

### 2. Data Integrity Checks

```sql
-- Check for NULL values in critical columns
SELECT 'users' as table_name, COUNT(*) as null_institution_ids
FROM users WHERE institution_id IS NULL
UNION ALL
SELECT 'students', COUNT(*) FROM students WHERE institution_id IS NULL
UNION ALL
SELECT 'teachers', COUNT(*) FROM teachers WHERE institution_id IS NULL;

-- Check record counts
SELECT 
    schemaname,
    tablename,
    n_live_tup as row_count
FROM pg_stat_user_tables
ORDER BY n_live_tup DESC
LIMIT 20;

-- Check for recent changes
SELECT 
    schemaname,
    tablename,
    n_tup_ins as inserts,
    n_tup_upd as updates,
    n_tup_del as deletes
FROM pg_stat_user_tables
WHERE n_tup_ins + n_tup_upd + n_tup_del > 0
ORDER BY (n_tup_ins + n_tup_upd + n_tup_del) DESC;
```

### 3. Application Testing

```bash
# Run critical API tests
pytest tests/integration/test_critical_paths.py -v

# Run smoke tests
pytest tests/smoke/ -v

# Check application health
curl http://localhost:8000/health
curl http://localhost:8000/api/v1/status
```

### 4. Performance Monitoring

Monitor these metrics for 30-60 minutes after rollback:

- Database query performance
- API response times
- Error rates
- CPU and memory usage
- Connection pool usage

```sql
-- Monitor slow queries
SELECT 
    pid,
    now() - pg_stat_activity.query_start AS duration,
    query,
    state
FROM pg_stat_activity
WHERE state != 'idle'
    AND now() - pg_stat_activity.query_start > interval '5 seconds'
ORDER BY duration DESC;

-- Check connection counts
SELECT 
    count(*) as connections,
    state
FROM pg_stat_activity
GROUP BY state;
```

---

## Common Scenarios

### Scenario 1: Migration Added Invalid Constraint

**Problem**: A migration added a constraint that's causing application errors.

**Solution**:
```bash
# 1. Rollback the migration
alembic downgrade -1

# 2. Fix the migration file
# Edit the migration to correct the constraint

# 3. Re-apply the fixed migration
alembic upgrade head
```

### Scenario 2: Data Migration Failed Halfway

**Problem**: A data migration partially completed and now database is in inconsistent state.

**Solution**:
```bash
# 1. Identify affected records
psql -d database_name << EOF
SELECT COUNT(*) FROM table_name WHERE migrated_flag = true;
SELECT COUNT(*) FROM table_name WHERE migrated_flag IS NULL;
EOF

# 2. Rollback migration
alembic downgrade -1

# 3. Clean up partial data
psql -d database_name << EOF
UPDATE table_name SET migrated_flag = NULL WHERE migrated_flag = true;
EOF

# 4. Fix migration script
# Add proper transaction handling and error recovery

# 5. Re-apply
alembic upgrade head
```

### Scenario 3: Migration Breaking Production

**Problem**: Production application is down after migration.

**Solution**:
```bash
# IMMEDIATE ACTION
# 1. Create backup
pg_dump -Fc prod_db > emergency_backup.dump

# 2. Quick rollback
alembic downgrade -1

# 3. Restart application
systemctl restart app-server

# 4. Verify application is working
curl http://app-url/health

# FOLLOW-UP
# 5. Investigate root cause in staging
# 6. Fix migration
# 7. Test thoroughly in staging
# 8. Plan new deployment with lessons learned
```

### Scenario 4: Need to Rollback Multiple Migrations

**Problem**: Need to rollback several migrations due to architectural changes.

**Solution**:
```bash
# 1. Test in staging first!
# Create staging backup
pg_dump -Fc staging_db > staging_backup.dump

# Test rollback in staging
alembic downgrade <target_revision>

# Verify application works
pytest tests/integration/ -v

# 2. If staging test successful, proceed with production
pg_dump -Fc prod_db > prod_backup.dump

# Rollback in production
alembic downgrade <target_revision>

# 3. Verify and monitor
```

---

## Troubleshooting

### Issue: Rollback Fails with Constraint Error

```
Error: Cannot drop column because it's referenced by a foreign key
```

**Solution**:
```sql
-- Find dependent objects
SELECT 
    tc.constraint_name,
    tc.table_name,
    kcu.column_name,
    ccu.table_name AS foreign_table_name
FROM information_schema.table_constraints AS tc
JOIN information_schema.key_column_usage AS kcu
    ON tc.constraint_name = kcu.constraint_name
JOIN information_schema.constraint_column_usage AS ccu
    ON ccu.constraint_name = tc.constraint_name
WHERE tc.constraint_type = 'FOREIGN KEY'
    AND ccu.table_name = 'your_table';

-- Drop foreign keys manually if needed
ALTER TABLE dependent_table DROP CONSTRAINT constraint_name;

-- Then retry rollback
alembic downgrade -1
```

### Issue: Rollback Leaves Orphaned Data

**Solution**:
```sql
-- Identify orphaned records
SELECT c.*
FROM child_table c
LEFT JOIN parent_table p ON c.parent_id = p.id
WHERE p.id IS NULL;

-- Clean up orphaned records
DELETE FROM child_table c
WHERE NOT EXISTS (
    SELECT 1 FROM parent_table p WHERE p.id = c.parent_id
);
```

### Issue: Alembic Version Table Corrupted

**Solution**:
```sql
-- Check alembic version
SELECT * FROM alembic_version;

-- If corrupted, fix manually (CAUTION!)
-- First, verify the actual schema state
-- Then update to match:
UPDATE alembic_version SET version_num = '<correct_revision>';

-- Or recreate version table
DROP TABLE alembic_version;
-- Run: alembic stamp head
```

### Issue: Cannot Connect During Rollback

**Solution**:
```bash
# Check database is running
pg_isready -h localhost -p 5432

# Check connection limits
mysql -u root -p -e "SHOW VARIABLES LIKE 'max_connections';"
mysql -u root -p -e "SHOW PROCESSLIST;"

# Kill idle connections if needed
mysql -u root -p << EOF
SELECT CONCAT('KILL ', id, ';')
FROM INFORMATION_SCHEMA.PROCESSLIST
WHERE state = 'idle'
    AND query_start < now() - interval '30 minutes';
EOF

# Retry rollback
alembic downgrade -1
```

---

## Best Practices

### Before Deployment

1. **Always test rollback in staging** before deploying to production
2. **Document rollback steps** for each migration
3. **Set rollback time limits** - if it takes too long, have a Plan B
4. **Prepare rollback scripts** in advance for complex migrations

### During Rollback

1. **Monitor continuously** - watch logs, metrics, and alerts
2. **Keep stakeholders informed** - provide regular status updates
3. **Document issues** - note any problems encountered
4. **Be ready to abort** - if rollback causes issues, be prepared to restore from backup

### After Rollback

1. **Verify thoroughly** - don't assume rollback worked perfectly
2. **Update documentation** - record what happened and why
3. **Review and improve** - learn from the experience
4. **Plan next steps** - decide how to proceed with the feature

---

## Scripts Reference

### Quick Rollback Script

```bash
#!/bin/bash
# quick_rollback.sh - Emergency rollback script

set -e

BACKUP_DIR="./backups"
DB_NAME="${DB_NAME:-production_db}"
STEPS="${1:-1}"

echo "=== Emergency Rollback ==="
echo "Database: $DB_NAME"
echo "Steps: $STEPS"
echo ""

# Create backup
echo "Creating backup..."
mkdir -p $BACKUP_DIR
BACKUP_FILE="$BACKUP_DIR/emergency_$(date +%Y%m%d_%H%M%S).dump"
pg_dump -Fc $DB_NAME > $BACKUP_FILE
echo "Backup saved: $BACKUP_FILE"

# Perform rollback
echo "Rolling back $STEPS migrations..."
alembic downgrade -$STEPS

echo "Rollback complete!"
echo "Current revision:"
alembic current
```

### Verification Script

```bash
#!/bin/bash
# verify_rollback.sh - Verify database state after rollback

echo "=== Post-Rollback Verification ==="

echo "1. Checking schema..."
python scripts/test_schema_integrity.py

echo "2. Checking foreign keys..."
psql $DB_NAME -f scripts/check_foreign_keys.sql

echo "3. Running tests..."
pytest tests/integration/test_critical_paths.py -v

echo "4. Checking application health..."
curl -f http://localhost:8000/health || echo "WARNING: Health check failed"

echo "Verification complete!"
```

---

## Additional Resources

- [Alembic Documentation](https://alembic.sqlalchemy.org/)
- [MySQL Backup Documentation](https://dev.mysql.com/doc/refman/8.0/en/backup-and-recovery.html)
- [Database Migration Best Practices](../docs/MIGRATION_BEST_PRACTICES.md)
- [Incident Response Procedures](../docs/INCIDENT_RESPONSE.md)

---

## Emergency Procedures Card

**Quick Reference - Keep this handy!**

```
EMERGENCY ROLLBACK - 3 STEPS

1. BACKUP
   pg_dump -Fc db_name > backup.dump

2. ROLLBACK
   alembic downgrade -1

3. VERIFY
   python scripts/test_schema_integrity.py
   pytest tests/integration/ -v
   
EMERGENCY CONTACTS:
- DBA: [Contact]
- Lead Dev: [Contact]
- DevOps: [Contact]
```

---

**Last Updated**: 2024-01-20  
**Version**: 1.0  
**Maintained By**: Database Team
