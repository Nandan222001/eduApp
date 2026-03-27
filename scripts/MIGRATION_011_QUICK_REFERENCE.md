# Migration 011 Quick Reference

Quick reference for running and troubleshooting migration 011.

## Quick Commands

### Run Migration
```powershell
# Option 1: Comprehensive diagnostic and upgrade (RECOMMENDED)
.\scripts\diagnose_and_fix_migration_011.ps1

# Option 2: Direct alembic upgrade
alembic upgrade head

# Option 3: Verify schema first, then upgrade
python scripts/verify_schema.py
alembic upgrade head
```

### Check Status
```powershell
# Verify schema compatibility
python scripts/verify_schema.py

# Check MySQL error logs
.\scripts\check_mysql_logs.ps1

# Check current migration version
alembic current

# View migration history
alembic history
```

## Migration 011 Details

### What It Creates
- `chapter_performance` - Student performance by chapter
- `question_recommendations` - AI-powered question recommendations
- `focus_areas` - Identified areas needing focus
- `personalized_insights` - Personalized learning insights

### Dependencies
- Requires migration **006a** to be applied (creates `questions_bank` table)
- Requires migration **010** to be applied

### Key Lines
**Line 62 of migration 006a** (creates questions_bank.id):
```python
sa.Column('id', sa.Integer(), nullable=False),
```

**Line 74 of migration 011** (references questions_bank.id):
```python
sa.Column('question_id', sa.Integer(), nullable=False),
```

**Line 94 of migration 011** (foreign key constraint):
```python
sa.ForeignKeyConstraint(['question_id'], ['questions_bank.id'], ondelete='CASCADE'),
```

## Common Errors

### Error 1: Foreign Key Constraint Failed
```
Cannot add or update a child row: a foreign key constraint fails
```

**Quick Fix:**
```sql
-- Check column types match
DESCRIBE questions_bank;
-- Ensure id column is INTEGER type
```

### Error 2: questions_bank Table Missing
```
ValueError: questions_bank table must exist before creating question_recommendations
```

**Quick Fix:**
```bash
alembic upgrade 006a
alembic upgrade head
```

### Error 3: Type Mismatch
Both `questions_bank.id` and `question_recommendations.question_id` must be INTEGER.

**Quick Fix:**
```sql
-- Fix questions_bank.id type if needed
ALTER TABLE questions_bank MODIFY COLUMN id INTEGER NOT NULL AUTO_INCREMENT;
```

## Verification Checklist

- [ ] Python environment is set up
- [ ] Database connection works
- [ ] Migration 006a is applied (`SELECT version_num FROM alembic_version;`)
- [ ] `questions_bank` table exists (`SHOW TABLES LIKE 'questions_bank';`)
- [ ] `questions_bank.id` is INTEGER type (`DESCRIBE questions_bank;`)
- [ ] No foreign key constraint errors in MySQL logs

## SQL Quick Checks

```sql
-- 1. Check current migration version
SELECT version_num FROM alembic_version;

-- 2. Check if questions_bank exists
SHOW TABLES LIKE 'questions_bank';

-- 3. Verify questions_bank.id column type
DESCRIBE questions_bank;

-- 4. Detailed column type check
SELECT COLUMN_NAME, DATA_TYPE, COLUMN_TYPE, IS_NULLABLE, COLUMN_KEY
FROM INFORMATION_SCHEMA.COLUMNS 
WHERE TABLE_SCHEMA = DATABASE() 
    AND TABLE_NAME = 'questions_bank' 
    AND COLUMN_NAME = 'id';

-- 5. Check if question_recommendations already exists
SHOW TABLES LIKE 'question_recommendations';

-- 6. List all tables
SHOW TABLES;
```

## Troubleshooting Flow

```
1. Run: .\scripts\diagnose_and_fix_migration_011.ps1
   ↓
2. If fails → Check output for specific error
   ↓
3. Foreign key error?
   → Run: DESCRIBE questions_bank;
   → Verify id column is INTEGER
   ↓
4. Table missing error?
   → Run: alembic upgrade 006a
   → Then try again
   ↓
5. Still failing?
   → Run: .\scripts\check_mysql_logs.ps1
   → Check for detailed MySQL errors
   ↓
6. Need more info?
   → Read: scripts\MIGRATION_011_TROUBLESHOOTING.md
```

## Scripts Available

| Script | Purpose |
|--------|---------|
| `diagnose_and_fix_migration_011.ps1` | Main diagnostic and upgrade script |
| `verify_schema.py` | Check schema compatibility |
| `run_alembic_upgrade.py` | Run upgrade with detailed output |
| `run_alembic_upgrade.ps1` | Simple upgrade script |
| `check_mysql_logs.ps1` | View MySQL error logs |
| `check_and_fix_migration_011.sql` | SQL diagnostic queries |

## Help Resources

- **Full Troubleshooting Guide**: `scripts\MIGRATION_011_TROUBLESHOOTING.md`
- **Scripts Documentation**: `scripts\README.md`
- **Alembic Documentation**: https://alembic.sqlalchemy.org/

## Support

If you need help:
1. Run `.\scripts\diagnose_and_fix_migration_011.ps1 -VerifyOnly`
2. Collect the output
3. Check `scripts\MIGRATION_011_TROUBLESHOOTING.md` for similar issues
4. Review MySQL error logs with `.\scripts\check_mysql_logs.ps1`
