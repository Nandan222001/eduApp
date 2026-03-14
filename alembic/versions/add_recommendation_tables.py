"""add recommendation tables

Revision ID: add_recommendation_tables
Revises: 
Create Date: 2024-01-15 00:00:00.000000

"""
from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql

# revision identifiers, used by Alembic.
revision = 'add_recommendation_tables'
down_revision = None  # Set this to the previous migration ID
branch_labels = None
depends_on = None


def upgrade() -> None:
    # Create external_content table
    op.create_table(
        'external_content',
        sa.Column('id', sa.Integer(), nullable=False),
        sa.Column('institution_id', sa.Integer(), nullable=False),
        sa.Column('source', sa.Enum('khan_academy', 'youtube_edu', 'openstax', 'coursera', 'mit_ocw', 'edx', name='externalcontentsource'), nullable=False),
        sa.Column('external_id', sa.String(length=255), nullable=True),
        sa.Column('title', sa.String(length=500), nullable=False),
        sa.Column('description', sa.Text(), nullable=True),
        sa.Column('url', sa.String(length=1000), nullable=False),
        sa.Column('content_type', sa.String(length=100), nullable=True),
        sa.Column('subject_id', sa.Integer(), nullable=True),
        sa.Column('chapter_id', sa.Integer(), nullable=True),
        sa.Column('topic_id', sa.Integer(), nullable=True),
        sa.Column('difficulty_level', sa.String(length=50), nullable=True),
        sa.Column('estimated_duration_minutes', sa.Integer(), nullable=True),
        sa.Column('language', sa.String(length=10), nullable=False, server_default='en'),
        sa.Column('view_count', sa.Integer(), nullable=False, server_default='0'),
        sa.Column('recommendation_count', sa.Integer(), nullable=False, server_default='0'),
        sa.Column('metadata', postgresql.ARRAY(sa.String()), nullable=True),
        sa.Column('is_active', sa.Boolean(), nullable=False, server_default='true'),
        sa.Column('created_at', sa.DateTime(), nullable=False, server_default=sa.text('now()')),
        sa.Column('updated_at', sa.DateTime(), nullable=False, server_default=sa.text('now()')),
        sa.ForeignKeyConstraint(['institution_id'], ['institutions.id'], ondelete='CASCADE'),
        sa.ForeignKeyConstraint(['subject_id'], ['subjects.id'], ondelete='SET NULL'),
        sa.ForeignKeyConstraint(['chapter_id'], ['chapters.id'], ondelete='SET NULL'),
        sa.ForeignKeyConstraint(['topic_id'], ['topics.id'], ondelete='SET NULL'),
        sa.PrimaryKeyConstraint('id')
    )
    op.create_index('idx_external_content_institution', 'external_content', ['institution_id'])
    op.create_index('idx_external_content_source', 'external_content', ['source'])
    op.create_index('idx_external_content_subject', 'external_content', ['subject_id'])
    op.create_index('idx_external_content_chapter', 'external_content', ['chapter_id'])
    op.create_index('idx_external_content_topic', 'external_content', ['topic_id'])
    op.create_index('idx_external_content_active', 'external_content', ['is_active'])

    # Create external_content_access_logs table
    op.create_table(
        'external_content_access_logs',
        sa.Column('id', sa.Integer(), nullable=False),
        sa.Column('institution_id', sa.Integer(), nullable=False),
        sa.Column('content_id', sa.Integer(), nullable=False),
        sa.Column('user_id', sa.Integer(), nullable=False),
        sa.Column('accessed_at', sa.DateTime(), nullable=False, server_default=sa.text('now()')),
        sa.Column('duration_seconds', sa.Integer(), nullable=True),
        sa.Column('completion_percentage', sa.Integer(), nullable=True),
        sa.ForeignKeyConstraint(['institution_id'], ['institutions.id'], ondelete='CASCADE'),
        sa.ForeignKeyConstraint(['content_id'], ['external_content.id'], ondelete='CASCADE'),
        sa.ForeignKeyConstraint(['user_id'], ['users.id'], ondelete='CASCADE'),
        sa.PrimaryKeyConstraint('id')
    )
    op.create_index('idx_external_access_institution', 'external_content_access_logs', ['institution_id'])
    op.create_index('idx_external_access_content', 'external_content_access_logs', ['content_id'])
    op.create_index('idx_external_access_user', 'external_content_access_logs', ['user_id'])
    op.create_index('idx_external_access_time', 'external_content_access_logs', ['accessed_at'])

    # Create content_effectiveness_scores table
    op.create_table(
        'content_effectiveness_scores',
        sa.Column('id', sa.Integer(), nullable=False),
        sa.Column('institution_id', sa.Integer(), nullable=False),
        sa.Column('material_id', sa.Integer(), nullable=True),
        sa.Column('external_content_id', sa.Integer(), nullable=True),
        sa.Column('effectiveness_score', sa.Numeric(precision=5, scale=2), nullable=False),
        sa.Column('avg_improvement', sa.Numeric(precision=5, scale=2), nullable=False),
        sa.Column('engagement_score', sa.Numeric(precision=5, scale=2), nullable=False),
        sa.Column('performance_correlation', sa.Numeric(precision=5, scale=2), nullable=False),
        sa.Column('unique_students', sa.Integer(), nullable=False, server_default='0'),
        sa.Column('total_accesses', sa.Integer(), nullable=False, server_default='0'),
        sa.Column('positive_outcomes', sa.Integer(), nullable=False, server_default='0'),
        sa.Column('last_calculated_at', sa.DateTime(), nullable=False, server_default=sa.text('now()')),
        sa.Column('created_at', sa.DateTime(), nullable=False, server_default=sa.text('now()')),
        sa.Column('updated_at', sa.DateTime(), nullable=False, server_default=sa.text('now()')),
        sa.ForeignKeyConstraint(['institution_id'], ['institutions.id'], ondelete='CASCADE'),
        sa.ForeignKeyConstraint(['material_id'], ['study_materials.id'], ondelete='CASCADE'),
        sa.ForeignKeyConstraint(['external_content_id'], ['external_content.id'], ondelete='CASCADE'),
        sa.PrimaryKeyConstraint('id')
    )
    op.create_index('idx_effectiveness_institution', 'content_effectiveness_scores', ['institution_id'])
    op.create_index('idx_effectiveness_material', 'content_effectiveness_scores', ['material_id'])
    op.create_index('idx_effectiveness_external', 'content_effectiveness_scores', ['external_content_id'])
    op.create_index('idx_effectiveness_score', 'content_effectiveness_scores', ['effectiveness_score'])

    # Create student_learning_preferences table
    op.create_table(
        'student_learning_preferences',
        sa.Column('id', sa.Integer(), nullable=False),
        sa.Column('institution_id', sa.Integer(), nullable=False),
        sa.Column('student_id', sa.Integer(), nullable=False),
        sa.Column('visual_score', sa.Numeric(precision=5, scale=2), nullable=False, server_default='0.25'),
        sa.Column('auditory_score', sa.Numeric(precision=5, scale=2), nullable=False, server_default='0.25'),
        sa.Column('reading_writing_score', sa.Numeric(precision=5, scale=2), nullable=False, server_default='0.25'),
        sa.Column('kinesthetic_score', sa.Numeric(precision=5, scale=2), nullable=False, server_default='0.25'),
        sa.Column('dominant_style', sa.String(length=50), nullable=True),
        sa.Column('confidence_level', sa.Numeric(precision=5, scale=2), nullable=True),
        sa.Column('video_preference_weight', sa.Numeric(precision=5, scale=2), nullable=True),
        sa.Column('audio_preference_weight', sa.Numeric(precision=5, scale=2), nullable=True),
        sa.Column('text_preference_weight', sa.Numeric(precision=5, scale=2), nullable=True),
        sa.Column('interactive_preference_weight', sa.Numeric(precision=5, scale=2), nullable=True),
        sa.Column('total_materials_accessed', sa.Integer(), nullable=False, server_default='0'),
        sa.Column('last_updated_at', sa.DateTime(), nullable=False, server_default=sa.text('now()')),
        sa.Column('created_at', sa.DateTime(), nullable=False, server_default=sa.text('now()')),
        sa.Column('updated_at', sa.DateTime(), nullable=False, server_default=sa.text('now()')),
        sa.ForeignKeyConstraint(['institution_id'], ['institutions.id'], ondelete='CASCADE'),
        sa.ForeignKeyConstraint(['student_id'], ['students.id'], ondelete='CASCADE'),
        sa.PrimaryKeyConstraint('id'),
        sa.UniqueConstraint('student_id', name='uq_student_learning_preference')
    )
    op.create_index('idx_learning_pref_institution', 'student_learning_preferences', ['institution_id'])
    op.create_index('idx_learning_pref_student', 'student_learning_preferences', ['student_id'])
    op.create_index('idx_learning_pref_style', 'student_learning_preferences', ['dominant_style'])


