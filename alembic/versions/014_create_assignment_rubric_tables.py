"""create assignment rubric tables

Revision ID: 014
Revises: 014a_add_institution_logo
Create Date: 2025-01-11 14:30:00.000000

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa

revision: str = '014'
down_revision: Union[str, None] = '014a_add_institution_logo'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.create_table(
        'rubric_criteria',
        sa.Column('id', sa.Integer(), nullable=False),
        sa.Column('assignment_id', sa.Integer(), nullable=False),
        sa.Column('name', sa.String(length=255), nullable=False),
        sa.Column('description', sa.Text(), nullable=True),
        sa.Column('max_points', sa.Numeric(precision=10, scale=2), nullable=False),
        sa.Column('order', sa.Integer(), nullable=False, server_default='0'),
        sa.Column('created_at', sa.DateTime(), nullable=False, server_default=sa.text('now()')),
        sa.ForeignKeyConstraint(['assignment_id'], ['assignments.id'], ondelete='CASCADE'),
        sa.PrimaryKeyConstraint('id')
    )
    op.create_index('idx_rubric_criteria_assignment', 'rubric_criteria', ['assignment_id'])

    op.create_table(
        'rubric_levels',
        sa.Column('id', sa.Integer(), nullable=False),
        sa.Column('criteria_id', sa.Integer(), nullable=False),
        sa.Column('name', sa.String(length=255), nullable=False),
        sa.Column('description', sa.Text(), nullable=True),
        sa.Column('points', sa.Numeric(precision=10, scale=2), nullable=False),
        sa.Column('order', sa.Integer(), nullable=False, server_default='0'),
        sa.Column('created_at', sa.DateTime(), nullable=False, server_default=sa.text('now()')),
        sa.ForeignKeyConstraint(['criteria_id'], ['rubric_criteria.id'], ondelete='CASCADE'),
        sa.PrimaryKeyConstraint('id')
    )
    op.create_index('idx_rubric_level_criteria', 'rubric_levels', ['criteria_id'])

    op.create_table(
        'submission_grades',
        sa.Column('id', sa.Integer(), nullable=False),
        sa.Column('submission_id', sa.Integer(), nullable=False),
        sa.Column('criteria_id', sa.Integer(), nullable=False),
        sa.Column('points_awarded', sa.Numeric(precision=10, scale=2), nullable=False),
        sa.Column('feedback', sa.Text(), nullable=True),
        sa.Column('graded_at', sa.DateTime(), nullable=False, server_default=sa.text('now()')),
        sa.ForeignKeyConstraint(['submission_id'], ['submissions.id'], ondelete='CASCADE'),
        sa.ForeignKeyConstraint(['criteria_id'], ['rubric_criteria.id'], ondelete='CASCADE'),
        sa.PrimaryKeyConstraint('id'),
        sa.UniqueConstraint('submission_id', 'criteria_id', name='uq_submission_criteria_grade')
    )
    op.create_index('idx_submission_grade_submission', 'submission_grades', ['submission_id'])
    op.create_index('idx_submission_grade_criteria', 'submission_grades', ['criteria_id'])


def downgrade() -> None:
    op.drop_index('idx_submission_grade_criteria', table_name='submission_grades')
    op.drop_index('idx_submission_grade_submission', table_name='submission_grades')
    op.drop_table('submission_grades')
    
    op.drop_index('idx_rubric_level_criteria', table_name='rubric_levels')
    op.drop_table('rubric_levels')
    
    op.drop_index('idx_rubric_criteria_assignment', table_name='rubric_criteria')
    op.drop_table('rubric_criteria')
