"""create carpool tables

Revision ID: 027_carpool_coordination
Revises: 026_create_fee_management_tables
Create Date: 2024-01-15 12:00:00.000000

"""
from alembic import op
import sqlalchemy as sa

# revision identifiers, used by Alembic.
revision = '027_carpool_coordination'
down_revision = '026_fee_management'
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.create_table(
        'carpool_groups',
        sa.Column('id', sa.Integer(), nullable=False),
        sa.Column('institution_id', sa.Integer(), nullable=False),
        sa.Column('organizer_parent_id', sa.Integer(), nullable=False),
        sa.Column('group_name', sa.String(length=200), nullable=False),
        sa.Column('members', sa.JSON(), nullable=False),
        sa.Column('pickup_points', sa.JSON(), nullable=False),
        sa.Column('rotation_schedule', sa.JSON(), nullable=False),
        sa.Column('active_driver_parent_id', sa.Integer(), nullable=True),
        sa.Column('current_week_start', sa.Date(), nullable=True),
        sa.Column('group_chat_id', sa.String(length=100), nullable=True),
        sa.Column('status', sa.String(length=20), nullable=False, server_default='active'),
        sa.Column('max_members', sa.Integer(), nullable=False, server_default='8'),
        sa.Column('description', sa.Text(), nullable=True),
        sa.Column('rules', sa.Text(), nullable=True),
        sa.Column('created_at', sa.DateTime(), nullable=False, server_default=sa.text('now()')),
        sa.Column('updated_at', sa.DateTime(), nullable=False, server_default=sa.text('now()')),
        sa.PrimaryKeyConstraint('id'),
        sa.ForeignKeyConstraint(['institution_id'], ['institutions.id'], ondelete='CASCADE'),
        sa.ForeignKeyConstraint(['organizer_parent_id'], ['parents.id'], ondelete='CASCADE'),
        sa.ForeignKeyConstraint(['active_driver_parent_id'], ['parents.id'], ondelete='SET NULL'),
    )
    op.create_index('idx_carpool_group_institution', 'carpool_groups', ['institution_id'])
    op.create_index('idx_carpool_group_organizer', 'carpool_groups', ['organizer_parent_id'])
    op.create_index('idx_carpool_group_active_driver', 'carpool_groups', ['active_driver_parent_id'])
    op.create_index('idx_carpool_group_status', 'carpool_groups', ['status'])
    op.create_index('idx_carpool_group_chat', 'carpool_groups', ['group_chat_id'])

    op.create_table(
        'carpool_requests',
        sa.Column('id', sa.Integer(), nullable=False),
        sa.Column('institution_id', sa.Integer(), nullable=False),
        sa.Column('parent_id', sa.Integer(), nullable=False),
        sa.Column('request_type', sa.String(length=20), nullable=False),
        sa.Column('student_ids', sa.JSON(), nullable=False),
        sa.Column('route', sa.JSON(), nullable=False),
        sa.Column('schedule_days', sa.JSON(), nullable=False),
        sa.Column('departure_time', sa.Time(), nullable=False),
        sa.Column('return_time', sa.Time(), nullable=True),
        sa.Column('available_seats', sa.Integer(), nullable=True),
        sa.Column('matching_criteria', sa.JSON(), nullable=False),
        sa.Column('status', sa.String(length=20), nullable=False, server_default='active'),
        sa.Column('matched_group_id', sa.Integer(), nullable=True),
        sa.Column('notes', sa.Text(), nullable=True),
        sa.Column('created_at', sa.DateTime(), nullable=False, server_default=sa.text('now()')),
        sa.Column('updated_at', sa.DateTime(), nullable=False, server_default=sa.text('now()')),
        sa.Column('expires_at', sa.DateTime(), nullable=True),
        sa.PrimaryKeyConstraint('id'),
        sa.ForeignKeyConstraint(['institution_id'], ['institutions.id'], ondelete='CASCADE'),
        sa.ForeignKeyConstraint(['parent_id'], ['parents.id'], ondelete='CASCADE'),
        sa.ForeignKeyConstraint(['matched_group_id'], ['carpool_groups.id'], ondelete='SET NULL'),
    )
    op.create_index('idx_carpool_request_institution', 'carpool_requests', ['institution_id'])
    op.create_index('idx_carpool_request_parent', 'carpool_requests', ['parent_id'])
    op.create_index('idx_carpool_request_type', 'carpool_requests', ['request_type'])
    op.create_index('idx_carpool_request_status', 'carpool_requests', ['status'])
    op.create_index('idx_carpool_request_matched_group', 'carpool_requests', ['matched_group_id'])
    op.create_index('idx_carpool_request_departure_time', 'carpool_requests', ['departure_time'])

    op.create_table(
        'carpool_rides',
        sa.Column('id', sa.Integer(), nullable=False),
        sa.Column('institution_id', sa.Integer(), nullable=False),
        sa.Column('group_id', sa.Integer(), nullable=False),
        sa.Column('driver_parent_id', sa.Integer(), nullable=False),
        sa.Column('ride_date', sa.Date(), nullable=False),
        sa.Column('ride_type', sa.String(length=20), nullable=False),
        sa.Column('passengers', sa.JSON(), nullable=False),
        sa.Column('pickup_sequence', sa.JSON(), nullable=False),
        sa.Column('pickup_time', sa.Time(), nullable=False),
        sa.Column('drop_time', sa.Time(), nullable=True),
        sa.Column('actual_pickup_time', sa.Time(), nullable=True),
        sa.Column('actual_drop_time', sa.Time(), nullable=True),
        sa.Column('confirmation_status', sa.String(length=20), nullable=False, server_default='scheduled'),
        sa.Column('confirmations', sa.JSON(), nullable=True),
        sa.Column('vehicle_info', sa.JSON(), nullable=True),
        sa.Column('notes', sa.Text(), nullable=True),
        sa.Column('created_at', sa.DateTime(), nullable=False, server_default=sa.text('now()')),
        sa.Column('updated_at', sa.DateTime(), nullable=False, server_default=sa.text('now()')),
        sa.PrimaryKeyConstraint('id'),
        sa.ForeignKeyConstraint(['institution_id'], ['institutions.id'], ondelete='CASCADE'),
        sa.ForeignKeyConstraint(['group_id'], ['carpool_groups.id'], ondelete='CASCADE'),
        sa.ForeignKeyConstraint(['driver_parent_id'], ['parents.id'], ondelete='CASCADE'),
    )
    op.create_index('idx_carpool_ride_institution', 'carpool_rides', ['institution_id'])
    op.create_index('idx_carpool_ride_group', 'carpool_rides', ['group_id'])
    op.create_index('idx_carpool_ride_driver', 'carpool_rides', ['driver_parent_id'])
    op.create_index('idx_carpool_ride_date', 'carpool_rides', ['ride_date'])
    op.create_index('idx_carpool_ride_status', 'carpool_rides', ['confirmation_status'])
    op.create_index('idx_carpool_ride_group_date', 'carpool_rides', ['group_id', 'ride_date'])

    op.create_table(
        'emergency_notifications',
        sa.Column('id', sa.Integer(), nullable=False),
        sa.Column('institution_id', sa.Integer(), nullable=False),
        sa.Column('ride_id', sa.Integer(), nullable=False),
        sa.Column('reporter_parent_id', sa.Integer(), nullable=False),
        sa.Column('emergency_type', sa.String(length=20), nullable=False),
        sa.Column('severity', sa.String(length=20), nullable=False),
        sa.Column('description', sa.Text(), nullable=False),
        sa.Column('location', sa.JSON(), nullable=True),
        sa.Column('estimated_delay', sa.Integer(), nullable=True),
        sa.Column('notified_parents', sa.JSON(), nullable=False),
        sa.Column('resolution', sa.Text(), nullable=True),
        sa.Column('resolved_at', sa.DateTime(), nullable=True),
        sa.Column('created_at', sa.DateTime(), nullable=False, server_default=sa.text('now()')),
        sa.Column('updated_at', sa.DateTime(), nullable=False, server_default=sa.text('now()')),
        sa.PrimaryKeyConstraint('id'),
        sa.ForeignKeyConstraint(['institution_id'], ['institutions.id'], ondelete='CASCADE'),
        sa.ForeignKeyConstraint(['ride_id'], ['carpool_rides.id'], ondelete='CASCADE'),
        sa.ForeignKeyConstraint(['reporter_parent_id'], ['parents.id'], ondelete='CASCADE'),
    )
    op.create_index('idx_emergency_notification_institution', 'emergency_notifications', ['institution_id'])
    op.create_index('idx_emergency_notification_ride', 'emergency_notifications', ['ride_id'])
    op.create_index('idx_emergency_notification_reporter', 'emergency_notifications', ['reporter_parent_id'])
    op.create_index('idx_emergency_notification_type', 'emergency_notifications', ['emergency_type'])
    op.create_index('idx_emergency_notification_created', 'emergency_notifications', ['created_at'])

    op.create_table(
        'carpool_matches',
        sa.Column('id', sa.Integer(), nullable=False),
        sa.Column('institution_id', sa.Integer(), nullable=False),
        sa.Column('request_id', sa.Integer(), nullable=False),
        sa.Column('matched_request_id', sa.Integer(), nullable=True),
        sa.Column('matched_group_id', sa.Integer(), nullable=True),
        sa.Column('compatibility_score', sa.Numeric(precision=5, scale=2), nullable=False),
        sa.Column('match_details', sa.JSON(), nullable=False),
        sa.Column('status', sa.String(length=20), nullable=False, server_default='pending'),
        sa.Column('created_at', sa.DateTime(), nullable=False, server_default=sa.text('now()')),
        sa.Column('updated_at', sa.DateTime(), nullable=False, server_default=sa.text('now()')),
        sa.PrimaryKeyConstraint('id'),
        sa.ForeignKeyConstraint(['institution_id'], ['institutions.id'], ondelete='CASCADE'),
        sa.ForeignKeyConstraint(['request_id'], ['carpool_requests.id'], ondelete='CASCADE'),
        sa.ForeignKeyConstraint(['matched_request_id'], ['carpool_requests.id'], ondelete='CASCADE'),
        sa.ForeignKeyConstraint(['matched_group_id'], ['carpool_groups.id'], ondelete='CASCADE'),
    )
    op.create_index('idx_carpool_match_institution', 'carpool_matches', ['institution_id'])
    op.create_index('idx_carpool_match_request', 'carpool_matches', ['request_id'])
    op.create_index('idx_carpool_match_matched_request', 'carpool_matches', ['matched_request_id'])
    op.create_index('idx_carpool_match_matched_group', 'carpool_matches', ['matched_group_id'])
    op.create_index('idx_carpool_match_status', 'carpool_matches', ['status'])
    op.create_index('idx_carpool_match_score', 'carpool_matches', ['compatibility_score'])


def downgrade() -> None:
    op.drop_table('carpool_matches')
    op.drop_table('emergency_notifications')
    op.drop_table('carpool_rides')
    op.drop_table('carpool_requests')
    op.drop_table('carpool_groups')
