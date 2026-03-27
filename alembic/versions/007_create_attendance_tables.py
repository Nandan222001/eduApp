"""create attendance tables

Revision ID: 007
Revises: 006a
Create Date: 2024-01-17 10:00:00.000000

"""
from alembic import op
import sqlalchemy as sa

revision = '007'
down_revision = '006a'
branch_labels = None
depends_on = None


def upgrade():
    op.create_table('attendances',
        sa.Column('id', sa.Integer(), nullable=False),
        sa.Column('institution_id', sa.Integer(), nullable=False),
        sa.Column('student_id', sa.Integer(), nullable=False),
        sa.Column('section_id', sa.Integer(), nullable=True),
        sa.Column('subject_id', sa.Integer(), nullable=True),
        sa.Column('date', sa.Date(), nullable=False),
        sa.Column('status', sa.Enum('present', 'absent', 'late', 'half_day', name='attendancestatus'), nullable=False, server_default='present'),
        sa.Column('marked_by_id', sa.Integer(), nullable=True),
        sa.Column('remarks', sa.Text(), nullable=True),
        sa.Column('created_at', sa.DateTime(), nullable=False, server_default=sa.text('CURRENT_TIMESTAMP')),
        sa.Column('updated_at', sa.DateTime(), nullable=False, server_default=sa.text('CURRENT_TIMESTAMP')),
        sa.ForeignKeyConstraint(['institution_id'], ['institutions.id'], ondelete='CASCADE'),
        sa.ForeignKeyConstraint(['student_id'], ['students.id'], ondelete='CASCADE'),
        sa.ForeignKeyConstraint(['section_id'], ['sections.id'], ondelete='SET NULL'),
        sa.ForeignKeyConstraint(['subject_id'], ['subjects.id'], ondelete='SET NULL'),
        sa.ForeignKeyConstraint(['marked_by_id'], ['users.id'], ondelete='SET NULL'),
        sa.PrimaryKeyConstraint('id'),
        sa.UniqueConstraint('student_id', 'date', 'subject_id', name='uq_student_date_subject_attendance')
    )
    op.create_index('idx_attendance_institution', 'attendances', ['institution_id'])
    op.create_index('idx_attendance_student', 'attendances', ['student_id'])
    op.create_index('idx_attendance_section', 'attendances', ['section_id'])
    op.create_index('idx_attendance_subject', 'attendances', ['subject_id'])
    op.create_index('idx_attendance_date', 'attendances', ['date'])
    op.create_index('idx_attendance_status', 'attendances', ['status'])
    op.create_index('idx_attendance_marked_by', 'attendances', ['marked_by_id'])
    op.create_index('idx_attendance_student_date', 'attendances', ['student_id', 'date'])
    op.create_index('idx_attendance_section_date', 'attendances', ['section_id', 'date'])
    
    op.create_table('attendance_corrections',
        sa.Column('id', sa.Integer(), nullable=False),
        sa.Column('institution_id', sa.Integer(), nullable=False),
        sa.Column('attendance_id', sa.Integer(), nullable=False),
        sa.Column('requested_by_id', sa.Integer(), nullable=True),
        sa.Column('old_status', sa.Enum('present', 'absent', 'late', 'half_day', name='attendancestatus'), nullable=False),
        sa.Column('new_status', sa.Enum('present', 'absent', 'late', 'half_day', name='attendancestatus'), nullable=False),
        sa.Column('reason', sa.Text(), nullable=False),
        sa.Column('status', sa.Enum('pending', 'approved', 'rejected', name='correctionstatus'), nullable=False, server_default='pending'),
        sa.Column('reviewed_by_id', sa.Integer(), nullable=True),
        sa.Column('review_remarks', sa.Text(), nullable=True),
        sa.Column('reviewed_at', sa.DateTime(), nullable=True),
        sa.Column('created_at', sa.DateTime(), nullable=False, server_default=sa.text('CURRENT_TIMESTAMP')),
        sa.Column('updated_at', sa.DateTime(), nullable=False, server_default=sa.text('CURRENT_TIMESTAMP')),
        sa.ForeignKeyConstraint(['institution_id'], ['institutions.id'], ondelete='CASCADE'),
        sa.ForeignKeyConstraint(['attendance_id'], ['attendances.id'], ondelete='CASCADE'),
        sa.ForeignKeyConstraint(['requested_by_id'], ['users.id'], ondelete='SET NULL'),
        sa.ForeignKeyConstraint(['reviewed_by_id'], ['users.id'], ondelete='SET NULL'),
        sa.PrimaryKeyConstraint('id')
    )
    op.create_index('idx_correction_institution', 'attendance_corrections', ['institution_id'])
    op.create_index('idx_correction_attendance', 'attendance_corrections', ['attendance_id'])
    op.create_index('idx_correction_requested_by', 'attendance_corrections', ['requested_by_id'])
    op.create_index('idx_correction_reviewed_by', 'attendance_corrections', ['reviewed_by_id'])
    op.create_index('idx_correction_status', 'attendance_corrections', ['status'])
    op.create_index('idx_correction_created', 'attendance_corrections', ['created_at'])
    
    op.create_table('attendance_summaries',
        sa.Column('id', sa.Integer(), nullable=False),
        sa.Column('institution_id', sa.Integer(), nullable=False),
        sa.Column('student_id', sa.Integer(), nullable=False),
        sa.Column('subject_id', sa.Integer(), nullable=True),
        sa.Column('month', sa.Integer(), nullable=False),
        sa.Column('year', sa.Integer(), nullable=False),
        sa.Column('total_days', sa.Integer(), nullable=False, server_default='0'),
        sa.Column('present_days', sa.Integer(), nullable=False, server_default='0'),
        sa.Column('absent_days', sa.Integer(), nullable=False, server_default='0'),
        sa.Column('late_days', sa.Integer(), nullable=False, server_default='0'),
        sa.Column('half_days', sa.Integer(), nullable=False, server_default='0'),
        sa.Column('attendance_percentage', sa.Numeric(precision=5, scale=2), nullable=False, server_default='0.0'),
        sa.Column('created_at', sa.DateTime(), nullable=False, server_default=sa.text('CURRENT_TIMESTAMP')),
        sa.Column('updated_at', sa.DateTime(), nullable=False, server_default=sa.text('CURRENT_TIMESTAMP')),
        sa.ForeignKeyConstraint(['institution_id'], ['institutions.id'], ondelete='CASCADE'),
        sa.ForeignKeyConstraint(['student_id'], ['students.id'], ondelete='CASCADE'),
        sa.ForeignKeyConstraint(['subject_id'], ['subjects.id'], ondelete='SET NULL'),
        sa.PrimaryKeyConstraint('id'),
        sa.UniqueConstraint('student_id', 'year', 'month', 'subject_id', name='uq_student_year_month_subject_summary')
    )
    op.create_index('idx_summary_institution', 'attendance_summaries', ['institution_id'])
    op.create_index('idx_summary_student', 'attendance_summaries', ['student_id'])
    op.create_index('idx_summary_subject', 'attendance_summaries', ['subject_id'])
    op.create_index('idx_summary_year_month', 'attendance_summaries', ['year', 'month'])
    op.create_index('idx_summary_percentage', 'attendance_summaries', ['attendance_percentage'])


