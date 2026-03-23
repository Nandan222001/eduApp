"""create live events tables

Revision ID: create_live_events_001
Revises: 
Create Date: 2024-01-15 10:00:00.000000

"""
from alembic import op
import sqlalchemy as sa

# revision identifiers, used by Alembic.
revision = 'create_live_events_001'
down_revision = None  # Update this to point to your latest migration
branch_labels = None
depends_on = None


def upgrade():
    # Create live_events table
    op.create_table(
        'live_events',
        sa.Column('id', sa.Integer(), nullable=False),
        sa.Column('institution_id', sa.Integer(), nullable=False),
        sa.Column('created_by', sa.Integer(), nullable=False),
        sa.Column('event_name', sa.String(length=255), nullable=False),
        sa.Column('event_type', sa.String(length=50), nullable=False),
        sa.Column('description', sa.Text(), nullable=True),
        sa.Column('scheduled_start_time', sa.DateTime(), nullable=False),
        sa.Column('scheduled_end_time', sa.DateTime(), nullable=True),
        sa.Column('actual_start_time', sa.DateTime(), nullable=True),
        sa.Column('actual_end_time', sa.DateTime(), nullable=True),
        sa.Column('status', sa.String(length=20), nullable=False),
        
        sa.Column('stream_platform', sa.String(length=20), nullable=False),
        sa.Column('stream_url', sa.String(length=500), nullable=True),
        sa.Column('stream_key', sa.String(length=500), nullable=True),
        sa.Column('stream_embed_url', sa.String(length=500), nullable=True),
        sa.Column('recording_url', sa.String(length=500), nullable=True),
        sa.Column('recording_s3_key', sa.String(length=500), nullable=True),
        
        sa.Column('viewer_count', sa.Integer(), nullable=False, server_default='0'),
        sa.Column('peak_viewer_count', sa.Integer(), nullable=False, server_default='0'),
        sa.Column('total_views', sa.Integer(), nullable=False, server_default='0'),
        
        sa.Column('chat_enabled', sa.Boolean(), nullable=False, server_default='true'),
        sa.Column('chat_moderated', sa.Boolean(), nullable=False, server_default='true'),
        
        sa.Column('restricted_access', sa.String(length=20), nullable=False),
        sa.Column('allowed_grade_ids', sa.JSON(), nullable=True),
        sa.Column('allowed_section_ids', sa.JSON(), nullable=True),
        
        sa.Column('monetization_enabled', sa.Boolean(), nullable=False, server_default='false'),
        sa.Column('ticket_price', sa.Integer(), nullable=True),
        sa.Column('ticket_currency', sa.String(length=3), nullable=False, server_default='INR'),
        
        sa.Column('auto_record', sa.Boolean(), nullable=False, server_default='true'),
        sa.Column('recording_retention_days', sa.Integer(), nullable=True),
        sa.Column('recording_archived', sa.Boolean(), nullable=False, server_default='false'),
        sa.Column('recording_archived_at', sa.DateTime(), nullable=True),
        
        sa.Column('thumbnail_url', sa.String(length=500), nullable=True),
        sa.Column('tags', sa.JSON(), nullable=True),
        sa.Column('external_stream_id', sa.String(length=255), nullable=True),
        sa.Column('stream_metadata', sa.JSON(), nullable=True),
        
        sa.Column('created_at', sa.DateTime(), nullable=False),
        sa.Column('updated_at', sa.DateTime(), nullable=False),
        
        sa.PrimaryKeyConstraint('id'),
        sa.ForeignKeyConstraint(['institution_id'], ['institutions.id'], ondelete='CASCADE'),
        sa.ForeignKeyConstraint(['created_by'], ['users.id'], ondelete='CASCADE'),
    )
    
    op.create_index('idx_live_event_institution', 'live_events', ['institution_id'])
    op.create_index('idx_live_event_created_by', 'live_events', ['created_by'])
    op.create_index('idx_live_event_type', 'live_events', ['event_type'])
    op.create_index('idx_live_event_scheduled_start', 'live_events', ['scheduled_start_time'])
    op.create_index('idx_live_event_status', 'live_events', ['status'])
    op.create_index('idx_live_event_restricted_access', 'live_events', ['restricted_access'])
    
    # Create event_viewers table
    op.create_table(
        'event_viewers',
        sa.Column('id', sa.Integer(), nullable=False),
        sa.Column('live_event_id', sa.Integer(), nullable=False),
        sa.Column('user_id', sa.Integer(), nullable=False),
        sa.Column('student_id', sa.Integer(), nullable=True),
        
        sa.Column('joined_at', sa.DateTime(), nullable=False),
        sa.Column('left_at', sa.DateTime(), nullable=True),
        sa.Column('watch_duration', sa.Integer(), nullable=False, server_default='0'),
        sa.Column('is_currently_watching', sa.Boolean(), nullable=False, server_default='true'),
        
        sa.Column('device_type', sa.String(length=50), nullable=True),
        sa.Column('browser', sa.String(length=100), nullable=True),
        sa.Column('ip_address', sa.String(length=45), nullable=True),
        sa.Column('location', sa.String(length=255), nullable=True),
        
        sa.Column('messages_sent', sa.Integer(), nullable=False, server_default='0'),
        sa.Column('reactions_count', sa.Integer(), nullable=False, server_default='0'),
        
        sa.Column('created_at', sa.DateTime(), nullable=False),
        sa.Column('updated_at', sa.DateTime(), nullable=False),
        
        sa.PrimaryKeyConstraint('id'),
        sa.ForeignKeyConstraint(['live_event_id'], ['live_events.id'], ondelete='CASCADE'),
        sa.ForeignKeyConstraint(['user_id'], ['users.id'], ondelete='CASCADE'),
        sa.ForeignKeyConstraint(['student_id'], ['students.id'], ondelete='SET NULL'),
    )
    
    op.create_index('idx_event_viewer_live_event', 'event_viewers', ['live_event_id'])
    op.create_index('idx_event_viewer_user', 'event_viewers', ['user_id'])
    op.create_index('idx_event_viewer_student', 'event_viewers', ['student_id'])
    op.create_index('idx_event_viewer_currently_watching', 'event_viewers', ['is_currently_watching'])
    op.create_index('idx_event_viewer_joined', 'event_viewers', ['joined_at'])
    
    # Create event_chat_messages table
    op.create_table(
        'event_chat_messages',
        sa.Column('id', sa.Integer(), nullable=False),
        sa.Column('live_event_id', sa.Integer(), nullable=False),
        sa.Column('user_id', sa.Integer(), nullable=False),
        
        sa.Column('message', sa.Text(), nullable=False),
        sa.Column('message_type', sa.String(length=20), nullable=False, server_default='text'),
        
        sa.Column('is_deleted', sa.Boolean(), nullable=False, server_default='false'),
        sa.Column('is_flagged', sa.Boolean(), nullable=False, server_default='false'),
        sa.Column('moderated_by', sa.Integer(), nullable=True),
        sa.Column('moderated_at', sa.DateTime(), nullable=True),
        sa.Column('moderation_reason', sa.Text(), nullable=True),
        
        sa.Column('parent_message_id', sa.Integer(), nullable=True),
        sa.Column('reactions', sa.JSON(), nullable=True),
        
        sa.Column('created_at', sa.DateTime(), nullable=False),
        sa.Column('updated_at', sa.DateTime(), nullable=False),
        
        sa.PrimaryKeyConstraint('id'),
        sa.ForeignKeyConstraint(['live_event_id'], ['live_events.id'], ondelete='CASCADE'),
        sa.ForeignKeyConstraint(['user_id'], ['users.id'], ondelete='CASCADE'),
        sa.ForeignKeyConstraint(['moderated_by'], ['users.id'], ondelete='SET NULL'),
        sa.ForeignKeyConstraint(['parent_message_id'], ['event_chat_messages.id'], ondelete='SET NULL'),
    )
    
    op.create_index('idx_event_chat_live_event', 'event_chat_messages', ['live_event_id'])
    op.create_index('idx_event_chat_user', 'event_chat_messages', ['user_id'])
    op.create_index('idx_event_chat_created', 'event_chat_messages', ['created_at'])
    op.create_index('idx_event_chat_moderated', 'event_chat_messages', ['moderated_by'])
    op.create_index('idx_event_chat_flagged', 'event_chat_messages', ['is_flagged'])
    
    # Create event_tickets table
    op.create_table(
        'event_tickets',
        sa.Column('id', sa.Integer(), nullable=False),
        sa.Column('live_event_id', sa.Integer(), nullable=False),
        sa.Column('user_id', sa.Integer(), nullable=False),
        
        sa.Column('ticket_code', sa.String(length=100), nullable=False),
        
        sa.Column('amount_paid', sa.Integer(), nullable=False),
        sa.Column('currency', sa.String(length=3), nullable=False, server_default='INR'),
        sa.Column('payment_id', sa.String(length=255), nullable=True),
        sa.Column('payment_status', sa.String(length=20), nullable=False, server_default='pending'),
        sa.Column('payment_gateway', sa.String(length=50), nullable=True),
        
        sa.Column('is_redeemed', sa.Boolean(), nullable=False, server_default='false'),
        sa.Column('redeemed_at', sa.DateTime(), nullable=True),
        sa.Column('is_refunded', sa.Boolean(), nullable=False, server_default='false'),
        sa.Column('refunded_at', sa.DateTime(), nullable=True),
        sa.Column('refund_reason', sa.Text(), nullable=True),
        
        sa.Column('created_at', sa.DateTime(), nullable=False),
        sa.Column('updated_at', sa.DateTime(), nullable=False),
        
        sa.PrimaryKeyConstraint('id'),
        sa.UniqueConstraint('ticket_code'),
        sa.ForeignKeyConstraint(['live_event_id'], ['live_events.id'], ondelete='CASCADE'),
        sa.ForeignKeyConstraint(['user_id'], ['users.id'], ondelete='CASCADE'),
    )
    
    op.create_index('idx_event_ticket_live_event', 'event_tickets', ['live_event_id'])
    op.create_index('idx_event_ticket_user', 'event_tickets', ['user_id'])
    op.create_index('idx_event_ticket_code', 'event_tickets', ['ticket_code'])
    op.create_index('idx_event_ticket_payment_id', 'event_tickets', ['payment_id'])
    op.create_index('idx_event_ticket_payment_status', 'event_tickets', ['payment_status'])
    
    # Create chat_moderation_rules table
    op.create_table(
        'chat_moderation_rules',
        sa.Column('id', sa.Integer(), nullable=False),
        sa.Column('institution_id', sa.Integer(), nullable=False),
        
        sa.Column('rule_type', sa.String(length=50), nullable=False),
        sa.Column('rule_value', sa.Text(), nullable=False),
        sa.Column('action', sa.String(length=20), nullable=False, server_default='flag'),
        sa.Column('severity', sa.String(length=20), nullable=False, server_default='medium'),
        
        sa.Column('is_active', sa.Boolean(), nullable=False, server_default='true'),
        sa.Column('created_by', sa.Integer(), nullable=True),
        
        sa.Column('created_at', sa.DateTime(), nullable=False),
        sa.Column('updated_at', sa.DateTime(), nullable=False),
        
        sa.PrimaryKeyConstraint('id'),
        sa.ForeignKeyConstraint(['institution_id'], ['institutions.id'], ondelete='CASCADE'),
        sa.ForeignKeyConstraint(['created_by'], ['users.id'], ondelete='SET NULL'),
    )
    
    op.create_index('idx_chat_moderation_institution', 'chat_moderation_rules', ['institution_id'])
    op.create_index('idx_chat_moderation_active', 'chat_moderation_rules', ['is_active'])
    
    # Create stream_analytics table
    op.create_table(
        'stream_analytics',
        sa.Column('id', sa.Integer(), nullable=False),
        sa.Column('live_event_id', sa.Integer(), nullable=False),
        
        sa.Column('timestamp', sa.DateTime(), nullable=False),
        sa.Column('viewer_count', sa.Integer(), nullable=False, server_default='0'),
        sa.Column('chat_messages_count', sa.Integer(), nullable=False, server_default='0'),
        
        sa.Column('average_bitrate', sa.Integer(), nullable=True),
        sa.Column('buffering_events', sa.Integer(), nullable=False, server_default='0'),
        
        sa.Column('created_at', sa.DateTime(), nullable=False),
        
        sa.PrimaryKeyConstraint('id'),
        sa.ForeignKeyConstraint(['live_event_id'], ['live_events.id'], ondelete='CASCADE'),
    )
    
    op.create_index('idx_stream_analytics_live_event', 'stream_analytics', ['live_event_id'])
    op.create_index('idx_stream_analytics_timestamp', 'stream_analytics', ['timestamp'])


def downgrade():
    op.drop_table('stream_analytics')
    op.drop_table('chat_moderation_rules')
    op.drop_table('event_tickets')
    op.drop_table('event_chat_messages')
    op.drop_table('event_viewers')
    op.drop_table('live_events')
