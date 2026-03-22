"""example safe migration with all best practices

Revision ID: 042
Revises: 041
Create Date: 2024-01-20 11:00:00.000000

This is an example migration demonstrating all safety best practices:
- Transaction wrapping
- Duration tracking
- Existence checks
- Safe rollback
- Proper error handling
"""
from alembic import op
import sqlalchemy as sa
from alembic.migration_utils import migration_transaction, track_migration_duration

revision = '042'
down_revision = '041'
branch_labels = None
depends_on = None


@track_migration_duration("042_example_safe_migration")
def upgrade() -> None:
    """
    Apply schema changes with full safety measures.
    
    This example demonstrates:
    - Transaction wrapping for atomicity
    - Existence checks before operations
    - Duration tracking for monitoring
    - Safe constraint additions
    """
    # Use transaction wrapper for atomicity
    # If any operation fails, all changes are rolled back
    with migration_transaction("042_example_safe_migration"):
        conn = op.get_bind()
        
        # ===================================================================
        # Example 1: Create table with safety checks
        # ===================================================================
        
        table_name = 'example_safe_table'
        table_exists = conn.execute(sa.text("""
            SELECT EXISTS (
                SELECT 1 FROM information_schema.tables 
                WHERE table_name = :table_name
            )
        """), {'table_name': table_name}).scalar()
        
        if not table_exists:
            op.create_table(
                table_name,
                sa.Column('id', sa.Integer(), nullable=False),
                sa.Column('institution_id', sa.Integer(), nullable=False),
                sa.Column('name', sa.String(length=255), nullable=False),
                sa.Column('description', sa.Text(), nullable=True),
                sa.Column('status', sa.String(length=50), nullable=False, 
                         server_default='active'),
                sa.Column('count', sa.Integer(), nullable=False, 
                         server_default='0'),
                sa.Column('created_at', sa.DateTime(), nullable=False, 
                         server_default=sa.text('NOW()')),
                sa.Column('updated_at', sa.DateTime(), nullable=True),
                sa.PrimaryKeyConstraint('id')
            )
            
            # Add foreign key
            op.create_foreign_key(
                'fk_example_safe_table_institution',
                table_name,
                'institutions',
                ['institution_id'],
                ['id'],
                ondelete='CASCADE'
            )
            
            # Create indexes
            op.create_index(
                'ix_example_safe_table_institution_id',
                table_name,
                ['institution_id']
            )
            
            op.create_index(
                'ix_example_safe_table_status',
                table_name,
                ['status']
            )
            
            # Enable RLS
            op.execute(f"ALTER TABLE {table_name} ENABLE ROW LEVEL SECURITY")
            
            # Create RLS policy
            op.execute(f"""
                CREATE POLICY {table_name}_isolation_policy ON {table_name}
                USING (
                    institution_id = current_setting('app.current_institution_id', true)::integer
                    OR current_setting('app.bypass_rls', true)::boolean = true
                )
            """)
            
            print(f"✓ Created table: {table_name}")
        else:
            print(f"✓ Table already exists: {table_name}")
        
        # ===================================================================
        # Example 2: Add column to existing table with data migration
        # ===================================================================
        
        target_table = 'institutions'
        new_column = 'example_feature_enabled'
        
        column_exists = conn.execute(sa.text("""
            SELECT EXISTS (
                SELECT 1 FROM information_schema.columns 
                WHERE table_name = :table_name 
                AND column_name = :column_name
            )
        """), {
            'table_name': target_table,
            'column_name': new_column
        }).scalar()
        
        if not column_exists:
            # Add column as nullable first
            op.add_column(
                target_table,
                sa.Column(new_column, sa.Boolean(), nullable=True)
            )
            
            # Set default value for existing rows
            op.execute(f"""
                UPDATE {target_table} 
                SET {new_column} = false 
                WHERE {new_column} IS NULL
            """)
            
            # Now make it NOT NULL with default
            op.alter_column(
                target_table,
                new_column,
                nullable=False,
                server_default=sa.text('false')
            )
            
            print(f"✓ Added column: {target_table}.{new_column}")
        else:
            print(f"✓ Column already exists: {target_table}.{new_column}")
        
        # ===================================================================
        # Example 3: Create enum type safely
        # ===================================================================
        
        enum_name = 'example_status_enum'
        enum_exists = conn.execute(sa.text("""
            SELECT EXISTS (
                SELECT 1 FROM pg_type WHERE typname = :enum_name
            )
        """), {'enum_name': enum_name}).scalar()
        
        if not enum_exists:
            op.execute(f"""
                CREATE TYPE {enum_name} AS ENUM (
                    'pending', 'active', 'inactive', 'archived'
                )
            """)
            print(f"✓ Created enum type: {enum_name}")
        else:
            print(f"✓ Enum type already exists: {enum_name}")
        
        # ===================================================================
        # Example 4: Add unique constraint with duplicate check
        # ===================================================================
        
        constraint_name = 'uq_example_safe_table_name_institution'
        constraint_exists = conn.execute(sa.text("""
            SELECT EXISTS (
                SELECT 1 FROM information_schema.table_constraints 
                WHERE constraint_name = :constraint_name
            )
        """), {'constraint_name': constraint_name}).scalar()
        
        if not constraint_exists and table_exists:
            # Check for duplicates first
            duplicates = conn.execute(sa.text(f"""
                SELECT institution_id, name, COUNT(*) as cnt
                FROM {table_name} 
                GROUP BY institution_id, name 
                HAVING COUNT(*) > 1
            """)).fetchall()
            
            if duplicates:
                print(f"⚠ WARNING: Found {len(duplicates)} duplicate records")
                print(f"  Deduplicating before adding constraint...")
                
                # Keep first occurrence, delete others
                op.execute(f"""
                    DELETE FROM {table_name} a
                    USING {table_name} b
                    WHERE a.id > b.id
                    AND a.institution_id = b.institution_id
                    AND a.name = b.name
                """)
            
            # Now safe to add unique constraint
            op.create_unique_constraint(
                constraint_name,
                table_name,
                ['institution_id', 'name']
            )
            
            print(f"✓ Created unique constraint: {constraint_name}")
        else:
            if constraint_exists:
                print(f"✓ Unique constraint already exists: {constraint_name}")
        
        # ===================================================================
        # Example 5: Performance optimization - add composite index
        # ===================================================================
        
        index_name = 'ix_example_safe_table_composite'
        index_exists = conn.execute(sa.text("""
            SELECT EXISTS (
                SELECT 1 FROM pg_indexes 
                WHERE indexname = :index_name
            )
        """), {'index_name': index_name}).scalar()
        
        if not index_exists and table_exists:
            op.create_index(
                index_name,
                table_name,
                ['institution_id', 'status', 'created_at']
            )
            print(f"✓ Created composite index: {index_name}")
        else:
            if index_exists:
                print(f"✓ Composite index already exists: {index_name}")
        
        print("\n✅ Migration 042 completed successfully")


