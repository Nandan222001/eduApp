"""create mistake analysis tables

Revision ID: mistake_analysis_001
Revises: homework_scanner_001
Create Date: 2024-01-18 00:00:00.000000

"""
from alembic import op
import sqlalchemy as sa

revision = 'mistake_analysis_001'
down_revision = 'homework_scanner_001'
branch_labels = None
depends_on = None


def upgrade():
    mistake_type_enum = sa.Enum(
        'silly_calculation', 'sign_error', 'unit_missing', 'concept_wrong',
        'misread_question', 'incomplete_steps', 'presentation',
        name='mistaketype_v2'
    )
    mistake_type_enum.create(op.get_bind())
    
    remediation_status_enum = sa.Enum(
        'unresolved', 'in_progress', 'mastered',
        name='remediationstatus'
    )
    remediation_status_enum.create(op.get_bind())
    
    earned_via_enum = sa.Enum(
        'study_streak', 'homework_complete', 'help_classmates', 'attendance', 'perfect_score',
        name='earnedvia'
    )
    earned_via_enum.create(op.get_bind())
    
    op.create_table(
        'mistake_patterns',
        sa.Column('id', sa.Integer(), nullable=False),
        sa.Column('student_id', sa.Integer(), nullable=False),
        sa.Column('subject_id', sa.Integer(), nullable=False),
        sa.Column('chapter_id', sa.Integer(), nullable=True),
        sa.Column('mistake_type', mistake_type_enum, nullable=False),
        sa.Column('frequency_count', sa.Integer(), nullable=False, server_default='1'),
        sa.Column('total_marks_lost', sa.Numeric(precision=10, scale=2), nullable=False, server_default='0'),
        sa.Column('first_detected_at', sa.DateTime(), nullable=False),
        sa.Column('last_detected_at', sa.DateTime(), nullable=False),
        sa.Column('remediation_status', remediation_status_enum, nullable=False, server_default='unresolved'),
        sa.Column('examples', sa.JSON(), nullable=True),
        sa.Column('created_at', sa.DateTime(), nullable=False),
        sa.Column('updated_at', sa.DateTime(), nullable=False),
        sa.ForeignKeyConstraint(['student_id'], ['students.id'], ondelete='CASCADE'),
        sa.ForeignKeyConstraint(['subject_id'], ['subjects.id'], ondelete='CASCADE'),
        sa.ForeignKeyConstraint(['chapter_id'], ['chapters.id'], ondelete='SET NULL'),
        sa.PrimaryKeyConstraint('id')
    )
    op.create_index('idx_mistake_pattern_student', 'mistake_patterns', ['student_id'])
    op.create_index('idx_mistake_pattern_subject', 'mistake_patterns', ['subject_id'])
    op.create_index('idx_mistake_pattern_chapter', 'mistake_patterns', ['chapter_id'])
    op.create_index('idx_mistake_pattern_type', 'mistake_patterns', ['mistake_type'])
    op.create_index('idx_mistake_pattern_status', 'mistake_patterns', ['remediation_status'])
    op.create_index('idx_mistake_pattern_student_subject', 'mistake_patterns', ['student_id', 'subject_id'])
    op.create_index('idx_mistake_pattern_student_type', 'mistake_patterns', ['student_id', 'mistake_type'])
    
    op.create_table(
        'mistake_insurance_tokens',
        sa.Column('id', sa.Integer(), nullable=False),
        sa.Column('student_id', sa.Integer(), nullable=False),
        sa.Column('earned_via', earned_via_enum, nullable=False),
        sa.Column('earned_at', sa.DateTime(), nullable=False),
        sa.Column('used_at', sa.DateTime(), nullable=True),
        sa.Column('used_for_exam_id', sa.Integer(), nullable=True),
        sa.Column('created_at', sa.DateTime(), nullable=False),
        sa.Column('updated_at', sa.DateTime(), nullable=False),
        sa.ForeignKeyConstraint(['student_id'], ['students.id'], ondelete='CASCADE'),
        sa.ForeignKeyConstraint(['used_for_exam_id'], ['exams.id'], ondelete='SET NULL'),
        sa.PrimaryKeyConstraint('id')
    )
    op.create_index('idx_insurance_token_student', 'mistake_insurance_tokens', ['student_id'])
    op.create_index('idx_insurance_token_earned_via', 'mistake_insurance_tokens', ['earned_via'])
    op.create_index('idx_insurance_token_used_at', 'mistake_insurance_tokens', ['used_at'])
    op.create_index('idx_insurance_token_exam', 'mistake_insurance_tokens', ['used_for_exam_id'])
    op.create_index('idx_insurance_token_student_unused', 'mistake_insurance_tokens', ['student_id', 'used_at'])
    
    op.create_table(
        'insurance_reviews',
        sa.Column('id', sa.Integer(), nullable=False),
        sa.Column('token_id', sa.Integer(), nullable=False),
        sa.Column('exam_id', sa.Integer(), nullable=False),
        sa.Column('original_score', sa.Numeric(precision=10, scale=2), nullable=False),
        sa.Column('revised_score', sa.Numeric(precision=10, scale=2), nullable=False),
        sa.Column('mistakes_corrected', sa.JSON(), nullable=False),
        sa.Column('student_explanation', sa.Text(), nullable=True),
        sa.Column('reviewed_at', sa.DateTime(), nullable=False),
        sa.Column('created_at', sa.DateTime(), nullable=False),
        sa.Column('updated_at', sa.DateTime(), nullable=False),
        sa.ForeignKeyConstraint(['token_id'], ['mistake_insurance_tokens.id'], ondelete='CASCADE'),
        sa.ForeignKeyConstraint(['exam_id'], ['exams.id'], ondelete='CASCADE'),
        sa.PrimaryKeyConstraint('id'),
        sa.UniqueConstraint('token_id', name='uq_insurance_review_token')
    )
    op.create_index('idx_insurance_review_token', 'insurance_reviews', ['token_id'])
    op.create_index('idx_insurance_review_exam', 'insurance_reviews', ['exam_id'])
    op.create_index('idx_insurance_review_reviewed_at', 'insurance_reviews', ['reviewed_at'])


