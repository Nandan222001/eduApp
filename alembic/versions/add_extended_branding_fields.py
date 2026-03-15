"""add extended branding fields

Revision ID: add_extended_branding_fields
Revises: add_institution_branding
Create Date: 2024-03-15 10:00:00.000000

"""
from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql

# revision identifiers, used by Alembic.
revision = 'add_extended_branding_fields'
down_revision = 'add_institution_branding'
branch_labels = None
depends_on = None


def upgrade():
    # Add custom email domain fields
    op.add_column('institution_branding', 
        sa.Column('custom_email_domain', sa.String(length=255), nullable=True))
    op.add_column('institution_branding', 
        sa.Column('email_domain_verified', sa.Boolean(), nullable=False, server_default='false'))
    op.add_column('institution_branding', 
        sa.Column('sendgrid_domain_id', sa.String(length=100), nullable=True))
    op.add_column('institution_branding', 
        sa.Column('dkim_valid', sa.Boolean(), nullable=False, server_default='false'))
    op.add_column('institution_branding', 
        sa.Column('spf_valid', sa.Boolean(), nullable=False, server_default='false'))
    
    # Add branded notification sounds (JSON field)
    op.add_column('institution_branding', 
        sa.Column('branded_notification_sounds', postgresql.JSON(astext_type=sa.Text()), nullable=True))
    
    # Add loading screen and animations
    op.add_column('institution_branding', 
        sa.Column('loading_screen_animation_url', sa.String(length=500), nullable=True))
    op.add_column('institution_branding', 
        sa.Column('loading_screen_animation_s3_key', sa.String(length=500), nullable=True))
    op.add_column('institution_branding', 
        sa.Column('splash_screen_config', postgresql.JSON(astext_type=sa.Text()), nullable=True))
    
    # Add custom help docs and merchandise
    op.add_column('institution_branding', 
        sa.Column('custom_help_docs_url', sa.String(length=500), nullable=True))
    op.add_column('institution_branding', 
        sa.Column('merchandise_store_enabled', sa.Boolean(), nullable=False, server_default='false'))
    
    # Create index on custom_email_domain
    op.create_index('ix_institution_branding_custom_email_domain', 
                    'institution_branding', ['custom_email_domain'], unique=False)


def downgrade():
    # Drop index
    op.drop_index('ix_institution_branding_custom_email_domain', table_name='institution_branding')
    
    # Drop columns in reverse order
    op.drop_column('institution_branding', 'merchandise_store_enabled')
    op.drop_column('institution_branding', 'custom_help_docs_url')
    op.drop_column('institution_branding', 'splash_screen_config')
    op.drop_column('institution_branding', 'loading_screen_animation_s3_key')
    op.drop_column('institution_branding', 'loading_screen_animation_url')
    op.drop_column('institution_branding', 'branded_notification_sounds')
    op.drop_column('institution_branding', 'spf_valid')
    op.drop_column('institution_branding', 'dkim_valid')
    op.drop_column('institution_branding', 'sendgrid_domain_id')
    op.drop_column('institution_branding', 'email_domain_verified')
    op.drop_column('institution_branding', 'custom_email_domain')
