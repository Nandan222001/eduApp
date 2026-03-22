"""add virtual classrooms

Revision ID: add_virtual_classrooms
Revises: 
Create Date: 2024-01-15 10:00:00.000000

"""
from alembic import op
import sqlalchemy as sa

# revision identifiers, used by Alembic.
revision = 'add_virtual_classrooms'
down_revision = '005'
branch_labels = None
depends_on = None


def upgrade():
    # Create enum types
    op.execute("CREATE TYPE classroomstatus AS ENUM ('scheduled', 'live', 'ended', 'cancelled')")
    op.execute("CREATE TYPE recordingstatus AS ENUM ('idle', 'recording', 'processing', 'completed', 'failed')")
    op.execute("CREATE TYPE participantrole AS ENUM ('host', 'moderator', 'participant', 'observer')")
    op.execute("CREATE TYPE breakoutroomstatus AS ENUM ('active', 'closed')")
    op.execute("CREATE TYPE pollstatus AS ENUM ('draft', 'active', 'ended')")
    op.execute("CREATE TYPE quizstatus AS ENUM ('draft', 'active', 'ended')")
    
    # Create virtual_classrooms table
    op.create_table(
        'virtual_classrooms',
        sa.Column('id', sa.Integer(), nullable=False),
        sa.Column('institution_id', sa.Integer(), nullable=False),
        sa.Column('subject_id', sa.Integer(), nullable=True),
        sa.Column('section_id', sa.Integer(), nullable=True),
        sa.Column('teacher_id', sa.Integer(), nullable=False),
        sa.Column('title', sa.String(length=255), nullable=False),
        sa.Column('description', sa.Text(), nullable=True),
        sa.Column('channel_name', sa.String(length=255), nullable=False),
        sa.Column('scheduled_start_time', sa.DateTime(), nullable=False),
        sa.Column('scheduled_end_time', sa.DateTime(), nullable=False),
        sa.Column('actual_start_time', sa.DateTime(), nullable=True),
        sa.Column('actual_end_time', sa.DateTime(), nullable=True),
        sa.Column('status', sa.Enum('scheduled', 'live', 'ended', 'cancelled', name='classroomstatus'), nullable=False),
        sa.Column('max_participants', sa.Integer(), nullable=False),
        sa.Column('is_recording_enabled', sa.Boolean(), nullable=False),
        sa.Column('is_screen_sharing_enabled', sa.Boolean(), nullable=False),
        sa.Column('is_whiteboard_enabled', sa.Boolean(), nullable=False),
        sa.Column('is_chat_enabled', sa.Boolean(), nullable=False),
        sa.Column('is_breakout_rooms_enabled', sa.Boolean(), nullable=False),
        sa.Column('whiteboard_data', sa.JSON(), nullable=True),
        sa.Column('settings', sa.JSON(), nullable=True),
        sa.Column('created_at', sa.DateTime(), nullable=False),
        sa.Column('updated_at', sa.DateTime(), nullable=False),
        sa.ForeignKeyConstraint(['institution_id'], ['institutions.id'], ondelete='CASCADE'),
        sa.ForeignKeyConstraint(['subject_id'], ['subjects.id'], ondelete='SET NULL'),
        sa.ForeignKeyConstraint(['section_id'], ['sections.id'], ondelete='SET NULL'),
        sa.ForeignKeyConstraint(['teacher_id'], ['teachers.id'], ondelete='CASCADE'),
        sa.PrimaryKeyConstraint('id')
    )
    op.create_index('idx_classroom_institution', 'virtual_classrooms', ['institution_id'])
    op.create_index('idx_classroom_teacher', 'virtual_classrooms', ['teacher_id'])
    op.create_index('idx_classroom_status', 'virtual_classrooms', ['status'])
    op.create_index('idx_classroom_scheduled_time', 'virtual_classrooms', ['scheduled_start_time'])
    op.create_index(op.f('ix_virtual_classrooms_channel_name'), 'virtual_classrooms', ['channel_name'], unique=True)
    
    # Create classroom_participants table
    op.create_table(
        'classroom_participants',
        sa.Column('id', sa.Integer(), nullable=False),
        sa.Column('classroom_id', sa.Integer(), nullable=False),
        sa.Column('user_id', sa.Integer(), nullable=False),
        sa.Column('role', sa.Enum('host', 'moderator', 'participant', 'observer', name='participantrole'), nullable=False),
        sa.Column('joined_at', sa.DateTime(), nullable=True),
        sa.Column('left_at', sa.DateTime(), nullable=True),
        sa.Column('duration_seconds', sa.Integer(), nullable=False),
        sa.Column('is_video_enabled', sa.Boolean(), nullable=False),
        sa.Column('is_audio_enabled', sa.Boolean(), nullable=False),
        sa.Column('is_screen_sharing', sa.Boolean(), nullable=False),
        sa.Column('agora_uid', sa.Integer(), nullable=True),
        sa.Column('token', sa.Text(), nullable=True),
        sa.Column('token_expires_at', sa.DateTime(), nullable=True),
        sa.Column('created_at', sa.DateTime(), nullable=False),
        sa.Column('updated_at', sa.DateTime(), nullable=False),
        sa.ForeignKeyConstraint(['classroom_id'], ['virtual_classrooms.id'], ondelete='CASCADE'),
        sa.ForeignKeyConstraint(['user_id'], ['users.id'], ondelete='CASCADE'),
        sa.PrimaryKeyConstraint('id')
    )
    op.create_index('idx_participant_classroom', 'classroom_participants', ['classroom_id'])
    op.create_index('idx_participant_user', 'classroom_participants', ['user_id'])
    op.create_index('idx_participant_classroom_user', 'classroom_participants', ['classroom_id', 'user_id'], unique=True)
    
    # Create classroom_recordings table
    op.create_table(
        'classroom_recordings',
        sa.Column('id', sa.Integer(), nullable=False),
        sa.Column('classroom_id', sa.Integer(), nullable=False),
        sa.Column('recording_id', sa.String(length=255), nullable=False),
        sa.Column('resource_id', sa.String(length=255), nullable=True),
        sa.Column('sid', sa.String(length=255), nullable=True),
        sa.Column('file_url', sa.Text(), nullable=True),
        sa.Column('s3_key', sa.String(length=500), nullable=True),
        sa.Column('file_size', sa.Integer(), nullable=True),
        sa.Column('duration_seconds', sa.Integer(), nullable=True),
        sa.Column('status', sa.Enum('idle', 'recording', 'processing', 'completed', 'failed', name='recordingstatus'), nullable=False),
        sa.Column('started_at', sa.DateTime(), nullable=True),
        sa.Column('stopped_at', sa.DateTime(), nullable=True),
        sa.Column('metadata', sa.JSON(), nullable=True),
        sa.Column('error_message', sa.Text(), nullable=True),
        sa.Column('created_at', sa.DateTime(), nullable=False),
        sa.Column('updated_at', sa.DateTime(), nullable=False),
        sa.ForeignKeyConstraint(['classroom_id'], ['virtual_classrooms.id'], ondelete='CASCADE'),
        sa.PrimaryKeyConstraint('id')
    )
    op.create_index('idx_recording_classroom', 'classroom_recordings', ['classroom_id'])
    op.create_index('idx_recording_status', 'classroom_recordings', ['status'])
    op.create_index(op.f('ix_classroom_recordings_recording_id'), 'classroom_recordings', ['recording_id'], unique=True)
    
    # Create recording_views table
    op.create_table(
        'recording_views',
        sa.Column('id', sa.Integer(), nullable=False),
        sa.Column('recording_id', sa.Integer(), nullable=False),
        sa.Column('user_id', sa.Integer(), nullable=False),
        sa.Column('started_at', sa.DateTime(), nullable=False),
        sa.Column('last_position_seconds', sa.Integer(), nullable=False),
        sa.Column('completed', sa.Boolean(), nullable=False),
        sa.Column('watch_duration_seconds', sa.Integer(), nullable=False),
        sa.Column('created_at', sa.DateTime(), nullable=False),
        sa.Column('updated_at', sa.DateTime(), nullable=False),
        sa.ForeignKeyConstraint(['recording_id'], ['classroom_recordings.id'], ondelete='CASCADE'),
        sa.ForeignKeyConstraint(['user_id'], ['users.id'], ondelete='CASCADE'),
        sa.PrimaryKeyConstraint('id')
    )
    op.create_index('idx_view_recording', 'recording_views', ['recording_id'])
    op.create_index('idx_view_user', 'recording_views', ['user_id'])
    
    # Create breakout_rooms table
    op.create_table(
        'breakout_rooms',
        sa.Column('id', sa.Integer(), nullable=False),
        sa.Column('classroom_id', sa.Integer(), nullable=False),
        sa.Column('name', sa.String(length=255), nullable=False),
        sa.Column('channel_name', sa.String(length=255), nullable=False),
        sa.Column('max_participants', sa.Integer(), nullable=False),
        sa.Column('duration_minutes', sa.Integer(), nullable=False),
        sa.Column('status', sa.Enum('active', 'closed', name='breakoutroomstatus'), nullable=False),
        sa.Column('created_at', sa.DateTime(), nullable=False),
        sa.Column('closed_at', sa.DateTime(), nullable=True),
        sa.ForeignKeyConstraint(['classroom_id'], ['virtual_classrooms.id'], ondelete='CASCADE'),
        sa.PrimaryKeyConstraint('id')
    )
    op.create_index('idx_breakout_classroom', 'breakout_rooms', ['classroom_id'])
    op.create_index('idx_breakout_status', 'breakout_rooms', ['status'])
    op.create_index(op.f('ix_breakout_rooms_channel_name'), 'breakout_rooms', ['channel_name'], unique=True)
    
    # Create breakout_room_participants table
    op.create_table(
        'breakout_room_participants',
        sa.Column('id', sa.Integer(), nullable=False),
        sa.Column('breakout_room_id', sa.Integer(), nullable=False),
        sa.Column('user_id', sa.Integer(), nullable=False),
        sa.Column('joined_at', sa.DateTime(), nullable=True),
        sa.Column('left_at', sa.DateTime(), nullable=True),
        sa.Column('agora_uid', sa.Integer(), nullable=True),
        sa.Column('token', sa.Text(), nullable=True),
        sa.Column('token_expires_at', sa.DateTime(), nullable=True),
        sa.Column('created_at', sa.DateTime(), nullable=False),
        sa.ForeignKeyConstraint(['breakout_room_id'], ['breakout_rooms.id'], ondelete='CASCADE'),
        sa.ForeignKeyConstraint(['user_id'], ['users.id'], ondelete='CASCADE'),
        sa.PrimaryKeyConstraint('id')
    )
    op.create_index('idx_breakout_participant_room_user', 'breakout_room_participants', ['breakout_room_id', 'user_id'], unique=True)
    
    # Create classroom_attendance table
    op.create_table(
        'classroom_attendance',
        sa.Column('id', sa.Integer(), nullable=False),
        sa.Column('classroom_id', sa.Integer(), nullable=False),
        sa.Column('user_id', sa.Integer(), nullable=False),
        sa.Column('student_id', sa.Integer(), nullable=True),
        sa.Column('joined_at', sa.DateTime(), nullable=False),
        sa.Column('left_at', sa.DateTime(), nullable=True),
        sa.Column('total_duration_seconds', sa.Integer(), nullable=False),
        sa.Column('is_present', sa.Boolean(), nullable=False),
        sa.Column('attendance_percentage', sa.Float(), nullable=False),
        sa.Column('notes', sa.Text(), nullable=True),
        sa.Column('created_at', sa.DateTime(), nullable=False),
        sa.Column('updated_at', sa.DateTime(), nullable=False),
        sa.ForeignKeyConstraint(['classroom_id'], ['virtual_classrooms.id'], ondelete='CASCADE'),
        sa.ForeignKeyConstraint(['user_id'], ['users.id'], ondelete='CASCADE'),
        sa.ForeignKeyConstraint(['student_id'], ['students.id'], ondelete='CASCADE'),
        sa.PrimaryKeyConstraint('id')
    )
    op.create_index('idx_attendance_classroom', 'classroom_attendance', ['classroom_id'])
    op.create_index('idx_attendance_student', 'classroom_attendance', ['student_id'])
    op.create_index('idx_attendance_classroom_user', 'classroom_attendance', ['classroom_id', 'user_id'], unique=True)
    
    # Create classroom_polls table
    op.create_table(
        'classroom_polls',
        sa.Column('id', sa.Integer(), nullable=False),
        sa.Column('classroom_id', sa.Integer(), nullable=False),
        sa.Column('created_by', sa.Integer(), nullable=False),
        sa.Column('question', sa.Text(), nullable=False),
        sa.Column('options', sa.JSON(), nullable=False),
        sa.Column('status', sa.Enum('draft', 'active', 'ended', name='pollstatus'), nullable=False),
        sa.Column('is_anonymous', sa.Boolean(), nullable=False),
        sa.Column('allow_multiple_choices', sa.Boolean(), nullable=False),
        sa.Column('started_at', sa.DateTime(), nullable=True),
        sa.Column('ended_at', sa.DateTime(), nullable=True),
        sa.Column('created_at', sa.DateTime(), nullable=False),
        sa.Column('updated_at', sa.DateTime(), nullable=False),
        sa.ForeignKeyConstraint(['classroom_id'], ['virtual_classrooms.id'], ondelete='CASCADE'),
        sa.ForeignKeyConstraint(['created_by'], ['users.id'], ondelete='CASCADE'),
        sa.PrimaryKeyConstraint('id')
    )
    op.create_index('idx_poll_classroom', 'classroom_polls', ['classroom_id'])
    op.create_index('idx_poll_status', 'classroom_polls', ['status'])
    
    # Create poll_responses table
    op.create_table(
        'poll_responses',
        sa.Column('id', sa.Integer(), nullable=False),
        sa.Column('poll_id', sa.Integer(), nullable=False),
        sa.Column('user_id', sa.Integer(), nullable=False),
        sa.Column('selected_options', sa.JSON(), nullable=False),
        sa.Column('created_at', sa.DateTime(), nullable=False),
        sa.ForeignKeyConstraint(['poll_id'], ['classroom_polls.id'], ondelete='CASCADE'),
        sa.ForeignKeyConstraint(['user_id'], ['users.id'], ondelete='CASCADE'),
        sa.PrimaryKeyConstraint('id')
    )
    op.create_index('idx_poll_response_poll_user', 'poll_responses', ['poll_id', 'user_id'], unique=True)
    
    # Create classroom_quizzes table
    op.create_table(
        'classroom_quizzes',
        sa.Column('id', sa.Integer(), nullable=False),
        sa.Column('classroom_id', sa.Integer(), nullable=False),
        sa.Column('created_by', sa.Integer(), nullable=False),
        sa.Column('title', sa.String(length=255), nullable=False),
        sa.Column('description', sa.Text(), nullable=True),
        sa.Column('questions', sa.JSON(), nullable=False),
        sa.Column('status', sa.Enum('draft', 'active', 'ended', name='quizstatus'), nullable=False),
        sa.Column('duration_minutes', sa.Integer(), nullable=True),
        sa.Column('passing_score', sa.Integer(), nullable=False),
        sa.Column('started_at', sa.DateTime(), nullable=True),
        sa.Column('ended_at', sa.DateTime(), nullable=True),
        sa.Column('created_at', sa.DateTime(), nullable=False),
        sa.Column('updated_at', sa.DateTime(), nullable=False),
        sa.ForeignKeyConstraint(['classroom_id'], ['virtual_classrooms.id'], ondelete='CASCADE'),
        sa.ForeignKeyConstraint(['created_by'], ['users.id'], ondelete='CASCADE'),
        sa.PrimaryKeyConstraint('id')
    )
    op.create_index('idx_quiz_classroom', 'classroom_quizzes', ['classroom_id'])
    op.create_index('idx_quiz_status', 'classroom_quizzes', ['status'])
    
    # Create quiz_submissions table
    op.create_table(
        'quiz_submissions',
        sa.Column('id', sa.Integer(), nullable=False),
        sa.Column('quiz_id', sa.Integer(), nullable=False),
        sa.Column('user_id', sa.Integer(), nullable=False),
        sa.Column('answers', sa.JSON(), nullable=False),
        sa.Column('score', sa.Integer(), nullable=True),
        sa.Column('total_questions', sa.Integer(), nullable=False),
        sa.Column('correct_answers', sa.Integer(), nullable=False),
        sa.Column('started_at', sa.DateTime(), nullable=False),
        sa.Column('submitted_at', sa.DateTime(), nullable=True),
        sa.Column('time_taken_seconds', sa.Integer(), nullable=True),
        sa.Column('is_passed', sa.Boolean(), nullable=False),
        sa.Column('created_at', sa.DateTime(), nullable=False),
        sa.Column('updated_at', sa.DateTime(), nullable=False),
        sa.ForeignKeyConstraint(['quiz_id'], ['classroom_quizzes.id'], ondelete='CASCADE'),
        sa.ForeignKeyConstraint(['user_id'], ['users.id'], ondelete='CASCADE'),
        sa.PrimaryKeyConstraint('id')
    )
    op.create_index('idx_quiz_submission_quiz', 'quiz_submissions', ['quiz_id'])
    op.create_index('idx_quiz_submission_user', 'quiz_submissions', ['user_id'])
    op.create_index('idx_quiz_submission_quiz_user', 'quiz_submissions', ['quiz_id', 'user_id'], unique=True)
    
    # Create whiteboard_sessions table
    op.create_table(
        'whiteboard_sessions',
        sa.Column('id', sa.Integer(), nullable=False),
        sa.Column('classroom_id', sa.Integer(), nullable=False),
        sa.Column('session_data', sa.JSON(), nullable=False),
        sa.Column('snapshot_url', sa.Text(), nullable=True),
        sa.Column('created_at', sa.DateTime(), nullable=False),
        sa.Column('updated_at', sa.DateTime(), nullable=False),
        sa.ForeignKeyConstraint(['classroom_id'], ['virtual_classrooms.id'], ondelete='CASCADE'),
        sa.PrimaryKeyConstraint('id')
    )
    op.create_index('idx_whiteboard_classroom', 'whiteboard_sessions', ['classroom_id'])