def downgrade() -> None:
    """
    Safely rollback schema changes.
    
    This demonstrates:
    - Safe removal of constraints
    - Safe removal of indexes
    - Safe table drops with data loss warnings
    """
    with migration_transaction("042_example_safe_migration_downgrade"):
        conn = op.get_bind()
        
        table_name = 'example_safe_table'
        
        # Drop composite index
        index_name = 'ix_example_safe_table_composite'
        index_exists = conn.execute(sa.text("""
            SELECT EXISTS (
                SELECT 1 FROM pg_indexes 
                WHERE indexname = :index_name
            )
        """), {'index_name': index_name}).scalar()
        
        if index_exists:
            op.drop_index(index_name, table_name=table_name)
            print(f"✓ Dropped index: {index_name}")
        
        # Drop unique constraint
        constraint_name = 'uq_example_safe_table_name_institution'
        constraint_exists = conn.execute(sa.text("""
            SELECT EXISTS (
                SELECT 1 FROM information_schema.table_constraints 
                WHERE constraint_name = :constraint_name
            )
        """), {'constraint_name': constraint_name}).scalar()
        
        if constraint_exists:
            op.drop_constraint(constraint_name, table_name, type_='unique')
            print(f"✓ Dropped unique constraint: {constraint_name}")
        
        # Drop RLS policy
        policy_name = f"{table_name}_isolation_policy"
        policy_exists = conn.execute(sa.text("""
            SELECT EXISTS (
                SELECT 1 FROM pg_policies 
                WHERE tablename = :table_name 
                AND policyname = :policy_name
            )
        """), {
            'table_name': table_name,
            'policy_name': policy_name
        }).scalar()
        
        if policy_exists:
            op.execute(f"DROP POLICY IF EXISTS {policy_name} ON {table_name}")
            print(f"✓ Dropped RLS policy: {policy_name}")
        
        # Drop table
        table_exists = conn.execute(sa.text("""
            SELECT EXISTS (
                SELECT 1 FROM information_schema.tables 
                WHERE table_name = :table_name
            )
        """), {'table_name': table_name}).scalar()
        
        if table_exists:
            # Check for data
            count = conn.execute(sa.text(f"""
                SELECT COUNT(*) FROM {table_name}
            """)).scalar()
            
            if count > 0:
                print(f"⚠ WARNING: Dropping table {table_name} with {count} records")
            
            op.drop_table(table_name)
            print(f"✓ Dropped table: {table_name}")
        
        # Remove column from institutions
        target_table = 'institutions'
        column_name = 'example_feature_enabled'
        
        column_exists = conn.execute(sa.text("""
            SELECT EXISTS (
                SELECT 1 FROM information_schema.columns 
                WHERE table_name = :table_name 
                AND column_name = :column_name
            )
        """), {
            'table_name': target_table,
            'column_name': column_name
        }).scalar()
        
        if column_exists:
            print(f"⚠ WARNING: Dropping column {target_table}.{column_name}")
            op.drop_column(target_table, column_name)
            print(f"✓ Dropped column: {target_table}.{column_name}")
        
        # Drop enum type (only if not used)
        enum_name = 'example_status_enum'
        
        # Check if any columns use this enum
        usage_count = conn.execute(sa.text("""
            SELECT COUNT(*) FROM information_schema.columns 
            WHERE udt_name = :enum_name
        """), {'enum_name': enum_name}).scalar()
        
        if usage_count == 0:
            enum_exists = conn.execute(sa.text("""
                SELECT EXISTS (
                    SELECT 1 FROM pg_type WHERE typname = :enum_name
                )
            """), {'enum_name': enum_name}).scalar()
            
            if enum_exists:
                op.execute(f"DROP TYPE IF EXISTS {enum_name}")
                print(f"✓ Dropped enum type: {enum_name}")
        else:
            print(f"⚠ Cannot drop enum {enum_name}: still in use by {usage_count} columns")
        
        print("\n✅ Migration 042 downgrade completed successfully")
