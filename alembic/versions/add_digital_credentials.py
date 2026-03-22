"""add digital credentials

Revision ID: add_digital_credentials
Revises: 
Create Date: 2024-01-01 00:00:00.000000

"""
from alembic import op
import sqlalchemy as sa

# revision identifiers, used by Alembic.
revision = 'add_digital_credentials'
down_revision = '005'
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.create_table(
        'digital_credentials',
        sa.Column('id', sa.Integer(), nullable=False),
        sa.Column('institution_id', sa.Integer(), nullable=False),
        sa.Column('recipient_id', sa.Integer(), nullable=False),
        sa.Column('issuer_id', sa.Integer(), nullable=True),
        sa.Column('credential_type', sa.Enum('DIGITAL_BADGE', 'CERTIFICATE', name='credentialtype'), nullable=False),
        sa.Column('sub_type', sa.Enum('ACADEMIC', 'SKILL_BASED', 'PARTICIPATION', name='credentialsubtype'), nullable=False),
        sa.Column('title', sa.String(length=255), nullable=False),
        sa.Column('description', sa.Text(), nullable=True),
        sa.Column('certificate_number', sa.String(length=100), nullable=False),
        sa.Column('skills', sa.JSON(), nullable=True),
        sa.Column('metadata', sa.JSON(), nullable=True),
        sa.Column('blockchain_hash', sa.String(length=255), nullable=True),
        sa.Column('blockchain_credential_id', sa.String(length=255), nullable=True),
        sa.Column('blockchain_status', sa.String(length=50), nullable=True),
        sa.Column('verification_url', sa.String(length=500), nullable=True),
        sa.Column('qr_code_url', sa.String(length=500), nullable=True),
        sa.Column('issued_at', sa.DateTime(), nullable=True),
        sa.Column('expires_at', sa.DateTime(), nullable=True),
        sa.Column('status', sa.Enum('PENDING', 'ACTIVE', 'REVOKED', 'EXPIRED', name='credentialstatus'), nullable=False),
        sa.Column('revoked_at', sa.DateTime(), nullable=True),
        sa.Column('revoked_by', sa.Integer(), nullable=True),
        sa.Column('revoke_reason', sa.Text(), nullable=True),
        sa.Column('course_id', sa.Integer(), nullable=True),
        sa.Column('exam_id', sa.Integer(), nullable=True),
        sa.Column('assignment_id', sa.Integer(), nullable=True),
        sa.Column('grade', sa.String(length=10), nullable=True),
        sa.Column('score', sa.Integer(), nullable=True),
        sa.Column('created_at', sa.DateTime(), nullable=False),
        sa.Column('updated_at', sa.DateTime(), nullable=False),
        sa.ForeignKeyConstraint(['institution_id'], ['institutions.id'], ondelete='CASCADE'),
        sa.ForeignKeyConstraint(['recipient_id'], ['users.id'], ondelete='CASCADE'),
        sa.ForeignKeyConstraint(['issuer_id'], ['users.id'], ondelete='SET NULL'),
        sa.ForeignKeyConstraint(['revoked_by'], ['users.id'], ondelete='SET NULL'),
        sa.PrimaryKeyConstraint('id'),
        sa.UniqueConstraint('certificate_number'),
        sa.UniqueConstraint('blockchain_hash'),
        sa.UniqueConstraint('blockchain_credential_id')
    )
    op.create_index(op.f('ix_digital_credentials_id'), 'digital_credentials', ['id'], unique=False)
    op.create_index(op.f('ix_digital_credentials_institution_id'), 'digital_credentials', ['institution_id'], unique=False)
    op.create_index(op.f('ix_digital_credentials_recipient_id'), 'digital_credentials', ['recipient_id'], unique=False)
    op.create_index(op.f('ix_digital_credentials_issuer_id'), 'digital_credentials', ['issuer_id'], unique=False)
    op.create_index(op.f('ix_digital_credentials_credential_type'), 'digital_credentials', ['credential_type'], unique=False)
    op.create_index(op.f('ix_digital_credentials_sub_type'), 'digital_credentials', ['sub_type'], unique=False)
    op.create_index(op.f('ix_digital_credentials_certificate_number'), 'digital_credentials', ['certificate_number'], unique=True)
    op.create_index(op.f('ix_digital_credentials_blockchain_hash'), 'digital_credentials', ['blockchain_hash'], unique=True)
    op.create_index(op.f('ix_digital_credentials_blockchain_credential_id'), 'digital_credentials', ['blockchain_credential_id'], unique=True)
    op.create_index(op.f('ix_digital_credentials_status'), 'digital_credentials', ['status'], unique=False)

    op.create_table(
        'credential_verifications',
        sa.Column('id', sa.Integer(), nullable=False),
        sa.Column('credential_id', sa.Integer(), nullable=True),
        sa.Column('verifier_name', sa.String(length=255), nullable=True),
        sa.Column('verifier_email', sa.String(length=255), nullable=True),
        sa.Column('verifier_organization', sa.String(length=255), nullable=True),
        sa.Column('verifier_ip', sa.String(length=50), nullable=True),
        sa.Column('verification_method', sa.String(length=50), nullable=False),
        sa.Column('verification_result', sa.String(length=50), nullable=False),
        sa.Column('metadata', sa.JSON(), nullable=True),
        sa.Column('verified_at', sa.DateTime(), nullable=False),
        sa.ForeignKeyConstraint(['credential_id'], ['digital_credentials.id'], ondelete='CASCADE'),
        sa.PrimaryKeyConstraint('id')
    )
    op.create_index(op.f('ix_credential_verifications_id'), 'credential_verifications', ['id'], unique=False)
    op.create_index(op.f('ix_credential_verifications_credential_id'), 'credential_verifications', ['credential_id'], unique=False)

    op.create_table(
        'credential_shares',
        sa.Column('id', sa.Integer(), nullable=False),
        sa.Column('credential_id', sa.Integer(), nullable=False),
        sa.Column('share_token', sa.String(length=255), nullable=False),
        sa.Column('share_url', sa.String(length=500), nullable=False),
        sa.Column('recipient_email', sa.String(length=255), nullable=True),
        sa.Column('recipient_name', sa.String(length=255), nullable=True),
        sa.Column('expires_at', sa.DateTime(), nullable=True),
        sa.Column('is_active', sa.Boolean(), nullable=False),
        sa.Column('view_count', sa.Integer(), nullable=False),
        sa.Column('last_viewed_at', sa.DateTime(), nullable=True),
        sa.Column('created_at', sa.DateTime(), nullable=False),
        sa.ForeignKeyConstraint(['credential_id'], ['digital_credentials.id'], ondelete='CASCADE'),
        sa.PrimaryKeyConstraint('id'),
        sa.UniqueConstraint('share_token')
    )
    op.create_index(op.f('ix_credential_shares_id'), 'credential_shares', ['id'], unique=False)
    op.create_index(op.f('ix_credential_shares_credential_id'), 'credential_shares', ['credential_id'], unique=False)
    op.create_index(op.f('ix_credential_shares_share_token'), 'credential_shares', ['share_token'], unique=True)

    op.create_table(
        'credential_templates',
        sa.Column('id', sa.Integer(), nullable=False),
        sa.Column('institution_id', sa.Integer(), nullable=False),
        sa.Column('name', sa.String(length=255), nullable=False),
        sa.Column('credential_type', sa.Enum('DIGITAL_BADGE', 'CERTIFICATE', name='credentialtype'), nullable=False),
        sa.Column('sub_type', sa.Enum('ACADEMIC', 'SKILL_BASED', 'PARTICIPATION', name='credentialsubtype'), nullable=False),
        sa.Column('template_data', sa.JSON(), nullable=False),
        sa.Column('is_active', sa.Boolean(), nullable=False),
        sa.Column('created_by', sa.Integer(), nullable=True),
        sa.Column('created_at', sa.DateTime(), nullable=False),
        sa.Column('updated_at', sa.DateTime(), nullable=False),
        sa.ForeignKeyConstraint(['institution_id'], ['institutions.id'], ondelete='CASCADE'),
        sa.ForeignKeyConstraint(['created_by'], ['users.id'], ondelete='SET NULL'),
        sa.PrimaryKeyConstraint('id')
    )
    op.create_index(op.f('ix_credential_templates_id'), 'credential_templates', ['id'], unique=False)
    op.create_index(op.f('ix_credential_templates_institution_id'), 'credential_templates', ['institution_id'], unique=False)
    op.create_index(op.f('ix_credential_templates_credential_type'), 'credential_templates', ['credential_type'], unique=False)
    op.create_index(op.f('ix_credential_templates_sub_type'), 'credential_templates', ['sub_type'], unique=False)


