# Migration 011 Testing Guide

## Overview

This guide provides instructions for testing migration 011 with an existing `chapter_performance` table to verify that:

1. The migration skips creating `chapter_performance` if it already exists
2. Missing tables (`question_recommendations`, `focus_areas`, `personalized_insights`) are created
3. All indexes are created for both existing and new tables
4. The alembic version is updated to 011

## Prerequisites

### 1. MySQL Database

Ensure MySQL is installed and running:
- MySQL 8.0 or higher
- Local MySQL server running on port 3306

### 2. Database User Credentials

The test script uses these environment variables (defaults shown):
```bash
DATABASE_HOST=localhost
DATABASE_PORT=3306
DATABASE_USER=root
DATABASE_PASSWORD=
DATABASE_NAME=test_migration_011
```

Update `.env` file with your MySQL credentials if different from defaults.

### 3. Python Dependencies

Ensure you have the required Python packages:
```bash
pip install sqlalchemy pymysql alembic
```

## Test Scenarios

### Scenario 1: Automated Test Script (Recommended)

This script automatically sets up a test database with the `chapter_performance` table already present and runs the migration.

#### Run the Test

```bash
python test_migration_011.py
```

#### What the Script Does

1. **Setup Phase:**
   - Creates a fresh test database (`test_migration_011`)
   - Creates required dependency tables (institutions, students, subjects, chapters, topics, questions_bank)
   - Creates the `chapter_performance` table (simulating existing table from prior migration)
   - Sets alembic version to '010_study_planner'

2. **Migration Phase:**
   - Runs `alembic upgrade 011`
   - The migration should:
     - Skip creating `chapter_performance` (already exists)
     - Create `question_recommendations`, `focus_areas`, `personalized_insights`
     - Create all indexes for existing and new tables

3. **Verification Phase:**
   - Checks all expected tables exist
   - Verifies all indexes were created:
     - chapter_performance: 6 indexes
     - question_recommendations: 7 indexes
     - focus_areas: 7 indexes
     - personalized_insights: 7 indexes
   - Confirms alembic version is '011'

#### Expected Output

```
INFO: === Testing Migration 011 with Existing chapter_performance Table ===

INFO: Setting up test database...
INFO: Created database: test_migration_011
INFO: Creating chapter_performance table (simulating existing table)...
INFO: Test database setup complete
INFO: Running migration 011...
INFO: Migration output:
INFO: Upgrading 010_study_planner -> 011
INFO: Verifying migration results...
INFO: Tables in database: [...]
INFO: ✓ Table 'chapter_performance' exists
INFO: ✓ Table 'question_recommendations' exists
INFO: ✓ Table 'focus_areas' exists
INFO: ✓ Table 'personalized_insights' exists

INFO: Verifying chapter_performance indexes...
INFO: ✓ Index 'idx_chapter_perf_institution' exists
INFO: ✓ Index 'idx_chapter_perf_student' exists
INFO: ✓ Index 'idx_chapter_perf_subject' exists
INFO: ✓ Index 'idx_chapter_perf_chapter' exists
INFO: ✓ Index 'idx_chapter_perf_mastery' exists
INFO: ✓ Index 'idx_chapter_perf_proficiency' exists

INFO: Verifying question_recommendations indexes...
[... all 7 indexes verified ...]

INFO: Verifying focus_areas indexes...
[... all 7 indexes verified ...]

INFO: Verifying personalized_insights indexes...
[... all 7 indexes verified ...]

INFO: Verifying alembic version...
INFO: ✓ Alembic version is 011

INFO: ✓ All verification checks passed!

============================================================
✓ Migration 011 test completed successfully!
============================================================
```

### Scenario 2: Manual Testing

If you prefer manual testing or need to test on an existing database:

#### Step 1: Check Current State

```bash
# Check alembic version
alembic current

# Connect to MySQL and verify chapter_performance exists
mysql -u root -p test_migration_011
mysql> SHOW TABLES LIKE 'chapter_performance';
mysql> DESCRIBE chapter_performance;
mysql> SHOW INDEX FROM chapter_performance;
```

#### Step 2: Run Migration

```bash
alembic upgrade 011
```

#### Step 3: Verify Results

```bash
# Check new version
alembic current
# Should show: 011

# Verify tables
mysql -u root -p test_migration_011
mysql> SHOW TABLES;
# Should include: chapter_performance, question_recommendations, focus_areas, personalized_insights

# Check chapter_performance wasn't recreated (should still have data if any existed)
mysql> SELECT COUNT(*) FROM chapter_performance;

# Verify indexes on new tables
mysql> SHOW INDEX FROM question_recommendations;
mysql> SHOW INDEX FROM focus_areas;
mysql> SHOW INDEX FROM personalized_insights;

# Verify indexes were added to chapter_performance
mysql> SHOW INDEX FROM chapter_performance;
# Should show 6 indexes:
# - idx_chapter_perf_institution
# - idx_chapter_perf_student
# - idx_chapter_perf_subject
# - idx_chapter_perf_chapter
# - idx_chapter_perf_mastery
# - idx_chapter_perf_proficiency
```

## Verification Checklist

- [ ] Migration completes without errors
- [ ] `chapter_performance` table still exists (not recreated)
- [ ] `question_recommendations` table created
- [ ] `focus_areas` table created
- [ ] `personalized_insights` table created
- [ ] All 6 indexes created on `chapter_performance`
- [ ] All 7 indexes created on `question_recommendations`
- [ ] All 7 indexes created on `focus_areas`
- [ ] All 7 indexes created on `personalized_insights`
- [ ] `alembic current` shows revision 011
- [ ] No duplicate tables or indexes
- [ ] Existing data in `chapter_performance` preserved (if any)

## Troubleshooting

### Error: Access denied for user

**Problem:** MySQL authentication fails

**Solution:** Update `.env` with correct credentials:
```bash
DATABASE_USER=root
DATABASE_PASSWORD=your_mysql_password
```

### Error: Database does not exist

**Problem:** Test database not created

**Solution:** Create it manually or use the automated script:
```bash
mysql -u root -p
mysql> CREATE DATABASE test_migration_011 CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
```

### Error: Table already exists

**Problem:** Running migration multiple times

**Solution:** 
1. Drop and recreate test database
2. Or use the automated test script which handles cleanup

### Warning: Index already exists

**Problem:** Indexes created by previous migration run

**Solution:** This is expected behavior - the migration checks for existing indexes before creating them.

## Cleanup

After testing, you can remove the test database:

```bash
mysql -u root -p
mysql> DROP DATABASE test_migration_011;
```

Or let the automated script handle it on the next run.

## Files Created

- `test_migration_011.py` - Automated test script
- `TEST_MIGRATION_011_README.md` - This documentation
- `.env` - Updated with test database configuration

## Migration File

The migration being tested:
- `alembic/versions/011_create_weakness_detection_tables.py`

Key features:
- Uses SQLAlchemy inspector to check if tables/indexes exist
- Conditionally creates tables only if missing
- Conditionally creates indexes only if missing
- Safe for multiple runs (idempotent)
