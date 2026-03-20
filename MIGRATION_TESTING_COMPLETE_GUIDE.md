# Complete Migration Testing Guide

Comprehensive guide for database migration testing implementation.

## Overview

This repository includes a complete migration testing framework with:

- ✅ **Forward migration tests** - Validates upgrade from fresh database to HEAD
- ✅ **Backward migration tests** - Tests downgrade for last 5 migrations ensuring data integrity
- ✅ **Idempotency tests** - Verifies running same migration twice is safe
- ✅ **Foreign key constraint tests** - Validates all FK relationships after migrations
- ✅ **Index creation and performance tests** - Checks index coverage and query performance
- ✅ **Production-like dataset testing** - Script to test migrations against realistic data volumes
- ✅ **Rollback procedures** - Complete documentation for safe rollback operations

## Files Created

### Test Files

```
tests/migration/
├── __init__.py                  # Package initialization
├── conftest.py                  # Pytest fixtures and configuration
├── test_migrations.py           # Comprehensive migration test suite
└── README.md                    # Migration testing documentation
```

### Scripts

```
scripts/
├── test_migrations_production_like.py  # Production-like data testing script
├── check_schema_integrity.py          # Schema integrity verification
├── run_migration_tests.sh             # Bash script to run tests (Linux/Mac)
└── run_migration_tests.ps1            # PowerShell script to run tests (Windows)
```

### Documentation

```
docs/
├── MIGRATION_ROLLBACK_PROCEDURES.md   # Detailed rollback procedures
└── MIGRATION_TESTING_QUICK_REFERENCE.md  # Quick reference guide
```

## Quick Start

### 1. Setup Test Database

```bash
# Create test database
createdb test_migrations_db

# Or using psql
psql -U postgres -c "CREATE DATABASE test_migrations_db;"
```

### 2. Run All Migration Tests

**Linux/Mac:**
```bash
chmod +x scripts/run_migration_tests.sh
./scripts/run_migration_tests.sh all
```

**Windows:**
```powershell
.\scripts\run_migration_tests.ps1 -TestType all
```

**Direct with pytest:**
```bash
pytest tests/migration/ -v
```

### 3. Verify Results

All tests should pass. If any fail, review the output and fix issues before deploying migrations.

## Test Suite Details

### TestMigrations Class

#### 1. test_forward_migration_from_scratch
- **Purpose**: Validates complete migration from empty database to HEAD
- **What it tests**:
  - Creates fresh database
  - Applies all migrations sequentially
  - Verifies each migration completes without errors
  - Checks final schema state
- **Expected duration**: < 30 seconds

#### 2. test_backward_migration_last_5
- **Purpose**: Tests downgrade of last 5 migrations
- **What it tests**:
  - Ensures database is at HEAD
  - Downgrades last 5 migrations one by one
  - Verifies data integrity after each downgrade
  - Re-upgrades to ensure reversibility
- **Expected duration**: < 15 seconds

#### 3. test_migration_idempotency
- **Purpose**: Verifies migrations can run safely multiple times
- **What it tests**:
  - Downgrades one migration
  - Upgrades it back
  - Attempts to upgrade again
  - Verifies schema remains consistent
- **Expected duration**: < 10 seconds

#### 4. test_foreign_key_constraints
- **Purpose**: Validates all foreign key relationships
- **What it tests**:
  - Ensures all FKs are properly created
  - Verifies FK relationships are correct
  - Tests cascade behaviors
  - Validates referential integrity
- **Expected duration**: < 5 seconds

#### 5. test_index_creation_and_performance
- **Purpose**: Checks index coverage and performance
- **What it tests**:
  - Verifies all indexes are created
  - Checks for missing indexes on foreign keys
  - Measures query performance
  - Identifies potential bottlenecks
- **Expected duration**: < 5 seconds

#### 6. test_rls_policies
- **Purpose**: Validates Row Level Security policies
- **What it tests**:
  - Verifies RLS is enabled on multi-tenant tables
  - Checks policy definitions
  - Tests policy effectiveness
- **Expected duration**: < 3 seconds

### TestMigrationDataIntegrity Class

#### test_data_preserved_after_downgrade_upgrade
- **Purpose**: Ensures data survives migration cycles
- **What it tests**:
  - Populates database with test data
  - Records data checksums
  - Downgrades last migration
  - Upgrades back
  - Verifies data integrity
- **Expected duration**: < 15 seconds

### TestMigrationPerformance Class

#### test_migration_execution_time
- **Purpose**: Measures migration performance
- **What it tests**:
  - Times complete migration from empty to HEAD
  - Validates acceptable performance limits
  - Reports timing metrics
- **Expected duration**: < 60 seconds

## Running Specific Tests

### Individual Test Methods

