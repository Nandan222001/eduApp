"""add analytics tables

Revision ID: add_analytics_001
Revises: 
Create Date: 2024-01-15 10:00:00.000000

"""
from alembic import op
import sqlalchemy as sa

revision = 'add_analytics_001'
down_revision = '005'
branch_labels = None
depends_on = None


def upgrade() -> None:
        op.create_table(
                'analytics_cache',
                sa.Column('id', sa.Integer(), nullable=False),
                sa.Column('institution_id', sa.Integer(), nullable=False),
                sa.Column('cache_key', sa.String(length=500), nullable=False),
                sa.Column('cache_type', sa.String(length=100), nullable=False),
                sa.Column('data', sa.Text(), nullable=False),
                sa.Column('metadata', sa.Text(), nullable=True),
                sa.Column('expires_at', sa.DateTime(), nullable=False),
                sa.Column('created_at', sa.DateTime(), nullable=False),
                sa.Column('updated_at', sa.DateTime(), nullable=False),
                sa.ForeignKeyConstraint(['institution_id'], ['institutions.id'], ondelete='CASCADE'),
                sa.PrimaryKeyConstraint('id'),
        )
        op.create_index('idx_analytics_cache_institution', 'analytics_cache', ['institution_id'])
        op.create_index('idx_analytics_cache_key', 'analytics_cache', ['cache_key'], unique=True)
        op.create_index('idx_analytics_cache_type', 'analytics_cache', ['cache_type'])
        op.create_index('idx_analytics_cache_expires', 'analytics_cache', ['expires_at'])

        op.create_table(
                'student_performance_metrics',
                sa.Column('id', sa.Integer(), nullable=False),
                sa.Column('institution_id', sa.Integer(), nullable=False),
                sa.Column('student_id', sa.Integer(), nullable=False),
                sa.Column('academic_year_id', sa.Integer(), nullable=False),
                sa.Column('grade_id', sa.Integer(), nullable=False),
                sa.Column('period_start', sa.Date(), nullable=False),
                sa.Column('period_end', sa.Date(), nullable=False),
                sa.Column('total_exams', sa.Integer(), nullable=False, server_default='0'),
                sa.Column('exams_appeared', sa.Integer(), nullable=False, server_default='0'),
                sa.Column('exams_passed', sa.Integer(), nullable=False, server_default='0'),
                sa.Column('average_percentage', sa.Numeric(5, 2), nullable=False, server_default='0.0'),
                sa.Column('average_grade_point', sa.Numeric(3, 2), nullable=True),
                sa.Column('attendance_percentage', sa.Numeric(5, 2), nullable=False, server_default='0.0'),
                sa.Column('total_attendance_days', sa.Integer(), nullable=False, server_default='0'),
                sa.Column('present_days', sa.Integer(), nullable=False, server_default='0'),
                sa.Column('total_assignments', sa.Integer(), nullable=False, server_default='0'),
                sa.Column('assignments_submitted', sa.Integer(), nullable=False, server_default='0'),
                sa.Column('assignments_graded', sa.Integer(), nullable=False, server_default='0'),
                sa.Column('average_assignment_score', sa.Numeric(5, 2), nullable=True),
                sa.Column('rank_in_class', sa.Integer(), nullable=True),
                sa.Column('rank_in_grade', sa.Integer(), nullable=True),
                sa.Column('total_gamification_points', sa.Integer(), nullable=False, server_default='0'),
                sa.Column('badges_earned', sa.Integer(), nullable=False, server_default='0'),
                sa.Column('study_streak_days', sa.Integer(), nullable=False, server_default='0'),
                sa.Column('created_at', sa.DateTime(), nullable=False),
                sa.Column('updated_at', sa.DateTime(), nullable=False),
                sa.ForeignKeyConstraint(['institution_id'], ['institutions.id'], ondelete='CASCADE'),
                sa.ForeignKeyConstraint(['student_id'], ['students.id'], ondelete='CASCADE'),
                sa.ForeignKeyConstraint(['academic_year_id'], ['academic_years.id'], ondelete='CASCADE'),
                sa.ForeignKeyConstraint(['grade_id'], ['grades.id'], ondelete='CASCADE'),
                sa.PrimaryKeyConstraint('id'),
        )
        op.create_index('idx_student_metrics_institution', 'student_performance_metrics', ['institution_id'])
        op.create_index('idx_student_metrics_student', 'student_performance_metrics', ['student_id'])
        op.create_index('idx_student_metrics_academic_year', 'student_performance_metrics', ['academic_year_id'])
        op.create_index('idx_student_metrics_grade', 'student_performance_metrics', ['grade_id'])
        op.create_index('idx_student_metrics_period', 'student_performance_metrics', ['period_start', 'period_end'])
        op.create_index('idx_student_metrics_rank_class', 'student_performance_metrics', ['rank_in_class'])
        op.create_index('idx_student_metrics_rank_grade', 'student_performance_metrics', ['rank_in_grade'])

        op.create_table(
                'class_performance_metrics',
                sa.Column('id', sa.Integer(), nullable=False),
                sa.Column('institution_id', sa.Integer(), nullable=False),
                sa.Column('section_id', sa.Integer(), nullable=False),
                sa.Column('academic_year_id', sa.Integer(), nullable=False),
                sa.Column('period_start', sa.Date(), nullable=False),
                sa.Column('period_end', sa.Date(), nullable=False),
                sa.Column('total_students', sa.Integer(), nullable=False, server_default='0'),
                sa.Column('active_students', sa.Integer(), nullable=False, server_default='0'),
                sa.Column('average_exam_percentage', sa.Numeric(5, 2), nullable=False, server_default='0.0'),
                sa.Column('highest_exam_percentage', sa.Numeric(5, 2), nullable=True),
                sa.Column('lowest_exam_percentage', sa.Numeric(5, 2), nullable=True),
                sa.Column('median_exam_percentage', sa.Numeric(5, 2), nullable=True),
                sa.Column('pass_percentage', sa.Numeric(5, 2), nullable=False, server_default='0.0'),
                sa.Column('average_attendance_percentage', sa.Numeric(5, 2), nullable=False, server_default='0.0'),
                sa.Column('highest_attendance_percentage', sa.Numeric(5, 2), nullable=True),
                sa.Column('lowest_attendance_percentage', sa.Numeric(5, 2), nullable=True),
                sa.Column('average_assignment_score', sa.Numeric(5, 2), nullable=True),
                sa.Column('assignment_submission_rate', sa.Numeric(5, 2), nullable=False, server_default='0.0'),
                sa.Column('created_at', sa.DateTime(), nullable=False),
                sa.Column('updated_at', sa.DateTime(), nullable=False),
                sa.ForeignKeyConstraint(['institution_id'], ['institutions.id'], ondelete='CASCADE'),
                sa.ForeignKeyConstraint(['section_id'], ['sections.id'], ondelete='CASCADE'),
                sa.ForeignKeyConstraint(['academic_year_id'], ['academic_years.id'], ondelete='CASCADE'),
                sa.PrimaryKeyConstraint('id'),
        )
        op.create_index('idx_class_metrics_institution', 'class_performance_metrics', ['institution_id'])
        op.create_index('idx_class_metrics_section', 'class_performance_metrics', ['section_id'])
        op.create_index('idx_class_metrics_academic_year', 'class_performance_metrics', ['academic_year_id'])
        op.create_index('idx_class_metrics_period', 'class_performance_metrics', ['period_start', 'period_end'])

        op.create_table(
                'institution_performance_metrics',
                sa.Column('id', sa.Integer(), nullable=False),
                sa.Column('institution_id', sa.Integer(), nullable=False),
                sa.Column('academic_year_id', sa.Integer(), nullable=False),
                sa.Column('period_start', sa.Date(), nullable=False),
                sa.Column('period_end', sa.Date(), nullable=False),
                sa.Column('total_students', sa.Integer(), nullable=False, server_default='0'),
                sa.Column('active_students', sa.Integer(), nullable=False, server_default='0'),
                sa.Column('total_teachers', sa.Integer(), nullable=False, server_default='0'),
                sa.Column('total_classes', sa.Integer(), nullable=False, server_default='0'),
                sa.Column('overall_average_percentage', sa.Numeric(5, 2), nullable=False, server_default='0.0'),
                sa.Column('overall_pass_percentage', sa.Numeric(5, 2), nullable=False, server_default='0.0'),
                sa.Column('overall_attendance_percentage', sa.Numeric(5, 2), nullable=False, server_default='0.0'),
                sa.Column('total_exams_conducted', sa.Integer(), nullable=False, server_default='0'),
                sa.Column('total_assignments_created', sa.Integer(), nullable=False, server_default='0'),
                sa.Column('assignment_submission_rate', sa.Numeric(5, 2), nullable=False, server_default='0.0'),
                sa.Column('created_at', sa.DateTime(), nullable=False),
                sa.Column('updated_at', sa.DateTime(), nullable=False),
                sa.ForeignKeyConstraint(['institution_id'], ['institutions.id'], ondelete='CASCADE'),
                sa.ForeignKeyConstraint(['academic_year_id'], ['academic_years.id'], ondelete='CASCADE'),
                sa.PrimaryKeyConstraint('id'),
        )
        op.create_index('idx_institution_metrics_institution', 'institution_performance_metrics', ['institution_id'])
        op.create_index('idx_institution_metrics_academic_year', 'institution_performance_metrics', ['academic_year_id'])
        op.create_index('idx_institution_metrics_period', 'institution_performance_metrics', ['period_start', 'period_end'])

        report_type_enum = sa.Enum(
                'STUDENT_PERFORMANCE',
                'CLASS_PERFORMANCE',
                'INSTITUTION_PERFORMANCE',
                'ATTENDANCE_SUMMARY',
                'ASSIGNMENT_SUMMARY',
                'EXAM_ANALYSIS',
                'YOY_COMPARISON',
                'SUBJECT_ANALYSIS',
                name='reporttype',
                create_type=False,
        )
        report_type_enum.create(op.get_bind(), checkfirst=True)

        # Create the enum types only if they don't already exist (works across PG versions)
        op.execute(
                """
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'reporttype') THEN
        CREATE TYPE reporttype AS ENUM (
          'STUDENT_PERFORMANCE', 'CLASS_PERFORMANCE', 'INSTITUTION_PERFORMANCE',
          'ATTENDANCE_SUMMARY', 'ASSIGNMENT_SUMMARY', 'EXAM_ANALYSIS',
          'YOY_COMPARISON', 'SUBJECT_ANALYSIS'
        );
  END IF;
END$$;
""",
        )

        report_status_enum = sa.Enum(
                'PENDING',
                'PROCESSING',
                'COMPLETED',
                'FAILED',
                name='reportstatus',
                create_type=False,
        )
        report_status_enum.create(op.get_bind(), checkfirst=True)

        op.execute(
                """
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'reportstatus') THEN
        CREATE TYPE reportstatus AS ENUM ('PENDING','PROCESSING','COMPLETED','FAILED');
  END IF;
END$$;
""",
        )

        # Use string columns for report_type and status to avoid enum creation issues
        # (enum types may already exist in the DB from previous partial runs). Converting
        # to proper ENUMs can be done in a later, idempotent migration if desired.
        op.create_table(
                'generated_reports',
                sa.Column('id', sa.Integer(), nullable=False),
                sa.Column('institution_id', sa.Integer(), nullable=False),
                sa.Column('report_type', sa.String(length=100), nullable=False),
                sa.Column('report_title', sa.String(length=255), nullable=False),
                sa.Column('report_description', sa.Text(), nullable=True),
                sa.Column('generated_by_id', sa.Integer(), nullable=True),
                sa.Column('parameters', sa.Text(), nullable=True),
                sa.Column('file_path', sa.String(length=500), nullable=True),
                sa.Column('file_url', sa.String(length=500), nullable=True),
                sa.Column('s3_key', sa.String(length=500), nullable=True),
                sa.Column('file_size', sa.Integer(), nullable=True),
                sa.Column('status', sa.String(length=50), nullable=False, server_default='PENDING'),
                sa.Column('error_message', sa.Text(), nullable=True),
                sa.Column('started_at', sa.DateTime(), nullable=True),
                sa.Column('completed_at', sa.DateTime(), nullable=True),
                sa.Column('created_at', sa.DateTime(), nullable=False),
                sa.Column('updated_at', sa.DateTime(), nullable=False),
                sa.ForeignKeyConstraint(['institution_id'], ['institutions.id'], ondelete='CASCADE'),
                sa.ForeignKeyConstraint(['generated_by_id'], ['users.id'], ondelete='SET NULL'),
                sa.PrimaryKeyConstraint('id'),
        )
        op.create_index('idx_generated_report_institution', 'generated_reports', ['institution_id'])
        op.create_index('idx_generated_report_type', 'generated_reports', ['report_type'])
        op.create_index('idx_generated_report_status', 'generated_reports', ['status'])
        op.create_index('idx_generated_report_generated_by', 'generated_reports', ['generated_by_id'])
        op.create_index('idx_generated_report_created', 'generated_reports', ['created_at'])