def downgrade():
    op.drop_index('idx_whiteboard_classroom', table_name='whiteboard_sessions')
    op.drop_table('whiteboard_sessions')
    
    op.drop_index('idx_quiz_submission_quiz_user', table_name='quiz_submissions')
    op.drop_index('idx_quiz_submission_user', table_name='quiz_submissions')
    op.drop_index('idx_quiz_submission_quiz', table_name='quiz_submissions')
    op.drop_table('quiz_submissions')
    
    op.drop_index('idx_quiz_status', table_name='classroom_quizzes')
    op.drop_index('idx_quiz_classroom', table_name='classroom_quizzes')
    op.drop_table('classroom_quizzes')
    
    op.drop_index('idx_poll_response_poll_user', table_name='poll_responses')
    op.drop_table('poll_responses')
    
    op.drop_index('idx_poll_status', table_name='classroom_polls')
    op.drop_index('idx_poll_classroom', table_name='classroom_polls')
    op.drop_table('classroom_polls')
    
    op.drop_index('idx_attendance_classroom_user', table_name='classroom_attendance')
    op.drop_index('idx_attendance_student', table_name='classroom_attendance')
    op.drop_index('idx_attendance_classroom', table_name='classroom_attendance')
    op.drop_table('classroom_attendance')
    
    op.drop_index('idx_breakout_participant_room_user', table_name='breakout_room_participants')
    op.drop_table('breakout_room_participants')
    
    op.drop_index(op.f('ix_breakout_rooms_channel_name'), table_name='breakout_rooms')
    op.drop_index('idx_breakout_status', table_name='breakout_rooms')
    op.drop_index('idx_breakout_classroom', table_name='breakout_rooms')
    op.drop_table('breakout_rooms')
    
    op.drop_index('idx_view_user', table_name='recording_views')
    op.drop_index('idx_view_recording', table_name='recording_views')
    op.drop_table('recording_views')
    
    op.drop_index(op.f('ix_classroom_recordings_recording_id'), table_name='classroom_recordings')
    op.drop_index('idx_recording_status', table_name='classroom_recordings')
    op.drop_index('idx_recording_classroom', table_name='classroom_recordings')
    op.drop_table('classroom_recordings')
    
    op.drop_index('idx_participant_classroom_user', table_name='classroom_participants')
    op.drop_index('idx_participant_user', table_name='classroom_participants')
    op.drop_index('idx_participant_classroom', table_name='classroom_participants')
    op.drop_table('classroom_participants')
    
    op.drop_index(op.f('ix_virtual_classrooms_channel_name'), table_name='virtual_classrooms')
    op.drop_index('idx_classroom_scheduled_time', table_name='virtual_classrooms')
    op.drop_index('idx_classroom_status', table_name='virtual_classrooms')
    op.drop_index('idx_classroom_teacher', table_name='virtual_classrooms')
    op.drop_index('idx_classroom_institution', table_name='virtual_classrooms')
    op.drop_table('virtual_classrooms')
    
    op.execute("DROP TYPE quizstatus")
    op.execute("DROP TYPE pollstatus")
    op.execute("DROP TYPE breakoutroomstatus")
    op.execute("DROP TYPE participantrole")
    op.execute("DROP TYPE recordingstatus")
    op.execute("DROP TYPE classroomstatus")
