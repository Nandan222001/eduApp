"""create adaptive learning path tables

Revision ID: 017
Revises: 016
Create Date: 2024-01-15 00:00:00.000000

"""
from alembic import op
import sqlalchemy as sa

revision = '017'
down_revision = '016'
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.execute("""
        CREATE TYPE difficultylevel AS ENUM ('beginner', 'elementary', 'intermediate', 'advanced', 'expert');
        CREATE TYPE masterylevel AS ENUM ('not_started', 'learning', 'practicing', 'mastered', 'needs_review');
        CREATE TYPE learningpathstatus AS ENUM ('active', 'completed', 'paused', 'abandoned');
        CREATE TYPE milestonestatus AS ENUM ('locked', 'unlocked', 'in_progress', 'completed');
        CREATE TYPE reviewpriority AS ENUM ('low', 'medium', 'high', 'critical');
    """)
    
    op.create_table(
        'learning_paths',
        sa.Column('id', sa.Integer(), nullable=False),
        sa.Column('institution_id', sa.Integer(), nullable=False),
        sa.Column('student_id', sa.Integer(), nullable=False),
        sa.Column('grade_id', sa.Integer(), nullable=False),
        sa.Column('subject_id', sa.Integer(), nullable=True),
        sa.Column('name', sa.String(length=200), nullable=False),
        sa.Column('description', sa.Text(), nullable=True),
        sa.Column('target_date', sa.Date(), nullable=True),
        sa.Column('status', sa.Enum('active', 'completed', 'paused', 'abandoned', name='learningpathstatus'), nullable=False),
        sa.Column('current_difficulty', sa.Enum('beginner', 'elementary', 'intermediate', 'advanced', 'expert', name='difficultylevel'), nullable=False),
        sa.Column('learning_velocity', sa.Float(), nullable=False),
        sa.Column('adaptation_score', sa.Float(), nullable=False),
        sa.Column('completion_percentage', sa.Float(), nullable=False),
        sa.Column('estimated_completion_date', sa.Date(), nullable=True),
        sa.Column('personalization_metadata', sa.JSON(), nullable=True),
        sa.Column('is_active', sa.Boolean(), nullable=False),
        sa.Column('created_at', sa.DateTime(), nullable=False),
        sa.Column('updated_at', sa.DateTime(), nullable=False),
        sa.ForeignKeyConstraint(['institution_id'], ['institutions.id'], ondelete='CASCADE'),
        sa.ForeignKeyConstraint(['student_id'], ['students.id'], ondelete='CASCADE'),
        sa.ForeignKeyConstraint(['grade_id'], ['grades.id'], ondelete='CASCADE'),
        sa.ForeignKeyConstraint(['subject_id'], ['subjects.id'], ondelete='CASCADE'),
        sa.PrimaryKeyConstraint('id')
    )
    op.create_index('idx_learning_path_institution', 'learning_paths', ['institution_id'])
    op.create_index('idx_learning_path_student', 'learning_paths', ['student_id'])
    op.create_index('idx_learning_path_grade', 'learning_paths', ['grade_id'])
    op.create_index('idx_learning_path_subject', 'learning_paths', ['subject_id'])
    op.create_index('idx_learning_path_status', 'learning_paths', ['status'])
    op.create_index('idx_learning_path_active', 'learning_paths', ['is_active'])
    
    op.create_table(
        'topic_sequences',
        sa.Column('id', sa.Integer(), nullable=False),
        sa.Column('institution_id', sa.Integer(), nullable=False),
        sa.Column('learning_path_id', sa.Integer(), nullable=False),
        sa.Column('topic_id', sa.Integer(), nullable=False),
        sa.Column('sequence_order', sa.Integer(), nullable=False),
        sa.Column('prerequisite_topic_ids', sa.JSON(), nullable=True),
        sa.Column('difficulty_level', sa.Enum('beginner', 'elementary', 'intermediate', 'advanced', 'expert', name='difficultylevel'), nullable=False),
        sa.Column('mastery_level', sa.Enum('not_started', 'learning', 'practicing', 'mastered', 'needs_review', name='masterylevel'), nullable=False),
        sa.Column('mastery_score', sa.Float(), nullable=False),
        sa.Column('estimated_duration_minutes', sa.Integer(), nullable=True),
        sa.Column('actual_duration_minutes', sa.Integer(), nullable=True),
        sa.Column('adaptive_difficulty_boost', sa.Float(), nullable=False),
        sa.Column('is_unlocked', sa.Boolean(), nullable=False),
        sa.Column('started_at', sa.DateTime(), nullable=True),
        sa.Column('completed_at', sa.DateTime(), nullable=True),
        sa.Column('last_reviewed_at', sa.DateTime(), nullable=True),
        sa.Column('next_review_date', sa.Date(), nullable=True),
        sa.Column('review_count', sa.Integer(), nullable=False),
        sa.Column('created_at', sa.DateTime(), nullable=False),
        sa.Column('updated_at', sa.DateTime(), nullable=False),
        sa.ForeignKeyConstraint(['institution_id'], ['institutions.id'], ondelete='CASCADE'),
        sa.ForeignKeyConstraint(['learning_path_id'], ['learning_paths.id'], ondelete='CASCADE'),
        sa.ForeignKeyConstraint(['topic_id'], ['topics.id'], ondelete='CASCADE'),
        sa.PrimaryKeyConstraint('id'),
        sa.UniqueConstraint('learning_path_id', 'topic_id', name='uq_learning_path_topic')
    )
    op.create_index('idx_topic_sequence_institution', 'topic_sequences', ['institution_id'])
    op.create_index('idx_topic_sequence_learning_path', 'topic_sequences', ['learning_path_id'])
    op.create_index('idx_topic_sequence_topic', 'topic_sequences', ['topic_id'])
    op.create_index('idx_topic_sequence_order', 'topic_sequences', ['sequence_order'])
    op.create_index('idx_topic_sequence_mastery', 'topic_sequences', ['mastery_level'])
    op.create_index('idx_topic_sequence_unlocked', 'topic_sequences', ['is_unlocked'])
    
    op.create_table(
        'topic_performance_data',
        sa.Column('id', sa.Integer(), nullable=False),
        sa.Column('institution_id', sa.Integer(), nullable=False),
        sa.Column('topic_sequence_id', sa.Integer(), nullable=False),
        sa.Column('student_id', sa.Integer(), nullable=False),
        sa.Column('quiz_score', sa.Float(), nullable=True),
        sa.Column('assignment_score', sa.Float(), nullable=True),
        sa.Column('practice_accuracy', sa.Float(), nullable=True),
        sa.Column('time_spent_minutes', sa.Integer(), nullable=False),
        sa.Column('attempts_count', sa.Integer(), nullable=False),
        sa.Column('correct_answers', sa.Integer(), nullable=False),
        sa.Column('total_questions', sa.Integer(), nullable=False),
        sa.Column('struggle_indicators', sa.JSON(), nullable=True),
        sa.Column('performance_trend', sa.String(length=20), nullable=True),
        sa.Column('ai_confidence_score', sa.Float(), nullable=True),
        sa.Column('recorded_at', sa.DateTime(), nullable=False),
        sa.Column('created_at', sa.DateTime(), nullable=False),
        sa.ForeignKeyConstraint(['institution_id'], ['institutions.id'], ondelete='CASCADE'),
        sa.ForeignKeyConstraint(['topic_sequence_id'], ['topic_sequences.id'], ondelete='CASCADE'),
        sa.ForeignKeyConstraint(['student_id'], ['students.id'], ondelete='CASCADE'),
        sa.PrimaryKeyConstraint('id')
    )
    op.create_index('idx_topic_performance_institution', 'topic_performance_data', ['institution_id'])
    op.create_index('idx_topic_performance_sequence', 'topic_performance_data', ['topic_sequence_id'])
    op.create_index('idx_topic_performance_student', 'topic_performance_data', ['student_id'])
    op.create_index('idx_topic_performance_date', 'topic_performance_data', ['recorded_at'])
    
    op.create_table(
        'learning_milestones',
        sa.Column('id', sa.Integer(), nullable=False),
        sa.Column('institution_id', sa.Integer(), nullable=False),
        sa.Column('learning_path_id', sa.Integer(), nullable=False),
        sa.Column('title', sa.String(length=200), nullable=False),
        sa.Column('description', sa.Text(), nullable=True),
        sa.Column('milestone_order', sa.Integer(), nullable=False),
        sa.Column('required_topic_ids', sa.JSON(), nullable=False),
        sa.Column('status', sa.Enum('locked', 'unlocked', 'in_progress', 'completed', name='milestonestatus'), nullable=False),
        sa.Column('target_date', sa.Date(), nullable=True),
        sa.Column('completion_criteria', sa.JSON(), nullable=True),
        sa.Column('reward_points', sa.Integer(), nullable=False),
        sa.Column('completed_at', sa.DateTime(), nullable=True),
        sa.Column('created_at', sa.DateTime(), nullable=False),
        sa.Column('updated_at', sa.DateTime(), nullable=False),
        sa.ForeignKeyConstraint(['institution_id'], ['institutions.id'], ondelete='CASCADE'),
        sa.ForeignKeyConstraint(['learning_path_id'], ['learning_paths.id'], ondelete='CASCADE'),
        sa.PrimaryKeyConstraint('id')
    )
    op.create_index('idx_milestone_institution', 'learning_milestones', ['institution_id'])
    op.create_index('idx_milestone_learning_path', 'learning_milestones', ['learning_path_id'])
    op.create_index('idx_milestone_order', 'learning_milestones', ['milestone_order'])
    op.create_index('idx_milestone_status', 'learning_milestones', ['status'])
    
    op.create_table(
        'spaced_repetition_schedules',
        sa.Column('id', sa.Integer(), nullable=False),
        sa.Column('institution_id', sa.Integer(), nullable=False),
        sa.Column('student_id', sa.Integer(), nullable=False),
        sa.Column('topic_id', sa.Integer(), nullable=False),
        sa.Column('learning_path_id', sa.Integer(), nullable=True),
        sa.Column('easiness_factor', sa.Float(), nullable=False),
        sa.Column('repetition_number', sa.Integer(), nullable=False),
        sa.Column('interval_days', sa.Integer(), nullable=False),
        sa.Column('last_review_date', sa.Date(), nullable=True),
        sa.Column('next_review_date', sa.Date(), nullable=False),
        sa.Column('review_quality', sa.Integer(), nullable=True),
        sa.Column('priority', sa.Enum('low', 'medium', 'high', 'critical', name='reviewpriority'), nullable=False),
        sa.Column('is_due', sa.Boolean(), nullable=False),
        sa.Column('consecutive_correct', sa.Integer(), nullable=False),
        sa.Column('total_reviews', sa.Integer(), nullable=False),
        sa.Column('average_quality', sa.Float(), nullable=True),
        sa.Column('created_at', sa.DateTime(), nullable=False),
        sa.Column('updated_at', sa.DateTime(), nullable=False),
        sa.ForeignKeyConstraint(['institution_id'], ['institutions.id'], ondelete='CASCADE'),
        sa.ForeignKeyConstraint(['student_id'], ['students.id'], ondelete='CASCADE'),
        sa.ForeignKeyConstraint(['topic_id'], ['topics.id'], ondelete='CASCADE'),
        sa.ForeignKeyConstraint(['learning_path_id'], ['learning_paths.id'], ondelete='CASCADE'),
        sa.PrimaryKeyConstraint('id'),
        sa.UniqueConstraint('student_id', 'topic_id', 'learning_path_id', name='uq_student_topic_path_schedule')
    )
    op.create_index('idx_spaced_rep_institution', 'spaced_repetition_schedules', ['institution_id'])
    op.create_index('idx_spaced_rep_student', 'spaced_repetition_schedules', ['student_id'])
    op.create_index('idx_spaced_rep_topic', 'spaced_repetition_schedules', ['topic_id'])
    op.create_index('idx_spaced_rep_learning_path', 'spaced_repetition_schedules', ['learning_path_id'])
    op.create_index('idx_spaced_rep_next_review', 'spaced_repetition_schedules', ['next_review_date'])
    op.create_index('idx_spaced_rep_last_review', 'spaced_repetition_schedules', ['last_review_date'])
    op.create_index('idx_spaced_rep_priority', 'spaced_repetition_schedules', ['priority'])
    op.create_index('idx_spaced_rep_due', 'spaced_repetition_schedules', ['is_due'])
    
    op.create_table(
        'review_history',
        sa.Column('id', sa.Integer(), nullable=False),
        sa.Column('institution_id', sa.Integer(), nullable=False),
        sa.Column('schedule_id', sa.Integer(), nullable=False),
        sa.Column('student_id', sa.Integer(), nullable=False),
        sa.Column('review_date', sa.Date(), nullable=False),
        sa.Column('review_quality', sa.Integer(), nullable=False),
        sa.Column('time_spent_minutes', sa.Integer(), nullable=True),
        sa.Column('score', sa.Float(), nullable=True),
        sa.Column('difficulty_rating', sa.Integer(), nullable=True),
        sa.Column('notes', sa.Text(), nullable=True),
        sa.Column('created_at', sa.DateTime(), nullable=False),
        sa.ForeignKeyConstraint(['institution_id'], ['institutions.id'], ondelete='CASCADE'),
        sa.ForeignKeyConstraint(['schedule_id'], ['spaced_repetition_schedules.id'], ondelete='CASCADE'),
        sa.ForeignKeyConstraint(['student_id'], ['students.id'], ondelete='CASCADE'),
        sa.PrimaryKeyConstraint('id')
    )
    op.create_index('idx_review_history_institution', 'review_history', ['institution_id'])
    op.create_index('idx_review_history_schedule', 'review_history', ['schedule_id'])
    op.create_index('idx_review_history_student', 'review_history', ['student_id'])
    op.create_index('idx_review_history_date', 'review_history', ['review_date'])
    
    op.create_table(
        'learning_velocity_records',
        sa.Column('id', sa.Integer(), nullable=False),
        sa.Column('institution_id', sa.Integer(), nullable=False),
        sa.Column('learning_path_id', sa.Integer(), nullable=False),
        sa.Column('student_id', sa.Integer(), nullable=False),
        sa.Column('period_start', sa.Date(), nullable=False),
        sa.Column('period_end', sa.Date(), nullable=False),
        sa.Column('topics_completed', sa.Integer(), nullable=False),
        sa.Column('total_time_minutes', sa.Integer(), nullable=False),
        sa.Column('average_mastery_score', sa.Float(), nullable=True),
        sa.Column('velocity_score', sa.Float(), nullable=False),
        sa.Column('efficiency_rating', sa.Float(), nullable=True),
        sa.Column('consistency_score', sa.Float(), nullable=True),
        sa.Column('recommended_pace_adjustment', sa.Float(), nullable=False),
        sa.Column('metrics', sa.JSON(), nullable=True),
        sa.Column('created_at', sa.DateTime(), nullable=False),
        sa.ForeignKeyConstraint(['institution_id'], ['institutions.id'], ondelete='CASCADE'),
        sa.ForeignKeyConstraint(['learning_path_id'], ['learning_paths.id'], ondelete='CASCADE'),
        sa.ForeignKeyConstraint(['student_id'], ['students.id'], ondelete='CASCADE'),
        sa.PrimaryKeyConstraint('id')
    )
    op.create_index('idx_velocity_record_institution', 'learning_velocity_records', ['institution_id'])
    op.create_index('idx_velocity_record_learning_path', 'learning_velocity_records', ['learning_path_id'])
    op.create_index('idx_velocity_record_student', 'learning_velocity_records', ['student_id'])
    op.create_index('idx_velocity_record_period', 'learning_velocity_records', ['period_start', 'period_end'])
    
    op.create_table(
        'difficulty_progressions',
        sa.Column('id', sa.Integer(), nullable=False),
        sa.Column('institution_id', sa.Integer(), nullable=False),
        sa.Column('student_id', sa.Integer(), nullable=False),
        sa.Column('topic_id', sa.Integer(), nullable=False),
        sa.Column('learning_path_id', sa.Integer(), nullable=True),
        sa.Column('current_difficulty', sa.Enum('beginner', 'elementary', 'intermediate', 'advanced', 'expert', name='difficultylevel'), nullable=False),
        sa.Column('previous_difficulty', sa.Enum('beginner', 'elementary', 'intermediate', 'advanced', 'expert', name='difficultylevel'), nullable=True),
        sa.Column('recommended_difficulty', sa.Enum('beginner', 'elementary', 'intermediate', 'advanced', 'expert', name='difficultylevel'), nullable=False),
        sa.Column('performance_score', sa.Float(), nullable=False),
        sa.Column('adaptation_reason', sa.String(length=200), nullable=True),
        sa.Column('confidence_interval', sa.JSON(), nullable=True),
        sa.Column('adjusted_at', sa.DateTime(), nullable=False),
        sa.Column('created_at', sa.DateTime(), nullable=False),
        sa.ForeignKeyConstraint(['institution_id'], ['institutions.id'], ondelete='CASCADE'),
        sa.ForeignKeyConstraint(['student_id'], ['students.id'], ondelete='CASCADE'),
        sa.ForeignKeyConstraint(['topic_id'], ['topics.id'], ondelete='CASCADE'),
        sa.ForeignKeyConstraint(['learning_path_id'], ['learning_paths.id'], ondelete='CASCADE'),
        sa.PrimaryKeyConstraint('id')
    )
    op.create_index('idx_difficulty_progression_institution', 'difficulty_progressions', ['institution_id'])
    op.create_index('idx_difficulty_progression_student', 'difficulty_progressions', ['student_id'])
    op.create_index('idx_difficulty_progression_topic', 'difficulty_progressions', ['topic_id'])
    op.create_index('idx_difficulty_progression_learning_path', 'difficulty_progressions', ['learning_path_id'])
    op.create_index('idx_difficulty_progression_adjusted', 'difficulty_progressions', ['adjusted_at'])
    
    op.create_table(
        'prerequisite_relationships',
        sa.Column('id', sa.Integer(), nullable=False),
        sa.Column('institution_id', sa.Integer(), nullable=False),
        sa.Column('topic_id', sa.Integer(), nullable=False),
        sa.Column('prerequisite_topic_id', sa.Integer(), nullable=False),
        sa.Column('strength', sa.Float(), nullable=False),
        sa.Column('is_hard_prerequisite', sa.Boolean(), nullable=False),
        sa.Column('minimum_mastery_required', sa.Float(), nullable=False),
        sa.Column('created_at', sa.DateTime(), nullable=False),
        sa.Column('updated_at', sa.DateTime(), nullable=False),
        sa.ForeignKeyConstraint(['institution_id'], ['institutions.id'], ondelete='CASCADE'),
        sa.ForeignKeyConstraint(['topic_id'], ['topics.id'], ondelete='CASCADE'),
        sa.ForeignKeyConstraint(['prerequisite_topic_id'], ['topics.id'], ondelete='CASCADE'),
        sa.PrimaryKeyConstraint('id'),
        sa.UniqueConstraint('topic_id', 'prerequisite_topic_id', name='uq_topic_prerequisite')
    )
    op.create_index('idx_prerequisite_institution', 'prerequisite_relationships', ['institution_id'])
    op.create_index('idx_prerequisite_topic', 'prerequisite_relationships', ['topic_id'])
    op.create_index('idx_prerequisite_topic_prereq', 'prerequisite_relationships', ['prerequisite_topic_id'])


