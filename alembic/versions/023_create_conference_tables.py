"""create conference tables

Revision ID: 023_create_conference
Revises: 022_create_onboarding
Create Date: 2024-01-17 10:00:00.000000

"""
from typing import Sequence, Union
from alembic import op
import sqlalchemy as sa

# revision identifiers, used by Alembic.
revision: str = '023_create_conference'
down_revision: Union[str, None] = '022_create_onboarding'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    # Create conference_slots table
    op.create_table(
        'conference_slots',
        sa.Column('id', sa.Integer(), nullable=False),
        sa.Column('institution_id', sa.Integer(), nullable=False),
        sa.Column('teacher_id', sa.Integer(), nullable=False),
        sa.Column('date', sa.Date(), nullable=False),
        sa.Column('time_slot', sa.Time(), nullable=False),
        sa.Column('duration_minutes', sa.Integer(), nullable=False),
        sa.Column('location', sa.String(length=20), nullable=False),
        sa.Column('physical_location', sa.String(length=255), nullable=True),
        sa.Column('max_bookings', sa.Integer(), nullable=False),
        sa.Column('current_bookings', sa.Integer(), nullable=False),
        sa.Column('availability_status', sa.String(length=20), nullable=False),
        sa.Column('notes', sa.Text(), nullable=True),
        sa.Column('is_active', sa.Boolean(), nullable=False),
        sa.Column('created_at', sa.DateTime(), nullable=False),
        sa.Column('updated_at', sa.DateTime(), nullable=False),
        sa.ForeignKeyConstraint(['institution_id'], ['institutions.id'], ondelete='CASCADE'),
        sa.ForeignKeyConstraint(['teacher_id'], ['teachers.id'], ondelete='CASCADE'),
        sa.PrimaryKeyConstraint('id')
    )
    op.create_index('idx_conference_slot_teacher_date', 'conference_slots', ['teacher_id', 'date'])
    op.create_index('idx_conference_slot_institution_date', 'conference_slots', ['institution_id', 'date'])
    op.create_index('idx_conference_slot_status', 'conference_slots', ['availability_status'])
    op.create_index(op.f('ix_conference_slots_id'), 'conference_slots', ['id'])
    op.create_index(op.f('ix_conference_slots_institution_id'), 'conference_slots', ['institution_id'])
    op.create_index(op.f('ix_conference_slots_teacher_id'), 'conference_slots', ['teacher_id'])
    op.create_index(op.f('ix_conference_slots_date'), 'conference_slots', ['date'])

    # Create conference_bookings table
    op.create_table(
        'conference_bookings',
        sa.Column('id', sa.Integer(), nullable=False),
        sa.Column('institution_id', sa.Integer(), nullable=False),
        sa.Column('slot_id', sa.Integer(), nullable=False),
        sa.Column('parent_id', sa.Integer(), nullable=False),
        sa.Column('student_id', sa.Integer(), nullable=False),
        sa.Column('conference_type', sa.String(length=50), nullable=False),
        sa.Column('parent_topics', sa.JSON(), nullable=True),
        sa.Column('teacher_notes', sa.Text(), nullable=True),
        sa.Column('parent_notes', sa.Text(), nullable=True),
        sa.Column('video_meeting_link', sa.String(length=500), nullable=True),
        sa.Column('video_meeting_id', sa.String(length=255), nullable=True),
        sa.Column('video_meeting_password', sa.String(length=100), nullable=True),
        sa.Column('recording_url', sa.String(length=500), nullable=True),
        sa.Column('recording_s3_key', sa.String(length=500), nullable=True),
        sa.Column('follow_up_required', sa.Boolean(), nullable=False),
        sa.Column('follow_up_notes', sa.Text(), nullable=True),
        sa.Column('booking_status', sa.String(length=20), nullable=False),
        sa.Column('checked_in_at', sa.DateTime(), nullable=True),
        sa.Column('completed_at', sa.DateTime(), nullable=True),
        sa.Column('cancelled_at', sa.DateTime(), nullable=True),
        sa.Column('cancellation_reason', sa.Text(), nullable=True),
        sa.Column('reminder_24h_sent', sa.Boolean(), nullable=False),
        sa.Column('reminder_1h_sent', sa.Boolean(), nullable=False),
        sa.Column('created_at', sa.DateTime(), nullable=False),
        sa.Column('updated_at', sa.DateTime(), nullable=False),
        sa.ForeignKeyConstraint(['institution_id'], ['institutions.id'], ondelete='CASCADE'),
        sa.ForeignKeyConstraint(['slot_id'], ['conference_slots.id'], ondelete='CASCADE'),
        sa.ForeignKeyConstraint(['parent_id'], ['parents.id'], ondelete='CASCADE'),
        sa.ForeignKeyConstraint(['student_id'], ['students.id'], ondelete='CASCADE'),
        sa.PrimaryKeyConstraint('id')
    )
    op.create_index('idx_conference_booking_slot', 'conference_bookings', ['slot_id'])
    op.create_index('idx_conference_booking_parent', 'conference_bookings', ['parent_id'])
    op.create_index('idx_conference_booking_student', 'conference_bookings', ['student_id'])
    op.create_index('idx_conference_booking_status', 'conference_bookings', ['booking_status'])
    op.create_index('idx_conference_booking_institution', 'conference_bookings', ['institution_id'])
    op.create_index(op.f('ix_conference_bookings_id'), 'conference_bookings', ['id'])
    op.create_index(op.f('ix_conference_bookings_institution_id'), 'conference_bookings', ['institution_id'])
    op.create_index(op.f('ix_conference_bookings_slot_id'), 'conference_bookings', ['slot_id'])
    op.create_index(op.f('ix_conference_bookings_parent_id'), 'conference_bookings', ['parent_id'])
    op.create_index(op.f('ix_conference_bookings_student_id'), 'conference_bookings', ['student_id'])

    # Create conference_surveys table
    op.create_table(
        'conference_surveys',
        sa.Column('id', sa.Integer(), nullable=False),
        sa.Column('booking_id', sa.Integer(), nullable=False),
        sa.Column('respondent_type', sa.String(length=20), nullable=False),
        sa.Column('rating', sa.Integer(), nullable=True),
        sa.Column('feedback', sa.Text(), nullable=True),
        sa.Column('communication_rating', sa.Integer(), nullable=True),
        sa.Column('helpfulness_rating', sa.Integer(), nullable=True),
        sa.Column('would_recommend', sa.Boolean(), nullable=True),
        sa.Column('suggestions', sa.Text(), nullable=True),
        sa.Column('submitted_at', sa.DateTime(), nullable=True),
        sa.Column('created_at', sa.DateTime(), nullable=False),
        sa.Column('updated_at', sa.DateTime(), nullable=False),
        sa.ForeignKeyConstraint(['booking_id'], ['conference_bookings.id'], ondelete='CASCADE'),
        sa.PrimaryKeyConstraint('id'),
        sa.UniqueConstraint('booking_id', name='uq_survey_booking')
    )
    op.create_index('idx_conference_survey_booking', 'conference_surveys', ['booking_id'])
    op.create_index(op.f('ix_conference_surveys_id'), 'conference_surveys', ['id'])
    op.create_index(op.f('ix_conference_surveys_booking_id'), 'conference_surveys', ['booking_id'])

    # Create conference_reminders table
    op.create_table(
        'conference_reminders',
        sa.Column('id', sa.Integer(), nullable=False),
        sa.Column('booking_id', sa.Integer(), nullable=False),
        sa.Column('reminder_type', sa.String(length=20), nullable=False),
        sa.Column('scheduled_for', sa.DateTime(), nullable=False),
        sa.Column('sent_at', sa.DateTime(), nullable=True),
        sa.Column('status', sa.String(length=20), nullable=False),
        sa.Column('error_message', sa.Text(), nullable=True),
        sa.Column('created_at', sa.DateTime(), nullable=False),
        sa.ForeignKeyConstraint(['booking_id'], ['conference_bookings.id'], ondelete='CASCADE'),
        sa.PrimaryKeyConstraint('id')
    )
    op.create_index('idx_conference_reminder_booking', 'conference_reminders', ['booking_id'])
    op.create_index('idx_conference_reminder_scheduled', 'conference_reminders', ['scheduled_for'])
    op.create_index('idx_conference_reminder_status', 'conference_reminders', ['status'])
    op.create_index(op.f('ix_conference_reminders_id'), 'conference_reminders', ['id'])
    op.create_index(op.f('ix_conference_reminders_booking_id'), 'conference_reminders', ['booking_id'])


