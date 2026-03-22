"""create parent linking tables

Revision ID: 013
Revises: 012
Create Date: 2026-03-11 12:14:48.000000

"""
from alembic import op
import sqlalchemy as sa

revision = '013'
down_revision = '012'
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.create_table(
        'parents',
        sa.Column('id', sa.Integer(), nullable=False),
        sa.Column('institution_id', sa.Integer(), nullable=False),
        sa.Column('user_id', sa.Integer(), nullable=True),
        sa.Column('first_name', sa.String(length=100), nullable=False),
        sa.Column('last_name', sa.String(length=100), nullable=False),
        sa.Column('email', sa.String(length=255), nullable=True),
        sa.Column('phone', sa.String(length=20), nullable=True),
        sa.Column('occupation', sa.String(length=100), nullable=True),
        sa.Column('address', sa.Text(), nullable=True),
        sa.Column('photo_url', sa.String(length=500), nullable=True),
        sa.Column('relation_type', sa.String(length=50), nullable=True),
        sa.Column('is_primary_contact', sa.Boolean(), nullable=False, server_default='true'),
        sa.Column('is_active', sa.Boolean(), nullable=False, server_default='true'),
        sa.Column('created_at', sa.DateTime(), nullable=False, server_default=sa.text('now()')),
        sa.Column('updated_at', sa.DateTime(), nullable=False, server_default=sa.text('now()')),
        sa.ForeignKeyConstraint(['institution_id'], ['institutions.id'], ondelete='CASCADE'),
        sa.ForeignKeyConstraint(['user_id'], ['users.id'], ondelete='CASCADE'),
        sa.PrimaryKeyConstraint('id'),
        sa.UniqueConstraint('institution_id', 'email', name='uq_institution_parent_email')
    )
    op.create_index('idx_parent_institution', 'parents', ['institution_id'])
    op.create_index('idx_parent_user', 'parents', ['user_id'])
    op.create_index('idx_parent_email', 'parents', ['email'])
    op.create_index('idx_parent_active', 'parents', ['is_active'])

    op.create_table(
        'student_parents',
        sa.Column('id', sa.Integer(), nullable=False),
        sa.Column('student_id', sa.Integer(), nullable=False),
        sa.Column('parent_id', sa.Integer(), nullable=False),
        sa.Column('relation_type', sa.String(length=50), nullable=False),
        sa.Column('is_primary_contact', sa.Boolean(), nullable=False, server_default='false'),
        sa.Column('created_at', sa.DateTime(), nullable=False, server_default=sa.text('now()')),
        sa.ForeignKeyConstraint(['student_id'], ['students.id'], ondelete='CASCADE'),
        sa.ForeignKeyConstraint(['parent_id'], ['parents.id'], ondelete='CASCADE'),
        sa.PrimaryKeyConstraint('id'),
        sa.UniqueConstraint('student_id', 'parent_id', name='uq_student_parent')
    )
    op.create_index('idx_student_parent_student', 'student_parents', ['student_id'])
    op.create_index('idx_student_parent_parent', 'student_parents', ['parent_id'])

    op.add_column('students', sa.Column('nationality', sa.String(length=100), nullable=True))
    op.add_column('students', sa.Column('religion', sa.String(length=100), nullable=True))
    op.add_column('students', sa.Column('caste', sa.String(length=100), nullable=True))
    op.add_column('students', sa.Column('category', sa.String(length=50), nullable=True))
    op.add_column('students', sa.Column('aadhar_number', sa.String(length=20), nullable=True))


def downgrade() -> None:
    op.drop_column('students', 'aadhar_number')
    op.drop_column('students', 'category')
    op.drop_column('students', 'caste')
    op.drop_column('students', 'religion')
    op.drop_column('students', 'nationality')

    op.drop_index('idx_student_parent_parent', table_name='student_parents')
    op.drop_index('idx_student_parent_student', table_name='student_parents')
    op.drop_table('student_parents')

    op.drop_index('idx_parent_active', table_name='parents')
    op.drop_index('idx_parent_email', table_name='parents')
    op.drop_index('idx_parent_user', table_name='parents')
    op.drop_index('idx_parent_institution', table_name='parents')
    op.drop_table('parents')
