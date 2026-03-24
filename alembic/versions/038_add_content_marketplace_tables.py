"""add content marketplace tables

Revision ID: 038
Revises: 037
Create Date: 2024-01-20 02:00:00.000000

Creates tables for student content marketplace functionality
"""
from alembic import op
import sqlalchemy as sa

revision = '038'
down_revision = '037'
branch_labels = None
depends_on = None


def upgrade() -> None:
    conn = op.get_bind()
    
    # Create content marketplace enums
    result = conn.execute(
        "SELECT COUNT(*) FROM information_schema.columns WHERE table_name = 'student_contents' AND column_name = 'content_type'"
    ).scalar()
    
    if not result:
        op.execute("""
            CREATE TYPE contenttype AS ENUM (
                'study_guide', 'flashcard_deck', 'summary_notes', 
                'practice_quiz', 'video_tutorial', 'cheat_sheet'
            );
        """)
    
    result = conn.execute(
        "SELECT COUNT(*) FROM information_schema.columns WHERE table_name = 'student_contents' AND column_name = 'status'"
    ).scalar()
    
    if not result:
        op.execute("""
            CREATE TYPE contentstatus AS ENUM (
                'draft', 'pending_review', 'approved', 'rejected', 'flagged', 'archived'
            );
        """)
    
    result = conn.execute(
        "SELECT COUNT(*) FROM information_schema.columns WHERE table_name = 'student_contents' AND column_name = 'moderation_status'"
    ).scalar()
    
    if not result:
        op.execute("""
            CREATE TYPE moderationstatus AS ENUM (
                'pending', 'in_review', 'approved', 'rejected', 'needs_revision'
            );
        """)
    
    result = conn.execute(
        "SELECT COUNT(*) FROM information_schema.columns WHERE table_name = 'student_contents' AND column_name = 'plagiarism_status'"
    ).scalar()
    
    if not result:
        op.execute("""
            CREATE TYPE plagiarismstatus AS ENUM (
                'not_checked', 'checking', 'passed', 'failed', 'under_review'
            );
        """)
    
    result = conn.execute(
        "SELECT COUNT(*) FROM information_schema.columns WHERE table_name = 'credit_transactions' AND column_name = 'transaction_type'"
    ).scalar()
    
    if not result:
        op.execute("""
            CREATE TYPE transactiontype AS ENUM (
                'earn_sale', 'spend_purchase', 'admin_credit', 
                'admin_debit', 'refund', 'withdrawal', 'bonus'
            );
        """)
    
    # Check if student_contents table already exists
    result = conn.execute(
        "SELECT EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'student_contents')"
    ).scalar()
    
    if not result:
        op.create_table(
            'student_contents',
            sa.Column('id', sa.Integer(), nullable=False),
            sa.Column('institution_id', sa.Integer(), nullable=False),
            sa.Column('creator_student_id', sa.Integer(), nullable=False),
            sa.Column('content_type', sa.Enum('study_guide', 'flashcard_deck', 'summary_notes', 'practice_quiz', 'video_tutorial', 'cheat_sheet', name='contenttype', create_type=False), nullable=False),
            sa.Column('subject', sa.String(length=100), nullable=False),
            sa.Column('topic', sa.String(length=200), nullable=False),
            sa.Column('grade_level', sa.String(length=50), nullable=False),
            sa.Column('title', sa.String(length=255), nullable=False),
            sa.Column('description', sa.Text(), nullable=False),
            sa.Column('preview_content', sa.Text(), nullable=True),
            sa.Column('full_content_url', sa.String(length=500), nullable=True),
            sa.Column('s3_key', sa.String(length=500), nullable=True),
            sa.Column('thumbnail_url', sa.String(length=500), nullable=True),
            sa.Column('price_credits', sa.Integer(), nullable=False, server_default='0'),
            sa.Column('sales_count', sa.Integer(), nullable=False, server_default='0'),
            sa.Column('revenue_earned', sa.Integer(), nullable=False, server_default='0'),
            sa.Column('views_count', sa.Integer(), nullable=False, server_default='0'),
            sa.Column('downloads_count', sa.Integer(), nullable=False, server_default='0'),
            sa.Column('rating', sa.Float(), nullable=False, server_default='0.0'),
            sa.Column('rating_count', sa.Integer(), nullable=False, server_default='0'),
            sa.Column('reviews_count', sa.Integer(), nullable=False, server_default='0'),
            sa.Column('status', sa.Enum('draft', 'pending_review', 'approved', 'rejected', 'flagged', 'archived', name='contentstatus', create_type=False), nullable=False, server_default='draft'),
            sa.Column('moderation_status', sa.Enum('pending', 'in_review', 'approved', 'rejected', 'needs_revision', name='moderationstatus', create_type=False), nullable=False, server_default='pending'),
            sa.Column('plagiarism_status', sa.Enum('not_checked', 'checking', 'passed', 'failed', 'under_review', name='plagiarismstatus', create_type=False), nullable=False, server_default='not_checked'),
            sa.Column('plagiarism_score', sa.Float(), nullable=True),
            sa.Column('metadata', sa.JSON(), nullable=True),
            sa.Column('tags', sa.JSON(), nullable=True),
            sa.Column('is_featured', sa.Boolean(), nullable=False, server_default='false'),
            sa.Column('is_active', sa.Boolean(), nullable=False, server_default='true'),
            sa.Column('created_at', sa.DateTime(), nullable=False),
            sa.Column('updated_at', sa.DateTime(), nullable=False),
            sa.Column('published_at', sa.DateTime(), nullable=True),
            sa.ForeignKeyConstraint(['institution_id'], ['institutions.id'], ondelete='CASCADE'),
            sa.ForeignKeyConstraint(['creator_student_id'], ['students.id'], ondelete='CASCADE'),
            sa.PrimaryKeyConstraint('id')
        )
        op.create_index('idx_student_content_institution', 'student_contents', ['institution_id'])
        op.create_index('idx_student_content_creator', 'student_contents', ['creator_student_id'])
        op.create_index('idx_student_content_type', 'student_contents', ['content_type'])
        op.create_index('idx_student_content_subject', 'student_contents', ['subject'])
        op.create_index('idx_student_content_grade', 'student_contents', ['grade_level'])
        op.create_index('idx_student_content_status', 'student_contents', ['status'])
        op.create_index('idx_student_content_moderation', 'student_contents', ['moderation_status'])
        op.create_index('idx_student_content_plagiarism', 'student_contents', ['plagiarism_status'])
        op.create_index('idx_student_content_rating', 'student_contents', ['rating'])
        op.create_index('idx_student_content_price', 'student_contents', ['price_credits'])
        op.create_index('idx_student_content_featured', 'student_contents', ['is_featured'])
        op.create_index('idx_student_content_search', 'student_contents', ['subject', 'topic', 'grade_level'])
    
    # Check if content_reviews table already exists
    result = conn.execute(
        "SELECT EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'content_reviews')"
    ).scalar()
    
    if not result:
        op.create_table(
            'content_reviews',
            sa.Column('id', sa.Integer(), nullable=False),
            sa.Column('institution_id', sa.Integer(), nullable=False),
            sa.Column('content_id', sa.Integer(), nullable=False),
            sa.Column('reviewer_student_id', sa.Integer(), nullable=False),
            sa.Column('rating', sa.Integer(), nullable=False),
            sa.Column('review_text', sa.Text(), nullable=True),
            sa.Column('is_helpful', sa.Boolean(), nullable=False, server_default='true'),
            sa.Column('helpful_count', sa.Integer(), nullable=False, server_default='0'),
            sa.Column('is_verified_purchase', sa.Boolean(), nullable=False, server_default='false'),
            sa.Column('is_flagged', sa.Boolean(), nullable=False, server_default='false'),
            sa.Column('flag_reason', sa.String(length=255), nullable=True),
            sa.Column('created_at', sa.DateTime(), nullable=False),
            sa.Column('updated_at', sa.DateTime(), nullable=False),
            sa.ForeignKeyConstraint(['institution_id'], ['institutions.id'], ondelete='CASCADE'),
            sa.ForeignKeyConstraint(['content_id'], ['student_contents.id'], ondelete='CASCADE'),
            sa.ForeignKeyConstraint(['reviewer_student_id'], ['students.id'], ondelete='CASCADE'),
            sa.PrimaryKeyConstraint('id'),
            sa.UniqueConstraint('content_id', 'reviewer_student_id', name='uq_content_reviewer')
        )
        op.create_index('idx_content_review_institution', 'content_reviews', ['institution_id'])
        op.create_index('idx_content_review_content', 'content_reviews', ['content_id'])
        op.create_index('idx_content_review_reviewer', 'content_reviews', ['reviewer_student_id'])
        op.create_index('idx_content_review_rating', 'content_reviews', ['rating'])
        op.create_index('idx_content_review_flagged', 'content_reviews', ['is_flagged'])
    
    # Check if content_purchases table already exists
    result = conn.execute(
        "SELECT EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'content_purchases')"
    ).scalar()
    
    if not result:
        op.create_table(
            'content_purchases',
            sa.Column('id', sa.Integer(), nullable=False),
            sa.Column('institution_id', sa.Integer(), nullable=False),
            sa.Column('content_id', sa.Integer(), nullable=False),
            sa.Column('buyer_student_id', sa.Integer(), nullable=False),
            sa.Column('credits_paid', sa.Integer(), nullable=False),
            sa.Column('transaction_id', sa.String(length=100), nullable=True),
            sa.Column('is_refunded', sa.Boolean(), nullable=False, server_default='false'),
            sa.Column('refund_reason', sa.Text(), nullable=True),
            sa.Column('refunded_at', sa.DateTime(), nullable=True),
            sa.Column('created_at', sa.DateTime(), nullable=False),
            sa.ForeignKeyConstraint(['institution_id'], ['institutions.id'], ondelete='CASCADE'),
            sa.ForeignKeyConstraint(['content_id'], ['student_contents.id'], ondelete='CASCADE'),
            sa.ForeignKeyConstraint(['buyer_student_id'], ['students.id'], ondelete='CASCADE'),
            sa.PrimaryKeyConstraint('id'),
            sa.UniqueConstraint('content_id', 'buyer_student_id', name='uq_content_buyer')
        )
        op.create_index('idx_content_purchase_institution', 'content_purchases', ['institution_id'])
        op.create_index('idx_content_purchase_content', 'content_purchases', ['content_id'])
        op.create_index('idx_content_purchase_buyer', 'content_purchases', ['buyer_student_id'])
        op.create_index('idx_content_purchase_transaction', 'content_purchases', ['transaction_id'], unique=True)
        op.create_index('idx_content_purchase_created', 'content_purchases', ['created_at'])
        op.create_index('idx_content_purchase_refunded', 'content_purchases', ['is_refunded'])
    
    # Check if content_moderation_reviews table already exists
    result = conn.execute(
        "SELECT EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'content_moderation_reviews')"
    ).scalar()
    
    if not result:
        op.create_table(
            'content_moderation_reviews',
            sa.Column('id', sa.Integer(), nullable=False),
            sa.Column('institution_id', sa.Integer(), nullable=False),
            sa.Column('content_id', sa.Integer(), nullable=False),
            sa.Column('reviewer_teacher_id', sa.Integer(), nullable=False),
            sa.Column('moderation_status', sa.Enum('pending', 'in_review', 'approved', 'rejected', 'needs_revision', name='moderationstatus', create_type=False), nullable=False),
            sa.Column('quality_score', sa.Integer(), nullable=True),
            sa.Column('accuracy_score', sa.Integer(), nullable=True),
            sa.Column('feedback', sa.Text(), nullable=True),
            sa.Column('revision_notes', sa.Text(), nullable=True),
            sa.Column('rejection_reason', sa.Text(), nullable=True),
            sa.Column('quality_checks', sa.JSON(), nullable=True),
            sa.Column('reviewed_at', sa.DateTime(), nullable=False),
            sa.Column('created_at', sa.DateTime(), nullable=False),
            sa.ForeignKeyConstraint(['institution_id'], ['institutions.id'], ondelete='CASCADE'),
            sa.ForeignKeyConstraint(['content_id'], ['student_contents.id'], ondelete='CASCADE'),
            sa.ForeignKeyConstraint(['reviewer_teacher_id'], ['teachers.id'], ondelete='CASCADE'),
            sa.PrimaryKeyConstraint('id')
        )
        op.create_index('idx_moderation_review_institution', 'content_moderation_reviews', ['institution_id'])
        op.create_index('idx_moderation_review_content', 'content_moderation_reviews', ['content_id'])
        op.create_index('idx_moderation_review_reviewer', 'content_moderation_reviews', ['reviewer_teacher_id'])
        op.create_index('idx_moderation_review_status', 'content_moderation_reviews', ['moderation_status'])
        op.create_index('idx_moderation_review_reviewed', 'content_moderation_reviews', ['reviewed_at'])
    
    # Check if content_plagiarism_checks table already exists
    result = conn.execute(
        "SELECT EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'content_plagiarism_checks')"
    ).scalar()
    
    if not result:
        op.create_table(
            'content_plagiarism_checks',
            sa.Column('id', sa.Integer(), nullable=False),
            sa.Column('institution_id', sa.Integer(), nullable=False),
            sa.Column('content_id', sa.Integer(), nullable=False),
            sa.Column('plagiarism_status', sa.Enum('not_checked', 'checking', 'passed', 'failed', 'under_review', name='plagiarismstatus', create_type=False), nullable=False),
            sa.Column('similarity_score', sa.Float(), nullable=True),
            sa.Column('sources_found', sa.Integer(), nullable=False, server_default='0'),
            sa.Column('matched_contents', sa.JSON(), nullable=True),
            sa.Column('external_sources', sa.JSON(), nullable=True),
            sa.Column('check_details', sa.JSON(), nullable=True),
            sa.Column('checked_at', sa.DateTime(), nullable=False),
            sa.Column('created_at', sa.DateTime(), nullable=False),
            sa.ForeignKeyConstraint(['institution_id'], ['institutions.id'], ondelete='CASCADE'),
            sa.ForeignKeyConstraint(['content_id'], ['student_contents.id'], ondelete='CASCADE'),
            sa.PrimaryKeyConstraint('id')
        )
        op.create_index('idx_content_plagiarism_institution', 'content_plagiarism_checks', ['institution_id'])
        op.create_index('idx_content_plagiarism_content', 'content_plagiarism_checks', ['content_id'])
        op.create_index('idx_content_plagiarism_status', 'content_plagiarism_checks', ['plagiarism_status'])
        op.create_index('idx_content_plagiarism_score', 'content_plagiarism_checks', ['similarity_score'])
        op.create_index('idx_content_plagiarism_checked', 'content_plagiarism_checks', ['checked_at'])
    
    # Check if student_credits_balances table already exists
    result = conn.execute(
        "SELECT EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'student_credits_balances')"
    ).scalar()
    
    if not result:
        op.create_table(
            'student_credits_balances',
            sa.Column('id', sa.Integer(), nullable=False),
            sa.Column('institution_id', sa.Integer(), nullable=False),
            sa.Column('student_id', sa.Integer(), nullable=False),
            sa.Column('total_credits', sa.Integer(), nullable=False, server_default='0'),
            sa.Column('earned_credits', sa.Integer(), nullable=False, server_default='0'),
            sa.Column('purchased_credits', sa.Integer(), nullable=False, server_default='0'),
            sa.Column('spent_credits', sa.Integer(), nullable=False, server_default='0'),
            sa.Column('total_earnings', sa.Integer(), nullable=False, server_default='0'),
            sa.Column('pending_earnings', sa.Integer(), nullable=False, server_default='0'),
            sa.Column('withdrawn_earnings', sa.Integer(), nullable=False, server_default='0'),
            sa.Column('created_at', sa.DateTime(), nullable=False),
            sa.Column('updated_at', sa.DateTime(), nullable=False),
            sa.ForeignKeyConstraint(['institution_id'], ['institutions.id'], ondelete='CASCADE'),
            sa.ForeignKeyConstraint(['student_id'], ['students.id'], ondelete='CASCADE'),
            sa.PrimaryKeyConstraint('id'),
            sa.UniqueConstraint('institution_id', 'student_id', name='uq_student_credits_balance')
        )
        op.create_index('idx_student_credits_institution', 'student_credits_balances', ['institution_id'])
        op.create_index('idx_student_credits_student', 'student_credits_balances', ['student_id'])
    
    # Check if credit_transactions table already exists
    result = conn.execute(
        "SELECT EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'credit_transactions')"
    ).scalar()
    
    if not result:
        op.create_table(
            'credit_transactions',
            sa.Column('id', sa.Integer(), nullable=False),
            sa.Column('institution_id', sa.Integer(), nullable=False),
            sa.Column('student_balance_id', sa.Integer(), nullable=False),
            sa.Column('transaction_type', sa.Enum('earn_sale', 'spend_purchase', 'admin_credit', 'admin_debit', 'refund', 'withdrawal', 'bonus', name='transactiontype', create_type=False), nullable=False),
            sa.Column('amount', sa.Integer(), nullable=False),
            sa.Column('balance_after', sa.Integer(), nullable=False),
            sa.Column('description', sa.String(length=255), nullable=True),
            sa.Column('reference_type', sa.String(length=50), nullable=True),
            sa.Column('reference_id', sa.Integer(), nullable=True),
            sa.Column('metadata', sa.JSON(), nullable=True),
            sa.Column('created_at', sa.DateTime(), nullable=False),
            sa.ForeignKeyConstraint(['institution_id'], ['institutions.id'], ondelete='CASCADE'),
            sa.ForeignKeyConstraint(['student_balance_id'], ['student_credits_balances.id'], ondelete='CASCADE'),
            sa.PrimaryKeyConstraint('id')
        )
        op.create_index('idx_credit_transaction_institution', 'credit_transactions', ['institution_id'])
        op.create_index('idx_credit_transaction_balance', 'credit_transactions', ['student_balance_id'])
        op.create_index('idx_credit_transaction_type', 'credit_transactions', ['transaction_type'])
        op.create_index('idx_credit_transaction_reference', 'credit_transactions', ['reference_type', 'reference_id'])
        op.create_index('idx_credit_transaction_created', 'credit_transactions', ['created_at'])