def downgrade() -> None:
    op.drop_index('idx_prerequisite_topic_prereq', table_name='prerequisite_relationships')
    op.drop_index('idx_prerequisite_topic', table_name='prerequisite_relationships')
    op.drop_index('idx_prerequisite_institution', table_name='prerequisite_relationships')
    op.drop_table('prerequisite_relationships')
    
    op.drop_index('idx_difficulty_progression_adjusted', table_name='difficulty_progressions')
    op.drop_index('idx_difficulty_progression_learning_path', table_name='difficulty_progressions')
    op.drop_index('idx_difficulty_progression_topic', table_name='difficulty_progressions')
    op.drop_index('idx_difficulty_progression_student', table_name='difficulty_progressions')
    op.drop_index('idx_difficulty_progression_institution', table_name='difficulty_progressions')
    op.drop_table('difficulty_progressions')
    
    op.drop_index('idx_velocity_record_period', table_name='learning_velocity_records')
    op.drop_index('idx_velocity_record_student', table_name='learning_velocity_records')
    op.drop_index('idx_velocity_record_learning_path', table_name='learning_velocity_records')
    op.drop_index('idx_velocity_record_institution', table_name='learning_velocity_records')
    op.drop_table('learning_velocity_records')
    
    op.drop_index('idx_review_history_date', table_name='review_history')
    op.drop_index('idx_review_history_student', table_name='review_history')
    op.drop_index('idx_review_history_schedule', table_name='review_history')
    op.drop_index('idx_review_history_institution', table_name='review_history')
    op.drop_table('review_history')
    
    op.drop_index('idx_spaced_rep_due', table_name='spaced_repetition_schedules')
    op.drop_index('idx_spaced_rep_priority', table_name='spaced_repetition_schedules')
    op.drop_index('idx_spaced_rep_last_review', table_name='spaced_repetition_schedules')
    op.drop_index('idx_spaced_rep_next_review', table_name='spaced_repetition_schedules')
    op.drop_index('idx_spaced_rep_learning_path', table_name='spaced_repetition_schedules')
    op.drop_index('idx_spaced_rep_topic', table_name='spaced_repetition_schedules')
    op.drop_index('idx_spaced_rep_student', table_name='spaced_repetition_schedules')
    op.drop_index('idx_spaced_rep_institution', table_name='spaced_repetition_schedules')
    op.drop_table('spaced_repetition_schedules')
    
    op.drop_index('idx_milestone_status', table_name='learning_milestones')
    op.drop_index('idx_milestone_order', table_name='learning_milestones')
    op.drop_index('idx_milestone_learning_path', table_name='learning_milestones')
    op.drop_index('idx_milestone_institution', table_name='learning_milestones')
    op.drop_table('learning_milestones')
    
    op.drop_index('idx_topic_performance_date', table_name='topic_performance_data')
    op.drop_index('idx_topic_performance_student', table_name='topic_performance_data')
    op.drop_index('idx_topic_performance_sequence', table_name='topic_performance_data')
    op.drop_index('idx_topic_performance_institution', table_name='topic_performance_data')
    op.drop_table('topic_performance_data')
    
    op.drop_index('idx_topic_sequence_unlocked', table_name='topic_sequences')
    op.drop_index('idx_topic_sequence_mastery', table_name='topic_sequences')
    op.drop_index('idx_topic_sequence_order', table_name='topic_sequences')
    op.drop_index('idx_topic_sequence_topic', table_name='topic_sequences')
    op.drop_index('idx_topic_sequence_learning_path', table_name='topic_sequences')
    op.drop_index('idx_topic_sequence_institution', table_name='topic_sequences')
    op.drop_table('topic_sequences')
    
    op.drop_index('idx_learning_path_active', table_name='learning_paths')
    op.drop_index('idx_learning_path_status', table_name='learning_paths')
    op.drop_index('idx_learning_path_subject', table_name='learning_paths')
    op.drop_index('idx_learning_path_grade', table_name='learning_paths')
    op.drop_index('idx_learning_path_student', table_name='learning_paths')
    op.drop_index('idx_learning_path_institution', table_name='learning_paths')
    op.drop_table('learning_paths')
    
    op.execute("""
        DROP TYPE IF EXISTS reviewpriority;
        DROP TYPE IF EXISTS milestonestatus;
        DROP TYPE IF EXISTS learningpathstatus;
        DROP TYPE IF EXISTS masterylevel;
        DROP TYPE IF EXISTS difficultylevel;
    """)
