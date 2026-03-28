# Migration Rollback Playbook

This document provides step-by-step procedures for rolling back failed database migrations in production and other environments.

## Table of Contents

- [Quick Reference](#quick-reference)
- [Pre-Rollback Checklist](#pre-rollback-checklist)
- [Rollback Procedures](#rollback-procedures)
- [Recovery Scenarios](#recovery-scenarios)
- [Post-Rollback Actions](#post-rollback-actions)
- [Prevention Measures](#prevention-measures)

## Quick Reference

### Emergency Contacts

- **Database Team Lead**: [Contact Info]
- **DevOps Lead**: [Contact Info]
- **On-Call Engineer**: [Pager/Phone]

### Critical Commands

```bash
# Check current migration version
alembic current

# Downgrade one version
alembic downgrade -1

# Downgrade to specific version
alembic downgrade <revision_id>

# Check migration execution metrics
psql -c "SELECT * FROM migration_execution_metrics ORDER BY executed_at DESC LIMIT 10;"

# Restore from latest backup
./scripts/deployment/restore_backup.sh prod latest
```

## Pre-Rollback Checklist

Before initiating a rollback, verify the following:

### 1. Assess the Situation

- [ ] Identify the failed migration revision ID
- [ ] Check migration_execution_metrics table for error details
- [ ] Review application logs for related errors
- [ ] Determine scope of impact (which services/users affected)
- [ ] Estimate downtime for rollback procedure

### 2. Communication

- [ ] Alert the team via incident channel
- [ ] Notify stakeholders about the issue
- [ ] Update status page if customer-facing
- [ ] Assign incident commander

### 3. Backup Verification

- [ ] Verify pre-migration backup exists
- [ ] Check backup timestamp and size
- [ ] Confirm backup is accessible
- [ ] Test backup restore in non-production environment (if time permits)

### 4. Environment Check

- [ ] Identify which environments are affected
- [ ] Stop application deployments to affected environments
- [ ] Pause CI/CD pipelines
- [ ] Scale down application servers to minimum (optional, for safety)

## Rollback Procedures

### Scenario 1: Migration Failed During Execution

**Symptoms**: Migration command failed, database is in inconsistent state

**Steps**:

1. **Check Current State**
   ```bash
   # SSH to bastion host or use RDS Query Editor
   alembic current
   
   # Check for partial changes
   psql -c "\dt" | grep <table_name>
   ```

2. **Review Error Details**
   ```bash
   # Check migration metrics
   psql -c "SELECT migration_name, status, error_message, executed_at 
            FROM migration_execution_metrics 
            WHERE status = 'failed' 
            ORDER BY executed_at DESC 
            LIMIT 5;"
   ```

3. **Attempt Automatic Rollback**
   ```bash
   # Try to downgrade to previous version
   alembic downgrade -1
   
   # Verify rollback succeeded
   alembic current
   ```

4. **If Automatic Rollback Fails**
   - Proceed to "Manual Database Restore" section
   - The migration may have left the database in a state where normal rollback won't work

### Scenario 2: Migration Completed but Application is Broken

**Symptoms**: Migration succeeded but application shows errors

**Steps**:

1. **Verify Migration Status**
   ```bash
   alembic current
   
   # Check migration metrics
   psql -c "SELECT * FROM migration_execution_metrics 
            WHERE migration_name = '<migration_name>' 
            ORDER BY executed_at DESC LIMIT 1;"
   ```

2. **Check Application Logs**
   ```bash
   # CloudWatch logs (AWS)
   aws logs tail /aws/ecs/fastapi-app-prod --follow
   
   # Or kubectl logs (Kubernetes)
   kubectl logs -f deployment/fastapi-app -n production
   ```

3. **Decision Point**
   
   **Option A: Rollback Migration**
   ```bash
   # Downgrade to previous version
   alembic downgrade -1
   
   # Restart application
   aws ecs update-service --cluster prod-cluster --service fastapi-app --force-new-deployment
   ```
   
   **Option B: Deploy Fix Forward**
   - If rollback is complex or risky
   - Create hotfix migration
   - Deploy corrected version

4. **Verify Application Health**
   ```bash
   # Check health endpoint
   curl https://api.example.com/health
   
   # Check migration status in health check
   curl https://api.example.com/health | jq '.migrations'
   ```

### Scenario 3: Migration Causes Data Loss or Corruption

**Symptoms**: Data is missing or incorrect after migration

**CRITICAL**: This requires database restore from backup

**Steps**:

1. **Immediately Stop All Write Operations**
   ```bash
   # Scale application to 0
   aws ecs update-service --cluster prod-cluster --service fastapi-app --desired-count 0
   
   # Or put application in read-only mode
   aws ssm put-parameter --name /app/prod/read-only --value "true" --overwrite
   ```

2. **Assess Data Loss**
   ```bash
   # Check affected tables
   psql -c "SELECT COUNT(*) FROM <affected_table>;"
   
   # Compare with backup if possible
   ```

3. **Restore from Backup**
   
   **Option A: RDS Snapshot Restore** (Full restore, slower)
   ```bash
   # Restore from pre-migration snapshot
   SNAPSHOT_ID="fastapi-app-prod-pre-migration-20240120-100000"
   
   # Create new RDS instance from snapshot
   aws rds restore-db-instance-from-db-snapshot \
     --db-instance-identifier fastapi-app-prod-restore \
     --db-snapshot-identifier $SNAPSHOT_ID
   
   # Wait for restore to complete
   aws rds wait db-instance-available --db-instance-identifier fastapi-app-prod-restore
   
   # Update application to point to restored DB (requires DNS/parameter update)
   ```
   
   **Option B: Logical Backup Restore** (Partial restore, faster)
   ```bash
   # Download backup from S3
   aws s3 cp s3://fastapi-app-prod-backups/migrations/pre-migration-20240120/backup.dump ./
   
   # Restore specific tables
   pg_restore -h $DB_HOST -U $DB_USER -d $DB_NAME -t affected_table backup.dump
   ```

4. **Verify Data Integrity**
   ```bash
   # Run data integrity checks
   python scripts/migration_test/verify_data_integrity.py
   
   # Compare record counts
   psql -c "SELECT COUNT(*) FROM users;"
   psql -c "SELECT COUNT(*) FROM orders;"
   ```

5. **Restore Application Service**
   ```bash
   # Scale back up
   aws ecs update-service --cluster prod-cluster --service fastapi-app --desired-count 3
   
   # Verify health
   curl https://api.example.com/health
   ```

### Scenario 4: Cannot Connect to Database After Migration

**Symptoms**: Database is unreachable or in recovery mode

**Steps**:

1. **Check Database Status**
   ```bash
   # RDS status
   aws rds describe-db-instances \
     --db-instance-identifier fastapi-app-prod-db \
     --query 'DBInstances[0].DBInstanceStatus'
   
   # Connection test
   pg_isready -h $DB_HOST -p 5432
   ```

2. **Check for Long-Running Transactions**
   ```bash
   # Connect if possible
   psql -c "SELECT pid, usename, state, query_start, query 
            FROM pg_stat_activity 
            WHERE state != 'idle' 
            ORDER BY query_start;"
   
   # Kill blocking queries if necessary
   psql -c "SELECT pg_terminate_backend(pid) FROM pg_stat_activity WHERE pid = <pid>;"
   ```

3. **Restart Database if Necessary**
   ```bash
   # RDS reboot
   aws rds reboot-db-instance --db-instance-identifier fastapi-app-prod-db
   
   # Wait for availability
   aws rds wait db-instance-available --db-instance-identifier fastapi-app-prod-db
   ```

4. **Restore from Backup if Database Won't Start**
   - Follow Scenario 3 restoration procedures

## Manual Database Restore

When automated rollback fails, use these manual procedures:

### 1. Point-in-Time Recovery (AWS RDS)

```bash
# Restore to point before migration
RESTORE_TIME="2024-01-20T10:00:00Z"  # Time before migration started

aws rds restore-db-instance-to-point-in-time \
  --source-db-instance-identifier fastapi-app-prod-db \
  --target-db-instance-identifier fastapi-app-prod-restore \
  --restore-time $RESTORE_TIME

# Wait for restore
aws rds wait db-instance-available --db-instance-identifier fastapi-app-prod-restore
```

### 2. Manual SQL Fixes

If the migration left specific inconsistencies:

```sql
-- Example: Remove partially created table
DROP TABLE IF EXISTS problematic_table CASCADE;

-- Example: Restore foreign key constraint
ALTER TABLE child_table 
ADD CONSTRAINT fk_parent 
FOREIGN KEY (parent_id) REFERENCES parent_table(id);

-- Example: Fix enum type issue
DROP TYPE IF EXISTS bad_enum CASCADE;
CREATE TYPE correct_enum AS ENUM ('value1', 'value2');

-- Update alembic version manually
UPDATE alembic_version SET version_num = '040';
```

### 3. Selective Table Restore

```bash
# Extract specific tables from backup
pg_restore -h $DB_HOST -U $DB_USER -d $DB_NAME \
  -t table1 -t table2 \
  --data-only \
  backup.dump

# Or restore schema only
pg_restore -h $DB_HOST -U $DB_USER -d $DB_NAME \
  -t table1 \
  --schema-only \
  backup.dump
```

## Recovery Scenarios

### Recovering from Alembic Metadata Corruption

```bash
# Check alembic_version table
psql -c "SELECT * FROM alembic_version;"

# If multiple versions or wrong version
psql -c "DELETE FROM alembic_version;"
psql -c "INSERT INTO alembic_version VALUES ('040');"  # Correct version

# Verify
alembic current
```

### Recovering from Lost Foreign Key Constraints

```bash
# List foreign keys
psql -c "\d+ table_name"

# Recreate if missing
python scripts/migration_test/fix_foreign_keys.py
```

### Recovering from Index Corruption

```bash
# Reindex specific table
psql -c "REINDEX TABLE table_name;"

# Reindex entire database (CAUTION: locks tables)
psql -c "REINDEX DATABASE database_name;"
```

## Post-Rollback Actions

After successfully rolling back:

### 1. Verify System Health

```bash
# Check all health endpoints
curl https://api.example.com/health

# Verify database connectivity
psql -c "SELECT 1;"

# Check application logs for errors
aws logs tail /aws/ecs/fastapi-app-prod --since 5m

# Verify key functionality
python scripts/smoke_tests.py
```

### 2. Data Verification

```bash
# Run data integrity checks
python scripts/migration_test/verify_data_integrity.py

# Check record counts in critical tables
psql -c "SELECT 
  'users' as table_name, COUNT(*) as count FROM users
  UNION ALL
  SELECT 'orders', COUNT(*) FROM orders
  UNION ALL
  SELECT 'institutions', COUNT(*) FROM institutions;"
```

### 3. Documentation

- [ ] Update incident timeline
- [ ] Document root cause
- [ ] Record steps taken
- [ ] Note any data loss or inconsistencies
- [ ] Update runbook with lessons learned

### 4. Communication

- [ ] Notify team that rollback is complete
- [ ] Update stakeholders on status
- [ ] Update status page
- [ ] Schedule post-mortem meeting

### 5. Analysis

```bash
# Check migration metrics
psql -c "SELECT * FROM migration_execution_metrics 
         WHERE migration_name LIKE '%041%' 
         ORDER BY executed_at DESC;"

# Export logs for analysis
aws logs get-log-events --log-group-name /aws/ecs/fastapi-app-prod \
  --log-stream-name <stream> \
  --start-time <timestamp> > migration_failure_logs.json
```

## Prevention Measures

### Before Every Production Migration

1. **Test in Staging**
   ```bash
   # Deploy to staging first
   ./scripts/deployment/deploy.sh staging
   
   # Run migration tests
   python scripts/migration_test/test_rollback.py
   
   # Soak test for 24 hours
   ```

2. **Create Backup**
   ```bash
   # Automated in deployment script, but verify
   aws rds describe-db-snapshots \
     --db-instance-identifier fastapi-app-prod-db \
     --query 'DBSnapshots[0]'
   ```

3. **Review Migration Code**
   - [ ] Peer review completed
   - [ ] Downgrade function implemented
   - [ ] Existence checks included
   - [ ] Transaction wrapping used
   - [ ] No data loss operations

4. **Timing**
   - [ ] Schedule during low-traffic window
   - [ ] Ensure team is available
   - [ ] No other deployments scheduled
   - [ ] Rollback window planned

### Monitoring

Set up alerts for:

- Migration duration exceeds threshold
- Migration fails
- Database CPU/memory spikes during migration
- Application error rate increases after migration
- Health check shows migration version mismatch

### Automation

```bash
# Add to deployment script
if [ "$ENVIRONMENT" = "prod" ]; then
  # Create backup
  ./scripts/deployment/backup_database.sh
  
  # Run migration
  alembic upgrade head
  
  # Verify migration
  python scripts/migration_test/verify_migration.py
  
  # If verification fails, auto-rollback
  if [ $? -ne 0 ]; then
    echo "Migration verification failed, rolling back..."
    alembic downgrade -1
    exit 1
  fi
fi
```

## Appendix

### Useful SQL Queries

```sql
-- Check table sizes
SELECT 
  schemaname,
  tablename,
  pg_size_pretty(pg_total_relation_size(schemaname||'.'||tablename)) AS size
FROM pg_tables
WHERE schemaname NOT IN ('pg_catalog', 'information_schema')
ORDER BY pg_total_relation_size(schemaname||'.'||tablename) DESC;

-- Check for locks
SELECT 
  pid,
  usename,
  pg_blocking_pids(pid) as blocked_by,
  query
FROM pg_stat_activity
WHERE cardinality(pg_blocking_pids(pid)) > 0;

-- Check replication lag
SELECT 
  client_addr,
  state,
  sync_state,
  pg_wal_lsn_diff(pg_current_wal_lsn(), sent_lsn) AS sent_lag,
  pg_wal_lsn_diff(pg_current_wal_lsn(), replay_lsn) AS replay_lag
FROM pg_stat_replication;
```

### Contact Information

Update these contacts for your team:

| Role | Name | Contact | Backup |
|------|------|---------|--------|
| DBA Lead | [Name] | [Email/Phone] | [Backup Contact] |
| DevOps Lead | [Name] | [Email/Phone] | [Backup Contact] |
| Backend Lead | [Name] | [Email/Phone] | [Backup Contact] |
| On-Call | [Rotation] | [PagerDuty] | [Escalation Path] |

### External Resources

- [MySQL Documentation](https://dev.mysql.com/doc/)
- [Alembic Documentation](https://alembic.sqlalchemy.org/)
- [AWS RDS Backup/Restore](https://docs.aws.amazon.com/AmazonRDS/latest/UserGuide/USER_RestoreFromSnapshot.html)
- Internal Wiki: [Link to internal docs]
- Runbook Repository: [Link to runbooks]

---

**Last Updated**: 2024-01-20  
**Version**: 1.0  
**Owner**: Database Team
