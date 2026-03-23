"""create homework scanner tables

Revision ID: homework_scanner_001
Revises: study_buddy_001
Create Date: 2024-01-17 00:00:00.000000

"""
from alembic import op
import sqlalchemy as sa

revision = 'homework_scanner_001'
down_revision = 'study_buddy_001'
branch_labels = None
depends_on = None


def upgrade():
    mistake_type_enum = sa.Enum(
        'calculation', 'sign_error', 'concept', 'unit', 'incomplete',
        name='mistaketype'
    )
    mistake_type_enum.create(op.get_bind())
    
    op.create_table(
        'homework_scans',
        sa.Column('id', sa.Integer(), nullable=False),
        sa.Column('student_id', sa.Integer(), nullable=False),
        sa.Column('subject_id', sa.Integer(), nullable=False),
        sa.Column('scan_image_urls', sa.JSON(), nullable=False),
        sa.Column('ocr_text', sa.Text(), nullable=True),
        sa.Column('processed_results', sa.JSON(), nullable=True),
        sa.Column('total_score', sa.Numeric(precision=10, scale=2), nullable=True),
        sa.Column('scan_date', sa.DateTime(), nullable=False),
        sa.Column('created_at', sa.DateTime(), nullable=False),
        sa.Column('updated_at', sa.DateTime(), nullable=False),
        sa.ForeignKeyConstraint(['student_id'], ['students.id'], ondelete='CASCADE'),
        sa.ForeignKeyConstraint(['subject_id'], ['subjects.id'], ondelete='CASCADE'),
        sa.PrimaryKeyConstraint('id')
    )
    op.create_index('idx_homework_scan_student', 'homework_scans', ['student_id'])
    op.create_index('idx_homework_scan_subject', 'homework_scans', ['subject_id'])
    op.create_index('idx_homework_scan_date', 'homework_scans', ['scan_date'])
    
    op.create_table(
        'homework_feedbacks',
        sa.Column('id', sa.Integer(), nullable=False),
        sa.Column('scan_id', sa.Integer(), nullable=False),
        sa.Column('question_number', sa.Integer(), nullable=False),
        sa.Column('student_answer', sa.Text(), nullable=True),
        sa.Column('correct_answer', sa.Text(), nullable=True),
        sa.Column('is_correct', sa.Integer(), nullable=False),
        sa.Column('mistake_type', mistake_type_enum, nullable=True),
        sa.Column('ai_feedback', sa.Text(), nullable=True),
        sa.Column('remedial_content_url', sa.String(length=500), nullable=True),
        sa.Column('created_at', sa.DateTime(), nullable=False),
        sa.ForeignKeyConstraint(['scan_id'], ['homework_scans.id'], ondelete='CASCADE'),
        sa.PrimaryKeyConstraint('id')
    )
    op.create_index('idx_homework_feedback_scan', 'homework_feedbacks', ['scan_id'])
    op.create_index('idx_homework_feedback_mistake_type', 'homework_feedbacks', ['mistake_type'])


def downgrade():
    op.drop_index('idx_homework_feedback_mistake_type', 'homework_feedbacks')
    op.drop_index('idx_homework_feedback_scan', 'homework_feedbacks')
    op.drop_table('homework_feedbacks')
    
    op.drop_index('idx_homework_scan_date', 'homework_scans')
    op.drop_index('idx_homework_scan_subject', 'homework_scans')
    op.drop_index('idx_homework_scan_student', 'homework_scans')
    op.drop_table('homework_scans')
    
    mistake_type_enum = sa.Enum(
        'calculation', 'sign_error', 'concept', 'unit', 'incomplete',
        name='mistaketype'
    )
    mistake_type_enum.drop(op.get_bind())
