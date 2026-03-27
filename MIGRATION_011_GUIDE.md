# Migration 011 Complete Guide

This guide helps you run and troubleshoot migration 011 (Weakness Detection Tables).

## Quick Start

Choose the method that works best for your system:

### Windows (PowerShell) - RECOMMENDED
```powershell
.\scripts\diagnose_and_fix_migration_011.ps1
```

### Windows (Command Prompt)
```cmd
scripts\run_migration_011.bat
```

### Linux/Mac
```bash
bash scripts/run_migration_011.sh
```

### Direct Alembic
```bash
alembic upgrade head
```

## What Migration 011 Does

Migration 011 creates four new tables for the weakness detection and personalized learning system:

1. **chapter_performance** - Tracks student performance metrics by chapter
2. **question_recommendations** - AI-powered personalized question recommendations
3. **focus_areas** - Identifies areas where students need to focus
4. **personalized_insights** - Provides AI-generated learning insights

## Prerequisites

- **Migration 006a** must be applied (creates `questions_bank` table)
- **Migration 010** must be applied
- Database connection configured in `.env` file
- Python 3.7+ installed

## Important Information

### Column Type Compatibility

Migration 011 creates a foreign key from `question_recommendations.question_id` to `questions_bank.id`. Both columns must be INTEGER type.

- **Line 62 of migration 006a**: Creates `questions_bank.id` as INTEGER
- **Line 74 of migration 011**: Creates `question_id` as INTEGER
- **Line 94 of migration 011**: Creates the foreign key constraint

If these types don't match, the migration will fail with a foreign key constraint error.

## Troubleshooting

### Problem: Migration Fails

**Solution:** Run the diagnostic script
```powershell
# Windows PowerShell
.\scripts\diagnose_and_fix_migration_011.ps1

# Linux/Mac
bash scripts/run_migration_011.sh
```

### Problem: Foreign Key Constraint Error

**Symptom:**
```
Cannot add or update a child row: a foreign key constraint fails
```

**Solution:** Verify column types match
```sql
-- Check questions_bank.id column
DESCRIBE questions_bank;

-- Should show: id | int | NO | PRI | NULL | auto_increment
```

If the type is wrong, fix it:
```sql
ALTER TABLE questions_bank MODIFY COLUMN id INTEGER NOT NULL AUTO_INCREMENT;
```

### Problem: questions_bank Table Missing

**Symptom:**
```
ValueError: questions_bank table must exist before creating question_recommendations
```

**Solution:** Apply migration 006a first
```bash
alembic upgrade 006a
alembic upgrade head
```

### Problem: Need to Check Database State

**Solution:** Use verification script
```bash
python scripts/verify_schema.py
```

### Problem: Need to See MySQL Errors

**Solution:** Check error logs
```powershell
# Windows
.\scripts\check_mysql_logs.ps1

# Linux/Mac
sudo tail -f /var/log/mysql/error.log
```

## Available Tools

All tools are located in the `scripts/` directory:

| Tool | Purpose | Command |
|------|---------|---------|
| Main diagnostic script | Full diagnostics + upgrade | `.\scripts\diagnose_and_fix_migration_011.ps1` |
| Schema verifier | Check compatibility | `python scripts/verify_schema.py` |
| Upgrade script (Python) | Run upgrade with output | `python scripts/run_alembic_upgrade.py` |
| Upgrade script (PowerShell) | Simple upgrade | `.\scripts\run_alembic_upgrade.ps1` |
| Log checker | View MySQL error logs | `.\scripts\check_mysql_logs.ps1` |
| SQL queries | Manual database checks | `scripts\check_and_fix_migration_011.sql` |
| Batch file (Windows) | Simple upgrade | `scripts\run_migration_011.bat` |
| Shell script (Linux/Mac) | Simple upgrade | `bash scripts/run_migration_011.sh` |

## Documentation

