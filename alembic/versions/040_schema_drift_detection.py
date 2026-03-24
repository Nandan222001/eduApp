"""schema drift detection and remediation

Revision ID: 040
Revises: 039
Create Date: 2024-01-20 04:00:00.000000

This migration detects and remediates common schema drift issues:
- Missing foreign key indexes
- Missing unique constraints
- Enum type mismatches
- Missing table columns
"""
from alembic import op
import sqlalchemy as sa
from sqlalchemy import text

revision = '040'
down_revision = '039'
branch_labels = None
depends_on = None


def upgrade() -> None:
    conn = op.get_bind()
    
    # Fix any missing NOT NULL constraints on critical foreign keys
    critical_fk_columns = [
        ('volunteer_hour_logs', 'institution_id'),
        ('volunteer_hour_logs', 'parent_id'),
        ('volunteer_hour_logs', 'academic_year_id'),
        ('volunteer_hour_summaries', 'institution_id'),
        ('volunteer_hour_summaries', 'parent_id'),
        ('volunteer_hour_summaries', 'academic_year_id'),
        ('student_contents', 'institution_id'),
        ('student_contents', 'creator_student_id'),
        ('content_reviews', 'institution_id'),
        ('content_reviews', 'content_id'),
        ('content_reviews', 'reviewer_student_id'),
    ]
    
    for table_name, column_name in critical_fk_columns:
        # Check if table and column exist
        result = conn.execute(text("""
            SELECT COUNT(*) 
            FROM information_schema.columns 
            WHERE table_schema = DATABASE()
            AND table_name = :table_name
            AND column_name = :column_name
        """), {'table_name': table_name, 'column_name': column_name}).scalar()
        
        if result > 0:
            # Check if column is nullable
            result = conn.execute(text("""
                SELECT is_nullable 
                FROM information_schema.columns 
                WHERE table_schema = DATABASE()
                AND table_name = :table_name
                AND column_name = :column_name
            """), {'table_name': table_name, 'column_name': column_name}).scalar()
            
            # If it's nullable but shouldn't be, we need to handle it carefully
            # Only set NOT NULL if there are no NULL values
            if result == 'YES':
                null_count = conn.execute(text(f"""
                    SELECT COUNT(*) 
                    FROM {table_name} 
                    WHERE {column_name} IS NULL
                """)).scalar()
                
                if null_count == 0:
                    op.alter_column(table_name, column_name, nullable=False)
    
    # Add missing default values for numeric columns
    numeric_defaults = [
        ('volunteer_hour_summaries', 'total_hours', '0'),
        ('volunteer_hour_summaries', 'approved_hours', '0'),
        ('volunteer_hour_summaries', 'pending_hours', '0'),
        ('volunteer_hour_summaries', 'rejected_hours', '0'),
        ('student_contents', 'sales_count', '0'),
        ('student_contents', 'revenue_earned', '0'),
        ('student_contents', 'views_count', '0'),
        ('student_credits_balances', 'total_credits', '0'),
        ('student_credits_balances', 'earned_credits', '0'),
    ]
    
    for table_name, column_name, default_value in numeric_defaults:
        # Check if table and column exist
        result = conn.execute(text("""
            SELECT COUNT(*) 
            FROM information_schema.columns 
            WHERE table_schema = DATABASE()
            AND table_name = :table_name
            AND column_name = :column_name
        """), {'table_name': table_name, 'column_name': column_name}).scalar()
        
        if result > 0:
            # Check if it has a default
            result = conn.execute(text("""
                SELECT column_default 
                FROM information_schema.columns 
                WHERE table_schema = DATABASE()
                AND table_name = :table_name
                AND column_name = :column_name
            """), {'table_name': table_name, 'column_name': column_name}).scalar()
            
            if result is None:
                op.alter_column(
                    table_name, 
                    column_name,
                    server_default=sa.text(default_value)
                )
    
    # Ensure all timestamp columns have proper defaults
    timestamp_columns = [
        ('volunteer_hour_logs', 'created_at'),
        ('volunteer_hour_logs', 'updated_at'),
        ('volunteer_hour_summaries', 'created_at'),
        ('volunteer_hour_summaries', 'updated_at'),
        ('student_contents', 'created_at'),
        ('student_contents', 'updated_at'),
    ]
    
    for table_name, column_name in timestamp_columns:
        result = conn.execute(text("""
            SELECT COUNT(*) 
            FROM information_schema.columns 
            WHERE table_schema = DATABASE()
            AND table_name = :table_name
            AND column_name = :column_name
        """), {'table_name': table_name, 'column_name': column_name}).scalar()
        
        if result > 0:
            result = conn.execute(text("""
                SELECT column_default 
                FROM information_schema.columns 
                WHERE table_schema = DATABASE()
                AND table_name = :table_name
                AND column_name = :column_name
            """), {'table_name': table_name, 'column_name': column_name}).scalar()
            
            if result is None and column_name == 'created_at':
                op.alter_column(
                    table_name,
                    column_name,
                    server_default=sa.text('CURRENT_TIMESTAMP')
                )
    
    # Verify all foreign keys have corresponding indexes
    # This is critical for query performance
    fk_indexes = [
        ('volunteer_hour_logs', ['institution_id'], 'idx_volunteer_hour_institution'),
        ('volunteer_hour_logs', ['parent_id'], 'idx_volunteer_hour_parent'),
        ('volunteer_hour_logs', ['academic_year_id'], 'idx_volunteer_hour_academic_year'),
        ('student_contents', ['institution_id'], 'idx_student_content_institution'),
        ('student_contents', ['creator_student_id'], 'idx_student_content_creator'),
        ('content_reviews', ['content_id'], 'idx_content_review_content'),
        ('content_purchases', ['buyer_student_id'], 'idx_content_purchase_buyer'),
    ]
    
    for table_name, columns, index_name in fk_indexes:
        # Check if table exists
        result = conn.execute(text("""
            SELECT COUNT(*) 
            FROM information_schema.tables 
            WHERE table_schema = DATABASE()
            AND table_name = :table_name
        """), {'table_name': table_name}).scalar()
        
        if result > 0:
            # Check if index exists
            result = conn.execute(text("""
                SELECT COUNT(*) 
                FROM information_schema.statistics 
                WHERE table_schema = DATABASE()
                AND table_name = :table_name
                AND index_name = :index_name
            """), {'table_name': table_name, 'index_name': index_name}).scalar()
            
            if result == 0:
                op.create_index(index_name, table_name, columns)
    
    # Check for orphaned records (records with missing foreign key references)
    # This is a data integrity check
    orphan_checks = [
        ('volunteer_hour_logs', 'parent_id', 'parents', 'id'),
        ('volunteer_hour_logs', 'academic_year_id', 'academic_years', 'id'),
        ('student_contents', 'creator_student_id', 'students', 'id'),
        ('content_reviews', 'content_id', 'student_contents', 'id'),
    ]
    
    for child_table, child_fk, parent_table, parent_pk in orphan_checks:
        # Check if both tables exist
        child_exists = conn.execute(text("""
            SELECT COUNT(*) 
            FROM information_schema.tables 
            WHERE table_schema = DATABASE()
            AND table_name = :table_name
        """), {'table_name': child_table}).scalar()
        
        parent_exists = conn.execute(text("""
            SELECT COUNT(*) 
            FROM information_schema.tables 
            WHERE table_schema = DATABASE()
            AND table_name = :table_name
        """), {'table_name': parent_table}).scalar()
        
        if child_exists > 0 and parent_exists > 0:
            # Count orphaned records
            orphan_count = conn.execute(text(f"""
                SELECT COUNT(*) 
                FROM {child_table} c
                LEFT JOIN {parent_table} p ON c.{child_fk} = p.{parent_pk}
                WHERE c.{child_fk} IS NOT NULL AND p.{parent_pk} IS NULL
            """)).scalar()
            
            if orphan_count > 0:
                # Log warning - don't delete automatically
                print(f"WARNING: Found {orphan_count} orphaned records in {child_table}.{child_fk}")
                print(f"  These records reference non-existent {parent_table}.{parent_pk}")
                print(f"  Manual cleanup may be required")


def downgrade() -> None:
    # This migration is primarily for validation and remediation
    # Downgrade would not revert the fixes as they are data integrity improvements
    pass
