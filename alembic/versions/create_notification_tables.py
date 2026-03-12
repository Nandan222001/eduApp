"""create_notification_tables

Revision ID: create_notification_tables
Revises: 
Create Date: 2024-01-01 00:00:00.000000

"""
from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql

# revision identifiers, used by Alembic.
revision = 'create_notification_tables'
down_revision = None
branch_labels = None
depends_on = None


def upgrade() -> None:
    # Create notifications table
    op.create_table('notifications',
        sa.Column('id', sa.Integer(), nullable=False),
        sa.Column('institution_id', sa.Integer(), nullable=False),
        sa.Column('user_id', sa.Integer(), nullable=False),
        sa.Column('title', sa.String(length=255), nullable=False),
        sa.Column('message', sa.Text(), nullable=False),
        sa.Column('notification_type', sa.String(length=50), nullable=False),
        sa.Column('notification_group', sa.String(length=50), nullable=False, server_default='system'),
        sa.Column('priority', sa.String(length=20), nullable=False, server_default='medium'),
        sa.Column('channel', sa.String(length=20), nullable=False),
        sa.Column('status', sa.String(length=20), nullable=False, server_default='pending'),
        sa.Column('data', postgresql.JSON(astext_type=sa.Text()), nullable=True),
        sa.Column('read_at', sa.DateTime(), nullable=True),
        sa.Column('sent_at', sa.DateTime(), nullable=True),
        sa.Column('failed_at', sa.DateTime(), nullable=True),
        sa.Column('error_message', sa.Text(), nullable=True),
        sa.Column('digest_batch_id', sa.String(length=100), nullable=True),
        sa.Column('grouped_with_id', sa.Integer(), nullable=True),
        sa.Column('group_count', sa.Integer(), nullable=False, server_default='1'),
        sa.Column('created_at', sa.DateTime(), nullable=False, server_default=sa.text('NOW()')),
        sa.Column('updated_at', sa.DateTime(), nullable=False, server_default=sa.text('NOW()')),
        sa.ForeignKeyConstraint(['institution_id'], ['institutions.id'], ondelete='CASCADE'),
        sa.ForeignKeyConstraint(['user_id'], ['users.id'], ondelete='CASCADE'),
        sa.ForeignKeyConstraint(['grouped_with_id'], ['notifications.id'], ondelete='SET NULL'),
        sa.PrimaryKeyConstraint('id')
    )
    op.create_index('idx_notification_user_status', 'notifications', ['user_id', 'status'])
    op.create_index('idx_notification_user_created', 'notifications', ['user_id', 'created_at'])
    op.create_index('idx_notification_institution', 'notifications', ['institution_id'])
    op.create_index('idx_notification_status', 'notifications', ['status'])
    op.create_index('idx_notification_channel', 'notifications', ['channel'])
    op.create_index('idx_notification_group', 'notifications', ['notification_group'])
    op.create_index('idx_notification_digest_batch', 'notifications', ['digest_batch_id'])

    # Create notification_preferences table
    op.create_table('notification_preferences',
        sa.Column('id', sa.Integer(), nullable=False),
        sa.Column('user_id', sa.Integer(), nullable=False),
        sa.Column('email_enabled', sa.Boolean(), nullable=False, server_default='true'),
        sa.Column('sms_enabled', sa.Boolean(), nullable=False, server_default='false'),
        sa.Column('push_enabled', sa.Boolean(), nullable=False, server_default='true'),
        sa.Column('in_app_enabled', sa.Boolean(), nullable=False, server_default='true'),
        sa.Column('email_types', postgresql.JSON(astext_type=sa.Text()), nullable=True),
        sa.Column('sms_types', postgresql.JSON(astext_type=sa.Text()), nullable=True),
        sa.Column('push_types', postgresql.JSON(astext_type=sa.Text()), nullable=True),
        sa.Column('in_app_types', postgresql.JSON(astext_type=sa.Text()), nullable=True),
        sa.Column('group_preferences', postgresql.JSON(astext_type=sa.Text()), nullable=True),
        sa.Column('minimum_priority', sa.String(length=20), nullable=False, server_default='low'),
        sa.Column('quiet_hours_enabled', sa.Boolean(), nullable=False, server_default='false'),
        sa.Column('quiet_hours_start', sa.String(length=5), nullable=True),
        sa.Column('quiet_hours_end', sa.String(length=5), nullable=True),
        sa.Column('quiet_hours_days', postgresql.JSON(astext_type=sa.Text()), nullable=True),
        sa.Column('digest_mode', sa.String(length=20), nullable=False, server_default='disabled'),
        sa.Column('digest_channels', postgresql.JSON(astext_type=sa.Text()), nullable=True),
        sa.Column('digest_delivery_time', sa.String(length=5), nullable=True),
        sa.Column('enable_smart_grouping', sa.Boolean(), nullable=False, server_default='true'),
        sa.Column('grouping_window_minutes', sa.Integer(), nullable=False, server_default='60'),
        sa.Column('dnd_enabled', sa.Boolean(), nullable=False, server_default='false'),
        sa.Column('created_at', sa.DateTime(), nullable=False, server_default=sa.text('NOW()')),
        sa.Column('updated_at', sa.DateTime(), nullable=False, server_default=sa.text('NOW()')),
        sa.ForeignKeyConstraint(['user_id'], ['users.id'], ondelete='CASCADE'),
        sa.PrimaryKeyConstraint('id'),
        sa.UniqueConstraint('user_id')
    )
    op.create_index(op.f('ix_notification_preferences_user_id'), 'notification_preferences', ['user_id'], unique=True)

    # Create notification_deliveries table
    op.create_table('notification_deliveries',
        sa.Column('id', sa.Integer(), nullable=False),
        sa.Column('notification_id', sa.Integer(), nullable=False),
        sa.Column('channel', sa.String(length=20), nullable=False),
        sa.Column('status', sa.String(length=20), nullable=False),
        sa.Column('attempt_count', sa.Integer(), nullable=False, server_default='1'),
        sa.Column('delivered_at', sa.DateTime(), nullable=True),
        sa.Column('failed_at', sa.DateTime(), nullable=True),
        sa.Column('error_message', sa.Text(), nullable=True),
        sa.Column('provider_response', postgresql.JSON(astext_type=sa.Text()), nullable=True),
        sa.Column('created_at', sa.DateTime(), nullable=False, server_default=sa.text('NOW()')),
        sa.Column('updated_at', sa.DateTime(), nullable=False, server_default=sa.text('NOW()')),
        sa.ForeignKeyConstraint(['notification_id'], ['notifications.id'], ondelete='CASCADE'),
        sa.PrimaryKeyConstraint('id')
    )
    op.create_index('idx_delivery_notification', 'notification_deliveries', ['notification_id'])
    op.create_index('idx_delivery_channel_status', 'notification_deliveries', ['channel', 'status'])
    op.create_index('idx_delivery_created', 'notification_deliveries', ['created_at'])

    # Create notification_engagements table
    op.create_table('notification_engagements',
        sa.Column('id', sa.Integer(), nullable=False),
        sa.Column('notification_id', sa.Integer(), nullable=False),
        sa.Column('user_id', sa.Integer(), nullable=False),
        sa.Column('action', sa.String(length=50), nullable=False),
        sa.Column('action_data', postgresql.JSON(astext_type=sa.Text()), nullable=True),
        sa.Column('created_at', sa.DateTime(), nullable=False, server_default=sa.text('NOW()')),
        sa.ForeignKeyConstraint(['notification_id'], ['notifications.id'], ondelete='CASCADE'),
        sa.ForeignKeyConstraint(['user_id'], ['users.id'], ondelete='CASCADE'),
        sa.PrimaryKeyConstraint('id')
    )
    op.create_index('idx_engagement_notification', 'notification_engagements', ['notification_id'])
    op.create_index('idx_engagement_user', 'notification_engagements', ['user_id'])
    op.create_index('idx_engagement_action', 'notification_engagements', ['action'])
    op.create_index('idx_engagement_created', 'notification_engagements', ['created_at'])

    # Create notification_analytics table
    op.create_table('notification_analytics',
        sa.Column('id', sa.Integer(), nullable=False),
        sa.Column('institution_id', sa.Integer(), nullable=False),
        sa.Column('date', sa.DateTime(), nullable=False),
        sa.Column('notification_type', sa.String(length=50), nullable=False),
        sa.Column('notification_group', sa.String(length=50), nullable=False),
        sa.Column('channel', sa.String(length=20), nullable=False),
        sa.Column('priority', sa.String(length=20), nullable=False),
        sa.Column('total_sent', sa.Integer(), nullable=False, server_default='0'),
        sa.Column('total_delivered', sa.Integer(), nullable=False, server_default='0'),
        sa.Column('total_failed', sa.Integer(), nullable=False, server_default='0'),
        sa.Column('total_read', sa.Integer(), nullable=False, server_default='0'),
        sa.Column('total_clicked', sa.Integer(), nullable=False, server_default='0'),
        sa.Column('delivery_rate', sa.Float(), nullable=False, server_default='0.0'),
        sa.Column('read_rate', sa.Float(), nullable=False, server_default='0.0'),
        sa.Column('click_rate', sa.Float(), nullable=False, server_default='0.0'),
        sa.Column('avg_read_time_seconds', sa.Integer(), nullable=True),
        sa.Column('avg_delivery_time_seconds', sa.Integer(), nullable=True),
        sa.Column('created_at', sa.DateTime(), nullable=False, server_default=sa.text('NOW()')),
        sa.Column('updated_at', sa.DateTime(), nullable=False, server_default=sa.text('NOW()')),
        sa.ForeignKeyConstraint(['institution_id'], ['institutions.id'], ondelete='CASCADE'),
        sa.PrimaryKeyConstraint('id')
    )
    op.create_index('idx_analytics_institution_date', 'notification_analytics', ['institution_id', 'date'])
    op.create_index('idx_analytics_type', 'notification_analytics', ['notification_type'])
    op.create_index('idx_analytics_group', 'notification_analytics', ['notification_group'])
    op.create_index('idx_analytics_channel', 'notification_analytics', ['channel'])

    # Create announcements table
    op.create_table('announcements',
        sa.Column('id', sa.Integer(), nullable=False),
        sa.Column('institution_id', sa.Integer(), nullable=False),
        sa.Column('created_by', sa.Integer(), nullable=False),
        sa.Column('title', sa.String(length=255), nullable=False),
        sa.Column('content', sa.Text(), nullable=False),
        sa.Column('audience_type', sa.String(length=20), nullable=False),
        sa.Column('audience_filter', postgresql.JSON(astext_type=sa.Text()), nullable=True),
        sa.Column('priority', sa.String(length=20), nullable=False, server_default='medium'),
        sa.Column('channels', postgresql.JSON(astext_type=sa.Text()), nullable=False),
        sa.Column('scheduled_at', sa.DateTime(), nullable=True),
        sa.Column('expires_at', sa.DateTime(), nullable=True),
        sa.Column('is_published', sa.Boolean(), nullable=False, server_default='false'),
        sa.Column('published_at', sa.DateTime(), nullable=True),
        sa.Column('attachments', postgresql.JSON(astext_type=sa.Text()), nullable=True),
        sa.Column('created_at', sa.DateTime(), nullable=False, server_default=sa.text('NOW()')),
        sa.Column('updated_at', sa.DateTime(), nullable=False, server_default=sa.text('NOW()')),
        sa.ForeignKeyConstraint(['institution_id'], ['institutions.id'], ondelete='CASCADE'),
        sa.ForeignKeyConstraint(['created_by'], ['users.id'], ondelete='CASCADE'),
        sa.PrimaryKeyConstraint('id')
    )
    op.create_index('idx_announcement_institution', 'announcements', ['institution_id'])
    op.create_index('idx_announcement_published', 'announcements', ['is_published', 'published_at'])
    op.create_index('idx_announcement_scheduled', 'announcements', ['scheduled_at'])

    # Create messages table
    op.create_table('messages',
        sa.Column('id', sa.Integer(), nullable=False),
        sa.Column('institution_id', sa.Integer(), nullable=False),
        sa.Column('sender_id', sa.Integer(), nullable=False),
        sa.Column('recipient_id', sa.Integer(), nullable=False),
        sa.Column('parent_id', sa.Integer(), nullable=True),
        sa.Column('subject', sa.String(length=255), nullable=True),
        sa.Column('content', sa.Text(), nullable=False),
        sa.Column('is_read', sa.Boolean(), nullable=False, server_default='false'),
        sa.Column('read_at', sa.DateTime(), nullable=True),
        sa.Column('is_deleted_by_sender', sa.Boolean(), nullable=False, server_default='false'),
        sa.Column('is_deleted_by_recipient', sa.Boolean(), nullable=False, server_default='false'),
        sa.Column('attachments', postgresql.JSON(astext_type=sa.Text()), nullable=True),
        sa.Column('created_at', sa.DateTime(), nullable=False, server_default=sa.text('NOW()')),
        sa.Column('updated_at', sa.DateTime(), nullable=False, server_default=sa.text('NOW()')),
        sa.ForeignKeyConstraint(['institution_id'], ['institutions.id'], ondelete='CASCADE'),
        sa.ForeignKeyConstraint(['sender_id'], ['users.id'], ondelete='CASCADE'),
        sa.ForeignKeyConstraint(['recipient_id'], ['users.id'], ondelete='CASCADE'),
        sa.ForeignKeyConstraint(['parent_id'], ['messages.id'], ondelete='CASCADE'),
        sa.PrimaryKeyConstraint('id')
    )
    op.create_index('idx_message_sender', 'messages', ['sender_id', 'created_at'])
    op.create_index('idx_message_recipient', 'messages', ['recipient_id', 'is_read', 'created_at'])
    op.create_index('idx_message_institution', 'messages', ['institution_id'])

    # Create notification_templates table
    op.create_table('notification_templates',
        sa.Column('id', sa.Integer(), nullable=False),
        sa.Column('institution_id', sa.Integer(), nullable=True),
        sa.Column('name', sa.String(length=100), nullable=False),
        sa.Column('notification_type', sa.String(length=50), nullable=False),
        sa.Column('channel', sa.String(length=20), nullable=False),
        sa.Column('subject_template', sa.String(length=255), nullable=True),
        sa.Column('body_template', sa.Text(), nullable=False),
        sa.Column('variables', postgresql.JSON(astext_type=sa.Text()), nullable=True),
        sa.Column('is_active', sa.Boolean(), nullable=False, server_default='true'),
        sa.Column('created_at', sa.DateTime(), nullable=False, server_default=sa.text('NOW()')),
        sa.Column('updated_at', sa.DateTime(), nullable=False, server_default=sa.text('NOW()')),
        sa.ForeignKeyConstraint(['institution_id'], ['institutions.id'], ondelete='CASCADE'),
        sa.PrimaryKeyConstraint('id')
    )
    op.create_index('idx_template_institution_type', 'notification_templates', ['institution_id', 'notification_type'])
    op.create_index('idx_template_type_channel', 'notification_templates', ['notification_type', 'channel'])


