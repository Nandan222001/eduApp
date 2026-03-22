# MySQL Migration Testing - Quick Start Guide

## TL;DR - Run Everything

```bash
# Option 1: Bash script (Linux/Mac)
./scripts/run_mysql_migration_tests.sh

# Option 2: PowerShell script (Windows)
.\scripts\run_mysql_migration_tests.ps1

# Option 3: Python orchestrator (All platforms)
python tests/migration/run_complete_validation.py
```

## Prerequisites (5 minutes)

```bash
# 1. Install MySQL 8.0+
# Already installed? Skip to step 2

# 2. Create test database
mysql -u root -p -e "CREATE DATABASE test_mysql_migration CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;"

# 3. Set environment variables
export MYSQL_HOST=localhost
export MYSQL_PORT=3306
export MYSQL_USER=root
export MYSQL_PASSWORD=test_password
export MYSQL_TEST_DB=test_mysql_migration

# 4. Install Python dependencies
pip install -r requirements.txt
```

## Quick Tests (10 minutes)

### Test 1: Migrations Only

```bash
# Clean database
mysql -u root -p test_mysql_migration -e "DROP DATABASE IF EXISTS test_mysql_migration; CREATE DATABASE test_mysql_migration CHARACTER SET utf8mb4;"

# Run migrations
export DATABASE_URL="mysql+pymysql://root:test_password@localhost:3306/test_mysql_migration?charset=utf8mb4"
alembic upgrade head

# Verify
mysql -u root -p test_mysql_migration -e "SHOW TABLES;" | wc -l
# Expected: 50+ tables
```

**Expected Time:** 2-3 minutes  
**Success Criteria:** All migrations execute without errors

### Test 2: Multi-Tenant Isolation

```bash
pytest tests/migration/test_mysql_comprehensive.py::TestMySQLMigrationComprehensive::test_02_multi_tenant_data_isolation -v -s
```

**Expected Time:** 1-2 minutes  
**Success Criteria:** 
- ✓ Data properly isolated between institutions
- ✓ No cross-tenant data leakage
- ✓ Query filters work correctly

### Test 3: Load & Performance

```bash
pytest tests/migration/test_mysql_comprehensive.py::TestMySQLMigrationComprehensive::test_03_load_testing_mysql_performance -v -s
```

**Expected Time:** 3-5 minutes  
**Success Criteria:** All performance thresholds met

### Test 4: API Endpoints

```bash
pytest tests/migration/test_api_endpoints_mysql.py -v -s
```

**Expected Time:** 2-3 minutes  
**Success Criteria:** All API endpoints respond correctly

## Full Test Suite (30-45 minutes)

```bash
# Run everything
./scripts/run_mysql_migration_tests.sh
```

This executes:
1. Alembic migrations (2-3 min)
2. Comprehensive tests (5-10 min)
3. Unit tests (5-10 min)
4. Integration tests (5-10 min)
5. API tests (3-5 min)
6. Performance benchmarks (5-10 min)
7. Schema validation (1 min)
8. Multi-tenant isolation (1 min)

## Individual Component Testing

### Analytics
```bash
pytest tests/migration/test_mysql_comprehensive.py::TestMySQLMigrationComprehensive::test_04_analytics_aggregations -v -s
```

### ML Predictions
```bash
pytest tests/migration/test_mysql_comprehensive.py::TestMySQLMigrationComprehensive::test_05_ml_model_predictions -v -s
```

### Real-Time Features
```bash
pytest tests/migration/test_mysql_comprehensive.py::TestMySQLRealTimeFeatures::test_real_time_leaderboard -v -s
```

## Troubleshooting (2 minutes)

### Problem: Can't connect to MySQL
```bash
# Check MySQL is running
systemctl status mysql  # Linux
net start MySQL80       # Windows

# Test connection
mysql -u root -p -e "SELECT 1"
```

### Problem: Character encoding errors
```bash
# Verify charset
mysql -u root -p -e "SHOW CREATE DATABASE test_mysql_migration;"
# Should show: utf8mb4 and utf8mb4_unicode_ci
```

### Problem: Migration errors
```bash
# Reset migrations
alembic downgrade base
alembic upgrade head
```

### Problem: Permission denied
```bash
# Grant privileges
mysql -u root -p -e "GRANT ALL PRIVILEGES ON test_mysql_migration.* TO 'root'@'localhost';"
```

## Success Checklist

After running tests, verify:

- [ ] All migrations executed successfully
- [ ] 50+ database tables created
- [ ] Foreign keys and indexes present
- [ ] Multi-tenant isolation working
- [ ] No cross-institution data leakage
- [ ] Performance thresholds met
- [ ] API endpoints responding
- [ ] Analytics calculations correct
- [ ] ML predictions working
- [ ] Real-time features functional

## Expected Output

```
=========================================
MySQL Migration Comprehensive Testing
=========================================

Test Configuration:
  MySQL Host: localhost:3306
  Test Database: test_mysql_migration

✓ MySQL is running
✓ Test database ready

=========================================
Step 1: Running Alembic Migrations
=========================================

✓ Alembic migrations completed successfully
Created 52 tables

=========================================
Step 2: Running Comprehensive Tests
=========================================

✓ Comprehensive migration tests passed

... (more tests)

=========================================
Test Summary
=========================================

✓ All critical tests completed

Test Results:
  1. Alembic Migrations: PASSED
  2. Comprehensive Tests: PASSED
  3. Multi-Tenant Isolation: PASSED
  ... (more results)

MySQL migration testing completed successfully!
```

## Next Steps

After successful testing:

1. Review detailed logs in `test-results/`
2. Check performance metrics
3. Validate production configuration
4. Plan deployment timeline
5. Document any custom changes

## Getting Help

- **Documentation:** See [MYSQL_TESTING_GUIDE.md](MYSQL_TESTING_GUIDE.md)
- **Logs:** Check pytest output and MySQL error logs
- **Issues:** Review error messages and stack traces
- **Performance:** Check `tests/benchmark/` results

## Time Estimates

| Task | Time |
|------|------|
| Setup | 5 min |
| Quick Tests | 10 min |
| Full Suite | 30-45 min |
| Troubleshooting | 5-10 min |
| **Total** | **50-70 min** |

## Commands Summary

```bash
# Setup
mysql -u root -p -e "CREATE DATABASE test_mysql_migration CHARACTER SET utf8mb4;"
export DATABASE_URL="mysql+pymysql://root:test_password@localhost:3306/test_mysql_migration?charset=utf8mb4"

# Quick test
alembic upgrade head
pytest tests/migration/test_mysql_comprehensive.py -v

# Full test
./scripts/run_mysql_migration_tests.sh
```

Done! 🎉
