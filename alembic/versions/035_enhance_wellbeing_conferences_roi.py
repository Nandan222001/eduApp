"""enhance wellbeing conferences roi

Revision ID: 035_enhance_wellbeing_conferences_roi
Revises: 034_create_subject_rpg
Create Date: 2024-01-20 10:00:00.000000

"""
from typing import Sequence, Union
from alembic import op
import sqlalchemy as sa

# revision identifiers, used by Alembic.
revision: str = '035_enhance_wellbeing_conferences_roi'
down_revision: Union[str, None] = '034_create_subject_rpg'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    # Create stress_levels table
    op.create_table(
        'stress_levels',
        sa.Column('id', sa.Integer(), nullable=False),
        sa.Column('institution_id', sa.Integer(), nullable=False),
        sa.Column('student_id', sa.Integer(), nullable=False),
        sa.Column('study_hours_continuous', sa.Float(), nullable=False),
        sa.Column('sleep_hours', sa.Float(), nullable=False),
        sa.Column('exam_proximity', sa.Integer(), nullable=False),
        sa.Column('activity_level', sa.Float(), nullable=False),
        sa.Column('break_frequency', sa.Float(), nullable=False),
        sa.Column('stress_score', sa.Float(), nullable=False),
        sa.Column('stress_category', sa.String(length=20), nullable=False),
        sa.Column('date', sa.String(length=10), nullable=False),
        sa.Column('created_at', sa.DateTime(), nullable=False),
        sa.ForeignKeyConstraint(['institution_id'], ['institutions.id'], ondelete='CASCADE'),
        sa.ForeignKeyConstraint(['student_id'], ['students.id'], ondelete='CASCADE'),
        sa.PrimaryKeyConstraint('id')
    )
    op.create_index('idx_stress_level_institution', 'stress_levels', ['institution_id'])
    op.create_index('idx_stress_level_student', 'stress_levels', ['student_id'])
    op.create_index('idx_stress_level_date', 'stress_levels', ['date'])
    op.create_index('idx_stress_level_score', 'stress_levels', ['stress_score'])
    op.create_index('idx_stress_level_student_date', 'stress_levels', ['student_id', 'date'])
    op.create_index(op.f('ix_stress_levels_id'), 'stress_levels', ['id'])

    # Create parent_roi_reports table
    op.create_table(
        'parent_roi_reports',
        sa.Column('id', sa.Integer(), nullable=False),
        sa.Column('institution_id', sa.Integer(), nullable=False),
        sa.Column('parent_id', sa.Integer(), nullable=False),
        sa.Column('academic_year', sa.String(length=20), nullable=False),
        sa.Column('fees_paid', sa.Numeric(precision=10, scale=2), nullable=False),
        sa.Column('money_saved', sa.Numeric(precision=10, scale=2), nullable=False),
        sa.Column('tuition_cost_avoidance', sa.Numeric(precision=10, scale=2), nullable=False),
        sa.Column('performance_improvement', sa.JSON(), nullable=False),
        sa.Column('time_saved_hours', sa.Float(), nullable=False),
        sa.Column('features_used', sa.JSON(), nullable=False),
        sa.Column('engagement_score', sa.Float(), nullable=False),
        sa.Column('roi_percentage', sa.Float(), nullable=False),
        sa.Column('report_generated_at', sa.DateTime(), nullable=False),
        sa.Column('created_at', sa.DateTime(), nullable=False),
        sa.Column('updated_at', sa.DateTime(), nullable=False),
        sa.ForeignKeyConstraint(['institution_id'], ['institutions.id'], ondelete='CASCADE'),
        sa.ForeignKeyConstraint(['parent_id'], ['parents.id'], ondelete='CASCADE'),
        sa.PrimaryKeyConstraint('id')
    )
    op.create_index('idx_parent_roi_institution', 'parent_roi_reports', ['institution_id'])
    op.create_index('idx_parent_roi_parent', 'parent_roi_reports', ['parent_id'])
    op.create_index('idx_parent_roi_academic_year', 'parent_roi_reports', ['academic_year'])
    op.create_index('idx_parent_roi_roi_percentage', 'parent_roi_reports', ['roi_percentage'])
    op.create_index('idx_parent_roi_engagement_score', 'parent_roi_reports', ['engagement_score'])
    op.create_index('idx_parent_roi_parent_year', 'parent_roi_reports', ['parent_id', 'academic_year'])
    op.create_index(op.f('ix_parent_roi_reports_id'), 'parent_roi_reports', ['id'])

    # Add speed_round and auto_talking_points to conference_bookings
    op.add_column('conference_bookings', sa.Column('speed_round', sa.Boolean(), nullable=False, server_default='false'))
    op.add_column('conference_bookings', sa.Column('auto_talking_points', sa.JSON(), nullable=True))
    op.create_index('idx_conference_booking_speed_round', 'conference_bookings', ['speed_round'])
    
    # Update conference_bookings to replace parent_topics with topic field if not exists
    # Check if topic column doesn't exist and parent_topics does
    op.add_column('conference_bookings', sa.Column('topic', sa.String(length=500), nullable=True))
    op.add_column('conference_bookings', sa.Column('notes', sa.Text(), nullable=True))


def downgrade() -> None:
    # Remove columns from conference_bookings
    op.drop_index('idx_conference_booking_speed_round', table_name='conference_bookings')
    op.drop_column('conference_bookings', 'auto_talking_points')
    op.drop_column('conference_bookings', 'speed_round')
    op.drop_column('conference_bookings', 'notes')
    op.drop_column('conference_bookings', 'topic')
    
    # Drop parent_roi_reports table
    op.drop_index(op.f('ix_parent_roi_reports_id'), table_name='parent_roi_reports')
    op.drop_index('idx_parent_roi_parent_year', table_name='parent_roi_reports')
    op.drop_index('idx_parent_roi_engagement_score', table_name='parent_roi_reports')
    op.drop_index('idx_parent_roi_roi_percentage', table_name='parent_roi_reports')
    op.drop_index('idx_parent_roi_academic_year', table_name='parent_roi_reports')
    op.drop_index('idx_parent_roi_parent', table_name='parent_roi_reports')
    op.drop_index('idx_parent_roi_institution', table_name='parent_roi_reports')
    op.drop_table('parent_roi_reports')

    # Drop stress_levels table
    op.drop_index(op.f('ix_stress_levels_id'), table_name='stress_levels')
    op.drop_index('idx_stress_level_student_date', table_name='stress_levels')
    op.drop_index('idx_stress_level_score', table_name='stress_levels')
    op.drop_index('idx_stress_level_date', table_name='stress_levels')
    op.drop_index('idx_stress_level_student', table_name='stress_levels')
    op.drop_index('idx_stress_level_institution', table_name='stress_levels')
    op.drop_table('stress_levels')