- **Quick Reference**: `scripts/MIGRATION_011_QUICK_REFERENCE.md` - Command cheat sheet
- **Troubleshooting Guide**: `scripts/MIGRATION_011_TROUBLESHOOTING.md` - Detailed troubleshooting
- **Scripts Documentation**: `scripts/README.md` - All scripts documented

## Verification Steps

After running the migration, verify it worked:

### 1. Check Alembic Version
```sql
SELECT version_num FROM alembic_version;
-- Should show: 011
```

### 2. Check Tables Exist
```sql
SHOW TABLES LIKE '%chapter_performance%';
SHOW TABLES LIKE '%question_recommendations%';
SHOW TABLES LIKE '%focus_areas%';
SHOW TABLES LIKE '%personalized_insights%';
```

### 3. Verify Foreign Keys
```sql
SELECT 
    CONSTRAINT_NAME,
    TABLE_NAME,
    COLUMN_NAME,
    REFERENCED_TABLE_NAME,
    REFERENCED_COLUMN_NAME
FROM INFORMATION_SCHEMA.KEY_COLUMN_USAGE
WHERE TABLE_SCHEMA = DATABASE()
    AND TABLE_NAME = 'question_recommendations'
    AND REFERENCED_TABLE_NAME = 'questions_bank';
```

### 4. Run Schema Verification
```bash
python scripts/verify_schema.py
```

## Common Commands

```bash
# Check current migration version
alembic current

# View migration history
alembic history

# Upgrade to specific version
alembic upgrade 006a
alembic upgrade 010
alembic upgrade 011

# Rollback one migration
alembic downgrade -1

# Check database connection
python -c "from src.config import settings; from sqlalchemy import create_engine; engine = create_engine(settings.database_url); print('Connected:', engine.connect())"
```

## Getting Help

1. **Check error messages carefully** - They usually indicate the exact problem
2. **Run verification script**: `python scripts/verify_schema.py`
3. **Read troubleshooting guide**: `scripts/MIGRATION_011_TROUBLESHOOTING.md`
4. **Check MySQL logs**: `.\scripts\check_mysql_logs.ps1`
5. **Review this guide**: `MIGRATION_011_GUIDE.md`

## Manual SQL Checks

If automated tools don't work, use these SQL queries:

```sql
-- 1. Current migration version
SELECT version_num FROM alembic_version;

-- 2. Check if questions_bank exists
SHOW TABLES LIKE 'questions_bank';

-- 3. Check questions_bank.id column type
SELECT COLUMN_NAME, DATA_TYPE, COLUMN_TYPE, IS_NULLABLE, COLUMN_KEY
FROM INFORMATION_SCHEMA.COLUMNS 
WHERE TABLE_SCHEMA = DATABASE() 
    AND TABLE_NAME = 'questions_bank' 
    AND COLUMN_NAME = 'id';

-- 4. Check all tables
SHOW TABLES;

-- 5. Check specific table structure
DESCRIBE questions_bank;
DESCRIBE question_recommendations;
```

## Success Indicators

You'll know the migration succeeded when:

- ✅ `alembic current` shows version 011
- ✅ All four new tables exist in the database
- ✅ No errors in MySQL error log
- ✅ `python scripts/verify_schema.py` passes
- ✅ Foreign key from question_recommendations to questions_bank exists

## Next Steps After Success

1. Test the new functionality
2. Verify data can be inserted into new tables
3. Run application tests
4. Deploy to other environments (staging, production)

## Support

If you continue to have issues after following this guide:

1. Collect diagnostics:
   ```bash
   python scripts/verify_schema.py > diagnostics.txt
   alembic history >> diagnostics.txt
   alembic current >> diagnostics.txt
   ```

2. Check MySQL error logs and save relevant errors

3. Review `scripts/MIGRATION_011_TROUBLESHOOTING.md` for detailed solutions

4. Provide the collected information when seeking help