```bash
# Forward migration only
pytest tests/migration/test_migrations.py::TestMigrations::test_forward_migration_from_scratch -v

# Backward migration only
pytest tests/migration/test_migrations.py::TestMigrations::test_backward_migration_last_5 -v

# Idempotency test
pytest tests/migration/test_migrations.py::TestMigrations::test_migration_idempotency -v

# Foreign key tests
pytest tests/migration/test_migrations.py::TestMigrations::test_foreign_key_constraints -v

# Index tests
pytest tests/migration/test_migrations.py::TestMigrations::test_index_creation_and_performance -v
```

### Test by Category

```bash
# Using helper scripts (Linux/Mac)
./scripts/run_migration_tests.sh forward
./scripts/run_migration_tests.sh backward
./scripts/run_migration_tests.sh idempotency
./scripts/run_migration_tests.sh foreign_keys
./scripts/run_migration_tests.sh indexes
./scripts/run_migration_tests.sh data_integrity
./scripts/run_migration_tests.sh performance

# Using helper scripts (Windows)
.\scripts\run_migration_tests.ps1 -TestType forward
.\scripts\run_migration_tests.ps1 -TestType backward
.\scripts\run_migration_tests.ps1 -TestType idempotency
.\scripts\run_migration_tests.ps1 -TestType foreign_keys
.\scripts\run_migration_tests.ps1 -TestType indexes
.\scripts\run_migration_tests.ps1 -TestType data_integrity
.\scripts\run_migration_tests.ps1 -TestType performance
```

## Production-Like Testing

Test migrations with realistic data volumes:

### Small Dataset (~1K records per table)
```bash
python scripts/test_migrations_production_like.py --size small
```

### Medium Dataset (~10K records per table)
```bash
python scripts/test_migrations_production_like.py --size medium
```

### Large Dataset (~100K records per table)
```bash
python scripts/test_migrations_production_like.py --size large
```

### Extra Large Dataset (~1M records per table)
```bash
python scripts/test_migrations_production_like.py --size xlarge
```

### Custom Database URL
```bash
python scripts/test_migrations_production_like.py \
    --database-url postgresql://user:pass@host:5432/testdb \
    --size medium
```

## Schema Integrity Verification

After running migrations, verify schema integrity:

```bash
# Basic check
python scripts/check_schema_integrity.py

# Verbose output
python scripts/check_schema_integrity.py -v

# Custom database
python scripts/check_schema_integrity.py \
    --database-url postgresql://user:pass@host:5432/db
```

## Environment Configuration

### Environment Variables

Set these for testing:

```bash
# Test database URL
export TEST_MIGRATION_DATABASE_URL="postgresql://postgres:postgres@localhost:5432/test_migrations_db"

# Alternative variable name
export TEST_DATABASE_URL="postgresql://postgres:postgres@localhost:5432/test_migrations_db"
```

### pytest.ini Configuration

The test suite uses these pytest settings:

```ini
[tool.pytest.ini_options]
markers = [
    "migration: mark test as a migration test",
    "slow_migration: mark test as a slow migration test",
    "production_like: mark test as requiring production-like data",
]
```

## CI/CD Integration

### GitHub Actions Example

```yaml
name: Migration Tests

on:
  push:
    branches: [main, develop]
  pull_request:
    branches: [main, develop]

jobs:
  test-migrations:
    runs-on: ubuntu-latest
    
    services:
      postgres:
        image: postgres:15
        env:
          POSTGRES_PASSWORD: postgres
          POSTGRES_DB: test_migrations_db
        options: >-
          --health-cmd pg_isready
          --health-interval 10s
          --health-timeout 5s
          --health-retries 5
        ports:
          - 5432:5432
    
    steps:
      - uses: actions/checkout@v3
      
      - name: Set up Python
        uses: actions/setup-python@v4
        with:
          python-version: '3.11'
      
      - name: Install dependencies
        run: |
          pip install -r requirements.txt
          # or with poetry: poetry install
      
      - name: Run migration tests
        env:
          TEST_MIGRATION_DATABASE_URL: postgresql://postgres:postgres@localhost:5432/test_migrations_db
        run: |
          pytest tests/migration/ -v --cov=alembic --cov-report=xml
      
      - name: Upload coverage
        uses: codecov/codecov-action@v3
        with:
          files: ./coverage.xml
```

### GitLab CI Example

```yaml
migration-tests:
  stage: test
  image: python:3.11
  services:
    - postgres:15
  variables:
    POSTGRES_DB: test_migrations_db
    POSTGRES_USER: postgres
    POSTGRES_PASSWORD: postgres
    TEST_MIGRATION_DATABASE_URL: "postgresql://postgres:postgres@postgres:5432/test_migrations_db"
  before_script:
    - pip install -r requirements.txt
  script:
    - pytest tests/migration/ -v --cov=alembic --cov-report=xml
  coverage: '/(?i)total.*? (100(?:\.0+)?\%|[1-9]?\d(?:\.\d+)?\%)$/'
  artifacts:
    reports:
      coverage_report:
        coverage_format: cobertura
        path: coverage.xml
```

## Pre-Deployment Checklist

Before deploying migrations to production:

