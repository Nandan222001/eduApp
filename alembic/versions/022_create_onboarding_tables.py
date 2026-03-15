"""create onboarding tables

Revision ID: 022_create_onboarding
Revises: 021_create_merchandise
Create Date: 2024-01-16 10:00:00.000000

"""
from typing import Sequence, Union
from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql

# revision identifiers, used by Alembic.
revision: str = '022_create_onboarding'
down_revision: Union[str, None] = '021_create_merchandise'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    # Create onboarding_flows table
    op.create_table(
        'onboarding_flows',
        sa.Column('id', sa.Integer(), nullable=False),
        sa.Column('institution_id', sa.Integer(), nullable=False),
        sa.Column('name', sa.String(length=255), nullable=False),
        sa.Column('description', sa.Text(), nullable=True),
        sa.Column('role_specific', sa.String(length=50), nullable=True),
        sa.Column('grade_level', sa.String(length=100), nullable=True),
        sa.Column('is_active', sa.Boolean(), nullable=False),
        sa.Column('is_default', sa.Boolean(), nullable=False),
        sa.Column('created_by', sa.Integer(), nullable=True),
        sa.Column('created_at', sa.DateTime(), nullable=False),
        sa.Column('updated_at', sa.DateTime(), nullable=False),
        sa.ForeignKeyConstraint(['institution_id'], ['institutions.id'], ondelete='CASCADE'),
        sa.ForeignKeyConstraint(['created_by'], ['users.id'], ondelete='SET NULL'),
        sa.PrimaryKeyConstraint('id')
    )
    op.create_index('idx_onboarding_flow_institution', 'onboarding_flows', ['institution_id'])
    op.create_index('idx_onboarding_flow_role', 'onboarding_flows', ['role_specific'])
    op.create_index('idx_onboarding_flow_active', 'onboarding_flows', ['is_active'])
    op.create_index('idx_onboarding_flow_default', 'onboarding_flows', ['is_default'])
    op.create_index(op.f('ix_onboarding_flows_id'), 'onboarding_flows', ['id'])
    op.create_index(op.f('ix_onboarding_flows_institution_id'), 'onboarding_flows', ['institution_id'])
    op.create_index(op.f('ix_onboarding_flows_created_by'), 'onboarding_flows', ['created_by'])

    # Create onboarding_steps table
    op.create_table(
        'onboarding_steps',
        sa.Column('id', sa.Integer(), nullable=False),
        sa.Column('flow_id', sa.Integer(), nullable=False),
        sa.Column('step_order', sa.Integer(), nullable=False),
        sa.Column('step_type', sa.String(length=50), nullable=False),
        sa.Column('title', sa.String(length=255), nullable=False),
        sa.Column('description', sa.Text(), nullable=True),
        sa.Column('step_content', postgresql.JSON(astext_type=sa.Text()), nullable=True),
        sa.Column('is_required', sa.Boolean(), nullable=False),
        sa.Column('conditional_logic', postgresql.JSON(astext_type=sa.Text()), nullable=True),
        sa.Column('created_at', sa.DateTime(), nullable=False),
        sa.Column('updated_at', sa.DateTime(), nullable=False),
        sa.ForeignKeyConstraint(['flow_id'], ['onboarding_flows.id'], ondelete='CASCADE'),
        sa.PrimaryKeyConstraint('id'),
        sa.UniqueConstraint('flow_id', 'step_order', name='uq_flow_step_order')
    )
    op.create_index('idx_onboarding_step_flow', 'onboarding_steps', ['flow_id'])
    op.create_index('idx_onboarding_step_type', 'onboarding_steps', ['step_type'])
    op.create_index('idx_onboarding_step_order', 'onboarding_steps', ['step_order'])
    op.create_index(op.f('ix_onboarding_steps_id'), 'onboarding_steps', ['id'])
    op.create_index(op.f('ix_onboarding_steps_flow_id'), 'onboarding_steps', ['flow_id'])

    # Create onboarding_progress table
    op.create_table(
        'onboarding_progress',
        sa.Column('id', sa.Integer(), nullable=False),
        sa.Column('user_id', sa.Integer(), nullable=False),
        sa.Column('flow_id', sa.Integer(), nullable=False),
        sa.Column('is_completed', sa.Boolean(), nullable=False),
        sa.Column('current_step_order', sa.Integer(), nullable=False),
        sa.Column('started_at', sa.DateTime(), nullable=False),
        sa.Column('completed_at', sa.DateTime(), nullable=True),
        sa.Column('updated_at', sa.DateTime(), nullable=False),
        sa.ForeignKeyConstraint(['user_id'], ['users.id'], ondelete='CASCADE'),
        sa.ForeignKeyConstraint(['flow_id'], ['onboarding_flows.id'], ondelete='CASCADE'),
        sa.PrimaryKeyConstraint('id'),
        sa.UniqueConstraint('user_id', 'flow_id', name='uq_user_flow')
    )
    op.create_index('idx_onboarding_progress_user', 'onboarding_progress', ['user_id'])
    op.create_index('idx_onboarding_progress_flow', 'onboarding_progress', ['flow_id'])
    op.create_index('idx_onboarding_progress_completed', 'onboarding_progress', ['is_completed'])
    op.create_index(op.f('ix_onboarding_progress_id'), 'onboarding_progress', ['id'])
    op.create_index(op.f('ix_onboarding_progress_user_id'), 'onboarding_progress', ['user_id'])
    op.create_index(op.f('ix_onboarding_progress_flow_id'), 'onboarding_progress', ['flow_id'])

    # Create onboarding_step_progress table
    op.create_table(
        'onboarding_step_progress',
        sa.Column('id', sa.Integer(), nullable=False),
        sa.Column('progress_id', sa.Integer(), nullable=False),
        sa.Column('step_id', sa.Integer(), nullable=False),
        sa.Column('is_completed', sa.Boolean(), nullable=False),
        sa.Column('is_skipped', sa.Boolean(), nullable=False),
        sa.Column('response_data', postgresql.JSON(astext_type=sa.Text()), nullable=True),
        sa.Column('started_at', sa.DateTime(), nullable=False),
        sa.Column('completed_at', sa.DateTime(), nullable=True),
        sa.Column('updated_at', sa.DateTime(), nullable=False),
        sa.ForeignKeyConstraint(['progress_id'], ['onboarding_progress.id'], ondelete='CASCADE'),
        sa.ForeignKeyConstraint(['step_id'], ['onboarding_steps.id'], ondelete='CASCADE'),
        sa.PrimaryKeyConstraint('id'),
        sa.UniqueConstraint('progress_id', 'step_id', name='uq_progress_step')
    )
    op.create_index('idx_step_progress_progress', 'onboarding_step_progress', ['progress_id'])
    op.create_index('idx_step_progress_step', 'onboarding_step_progress', ['step_id'])
    op.create_index('idx_step_progress_completed', 'onboarding_step_progress', ['is_completed'])
    op.create_index(op.f('ix_onboarding_step_progress_id'), 'onboarding_step_progress', ['id'])
    op.create_index(op.f('ix_onboarding_step_progress_progress_id'), 'onboarding_step_progress', ['progress_id'])
    op.create_index(op.f('ix_onboarding_step_progress_step_id'), 'onboarding_step_progress', ['step_id'])

    # Create onboarding_documents table
    op.create_table(
        'onboarding_documents',
        sa.Column('id', sa.Integer(), nullable=False),
        sa.Column('institution_id', sa.Integer(), nullable=False),
        sa.Column('user_id', sa.Integer(), nullable=False),
        sa.Column('step_progress_id', sa.Integer(), nullable=True),
        sa.Column('document_type', sa.String(length=100), nullable=False),
        sa.Column('document_name', sa.String(length=255), nullable=False),
        sa.Column('file_url', sa.String(length=500), nullable=False),
        sa.Column('file_size', sa.Integer(), nullable=True),
        sa.Column('mime_type', sa.String(length=100), nullable=True),
        sa.Column('is_verified', sa.Boolean(), nullable=False),
        sa.Column('verified_by', sa.Integer(), nullable=True),
        sa.Column('verified_at', sa.DateTime(), nullable=True),
        sa.Column('created_at', sa.DateTime(), nullable=False),
        sa.Column('updated_at', sa.DateTime(), nullable=False),
        sa.ForeignKeyConstraint(['institution_id'], ['institutions.id'], ondelete='CASCADE'),
        sa.ForeignKeyConstraint(['user_id'], ['users.id'], ondelete='CASCADE'),
        sa.ForeignKeyConstraint(['step_progress_id'], ['onboarding_step_progress.id'], ondelete='CASCADE'),
        sa.ForeignKeyConstraint(['verified_by'], ['users.id'], ondelete='SET NULL'),
        sa.PrimaryKeyConstraint('id')
    )
    op.create_index('idx_onboarding_document_institution', 'onboarding_documents', ['institution_id'])
    op.create_index('idx_onboarding_document_user', 'onboarding_documents', ['user_id'])
    op.create_index('idx_onboarding_document_step', 'onboarding_documents', ['step_progress_id'])
    op.create_index('idx_onboarding_document_verified', 'onboarding_documents', ['is_verified'])
    op.create_index(op.f('ix_onboarding_documents_id'), 'onboarding_documents', ['id'])
    op.create_index(op.f('ix_onboarding_documents_institution_id'), 'onboarding_documents', ['institution_id'])
    op.create_index(op.f('ix_onboarding_documents_user_id'), 'onboarding_documents', ['user_id'])
    op.create_index(op.f('ix_onboarding_documents_step_progress_id'), 'onboarding_documents', ['step_progress_id'])

    # Create onboarding_signatures table
    op.create_table(
        'onboarding_signatures',
        sa.Column('id', sa.Integer(), nullable=False),
        sa.Column('institution_id', sa.Integer(), nullable=False),
        sa.Column('user_id', sa.Integer(), nullable=False),
        sa.Column('step_progress_id', sa.Integer(), nullable=True),
        sa.Column('agreement_type', sa.String(length=100), nullable=False),
        sa.Column('agreement_text', sa.Text(), nullable=False),
        sa.Column('signature_data', sa.Text(), nullable=True),
        sa.Column('ip_address', sa.String(length=50), nullable=True),
        sa.Column('user_agent', sa.String(length=255), nullable=True),
        sa.Column('signed_at', sa.DateTime(), nullable=False),
        sa.ForeignKeyConstraint(['institution_id'], ['institutions.id'], ondelete='CASCADE'),
        sa.ForeignKeyConstraint(['user_id'], ['users.id'], ondelete='CASCADE'),
        sa.ForeignKeyConstraint(['step_progress_id'], ['onboarding_step_progress.id'], ondelete='CASCADE'),
        sa.PrimaryKeyConstraint('id')
    )
    op.create_index('idx_onboarding_signature_institution', 'onboarding_signatures', ['institution_id'])
    op.create_index('idx_onboarding_signature_user', 'onboarding_signatures', ['user_id'])
    op.create_index('idx_onboarding_signature_step', 'onboarding_signatures', ['step_progress_id'])
    op.create_index('idx_onboarding_signature_type', 'onboarding_signatures', ['agreement_type'])
    op.create_index(op.f('ix_onboarding_signatures_id'), 'onboarding_signatures', ['id'])
    op.create_index(op.f('ix_onboarding_signatures_institution_id'), 'onboarding_signatures', ['institution_id'])
    op.create_index(op.f('ix_onboarding_signatures_user_id'), 'onboarding_signatures', ['user_id'])
    op.create_index(op.f('ix_onboarding_signatures_step_progress_id'), 'onboarding_signatures', ['step_progress_id'])


