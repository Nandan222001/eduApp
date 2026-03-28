# Migration Naming Convention

This document defines the naming conventions and best practices for database migrations in this project.

## Naming Convention

All migration files should follow this format:

```
{sequence_number}_{descriptive_name}.py
```

### Sequence Number

- Use a 3-digit zero-padded sequence number (e.g., `001`, `002`, `041`)
- Sequence numbers should be incremental and unique
- Start from `001` for the initial migration
- Use the next available number for new migrations

### Descriptive Name

- Use lowercase with underscores (snake_case)
- Be descriptive but concise
- Start with a verb that describes the operation
- Use clear, meaningful names that explain what the migration does

### Examples

#### Good Names ✅

```
001_create_multi_tenant_schema.py
002_seed_permissions_and_roles.py
003_add_user_authentication.py
004_create_subscription_billing_tables.py
015_add_ml_training_config.py
040_schema_drift_detection.py
041_add_migration_metrics_table.py
```

#### Bad Names ❌

```
migration1.py                    # Not descriptive
new_changes.py                   # Too vague
UpdateUsers.py                   # Wrong case
my_migration_20240120.py        # Includes date (redundant)
```

## Revision IDs

In the migration file itself, use the sequence number as the revision ID:

```python
"""add user authentication tables

Revision ID: 003
Revises: 002
Create Date: 2024-01-20 10:00:00.000000
"""

revision = '003'
down_revision = '002'
```

## Migration Categories

Use these prefixes to categorize migrations:

### 1. Schema Initialization
- `create_` - Creating new tables or schemas
- Example: `001_create_multi_tenant_schema.py`

### 2. Data Seeding
- `seed_` - Adding initial or reference data
- Example: `002_seed_permissions_and_roles.py`

### 3. Feature Addition
- `add_` - Adding new columns, tables, or features
- Example: `037_add_volunteer_hours_tables.py`

### 4. Schema Updates
- `update_` - Modifying existing structures
- `enhance_` - Improving existing features
- Example: `035_enhance_wellbeing_conferences_roi.py`

### 5. Fixes and Corrections
- `fix_` - Fixing errors or issues
- Example: `036_fix_duplicate_revision_ids.py`

### 6. Maintenance
- `validate_` - Validation operations
- `cleanup_` - Removing unused structures
- Example: `039_validate_schema_consistency.py`

## Migration File Structure

Every migration file should include:

### 1. Docstring with Metadata

```python
"""descriptive title

Revision ID: 041
Revises: 040
Create Date: 2024-01-20 10:00:00.000000

Detailed description of what this migration does:
- Point 1
- Point 2
- Point 3
"""
```

### 2. Required Imports

```python
from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import mysql
```

### 3. Revision Variables

```python
revision = '041'
down_revision = '040'
branch_labels = None
depends_on = None
```

### 4. Upgrade Function

```python
def upgrade() -> None:
    """Apply schema changes."""
    # Implementation with safety checks
    pass
```

### 5. Downgrade Function

```python
def downgrade() -> None:
    """Rollback schema changes."""
    # Implementation with data preservation
    pass
```

## Safety Best Practices

### 1. Always Include Existence Checks

```python
conn = op.get_bind()

# Check if table exists before creating
table_exists = conn.execute(sa.text("""
    SELECT EXISTS (
        SELECT 1 FROM information_schema.tables 
        WHERE table_name = 'my_table'
    )
""")).scalar()

if not table_exists:
    op.create_table('my_table', ...)
```

### 2. Use Transaction Wrapping

```python
from alembic.migration_utils import migration_transaction

def upgrade() -> None:
    with migration_transaction("041_add_feature"):
        op.create_table(...)
        op.create_index(...)
```

### 3. Add Duration Tracking

```python
from alembic.migration_utils import track_migration_duration

@track_migration_duration("041_add_feature")
def upgrade() -> None:
    # Migration operations
    pass
```

### 4. Implement Safe Downgrades

```python
def downgrade() -> None:
    """
    Rollback schema changes.
    
    WARNING: This operation will result in data loss.
    """
    conn = op.get_bind()
    
    # Check if table exists before dropping
    table_exists = conn.execute(sa.text("""
        SELECT EXISTS (
            SELECT 1 FROM information_schema.tables 
            WHERE table_name = 'my_table'
        )
    """)).scalar()
    
    if table_exists:
        print("WARNING: Dropping table will lose data")
        op.drop_table('my_table')
```

### 5. Handle NULL Data Before NOT NULL Constraints

```python
# Check for NULL values
null_count = conn.execute(sa.text("""
    SELECT COUNT(*) FROM my_table 
    WHERE my_column IS NULL
""")).scalar()

if null_count > 0:
    # Update NULL values first
    op.execute("UPDATE my_table SET my_column = 'default' WHERE my_column IS NULL")

# Now safe to add NOT NULL constraint
op.alter_column('my_table', 'my_column', nullable=False)
```

