"""create previous year papers and question bank tables

Revision ID: pyp_001
Revises: 
Create Date: 2024-01-01 00:00:00.000000

"""
from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql

revision = 'pyp_001'
down_revision = None
depends_on = None


def upgrade() -> None:
    op.create_table(
        'previous_year_papers',
        sa.Column('id', sa.Integer(), nullable=False),
        sa.Column('institution_id', sa.Integer(), nullable=False),
        sa.Column('title', sa.String(length=255), nullable=False),
        sa.Column('description', sa.Text(), nullable=True),
        sa.Column('board', sa.Enum('CBSE', 'ICSE', 'STATE_BOARD', 'IB', 'CAMBRIDGE', 'OTHER', name='board'), nullable=False),
        sa.Column('year', sa.Integer(), nullable=False),
        sa.Column('exam_month', sa.String(length=50), nullable=True),
        sa.Column('grade_id', sa.Integer(), nullable=False),
        sa.Column('subject_id', sa.Integer(), nullable=False),
        sa.Column('total_marks', sa.Integer(), nullable=True),
        sa.Column('duration_minutes', sa.Integer(), nullable=True),
        sa.Column('pdf_file_name', sa.String(length=255), nullable=True),
        sa.Column('pdf_file_size', sa.Integer(), nullable=True),
        sa.Column('pdf_file_url', sa.String(length=500), nullable=True),
        sa.Column('pdf_s3_key', sa.String(length=500), nullable=True),
        sa.Column('ocr_text', sa.Text(), nullable=True),
        sa.Column('ocr_processed', sa.Boolean(), nullable=False, server_default='false'),
        sa.Column('ocr_processed_at', sa.DateTime(), nullable=True),
        sa.Column('tags', sa.Text(), nullable=True),
        sa.Column('view_count', sa.Integer(), nullable=False, server_default='0'),
        sa.Column('download_count', sa.Integer(), nullable=False, server_default='0'),
        sa.Column('is_active', sa.Boolean(), nullable=False, server_default='true'),
        sa.Column('uploaded_by', sa.Integer(), nullable=True),
        sa.Column('created_at', sa.DateTime(), nullable=False, server_default=sa.text('now()')),
        sa.Column('updated_at', sa.DateTime(), nullable=False, server_default=sa.text('now()')),
        sa.PrimaryKeyConstraint('id'),
        sa.ForeignKeyConstraint(['institution_id'], ['institutions.id'], ondelete='CASCADE'),
        sa.ForeignKeyConstraint(['grade_id'], ['grades.id'], ondelete='CASCADE'),
        sa.ForeignKeyConstraint(['subject_id'], ['subjects.id'], ondelete='CASCADE'),
        sa.ForeignKeyConstraint(['uploaded_by'], ['users.id'], ondelete='SET NULL'),
    )
    
    op.create_index('idx_pyp_institution', 'previous_year_papers', ['institution_id'])
    op.create_index('idx_pyp_board', 'previous_year_papers', ['board'])
    op.create_index('idx_pyp_year', 'previous_year_papers', ['year'])
    op.create_index('idx_pyp_grade', 'previous_year_papers', ['grade_id'])
    op.create_index('idx_pyp_subject', 'previous_year_papers', ['subject_id'])
    op.create_index('idx_pyp_board_year', 'previous_year_papers', ['board', 'year'])
    op.create_index('idx_pyp_grade_subject', 'previous_year_papers', ['grade_id', 'subject_id'])
    op.create_index('idx_pyp_ocr_processed', 'previous_year_papers', ['ocr_processed'])
    op.create_index('idx_pyp_active', 'previous_year_papers', ['is_active'])
    op.create_index('idx_pyp_created', 'previous_year_papers', ['created_at'])

    op.create_table(
        'questions_bank',
        sa.Column('id', sa.Integer(), nullable=False),
        sa.Column('institution_id', sa.Integer(), nullable=False),
        sa.Column('paper_id', sa.Integer(), nullable=True),
        sa.Column('question_text', sa.Text(), nullable=False),
        sa.Column('question_type', sa.Enum('MULTIPLE_CHOICE', 'SHORT_ANSWER', 'LONG_ANSWER', 'TRUE_FALSE', 'FILL_IN_BLANK', 'NUMERICAL', 'MATCH_THE_FOLLOWING', 'ASSERTION_REASONING', name='questiontype'), nullable=False),
        sa.Column('grade_id', sa.Integer(), nullable=False),
        sa.Column('subject_id', sa.Integer(), nullable=False),
        sa.Column('chapter_id', sa.Integer(), nullable=True),
        sa.Column('topic_id', sa.Integer(), nullable=True),
        sa.Column('difficulty_level', sa.Enum('VERY_EASY', 'EASY', 'MEDIUM', 'HARD', 'VERY_HARD', name='difficultylevel'), nullable=False),
        sa.Column('bloom_taxonomy_level', sa.Enum('REMEMBER', 'UNDERSTAND', 'APPLY', 'ANALYZE', 'EVALUATE', 'CREATE', name='bloomtaxonomylevel'), nullable=False),
        sa.Column('marks', sa.Float(), nullable=True),
        sa.Column('estimated_time_minutes', sa.Integer(), nullable=True),
        sa.Column('answer_text', sa.Text(), nullable=True),
        sa.Column('explanation', sa.Text(), nullable=True),
        sa.Column('hints', sa.Text(), nullable=True),
        sa.Column('options', sa.Text(), nullable=True),
        sa.Column('correct_option', sa.String(length=10), nullable=True),
        sa.Column('image_url', sa.String(length=500), nullable=True),
        sa.Column('image_s3_key', sa.String(length=500), nullable=True),
        sa.Column('tags', sa.Text(), nullable=True),
        sa.Column('keywords', sa.Text(), nullable=True),
        sa.Column('usage_count', sa.Integer(), nullable=False, server_default='0'),
        sa.Column('is_active', sa.Boolean(), nullable=False, server_default='true'),
        sa.Column('is_verified', sa.Boolean(), nullable=False, server_default='false'),
        sa.Column('verified_by', sa.Integer(), nullable=True),
        sa.Column('verified_at', sa.DateTime(), nullable=True),
        sa.Column('created_by', sa.Integer(), nullable=True),
        sa.Column('created_at', sa.DateTime(), nullable=False, server_default=sa.text('now()')),
        sa.Column('updated_at', sa.DateTime(), nullable=False, server_default=sa.text('now()')),
        sa.PrimaryKeyConstraint('id'),
        sa.ForeignKeyConstraint(['institution_id'], ['institutions.id'], ondelete='CASCADE'),
        sa.ForeignKeyConstraint(['paper_id'], ['previous_year_papers.id'], ondelete='CASCADE'),
        sa.ForeignKeyConstraint(['grade_id'], ['grades.id'], ondelete='CASCADE'),
        sa.ForeignKeyConstraint(['subject_id'], ['subjects.id'], ondelete='CASCADE'),
        sa.ForeignKeyConstraint(['chapter_id'], ['chapters.id'], ondelete='SET NULL'),
        sa.ForeignKeyConstraint(['topic_id'], ['topics.id'], ondelete='SET NULL'),
        sa.ForeignKeyConstraint(['verified_by'], ['users.id'], ondelete='SET NULL'),
        sa.ForeignKeyConstraint(['created_by'], ['users.id'], ondelete='SET NULL'),
    )
    
    op.create_index('idx_qb_institution', 'questions_bank', ['institution_id'])
    op.create_index('idx_qb_paper', 'questions_bank', ['paper_id'])
    op.create_index('idx_qb_grade', 'questions_bank', ['grade_id'])
    op.create_index('idx_qb_subject', 'questions_bank', ['subject_id'])
    op.create_index('idx_qb_chapter', 'questions_bank', ['chapter_id'])
    op.create_index('idx_qb_topic', 'questions_bank', ['topic_id'])
    op.create_index('idx_qb_question_type', 'questions_bank', ['question_type'])
    op.create_index('idx_qb_difficulty', 'questions_bank', ['difficulty_level'])
    op.create_index('idx_qb_bloom', 'questions_bank', ['bloom_taxonomy_level'])
    op.create_index('idx_qb_grade_subject', 'questions_bank', ['grade_id', 'subject_id'])
    op.create_index('idx_qb_chapter_topic', 'questions_bank', ['chapter_id', 'topic_id'])
    op.create_index('idx_qb_active', 'questions_bank', ['is_active'])
    op.create_index('idx_qb_verified', 'questions_bank', ['is_verified'])
    op.create_index('idx_qb_created', 'questions_bank', ['created_at'])


