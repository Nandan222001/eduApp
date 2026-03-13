"""add ml training configuration

Revision ID: 015_add_ml_training_config
Revises: 014_create_assignment_rubric_tables
Create Date: 2024-01-15 12:00:00.000000

"""
from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql

# revision identifiers, used by Alembic.
revision = '015_add_ml_training_config'
down_revision = '014_create_assignment_rubric_tables'
branch_label = None
depends_on = None


def upgrade():
    pass


def downgrade():
    pass
