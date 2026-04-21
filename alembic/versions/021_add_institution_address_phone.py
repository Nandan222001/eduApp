"""add address and phone columns to institutions

Revision ID: 021
Revises: 66c76cb241ba
Create Date: 2026-04-20

"""
from typing import Sequence, Union
from alembic import op
import sqlalchemy as sa

revision: str = '021'
down_revision: Union[str, None] = '66c76cb241ba'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    conn = op.get_bind()
    inspector = sa.inspect(conn)
    cols = [c['name'] for c in inspector.get_columns('institutions')]

    if 'address' not in cols:
        op.add_column('institutions', sa.Column('address', sa.Text(), nullable=True))
    if 'phone' not in cols:
        op.add_column('institutions', sa.Column('phone', sa.String(length=50), nullable=True))


def downgrade() -> None:
    op.drop_column('institutions', 'phone')
    op.drop_column('institutions', 'address')
