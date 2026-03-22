"""create study planner tables

Revision ID: 010_study_planner
Revises: 009_enhance_gamification_tables
Create Date: 2024-01-15 10:00:00.000000

"""
from alembic import op
import sqlalchemy as sa

revision = '010_study_planner'
down_revision = '009'
branch_labels = None
depends_on = None


def upgrade():
    op.create_table(
        'study_plans',
        sa.Column('id', sa.Integer(), nullable=False),
        sa.Column('institution_id', sa.Integer(), nullable=False),
        sa.Column('student_id', sa.Integer(), nullable=False),
        sa.Column('name', sa.String(length=200), nullable=False),
        sa.Column('description', sa.Text(), nullable=True),
        sa.Column('target_exam_id', sa.Integer(), nullable=True),
        sa.Column('target_exam_date', sa.Date(), nullable=True),
        sa.Column('start_date', sa.Date(), nullable=False),
        sa.Column('end_date', sa.Date(), nullable=False),
        sa.Column('status', sa.Enum('DRAFT', 'ACTIVE', 'COMPLETED', 'CANCELLED', name='studyplanstatus'), nullable=False, server_default='DRAFT'),
        sa.Column('total_study_hours', sa.Numeric(precision=10, scale=2), nullable=True),
        sa.Column('hours_per_day', sa.Numeric(precision=5, scale=2), nullable=True),
        sa.Column('calendar_sync_enabled', sa.Boolean(), nullable=False, server_default='false'),
        sa.Column('calendar_sync_url', sa.String(length=500), nullable=True),
        sa.Column('adaptive_rescheduling_enabled', sa.Boolean(), nullable=False, server_default='true'),
        sa.Column('last_rescheduled_at', sa.DateTime(), nullable=True),
        sa.Column('metadata', sa.JSON(), nullable=True),
        sa.Column('created_at', sa.DateTime(), nullable=False, server_default=sa.text('now()')),
        sa.Column('updated_at', sa.DateTime(), nullable=False, server_default=sa.text('now()')),
        sa.ForeignKeyConstraint(['institution_id'], ['institutions.id'], ondelete='CASCADE'),
        sa.ForeignKeyConstraint(['student_id'], ['students.id'], ondelete='CASCADE'),
        sa.ForeignKeyConstraint(['target_exam_id'], ['exams.id'], ondelete='SET NULL'),
        sa.PrimaryKeyConstraint('id')
    )
    op.create_index('idx_study_plan_institution', 'study_plans', ['institution_id'])
    op.create_index('idx_study_plan_student', 'study_plans', ['student_id'])
    op.create_index('idx_study_plan_status', 'study_plans', ['status'])
    op.create_index('idx_study_plan_target_exam', 'study_plans', ['target_exam_id'])
    op.create_index('idx_study_plan_dates', 'study_plans', ['start_date', 'end_date'])

    op.create_table(
        'weak_areas',
        sa.Column('id', sa.Integer(), nullable=False),
        sa.Column('institution_id', sa.Integer(), nullable=False),
        sa.Column('student_id', sa.Integer(), nullable=False),
        sa.Column('subject_id', sa.Integer(), nullable=False),
        sa.Column('chapter_id', sa.Integer(), nullable=True),
        sa.Column('topic_id', sa.Integer(), nullable=True),
        sa.Column('weakness_score', sa.Numeric(precision=5, scale=2), nullable=False),
        sa.Column('average_score', sa.Numeric(precision=5, scale=2), nullable=True),
        sa.Column('attempts_count', sa.Integer(), nullable=False, server_default='0'),
        sa.Column('last_attempted_at', sa.DateTime(), nullable=True),
        sa.Column('identified_from', sa.String(length=100), nullable=True),
        sa.Column('notes', sa.Text(), nullable=True),
        sa.Column('is_resolved', sa.Boolean(), nullable=False, server_default='false'),
        sa.Column('resolved_at', sa.DateTime(), nullable=True),
        sa.Column('created_at', sa.DateTime(), nullable=False, server_default=sa.text('now()')),
        sa.Column('updated_at', sa.DateTime(), nullable=False, server_default=sa.text('now()')),
        sa.ForeignKeyConstraint(['institution_id'], ['institutions.id'], ondelete='CASCADE'),
        sa.ForeignKeyConstraint(['student_id'], ['students.id'], ondelete='CASCADE'),
        sa.ForeignKeyConstraint(['subject_id'], ['subjects.id'], ondelete='CASCADE'),
        sa.ForeignKeyConstraint(['chapter_id'], ['chapters.id'], ondelete='SET NULL'),
        sa.ForeignKeyConstraint(['topic_id'], ['topics.id'], ondelete='SET NULL'),
        sa.PrimaryKeyConstraint('id')
    )
    op.create_index('idx_weak_area_institution', 'weak_areas', ['institution_id'])
    op.create_index('idx_weak_area_student', 'weak_areas', ['student_id'])
    op.create_index('idx_weak_area_subject', 'weak_areas', ['subject_id'])
    op.create_index('idx_weak_area_chapter', 'weak_areas', ['chapter_id'])
    op.create_index('idx_weak_area_topic', 'weak_areas', ['topic_id'])
    op.create_index('idx_weak_area_resolved', 'weak_areas', ['is_resolved'])
    op.create_index('idx_weak_area_weakness_score', 'weak_areas', ['weakness_score'])

    op.create_table(
        'daily_study_tasks',
        sa.Column('id', sa.Integer(), nullable=False),
        sa.Column('institution_id', sa.Integer(), nullable=False),
        sa.Column('study_plan_id', sa.Integer(), nullable=False),
        sa.Column('student_id', sa.Integer(), nullable=False),
        sa.Column('task_date', sa.Date(), nullable=False),
        sa.Column('subject_id', sa.Integer(), nullable=False),
        sa.Column('chapter_id', sa.Integer(), nullable=True),
        sa.Column('topic_id', sa.Integer(), nullable=True),
        sa.Column('title', sa.String(length=200), nullable=False),
        sa.Column('description', sa.Text(), nullable=True),
        sa.Column('priority', sa.Enum('LOW', 'MEDIUM', 'HIGH', 'CRITICAL', name='taskpriority'), nullable=False, server_default='MEDIUM'),
        sa.Column('priority_score', sa.Numeric(precision=10, scale=4), nullable=True),
        sa.Column('estimated_duration_minutes', sa.Integer(), nullable=False),
        sa.Column('actual_duration_minutes', sa.Integer(), nullable=True),
        sa.Column('start_time', sa.Time(), nullable=True),
        sa.Column('end_time', sa.Time(), nullable=True),
        sa.Column('status', sa.Enum('PENDING', 'IN_PROGRESS', 'COMPLETED', 'SKIPPED', 'RESCHEDULED', name='taskstatus'), nullable=False, server_default='PENDING'),
        sa.Column('completion_percentage', sa.Numeric(precision=5, scale=2), nullable=False, server_default='0'),
        sa.Column('completed_at', sa.DateTime(), nullable=True),
        sa.Column('skipped_reason', sa.Text(), nullable=True),
        sa.Column('rescheduled_from_date', sa.Date(), nullable=True),
        sa.Column('rescheduled_to_date', sa.Date(), nullable=True),
        sa.Column('rescheduled_reason', sa.Text(), nullable=True),
        sa.Column('calendar_event_id', sa.String(length=200), nullable=True),
        sa.Column('metadata', sa.JSON(), nullable=True),
        sa.Column('created_at', sa.DateTime(), nullable=False, server_default=sa.text('now()')),
        sa.Column('updated_at', sa.DateTime(), nullable=False, server_default=sa.text('now()')),
        sa.ForeignKeyConstraint(['institution_id'], ['institutions.id'], ondelete='CASCADE'),
        sa.ForeignKeyConstraint(['study_plan_id'], ['study_plans.id'], ondelete='CASCADE'),
        sa.ForeignKeyConstraint(['student_id'], ['students.id'], ondelete='CASCADE'),
        sa.ForeignKeyConstraint(['subject_id'], ['subjects.id'], ondelete='CASCADE'),
        sa.ForeignKeyConstraint(['chapter_id'], ['chapters.id'], ondelete='SET NULL'),
        sa.ForeignKeyConstraint(['topic_id'], ['topics.id'], ondelete='SET NULL'),
        sa.PrimaryKeyConstraint('id')
    )
    op.create_index('idx_daily_task_institution', 'daily_study_tasks', ['institution_id'])
    op.create_index('idx_daily_task_study_plan', 'daily_study_tasks', ['study_plan_id'])
    op.create_index('idx_daily_task_student', 'daily_study_tasks', ['student_id'])
    op.create_index('idx_daily_task_date', 'daily_study_tasks', ['task_date'])
    op.create_index('idx_daily_task_subject', 'daily_study_tasks', ['subject_id'])
    op.create_index('idx_daily_task_status', 'daily_study_tasks', ['status'])
    op.create_index('idx_daily_task_priority', 'daily_study_tasks', ['priority'])
    op.create_index('idx_daily_task_student_date', 'daily_study_tasks', ['student_id', 'task_date'])

    op.create_table(
        'topic_assignments',
        sa.Column('id', sa.Integer(), nullable=False),
        sa.Column('institution_id', sa.Integer(), nullable=False),
        sa.Column('study_plan_id', sa.Integer(), nullable=False),
        sa.Column('subject_id', sa.Integer(), nullable=False),
        sa.Column('chapter_id', sa.Integer(), nullable=True),
        sa.Column('topic_id', sa.Integer(), nullable=True),
        sa.Column('priority_score', sa.Numeric(precision=10, scale=4), nullable=False),
        sa.Column('importance_probability', sa.Numeric(precision=5, scale=4), nullable=True),
        sa.Column('weakness_score', sa.Numeric(precision=5, scale=2), nullable=True),
        sa.Column('subject_weightage', sa.Numeric(precision=5, scale=2), nullable=True),
        sa.Column('allocated_hours', sa.Numeric(precision=5, scale=2), nullable=False),
        sa.Column('completed_hours', sa.Numeric(precision=5, scale=2), nullable=False, server_default='0'),
        sa.Column('target_completion_date', sa.Date(), nullable=True),
        sa.Column('is_completed', sa.Boolean(), nullable=False, server_default='false'),
        sa.Column('notes', sa.Text(), nullable=True),
        sa.Column('created_at', sa.DateTime(), nullable=False, server_default=sa.text('now()')),
        sa.Column('updated_at', sa.DateTime(), nullable=False, server_default=sa.text('now()')),
        sa.ForeignKeyConstraint(['institution_id'], ['institutions.id'], ondelete='CASCADE'),
        sa.ForeignKeyConstraint(['study_plan_id'], ['study_plans.id'], ondelete='CASCADE'),
        sa.ForeignKeyConstraint(['subject_id'], ['subjects.id'], ondelete='CASCADE'),
        sa.ForeignKeyConstraint(['chapter_id'], ['chapters.id'], ondelete='SET NULL'),
        sa.ForeignKeyConstraint(['topic_id'], ['topics.id'], ondelete='SET NULL'),
        sa.PrimaryKeyConstraint('id'),
        sa.UniqueConstraint('study_plan_id', 'topic_id', name='uq_study_plan_topic')
    )
    op.create_index('idx_topic_assignment_institution', 'topic_assignments', ['institution_id'])
    op.create_index('idx_topic_assignment_study_plan', 'topic_assignments', ['study_plan_id'])
    op.create_index('idx_topic_assignment_subject', 'topic_assignments', ['subject_id'])
    op.create_index('idx_topic_assignment_priority', 'topic_assignments', ['priority_score'])
    op.create_index('idx_topic_assignment_completed', 'topic_assignments', ['is_completed'])

    op.create_table(
        'study_progress',
        sa.Column('id', sa.Integer(), nullable=False),
        sa.Column('institution_id', sa.Integer(), nullable=False),
        sa.Column('student_id', sa.Integer(), nullable=False),
        sa.Column('study_plan_id', sa.Integer(), nullable=False),
        sa.Column('progress_date', sa.Date(), nullable=False),
        sa.Column('total_tasks', sa.Integer(), nullable=False),
        sa.Column('completed_tasks', sa.Integer(), nullable=False),
        sa.Column('skipped_tasks', sa.Integer(), nullable=False),
        sa.Column('total_study_hours', sa.Numeric(precision=5, scale=2), nullable=False),
        sa.Column('actual_study_hours', sa.Numeric(precision=5, scale=2), nullable=False),
        sa.Column('completion_rate', sa.Numeric(precision=5, scale=2), nullable=False),
        sa.Column('adherence_score', sa.Numeric(precision=5, scale=2), nullable=True),
        sa.Column('productivity_score', sa.Numeric(precision=5, scale=2), nullable=True),
        sa.Column('metadata', sa.JSON(), nullable=True),
        sa.Column('created_at', sa.DateTime(), nullable=False, server_default=sa.text('now()')),
        sa.Column('updated_at', sa.DateTime(), nullable=False, server_default=sa.text('now()')),
        sa.ForeignKeyConstraint(['institution_id'], ['institutions.id'], ondelete='CASCADE'),
        sa.ForeignKeyConstraint(['student_id'], ['students.id'], ondelete='CASCADE'),
        sa.ForeignKeyConstraint(['study_plan_id'], ['study_plans.id'], ondelete='CASCADE'),
        sa.PrimaryKeyConstraint('id'),
        sa.UniqueConstraint('study_plan_id', 'progress_date', name='uq_study_plan_progress_date')
    )
    op.create_index('idx_study_progress_institution', 'study_progress', ['institution_id'])
    op.create_index('idx_study_progress_student', 'study_progress', ['student_id'])
    op.create_index('idx_study_progress_study_plan', 'study_progress', ['study_plan_id'])
    op.create_index('idx_study_progress_date', 'study_progress', ['progress_date'])


def downgrade():
    op.drop_table('study_progress')
    op.drop_table('topic_assignments')
    op.drop_table('daily_study_tasks')
    op.drop_table('weak_areas')
    op.drop_table('study_plans')
    
    op.execute("DROP TYPE IF EXISTS studyplanstatus")
    op.execute("DROP TYPE IF EXISTS taskstatus")
    op.execute("DROP TYPE IF EXISTS taskpriority")