def downgrade() -> None:
    op.drop_index('idx_qb_created', table_name='questions_bank')
    op.drop_index('idx_qb_verified', table_name='questions_bank')
    op.drop_index('idx_qb_active', table_name='questions_bank')
    op.drop_index('idx_qb_chapter_topic', table_name='questions_bank')
    op.drop_index('idx_qb_grade_subject', table_name='questions_bank')
    op.drop_index('idx_qb_bloom', table_name='questions_bank')
    op.drop_index('idx_qb_difficulty', table_name='questions_bank')
    op.drop_index('idx_qb_question_type', table_name='questions_bank')
    op.drop_index('idx_qb_topic', table_name='questions_bank')
    op.drop_index('idx_qb_chapter', table_name='questions_bank')
    op.drop_index('idx_qb_subject', table_name='questions_bank')
    op.drop_index('idx_qb_grade', table_name='questions_bank')
    op.drop_index('idx_qb_paper', table_name='questions_bank')
    op.drop_index('idx_qb_institution', table_name='questions_bank')
    op.drop_table('questions_bank')
    
    op.drop_index('idx_pyp_created', table_name='previous_year_papers')
    op.drop_index('idx_pyp_active', table_name='previous_year_papers')
    op.drop_index('idx_pyp_ocr_processed', table_name='previous_year_papers')
    op.drop_index('idx_pyp_grade_subject', table_name='previous_year_papers')
    op.drop_index('idx_pyp_board_year', table_name='previous_year_papers')
    op.drop_index('idx_pyp_subject', table_name='previous_year_papers')
    op.drop_index('idx_pyp_grade', table_name='previous_year_papers')
    op.drop_index('idx_pyp_year', table_name='previous_year_papers')
    op.drop_index('idx_pyp_board', table_name='previous_year_papers')
    op.drop_index('idx_pyp_institution', table_name='previous_year_papers')
    op.drop_table('previous_year_papers')
    
    op.execute('DROP TYPE bloomtaxonomylevel')
    op.execute('DROP TYPE difficultylevel')
    op.execute('DROP TYPE questiontype')
    op.execute('DROP TYPE board')