def downgrade() -> None:
    op.drop_index('idx_generated_report_created', table_name='generated_reports')
    op.drop_index('idx_generated_report_generated_by', table_name='generated_reports')
    op.drop_index('idx_generated_report_status', table_name='generated_reports')
    op.drop_index('idx_generated_report_type', table_name='generated_reports')
    op.drop_index('idx_generated_report_institution', table_name='generated_reports')
    op.drop_table('generated_reports')
    
    op.drop_index('idx_institution_metrics_period', table_name='institution_performance_metrics')
    op.drop_index('idx_institution_metrics_academic_year', table_name='institution_performance_metrics')
    op.drop_index('idx_institution_metrics_institution', table_name='institution_performance_metrics')
    op.drop_table('institution_performance_metrics')
    
    op.drop_index('idx_class_metrics_period', table_name='class_performance_metrics')
    op.drop_index('idx_class_metrics_academic_year', table_name='class_performance_metrics')
    op.drop_index('idx_class_metrics_section', table_name='class_performance_metrics')
    op.drop_index('idx_class_metrics_institution', table_name='class_performance_metrics')
    op.drop_table('class_performance_metrics')
    
    op.drop_index('idx_student_metrics_rank_grade', table_name='student_performance_metrics')
    op.drop_index('idx_student_metrics_rank_class', table_name='student_performance_metrics')
    op.drop_index('idx_student_metrics_period', table_name='student_performance_metrics')
    op.drop_index('idx_student_metrics_grade', table_name='student_performance_metrics')
    op.drop_index('idx_student_metrics_academic_year', table_name='student_performance_metrics')
    op.drop_index('idx_student_metrics_student', table_name='student_performance_metrics')
    op.drop_index('idx_student_metrics_institution', table_name='student_performance_metrics')
    op.drop_table('student_performance_metrics')
    
    op.drop_index('idx_analytics_cache_expires', table_name='analytics_cache')
    op.drop_index('idx_analytics_cache_type', table_name='analytics_cache')
    op.drop_index('idx_analytics_cache_key', table_name='analytics_cache')
    op.drop_index('idx_analytics_cache_institution', table_name='analytics_cache')
    op.drop_table('analytics_cache')
    
    op.execute('DROP TYPE IF EXISTS reportstatus')
    op.execute('DROP TYPE IF EXISTS reporttype')