- [ ] All migration tests pass locally
- [ ] Tests pass in CI/CD pipeline
- [ ] Tested with production-like data volume
- [ ] Schema integrity verified
- [ ] Rollback procedure tested
- [ ] Migration duration is acceptable (< 5 minutes recommended)
- [ ] No data loss verified
- [ ] Application tested with new schema
- [ ] Rollback steps documented
- [ ] Database backup created
- [ ] Stakeholders notified
- [ ] Maintenance window scheduled (if needed)

## Troubleshooting

### Common Issues

#### 1. Test Database Doesn't Exist
```bash
createdb test_migrations_db
```

#### 2. Permission Denied
```bash
psql -c "GRANT ALL PRIVILEGES ON DATABASE test_migrations_db TO postgres;"
```

#### 3. Connection Limit Exceeded
```sql
-- Kill idle connections
SELECT pg_terminate_backend(pid)
FROM pg_stat_activity
WHERE state = 'idle' AND datname = 'test_migrations_db';
```

#### 4. Tests Fail Due to Existing Data
```bash
# Drop and recreate
dropdb test_migrations_db
createdb test_migrations_db
```

#### 5. Migration Takes Too Long
- Review migration for expensive operations
- Consider breaking into smaller migrations
- Add proper indexes before data operations
- Use batch processing for large data updates

## Performance Benchmarks

Expected test execution times:

| Test | Expected Duration |
|------|------------------|
| Forward migration (empty to HEAD) | < 30s |
| Backward migration (5 steps) | < 15s |
| Idempotency test | < 10s |
| Foreign key validation | < 5s |
| Index validation | < 5s |
| Data integrity test | < 15s |
| Performance test | < 60s |
| **Full suite** | **< 90s** |

If tests exceed these times significantly, investigate:
- Database performance issues
- Network latency
- Large migration operations
- Missing indexes

## Best Practices

### 1. Test Locally First
Always run migration tests locally before committing:
```bash
pytest tests/migration/ -v
```

### 2. Test in Staging
Deploy to staging environment and run tests:
```bash
# In staging environment
python scripts/check_schema_integrity.py -v
pytest tests/integration/ -v
```

### 3. Use Production-Like Data
Before major releases, test with large datasets:
```bash
python scripts/test_migrations_production_like.py --size large
```

### 4. Monitor Performance
Track migration execution times:
```sql
SELECT * FROM migration_execution_metrics 
ORDER BY executed_at DESC LIMIT 10;
```

### 5. Document Everything
- Add migration documentation in docstrings
- Update rollback procedures
- Record any special considerations

## Rollback Procedures

Detailed rollback procedures are documented in:
- [Migration Rollback Procedures](docs/MIGRATION_ROLLBACK_PROCEDURES.md)
- [Quick Reference Guide](docs/MIGRATION_TESTING_QUICK_REFERENCE.md)

### Emergency Rollback Quick Steps

```bash
# 1. Create backup
pg_dump -Fc database_name > emergency_backup.dump

# 2. Rollback one migration
alembic downgrade -1

# 3. Verify
python scripts/check_schema_integrity.py -v

# 4. Restart application
systemctl restart app-server

# 5. Monitor
tail -f /var/log/app/error.log
```

## Additional Resources

### Documentation
- [Migration Testing README](tests/migration/README.md)
- [Migration Rollback Procedures](docs/MIGRATION_ROLLBACK_PROCEDURES.md)
- [Quick Reference Guide](docs/MIGRATION_TESTING_QUICK_REFERENCE.md)

### External Resources
- [Alembic Documentation](https://alembic.sqlalchemy.org/)
- [PostgreSQL Migration Guide](https://www.postgresql.org/docs/current/ddl-alter.html)
- [SQLAlchemy Documentation](https://docs.sqlalchemy.org/)

## Maintenance

### Weekly Tasks
- Review test results
- Check for flaky tests
- Update test data as schema evolves

### Monthly Tasks
- Run production-like tests
- Review migration metrics
- Update documentation
- Audit schema integrity

### Quarterly Tasks
- Review and optimize slow migrations
- Update rollback procedures
- Performance benchmarking
- Security audit of migrations

## Support

For issues or questions:

1. Check documentation:
   - Test README: `tests/migration/README.md`
   - Quick reference: `docs/MIGRATION_TESTING_QUICK_REFERENCE.md`
   - Rollback procedures: `docs/MIGRATION_ROLLBACK_PROCEDURES.md`

2. Review test output and error messages

3. Check CI/CD logs

4. Contact the database team

---

## Summary

This migration testing framework provides:

✅ **Comprehensive test coverage** for all migration scenarios  
✅ **Automated testing** with pytest integration  
✅ **Production-like testing** with realistic data volumes  
✅ **Schema integrity verification** tools  
✅ **Detailed rollback procedures** for safe operations  
✅ **CI/CD integration** examples  
✅ **Performance benchmarking** capabilities  
✅ **Complete documentation** for all aspects  

**All requirements have been implemented and are ready to use!**

---

**Last Updated**: 2024-01-20  
**Version**: 1.0  
**Maintained By**: Database Team