def downgrade() -> None:
    # Drop tables in reverse order
    op.drop_index('idx_learning_pref_style', table_name='student_learning_preferences')
    op.drop_index('idx_learning_pref_student', table_name='student_learning_preferences')
    op.drop_index('idx_learning_pref_institution', table_name='student_learning_preferences')
    op.drop_table('student_learning_preferences')

    op.drop_index('idx_effectiveness_score', table_name='content_effectiveness_scores')
    op.drop_index('idx_effectiveness_external', table_name='content_effectiveness_scores')
    op.drop_index('idx_effectiveness_material', table_name='content_effectiveness_scores')
    op.drop_index('idx_effectiveness_institution', table_name='content_effectiveness_scores')
    op.drop_table('content_effectiveness_scores')

    op.drop_index('idx_external_access_time', table_name='external_content_access_logs')
    op.drop_index('idx_external_access_user', table_name='external_content_access_logs')
    op.drop_index('idx_external_access_content', table_name='external_content_access_logs')
    op.drop_index('idx_external_access_institution', table_name='external_content_access_logs')
    op.drop_table('external_content_access_logs')

    op.drop_index('idx_external_content_active', table_name='external_content')
    op.drop_index('idx_external_content_topic', table_name='external_content')
    op.drop_index('idx_external_content_chapter', table_name='external_content')
    op.drop_index('idx_external_content_subject', table_name='external_content')
    op.drop_index('idx_external_content_source', table_name='external_content')
    op.drop_index('idx_external_content_institution', table_name='external_content')
    op.drop_table('external_content')

    # Drop enum type
    op.execute('DROP TYPE IF EXISTS externalcontentsource')