def downgrade() -> None:
    op.drop_index('idx_template_type_channel', table_name='notification_templates')
    op.drop_index('idx_template_institution_type', table_name='notification_templates')
    op.drop_table('notification_templates')
    
    op.drop_index('idx_message_institution', table_name='messages')
    op.drop_index('idx_message_recipient', table_name='messages')
    op.drop_index('idx_message_sender', table_name='messages')
    op.drop_table('messages')
    
    op.drop_index('idx_announcement_scheduled', table_name='announcements')
    op.drop_index('idx_announcement_published', table_name='announcements')
    op.drop_index('idx_announcement_institution', table_name='announcements')
    op.drop_table('announcements')
    
    op.drop_index('idx_analytics_channel', table_name='notification_analytics')
    op.drop_index('idx_analytics_group', table_name='notification_analytics')
    op.drop_index('idx_analytics_type', table_name='notification_analytics')
    op.drop_index('idx_analytics_institution_date', table_name='notification_analytics')
    op.drop_table('notification_analytics')
    
    op.drop_index('idx_engagement_created', table_name='notification_engagements')
    op.drop_index('idx_engagement_action', table_name='notification_engagements')
    op.drop_index('idx_engagement_user', table_name='notification_engagements')
    op.drop_index('idx_engagement_notification', table_name='notification_engagements')
    op.drop_table('notification_engagements')
    
    op.drop_index('idx_delivery_created', table_name='notification_deliveries')
    op.drop_index('idx_delivery_channel_status', table_name='notification_deliveries')
    op.drop_index('idx_delivery_notification', table_name='notification_deliveries')
    op.drop_table('notification_deliveries')
    
    op.drop_index(op.f('ix_notification_preferences_user_id'), table_name='notification_preferences')
    op.drop_table('notification_preferences')
    
    op.drop_index('idx_notification_digest_batch', table_name='notifications')
    op.drop_index('idx_notification_group', table_name='notifications')
    op.drop_index('idx_notification_channel', table_name='notifications')
    op.drop_index('idx_notification_status', table_name='notifications')
    op.drop_index('idx_notification_institution', table_name='notifications')
    op.drop_index('idx_notification_user_created', table_name='notifications')
    op.drop_index('idx_notification_user_status', table_name='notifications')
    op.drop_table('notifications')
