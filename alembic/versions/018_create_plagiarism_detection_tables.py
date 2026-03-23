"""create plagiarism detection tables

Revision ID: 018
Revises: 018a_impersonation_debug
Create Date: 2024-01-15 10:00:00.000000

"""
from alembic import op
import sqlalchemy as sa

revision = '018'
down_revision = '018a_impersonation_debug'
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.create_table(
        'plagiarism_checks',
        sa.Column('id', sa.Integer(), nullable=False),
        sa.Column('institution_id', sa.Integer(), nullable=False),
        sa.Column('assignment_id', sa.Integer(), nullable=False),
        sa.Column('submission_id', sa.Integer(), nullable=True),
        sa.Column('content_type', sa.Enum('TEXT', 'SOURCE_CODE', 'MIXED', name='contenttype'), nullable=False),
        sa.Column('comparison_scope', sa.Enum('WITHIN_BATCH', 'CROSS_BATCH', 'CROSS_INSTITUTION', 'ALL', name='comparisonscope'), nullable=False),
        sa.Column('enable_cross_institution', sa.Boolean(), nullable=False, server_default='false'),
        sa.Column('anonymize_cross_institution', sa.Boolean(), nullable=False, server_default='true'),
        sa.Column('status', sa.Enum('PENDING', 'PROCESSING', 'COMPLETED', 'FAILED', name='plagiarismcheckstatus'), nullable=False),
        sa.Column('error_message', sa.Text(), nullable=True),
        sa.Column('total_comparisons', sa.Integer(), nullable=False, server_default='0'),
        sa.Column('matches_found', sa.Integer(), nullable=False, server_default='0'),
        sa.Column('processing_time_seconds', sa.Float(), nullable=True),
        sa.Column('check_settings', sa.JSON(), nullable=True),
        sa.Column('started_at', sa.DateTime(), nullable=True),
        sa.Column('completed_at', sa.DateTime(), nullable=True),
        sa.Column('created_at', sa.DateTime(), nullable=False),
        sa.Column('updated_at', sa.DateTime(), nullable=False),
        sa.ForeignKeyConstraint(['institution_id'], ['institutions.id'], ondelete='CASCADE'),
        sa.ForeignKeyConstraint(['assignment_id'], ['assignments.id'], ondelete='CASCADE'),
        sa.ForeignKeyConstraint(['submission_id'], ['submissions.id'], ondelete='CASCADE'),
        sa.PrimaryKeyConstraint('id')
    )
    op.create_index('idx_plagiarism_check_institution', 'plagiarism_checks', ['institution_id'])
    op.create_index('idx_plagiarism_check_assignment', 'plagiarism_checks', ['assignment_id'])
    op.create_index('idx_plagiarism_check_submission', 'plagiarism_checks', ['submission_id'])
    op.create_index('idx_plagiarism_check_status', 'plagiarism_checks', ['status'])
    
    op.create_table(
        'plagiarism_results',
        sa.Column('id', sa.Integer(), nullable=False),
        sa.Column('check_id', sa.Integer(), nullable=False),
        sa.Column('submission_id', sa.Integer(), nullable=False),
        sa.Column('matched_submission_id', sa.Integer(), nullable=True),
        sa.Column('similarity_score', sa.Float(), nullable=False),
        sa.Column('text_similarity', sa.Float(), nullable=True),
        sa.Column('code_similarity', sa.Float(), nullable=True),
        sa.Column('matched_segments_count', sa.Integer(), nullable=False, server_default='0'),
        sa.Column('matched_text_percentage', sa.Float(), nullable=False, server_default='0.0'),
        sa.Column('is_external_source', sa.Boolean(), nullable=False, server_default='false'),
        sa.Column('external_source_info', sa.JSON(), nullable=True),
        sa.Column('is_cross_institution', sa.Boolean(), nullable=False, server_default='false'),
        sa.Column('anonymized_match_info', sa.JSON(), nullable=True),
        sa.Column('has_citations', sa.Boolean(), nullable=False, server_default='false'),
        sa.Column('citation_info', sa.JSON(), nullable=True),
        sa.Column('is_false_positive', sa.Boolean(), nullable=False, server_default='false'),
        sa.Column('false_positive_reason', sa.Text(), nullable=True),
        sa.Column('review_status', sa.String(50), nullable=True),
        sa.Column('reviewed_by', sa.Integer(), nullable=True),
        sa.Column('reviewed_at', sa.DateTime(), nullable=True),
        sa.Column('review_decision', sa.Enum('CONFIRMED_PLAGIARISM', 'FALSE_POSITIVE', 'LEGITIMATE_CITATION', 'NEEDS_INVESTIGATION', 'DISMISSED', name='reviewdecision'), nullable=True),
        sa.Column('review_notes', sa.Text(), nullable=True),
        sa.Column('created_at', sa.DateTime(), nullable=False),
        sa.Column('updated_at', sa.DateTime(), nullable=False),
        sa.ForeignKeyConstraint(['check_id'], ['plagiarism_checks.id'], ondelete='CASCADE'),
        sa.ForeignKeyConstraint(['submission_id'], ['submissions.id'], ondelete='CASCADE'),
        sa.ForeignKeyConstraint(['matched_submission_id'], ['submissions.id'], ondelete='CASCADE'),
        sa.ForeignKeyConstraint(['reviewed_by'], ['teachers.id'], ondelete='SET NULL'),
        sa.PrimaryKeyConstraint('id')
    )
    op.create_index('idx_plagiarism_result_check', 'plagiarism_results', ['check_id'])
    op.create_index('idx_plagiarism_result_submission', 'plagiarism_results', ['submission_id'])
    op.create_index('idx_plagiarism_result_matched_submission', 'plagiarism_results', ['matched_submission_id'])
    op.create_index('idx_plagiarism_result_similarity', 'plagiarism_results', ['similarity_score'])
    op.create_index('idx_plagiarism_result_review_status', 'plagiarism_results', ['review_status'])
    op.create_index('idx_plagiarism_result_reviewed_by', 'plagiarism_results', ['reviewed_by'])
    
    op.create_table(
        'plagiarism_match_segments',
        sa.Column('id', sa.Integer(), nullable=False),
        sa.Column('result_id', sa.Integer(), nullable=False),
        sa.Column('source_start', sa.Integer(), nullable=False),
        sa.Column('source_end', sa.Integer(), nullable=False),
        sa.Column('source_text', sa.Text(), nullable=False),
        sa.Column('match_start', sa.Integer(), nullable=False),
        sa.Column('match_end', sa.Integer(), nullable=False),
        sa.Column('match_text', sa.Text(), nullable=False),
        sa.Column('segment_similarity', sa.Float(), nullable=False),
        sa.Column('segment_length', sa.Integer(), nullable=False),
        sa.Column('is_code_segment', sa.Boolean(), nullable=False, server_default='false'),
        sa.Column('code_analysis', sa.JSON(), nullable=True),
        sa.Column('is_citation', sa.Boolean(), nullable=False, server_default='false'),
        sa.Column('citation_context', sa.Text(), nullable=True),
        sa.Column('created_at', sa.DateTime(), nullable=False),
        sa.ForeignKeyConstraint(['result_id'], ['plagiarism_results.id'], ondelete='CASCADE'),
        sa.PrimaryKeyConstraint('id')
    )
    op.create_index('idx_match_segment_result', 'plagiarism_match_segments', ['result_id'])
    
    op.create_table(
        'code_ast_fingerprints',
        sa.Column('id', sa.Integer(), nullable=False),
        sa.Column('submission_id', sa.Integer(), nullable=False),
        sa.Column('file_id', sa.Integer(), nullable=True),
        sa.Column('language', sa.String(50), nullable=False),
        sa.Column('structure_hash', sa.String(64), nullable=False),
        sa.Column('variable_pattern_hash', sa.String(64), nullable=False),
        sa.Column('function_pattern_hash', sa.String(64), nullable=False),
        sa.Column('ast_features', sa.JSON(), nullable=False),
        sa.Column('total_nodes', sa.Integer(), nullable=False),
        sa.Column('total_functions', sa.Integer(), nullable=False),
        sa.Column('total_variables', sa.Integer(), nullable=False),
        sa.Column('complexity_score', sa.Float(), nullable=False),
        sa.Column('created_at', sa.DateTime(), nullable=False),
        sa.ForeignKeyConstraint(['submission_id'], ['submissions.id'], ondelete='CASCADE'),
        sa.ForeignKeyConstraint(['file_id'], ['submission_files.id'], ondelete='CASCADE'),
        sa.PrimaryKeyConstraint('id')
    )
    op.create_index('idx_ast_fingerprint_submission', 'code_ast_fingerprints', ['submission_id'])
    op.create_index('idx_ast_fingerprint_file', 'code_ast_fingerprints', ['file_id'])
    op.create_index('idx_ast_fingerprint_structure_hash', 'code_ast_fingerprints', ['structure_hash'])
    op.create_index('idx_ast_fingerprint_language', 'code_ast_fingerprints', ['language'])
    
    op.create_table(
        'citation_patterns',
        sa.Column('id', sa.Integer(), nullable=False),
        sa.Column('submission_id', sa.Integer(), nullable=False),
        sa.Column('citation_type', sa.String(50), nullable=False),
        sa.Column('citation_text', sa.Text(), nullable=False),
        sa.Column('start_position', sa.Integer(), nullable=False),
        sa.Column('end_position', sa.Integer(), nullable=False),
        sa.Column('reference_info', sa.JSON(), nullable=True),
        sa.Column('is_valid', sa.Boolean(), nullable=False, server_default='true'),
        sa.Column('validation_notes', sa.Text(), nullable=True),
        sa.Column('created_at', sa.DateTime(), nullable=False),
        sa.ForeignKeyConstraint(['submission_id'], ['submissions.id'], ondelete='CASCADE'),
        sa.PrimaryKeyConstraint('id')
    )
    op.create_index('idx_citation_pattern_submission', 'citation_patterns', ['submission_id'])
    op.create_index('idx_citation_pattern_type', 'citation_patterns', ['citation_type'])
    
    op.create_table(
        'plagiarism_privacy_consents',
        sa.Column('id', sa.Integer(), nullable=False),
        sa.Column('institution_id', sa.Integer(), nullable=False),
        sa.Column('allow_cross_institution_comparison', sa.Boolean(), nullable=False, server_default='false'),
        sa.Column('allow_anonymized_sharing', sa.Boolean(), nullable=False, server_default='true'),
        sa.Column('data_retention_days', sa.Integer(), nullable=False, server_default='365'),
        sa.Column('consent_given_by', sa.Integer(), nullable=True),
        sa.Column('consent_given_at', sa.DateTime(), nullable=True),
        sa.Column('privacy_settings', sa.JSON(), nullable=True),
        sa.Column('is_active', sa.Boolean(), nullable=False, server_default='true'),
        sa.Column('created_at', sa.DateTime(), nullable=False),
        sa.Column('updated_at', sa.DateTime(), nullable=False),
        sa.ForeignKeyConstraint(['institution_id'], ['institutions.id'], ondelete='CASCADE'),
        sa.ForeignKeyConstraint(['consent_given_by'], ['users.id'], ondelete='SET NULL'),
        sa.PrimaryKeyConstraint('id'),
        sa.UniqueConstraint('institution_id', name='uq_institution_privacy_consent')
    )
    op.create_index('idx_privacy_consent_institution', 'plagiarism_privacy_consents', ['institution_id'])


def downgrade() -> None:
    op.drop_table('plagiarism_privacy_consents')
    op.drop_table('citation_patterns')
    op.drop_table('code_ast_fingerprints')
    op.drop_table('plagiarism_match_segments')
    op.drop_table('plagiarism_results')
    op.drop_table('plagiarism_checks')
    
    op.execute('DROP TYPE IF EXISTS reviewdecision')
    op.execute('DROP TYPE IF EXISTS plagiarismcheckstatus')
    op.execute('DROP TYPE IF EXISTS comparisonscope')
    op.execute('DROP TYPE IF EXISTS contenttype')
