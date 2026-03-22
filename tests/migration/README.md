# MySQL Migration Tests

Comprehensive test suite for validating MySQL migration from PostgreSQL.

## Quick Start

### Run All Tests (Recommended)

```bash
# Linux/Mac
./scripts/run_mysql_migration_tests.sh

# Windows PowerShell
.\scripts\run_mysql_migration_tests.ps1
```

This will execute:
1. Alembic migrations on fresh MySQL database
2. Comprehensive migration validation tests
3. Unit and integration tests
4. API endpoint validation
5. Performance benchmarks
6. Schema integrity checks
7. Multi-tenant isolation verification

## Test Files

### Core Test Files

- **test_mysql_comprehensive.py** - Main comprehensive test suite
  - Database migration validation
  - Multi-tenant data isolation
  - Load testing and performance
  - Analytics aggregations
  - ML model predictions
  - Real-time features

- **test_api_endpoints_mysql.py** - API endpoint validation
  - Authentication endpoints
  - CRUD operations
  - Data isolation via API
  - Subscription management

- **test_migrations.py** - Migration-specific tests
  - Forward/backward migrations
  - Migration idempotency
  - Foreign key constraints
  - Index creation
  - Data integrity

## Test Execution

### Individual Test Categories

```bash
# 1. Run alembic migrations
export DATABASE_URL="mysql+pymysql://root:test_password@localhost:3306/test_db?charset=utf8mb4"
alembic upgrade head

# 2. Multi-tenant isolation
pytest tests/migration/test_mysql_comprehensive.py::TestMySQLMigrationComprehensive::test_02_multi_tenant_data_isolation -v -s

# 3. Load testing
pytest tests/migration/test_mysql_comprehensive.py::TestMySQLMigrationComprehensive::test_03_load_testing_mysql_performance -v -s

# 4. API endpoints
pytest tests/migration/test_api_endpoints_mysql.py -v -s

# 5. Analytics
pytest tests/migration/test_mysql_comprehensive.py::TestMySQLMigrationComprehensive::test_04_analytics_aggregations -v -s

# 6. ML predictions
pytest tests/migration/test_mysql_comprehensive.py::TestMySQLMigrationComprehensive::test_05_ml_model_predictions -v -s

# 7. Real-time features
pytest tests/migration/test_mysql_comprehensive.py::TestMySQLRealTimeFeatures::test_real_time_leaderboard -v -s
```

## Environment Variables

```bash
# MySQL connection settings
export MYSQL_HOST=localhost
export MYSQL_PORT=3306
export MYSQL_USER=root
export MYSQL_PASSWORD=test_password
export MYSQL_TEST_DB=test_mysql_migration

# Test database URL
export MYSQL_TEST_DATABASE_URL="mysql+pymysql://${MYSQL_USER}:${MYSQL_PASSWORD}@${MYSQL_HOST}:${MYSQL_PORT}/${MYSQL_TEST_DB}?charset=utf8mb4"
```

## Expected Results

### Success Criteria

✓ All Alembic migrations execute without errors  
✓ Database schema matches SQLAlchemy models  
✓ Multi-tenant filtering works correctly  
✓ No cross-institution data leakage  
✓ Performance meets defined thresholds  
✓ All API endpoints return correct responses  
✓ Analytics aggregations produce accurate results  
✓ ML predictions work with JSON storage  
✓ Real-time features function properly  

### Performance Thresholds

| Test | Threshold | Description |
|------|-----------|-------------|
| Bulk insert 1000 students | < 30s | Mass data import performance |
| Query with filtering | < 0.5s | Single query performance |
| Complex joins | < 1.0s | Multi-table query performance |
| Bulk attendance (3000) | < 10s | Bulk insert performance |
| Aggregation query | < 1.0s | Analytics query performance |
| Leaderboard (1000 users) | < 5s | Real-time ranking generation |

## Test Coverage

### Areas Covered

1. **Database Migrations**
   - Schema creation
   - Indexes and constraints
   - Foreign key relationships
   - Data type compatibility

2. **Multi-Tenant Isolation**
   - Tenant filtering logic
   - Cross-institution data protection
   - RLS alternative implementation
   - Bypass mechanisms

3. **Performance**
   - Bulk operations
   - Query optimization
   - Index effectiveness
   - Connection pooling

4. **API Integration**
   - Authentication flow
   - CRUD operations
   - Error handling
   - Data validation

5. **Business Logic**
   - Analytics calculations
   - ML predictions
   - Real-time updates
   - Leaderboard generation

## Troubleshooting

### Common Issues

**1. MySQL Connection Failed**
```bash
# Verify MySQL is running
systemctl status mysql  # Linux
# or
net start MySQL80  # Windows

# Test connection
mysql -u root -p -e "SELECT 1"
```

**2. Character Encoding Issues**
```bash
# Verify database charset
mysql -u root -p -e "
SELECT DEFAULT_CHARACTER_SET_NAME, DEFAULT_COLLATION_NAME 
FROM information_schema.SCHEMATA 
WHERE SCHEMA_NAME = 'test_mysql_migration';"

# Should return: utf8mb4 | utf8mb4_unicode_ci
```

**3. Migration Errors**
```bash
# Check current revision
alembic current

# Reset to clean state
alembic downgrade base
alembic upgrade head
```

**4. Test Database Not Found**
```bash
# Create test database
mysql -u root -p -e "
CREATE DATABASE IF NOT EXISTS test_mysql_migration 
CHARACTER SET utf8mb4 
COLLATE utf8mb4_unicode_ci;"
```

## Documentation

- [MySQL Testing Guide](MYSQL_TESTING_GUIDE.md) - Detailed testing procedures
- [Migration README](../../scripts/MIGRATION_README.md) - Migration process documentation
- [Testing Guide](../TESTING_GUIDE.md) - General testing guidelines

## CI/CD Integration

Add to your CI pipeline:

```yaml
- name: Run MySQL Migration Tests
  run: |
    export MYSQL_TEST_DATABASE_URL="mysql+pymysql://root:password@localhost/test_db?charset=utf8mb4"
    ./scripts/run_mysql_migration_tests.sh
```

## Support

For issues or questions:
1. Check the troubleshooting section
2. Review test logs
3. Examine MySQL error logs
4. Verify environment configuration
5. Check database schema state

## License

Same as project license.