def downgrade():
    op.drop_index('idx_insurance_review_reviewed_at', 'insurance_reviews')
    op.drop_index('idx_insurance_review_exam', 'insurance_reviews')
    op.drop_index('idx_insurance_review_token', 'insurance_reviews')
    op.drop_table('insurance_reviews')
    
    op.drop_index('idx_insurance_token_student_unused', 'mistake_insurance_tokens')
    op.drop_index('idx_insurance_token_exam', 'mistake_insurance_tokens')
    op.drop_index('idx_insurance_token_used_at', 'mistake_insurance_tokens')
    op.drop_index('idx_insurance_token_earned_via', 'mistake_insurance_tokens')
    op.drop_index('idx_insurance_token_student', 'mistake_insurance_tokens')
    op.drop_table('mistake_insurance_tokens')
    
    op.drop_index('idx_mistake_pattern_student_type', 'mistake_patterns')
    op.drop_index('idx_mistake_pattern_student_subject', 'mistake_patterns')
    op.drop_index('idx_mistake_pattern_status', 'mistake_patterns')
    op.drop_index('idx_mistake_pattern_type', 'mistake_patterns')
    op.drop_index('idx_mistake_pattern_chapter', 'mistake_patterns')
    op.drop_index('idx_mistake_pattern_subject', 'mistake_patterns')
    op.drop_index('idx_mistake_pattern_student', 'mistake_patterns')
    op.drop_table('mistake_patterns')
    
    earned_via_enum = sa.Enum(name='earnedvia')
    earned_via_enum.drop(op.get_bind())
    
    remediation_status_enum = sa.Enum(name='remediationstatus')
    remediation_status_enum.drop(op.get_bind())
    
    mistake_type_enum = sa.Enum(name='mistaketype_v2')
    mistake_type_enum.drop(op.get_bind())