def downgrade() -> None:
    conn = op.get_bind()
    
    # Drop tables in reverse order
    result = conn.execute(
        "SELECT EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'credit_transactions')"
    ).scalar()
    if result:
        op.drop_index('idx_credit_transaction_created', 'credit_transactions')
        op.drop_index('idx_credit_transaction_reference', 'credit_transactions')
        op.drop_index('idx_credit_transaction_type', 'credit_transactions')
        op.drop_index('idx_credit_transaction_balance', 'credit_transactions')
        op.drop_index('idx_credit_transaction_institution', 'credit_transactions')
        op.drop_table('credit_transactions')
    
    result = conn.execute(
        "SELECT EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'student_credits_balances')"
    ).scalar()
    if result:
        op.drop_index('idx_student_credits_student', 'student_credits_balances')
        op.drop_index('idx_student_credits_institution', 'student_credits_balances')
        op.drop_table('student_credits_balances')
    
    result = conn.execute(
        "SELECT EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'content_plagiarism_checks')"
    ).scalar()
    if result:
        op.drop_index('idx_content_plagiarism_checked', 'content_plagiarism_checks')
        op.drop_index('idx_content_plagiarism_score', 'content_plagiarism_checks')
        op.drop_index('idx_content_plagiarism_status', 'content_plagiarism_checks')
        op.drop_index('idx_content_plagiarism_content', 'content_plagiarism_checks')
        op.drop_index('idx_content_plagiarism_institution', 'content_plagiarism_checks')
        op.drop_table('content_plagiarism_checks')
    
    result = conn.execute(
        "SELECT EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'content_moderation_reviews')"
    ).scalar()
    if result:
        op.drop_index('idx_moderation_review_reviewed', 'content_moderation_reviews')
        op.drop_index('idx_moderation_review_status', 'content_moderation_reviews')
        op.drop_index('idx_moderation_review_reviewer', 'content_moderation_reviews')
        op.drop_index('idx_moderation_review_content', 'content_moderation_reviews')
        op.drop_index('idx_moderation_review_institution', 'content_moderation_reviews')
        op.drop_table('content_moderation_reviews')
    
    result = conn.execute(
        "SELECT EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'content_purchases')"
    ).scalar()
    if result:
        op.drop_index('idx_content_purchase_refunded', 'content_purchases')
        op.drop_index('idx_content_purchase_created', 'content_purchases')
        op.drop_index('idx_content_purchase_transaction', 'content_purchases')
        op.drop_index('idx_content_purchase_buyer', 'content_purchases')
        op.drop_index('idx_content_purchase_content', 'content_purchases')
        op.drop_index('idx_content_purchase_institution', 'content_purchases')
        op.drop_table('content_purchases')
    
    result = conn.execute(
        "SELECT EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'content_reviews')"
    ).scalar()
    if result:
        op.drop_index('idx_content_review_flagged', 'content_reviews')
        op.drop_index('idx_content_review_rating', 'content_reviews')
        op.drop_index('idx_content_review_reviewer', 'content_reviews')
        op.drop_index('idx_content_review_content', 'content_reviews')
        op.drop_index('idx_content_review_institution', 'content_reviews')
        op.drop_table('content_reviews')
    
    result = conn.execute(
        "SELECT EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'student_contents')"
    ).scalar()
    if result:
        op.drop_index('idx_student_content_search', 'student_contents')
        op.drop_index('idx_student_content_featured', 'student_contents')
        op.drop_index('idx_student_content_price', 'student_contents')
        op.drop_index('idx_student_content_rating', 'student_contents')
        op.drop_index('idx_student_content_plagiarism', 'student_contents')
        op.drop_index('idx_student_content_moderation', 'student_contents')
        op.drop_index('idx_student_content_status', 'student_contents')
        op.drop_index('idx_student_content_grade', 'student_contents')
        op.drop_index('idx_student_content_subject', 'student_contents')
        op.drop_index('idx_student_content_type', 'student_contents')
        op.drop_index('idx_student_content_creator', 'student_contents')
        op.drop_index('idx_student_content_institution', 'student_contents')
        op.drop_table('student_contents')
