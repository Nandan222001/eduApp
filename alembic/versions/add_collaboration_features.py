"""Add collaboration features

Revision ID: add_collaboration_features
Revises: 
Create Date: 2024-01-15 10:00:00.000000

"""
from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql

# revision identifiers, used by Alembic.
revision = 'add_collaboration_features'
down_revision = None  # Update this to point to your latest migration
branch_labels = None
depends_on = None


def upgrade():
    # Create study_buddy_profiles table
    op.create_table(
        'study_buddy_profiles',
        sa.Column('id', sa.Integer(), nullable=False),
        sa.Column('institution_id', sa.Integer(), nullable=False),
        sa.Column('student_id', sa.Integer(), nullable=False),
        sa.Column('user_id', sa.Integer(), nullable=False),
        sa.Column('subjects', postgresql.ARRAY(sa.Integer()), nullable=False),
        sa.Column('performance_level', sa.String(length=50), nullable=False),
        sa.Column('study_schedule', postgresql.JSON(), nullable=True),
        sa.Column('preferred_study_times', postgresql.ARRAY(sa.String()), nullable=True),
        sa.Column('study_goals', sa.Text(), nullable=True),
        sa.Column('learning_style', sa.String(length=50), nullable=True),
        sa.Column('availability_days', postgresql.ARRAY(sa.String()), nullable=True),
        sa.Column('preferred_group_size', sa.Integer(), nullable=False, server_default='4'),
        sa.Column('is_available', sa.Boolean(), nullable=False, server_default='true'),
        sa.Column('bio', sa.Text(), nullable=True),
        sa.Column('created_at', sa.DateTime(), nullable=False, server_default=sa.text('now()')),
        sa.Column('updated_at', sa.DateTime(), nullable=False, server_default=sa.text('now()')),
        sa.ForeignKeyConstraint(['institution_id'], ['institutions.id'], ondelete='CASCADE'),
        sa.ForeignKeyConstraint(['student_id'], ['students.id'], ondelete='CASCADE'),
        sa.ForeignKeyConstraint(['user_id'], ['users.id'], ondelete='CASCADE'),
        sa.PrimaryKeyConstraint('id'),
        sa.UniqueConstraint('student_id', name='uq_student_buddy_profile')
    )
    op.create_index('idx_buddy_profile_institution', 'study_buddy_profiles', ['institution_id'])
    op.create_index('idx_buddy_profile_student', 'study_buddy_profiles', ['student_id'])
    op.create_index('idx_buddy_profile_user', 'study_buddy_profiles', ['user_id'])
    op.create_index('idx_buddy_profile_available', 'study_buddy_profiles', ['is_available'])
    op.create_index('idx_buddy_profile_performance', 'study_buddy_profiles', ['performance_level'])

    # Create study_buddy_matches table
    op.create_table(
        'study_buddy_matches',
        sa.Column('id', sa.Integer(), nullable=False),
        sa.Column('institution_id', sa.Integer(), nullable=False),
        sa.Column('requester_id', sa.Integer(), nullable=False),
        sa.Column('matched_student_id', sa.Integer(), nullable=False),
        sa.Column('match_score', sa.Float(), nullable=False),
        sa.Column('common_subjects', postgresql.ARRAY(sa.Integer()), nullable=True),
        sa.Column('match_reason', sa.Text(), nullable=True),
        sa.Column('status', sa.String(length=20), nullable=False, server_default='pending'),
        sa.Column('created_at', sa.DateTime(), nullable=False, server_default=sa.text('now()')),
        sa.Column('responded_at', sa.DateTime(), nullable=True),
        sa.ForeignKeyConstraint(['institution_id'], ['institutions.id'], ondelete='CASCADE'),
        sa.ForeignKeyConstraint(['requester_id'], ['students.id'], ondelete='CASCADE'),
        sa.ForeignKeyConstraint(['matched_student_id'], ['students.id'], ondelete='CASCADE'),
        sa.PrimaryKeyConstraint('id')
    )
    op.create_index('idx_buddy_match_institution', 'study_buddy_matches', ['institution_id'])
    op.create_index('idx_buddy_match_requester', 'study_buddy_matches', ['requester_id'])
    op.create_index('idx_buddy_match_matched', 'study_buddy_matches', ['matched_student_id'])
    op.create_index('idx_buddy_match_status', 'study_buddy_matches', ['status'])
    op.create_index('idx_buddy_match_score', 'study_buddy_matches', ['match_score'])

    # Create study_sessions table
    op.create_table(
        'study_sessions',
        sa.Column('id', sa.Integer(), nullable=False),
        sa.Column('institution_id', sa.Integer(), nullable=False),
        sa.Column('group_id', sa.Integer(), nullable=True),
        sa.Column('created_by', sa.Integer(), nullable=False),
        sa.Column('title', sa.String(length=500), nullable=False),
        sa.Column('description', sa.Text(), nullable=True),
        sa.Column('subject_id', sa.Integer(), nullable=True),
        sa.Column('chapter_id', sa.Integer(), nullable=True),
        sa.Column('scheduled_start', sa.DateTime(), nullable=False),
        sa.Column('scheduled_end', sa.DateTime(), nullable=False),
        sa.Column('actual_start', sa.DateTime(), nullable=True),
        sa.Column('actual_end', sa.DateTime(), nullable=True),
        sa.Column('video_room_id', sa.String(length=200), nullable=True),
        sa.Column('video_platform', sa.String(length=100), nullable=True),
        sa.Column('meeting_link', sa.String(length=1000), nullable=True),
        sa.Column('recording_url', sa.String(length=1000), nullable=True),
        sa.Column('max_participants', sa.Integer(), nullable=False, server_default='10'),
        sa.Column('participant_count', sa.Integer(), nullable=False, server_default='0'),
        sa.Column('is_public', sa.Boolean(), nullable=False, server_default='true'),
        sa.Column('status', sa.String(length=20), nullable=False, server_default='scheduled'),
        sa.Column('notes', sa.Text(), nullable=True),
        sa.Column('tags', postgresql.ARRAY(sa.String()), nullable=True),
        sa.Column('created_at', sa.DateTime(), nullable=False, server_default=sa.text('now()')),
        sa.Column('updated_at', sa.DateTime(), nullable=False, server_default=sa.text('now()')),
        sa.ForeignKeyConstraint(['institution_id'], ['institutions.id'], ondelete='CASCADE'),
        sa.ForeignKeyConstraint(['group_id'], ['study_groups.id'], ondelete='CASCADE'),
        sa.ForeignKeyConstraint(['created_by'], ['users.id'], ondelete='CASCADE'),
        sa.ForeignKeyConstraint(['subject_id'], ['subjects.id'], ondelete='SET NULL'),
        sa.ForeignKeyConstraint(['chapter_id'], ['chapters.id'], ondelete='SET NULL'),
        sa.PrimaryKeyConstraint('id')
    )
    op.create_index('idx_study_session_institution', 'study_sessions', ['institution_id'])
    op.create_index('idx_study_session_group', 'study_sessions', ['group_id'])
    op.create_index('idx_study_session_creator', 'study_sessions', ['created_by'])
    op.create_index('idx_study_session_subject', 'study_sessions', ['subject_id'])
    op.create_index('idx_study_session_status', 'study_sessions', ['status'])
    op.create_index('idx_study_session_scheduled', 'study_sessions', ['scheduled_start'])
    op.create_index('idx_study_session_public', 'study_sessions', ['is_public'])

    # Create session_participants table
    op.create_table(
        'session_participants',
        sa.Column('id', sa.Integer(), nullable=False),
        sa.Column('institution_id', sa.Integer(), nullable=False),
        sa.Column('session_id', sa.Integer(), nullable=False),
        sa.Column('user_id', sa.Integer(), nullable=False),
        sa.Column('joined_at', sa.DateTime(), nullable=True),
        sa.Column('left_at', sa.DateTime(), nullable=True),
        sa.Column('duration_minutes', sa.Integer(), nullable=False, server_default='0'),
        sa.Column('is_organizer', sa.Boolean(), nullable=False, server_default='false'),
        sa.Column('created_at', sa.DateTime(), nullable=False, server_default=sa.text('now()')),
        sa.ForeignKeyConstraint(['institution_id'], ['institutions.id'], ondelete='CASCADE'),
        sa.ForeignKeyConstraint(['session_id'], ['study_sessions.id'], ondelete='CASCADE'),
        sa.ForeignKeyConstraint(['user_id'], ['users.id'], ondelete='CASCADE'),
        sa.PrimaryKeyConstraint('id'),
        sa.UniqueConstraint('session_id', 'user_id', name='uq_session_participant')
    )
    op.create_index('idx_session_participant_institution', 'session_participants', ['institution_id'])
    op.create_index('idx_session_participant_session', 'session_participants', ['session_id'])
    op.create_index('idx_session_participant_user', 'session_participants', ['user_id'])

    # Create collaborative_notes table
    op.create_table(
        'collaborative_notes',
        sa.Column('id', sa.Integer(), nullable=False),
        sa.Column('institution_id', sa.Integer(), nullable=False),
        sa.Column('group_id', sa.Integer(), nullable=True),
        sa.Column('session_id', sa.Integer(), nullable=True),
        sa.Column('created_by', sa.Integer(), nullable=False),
        sa.Column('title', sa.String(length=500), nullable=False),
        sa.Column('content', sa.Text(), nullable=False),
        sa.Column('subject_id', sa.Integer(), nullable=True),
        sa.Column('chapter_id', sa.Integer(), nullable=True),
        sa.Column('is_public', sa.Boolean(), nullable=False, server_default='false'),
        sa.Column('version', sa.Integer(), nullable=False, server_default='1'),
        sa.Column('last_edited_by', sa.Integer(), nullable=True),
        sa.Column('view_count', sa.Integer(), nullable=False, server_default='0'),
        sa.Column('edit_count', sa.Integer(), nullable=False, server_default='0'),
        sa.Column('tags', postgresql.ARRAY(sa.String()), nullable=True),
        sa.Column('created_at', sa.DateTime(), nullable=False, server_default=sa.text('now()')),
        sa.Column('updated_at', sa.DateTime(), nullable=False, server_default=sa.text('now()')),
        sa.ForeignKeyConstraint(['institution_id'], ['institutions.id'], ondelete='CASCADE'),
        sa.ForeignKeyConstraint(['group_id'], ['study_groups.id'], ondelete='CASCADE'),
        sa.ForeignKeyConstraint(['session_id'], ['study_sessions.id'], ondelete='SET NULL'),
        sa.ForeignKeyConstraint(['created_by'], ['users.id'], ondelete='CASCADE'),
        sa.ForeignKeyConstraint(['last_edited_by'], ['users.id'], ondelete='SET NULL'),
        sa.ForeignKeyConstraint(['subject_id'], ['subjects.id'], ondelete='SET NULL'),
        sa.ForeignKeyConstraint(['chapter_id'], ['chapters.id'], ondelete='SET NULL'),
        sa.PrimaryKeyConstraint('id')
    )
    op.create_index('idx_collab_note_institution', 'collaborative_notes', ['institution_id'])
    op.create_index('idx_collab_note_group', 'collaborative_notes', ['group_id'])
    op.create_index('idx_collab_note_session', 'collaborative_notes', ['session_id'])
    op.create_index('idx_collab_note_creator', 'collaborative_notes', ['created_by'])
    op.create_index('idx_collab_note_subject', 'collaborative_notes', ['subject_id'])
    op.create_index('idx_collab_note_public', 'collaborative_notes', ['is_public'])
    op.create_index('idx_collab_note_created', 'collaborative_notes', ['created_at'])

    # Create note_editors table
    op.create_table(
        'note_editors',
        sa.Column('id', sa.Integer(), nullable=False),
        sa.Column('note_id', sa.Integer(), nullable=False),
        sa.Column('user_id', sa.Integer(), nullable=False),
        sa.Column('can_edit', sa.Boolean(), nullable=False, server_default='true'),
        sa.Column('added_at', sa.DateTime(), nullable=False, server_default=sa.text('now()')),
        sa.Column('last_edit_at', sa.DateTime(), nullable=True),
        sa.ForeignKeyConstraint(['note_id'], ['collaborative_notes.id'], ondelete='CASCADE'),
        sa.ForeignKeyConstraint(['user_id'], ['users.id'], ondelete='CASCADE'),
        sa.PrimaryKeyConstraint('id'),
        sa.UniqueConstraint('note_id', 'user_id', name='uq_note_editor')
    )
    op.create_index('idx_note_editor_note', 'note_editors', ['note_id'])
    op.create_index('idx_note_editor_user', 'note_editors', ['user_id'])

    # Create note_revisions table
    op.create_table(
        'note_revisions',
        sa.Column('id', sa.Integer(), nullable=False),
        sa.Column('note_id', sa.Integer(), nullable=False),
        sa.Column('user_id', sa.Integer(), nullable=False),
        sa.Column('content', sa.Text(), nullable=False),
        sa.Column('version', sa.Integer(), nullable=False),
        sa.Column('change_description', sa.String(length=500), nullable=True),
        sa.Column('created_at', sa.DateTime(), nullable=False, server_default=sa.text('now()')),
        sa.ForeignKeyConstraint(['note_id'], ['collaborative_notes.id'], ondelete='CASCADE'),
        sa.ForeignKeyConstraint(['user_id'], ['users.id'], ondelete='CASCADE'),
        sa.PrimaryKeyConstraint('id')
    )
    op.create_index('idx_note_revision_note', 'note_revisions', ['note_id'])
    op.create_index('idx_note_revision_user', 'note_revisions', ['user_id'])
    op.create_index('idx_note_revision_version', 'note_revisions', ['version'])
    op.create_index('idx_note_revision_created', 'note_revisions', ['created_at'])

    # Create peer_tutor_profiles table
    op.create_table(
        'peer_tutor_profiles',
        sa.Column('id', sa.Integer(), nullable=False),
        sa.Column('institution_id', sa.Integer(), nullable=False),
        sa.Column('student_id', sa.Integer(), nullable=False),
        sa.Column('user_id', sa.Integer(), nullable=False),
        sa.Column('expertise_subjects', postgresql.ARRAY(sa.Integer()), nullable=False),
        sa.Column('hourly_rate', sa.Float(), nullable=True),
        sa.Column('availability_schedule', postgresql.JSON(), nullable=True),
        sa.Column('bio', sa.Text(), nullable=True),
        sa.Column('qualifications', sa.Text(), nullable=True),
        sa.Column('total_sessions', sa.Integer(), nullable=False, server_default='0'),
        sa.Column('average_rating', sa.Float(), nullable=False, server_default='0.0'),
        sa.Column('total_earnings', sa.Float(), nullable=False, server_default='0.0'),
        sa.Column('is_active', sa.Boolean(), nullable=False, server_default='true'),
        sa.Column('is_verified', sa.Boolean(), nullable=False, server_default='false'),
        sa.Column('created_at', sa.DateTime(), nullable=False, server_default=sa.text('now()')),
        sa.Column('updated_at', sa.DateTime(), nullable=False, server_default=sa.text('now()')),
        sa.ForeignKeyConstraint(['institution_id'], ['institutions.id'], ondelete='CASCADE'),
        sa.ForeignKeyConstraint(['student_id'], ['students.id'], ondelete='CASCADE'),
        sa.ForeignKeyConstraint(['user_id'], ['users.id'], ondelete='CASCADE'),
        sa.PrimaryKeyConstraint('id'),
        sa.UniqueConstraint('student_id', name='uq_student_tutor_profile')
    )
    op.create_index('idx_tutor_profile_institution', 'peer_tutor_profiles', ['institution_id'])
    op.create_index('idx_tutor_profile_student', 'peer_tutor_profiles', ['student_id'])
    op.create_index('idx_tutor_profile_user', 'peer_tutor_profiles', ['user_id'])
    op.create_index('idx_tutor_profile_active', 'peer_tutor_profiles', ['is_active'])
    op.create_index('idx_tutor_profile_verified', 'peer_tutor_profiles', ['is_verified'])
    op.create_index('idx_tutor_profile_rating', 'peer_tutor_profiles', ['average_rating'])

    # Create tutoring_requests table
    op.create_table(
        'tutoring_requests',
        sa.Column('id', sa.Integer(), nullable=False),
        sa.Column('institution_id', sa.Integer(), nullable=False),
        sa.Column('student_id', sa.Integer(), nullable=False),
        sa.Column('tutor_id', sa.Integer(), nullable=True),
        sa.Column('subject_id', sa.Integer(), nullable=True),
        sa.Column('chapter_id', sa.Integer(), nullable=True),
        sa.Column('topic', sa.String(length=500), nullable=False),
        sa.Column('description', sa.Text(), nullable=False),
        sa.Column('preferred_time', sa.DateTime(), nullable=True),
        sa.Column('duration_minutes', sa.Integer(), nullable=False, server_default='60'),
        sa.Column('offered_rate', sa.Float(), nullable=True),
        sa.Column('status', sa.String(length=20), nullable=False, server_default='open'),
        sa.Column('created_at', sa.DateTime(), nullable=False, server_default=sa.text('now()')),
        sa.Column('matched_at', sa.DateTime(), nullable=True),
        sa.Column('completed_at', sa.DateTime(), nullable=True),
        sa.ForeignKeyConstraint(['institution_id'], ['institutions.id'], ondelete='CASCADE'),
        sa.ForeignKeyConstraint(['student_id'], ['students.id'], ondelete='CASCADE'),
        sa.ForeignKeyConstraint(['tutor_id'], ['peer_tutor_profiles.id'], ondelete='SET NULL'),
        sa.ForeignKeyConstraint(['subject_id'], ['subjects.id'], ondelete='SET NULL'),
        sa.ForeignKeyConstraint(['chapter_id'], ['chapters.id'], ondelete='SET NULL'),
        sa.PrimaryKeyConstraint('id')
    )
    op.create_index('idx_tutoring_request_institution', 'tutoring_requests', ['institution_id'])
    op.create_index('idx_tutoring_request_student', 'tutoring_requests', ['student_id'])
    op.create_index('idx_tutoring_request_tutor', 'tutoring_requests', ['tutor_id'])
    op.create_index('idx_tutoring_request_subject', 'tutoring_requests', ['subject_id'])
    op.create_index('idx_tutoring_request_status', 'tutoring_requests', ['status'])
    op.create_index('idx_tutoring_request_created', 'tutoring_requests', ['created_at'])

    # Create tutoring_sessions table
    op.create_table(
        'tutoring_sessions',
        sa.Column('id', sa.Integer(), nullable=False),
        sa.Column('institution_id', sa.Integer(), nullable=False),
        sa.Column('request_id', sa.Integer(), nullable=False),
        sa.Column('tutor_id', sa.Integer(), nullable=False),
        sa.Column('student_id', sa.Integer(), nullable=False),
        sa.Column('scheduled_start', sa.DateTime(), nullable=False),
        sa.Column('scheduled_end', sa.DateTime(), nullable=False),
        sa.Column('actual_start', sa.DateTime(), nullable=True),
        sa.Column('actual_end', sa.DateTime(), nullable=True),
        sa.Column('meeting_link', sa.String(length=1000), nullable=True),
        sa.Column('session_notes', sa.Text(), nullable=True),
        sa.Column('payment_amount', sa.Float(), nullable=True),
        sa.Column('payment_status', sa.String(length=50), nullable=False, server_default='pending'),
        sa.Column('student_rating', sa.Integer(), nullable=True),
        sa.Column('student_feedback', sa.Text(), nullable=True),
        sa.Column('tutor_notes', sa.Text(), nullable=True),
        sa.Column('status', sa.String(length=20), nullable=False, server_default='scheduled'),
        sa.Column('created_at', sa.DateTime(), nullable=False, server_default=sa.text('now()')),
        sa.Column('updated_at', sa.DateTime(), nullable=False, server_default=sa.text('now()')),
        sa.ForeignKeyConstraint(['institution_id'], ['institutions.id'], ondelete='CASCADE'),
        sa.ForeignKeyConstraint(['request_id'], ['tutoring_requests.id'], ondelete='CASCADE'),
        sa.ForeignKeyConstraint(['tutor_id'], ['peer_tutor_profiles.id'], ondelete='CASCADE'),
        sa.ForeignKeyConstraint(['student_id'], ['students.id'], ondelete='CASCADE'),
        sa.PrimaryKeyConstraint('id')
    )
    op.create_index('idx_tutoring_session_institution', 'tutoring_sessions', ['institution_id'])
    op.create_index('idx_tutoring_session_request', 'tutoring_sessions', ['request_id'])
    op.create_index('idx_tutoring_session_tutor', 'tutoring_sessions', ['tutor_id'])
    op.create_index('idx_tutoring_session_student', 'tutoring_sessions', ['student_id'])
    op.create_index('idx_tutoring_session_status', 'tutoring_sessions', ['status'])
    op.create_index('idx_tutoring_session_scheduled', 'tutoring_sessions', ['scheduled_start'])

    # Create group_performance_analytics table
    op.create_table(
        'group_performance_analytics',
        sa.Column('id', sa.Integer(), nullable=False),
        sa.Column('institution_id', sa.Integer(), nullable=False),
        sa.Column('group_id', sa.Integer(), nullable=False),
        sa.Column('period_start', sa.DateTime(), nullable=False),
        sa.Column('period_end', sa.DateTime(), nullable=False),
        sa.Column('total_study_hours', sa.Float(), nullable=False, server_default='0.0'),
        sa.Column('total_sessions', sa.Integer(), nullable=False, server_default='0'),
        sa.Column('average_attendance', sa.Float(), nullable=False, server_default='0.0'),
        sa.Column('member_performance', postgresql.JSON(), nullable=True),
        sa.Column('subject_distribution', postgresql.JSON(), nullable=True),
        sa.Column('activity_metrics', postgresql.JSON(), nullable=True),
        sa.Column('engagement_score', sa.Float(), nullable=False, server_default='0.0'),
        sa.Column('collaboration_score', sa.Float(), nullable=False, server_default='0.0'),
        sa.Column('overall_performance', sa.Float(), nullable=False, server_default='0.0'),
        sa.Column('created_at', sa.DateTime(), nullable=False, server_default=sa.text('now()')),
        sa.Column('updated_at', sa.DateTime(), nullable=False, server_default=sa.text('now()')),
        sa.ForeignKeyConstraint(['institution_id'], ['institutions.id'], ondelete='CASCADE'),
        sa.ForeignKeyConstraint(['group_id'], ['study_groups.id'], ondelete='CASCADE'),
        sa.PrimaryKeyConstraint('id')
    )
    op.create_index('idx_group_analytics_institution', 'group_performance_analytics', ['institution_id'])
    op.create_index('idx_group_analytics_group', 'group_performance_analytics', ['group_id'])
    op.create_index('idx_group_analytics_period', 'group_performance_analytics', ['period_start', 'period_end'])
    op.create_index('idx_group_analytics_created', 'group_performance_analytics', ['created_at'])


def downgrade():
    op.drop_table('group_performance_analytics')
    op.drop_table('tutoring_sessions')
    op.drop_table('tutoring_requests')
    op.drop_table('peer_tutor_profiles')
    op.drop_table('note_revisions')
    op.drop_table('note_editors')
    op.drop_table('collaborative_notes')
    op.drop_table('session_participants')
    op.drop_table('study_sessions')
    op.drop_table('study_buddy_matches')
    op.drop_table('study_buddy_profiles')
