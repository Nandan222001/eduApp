"""add doubt intelligence tables

Revision ID: doubt_intelligence_001
Revises: 
Create Date: 2024-01-15 10:00:00.000000

"""
from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql

revision = 'doubt_intelligence_001'
down_revision = None
branch_labels = None
depends_on = None


def upgrade():
    op.add_column('doubt_posts', sa.Column('auto_generated_tags', postgresql.ARRAY(sa.String()), nullable=True))
    op.add_column('doubt_posts', sa.Column('priority', sa.Enum('LOW', 'MEDIUM', 'HIGH', 'URGENT', name='doubtpriority'), nullable=False, server_default='MEDIUM'))
    op.add_column('doubt_posts', sa.Column('difficulty', sa.Enum('EASY', 'MEDIUM', 'HARD', 'EXPERT', name='doubtdifficulty'), nullable=True))
    op.add_column('doubt_posts', sa.Column('priority_score', sa.Float(), nullable=False, server_default='0.0'))
    op.add_column('doubt_posts', sa.Column('urgency_score', sa.Float(), nullable=False, server_default='0.0'))
    op.add_column('doubt_posts', sa.Column('difficulty_score', sa.Float(), nullable=False, server_default='0.0'))
    op.add_column('doubt_posts', sa.Column('assigned_teacher_id', sa.Integer(), nullable=True))
    op.add_column('doubt_posts', sa.Column('auto_assigned', sa.Boolean(), nullable=False, server_default='false'))
    op.add_column('doubt_posts', sa.Column('assignment_score', sa.Float(), nullable=True))
    op.add_column('doubt_posts', sa.Column('has_suggested_answers', sa.Boolean(), nullable=False, server_default='false'))
    op.add_column('doubt_posts', sa.Column('suggestion_count', sa.Integer(), nullable=False, server_default='0'))
    
    op.create_foreign_key('fk_doubt_posts_assigned_teacher', 'doubt_posts', 'teachers', ['assigned_teacher_id'], ['id'], ondelete='SET NULL')
    
    op.create_index('idx_doubt_post_priority', 'doubt_posts', ['priority'])
    op.create_index('idx_doubt_post_priority_score', 'doubt_posts', ['priority_score'])
    op.create_index('idx_doubt_post_assigned_teacher', 'doubt_posts', ['assigned_teacher_id'])
    op.create_index('idx_doubt_post_auto_tags', 'doubt_posts', ['auto_generated_tags'], postgresql_using='gin')
    
    op.create_table('doubt_embeddings',
        sa.Column('id', sa.Integer(), nullable=False),
        sa.Column('doubt_id', sa.Integer(), nullable=False),
        sa.Column('embedding_model', sa.String(length=100), nullable=False, server_default='all-MiniLM-L6-v2'),
        sa.Column('embedding_vector', sa.Text(), nullable=False),
        sa.Column('embedding_dimension', sa.Integer(), nullable=False),
        sa.Column('created_at', sa.DateTime(), nullable=False, server_default=sa.text('now()')),
        sa.Column('updated_at', sa.DateTime(), nullable=False, server_default=sa.text('now()')),
        sa.ForeignKeyConstraint(['doubt_id'], ['doubt_posts.id'], ondelete='CASCADE'),
        sa.PrimaryKeyConstraint('id'),
        sa.UniqueConstraint('doubt_id')
    )
    op.create_index('idx_doubt_embedding_doubt', 'doubt_embeddings', ['doubt_id'])
    op.create_index('idx_doubt_embedding_model', 'doubt_embeddings', ['embedding_model'])
    
    op.create_table('similar_doubts',
        sa.Column('id', sa.Integer(), nullable=False),
        sa.Column('doubt_id', sa.Integer(), nullable=False),
        sa.Column('similar_doubt_id', sa.Integer(), nullable=False),
        sa.Column('institution_id', sa.Integer(), nullable=False),
        sa.Column('similarity_score', sa.Float(), nullable=False),
        sa.Column('semantic_similarity', sa.Float(), nullable=True),
        sa.Column('keyword_similarity', sa.Float(), nullable=True),
        sa.Column('created_at', sa.DateTime(), nullable=False, server_default=sa.text('now()')),
        sa.ForeignKeyConstraint(['doubt_id'], ['doubt_posts.id'], ondelete='CASCADE'),
        sa.ForeignKeyConstraint(['similar_doubt_id'], ['doubt_posts.id'], ondelete='CASCADE'),
        sa.ForeignKeyConstraint(['institution_id'], ['institutions.id'], ondelete='CASCADE'),
        sa.PrimaryKeyConstraint('id'),
        sa.UniqueConstraint('doubt_id', 'similar_doubt_id', name='uq_doubt_similar_doubt')
    )
    op.create_index('idx_similar_doubt_doubt', 'similar_doubts', ['doubt_id'])
    op.create_index('idx_similar_doubt_similar', 'similar_doubts', ['similar_doubt_id'])
    op.create_index('idx_similar_doubt_institution', 'similar_doubts', ['institution_id'])
    op.create_index('idx_similar_doubt_score', 'similar_doubts', ['similarity_score'])
    
    op.create_table('doubt_suggested_answers',
        sa.Column('id', sa.Integer(), nullable=False),
        sa.Column('doubt_id', sa.Integer(), nullable=False),
        sa.Column('institution_id', sa.Integer(), nullable=False),
        sa.Column('source_type', sa.String(length=50), nullable=False),
        sa.Column('source_id', sa.Integer(), nullable=True),
        sa.Column('suggested_content', sa.Text(), nullable=False),
        sa.Column('confidence_score', sa.Float(), nullable=False),
        sa.Column('relevance_score', sa.Float(), nullable=True),
        sa.Column('source_metadata', sa.Text(), nullable=True),
        sa.Column('is_helpful', sa.Boolean(), nullable=True),
        sa.Column('helpful_votes', sa.Integer(), nullable=False, server_default='0'),
        sa.Column('created_at', sa.DateTime(), nullable=False, server_default=sa.text('now()')),
        sa.ForeignKeyConstraint(['doubt_id'], ['doubt_posts.id'], ondelete='CASCADE'),
        sa.ForeignKeyConstraint(['institution_id'], ['institutions.id'], ondelete='CASCADE'),
        sa.PrimaryKeyConstraint('id')
    )
    op.create_index('idx_doubt_suggestion_doubt', 'doubt_suggested_answers', ['doubt_id'])
    op.create_index('idx_doubt_suggestion_institution', 'doubt_suggested_answers', ['institution_id'])
    op.create_index('idx_doubt_suggestion_source_type', 'doubt_suggested_answers', ['source_type'])
    op.create_index('idx_doubt_suggestion_confidence', 'doubt_suggested_answers', ['confidence_score'])
    
    op.create_table('teacher_doubt_stats',
        sa.Column('id', sa.Integer(), nullable=False),
        sa.Column('teacher_id', sa.Integer(), nullable=False),
        sa.Column('institution_id', sa.Integer(), nullable=False),
        sa.Column('subject_id', sa.Integer(), nullable=True),
        sa.Column('total_assigned', sa.Integer(), nullable=False, server_default='0'),
        sa.Column('total_answered', sa.Integer(), nullable=False, server_default='0'),
        sa.Column('total_accepted', sa.Integer(), nullable=False, server_default='0'),
        sa.Column('active_doubts', sa.Integer(), nullable=False, server_default='0'),
        sa.Column('avg_response_time_minutes', sa.Float(), nullable=True),
        sa.Column('avg_rating', sa.Float(), nullable=True),
        sa.Column('expertise_score', sa.Float(), nullable=False, server_default='0.0'),
        sa.Column('workload_score', sa.Float(), nullable=False, server_default='0.0'),
        sa.Column('availability_score', sa.Float(), nullable=False, server_default='1.0'),
        sa.Column('last_assigned_at', sa.DateTime(), nullable=True),
        sa.Column('created_at', sa.DateTime(), nullable=False, server_default=sa.text('now()')),
        sa.Column('updated_at', sa.DateTime(), nullable=False, server_default=sa.text('now()')),
        sa.ForeignKeyConstraint(['teacher_id'], ['teachers.id'], ondelete='CASCADE'),
        sa.ForeignKeyConstraint(['institution_id'], ['institutions.id'], ondelete='CASCADE'),
        sa.ForeignKeyConstraint(['subject_id'], ['subjects.id'], ondelete='CASCADE'),
        sa.PrimaryKeyConstraint('id'),
        sa.UniqueConstraint('teacher_id', 'subject_id', name='uq_teacher_subject_stats')
    )
    op.create_index('idx_teacher_doubt_stats_teacher', 'teacher_doubt_stats', ['teacher_id'])
    op.create_index('idx_teacher_doubt_stats_institution', 'teacher_doubt_stats', ['institution_id'])
    op.create_index('idx_teacher_doubt_stats_subject', 'teacher_doubt_stats', ['subject_id'])
    op.create_index('idx_teacher_doubt_stats_expertise', 'teacher_doubt_stats', ['expertise_score'])
    op.create_index('idx_teacher_doubt_stats_workload', 'teacher_doubt_stats', ['workload_score'])


