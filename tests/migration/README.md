# Migration Tests

Comprehensive test suite for database migrations.

## Overview

This directory contains tests that validate database migrations including:

- **Forward migrations**: Test upgrading from fresh database to HEAD
- **Backward migrations**: Test downgrading last N migrations
- **Idempotency**: Verify migrations can run safely multiple times
- **Foreign keys**: Validate all FK constraints and relationships
- **Indexes**: Check index creation and performance
- **Data integrity**: Ensure data survives migration cycles
- **RLS policies**: Verify Row Level Security configurations

## Running Tests

### Prerequisites

1. Ensure PostgreSQL is running
2. Create test database:
```bash
createdb test_migrations_db
```

3. Set environment variable (optional):
```bash
export TEST_MIGRATION_DATABASE_URL="postgresql://postgres:postgres@localhost:5432/test_migrations_db"
```

### Run All Migration Tests

```bash
pytest tests/migration/ -v
```

### Run Specific Test Classes

```bash
# Test forward/backward migrations
pytest tests/migration/test_migrations.py::TestMigrations -v

# Test data integrity
pytest tests/migration/test_migrations.py::TestMigrationDataIntegrity -v

# Test performance
pytest tests/migration/test_migrations.py::TestMigrationPerformance -v
```

### Run Individual Tests

```bash
# Test forward migration only
pytest tests/migration/test_migrations.py::TestMigrations::test_forward_migration_from_scratch -v

# Test backward migration
pytest tests/migration/test_migrations.py::TestMigrations::test_backward_migration_last_5 -v

# Test idempotency
pytest tests/migration/test_migrations.py::TestMigrations::test_migration_idempotency -v

# Test foreign keys
pytest tests/migration/test_migrations.py::TestMigrations::test_foreign_key_constraints -v

# Test indexes
pytest tests/migration/test_migrations.py::TestMigrations::test_index_creation_and_performance -v
```

### Run with Verbose Output

```bash
pytest tests/migration/ -v -s
```

### Run with Coverage

```bash
pytest tests/migration/ --cov=alembic --cov-report=html
```

## Test Production-Like Data

For testing migrations with production-like data volumes:

```bash
# Small dataset (~1K records per table)
python scripts/test_migrations_production_like.py --size small

# Medium dataset (~10K records per table)
python scripts/test_migrations_production_like.py --size medium

# Large dataset (~100K records per table)
python scripts/test_migrations_production_like.py --size large

# Custom database
python scripts/test_migrations_production_like.py \
    --database-url postgresql://user:pass@host/testdb \
    --size medium
```

## Check Schema Integrity

After running migrations, verify schema integrity:

```bash
python scripts/check_schema_integrity.py --database-url postgresql://user:pass@host/db -v
```

## Test Structure

```
tests/migration/
├── __init__.py              # Package initialization
├── conftest.py              # Pytest fixtures and configuration
├── test_migrations.py       # Main migration test suite
└── README.md               # This file
```

## Key Test Classes

### TestMigrations

Core migration functionality tests:

- `test_forward_migration_from_scratch`: Validates upgrade from empty DB to HEAD
- `test_backward_migration_last_5`: Tests downgrade of last 5 migrations
- `test_migration_idempotency`: Ensures migrations can run multiple times safely
- `test_foreign_key_constraints`: Validates all FK relationships
- `test_index_creation_and_performance`: Checks index coverage and performance
- `test_rls_policies`: Verifies Row Level Security policies

### TestMigrationDataIntegrity

Data integrity during migrations:

- `test_data_preserved_after_downgrade_upgrade`: Ensures data survives migration cycles

### TestMigrationPerformance

Performance characteristics:

- `test_migration_execution_time`: Measures migration execution time

### TestMigrationWithProductionLikeData

Production-scale testing (requires manual setup):

- `test_migration_with_large_dataset`: Tests with production-like data volumes

## Fixtures

Key pytest fixtures available:

- `alembic_config`: Alembic configuration object
- `test_database_url`: Test database URL
- `test_engine`: SQLAlchemy engine for test database
- `test_session_factory`: Session factory for test database
- `clean_test_db`: Fresh database for each test
- `migrated_test_db`: Database with all migrations applied
- `migration_config`: Configured Alembic config

## Environment Variables

- `TEST_MIGRATION_DATABASE_URL`: Override default test database URL
- `TEST_DATABASE_URL`: Alternative variable name for test database URL

## Common Issues

### Issue: Test database doesn't exist

**Solution:**
```bash
createdb test_migrations_db
```

### Issue: Permission denied

**Solution:**
```bash
# Grant permissions
psql -c "GRANT ALL PRIVILEGES ON DATABASE test_migrations_db TO postgres;"
```

### Issue: Tests fail due to existing data

**Solution:**
```bash
# Drop and recreate test database
dropdb test_migrations_db
createdb test_migrations_db
```

### Issue: Connection limit exceeded

**Solution:**
```sql
-- Increase max connections in postgresql.conf
max_connections = 200

-- Or kill idle connections
SELECT pg_terminate_backend(pid)
FROM pg_stat_activity
WHERE state = 'idle' AND datname = 'test_migrations_db';
```

## Performance Benchmarks

Expected test execution times:

- Forward migration (empty to HEAD): < 30s
- Backward migration (5 steps): < 15s
- Idempotency test: < 10s
- Foreign key validation: < 5s
- Index validation: < 5s
- Full suite: < 60s

If tests take significantly longer, investigate:
- Large migration files
- Missing indexes
- Complex data transformations
- Database connection issues

## CI/CD Integration

### GitHub Actions

```yaml
name: Migration Tests

on: [push, pull_request]

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
      
      - name: Run migration tests
        env:
          TEST_MIGRATION_DATABASE_URL: postgresql://postgres:postgres@localhost:5432/test_migrations_db
        run: |
          pytest tests/migration/ -v --cov=alembic
```

## Maintenance

### Adding New Tests

When adding new migration tests:

1. Follow existing patterns in `test_migrations.py`
2. Use appropriate fixtures from `conftest.py`
3. Add docstrings explaining what the test validates
4. Update this README with new test information

### Updating Fixtures

When modifying fixtures:

1. Update `conftest.py`
2. Ensure backward compatibility
3. Update fixture documentation
4. Test with existing test suite

## Best Practices

1. **Always test migrations** before deploying to production
2. **Test both directions** - upgrade and downgrade
3. **Use production-like data** for realistic testing
4. **Monitor performance** - migrations should complete quickly
5. **Verify data integrity** after migrations
6. **Document issues** found during testing

## Rollback Procedures

See [Migration Rollback Procedures](../../docs/MIGRATION_ROLLBACK_PROCEDURES.md) for detailed rollback instructions.

## Additional Resources

- [Alembic Documentation](https://alembic.sqlalchemy.org/)
- [PostgreSQL Migration Best Practices](https://wiki.postgresql.org/wiki/Development_Best_Practices)
- [SQLAlchemy Documentation](https://docs.sqlalchemy.org/)

## Support

For issues or questions:
1. Check this README
2. Review test output and error messages
3. Consult [Migration Rollback Procedures](../../docs/MIGRATION_ROLLBACK_PROCEDURES.md)
4. Contact the database team

---

**Last Updated**: 2024-01-20  
**Maintained By**: Database Team
