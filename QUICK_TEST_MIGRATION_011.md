# Quick Test Guide - Migration 011

## TL;DR - Run This

```bash
# Update .env with your MySQL credentials, then:
python test_migration_011.py
```

Expected: ✓ All checks pass in ~10 seconds

## What This Tests

Migration 011 creates weakness detection tables:
- ✅ Skips `chapter_performance` if exists
- ✅ Creates `question_recommendations`, `focus_areas`, `personalized_insights`
- ✅ Adds 27 indexes total
- ✅ Updates to alembic version 011

## Prerequisites

```bash
# 1. MySQL running
mysql -u root -p -e "SELECT 1;"

# 2. Update .env
DATABASE_USER=root
DATABASE_PASSWORD=your_password
DATABASE_NAME=test_migration_011

# 3. Dependencies installed
pip install sqlalchemy pymysql alembic
```

## Test Options

### Option 1: Automated (Recommended)
```bash
python test_migration_011.py
# ✓ Full alembic integration test
# ✓ ~10 seconds
```

### Option 2: Direct Function Test
```bash
python test_migration_011_direct.py
# ✓ Tests upgrade() function directly
# ✓ Better error messages
# ✓ ~8 seconds
```

### Option 3: Manual
```bash
# Setup
mysql -u root -p test_migration_011 < test_schema.sql

# Run
alembic upgrade 011

# Verify
alembic current  # Should show: 011
mysql -u root -p test_migration_011 -e "SHOW TABLES;"
```

## Success Criteria

All must pass:
- [ ] 4 tables exist (chapter_performance, question_recommendations, focus_areas, personalized_insights)
- [ ] 27 indexes created
- [ ] Existing data preserved
- [ ] Alembic version = 011
- [ ] No errors

## Quick Troubleshooting

| Error | Fix |
|-------|-----|
| MySQL connection failed | Check MySQL is running, update .env credentials |
| Database exists | Run script again (it auto-cleans) or `DROP DATABASE test_migration_011;` |
| Import errors | `pip install sqlalchemy pymysql alembic` |
| Permission denied | Grant privileges to MySQL user |

## Files Created

- `test_migration_011.py` - Automated test script
- `test_migration_011_direct.py` - Direct function test
- `TEST_MIGRATION_011_README.md` - Detailed guide
- `MIGRATION_011_TEST_GUIDE.md` - Technical docs
- `QUICK_TEST_MIGRATION_011.md` - This file

## Cleanup

```bash
mysql -u root -p -e "DROP DATABASE IF EXISTS test_migration_011;"
# Or just re-run test (auto-cleans)
```

## Next Steps After Testing

1. Review test output - ensure all ✓ checks
2. Test on staging environment
3. Plan production deployment
4. Backup production DB before migration
5. Run: `alembic upgrade 011`
6. Verify: `alembic current`

## Need Help?

- Full guide: `TEST_MIGRATION_011_README.md`
- Technical details: `MIGRATION_011_TEST_GUIDE.md`
- Migration file: `alembic/versions/011_create_weakness_detection_tables.py`
