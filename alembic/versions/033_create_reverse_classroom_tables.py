"""create reverse classroom tables

Revision ID: reverse_classroom_001
Revises: mistake_analysis_001
Create Date: 2024-01-19 00:00:00.000000

"""
from alembic import op
import sqlalchemy as sa

revision = 'reverse_classroom_001'
down_revision = 'mistake_analysis_001'
branch_labels = None
depends_on = None


def upgrade():
    # Create enums
    explanation_type_enum = sa.Enum(
        'text', 'voice', 'video',
        name='explanationtype'
    )
    explanation_type_enum.create(op.get_bind())
    
    difficulty_level_enum = sa.Enum(
        'explain_to_5yo', 'explain_to_10yo', 'explain_to_college', 'explain_in_30s',
        name='difficultylevel'
    )
    difficulty_level_enum.create(op.get_bind())
    
    # Create teaching_sessions table
    op.create_table(
        'teaching_sessions',
        sa.Column('id', sa.Integer(), nullable=False),
        sa.Column('institution_id', sa.Integer(), nullable=False),
        sa.Column('student_id', sa.Integer(), nullable=False),
        sa.Column('topic_id', sa.Integer(), nullable=False),
        sa.Column('explanation_type', explanation_type_enum, nullable=False),
        sa.Column('explanation_content', sa.Text(), nullable=False),
        sa.Column('ai_analysis', sa.JSON(), nullable=True),
        sa.Column('correctly_explained', sa.JSON(), nullable=True),
        sa.Column('missing_concepts', sa.JSON(), nullable=True),
        sa.Column('confused_concepts', sa.JSON(), nullable=True),
        sa.Column('understanding_level_percent', sa.Float(), nullable=True),
        sa.Column('clarity_score', sa.Float(), nullable=True),
        sa.Column('duration_seconds', sa.Integer(), nullable=True),
        sa.Column('word_count', sa.Integer(), nullable=True),
        sa.Column('is_analyzed', sa.Boolean(), nullable=False, server_default='false'),
        sa.Column('created_at', sa.DateTime(), nullable=False),
        sa.Column('updated_at', sa.DateTime(), nullable=False),
        sa.ForeignKeyConstraint(['institution_id'], ['institutions.id'], ondelete='CASCADE'),
        sa.ForeignKeyConstraint(['student_id'], ['students.id'], ondelete='CASCADE'),
        sa.ForeignKeyConstraint(['topic_id'], ['topics.id'], ondelete='CASCADE'),
        sa.PrimaryKeyConstraint('id')
    )
    
    # Create indexes for teaching_sessions
    op.create_index('idx_teaching_session_institution', 'teaching_sessions', ['institution_id'])
    op.create_index('idx_teaching_session_student', 'teaching_sessions', ['student_id'])
    op.create_index('idx_teaching_session_topic', 'teaching_sessions', ['topic_id'])
    op.create_index('idx_teaching_session_type', 'teaching_sessions', ['explanation_type'])
    op.create_index('idx_teaching_session_analyzed', 'teaching_sessions', ['is_analyzed'])
    op.create_index('idx_teaching_session_created', 'teaching_sessions', ['created_at'])
    
    # Create teaching_challenges table
    op.create_table(
        'teaching_challenges',
        sa.Column('id', sa.Integer(), nullable=False),
        sa.Column('institution_id', sa.Integer(), nullable=False),
        sa.Column('session_id', sa.Integer(), nullable=False),
        sa.Column('student_id', sa.Integer(), nullable=False),
        sa.Column('difficulty', difficulty_level_enum, nullable=False),
        sa.Column('challenge_prompt', sa.Text(), nullable=False),
        sa.Column('student_response', sa.Text(), nullable=True),
        sa.Column('completed', sa.Boolean(), nullable=False, server_default='false'),
        sa.Column('score', sa.Float(), nullable=True),
        sa.Column('ai_feedback', sa.JSON(), nullable=True),
        sa.Column('strengths', sa.JSON(), nullable=True),
        sa.Column('areas_for_improvement', sa.JSON(), nullable=True),
        sa.Column('completed_at', sa.DateTime(), nullable=True),
        sa.Column('created_at', sa.DateTime(), nullable=False),
        sa.Column('updated_at', sa.DateTime(), nullable=False),
        sa.ForeignKeyConstraint(['institution_id'], ['institutions.id'], ondelete='CASCADE'),
        sa.ForeignKeyConstraint(['session_id'], ['teaching_sessions.id'], ondelete='CASCADE'),
        sa.ForeignKeyConstraint(['student_id'], ['students.id'], ondelete='CASCADE'),
        sa.PrimaryKeyConstraint('id')
    )
    
    # Create indexes for teaching_challenges
    op.create_index('idx_teaching_challenge_institution', 'teaching_challenges', ['institution_id'])
    op.create_index('idx_teaching_challenge_session', 'teaching_challenges', ['session_id'])
    op.create_index('idx_teaching_challenge_student', 'teaching_challenges', ['student_id'])
    op.create_index('idx_teaching_challenge_difficulty', 'teaching_challenges', ['difficulty'])
    op.create_index('idx_teaching_challenge_completed', 'teaching_challenges', ['completed'])
    op.create_index('idx_teaching_challenge_created', 'teaching_challenges', ['created_at'])


def downgrade():
    # Drop teaching_challenges table and indexes
    op.drop_index('idx_teaching_challenge_created', 'teaching_challenges')
    op.drop_index('idx_teaching_challenge_completed', 'teaching_challenges')
    op.drop_index('idx_teaching_challenge_difficulty', 'teaching_challenges')
    op.drop_index('idx_teaching_challenge_student', 'teaching_challenges')
    op.drop_index('idx_teaching_challenge_session', 'teaching_challenges')
    op.drop_index('idx_teaching_challenge_institution', 'teaching_challenges')
    op.drop_table('teaching_challenges')
    
    # Drop teaching_sessions table and indexes
    op.drop_index('idx_teaching_session_created', 'teaching_sessions')
    op.drop_index('idx_teaching_session_analyzed', 'teaching_sessions')
    op.drop_index('idx_teaching_session_type', 'teaching_sessions')
    op.drop_index('idx_teaching_session_topic', 'teaching_sessions')
    op.drop_index('idx_teaching_session_student', 'teaching_sessions')
    op.drop_index('idx_teaching_session_institution', 'teaching_sessions')
    op.drop_table('teaching_sessions')
    
    # Drop enums
    difficulty_level_enum = sa.Enum(name='difficultylevel')
    difficulty_level_enum.drop(op.get_bind())
    
    explanation_type_enum = sa.Enum(name='explanationtype')
    explanation_type_enum.drop(op.get_bind())