def downgrade():
    op.drop_index('idx_summary_percentage', table_name='attendance_summaries')
    op.drop_index('idx_summary_year_month', table_name='attendance_summaries')
    op.drop_index('idx_summary_subject', table_name='attendance_summaries')
    op.drop_index('idx_summary_student', table_name='attendance_summaries')
    op.drop_index('idx_summary_institution', table_name='attendance_summaries')
    op.drop_table('attendance_summaries')
    
    op.drop_index('idx_correction_created', table_name='attendance_corrections')
    op.drop_index('idx_correction_status', table_name='attendance_corrections')
    op.drop_index('idx_correction_reviewed_by', table_name='attendance_corrections')
    op.drop_index('idx_correction_requested_by', table_name='attendance_corrections')
    op.drop_index('idx_correction_attendance', table_name='attendance_corrections')
    op.drop_index('idx_correction_institution', table_name='attendance_corrections')
    op.drop_table('attendance_corrections')
    
    op.drop_index('idx_attendance_section_date', table_name='attendances')
    op.drop_index('idx_attendance_student_date', table_name='attendances')
    op.drop_index('idx_attendance_marked_by', table_name='attendances')
    op.drop_index('idx_attendance_status', table_name='attendances')
    op.drop_index('idx_attendance_date', table_name='attendances')
    op.drop_index('idx_attendance_subject', table_name='attendances')
    op.drop_index('idx_attendance_section', table_name='attendances')
    op.drop_index('idx_attendance_student', table_name='attendances')
    op.drop_index('idx_attendance_institution', table_name='attendances')
    op.drop_table('attendances')
