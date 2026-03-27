# Migration Troubleshooting Guide

## Table of Contents
- [Overview](#overview)
- [Issues Found and Resolutions](#issues-found-and-resolutions)
- [Common Error Messages](#common-error-messages)
- [Resolution Steps by Issue Category](#resolution-steps-by-issue-category)
- [Lessons Learned](#lessons-learned)
- [Prevention Strategies](#prevention-strategies)
- [Handling Future Migration Conflicts](#handling-future-migration-conflicts)
- [Safe Migration Practices](#safe-migration-practices)
- [Emergency Recovery Procedures](#emergency-recovery-procedures)
- [Quick Reference Checklist](#quick-reference-checklist)

---

## Overview

This document provides comprehensive troubleshooting guidance for database migration issues encountered in this project. It describes specific problems identified, their root causes, resolution steps taken, and best practices to prevent similar issues in the future.

### When to Use This Guide
- Migration failures during `alembic upgrade`
- Schema drift between models and database
- Foreign key constraint violations
- Duplicate revision ID errors
- Orphaned migration files
- Circular dependency issues

---

## Issues Found and Resolutions

### Issue Category Summary

| Issue Type | Count | Severity | Status |
|------------|-------|----------|--------|
| Duplicate Revision IDs | 5 | Critical | ✅ Resolved |
| Missing Tables | 13 | Critical | ✅ Resolved |
| Foreign Key Violations | ~30 | High | ✅ Resolved |
| Missing Referenced Tables (FK) | 1+ | High | ✅ Resolved |
| Enum Type Mismatches | 9 | Medium | ✅ Resolved |
| Missing Indexes | 60+ | Medium | ✅ Resolved |
| Schema Drift | Multiple | Medium | ✅ Resolved |
| Missing RLS Policies | 13 | Medium | ✅ Resolved |

---

## Common Error Messages

### 1. Duplicate Revision ID Error

**Error Message:**
```
alembic.util.exc.CommandError: Multiple head revisions are present for given argument 'head'; 
please specify a specific target revision, '<branchname>@head' to narrow to a specific head, 
or 'heads' for all heads
```

**Note:** This issue is database-agnostic and applies equally to MySQL and other databases.

**Root Cause:**
Multiple migration files used the same revision identifier, creating conflicting branches in the migration chain.

**Affected Files:**
- `001_create_multi_tenant_schema.py` and `001_add_dashboard_widgets.py` (both used revision `001`)
- `014_add_institution_logo.py` and `014_create_assignment_rubric_tables.py` (both used revision `014`)
- `015_add_user_device_table.py` and `015_add_ml_training_config.py` (both used revision `015`)
- `018_add_impersonation_debugging_tables.py` and `018_create_plagiarism_detection_tables.py` (both used revision `018`)

**Resolution:**
1. Renamed conflicting revision IDs to be unique:
   - `001_add_dashboard_widgets.py`: Changed revision from `001` to `001a`
   - Created migration `036_fix_duplicate_revision_ids.py` to establish proper chain link
2. Updated down_revision references to maintain chain integrity

---

### 2. Missing Table Error

**Error Message:**
```
sqlalchemy.exc.ProgrammingError: (pymysql.err.ProgrammingError) 
(1146, "Table 'edu_platform.volunteer_hour_logs' doesn't exist")
```

**Root Cause:**
SQLAlchemy models were created without corresponding migration files, causing the application to reference non-existent database tables.

**Missing Tables Identified:**
- **Volunteer Hours System** (6 tables):
  - `volunteer_hour_logs`
  - `volunteer_hour_summaries`
  - `volunteer_badges`
  - `parent_volunteer_badges`
  - `volunteer_leaderboards`
  - `volunteer_certificates`

- **Content Marketplace System** (7 tables):
  - `student_contents`
  - `content_reviews`
  - `content_purchases`
  - `content_moderation_reviews`
  - `content_plagiarism_checks`
  - `student_credits_balances`
  - `credit_transactions`

**Resolution:**
1. Created comprehensive migration `037_add_volunteer_hours_tables.py`
2. Created comprehensive migration `038_add_content_marketplace_tables.py`
3. Added all required foreign keys, indexes, and constraints
4. Implemented proper RLS policies for multi-tenant isolation

---

### 3. Foreign Key Constraint Violation

**Error Message:**
```
sqlalchemy.exc.IntegrityError: (pymysql.err.IntegrityError) 
(1452, 'Cannot add or update a child row: a foreign key constraint fails 
(`edu_platform`.`volunteer_hour_logs`, CONSTRAINT `fk_volunteer_hour_logs_parent_id` 
FOREIGN KEY (`parent_id`) REFERENCES `parents` (`id`))')
```

**Root Cause:**
- Missing foreign key definitions in migration files
- Orphaned records referencing non-existent parent records
- Incorrect CASCADE/SET NULL behavior

**Resolution:**
1. Added comprehensive foreign key constraints with appropriate actions:
   ```python
   # CASCADE for dependent data
   op.create_foreign_key(
       'fk_volunteer_hour_logs_parent_id',
       'volunteer_hour_logs', 'parents',
       ['parent_id'], ['id'],
       ondelete='CASCADE'
   )
   
   # SET NULL for optional references
   op.create_foreign_key(
       'fk_volunteer_hour_logs_verified_by',
       'volunteer_hour_logs', 'teachers',
       ['verified_by'], ['id'],
       ondelete='SET NULL'
   )
   ```

2. Created indexes on all foreign key columns for performance:
   ```python
   op.create_index(
       'ix_volunteer_hour_logs_parent_id',
       'volunteer_hour_logs',
       ['parent_id']
   )
   ```

3. Implemented orphaned record detection in migration `040_schema_drift_detection.py`

---

### 4. Enum Type Already Exists Error

**Error Message:**
```
Note: MySQL doesn't use enum types like PostgreSQL. 
In MySQL, ENUMs are column-level constraints, not separate database objects.
This error is less common in MySQL but may appear during schema synchronization.
```

**Root Cause:**
Multiple migration files attempted to create the same enum type, or enum types were created without checking for existence.

**Affected Enums:**
- `verificationstatus` (shared between volunteer hours and community service)
- `difficultylevel` (shared across learning paths)

**Resolution:**
1. Added existence checks before creating enums:
   ```python
   conn = op.get_bind()
   result = conn.execute(sa.text("""
       SELECT EXISTS (
           SELECT 1 FROM pg_type WHERE typname = 'verificationstatus'
       )
   """)).scalar()
   
   if not result:
       op.execute("""
           CREATE TYPE verificationstatus AS ENUM (
               'pending', 'verified', 'rejected'
           )
       """)
   ```

2. Documented shared enums to prevent future conflicts
3. Used `create_type=False` in SQLAlchemy enum definitions when appropriate

---

### 5. Circular Dependency Error

**Error Message:**
```
alembic.util.exc.CommandError: Can't locate revision identified by 'abc123'
Circular dependency detected: abc123 -> def456 -> abc123
```

**Root Cause:**
Migration files created circular references through incorrect down_revision specifications.

**Detection Method:**
Used diagnostic script (`scripts/diagnose_migrations.py`) that implements depth-first search to detect cycles.

**Resolution:**
1. Analyzed migration chain using diagnostic tool
2. Corrected down_revision references to establish linear chain
3. Created bridge migrations when necessary to connect separate branches
4. Verified chain integrity with `alembic history`

---

### 6. Orphaned Migration Error

**Error Message:**
```
alembic.util.exc.CommandError: Can't locate revision identified by 'xyz789'
Target revision 'xyz789' does not exist
```

**Root Cause:**
Migration files referenced non-existent parent revisions in their down_revision field.

**Example:**
```python
# Orphaned migration
down_revision = '005'  # Migration 005 does not exist
```

**Resolution:**
1. Located correct parent revision using `alembic history`
2. Updated down_revision to reference existing migration
3. Verified chain integrity after fix

---

### 7. Missing Index Performance Issue

**Symptom:**
Slow queries on tables with foreign key relationships.

**Root Cause:**
Foreign key columns lacked indexes, causing full table scans during joins.

**Resolution:**
1. Added indexes to all foreign key columns:
   ```python
   # Example from volunteer hours migration
   op.create_index('ix_volunteer_hour_logs_institution_id', 
                   'volunteer_hour_logs', ['institution_id'])
   op.create_index('ix_volunteer_hour_logs_parent_id',
                   'volunteer_hour_logs', ['parent_id'])
   op.create_index('ix_volunteer_hour_logs_academic_year_id',
                   'volunteer_hour_logs', ['academic_year_id'])
   ```

2. Created composite indexes for common query patterns:
   ```python
   op.create_index('ix_student_contents_creator_status',
                   'student_contents', ['creator_student_id', 'status'])
   ```

---

### 8. Schema Drift Issues

**Symptoms:**
- Models define columns that don't exist in database
- Database has columns not in models
- Type mismatches between model and database
- Missing NOT NULL constraints

**Root Cause:**
- Direct database modifications without migrations
- Incomplete migrations
- Model changes without corresponding migrations

**Resolution:**
Created comprehensive validation migration `040_schema_drift_detection.py` that:

1. **Validates Foreign Keys:**
   ```python
   # Check for NULL values before adding NOT NULL constraint
   result = conn.execute(sa.text(f"""
       SELECT COUNT(*) FROM {table} WHERE {fk_column} IS NULL
   """)).scalar()
   
   if result == 0:
       conn.execute(sa.text(f"""
           ALTER TABLE {table} 
           ALTER COLUMN {fk_column} SET NOT NULL
       """))
   ```

2. **Adds Missing Defaults:**
   ```python
   conn.execute(sa.text(f"""
       ALTER TABLE {table} 
       ALTER COLUMN {column} SET DEFAULT {default_value}
   """))
   ```

3. **Detects Orphaned Records:**
   ```python
   result = conn.execute(sa.text(f"""
       SELECT COUNT(*) FROM {child_table} c
       LEFT JOIN {parent_table} p ON c.{fk_column} = p.id
       WHERE p.id IS NULL
   """)).scalar()
   ```

4. **Verifies Indexes:**
   ```python
   result = conn.execute(sa.text("""
       SELECT COUNT(*) FROM pg_indexes 
       WHERE tablename = :table AND indexname = :index
   """), {"table": table, "index": index_name}).scalar()
   ```

---

### 9. Row Level Security (RLS) Missing

**Symptom:**
Multi-tenant data leakage - users seeing data from other institutions.

**Root Cause:**
New tables created without RLS policies, breaking multi-tenant isolation.

**Resolution:**
Created migration `039_validate_schema_consistency.py` that:

1. **Enables RLS on all tables:**
   ```python
   conn.execute(sa.text(f"ALTER TABLE {table} ENABLE ROW LEVEL SECURITY"))
   ```

2. **Creates isolation policies:**
   ```python
   conn.execute(sa.text(f"""
       CREATE POLICY {table}_isolation_policy ON {table}
       USING (
           institution_id = current_setting('app.current_institution_id', true)::integer
           OR current_setting('app.bypass_rls', true)::boolean = true
       )
   """))
   ```

---

### 10. Foreign Key Constraint Error Due to Missing Referenced Table

**Error Message:**
```
sqlalchemy.exc.OperationalError: (pymysql.err.OperationalError) 
(1215, 'Cannot add foreign key constraint')

OR

sqlalchemy.exc.IntegrityError: (pymysql.err.IntegrityError) 
(1452, 'Cannot add or update a child row: a foreign key constraint fails')
```

**Root Cause:**
A migration attempts to create a foreign key constraint to a table that doesn't exist yet in the database. This occurs when:
1. The referenced table is created in a migration that hasn't run yet
2. Migration dependencies are not properly specified
3. Migrations run in the wrong order

**Example Case - Migration 011:**
Migration `011_add_student_learning_path.py` creates a foreign key to `questions_bank` table:
```python
op.create_foreign_key(
    'fk_path_questions_question_id',
    'student_learning_path_questions', 'questions_bank',
    ['question_id'], ['id'],
    ondelete='CASCADE'
)
```

However, `questions_bank` is created in migration `006a_add_exam_platform_schema.py`. When migration 011 runs before 006a completes, the foreign key creation fails because the referenced table doesn't exist.

**How to Diagnose:**

1. **Identify the Missing Table:**
   ```sql
   -- Check if table exists
   SELECT table_name 
   FROM information_schema.tables 
   WHERE table_schema = 'your_database_name' 
     AND table_name = 'questions_bank';
   ```
   
   If this returns no rows, the table doesn't exist.

2. **Verify Foreign Key Column Types:**
   ```sql
   -- Check column types match
   SELECT column_name, data_type, is_nullable
   FROM information_schema.columns
   WHERE table_schema = 'your_database_name'
     AND table_name = 'student_learning_path_questions'
     AND column_name = 'question_id';
   
   SELECT column_name, data_type, is_nullable
   FROM information_schema.columns
   WHERE table_schema = 'your_database_name'
     AND table_name = 'questions_bank'
     AND column_name = 'id';
   ```
   
   Both columns should have matching types (e.g., both INTEGER).

3. **Check for Indexes on Referenced Columns:**
   ```sql
   -- MySQL: Check if primary key or unique index exists
   SELECT index_name, column_name
   FROM information_schema.statistics
   WHERE table_schema = 'your_database_name'
     AND table_name = 'questions_bank'
     AND column_name = 'id';
   ```
   
   The referenced column must have a PRIMARY KEY or UNIQUE constraint.

4. **Check Migration Order and Dependencies:**
   ```bash
   # View migration history
   alembic history
   
   # Check current migration state
   alembic current
   
   # Look for the migration that creates the referenced table
   grep -r "create_table.*questions_bank" alembic/versions/
   ```

**Resolution Steps:**

1. **Add Explicit Dependency:**
   
   Update the migration to explicitly depend on the migration that creates the referenced table:
   ```python
   # In 011_add_student_learning_path.py
   revision = '011'
   down_revision = '010'
   depends_on = ('006a',)  # Ensure 006a runs before this migration
   ```

2. **Add Defensive Check:**
   
   Add a check to verify the table exists before creating the foreign key:
   ```python
   def upgrade() -> None:
       conn = op.get_bind()
       
       # Check if referenced table exists
       result = conn.execute(sa.text("""
           SELECT COUNT(*) 
           FROM information_schema.tables 
           WHERE table_schema = DATABASE()
             AND table_name = 'questions_bank'
       """)).scalar()
       
       if result == 0:
           raise Exception(
               "Cannot create foreign key: questions_bank table does not exist. "
               "Ensure migration 006a runs before this migration."
           )
       
       # Proceed with foreign key creation
       op.create_foreign_key(
           'fk_path_questions_question_id',
           'student_learning_path_questions', 'questions_bank',
           ['question_id'], ['id'],
           ondelete='CASCADE'
       )
   ```

3. **Verify Column Type Compatibility:**
   
   Ensure the foreign key column and referenced column have the same type:
   ```python
   # In the migration creating the child table
   op.create_table(
       'student_learning_path_questions',
       sa.Column('id', sa.Integer(), nullable=False),
       sa.Column('question_id', sa.Integer(), nullable=False),  # Must match questions_bank.id
       # ... other columns
   )
   ```

4. **Test the Fix:**
   ```bash
   # Start fresh
   alembic downgrade base
   
   # Run all migrations
   alembic upgrade head
   
   # Verify foreign key was created
   mysql -e "SHOW CREATE TABLE student_learning_path_questions\G"
   ```

**Prevention Strategies:**

1. **Use `depends_on` for Cross-Branch Dependencies:**
   ```python
   # When migration B needs a table from migration A in a different branch
   revision = 'B'
   down_revision = 'previous_revision'
   depends_on = ('A',)  # Explicit dependency
   ```

2. **Document Table Creation in Migration Headers:**
   ```python
   """Add student learning path tables
   
   Revision ID: 011
   Revises: 010
   Depends on: 006a (requires questions_bank table)
   Create Date: 2024-01-20
   
   Tables created:
   - student_learning_paths
   - student_learning_path_questions (foreign key to questions_bank)
   """
   ```

3. **Add Table Existence Checks in Complex Migrations:**
   ```python
   def verify_prerequisites(conn, required_tables):
       """Verify all required tables exist before proceeding."""
       for table in required_tables:
           result = conn.execute(sa.text("""
               SELECT COUNT(*) 
               FROM information_schema.tables 
               WHERE table_schema = DATABASE()
                 AND table_name = :table
           """), {"table": table}).scalar()
           
           if result == 0:
               raise Exception(f"Required table '{table}' does not exist")
   
   def upgrade() -> None:
       conn = op.get_bind()
       verify_prerequisites(conn, ['questions_bank', 'students', 'institutions'])
       # ... proceed with migration
   ```

4. **Use Migration Testing Framework:**
   ```bash
   # Test migrations on fresh database
   ./run_migration_006a_diagnostic.ps1
   
   # Test specific migration
   python test_migration_011.py
   ```

**Similar Issues to Watch For:**

- Foreign keys to tables in feature branch migrations
- Foreign keys to tables created by parallel development efforts
- Cross-schema foreign keys (if using multiple schemas)
- Foreign keys to views instead of tables
- Circular foreign key dependencies between tables

---

## Resolution Steps by Issue Category

### Duplicate Revision IDs

**Step-by-Step Resolution:**

1. **Identify Duplicates:**
   ```bash
   python scripts/diagnose_migrations.py
   # Check output for duplicate revision IDs
   ```

2. **Choose Which to Rename:**
   - Keep the migration that was applied first
   - Rename the later migration(s)

3. **Update Revision ID:**
   ```python
   # In the migration file
   revision = '001'  # Old
   revision = '001a'  # New - make unique
   ```

4. **Update References:**
   - Find any migrations that reference the renamed revision
   - Update their down_revision field

5. **Create Bridge Migration (if needed):**
   ```bash
   alembic revision -m "fix_duplicate_revision_ids"
   ```

6. **Verify Chain:**
   ```bash
   alembic history
   alembic check
   ```

---

### Missing Tables

**Step-by-Step Resolution:**

1. **Identify Missing Tables:**
   ```python
   # Compare models to database
   from sqlalchemy import inspect
   inspector = inspect(engine)
   existing_tables = inspector.get_table_names()
   
   # Check if model tables exist
   if 'volunteer_hour_logs' not in existing_tables:
       print("Missing: volunteer_hour_logs")
   ```

2. **Create Migration:**
   ```bash
   alembic revision -m "add_missing_tables"
   ```

3. **Define Complete Table Structure:**
   ```python
   def upgrade() -> None:
       op.create_table(
           'volunteer_hour_logs',
           sa.Column('id', sa.Integer(), nullable=False),
           sa.Column('institution_id', sa.Integer(), nullable=False),
           sa.Column('parent_id', sa.Integer(), nullable=False),
           # ... all columns
           sa.PrimaryKeyConstraint('id')
       )
       
       # Add foreign keys
       op.create_foreign_key(...)
       
       # Add indexes
       op.create_index(...)
       
       # Enable RLS
       conn = op.get_bind()
       conn.execute(sa.text("ALTER TABLE ... ENABLE ROW LEVEL SECURITY"))
   ```

4. **Test Migration:**
   ```bash
   alembic upgrade head
   alembic downgrade -1
   alembic upgrade head
   ```

---

### Foreign Key Issues

**Step-by-Step Resolution:**

1. **Identify Missing or Broken Foreign Keys:**
   ```sql
   -- List all foreign keys
   SELECT tc.table_name, tc.constraint_name, kcu.column_name, 
          ccu.table_name AS foreign_table_name,
          ccu.column_name AS foreign_column_name
   FROM information_schema.table_constraints AS tc
   JOIN information_schema.key_column_usage AS kcu
     ON tc.constraint_name = kcu.constraint_name
   JOIN information_schema.constraint_column_usage AS ccu
     ON ccu.constraint_name = tc.constraint_name
   WHERE tc.constraint_type = 'FOREIGN KEY';
   ```

2. **Check for Orphaned Records:**
   ```sql
   SELECT COUNT(*) FROM child_table c
   LEFT JOIN parent_table p ON c.parent_id = p.id
   WHERE p.id IS NULL;
   ```

3. **Clean Orphaned Records (if necessary):**
   ```python
   # In migration
   conn = op.get_bind()
   conn.execute(sa.text("""
       DELETE FROM child_table
       WHERE parent_id NOT IN (SELECT id FROM parent_table)
   """))
   ```

4. **Add Foreign Key:**
   ```python
   op.create_foreign_key(
       'fk_child_table_parent_id',
       'child_table', 'parent_table',
       ['parent_id'], ['id'],
       ondelete='CASCADE'  # or SET NULL, RESTRICT
   )
   ```

5. **Add Index:**
   ```python
   op.create_index(
       'ix_child_table_parent_id',
       'child_table',
       ['parent_id']
   )
   ```

---

### Enum Type Issues

**Step-by-Step Resolution:**

1. **Check Existing Enum Types:**
   ```sql
   SELECT t.typname, e.enumlabel
   FROM pg_type t
   JOIN pg_enum e ON t.oid = e.enumtypid
   WHERE t.typname = 'verificationstatus'
   ORDER BY e.enumsortorder;
   ```

2. **Create Enum with Existence Check:**
   ```python
   def upgrade() -> None:
       conn = op.get_bind()
       
       # Check if enum exists
       result = conn.execute(sa.text("""
           SELECT EXISTS (
               SELECT 1 FROM pg_type WHERE typname = 'verificationstatus'
           )
       """)).scalar()
       
       if not result:
           op.execute("""
               CREATE TYPE verificationstatus AS ENUM (
                   'pending', 'verified', 'rejected'
               )
           """)
   ```

3. **Document Shared Enums:**
   ```python
   # Add comment in migration
   """
   Note: verificationstatus is shared between:
   - volunteer_hour_logs
   - service_activities
   """
   ```

4. **Handle Enum in Models:**
   ```python
   # If enum already exists in database
   from sqlalchemy import Enum
   
   status = Column(
       Enum('pending', 'verified', 'rejected', 
            name='verificationstatus', create_type=False),
       nullable=False
   )
   ```

---

### Schema Drift

**Step-by-Step Resolution:**

1. **Run Diagnostic:**
   ```bash
   python scripts/diagnose_migrations.py
   alembic check
   ```

2. **Compare Models to Database:**
   ```python
   from sqlalchemy import inspect
   from src.database import engine
   from src.models import Base
   
   inspector = inspect(engine)
   
   # Get model tables
   model_tables = set(Base.metadata.tables.keys())
   
   # Get database tables
   db_tables = set(inspector.get_table_names())
   
   missing_in_db = model_tables - db_tables
   extra_in_db = db_tables - model_tables
   ```

3. **Create Validation Migration:**
   ```bash
   alembic revision -m "validate_schema_consistency"
   ```

4. **Implement Checks:**
   ```python
   def upgrade() -> None:
       conn = op.get_bind()
       
       # Check and fix NOT NULL constraints
       # Check and add missing defaults
       # Check and create missing indexes
       # Detect orphaned records
   ```

---

## Lessons Learned

### 1. Always Use Unique Revision IDs
**Problem:** Numeric IDs like `001`, `014`, `015` were reused.

**Lesson:** Use descriptive, unique identifiers or include timestamp/hash.

**Solution:**
```python
# Bad
revision = '001'

# Better
revision = '001_create_multi_tenant_schema'

# Best
revision = '20240120_001_create_multi_tenant_schema'
```

---

### 2. Create Migrations for ALL Model Changes
**Problem:** Models created without migrations led to runtime errors.

**Lesson:** Every model change requires a migration, no exceptions.

**Process:**
1. Change model
2. Create migration: `alembic revision --autogenerate -m "description"`
3. Review generated migration
4. Test upgrade and downgrade
5. Commit both model and migration together

---

### 3. Test Both Upgrade and Downgrade
**Problem:** Migrations worked forward but failed on rollback.

**Lesson:** Always test both directions.

**Testing:**
```bash
# Test upgrade
alembic upgrade head

# Test downgrade
alembic downgrade -1

# Test re-upgrade
alembic upgrade head

# Verify data integrity
python scripts/migration_test/verify_data_integrity.py
```

---

### 4. Index ALL Foreign Keys
**Problem:** Performance issues with unindexed foreign keys.

**Lesson:** Every foreign key needs an index.

**Rule:**
```python
# When you create a foreign key
op.create_foreign_key(...)

# Always create an index
op.create_index(
    f'ix_{table}_{column}',
    table,
    [column]
)
```

---

### 5. Check for Existence Before Creating
**Problem:** Migrations failed when re-run or applied out of order.

**Lesson:** Make migrations idempotent with existence checks.

**Pattern:**
```python
def upgrade() -> None:
    conn = op.get_bind()
    
    # Check table exists
    table_exists = conn.execute(sa.text("""
        SELECT EXISTS (
            SELECT 1 FROM information_schema.tables 
            WHERE table_name = 'my_table'
        )
    """)).scalar()
    
    if not table_exists:
        op.create_table(...)
```

---

### 6. Document Shared Resources
**Problem:** Multiple migrations tried to create the same enum.

**Lesson:** Document and coordinate shared database objects.

**Solution:**
- Create document listing shared enums, functions, types
- Reference document in related migrations
- Use existence checks

---

### 7. Enable RLS from the Start
**Problem:** New tables created without RLS broke multi-tenant isolation.

**Lesson:** RLS must be part of initial table creation.

**Template:**
```python
def upgrade() -> None:
    # Create table
    op.create_table(...)
    
    # Enable RLS
    conn = op.get_bind()
    conn.execute(sa.text("ALTER TABLE my_table ENABLE ROW LEVEL SECURITY"))
    
    # Create policy
    conn.execute(sa.text("""
        CREATE POLICY my_table_isolation_policy ON my_table
        USING (
            institution_id = current_setting('app.current_institution_id', true)::integer
            OR current_setting('app.bypass_rls', true)::boolean = true
        )
    """))
```

---

### 8. Use Transaction Wrappers
**Problem:** Failed migrations left database in inconsistent state.

**Lesson:** Wrap migrations in transactions for automatic rollback.

**Solution:**
```python
from alembic.migration_utils import migration_transaction

def upgrade() -> None:
    with migration_transaction("my_migration"):
        # All operations here
        # Automatically rolled back on error
```

---

### 9. Monitor Migration Performance
**Problem:** No visibility into migration execution time or failures.

**Lesson:** Track metrics for all migrations.

**Solution:**
- Implemented migration monitoring system
- Track duration, success/failure, errors
- Alert on failures
- Review slow migrations

---

### 10. Maintain Comprehensive Documentation
**Problem:** Difficult to understand migration history and dependencies.

**Lesson:** Document migrations as you create them.

**What to Document:**
- Purpose of migration
- Dependencies and prerequisites
- Data migration strategy
- Rollback considerations
- Performance impact
- Testing approach

---

## Prevention Strategies

### 1. Use Migration Naming Convention

**Standard Format:**
```
NNN_descriptive_name_in_snake_case.py
```

**Examples:**
- `043_add_notification_preferences.py`
- `044_create_assignment_rubric_tables.py`
- `045_add_user_timezone_support.py`

**Rules:**
- Use sequential numbers (001, 002, 003)
- Include clear description
- Use snake_case
- Be specific, not generic

See: [docs/MIGRATION_NAMING_CONVENTION.md](MIGRATION_NAMING_CONVENTION.md)

---

### 2. Pre-Migration Checklist

**Before creating a migration:**

- [ ] Model changes are complete and tested
- [ ] Migration name follows convention
- [ ] Revision ID is unique
- [ ] down_revision references correct parent
- [ ] All foreign keys have corresponding indexes
- [ ] RLS policies included for multi-tenant tables
- [ ] Enums have existence checks
- [ ] upgrade() is idempotent
- [ ] downgrade() preserves data where possible
- [ ] Migration includes transaction wrapper

---

### 3. Post-Migration Checklist

**After creating a migration:**

- [ ] Tested upgrade: `alembic upgrade head`
- [ ] Tested downgrade: `alembic downgrade -1`
- [ ] Tested re-upgrade: `alembic upgrade head`
- [ ] Verified data integrity
- [ ] Checked query performance
- [ ] Reviewed generated SQL: `alembic upgrade head --sql`
- [ ] Documented any special considerations
- [ ] Updated related documentation
- [ ] Committed model and migration together

---

### 4. Code Review Requirements

**Migration reviews must verify:**

1. **Correctness:**
   - Creates intended schema changes
   - Handles data migration safely
   - Preserves data on downgrade

2. **Safety:**
   - Uses transactions
   - Has existence checks
   - Won't cause downtime
   - Handles edge cases

3. **Performance:**
   - Indexes on foreign keys
   - Efficient data migration
   - No full table scans on large tables

4. **Multi-tenancy:**
   - RLS enabled
   - Isolation policies created
   - Institution ID in all tables

5. **Reversibility:**
   - downgrade() implemented
   - Data preservation strategy
   - Tested rollback

---

### 5. CI/CD Integration

**Automated Checks:**

```yaml
# .github/workflows/migration-check.yml
name: Migration Check

on: [pull_request]

jobs:
  check-migrations:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v2
      
      - name: Setup Python
        uses: actions/setup-python@v2
        
      - name: Install dependencies
        run: pip install -r requirements.txt
        
      - name: Check migration chain
        run: python scripts/diagnose_migrations.py
        
      - name: Check for pending migrations
        run: alembic check
        
      - name: Test upgrade
        run: alembic upgrade head
        
      - name: Verify data integrity
        run: python scripts/migration_test/verify_data_integrity.py
```

---

### 6. Development Workflow

**Recommended Process:**

1. **Local Development:**
   ```bash
   # Make model changes
   vim src/models/my_model.py
   
   # Generate migration
   alembic revision --autogenerate -m "add_my_feature"
   
   # Review and edit migration
   vim alembic/versions/NNN_add_my_feature.py
   
   # Test locally
   alembic upgrade head
   python scripts/migration_test/test_rollback.py --migration NNN
   
   # Commit together
   git add src/models/my_model.py alembic/versions/NNN_add_my_feature.py
   git commit -m "Add my feature with migration"
   ```

2. **Staging Deployment:**
   ```bash
   # Deploy to staging
   ./scripts/deployment/deploy.sh staging
   
   # Monitor for issues
   curl http://staging.example.com/api/v1/migrations/health
   
   # Check metrics
   curl http://staging.example.com/api/v1/migrations/recent
   ```

3. **Production Deployment:**
   ```bash
   # Schedule maintenance window
   # Create backup (automated)
   ./scripts/deployment/deploy.sh prod
   
   # Monitor
   tail -f /var/log/app/migration.log
   
   # Verify
   curl http://api.example.com/api/v1/migrations/status
   ```

---

## Handling Future Migration Conflicts

### Merge Conflicts in Migration Chain

**Scenario:** Two developers create migrations simultaneously.

**Problem:**
```
Branch A: 042 -> 043_feature_a
Branch B: 042 -> 043_feature_b
```

**Resolution:**

1. **Detect Conflict:**
   ```bash
   git merge feature-branch
   # CONFLICT in alembic/versions/
   ```

2. **Rename One Migration:**
   ```bash
   # Rename to next available number
   mv 043_feature_b.py 044_feature_b.py
   ```

3. **Update Revision IDs:**
   ```python
   # In 044_feature_b.py
   revision = '044'  # Was 043
   down_revision = '043'  # Point to feature_a
   ```

4. **Test Chain:**
   ```bash
   alembic history
   alembic upgrade head
   ```

---

### Conflicting Schema Changes

**Scenario:** Two migrations modify the same table differently.

**Resolution:**

1. **Identify Conflict:**
   - Review both migrations
   - Determine if changes are compatible

2. **If Compatible:**
   - Keep both migrations
   - Ensure proper ordering
   - Test combined result

3. **If Incompatible:**
   - Coordinate with team
   - Merge into single migration
   - Update both branches

---

### Long-Running Migration Branches

**Problem:** Feature branch with many commits, migrations out of date.

**Solution:**

1. **Rebase onto Latest:**
   ```bash
   git checkout feature-branch
   git fetch origin
   git rebase origin/main
   ```

2. **Resolve Migration Conflicts:**
   - Renumber migrations as needed
   - Update down_revision references
   - Test migration chain

3. **Verify:**
   ```bash
   alembic upgrade head
   python scripts/migration_test/test_rollback.py --count 5
   ```

---

## Safe Migration Practices

### Testing Strategy

#### 1. Local Testing
```bash
# Fresh database test
docker-compose down -v
docker-compose up -d db
alembic upgrade head

# Test rollback
alembic downgrade -1
alembic upgrade head

# Data integrity
python scripts/migration_test/verify_data_integrity.py
```

#### 2. Staging Testing
```bash
# Deploy to staging
./scripts/deployment/deploy.sh staging

# Load test data
python scripts/load_test_data.py

# Run application tests
pytest tests/

# Performance testing
python scripts/performance_test.py
```

#### 3. Production Testing
```bash
# Use blue-green deployment
# Apply migrations to secondary environment
# Test application with new schema
# Switch traffic to new environment
```

---

### Backup Procedures

#### Before Every Production Migration

**Automated Backups (in deploy.sh):**
```bash
# RDS Snapshot
aws rds create-db-snapshot \
    --db-instance-identifier $DB_INSTANCE \
    --db-snapshot-identifier pre-migration-$(date +%Y%m%d-%H%M%S)

# Logical Backup
mysqldump -h ${DB_HOST} -u ${DB_USER} -p \
  --single-transaction --routines --triggers \
  edu_platform_prod | gzip > backup_$(date +%Y%m%d-%H%M%S).sql.gz

# Upload to S3
aws s3 cp backup_*.sql.gz s3://$BACKUP_BUCKET/migrations/
```

**Manual Backup:**
```bash
# Full backup
mysqldump -h ${DB_HOST} -u ${DB_USER} -p \
  --single-transaction --routines --triggers \
  edu_platform_prod > backup.sql

# Schema only
mysqldump -h ${DB_HOST} -u ${DB_USER} -p \
  --no-data --routines --triggers \
  edu_platform_prod > schema.sql

# Data only
mysqldump -h ${DB_HOST} -u ${DB_USER} -p \
  --no-create-info \
  edu_platform_prod > data.sql
```

---

### Rollback Procedures

#### Scenario 1: Migration Fails During Upgrade

**Automatic Rollback:**
```python
# Transactions automatically rollback on error
with migration_transaction("migration_name"):
    # Operations here
    # Error occurs
# Automatic rollback
```

**Manual Rollback:**
```bash
# If migration partially completed
alembic downgrade -1

# If that fails, restore from backup
./scripts/deployment/restore_backup.sh prod latest
```

---

#### Scenario 2: Migration Succeeds but Application Breaks

**Steps:**

1. **Assess Impact:**
   ```bash
   # Check application logs
   tail -f /var/log/app/error.log
   
   # Check migration status
   curl http://api.example.com/api/v1/migrations/health
   ```

2. **Attempt Downgrade:**
   ```bash
   # Downgrade migration
   alembic downgrade -1
   
   # Restart application
   systemctl restart app
   
   # Verify
   curl http://api.example.com/health
   ```

3. **If Downgrade Fails:**
   ```bash
   # Restore from backup
   ./scripts/deployment/restore_backup.sh prod latest
   ```

---

#### Scenario 3: Data Corruption Detected

**Emergency Procedure:**

1. **Stop Application:**
   ```bash
   systemctl stop app
   ```

2. **Assess Damage:**
   ```sql
   -- Check for orphaned records
   SELECT COUNT(*) FROM child_table c
   LEFT JOIN parent_table p ON c.parent_id = p.id
   WHERE p.id IS NULL;
   
   -- Check data integrity
   SELECT * FROM table WHERE invalid_condition;
   ```

3. **Restore from Backup:**
   ```bash
   ./scripts/deployment/restore_backup.sh prod latest
   ```

4. **Verify Restoration:**
   ```bash
   # Check data
   psql -c "SELECT COUNT(*) FROM users;"
   
   # Check migration version
   alembic current
   ```

5. **Restart Application:**
   ```bash
   systemctl start app
   ```

---

### Zero-Downtime Migration Strategies

#### For Large Tables

**Strategy: Multi-Phase Migration**

**Phase 1: Add New Column (nullable)**
```python
def upgrade() -> None:
    op.add_column('large_table', 
        sa.Column('new_column', sa.String(255), nullable=True)
    )
```

**Phase 2: Backfill Data (background job)**
```python
# In application code
UPDATE large_table SET new_column = old_column WHERE new_column IS NULL LIMIT 1000;
```

**Phase 3: Make Column NOT NULL**
```python
def upgrade() -> None:
    op.alter_column('large_table', 'new_column', nullable=False)
```

**Phase 4: Drop Old Column**
```python
def upgrade() -> None:
    op.drop_column('large_table', 'old_column')
```

---

#### For Table Renames

**Don't rename tables directly in production!**

**Instead:**

1. Create new table
2. Use database triggers or application logic to sync data
3. Switch application to use new table
4. Drop old table in later migration

---

## Emergency Recovery Procedures

### Recovery Decision Tree

```
Migration Issue Detected
│
├─ Is application still running?
│  │
│  ├─ YES: Monitor, may not need action
│  │
│  └─ NO: Proceed to recovery
│
├─ Can you downgrade the migration?
│  │
│  ├─ YES: Run `alembic downgrade -1`
│  │     └─ Success? Resume normal operations
│  │     └─ Failure? Proceed to backup restore
│  │
│  └─ NO: Proceed to backup restore
│
└─ Restore from backup
   │
   ├─ Recent backup available?
   │  │
   │  ├─ YES: Run restore script
   │  └─ NO: Restore from older backup, data loss likely
   │
   └─ After restore: Investigate root cause
```

---

### Emergency Contacts

**Database Team:**
- Primary: DBA on-call (check rotation)
- Secondary: Engineering Lead
- Escalation: CTO

**Communication Channels:**
- Slack: #incidents
- Email: incidents@company.com
- Phone: Emergency hotline

---

### Emergency Commands

**Quick Status Check:**
```bash
# Database connection
psql $DATABASE_URL -c "SELECT 1"

# Migration status
alembic current

# Application health
curl http://api.example.com/health

# Recent errors
tail -n 100 /var/log/app/error.log | grep -i "migration\|database"
```

**Emergency Rollback:**
```bash
# Option 1: Downgrade migration
alembic downgrade -1

# Option 2: Restore from backup (production)
./scripts/deployment/restore_backup.sh prod latest

# Option 3: Restore from backup (staging)
./scripts/deployment/restore_backup.sh staging latest
```

**Emergency Checks:**
```bash
# Orphaned records
python scripts/migration_test/verify_data_integrity.py --verbose

# Schema consistency
alembic check

# Migration history
alembic history | tail -20
```

---

### Post-Incident Procedures

After resolving a migration issue:

1. **Document Incident:**
   - What happened
   - What was the impact
   - How it was resolved
   - Time to resolution

2. **Root Cause Analysis:**
   - Why did the issue occur
   - What could have prevented it
   - What detection methods failed

3. **Update Procedures:**
   - Update this document with new scenarios
   - Update runbooks
   - Add new automated checks

4. **Team Communication:**
   - Share lessons learned
   - Update training materials
   - Review and improve processes

---

## Quick Reference Checklist

### Creating a New Migration

```
□ Follow naming convention: NNN_descriptive_name.py
□ Use unique revision ID
□ Reference correct parent in down_revision
□ Add foreign keys with appropriate CASCADE/SET NULL
□ Create indexes on all foreign key columns
□ Check for enum existence before creating
□ Enable RLS on multi-tenant tables
□ Create RLS isolation policies
□ Use transaction wrapper
□ Implement complete downgrade()
□ Test upgrade locally
□ Test downgrade locally
□ Verify data integrity
□ Review SQL output: alembic upgrade head --sql
□ Document special considerations
□ Commit model and migration together
```

---

### Before Production Deployment

```
□ All tests passing in CI/CD
□ Staging deployment successful
□ Migration tested on staging data
□ Performance impact assessed
□ Rollback plan documented
□ Backup scheduled/verified
□ Maintenance window scheduled (if needed)
□ Team notified of deployment
□ Monitoring alerts configured
□ Rollback script tested
□ Communication plan ready
□ Emergency contacts available
```

---

### After Production Deployment

```
□ Migration completed successfully
□ Application started without errors
□ Health checks passing
□ Migration status verified
□ Data integrity verified
□ Performance metrics normal
□ No error spikes in logs
□ User-facing features working
□ Team notified of success
□ Documentation updated (if needed)
□ Backup can be cleaned up (after retention period)
```

---

### Emergency Response

```
□ Assess severity and impact
□ Stop application if necessary
□ Notify team immediately
□ Follow recovery decision tree
□ Attempt downgrade if safe
□ Restore from backup if needed
□ Verify restoration
□ Resume normal operations
□ Document incident
□ Perform root cause analysis
□ Update procedures
□ Communicate lessons learned
```

---

## Additional Resources

### Related Documentation
- [Migration Safety System](MIGRATION_SAFETY_SYSTEM.md) - Complete safety system overview
- [Migration Rollback Playbook](MIGRATION_ROLLBACK_PLAYBOOK.md) - Detailed rollback procedures
- [Migration Naming Convention](MIGRATION_NAMING_CONVENTION.md) - Naming standards
- [Migration Quick Reference](MIGRATION_QUICK_REFERENCE.md) - Command and code reference

### Tools and Scripts
- `scripts/diagnose_migrations.py` - Migration chain diagnostic tool
- `scripts/migration_test/test_rollback.py` - Rollback testing framework
- `scripts/migration_test/verify_data_integrity.py` - Data integrity verification
- `scripts/deployment/deploy.sh` - Deployment script with backups
- `scripts/deployment/restore_backup.sh` - Backup restoration script

### API Endpoints
- `GET /api/v1/migrations/status` - Check migration status
- `GET /api/v1/migrations/health` - Overall migration health
- `GET /api/v1/migrations/recent` - Recent executions
- `GET /api/v1/migrations/failed` - Failed migrations
- `GET /api/v1/migrations/slow` - Slow migrations

---

## Document History

| Date | Version | Author | Changes |
|------|---------|--------|---------|
| 2024-01-20 | 1.0 | System | Initial creation with comprehensive troubleshooting guide |
| 2024-01-20 | 1.1 | System | Added section 10: Foreign Key Constraint Error Due to Missing Referenced Table - documents migration 011 fix with diagnostic steps and prevention strategies |

---

**For urgent issues, refer to the [Emergency Recovery Procedures](#emergency-recovery-procedures) section first.**
