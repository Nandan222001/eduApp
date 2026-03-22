"""add institution branding

Revision ID: add_institution_branding
Revises: 
Create Date: 2024-03-14 12:00:00.000000

"""
from alembic import op
import sqlalchemy as sa

# revision identifiers, used by Alembic.
revision = 'add_institution_branding'
down_revision = '005'
branch_labels = None
depends_on = None


def upgrade():
    op.create_table(
        'institution_branding',
        sa.Column('id', sa.Integer(), nullable=False),
        sa.Column('institution_id', sa.Integer(), nullable=False),
        sa.Column('logo_url', sa.String(length=500), nullable=True),
        sa.Column('logo_s3_key', sa.String(length=500), nullable=True),
        sa.Column('favicon_url', sa.String(length=500), nullable=True),
        sa.Column('favicon_s3_key', sa.String(length=500), nullable=True),
        sa.Column('primary_color', sa.String(length=7), nullable=True, server_default='#1976d2'),
        sa.Column('secondary_color', sa.String(length=7), nullable=True, server_default='#dc004e'),
        sa.Column('accent_color', sa.String(length=7), nullable=True, server_default='#f50057'),
        sa.Column('background_color', sa.String(length=7), nullable=True, server_default='#ffffff'),
        sa.Column('text_color', sa.String(length=7), nullable=True, server_default='#000000'),
        sa.Column('custom_domain', sa.String(length=255), nullable=True),
        sa.Column('subdomain', sa.String(length=100), nullable=True),
        sa.Column('ssl_enabled', sa.Boolean(), nullable=False, server_default='false'),
        sa.Column('domain_verified', sa.Boolean(), nullable=False, server_default='false'),
        sa.Column('email_logo_url', sa.String(length=500), nullable=True),
        sa.Column('email_logo_s3_key', sa.String(length=500), nullable=True),
        sa.Column('email_header_color', sa.String(length=7), nullable=True, server_default='#1976d2'),
        sa.Column('email_footer_text', sa.Text(), nullable=True),
        sa.Column('email_from_name', sa.String(length=100), nullable=True),
        sa.Column('login_background_url', sa.String(length=500), nullable=True),
        sa.Column('login_background_s3_key', sa.String(length=500), nullable=True),
        sa.Column('login_banner_text', sa.String(length=255), nullable=True),
        sa.Column('login_welcome_message', sa.Text(), nullable=True),
        sa.Column('institution_name_override', sa.String(length=255), nullable=True),
        sa.Column('custom_css', sa.Text(), nullable=True),
        sa.Column('custom_meta_tags', sa.JSON(), nullable=True),
        sa.Column('social_links', sa.JSON(), nullable=True),
        sa.Column('show_powered_by', sa.Boolean(), nullable=False, server_default='true'),
        sa.Column('is_active', sa.Boolean(), nullable=False, server_default='true'),
        sa.Column('created_at', sa.DateTime(), nullable=False, server_default=sa.text('now()')),
        sa.Column('updated_at', sa.DateTime(), nullable=False, server_default=sa.text('now()')),
        sa.ForeignKeyConstraint(['institution_id'], ['institutions.id'], ondelete='CASCADE'),
        sa.PrimaryKeyConstraint('id')
    )
    
    op.create_index('ix_institution_branding_institution_id', 'institution_branding', ['institution_id'], unique=True)
    op.create_index('ix_institution_branding_custom_domain', 'institution_branding', ['custom_domain'], unique=True)
    op.create_index('ix_institution_branding_subdomain', 'institution_branding', ['subdomain'], unique=True)


def downgrade():
    op.drop_index('ix_institution_branding_subdomain', table_name='institution_branding')
    op.drop_index('ix_institution_branding_custom_domain', table_name='institution_branding')
    op.drop_index('ix_institution_branding_institution_id', table_name='institution_branding')
    op.drop_table('institution_branding')
