revision = '008'
"""create examination tables

Revision ID: 008
Revises: 007
Create Date: 2024-01-08 00:00:00.000000

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa

revision: str = '008'
down_revision: Union[str, None] = '007'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.create_table(
        'exams',
        sa.Column('id', sa.Integer(), nullable=False),
        sa.Column('institution_id', sa.Integer(), nullable=False),
        sa.Column('academic_year_id', sa.Integer(), nullable=False),
        sa.Column('grade_id', sa.Integer(), nullable=False),
        sa.Column('name', sa.String(length=200), nullable=False),
        sa.Column('exam_type', sa.Enum('unit', 'mid_term', 'final', 'mock', name='examtype'), nullable=False),
        sa.Column('description', sa.Text(), nullable=True),
        sa.Column('start_date', sa.Date(), nullable=False),
        sa.Column('end_date', sa.Date(), nullable=False),
        sa.Column('status', sa.Enum('scheduled', 'ongoing', 'completed', 'cancelled', name='examstatus'), nullable=False, server_default='scheduled'),
        sa.Column('total_marks', sa.Numeric(precision=10, scale=2), nullable=True),
        sa.Column('passing_marks', sa.Numeric(precision=10, scale=2), nullable=True),
        sa.Column('is_published', sa.Boolean(), nullable=False, server_default=sa.text('0')),
        sa.Column('created_at', sa.DateTime(), nullable=False, server_default=sa.text('now()')),
        sa.Column('updated_at', sa.DateTime(), nullable=False, server_default=sa.text('now()')),
        sa.ForeignKeyConstraint(['institution_id'], ['institutions.id'], ondelete='CASCADE'),
        sa.ForeignKeyConstraint(['academic_year_id'], ['academic_years.id'], ondelete='CASCADE'),
        sa.ForeignKeyConstraint(['grade_id'], ['grades.id'], ondelete='CASCADE'),
        sa.PrimaryKeyConstraint('id'),
        sa.UniqueConstraint('institution_id', 'academic_year_id', 'grade_id', 'name', name='uq_institution_year_grade_exam_name')
    )
    
    op.create_index('idx_exam_institution', 'exams', ['institution_id'])
    op.create_index('idx_exam_academic_year', 'exams', ['academic_year_id'])
    op.create_index('idx_exam_grade', 'exams', ['grade_id'])
    op.create_index('idx_exam_type', 'exams', ['exam_type'])
    op.create_index('idx_exam_status', 'exams', ['status'])
    op.create_index('idx_exam_dates', 'exams', ['start_date', 'end_date'])
    
    op.create_table(
        'exam_subjects',
        sa.Column('id', sa.Integer(), nullable=False),
        sa.Column('institution_id', sa.Integer(), nullable=False),
        sa.Column('exam_id', sa.Integer(), nullable=False),
        sa.Column('subject_id', sa.Integer(), nullable=False),
        sa.Column('theory_max_marks', sa.Numeric(precision=10, scale=2), nullable=False, server_default='0'),
        sa.Column('practical_max_marks', sa.Numeric(precision=10, scale=2), nullable=False, server_default='0'),
        sa.Column('theory_passing_marks', sa.Numeric(precision=10, scale=2), nullable=True),
        sa.Column('practical_passing_marks', sa.Numeric(precision=10, scale=2), nullable=True),
        sa.Column('weightage', sa.Numeric(precision=5, scale=2), nullable=True),
        sa.Column('question_paper_path', sa.String(length=500), nullable=True),
        sa.Column('question_paper_uploaded_at', sa.DateTime(timezone=False), nullable=True),
        sa.Column('created_at', sa.DateTime(timezone=False), nullable=False, server_default=sa.text('CURRENT_TIMESTAMP')),
        sa.Column('updated_at', sa.DateTime(timezone=False), nullable=False, server_default=sa.text('CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP')),
        sa.ForeignKeyConstraint(['institution_id'], ['institutions.id'], ondelete='CASCADE'),
        sa.ForeignKeyConstraint(['exam_id'], ['exams.id'], ondelete='CASCADE'),
        sa.ForeignKeyConstraint(['subject_id'], ['subjects.id'], ondelete='CASCADE'),
        sa.PrimaryKeyConstraint('id'),
        sa.UniqueConstraint('exam_id', 'subject_id', name='uq_exam_subject')
    )
    
    op.create_index('idx_exam_subject_institution', 'exam_subjects', ['institution_id'])
    op.create_index('idx_exam_subject_exam', 'exam_subjects', ['exam_id'])
    op.create_index('idx_exam_subject_subject', 'exam_subjects', ['subject_id'])
    
    op.create_table(
        'exam_schedules',
        sa.Column('id', sa.Integer(), nullable=False),
        sa.Column('institution_id', sa.Integer(), nullable=False),
        sa.Column('exam_id', sa.Integer(), nullable=False),
        sa.Column('subject_id', sa.Integer(), nullable=False),
        sa.Column('section_id', sa.Integer(), nullable=True),
        sa.Column('exam_date', sa.Date(), nullable=False),
        sa.Column('start_time', sa.Time(), nullable=False),
        sa.Column('end_time', sa.Time(), nullable=False),
        sa.Column('room_number', sa.String(length=100), nullable=True),
        sa.Column('invigilator_id', sa.Integer(), nullable=True),
        sa.Column('instructions', sa.Text(), nullable=True),
        sa.Column('created_at', sa.DateTime(timezone=False), nullable=False, server_default=sa.text('CURRENT_TIMESTAMP')),
        sa.Column('updated_at', sa.DateTime(timezone=False), nullable=False, server_default=sa.text('CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP')),
        sa.ForeignKeyConstraint(['institution_id'], ['institutions.id'], ondelete='CASCADE'),
        sa.ForeignKeyConstraint(['exam_id'], ['exams.id'], ondelete='CASCADE'),
        sa.ForeignKeyConstraint(['subject_id'], ['subjects.id'], ondelete='CASCADE'),
        sa.ForeignKeyConstraint(['section_id'], ['sections.id'], ondelete='CASCADE'),
        sa.ForeignKeyConstraint(['invigilator_id'], ['teachers.id'], ondelete='SET NULL'),
        sa.PrimaryKeyConstraint('id')
    )
    
    op.create_index('idx_exam_schedule_institution', 'exam_schedules', ['institution_id'])
    op.create_index('idx_exam_schedule_exam', 'exam_schedules', ['exam_id'])
    op.create_index('idx_exam_schedule_subject', 'exam_schedules', ['subject_id'])
    op.create_index('idx_exam_schedule_section', 'exam_schedules', ['section_id'])
    op.create_index('idx_exam_schedule_date_time', 'exam_schedules', ['exam_date', 'start_time', 'end_time'])
    op.create_index('idx_exam_schedule_invigilator', 'exam_schedules', ['invigilator_id'])
    
    op.create_table(
        'exam_marks',
        sa.Column('id', sa.Integer(), nullable=False),
        sa.Column('institution_id', sa.Integer(), nullable=False),
        sa.Column('exam_subject_id', sa.Integer(), nullable=False),
        sa.Column('student_id', sa.Integer(), nullable=False),
        sa.Column('theory_marks_obtained', sa.Numeric(precision=10, scale=2), nullable=True),
        sa.Column('practical_marks_obtained', sa.Numeric(precision=10, scale=2), nullable=True),
        sa.Column('is_absent', sa.Boolean(), nullable=False, server_default=sa.text('0')),
        sa.Column('remarks', sa.Text(), nullable=True),
        sa.Column('entered_by', sa.Integer(), nullable=True),
        sa.Column('entered_at', sa.DateTime(timezone=False), nullable=True),
        sa.Column('created_at', sa.DateTime(timezone=False), nullable=False, server_default=sa.text('CURRENT_TIMESTAMP')),
        sa.Column('updated_at', sa.DateTime(timezone=False), nullable=False, server_default=sa.text('CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP')),
        sa.ForeignKeyConstraint(['institution_id'], ['institutions.id'], ondelete='CASCADE'),
        sa.ForeignKeyConstraint(['exam_subject_id'], ['exam_subjects.id'], ondelete='CASCADE'),
        sa.ForeignKeyConstraint(['student_id'], ['students.id'], ondelete='CASCADE'),
        sa.ForeignKeyConstraint(['entered_by'], ['teachers.id'], ondelete='SET NULL'),
        sa.PrimaryKeyConstraint('id'),
        sa.UniqueConstraint('exam_subject_id', 'student_id', name='uq_exam_subject_student_marks')
    )
    
    op.create_index('idx_exam_marks_institution', 'exam_marks', ['institution_id'])
    op.create_index('idx_exam_marks_exam_subject', 'exam_marks', ['exam_subject_id'])
    op.create_index('idx_exam_marks_student', 'exam_marks', ['student_id'])
    op.create_index('idx_exam_marks_entered_by', 'exam_marks', ['entered_by'])
    
    op.create_table(
        'exam_results',
        sa.Column('id', sa.Integer(), nullable=False),
        sa.Column('institution_id', sa.Integer(), nullable=False),
        sa.Column('exam_id', sa.Integer(), nullable=False),
        sa.Column('student_id', sa.Integer(), nullable=False),
        sa.Column('section_id', sa.Integer(), nullable=True),
        sa.Column('total_marks_obtained', sa.Numeric(precision=10, scale=2), nullable=False),
        sa.Column('total_max_marks', sa.Numeric(precision=10, scale=2), nullable=False),
        sa.Column('percentage', sa.Numeric(precision=5, scale=2), nullable=False),
        sa.Column('grade', sa.String(length=10), nullable=True),
        sa.Column('grade_point', sa.Numeric(precision=3, scale=2), nullable=True),
        sa.Column('is_pass', sa.Boolean(), nullable=False),
        sa.Column('rank_in_section', sa.Integer(), nullable=True),
        sa.Column('rank_in_grade', sa.Integer(), nullable=True),
        sa.Column('subjects_passed', sa.Integer(), nullable=False, server_default='0'),
        sa.Column('subjects_failed', sa.Integer(), nullable=False, server_default='0'),
        sa.Column('remarks', sa.Text(), nullable=True),
        sa.Column('generated_at', sa.DateTime(timezone=False), nullable=False, server_default=sa.text('CURRENT_TIMESTAMP')),
        sa.Column('created_at', sa.DateTime(timezone=False), nullable=False, server_default=sa.text('CURRENT_TIMESTAMP')),
        sa.Column('updated_at', sa.DateTime(timezone=False), nullable=False, server_default=sa.text('CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP')),
        sa.ForeignKeyConstraint(['institution_id'], ['institutions.id'], ondelete='CASCADE'),
        sa.ForeignKeyConstraint(['exam_id'], ['exams.id'], ondelete='CASCADE'),
        sa.ForeignKeyConstraint(['student_id'], ['students.id'], ondelete='CASCADE'),
        sa.ForeignKeyConstraint(['section_id'], ['sections.id'], ondelete='CASCADE'),
        sa.PrimaryKeyConstraint('id'),
        sa.UniqueConstraint('exam_id', 'student_id', name='uq_exam_student_result')
    )
    
    op.create_index('idx_exam_result_institution', 'exam_results', ['institution_id'])
    op.create_index('idx_exam_result_exam', 'exam_results', ['exam_id'])
    op.create_index('idx_exam_result_student', 'exam_results', ['student_id'])
    op.create_index('idx_exam_result_section', 'exam_results', ['section_id'])
    op.create_index('idx_exam_result_percentage', 'exam_results', ['percentage'])
    op.create_index('idx_exam_result_rank_section', 'exam_results', ['section_id', 'rank_in_section'])
    op.create_index('idx_exam_result_rank_grade', 'exam_results', ['rank_in_grade'])
    
    op.create_table(
        'grade_configurations',
        sa.Column('id', sa.Integer(), nullable=False),
        sa.Column('institution_id', sa.Integer(), nullable=False),
        sa.Column('name', sa.String(length=100), nullable=False),
        sa.Column('grade', sa.String(length=10), nullable=False),
        sa.Column('min_percentage', sa.Numeric(precision=5, scale=2), nullable=False),
        sa.Column('max_percentage', sa.Numeric(precision=5, scale=2), nullable=False),
        sa.Column('grade_point', sa.Numeric(precision=3, scale=2), nullable=False),
        sa.Column('description', sa.Text(), nullable=True),
        sa.Column('is_passing', sa.Boolean(), nullable=False, server_default=sa.text('1')),
        sa.Column('is_active', sa.Boolean(), nullable=False, server_default=sa.text('1')),
        sa.Column('created_at', sa.DateTime(), nullable=False, server_default=sa.text('now()')),
        sa.Column('updated_at', sa.DateTime(), nullable=False, server_default=sa.text('now()')),
        sa.ForeignKeyConstraint(['institution_id'], ['institutions.id'], ondelete='CASCADE'),
        sa.PrimaryKeyConstraint('id')
    )
    
    op.create_index('idx_grade_config_institution', 'grade_configurations', ['institution_id'])
    op.create_index('idx_grade_config_percentage', 'grade_configurations', ['min_percentage', 'max_percentage'])
    op.create_index('idx_grade_config_active', 'grade_configurations', ['is_active'])
    
    op.create_table(
        'exam_performance_analytics',
        sa.Column('id', sa.Integer(), nullable=False),
        sa.Column('institution_id', sa.Integer(), nullable=False),
        sa.Column('exam_id', sa.Integer(), nullable=False),
        sa.Column('section_id', sa.Integer(), nullable=True),
        sa.Column('subject_id', sa.Integer(), nullable=True),
        sa.Column('total_students', sa.Integer(), nullable=False),
        sa.Column('students_appeared', sa.Integer(), nullable=False),
        sa.Column('students_passed', sa.Integer(), nullable=False),
        sa.Column('students_failed', sa.Integer(), nullable=False),
        sa.Column('pass_percentage', sa.Numeric(precision=5, scale=2), nullable=False),
        sa.Column('average_marks', sa.Numeric(precision=10, scale=2), nullable=False),
        sa.Column('highest_marks', sa.Numeric(precision=10, scale=2), nullable=False),
        sa.Column('lowest_marks', sa.Numeric(precision=10, scale=2), nullable=False),
        sa.Column('median_marks', sa.Numeric(precision=10, scale=2), nullable=True),
        sa.Column('standard_deviation', sa.Numeric(precision=10, scale=2), nullable=True),
        sa.Column('generated_at', sa.DateTime(timezone=False), nullable=False, server_default=sa.text('CURRENT_TIMESTAMP')),
        sa.Column('created_at', sa.DateTime(timezone=False), nullable=False, server_default=sa.text('CURRENT_TIMESTAMP')),
        sa.Column('updated_at', sa.DateTime(timezone=False), nullable=False, server_default=sa.text('CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP')),
        sa.ForeignKeyConstraint(['institution_id'], ['institutions.id'], ondelete='CASCADE'),
        sa.ForeignKeyConstraint(['exam_id'], ['exams.id'], ondelete='CASCADE'),
        sa.ForeignKeyConstraint(['section_id'], ['sections.id'], ondelete='CASCADE'),
        sa.ForeignKeyConstraint(['subject_id'], ['subjects.id'], ondelete='CASCADE'),
        sa.PrimaryKeyConstraint('id')
    )
    
    op.create_index('idx_exam_analytics_institution', 'exam_performance_analytics', ['institution_id'])
    op.create_index('idx_exam_analytics_exam', 'exam_performance_analytics', ['exam_id'])
    op.create_index('idx_exam_analytics_section', 'exam_performance_analytics', ['section_id'])
    op.create_index('idx_exam_analytics_subject', 'exam_performance_analytics', ['subject_id'])


def downgrade() -> None:
    op.drop_table('exam_performance_analytics')
    op.drop_table('grade_configurations')
    op.drop_table('exam_results')
    op.drop_table('exam_marks')
    op.drop_table('exam_schedules')
    op.drop_table('exam_subjects')
    op.drop_table('exams')
