"""add mobile auth security

Revision ID: add_mobile_auth_security
Revises: 
Create Date: 2024-01-15 10:00:00.000000

"""
from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql

revision = 'add_mobile_auth_security'
down_revision = None
branch_labels = None
depends_on = None


def upgrade():
    op.add_column('user_settings', sa.Column('biometric_enabled', sa.Boolean(), nullable=False, server_default='false'))
    op.add_column('user_settings', sa.Column('pin_enabled', sa.Boolean(), nullable=False, server_default='false'))
    op.add_column('user_settings', sa.Column('pin_hash', sa.String(length=255), nullable=True))
    op.add_column('user_settings', sa.Column('session_timeout_minutes', sa.Integer(), nullable=False, server_default='30'))
    op.add_column('user_settings', sa.Column('auto_lock_minutes', sa.Integer(), nullable=False, server_default='5'))
    op.add_column('user_settings', sa.Column('require_biometric_for_sensitive', sa.Boolean(), nullable=False, server_default='true'))

    op.add_column('user_devices', sa.Column('device_fingerprint', sa.String(length=255), nullable=True))
    op.add_column('user_devices', sa.Column('device_model', sa.String(length=100), nullable=True))
    op.add_column('user_devices', sa.Column('os_version', sa.String(length=50), nullable=True))
    op.add_column('user_devices', sa.Column('app_version', sa.String(length=50), nullable=True))
    op.add_column('user_devices', sa.Column('is_trusted', sa.Boolean(), nullable=False, server_default='false'))
    op.add_column('user_devices', sa.Column('biometric_enabled', sa.Boolean(), nullable=False, server_default='false'))
    op.add_column('user_devices', sa.Column('biometric_type', sa.String(length=50), nullable=True))
    
    op.create_index('idx_user_device_fingerprint', 'user_devices', ['device_fingerprint'], unique=False)

    op.create_table('mobile_auth_events',
        sa.Column('id', sa.Integer(), nullable=False),
        sa.Column('user_id', sa.Integer(), nullable=False),
        sa.Column('device_id', sa.Integer(), nullable=True),
        sa.Column('event_type', sa.String(length=50), nullable=False),
        sa.Column('auth_method', sa.String(length=50), nullable=False),
        sa.Column('success', sa.Boolean(), nullable=False),
        sa.Column('failure_reason', sa.String(length=255), nullable=True),
        sa.Column('device_fingerprint', sa.String(length=255), nullable=True),
        sa.Column('ip_address', sa.String(length=45), nullable=True),
        sa.Column('location', sa.String(length=255), nullable=True),
        sa.Column('device_info', postgresql.JSONB(astext_type=sa.Text()), nullable=True),
        sa.Column('metadata', postgresql.JSONB(astext_type=sa.Text()), nullable=True),
        sa.Column('created_at', sa.DateTime(), nullable=False),
        sa.ForeignKeyConstraint(['device_id'], ['user_devices.id'], ondelete='SET NULL'),
        sa.ForeignKeyConstraint(['user_id'], ['users.id'], ondelete='CASCADE'),
        sa.PrimaryKeyConstraint('id')
    )
    op.create_index('idx_mobile_auth_event_type', 'mobile_auth_events', ['event_type'], unique=False)
    op.create_index('idx_mobile_auth_success', 'mobile_auth_events', ['success'], unique=False)
    op.create_index('idx_mobile_auth_user_created', 'mobile_auth_events', ['user_id', 'created_at'], unique=False)
    op.create_index(op.f('ix_mobile_auth_events_created_at'), 'mobile_auth_events', ['created_at'], unique=False)
    op.create_index(op.f('ix_mobile_auth_events_device_id'), 'mobile_auth_events', ['device_id'], unique=False)
    op.create_index(op.f('ix_mobile_auth_events_id'), 'mobile_auth_events', ['id'], unique=False)
    op.create_index(op.f('ix_mobile_auth_events_user_id'), 'mobile_auth_events', ['user_id'], unique=False)

    op.create_table('biometric_sessions',
        sa.Column('id', sa.Integer(), nullable=False),
        sa.Column('user_id', sa.Integer(), nullable=False),
        sa.Column('device_id', sa.Integer(), nullable=False),
        sa.Column('session_token', sa.String(length=255), nullable=False),
        sa.Column('biometric_type', sa.String(length=50), nullable=False),
        sa.Column('is_active', sa.Boolean(), nullable=False),
        sa.Column('expires_at', sa.DateTime(), nullable=False),
        sa.Column('last_verified', sa.DateTime(), nullable=False),
        sa.Column('verification_count', sa.Integer(), nullable=False),
        sa.Column('created_at', sa.DateTime(), nullable=False),
        sa.ForeignKeyConstraint(['device_id'], ['user_devices.id'], ondelete='CASCADE'),
        sa.ForeignKeyConstraint(['user_id'], ['users.id'], ondelete='CASCADE'),
        sa.PrimaryKeyConstraint('id'),
        sa.UniqueConstraint('session_token')
    )
    op.create_index('idx_biometric_session_active', 'biometric_sessions', ['is_active'], unique=False)
    op.create_index('idx_biometric_session_expires', 'biometric_sessions', ['expires_at'], unique=False)
    op.create_index('idx_biometric_session_token', 'biometric_sessions', ['session_token'], unique=False)
    op.create_index(op.f('ix_biometric_sessions_id'), 'biometric_sessions', ['id'], unique=False)
    op.create_index(op.f('ix_biometric_sessions_user_id'), 'biometric_sessions', ['user_id'], unique=False)

    op.create_table('sensitive_operation_logs',
        sa.Column('id', sa.Integer(), nullable=False),
        sa.Column('user_id', sa.Integer(), nullable=False),
        sa.Column('device_id', sa.Integer(), nullable=True),
        sa.Column('operation_type', sa.String(length=100), nullable=False),
        sa.Column('operation_details', sa.Text(), nullable=True),
        sa.Column('required_reauth', sa.Boolean(), nullable=False),
        sa.Column('reauth_method', sa.String(length=50), nullable=True),
        sa.Column('reauth_success', sa.Boolean(), nullable=True),
        sa.Column('ip_address', sa.String(length=45), nullable=True),
        sa.Column('metadata', postgresql.JSONB(astext_type=sa.Text()), nullable=True),
        sa.Column('created_at', sa.DateTime(), nullable=False),
        sa.ForeignKeyConstraint(['device_id'], ['user_devices.id'], ondelete='SET NULL'),
        sa.ForeignKeyConstraint(['user_id'], ['users.id'], ondelete='CASCADE'),
        sa.PrimaryKeyConstraint('id')
    )
    op.create_index('idx_sensitive_op_reauth', 'sensitive_operation_logs', ['required_reauth'], unique=False)
    op.create_index('idx_sensitive_op_type', 'sensitive_operation_logs', ['operation_type'], unique=False)
    op.create_index('idx_sensitive_op_user_created', 'sensitive_operation_logs', ['user_id', 'created_at'], unique=False)
    op.create_index(op.f('ix_sensitive_operation_logs_created_at'), 'sensitive_operation_logs', ['created_at'], unique=False)
    op.create_index(op.f('ix_sensitive_operation_logs_device_id'), 'sensitive_operation_logs', ['device_id'], unique=False)
    op.create_index(op.f('ix_sensitive_operation_logs_id'), 'sensitive_operation_logs', ['id'], unique=False)
    op.create_index(op.f('ix_sensitive_operation_logs_user_id'), 'sensitive_operation_logs', ['user_id'], unique=False)

    op.create_table('pin_attempts',
        sa.Column('id', sa.Integer(), nullable=False),
        sa.Column('user_id', sa.Integer(), nullable=False),
        sa.Column('device_id', sa.Integer(), nullable=True),
        sa.Column('success', sa.Boolean(), nullable=False),
        sa.Column('attempt_count', sa.Integer(), nullable=False),
        sa.Column('locked_until', sa.DateTime(), nullable=True),
        sa.Column('ip_address', sa.String(length=45), nullable=True),
        sa.Column('created_at', sa.DateTime(), nullable=False),
        sa.ForeignKeyConstraint(['device_id'], ['user_devices.id'], ondelete='SET NULL'),
        sa.ForeignKeyConstraint(['user_id'], ['users.id'], ondelete='CASCADE'),
        sa.PrimaryKeyConstraint('id')
    )
    op.create_index('idx_pin_attempt_created', 'pin_attempts', ['created_at'], unique=False)
    op.create_index('idx_pin_attempt_locked', 'pin_attempts', ['locked_until'], unique=False)
    op.create_index('idx_pin_attempt_user', 'pin_attempts', ['user_id'], unique=False)
    op.create_index(op.f('ix_pin_attempts_id'), 'pin_attempts', ['id'], unique=False)