def downgrade() -> None:
    # Drop conference_reminders table
    op.drop_index(op.f('ix_conference_reminders_booking_id'), table_name='conference_reminders')
    op.drop_index(op.f('ix_conference_reminders_id'), table_name='conference_reminders')
    op.drop_index('idx_conference_reminder_status', table_name='conference_reminders')
    op.drop_index('idx_conference_reminder_scheduled', table_name='conference_reminders')
    op.drop_index('idx_conference_reminder_booking', table_name='conference_reminders')
    op.drop_table('conference_reminders')

    # Drop conference_surveys table
    op.drop_index(op.f('ix_conference_surveys_booking_id'), table_name='conference_surveys')
    op.drop_index(op.f('ix_conference_surveys_id'), table_name='conference_surveys')
    op.drop_index('idx_conference_survey_booking', table_name='conference_surveys')
    op.drop_table('conference_surveys')

    # Drop conference_bookings table
    op.drop_index(op.f('ix_conference_bookings_student_id'), table_name='conference_bookings')
    op.drop_index(op.f('ix_conference_bookings_parent_id'), table_name='conference_bookings')
    op.drop_index(op.f('ix_conference_bookings_slot_id'), table_name='conference_bookings')
    op.drop_index(op.f('ix_conference_bookings_institution_id'), table_name='conference_bookings')
    op.drop_index(op.f('ix_conference_bookings_id'), table_name='conference_bookings')
    op.drop_index('idx_conference_booking_institution', table_name='conference_bookings')
    op.drop_index('idx_conference_booking_status', table_name='conference_bookings')
    op.drop_index('idx_conference_booking_student', table_name='conference_bookings')
    op.drop_index('idx_conference_booking_parent', table_name='conference_bookings')
    op.drop_index('idx_conference_booking_slot', table_name='conference_bookings')
    op.drop_table('conference_bookings')

    # Drop conference_slots table
    op.drop_index(op.f('ix_conference_slots_date'), table_name='conference_slots')
    op.drop_index(op.f('ix_conference_slots_teacher_id'), table_name='conference_slots')
    op.drop_index(op.f('ix_conference_slots_institution_id'), table_name='conference_slots')
    op.drop_index(op.f('ix_conference_slots_id'), table_name='conference_slots')
    op.drop_index('idx_conference_slot_status', table_name='conference_slots')
    op.drop_index('idx_conference_slot_institution_date', table_name='conference_slots')
    op.drop_index('idx_conference_slot_teacher_date', table_name='conference_slots')
    op.drop_table('conference_slots')