def downgrade() -> None:
    op.drop_index(op.f('ix_onboarding_signatures_step_progress_id'), table_name='onboarding_signatures')
    op.drop_index(op.f('ix_onboarding_signatures_user_id'), table_name='onboarding_signatures')
    op.drop_index(op.f('ix_onboarding_signatures_institution_id'), table_name='onboarding_signatures')
    op.drop_index(op.f('ix_onboarding_signatures_id'), table_name='onboarding_signatures')
    op.drop_index('idx_onboarding_signature_type', table_name='onboarding_signatures')
    op.drop_index('idx_onboarding_signature_step', table_name='onboarding_signatures')
    op.drop_index('idx_onboarding_signature_user', table_name='onboarding_signatures')
    op.drop_index('idx_onboarding_signature_institution', table_name='onboarding_signatures')
    op.drop_table('onboarding_signatures')
    
    op.drop_index(op.f('ix_onboarding_documents_step_progress_id'), table_name='onboarding_documents')
    op.drop_index(op.f('ix_onboarding_documents_user_id'), table_name='onboarding_documents')
    op.drop_index(op.f('ix_onboarding_documents_institution_id'), table_name='onboarding_documents')
    op.drop_index(op.f('ix_onboarding_documents_id'), table_name='onboarding_documents')
    op.drop_index('idx_onboarding_document_verified', table_name='onboarding_documents')
    op.drop_index('idx_onboarding_document_step', table_name='onboarding_documents')
    op.drop_index('idx_onboarding_document_user', table_name='onboarding_documents')
    op.drop_index('idx_onboarding_document_institution', table_name='onboarding_documents')
    op.drop_table('onboarding_documents')
    
    op.drop_index(op.f('ix_onboarding_step_progress_step_id'), table_name='onboarding_step_progress')
    op.drop_index(op.f('ix_onboarding_step_progress_progress_id'), table_name='onboarding_step_progress')
    op.drop_index(op.f('ix_onboarding_step_progress_id'), table_name='onboarding_step_progress')
    op.drop_index('idx_step_progress_completed', table_name='onboarding_step_progress')
    op.drop_index('idx_step_progress_step', table_name='onboarding_step_progress')
    op.drop_index('idx_step_progress_progress', table_name='onboarding_step_progress')
    op.drop_table('onboarding_step_progress')
    
    op.drop_index(op.f('ix_onboarding_progress_flow_id'), table_name='onboarding_progress')
    op.drop_index(op.f('ix_onboarding_progress_user_id'), table_name='onboarding_progress')
    op.drop_index(op.f('ix_onboarding_progress_id'), table_name='onboarding_progress')
    op.drop_index('idx_onboarding_progress_completed', table_name='onboarding_progress')
    op.drop_index('idx_onboarding_progress_flow', table_name='onboarding_progress')
    op.drop_index('idx_onboarding_progress_user', table_name='onboarding_progress')
    op.drop_table('onboarding_progress')
    
    op.drop_index(op.f('ix_onboarding_steps_flow_id'), table_name='onboarding_steps')
    op.drop_index(op.f('ix_onboarding_steps_id'), table_name='onboarding_steps')
    op.drop_index('idx_onboarding_step_order', table_name='onboarding_steps')
    op.drop_index('idx_onboarding_step_type', table_name='onboarding_steps')
    op.drop_index('idx_onboarding_step_flow', table_name='onboarding_steps')
    op.drop_table('onboarding_steps')
    
    op.drop_index(op.f('ix_onboarding_flows_created_by'), table_name='onboarding_flows')
    op.drop_index(op.f('ix_onboarding_flows_institution_id'), table_name='onboarding_flows')
    op.drop_index(op.f('ix_onboarding_flows_id'), table_name='onboarding_flows')
    op.drop_index('idx_onboarding_flow_default', table_name='onboarding_flows')
    op.drop_index('idx_onboarding_flow_active', table_name='onboarding_flows')
    op.drop_index('idx_onboarding_flow_role', table_name='onboarding_flows')
    op.drop_index('idx_onboarding_flow_institution', table_name='onboarding_flows')
    op.drop_table('onboarding_flows')