def downgrade() -> None:
    op.drop_index(op.f('ix_credential_templates_sub_type'), table_name='credential_templates')
    op.drop_index(op.f('ix_credential_templates_credential_type'), table_name='credential_templates')
    op.drop_index(op.f('ix_credential_templates_institution_id'), table_name='credential_templates')
    op.drop_index(op.f('ix_credential_templates_id'), table_name='credential_templates')
    op.drop_table('credential_templates')
    
    op.drop_index(op.f('ix_credential_shares_share_token'), table_name='credential_shares')
    op.drop_index(op.f('ix_credential_shares_credential_id'), table_name='credential_shares')
    op.drop_index(op.f('ix_credential_shares_id'), table_name='credential_shares')
    op.drop_table('credential_shares')
    
    op.drop_index(op.f('ix_credential_verifications_credential_id'), table_name='credential_verifications')
    op.drop_index(op.f('ix_credential_verifications_id'), table_name='credential_verifications')
    op.drop_table('credential_verifications')
    
    op.drop_index(op.f('ix_digital_credentials_status'), table_name='digital_credentials')
    op.drop_index(op.f('ix_digital_credentials_blockchain_credential_id'), table_name='digital_credentials')
    op.drop_index(op.f('ix_digital_credentials_blockchain_hash'), table_name='digital_credentials')
    op.drop_index(op.f('ix_digital_credentials_certificate_number'), table_name='digital_credentials')
    op.drop_index(op.f('ix_digital_credentials_sub_type'), table_name='digital_credentials')
    op.drop_index(op.f('ix_digital_credentials_credential_type'), table_name='digital_credentials')
    op.drop_index(op.f('ix_digital_credentials_issuer_id'), table_name='digital_credentials')
    op.drop_index(op.f('ix_digital_credentials_recipient_id'), table_name='digital_credentials')
    op.drop_index(op.f('ix_digital_credentials_institution_id'), table_name='digital_credentials')
    op.drop_index(op.f('ix_digital_credentials_id'), table_name='digital_credentials')
    op.drop_table('digital_credentials')
    
    sa.Enum(name='credentialstatus').drop(op.get_bind())
    sa.Enum(name='credentialsubtype').drop(op.get_bind())
    sa.Enum(name='credentialtype').drop(op.get_bind())