def downgrade():
    op.drop_table('teacher_doubt_stats')
    op.drop_table('doubt_suggested_answers')
    op.drop_table('similar_doubts')
    op.drop_table('doubt_embeddings')
    
    op.drop_index('idx_doubt_post_auto_tags', 'doubt_posts')
    op.drop_index('idx_doubt_post_assigned_teacher', 'doubt_posts')
    op.drop_index('idx_doubt_post_priority_score', 'doubt_posts')
    op.drop_index('idx_doubt_post_priority', 'doubt_posts')
    
    op.drop_constraint('fk_doubt_posts_assigned_teacher', 'doubt_posts', type_='foreignkey')
    
    op.drop_column('doubt_posts', 'suggestion_count')
    op.drop_column('doubt_posts', 'has_suggested_answers')
    op.drop_column('doubt_posts', 'assignment_score')
    op.drop_column('doubt_posts', 'auto_assigned')
    op.drop_column('doubt_posts', 'assigned_teacher_id')
    op.drop_column('doubt_posts', 'difficulty_score')
    op.drop_column('doubt_posts', 'urgency_score')
    op.drop_column('doubt_posts', 'priority_score')
    op.drop_column('doubt_posts', 'difficulty')
    op.drop_column('doubt_posts', 'priority')
    op.drop_column('doubt_posts', 'auto_generated_tags')
    
    sa.Enum(name='doubtdifficulty').drop(op.get_bind())
    sa.Enum(name='doubtpriority').drop(op.get_bind())
