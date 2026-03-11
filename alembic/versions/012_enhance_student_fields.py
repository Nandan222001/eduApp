"""enhance student fields

Revision ID: 012_enhance_student_fields
Revises: 011_create_weakness_detection_tables
Create Date: 2024-01-15 10:00:00.000000

"""
from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision = '012_enhance_student_fields'
down_revision = '011_create_weakness_detection_tables'
branch_labels = None
depends_on = None


def upgrade():
    # Add new columns to students table
    op.add_column('students', sa.Column('photo_url', sa.String(length=500), nullable=True))
    op.add_column('students', sa.Column('emergency_contact_name', sa.String(length=255), nullable=True))
    op.add_column('students', sa.Column('emergency_contact_phone', sa.String(length=20), nullable=True))
    op.add_column('students', sa.Column('emergency_contact_relation', sa.String(length=100), nullable=True))
    op.add_column('students', sa.Column('previous_school', sa.String(length=255), nullable=True))
    op.add_column('students', sa.Column('medical_conditions', sa.Text(), nullable=True))
    op.add_column('students', sa.Column('status', sa.String(length=20), nullable=False, server_default='active'))
    
    # Create index on status column
    op.create_index('idx_student_status', 'students', ['status'])


def downgrade():
    # Remove index
    op.drop_index('idx_student_status', table_name='students')
    
    # Remove columns
    op.drop_column('students', 'status')
    op.drop_column('students', 'medical_conditions')
    op.drop_column('students', 'previous_school')
    op.drop_column('students', 'emergency_contact_relation')
    op.drop_column('students', 'emergency_contact_phone')
    op.drop_column('students', 'emergency_contact_name')
    op.drop_column('students', 'photo_url')
