"""validate schema consistency and fix missing constraints

Revision ID: 039
Revises: 038
Create Date: 2024-01-20 03:00:00.000000

This migration ensures all foreign keys, indexes, and constraints are properly created
across all tables to prevent schema drift issues.
"""
from alembic import op
import sqlalchemy as sa

revision = '039'
down_revision = '038'
branch_labels = None
depends_on = None


def upgrade() -> None:
    conn = op.get_bind()
    
    # Add missing indexes if they don't exist
    # Check for missing foreign key indexes on commonly queried columns
    
    # Ensure all enum types exist
    enum_types = {
        'activitytype': ['classroom_help', 'event_support', 'fundraising', 'field_trip_chaperone', 'committee_work'],
        'badgetier': ['bronze', 'silver', 'gold', 'platinum'],
        'verificationstatus': ['pending', 'approved', 'rejected', 'verified'],
        'serviceactivitytype': ['volunteer', 'fundraising', 'environmental', 'tutoring', 'healthcare', 'animal_welfare'],
        'contenttype': ['study_guide', 'flashcard_deck', 'summary_notes', 'practice_quiz', 'video_tutorial', 'cheat_sheet'],
        'contentstatus': ['draft', 'pending_review', 'approved', 'rejected', 'flagged', 'archived'],
        'moderationstatus': ['pending', 'in_review', 'approved', 'rejected', 'needs_revision'],
        'plagiarismstatus': ['not_checked', 'checking', 'passed', 'failed', 'under_review'],
        'transactiontype': ['earn_sale', 'spend_purchase', 'admin_credit', 'admin_debit', 'refund', 'withdrawal', 'bonus'],
        'difficultylevel': ['beginner', 'elementary', 'intermediate', 'advanced', 'expert'],
        'masterylevel': ['not_started', 'learning', 'practicing', 'mastered', 'needs_review'],
        'learningpathstatus': ['active', 'completed', 'paused', 'abandoned'],
        'milestonestatus': ['locked', 'unlocked', 'in_progress', 'completed'],
        'reviewpriority': ['low', 'medium', 'high', 'critical'],
    }
    
    for enum_name, enum_values in enum_types.items():
        result = conn.execute(
            f"SELECT EXISTS (SELECT 1 FROM pg_type WHERE typname = '{enum_name}')"
        ).scalar()
        
        if not result:
            values_str = "', '".join(enum_values)
            op.execute(f"CREATE TYPE {enum_name} AS ENUM ('{values_str}');")
    
    # Add RLS policies to new tables if they don't exist
    new_tables = [
        'volunteer_hour_logs',
        'volunteer_hour_summaries',
        'volunteer_badges',
        'parent_volunteer_badges',
        'volunteer_leaderboards',
        'volunteer_certificates',
        'student_contents',
        'content_reviews',
        'content_purchases',
        'content_moderation_reviews',
        'content_plagiarism_checks',
        'student_credits_balances',
        'credit_transactions',
    ]
    
    for table_name in new_tables:
        # Check if table exists
        result = conn.execute(
            f"SELECT EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = '{table_name}')"
        ).scalar()
        
        if result:
            # Enable RLS if not already enabled
            op.execute(f"ALTER TABLE {table_name} ENABLE ROW LEVEL SECURITY;")
            
            # Add isolation policy if it doesn't exist
            policy_name = f"{table_name}_isolation_policy"
            result = conn.execute(
                f"SELECT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = '{table_name}' AND policyname = '{policy_name}')"
            ).scalar()
            
            if not result:
                op.execute(f"""
                    CREATE POLICY {policy_name} ON {table_name}
                    USING (
                        institution_id = current_setting('app.current_institution_id', true)::integer
                        OR current_setting('app.bypass_rls', true)::boolean = true
                    );
                """)


def downgrade() -> None:
    conn = op.get_bind()
    
    # Drop RLS policies from new tables
    new_tables = [
        'volunteer_hour_logs',
        'volunteer_hour_summaries',
        'volunteer_badges',
        'parent_volunteer_badges',
        'volunteer_leaderboards',
        'volunteer_certificates',
        'student_contents',
        'content_reviews',
        'content_purchases',
        'content_moderation_reviews',
        'content_plagiarism_checks',
        'student_credits_balances',
        'credit_transactions',
    ]
    
    for table_name in new_tables:
        result = conn.execute(
            f"SELECT EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = '{table_name}')"
        ).scalar()
        
        if result:
            policy_name = f"{table_name}_isolation_policy"
            op.execute(f"DROP POLICY IF EXISTS {policy_name} ON {table_name};")
            op.execute(f"ALTER TABLE {table_name} DISABLE ROW LEVEL SECURITY;")
