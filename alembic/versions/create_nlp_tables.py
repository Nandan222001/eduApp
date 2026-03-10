"""create nlp tables

Revision ID: nlp_phase2_001
Revises: 
Create Date: 2024-01-15 12:00:00.000000

"""
from alembic import op
import sqlalchemy as sa


revision = 'nlp_phase2_001'
down_revision = None
depends_on = None


def upgrade():
    op.create_table(
        'question_embeddings',
        sa.Column('id', sa.Integer(), nullable=False),
        sa.Column('question_id', sa.Integer(), nullable=False),
        sa.Column('embedding_model', sa.String(length=100), nullable=False),
        sa.Column('embedding_vector', sa.Text(), nullable=False),
        sa.Column('embedding_dimension', sa.Integer(), nullable=False),
        sa.Column('created_at', sa.DateTime(), nullable=False),
        sa.Column('updated_at', sa.DateTime(), nullable=False),
        sa.ForeignKeyConstraint(['question_id'], ['questions_bank.id'], ondelete='CASCADE'),
        sa.PrimaryKeyConstraint('id'),
        sa.UniqueConstraint('question_id')
    )
    op.create_index('idx_qe_question', 'question_embeddings', ['question_id'])
    op.create_index('idx_qe_model', 'question_embeddings', ['embedding_model'])

    op.create_table(
        'question_clusters',
        sa.Column('id', sa.Integer(), nullable=False),
        sa.Column('institution_id', sa.Integer(), nullable=False),
        sa.Column('cluster_id', sa.Integer(), nullable=False),
        sa.Column('grade_id', sa.Integer(), nullable=False),
        sa.Column('subject_id', sa.Integer(), nullable=False),
        sa.Column('cluster_label', sa.String(length=255), nullable=True),
        sa.Column('cluster_size', sa.Integer(), nullable=False, server_default='0'),
        sa.Column('representative_question_id', sa.Integer(), nullable=True),
        sa.Column('centroid_vector', sa.Text(), nullable=True),
        sa.Column('avg_difficulty', sa.String(length=50), nullable=True),
        sa.Column('dominant_bloom_level', sa.String(length=50), nullable=True),
        sa.Column('clustering_algorithm', sa.String(length=50), nullable=False, server_default='hdbscan'),
        sa.Column('clustering_metadata', sa.Text(), nullable=True),
        sa.Column('created_at', sa.DateTime(), nullable=False),
        sa.Column('updated_at', sa.DateTime(), nullable=False),
        sa.ForeignKeyConstraint(['institution_id'], ['institutions.id'], ondelete='CASCADE'),
        sa.ForeignKeyConstraint(['grade_id'], ['grades.id'], ondelete='CASCADE'),
        sa.ForeignKeyConstraint(['subject_id'], ['subjects.id'], ondelete='CASCADE'),
        sa.ForeignKeyConstraint(['representative_question_id'], ['questions_bank.id'], ondelete='SET NULL'),
        sa.PrimaryKeyConstraint('id')
    )
    op.create_index('idx_qc_institution', 'question_clusters', ['institution_id'])
    op.create_index('idx_qc_cluster_id', 'question_clusters', ['cluster_id'])
    op.create_index('idx_qc_grade_subject', 'question_clusters', ['grade_id', 'subject_id'])

    op.create_table(
        'question_cluster_members',
        sa.Column('id', sa.Integer(), nullable=False),
        sa.Column('cluster_table_id', sa.Integer(), nullable=False),
        sa.Column('question_id', sa.Integer(), nullable=False),
        sa.Column('similarity_score', sa.Float(), nullable=True),
        sa.Column('distance_to_centroid', sa.Float(), nullable=True),
        sa.Column('created_at', sa.DateTime(), nullable=False),
        sa.ForeignKeyConstraint(['cluster_table_id'], ['question_clusters.id'], ondelete='CASCADE'),
        sa.ForeignKeyConstraint(['question_id'], ['questions_bank.id'], ondelete='CASCADE'),
        sa.PrimaryKeyConstraint('id')
    )
    op.create_index('idx_qcm_cluster', 'question_cluster_members', ['cluster_table_id'])
    op.create_index('idx_qcm_question', 'question_cluster_members', ['question_id'])

    op.create_table(
        'question_variations',
        sa.Column('id', sa.Integer(), nullable=False),
        sa.Column('original_question_id', sa.Integer(), nullable=False),
        sa.Column('institution_id', sa.Integer(), nullable=False),
        sa.Column('variation_text', sa.Text(), nullable=False),
        sa.Column('variation_type', sa.String(length=50), nullable=False),
        sa.Column('question_type', sa.Enum('MULTIPLE_CHOICE', 'SHORT_ANSWER', 'LONG_ANSWER', 'TRUE_FALSE', 
                                           'FILL_IN_BLANK', 'NUMERICAL', 'MATCH_THE_FOLLOWING', 
                                           'ASSERTION_REASONING', name='questiontype'), nullable=False),
        sa.Column('difficulty_level', sa.Enum('VERY_EASY', 'EASY', 'MEDIUM', 'HARD', 'VERY_HARD', 
                                              name='difficultylevel'), nullable=False),
        sa.Column('bloom_taxonomy_level', sa.Enum('REMEMBER', 'UNDERSTAND', 'APPLY', 'ANALYZE', 
                                                   'EVALUATE', 'CREATE', name='bloomtaxonomylevel'), nullable=False),
        sa.Column('options', sa.Text(), nullable=True),
        sa.Column('correct_option', sa.String(length=10), nullable=True),
        sa.Column('answer_text', sa.Text(), nullable=True),
        sa.Column('explanation', sa.Text(), nullable=True),
        sa.Column('similarity_score', sa.Float(), nullable=True),
        sa.Column('generation_method', sa.String(length=50), nullable=False, server_default='ai'),
        sa.Column('generation_metadata', sa.Text(), nullable=True),
        sa.Column('is_verified', sa.Boolean(), nullable=False, server_default='false'),
        sa.Column('verified_by', sa.Integer(), nullable=True),
        sa.Column('verified_at', sa.DateTime(), nullable=True),
        sa.Column('is_active', sa.Boolean(), nullable=False, server_default='true'),
        sa.Column('usage_count', sa.Integer(), nullable=False, server_default='0'),
        sa.Column('created_by', sa.Integer(), nullable=True),
        sa.Column('created_at', sa.DateTime(), nullable=False),
        sa.Column('updated_at', sa.DateTime(), nullable=False),
        sa.ForeignKeyConstraint(['original_question_id'], ['questions_bank.id'], ondelete='CASCADE'),
        sa.ForeignKeyConstraint(['institution_id'], ['institutions.id'], ondelete='CASCADE'),
        sa.ForeignKeyConstraint(['created_by'], ['users.id'], ondelete='SET NULL'),
        sa.ForeignKeyConstraint(['verified_by'], ['users.id'], ondelete='SET NULL'),
        sa.PrimaryKeyConstraint('id')
    )
    op.create_index('idx_qv_original', 'question_variations', ['original_question_id'])
    op.create_index('idx_qv_institution', 'question_variations', ['institution_id'])
    op.create_index('idx_qv_type', 'question_variations', ['variation_type'])
    op.create_index('idx_qv_active', 'question_variations', ['is_active'])

    op.create_table(
        'question_blueprints',
        sa.Column('id', sa.Integer(), nullable=False),
        sa.Column('institution_id', sa.Integer(), nullable=False),
        sa.Column('blueprint_name', sa.String(length=255), nullable=False),
        sa.Column('description', sa.Text(), nullable=True),
        sa.Column('board', sa.Enum('CBSE', 'ICSE', 'STATE_BOARD', 'IB', 'CAMBRIDGE', 'OTHER', 
                                   name='board'), nullable=False),
        sa.Column('grade_id', sa.Integer(), nullable=False),
        sa.Column('subject_id', sa.Integer(), nullable=False),
        sa.Column('total_marks', sa.Integer(), nullable=False),
        sa.Column('duration_minutes', sa.Integer(), nullable=False),
        sa.Column('difficulty_distribution', sa.Text(), nullable=False),
        sa.Column('bloom_taxonomy_distribution', sa.Text(), nullable=False),
        sa.Column('question_type_distribution', sa.Text(), nullable=False),
        sa.Column('chapter_weightage', sa.Text(), nullable=True),
        sa.Column('blueprint_metadata', sa.Text(), nullable=True),
        sa.Column('is_active', sa.Boolean(), nullable=False, server_default='true'),
        sa.Column('created_by', sa.Integer(), nullable=True),
        sa.Column('created_at', sa.DateTime(), nullable=False),
        sa.Column('updated_at', sa.DateTime(), nullable=False),
        sa.ForeignKeyConstraint(['institution_id'], ['institutions.id'], ondelete='CASCADE'),
        sa.ForeignKeyConstraint(['grade_id'], ['grades.id'], ondelete='CASCADE'),
        sa.ForeignKeyConstraint(['subject_id'], ['subjects.id'], ondelete='CASCADE'),
        sa.ForeignKeyConstraint(['created_by'], ['users.id'], ondelete='SET NULL'),
        sa.PrimaryKeyConstraint('id')
    )
    op.create_index('idx_qbp_institution', 'question_blueprints', ['institution_id'])
    op.create_index('idx_qbp_board', 'question_blueprints', ['board'])
    op.create_index('idx_qbp_grade_subject', 'question_blueprints', ['grade_id', 'subject_id'])
    op.create_index('idx_qbp_active', 'question_blueprints', ['is_active'])


def downgrade():
    op.drop_index('idx_qbp_active', 'question_blueprints')
    op.drop_index('idx_qbp_grade_subject', 'question_blueprints')
    op.drop_index('idx_qbp_board', 'question_blueprints')
    op.drop_index('idx_qbp_institution', 'question_blueprints')
    op.drop_table('question_blueprints')
    
    op.drop_index('idx_qv_active', 'question_variations')
    op.drop_index('idx_qv_type', 'question_variations')
    op.drop_index('idx_qv_institution', 'question_variations')
    op.drop_index('idx_qv_original', 'question_variations')
    op.drop_table('question_variations')
    
    op.drop_index('idx_qcm_question', 'question_cluster_members')
    op.drop_index('idx_qcm_cluster', 'question_cluster_members')
    op.drop_table('question_cluster_members')
    
    op.drop_index('idx_qc_grade_subject', 'question_clusters')
    op.drop_index('idx_qc_cluster_id', 'question_clusters')
    op.drop_index('idx_qc_institution', 'question_clusters')
    op.drop_table('question_clusters')
    
    op.drop_index('idx_qe_model', 'question_embeddings')
    op.drop_index('idx_qe_question', 'question_embeddings')
    op.drop_table('question_embeddings')
