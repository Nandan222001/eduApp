# Migration 011 Troubleshooting Guide

This guide helps troubleshoot issues when running `alembic upgrade head` to apply migration 011.

## Quick Start

### Option 1: Using PowerShell Script
```powershell
.\scripts\run_alembic_upgrade.ps1
```

### Option 2: Using Python Script
```bash
python scripts/run_alembic_upgrade.py
```

### Option 3: Direct Alembic Command
```bash
alembic upgrade head
```

## Common Issues and Solutions

### Issue 1: Foreign Key Constraint Error

**Error Message:**
```
Cannot add or update a child row: a foreign key constraint fails
```

**Cause:** The `questions_bank` table's `id` column type doesn't match the `question_recommendations` table's `question_id` column type.

**Solution:**

1. Check the column types in MySQL:
```sql
-- Check questions_bank.id type
DESCRIBE questions_bank;

-- Or use INFORMATION_SCHEMA
SELECT COLUMN_NAME, DATA_TYPE, COLUMN_TYPE 
FROM INFORMATION_SCHEMA.COLUMNS 
WHERE TABLE_SCHEMA = DATABASE() 
    AND TABLE_NAME = 'questions_bank' 
    AND COLUMN_NAME = 'id';
```

2. Both columns should be `INTEGER` type. If they don't match, you need to fix the column type:
```sql
-- Fix questions_bank.id if needed
ALTER TABLE questions_bank MODIFY COLUMN id INTEGER NOT NULL AUTO_INCREMENT;
```

### Issue 2: questions_bank Table Does Not Exist

**Error Message:**
```
ValueError: questions_bank table must exist before creating question_recommendations
```

**Cause:** Migration 006a hasn't been applied, or was rolled back.

**Solution:**

1. Check current alembic version:
```sql
SELECT version_num FROM alembic_version;
```

2. If 006a is not applied, run:
```bash
alembic upgrade 006a
```

3. Then try upgrading to head again:
```bash
alembic upgrade head
```

### Issue 3: Migration Dependency Issues

**Error Message:**
```
Dependency resolution failed
```

**Cause:** Migration 011 depends on migration 006a, but alembic can't resolve the dependency.

**Solution:**

Check the migration files:
- Migration 011 (`alembic/versions/011_create_weakness_detection_tables.py`) has:
  - `down_revision = '010_study_planner'`
  - `depends_on = ('006a',)`
  
This means it needs both 010 and 006a to be applied.

1. Apply migrations in order:
```bash
alembic upgrade 006a
alembic upgrade 010_study_planner  
alembic upgrade 011
```

## Verification Steps

### 1. Check Database Schema

Run the SQL diagnostic script:
```bash
mysql -u your_user -p your_database < scripts/check_and_fix_migration_011.sql
```

### 2. Verify Column Types Match

Line 62 of migration 006a defines:
```python
sa.Column('id', sa.Integer(), nullable=False),
```

Line 74 of migration 011 defines:
```python
sa.Column('question_id', sa.Integer(), nullable=False),
```

Both should be `INTEGER` in MySQL.

### 3. Check Foreign Key Constraints

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
    AND REFERENCED_TABLE_NAME IS NOT NULL;
```

## Manual Migration (If Automatic Fails)

If automatic migration continues to fail, you can manually create the tables:

### 1. Ensure questions_bank exists
```sql
-- This should already exist from migration 006a
-- If not, you need to run that migration first
SELECT COUNT(*) FROM questions_bank;
```

### 2. Create question_recommendations table manually
```sql
-- Run the SQL from migration 011 manually
-- See alembic/versions/011_create_weakness_detection_tables.py
-- for the exact CREATE TABLE statements
```

### 3. Update alembic version
```sql
-- Only do this if you manually applied the migration
UPDATE alembic_version SET version_num = '011';
```

## Checking MySQL Error Logs

### Linux/Mac:
```bash
sudo tail -f /var/log/mysql/error.log
```

### Windows (XAMPP):
```powershell
Get-Content "C:\xampp\mysql\data\*.err" -Tail 50
```

### Windows (MySQL Server):
```powershell
Get-Content "C:\ProgramData\MySQL\MySQL Server 8.0\Data\*.err" -Tail 50
```

## Debug Information to Collect

If you need to report an issue, collect this information:

1. **Current alembic version:**
   ```sql
   SELECT version_num FROM alembic_version;
   ```

2. **Table structure:**
   ```sql
   DESCRIBE questions_bank;
   DESCRIBE question_recommendations;
   ```

3. **Column types:**
   ```sql
   SELECT COLUMN_NAME, DATA_TYPE, COLUMN_TYPE 
   FROM INFORMATION_SCHEMA.COLUMNS 
   WHERE TABLE_SCHEMA = DATABASE() 
       AND TABLE_NAME IN ('questions_bank', 'question_recommendations');
   ```

4. **Alembic output:**
   ```bash
   alembic upgrade head --verbose
   ```

5. **MySQL error log** (last 50 lines)

## Contact

If issues persist after trying these solutions, provide the debug information above when seeking help.