## Workflow

### Creating a New Migration

1. **Determine the next sequence number**
   ```bash
   # List existing migrations
   ls alembic/versions/ | grep -E "^[0-9]{3}_" | sort | tail -1
   ```

2. **Create the migration file**
   ```bash
   # Manual creation with proper naming
   touch alembic/versions/042_add_new_feature.py
   ```

3. **Copy from template**
   ```python
   # Use TEMPLATE_autogenerated_migration.py as reference
   cp alembic/versions/TEMPLATE_autogenerated_migration.py alembic/versions/042_add_new_feature.py
   ```

4. **Update metadata**
   - Set correct revision IDs
   - Write descriptive docstring
   - Implement upgrade() and downgrade()

5. **Test the migration**
   ```bash
   # Test upgrade
   alembic upgrade 042
   
   # Test rollback
   python scripts/migration_test/test_rollback.py --migration 042
   
   # Test downgrade
   alembic downgrade -1
   
   # Test re-upgrade
   alembic upgrade head
   ```

### Before Committing

1. Run rollback tests
2. Verify idempotency (can run multiple times safely)
3. Check for data loss warnings
4. Update documentation if needed
5. Add to migration changelog

## Common Patterns

### Creating a Table with Foreign Keys

```python
def upgrade() -> None:
    conn = op.get_bind()
    
    if not check_table_exists('my_table'):
        op.create_table(
            'my_table',
            sa.Column('id', sa.Integer(), nullable=False),
            sa.Column('institution_id', sa.Integer(), nullable=False),
            sa.Column('name', sa.String(255), nullable=False),
            sa.Column('created_at', sa.DateTime(), server_default=sa.text('NOW()')),
            sa.PrimaryKeyConstraint('id'),
            sa.ForeignKeyConstraint(
                ['institution_id'], 
                ['institutions.id'], 
                ondelete='CASCADE'
            )
        )
        
        # Create index on foreign key
        op.create_index(
            'ix_my_table_institution_id',
            'my_table',
            ['institution_id']
        )
```

### Adding a Column with Default Value

```python
def upgrade() -> None:
    conn = op.get_bind()
    
    if check_table_exists('my_table') and not check_column_exists('my_table', 'new_column'):
        # Add column as nullable first
        op.add_column('my_table', sa.Column('new_column', sa.String(100), nullable=True))
        
        # Populate existing rows
        op.execute("UPDATE my_table SET new_column = 'default' WHERE new_column IS NULL")
        
        # Make NOT NULL
        op.alter_column('my_table', 'new_column', nullable=False)
```

### Creating Enum Types

```python
def upgrade() -> None:
    conn = op.get_bind()
    
    enum_name = 'status_enum'
    enum_exists = conn.execute(sa.text(
        f"SELECT EXISTS (SELECT 1 FROM pg_type WHERE typname = '{enum_name}')"
    )).scalar()
    
    if not enum_exists:
        op.execute(f"CREATE TYPE {enum_name} AS ENUM ('pending', 'approved', 'rejected')")
```

## Version Control

### Git Commit Messages

Use descriptive commit messages for migrations:

```
migration: add volunteer hours tracking tables (041)

- Creates volunteer_hour_logs table
- Creates volunteer_hour_summaries table
- Adds indexes for performance
- Includes rollback support
```

### Merge Conflicts

If you encounter a merge conflict in migration sequence numbers:

1. Renumber your migration to the next available number
2. Update the revision ID in the file
3. Update the down_revision to point to the correct parent
4. Test the migration thoroughly

## Testing Requirements

Before deploying any migration to production:

1. ✅ Test upgrade on development database
2. ✅ Test downgrade (rollback)
3. ✅ Test re-upgrade (idempotency)
4. ✅ Verify data integrity
5. ✅ Run automated rollback tests
6. ✅ Review with team
7. ✅ Create database backup
8. ✅ Document any manual steps

## Emergency Rollback

If a migration fails in production:

1. Check the error in migration_execution_metrics table
2. Refer to the MIGRATION_ROLLBACK_PLAYBOOK.md
3. Execute rollback plan
4. Restore from backup if necessary
5. Fix migration and re-test
6. Deploy corrected version

## Resources

- [Alembic Documentation](https://alembic.sqlalchemy.org/)
- [Migration Template](../alembic/versions/TEMPLATE_autogenerated_migration.py)
- [Rollback Playbook](./MIGRATION_ROLLBACK_PLAYBOOK.md)
- [Migration Utils](../alembic/migration_utils.py)