def downgrade():
    op.drop_index(op.f('ix_pin_attempts_id'), table_name='pin_attempts')
    op.drop_index('idx_pin_attempt_user', table_name='pin_attempts')
    op.drop_index('idx_pin_attempt_locked', table_name='pin_attempts')
    op.drop_index('idx_pin_attempt_created', table_name='pin_attempts')
    op.drop_table('pin_attempts')

    op.drop_index(op.f('ix_sensitive_operation_logs_user_id'), table_name='sensitive_operation_logs')
    op.drop_index(op.f('ix_sensitive_operation_logs_id'), table_name='sensitive_operation_logs')
    op.drop_index(op.f('ix_sensitive_operation_logs_device_id'), table_name='sensitive_operation_logs')
    op.drop_index(op.f('ix_sensitive_operation_logs_created_at'), table_name='sensitive_operation_logs')
    op.drop_index('idx_sensitive_op_user_created', table_name='sensitive_operation_logs')
    op.drop_index('idx_sensitive_op_type', table_name='sensitive_operation_logs')
    op.drop_index('idx_sensitive_op_reauth', table_name='sensitive_operation_logs')
    op.drop_table('sensitive_operation_logs')

    op.drop_index(op.f('ix_biometric_sessions_user_id'), table_name='biometric_sessions')
    op.drop_index(op.f('ix_biometric_sessions_id'), table_name='biometric_sessions')
    op.drop_index('idx_biometric_session_token', table_name='biometric_sessions')
    op.drop_index('idx_biometric_session_expires', table_name='biometric_sessions')
    op.drop_index('idx_biometric_session_active', table_name='biometric_sessions')
    op.drop_table('biometric_sessions')

    op.drop_index(op.f('ix_mobile_auth_events_user_id'), table_name='mobile_auth_events')
    op.drop_index(op.f('ix_mobile_auth_events_id'), table_name='mobile_auth_events')
    op.drop_index(op.f('ix_mobile_auth_events_device_id'), table_name='mobile_auth_events')
    op.drop_index(op.f('ix_mobile_auth_events_created_at'), table_name='mobile_auth_events')
    op.drop_index('idx_mobile_auth_user_created', table_name='mobile_auth_events')
    op.drop_index('idx_mobile_auth_success', table_name='mobile_auth_events')
    op.drop_index('idx_mobile_auth_event_type', table_name='mobile_auth_events')
    op.drop_table('mobile_auth_events')

    op.drop_index('idx_user_device_fingerprint', table_name='user_devices')
    op.drop_column('user_devices', 'biometric_type')
    op.drop_column('user_devices', 'biometric_enabled')
    op.drop_column('user_devices', 'is_trusted')
    op.drop_column('user_devices', 'app_version')
    op.drop_column('user_devices', 'os_version')
    op.drop_column('user_devices', 'device_model')
    op.drop_column('user_devices', 'device_fingerprint')

    op.drop_column('user_settings', 'require_biometric_for_sensitive')
    op.drop_column('user_settings', 'auto_lock_minutes')
    op.drop_column('user_settings', 'session_timeout_minutes')
    op.drop_column('user_settings', 'pin_hash')
    op.drop_column('user_settings', 'pin_enabled')
    op.drop_column('user_settings', 'biometric_enabled')
