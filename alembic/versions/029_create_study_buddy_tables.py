"""create study buddy tables

Revision ID: study_buddy_001
Revises: community_service_001
Create Date: 2024-01-16 00:00:00.000000

"""
from alembic import op
import sqlalchemy as sa

# revision identifiers, used by Alembic.
revision = 'study_buddy_001'
down_revision = 'community_service_001'
branch_labels = None
depends_on = None


def upgrade():
    # Create insight type enum
    insight_type_enum = sa.Enum(
        'schedule_suggestion', 'weakness_alert', 'celebration', 
        'exam_prep', 'stress_check',
        name='insighttype'
    )
    insight_type_enum.create(op.get_bind())
    
    # Create study_buddy_sessions table
    op.create_table(
        'study_buddy_sessions',
        sa.Column('id', sa.Integer(), nullable=False),
        sa.Column('institution_id', sa.Integer(), nullable=False),
        sa.Column('student_id', sa.Integer(), nullable=False),
        sa.Column('conversation_history', sa.JSON(), nullable=False),
        sa.Column('study_patterns', sa.JSON(), nullable=True),
        sa.Column('optimal_study_times', sa.JSON(), nullable=True),
        sa.Column('streak_data', sa.JSON(), nullable=True),
        sa.Column('mood_tracking', sa.JSON(), nullable=True),
        sa.Column('last_interaction', sa.DateTime(), nullable=True),
        sa.Column('created_at', sa.DateTime(), nullable=False),
        sa.Column('updated_at', sa.DateTime(), nullable=False),
        sa.ForeignKeyConstraint(['institution_id'], ['institutions.id'], ondelete='CASCADE'),
        sa.ForeignKeyConstraint(['student_id'], ['students.id'], ondelete='CASCADE'),
        sa.PrimaryKeyConstraint('id')
    )
    op.create_index('idx_study_buddy_session_institution', 'study_buddy_sessions', ['institution_id'])
    op.create_index('idx_study_buddy_session_student', 'study_buddy_sessions', ['student_id'])
    op.create_index('idx_study_buddy_session_last_interaction', 'study_buddy_sessions', ['last_interaction'])
    
    # Create study_buddy_insights table
    op.create_table(
        'study_buddy_insights',
        sa.Column('id', sa.Integer(), nullable=False),
        sa.Column('institution_id', sa.Integer(), nullable=False),
        sa.Column('session_id', sa.Integer(), nullable=False),
        sa.Column('student_id', sa.Integer(), nullable=False),
        sa.Column('insight_type', insight_type_enum, nullable=False),
        sa.Column('content', sa.Text(), nullable=False),
        sa.Column('priority', sa.Integer(), nullable=False, server_default='1'),
        sa.Column('delivered_at', sa.DateTime(), nullable=False),
        sa.Column('is_read', sa.Boolean(), nullable=False, server_default='false'),
        sa.Column('created_at', sa.DateTime(), nullable=False),
        sa.ForeignKeyConstraint(['institution_id'], ['institutions.id'], ondelete='CASCADE'),
        sa.ForeignKeyConstraint(['session_id'], ['study_buddy_sessions.id'], ondelete='CASCADE'),
        sa.ForeignKeyConstraint(['student_id'], ['students.id'], ondelete='CASCADE'),
        sa.PrimaryKeyConstraint('id')
    )
    op.create_index('idx_study_buddy_insight_institution', 'study_buddy_insights', ['institution_id'])
    op.create_index('idx_study_buddy_insight_session', 'study_buddy_insights', ['session_id'])
    op.create_index('idx_study_buddy_insight_student', 'study_buddy_insights', ['student_id'])
    op.create_index('idx_study_buddy_insight_type', 'study_buddy_insights', ['insight_type'])
    op.create_index('idx_study_buddy_insight_delivered', 'study_buddy_insights', ['delivered_at'])
    op.create_index('idx_study_buddy_insight_read', 'study_buddy_insights', ['is_read'])
    
    # Create study_buddy_preferences table
    op.create_table(
        'study_buddy_preferences',
        sa.Column('id', sa.Integer(), nullable=False),
        sa.Column('institution_id', sa.Integer(), nullable=False),
        sa.Column('student_id', sa.Integer(), nullable=False),
        sa.Column('preferred_study_times', sa.JSON(), nullable=True),
        sa.Column('notification_preferences', sa.JSON(), nullable=True),
        sa.Column('learning_style', sa.String(length=50), nullable=True),
        sa.Column('motivation_style', sa.String(length=50), nullable=True),
        sa.Column('ai_personality', sa.String(length=50), nullable=True, server_default='friendly'),
        sa.Column('daily_briefing_enabled', sa.Boolean(), nullable=False, server_default='true'),
        sa.Column('weekly_review_enabled', sa.Boolean(), nullable=False, server_default='true'),
        sa.Column('celebration_enabled', sa.Boolean(), nullable=False, server_default='true'),
        sa.Column('stress_check_enabled', sa.Boolean(), nullable=False, server_default='true'),
        sa.Column('created_at', sa.DateTime(), nullable=False),
        sa.Column('updated_at', sa.DateTime(), nullable=False),
        sa.ForeignKeyConstraint(['institution_id'], ['institutions.id'], ondelete='CASCADE'),
        sa.ForeignKeyConstraint(['student_id'], ['students.id'], ondelete='CASCADE'),
        sa.PrimaryKeyConstraint('id')
    )
    op.create_index('idx_study_buddy_pref_institution', 'study_buddy_preferences', ['institution_id'])
    op.create_index('idx_study_buddy_pref_student', 'study_buddy_preferences', ['student_id'], unique=True)
    op.create_index('idx_study_buddy_pref_daily_briefing', 'study_buddy_preferences', ['daily_briefing_enabled'])


def downgrade():
    # Drop tables in reverse order
    op.drop_index('idx_study_buddy_pref_daily_briefing', 'study_buddy_preferences')
    op.drop_index('idx_study_buddy_pref_student', 'study_buddy_preferences')
    op.drop_index('idx_study_buddy_pref_institution', 'study_buddy_preferences')
    op.drop_table('study_buddy_preferences')
    
    op.drop_index('idx_study_buddy_insight_read', 'study_buddy_insights')
    op.drop_index('idx_study_buddy_insight_delivered', 'study_buddy_insights')
    op.drop_index('idx_study_buddy_insight_type', 'study_buddy_insights')
    op.drop_index('idx_study_buddy_insight_student', 'study_buddy_insights')
    op.drop_index('idx_study_buddy_insight_session', 'study_buddy_insights')
    op.drop_index('idx_study_buddy_insight_institution', 'study_buddy_insights')
    op.drop_table('study_buddy_insights')
    
    op.drop_index('idx_study_buddy_session_last_interaction', 'study_buddy_sessions')
    op.drop_index('idx_study_buddy_session_student', 'study_buddy_sessions')
    op.drop_index('idx_study_buddy_session_institution', 'study_buddy_sessions')
    op.drop_table('study_buddy_sessions')
    
    # Drop enum
    insight_type_enum = sa.Enum(
        'schedule_suggestion', 'weakness_alert', 'celebration', 
        'exam_prep', 'stress_check',
        name='insighttype'
    )
    insight_type_enum.drop(op.get_bind())
