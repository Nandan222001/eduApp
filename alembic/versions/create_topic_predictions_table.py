"""create topic predictions table

Revision ID: topic_pred_001
Revises: pyp_001
Create Date: 2024-01-15 00:00:00.000000

"""
from alembic import op
import sqlalchemy as sa

revision = 'topic_pred_001'
down_revision = 'pyp_001'
depends_on = None


def upgrade() -> None:
    op.create_table(
        'topic_predictions',
        sa.Column('id', sa.Integer(), nullable=False),
        sa.Column('institution_id', sa.Integer(), nullable=False),
        sa.Column('board', sa.Enum('CBSE', 'ICSE', 'STATE_BOARD', 'IB', 'CAMBRIDGE', 'OTHER', name='board'), nullable=False),
        sa.Column('grade_id', sa.Integer(), nullable=False),
        sa.Column('subject_id', sa.Integer(), nullable=False),
        sa.Column('chapter_id', sa.Integer(), nullable=True),
        sa.Column('topic_id', sa.Integer(), nullable=True),
        sa.Column('topic_name', sa.String(length=200), nullable=False),
        sa.Column('frequency_count', sa.Integer(), nullable=False, server_default='0'),
        sa.Column('appearance_years', sa.Text(), nullable=True),
        sa.Column('total_marks', sa.Float(), nullable=False, server_default='0.0'),
        sa.Column('avg_marks_per_appearance', sa.Float(), nullable=False, server_default='0.0'),
        sa.Column('years_since_last_appearance', sa.Integer(), nullable=False, server_default='0'),
        sa.Column('last_appeared_year', sa.Integer(), nullable=True),
        sa.Column('cyclical_pattern_score', sa.Float(), nullable=False, server_default='0.0'),
        sa.Column('trend_score', sa.Float(), nullable=False, server_default='0.0'),
        sa.Column('weightage_score', sa.Float(), nullable=False, server_default='0.0'),
        sa.Column('probability_score', sa.Float(), nullable=False, server_default='0.0'),
        sa.Column('prediction_rank', sa.Integer(), nullable=True),
        sa.Column('is_due', sa.Boolean(), nullable=False, server_default='false'),
        sa.Column('confidence_level', sa.String(length=50), nullable=True),
        sa.Column('analysis_metadata', sa.Text(), nullable=True),
        sa.Column('analysis_year_start', sa.Integer(), nullable=True),
        sa.Column('analysis_year_end', sa.Integer(), nullable=True),
        sa.Column('analyzed_at', sa.DateTime(), nullable=False, server_default=sa.text('now()')),
        sa.Column('created_at', sa.DateTime(), nullable=False, server_default=sa.text('now()')),
        sa.Column('updated_at', sa.DateTime(), nullable=False, server_default=sa.text('now()')),
        sa.PrimaryKeyConstraint('id'),
        sa.ForeignKeyConstraint(['institution_id'], ['institutions.id'], ondelete='CASCADE'),
        sa.ForeignKeyConstraint(['grade_id'], ['grades.id'], ondelete='CASCADE'),
        sa.ForeignKeyConstraint(['subject_id'], ['subjects.id'], ondelete='CASCADE'),
        sa.ForeignKeyConstraint(['chapter_id'], ['chapters.id'], ondelete='SET NULL'),
        sa.ForeignKeyConstraint(['topic_id'], ['topics.id'], ondelete='SET NULL'),
    )
    
    op.create_index('idx_tp_institution', 'topic_predictions', ['institution_id'])
    op.create_index('idx_tp_board', 'topic_predictions', ['board'])
    op.create_index('idx_tp_grade', 'topic_predictions', ['grade_id'])
    op.create_index('idx_tp_subject', 'topic_predictions', ['subject_id'])
    op.create_index('idx_tp_chapter', 'topic_predictions', ['chapter_id'])
    op.create_index('idx_tp_topic', 'topic_predictions', ['topic_id'])
    op.create_index('idx_tp_board_grade_subject', 'topic_predictions', ['board', 'grade_id', 'subject_id'])
    op.create_index('idx_tp_probability_score', 'topic_predictions', ['probability_score'])
    op.create_index('idx_tp_prediction_rank', 'topic_predictions', ['prediction_rank'])
    op.create_index('idx_tp_is_due', 'topic_predictions', ['is_due'])
    op.create_index('idx_tp_analyzed_at', 'topic_predictions', ['analyzed_at'])


def downgrade() -> None:
    op.drop_index('idx_tp_analyzed_at', table_name='topic_predictions')
    op.drop_index('idx_tp_is_due', table_name='topic_predictions')
    op.drop_index('idx_tp_prediction_rank', table_name='topic_predictions')
    op.drop_index('idx_tp_probability_score', table_name='topic_predictions')
    op.drop_index('idx_tp_board_grade_subject', table_name='topic_predictions')
    op.drop_index('idx_tp_topic', table_name='topic_predictions')
    op.drop_index('idx_tp_chapter', table_name='topic_predictions')
    op.drop_index('idx_tp_subject', table_name='topic_predictions')
    op.drop_index('idx_tp_grade', table_name='topic_predictions')
    op.drop_index('idx_tp_board', table_name='topic_predictions')
    op.drop_index('idx_tp_institution', table_name='topic_predictions')
    op.drop_table('topic_predictions')
