"""enhance gamification tables

Revision ID: 009
Revises: 008
Create Date: 2024-01-19 10:00:00.000000

"""
from alembic import op
import sqlalchemy as sa

revision = '009'
down_revision = '008'
branch_labels = None
depends_on = None


def upgrade():
    op.create_table('badges',
        sa.Column('id', sa.Integer(), nullable=False),
        sa.Column('institution_id', sa.Integer(), nullable=False),
        sa.Column('name', sa.String(length=100), nullable=False),
        sa.Column('description', sa.Text(), nullable=True),
        sa.Column('badge_type', sa.Enum('attendance', 'assignment', 'exam', 'goal', 'streak', 'milestone', 'special', name='badgetype'), nullable=False),
        sa.Column('rarity', sa.Enum('common', 'rare', 'epic', 'legendary', name='badgerarity'), nullable=False, server_default='common'),
        sa.Column('icon_url', sa.String(length=500), nullable=True),
        sa.Column('points_required', sa.Integer(), nullable=True),
        sa.Column('criteria', sa.JSON(), nullable=True),
        sa.Column('auto_award', sa.Boolean(), nullable=False, server_default='false'),
        sa.Column('is_active', sa.Boolean(), nullable=False, server_default='true'),
        sa.Column('created_at', sa.DateTime(), nullable=False, server_default=sa.text('CURRENT_TIMESTAMP')),
        sa.Column('updated_at', sa.DateTime(), nullable=False, server_default=sa.text('CURRENT_TIMESTAMP')),
        sa.ForeignKeyConstraint(['institution_id'], ['institutions.id'], ondelete='CASCADE'),
        sa.PrimaryKeyConstraint('id'),
        sa.UniqueConstraint('institution_id', 'name', name='uq_institution_badge_name')
    )
    op.create_index('idx_badge_institution', 'badges', ['institution_id'])
    op.create_index('idx_badge_type', 'badges', ['badge_type'])
    op.create_index('idx_badge_active', 'badges', ['is_active'])
    op.create_index('idx_badge_auto_award', 'badges', ['auto_award'])
    
    op.create_table('user_badges',
        sa.Column('id', sa.Integer(), nullable=False),
        sa.Column('institution_id', sa.Integer(), nullable=False),
        sa.Column('user_id', sa.Integer(), nullable=False),
        sa.Column('badge_id', sa.Integer(), nullable=False),
        sa.Column('earned_at', sa.DateTime(), nullable=False, server_default=sa.text('CURRENT_TIMESTAMP')),
        sa.Column('points_awarded', sa.Integer(), nullable=False, server_default='0'),
        sa.Column('metadata', sa.JSON(), nullable=True),
        sa.Column('created_at', sa.DateTime(), nullable=False, server_default=sa.text('CURRENT_TIMESTAMP')),
        sa.ForeignKeyConstraint(['institution_id'], ['institutions.id'], ondelete='CASCADE'),
        sa.ForeignKeyConstraint(['user_id'], ['users.id'], ondelete='CASCADE'),
        sa.ForeignKeyConstraint(['badge_id'], ['badges.id'], ondelete='CASCADE'),
        sa.PrimaryKeyConstraint('id')
    )
    op.create_index('idx_user_badge_institution', 'user_badges', ['institution_id'])
    op.create_index('idx_user_badge_user', 'user_badges', ['user_id'])
    op.create_index('idx_user_badge_badge', 'user_badges', ['badge_id'])
    op.create_index('idx_user_badge_earned', 'user_badges', ['earned_at'])
    
    op.create_table('user_points',
        sa.Column('id', sa.Integer(), nullable=False),
        sa.Column('institution_id', sa.Integer(), nullable=False),
        sa.Column('user_id', sa.Integer(), nullable=False),
        sa.Column('total_points', sa.Integer(), nullable=False, server_default='0'),
        sa.Column('level', sa.Integer(), nullable=False, server_default='1'),
        sa.Column('experience_points', sa.Integer(), nullable=False, server_default='0'),
        sa.Column('current_streak', sa.Integer(), nullable=False, server_default='0'),
        sa.Column('longest_streak', sa.Integer(), nullable=False, server_default='0'),
        sa.Column('last_activity_date', sa.DateTime(), nullable=True),
        sa.Column('last_login_date', sa.DateTime(), nullable=True),
        sa.Column('created_at', sa.DateTime(), nullable=False, server_default=sa.text('CURRENT_TIMESTAMP')),
        sa.Column('updated_at', sa.DateTime(), nullable=False, server_default=sa.text('CURRENT_TIMESTAMP')),
        sa.ForeignKeyConstraint(['institution_id'], ['institutions.id'], ondelete='CASCADE'),
        sa.ForeignKeyConstraint(['user_id'], ['users.id'], ondelete='CASCADE'),
        sa.PrimaryKeyConstraint('id'),
        sa.UniqueConstraint('institution_id', 'user_id', name='uq_institution_user_points')
    )
    op.create_index('idx_user_points_institution', 'user_points', ['institution_id'])
    op.create_index('idx_user_points_user', 'user_points', ['user_id'])
    op.create_index('idx_user_points_total', 'user_points', ['total_points'])
    op.create_index('idx_user_points_level', 'user_points', ['level'])
    op.create_index('idx_user_points_streak', 'user_points', ['current_streak'])
    
    op.create_table('point_history',
        sa.Column('id', sa.Integer(), nullable=False),
        sa.Column('institution_id', sa.Integer(), nullable=False),
        sa.Column('user_points_id', sa.Integer(), nullable=False),
        sa.Column('event_type', sa.Enum('attendance', 'assignment_submit', 'assignment_grade', 'exam_pass', 'exam_excellent', 'goal_complete', 'milestone_achieve', 'daily_login', 'streak', 'badge_earn', name='pointeventtype'), nullable=False),
        sa.Column('points', sa.Integer(), nullable=False),
        sa.Column('description', sa.Text(), nullable=True),
        sa.Column('reference_id', sa.Integer(), nullable=True),
        sa.Column('reference_type', sa.String(length=50), nullable=True),
        sa.Column('metadata', sa.JSON(), nullable=True),
        sa.Column('created_at', sa.DateTime(), nullable=False, server_default=sa.text('CURRENT_TIMESTAMP')),
        sa.ForeignKeyConstraint(['institution_id'], ['institutions.id'], ondelete='CASCADE'),
        sa.ForeignKeyConstraint(['user_points_id'], ['user_points.id'], ondelete='CASCADE'),
        sa.PrimaryKeyConstraint('id')
    )
    op.create_index('idx_point_history_institution', 'point_history', ['institution_id'])
    op.create_index('idx_point_history_user_points', 'point_history', ['user_points_id'])
    op.create_index('idx_point_history_event_type', 'point_history', ['event_type'])
    op.create_index('idx_point_history_reference', 'point_history', ['reference_type', 'reference_id'])
    op.create_index('idx_point_history_created', 'point_history', ['created_at'])
    
    op.create_table('achievements',
        sa.Column('id', sa.Integer(), nullable=False),
        sa.Column('institution_id', sa.Integer(), nullable=False),
        sa.Column('name', sa.String(length=100), nullable=False),
        sa.Column('description', sa.Text(), nullable=True),
        sa.Column('achievement_type', sa.Enum('attendance', 'assignment', 'exam', 'goal', 'streak', 'level', 'points', 'social', name='achievementtype'), nullable=False),
        sa.Column('icon_url', sa.String(length=500), nullable=True),
        sa.Column('points_reward', sa.Integer(), nullable=False, server_default='0'),
        sa.Column('requirements', sa.JSON(), nullable=False),
        sa.Column('is_secret', sa.Boolean(), nullable=False, server_default='false'),
        sa.Column('is_repeatable', sa.Boolean(), nullable=False, server_default='false'),
        sa.Column('is_active', sa.Boolean(), nullable=False, server_default='true'),
        sa.Column('created_at', sa.DateTime(), nullable=False, server_default=sa.text('CURRENT_TIMESTAMP')),
        sa.Column('updated_at', sa.DateTime(), nullable=False, server_default=sa.text('CURRENT_TIMESTAMP')),
        sa.ForeignKeyConstraint(['institution_id'], ['institutions.id'], ondelete='CASCADE'),
        sa.PrimaryKeyConstraint('id'),
        sa.UniqueConstraint('institution_id', 'name', name='uq_institution_achievement_name')
    )
    op.create_index('idx_achievement_institution', 'achievements', ['institution_id'])
    op.create_index('idx_achievement_type', 'achievements', ['achievement_type'])
    op.create_index('idx_achievement_active', 'achievements', ['is_active'])
    
    op.create_table('user_achievements',
        sa.Column('id', sa.Integer(), nullable=False),
        sa.Column('institution_id', sa.Integer(), nullable=False),
        sa.Column('user_id', sa.Integer(), nullable=False),
        sa.Column('achievement_id', sa.Integer(), nullable=False),
        sa.Column('progress', sa.Numeric(precision=5, scale=2), nullable=False, server_default='0'),
        sa.Column('is_completed', sa.Boolean(), nullable=False, server_default='false'),
        sa.Column('completed_at', sa.DateTime(), nullable=True),
        sa.Column('times_completed', sa.Integer(), nullable=False, server_default='0'),
        sa.Column('metadata', sa.JSON(), nullable=True),
        sa.Column('created_at', sa.DateTime(), nullable=False, server_default=sa.text('CURRENT_TIMESTAMP')),
        sa.Column('updated_at', sa.DateTime(), nullable=False, server_default=sa.text('CURRENT_TIMESTAMP')),
        sa.ForeignKeyConstraint(['institution_id'], ['institutions.id'], ondelete='CASCADE'),
        sa.ForeignKeyConstraint(['user_id'], ['users.id'], ondelete='CASCADE'),
        sa.ForeignKeyConstraint(['achievement_id'], ['achievements.id'], ondelete='CASCADE'),
        sa.PrimaryKeyConstraint('id')
    )
    op.create_index('idx_user_achievement_institution', 'user_achievements', ['institution_id'])
    op.create_index('idx_user_achievement_user', 'user_achievements', ['user_id'])
    op.create_index('idx_user_achievement_achievement', 'user_achievements', ['achievement_id'])
    op.create_index('idx_user_achievement_completed', 'user_achievements', ['is_completed'])
    op.create_index('idx_user_achievement_user_achievement', 'user_achievements', ['user_id', 'achievement_id'])
    
    op.create_table('leaderboards',
        sa.Column('id', sa.Integer(), nullable=False),
        sa.Column('institution_id', sa.Integer(), nullable=False),
        sa.Column('name', sa.String(length=100), nullable=False),
        sa.Column('description', sa.Text(), nullable=True),
        sa.Column('leaderboard_type', sa.Enum('global', 'grade', 'section', 'subject', 'custom', name='leaderboardtype'), nullable=False),
        sa.Column('period', sa.Enum('all_time', 'yearly', 'monthly', 'weekly', 'daily', name='leaderboardperiod'), nullable=False),
        sa.Column('grade_id', sa.Integer(), nullable=True),
        sa.Column('section_id', sa.Integer(), nullable=True),
        sa.Column('subject_id', sa.Integer(), nullable=True),
        sa.Column('start_date', sa.DateTime(), nullable=True),
        sa.Column('end_date', sa.DateTime(), nullable=True),
        sa.Column('is_public', sa.Boolean(), nullable=False, server_default='true'),
        sa.Column('show_full_names', sa.Boolean(), nullable=False, server_default='true'),
        sa.Column('max_entries', sa.Integer(), nullable=False, server_default='100'),
        sa.Column('is_active', sa.Boolean(), nullable=False, server_default='true'),
        sa.Column('created_at', sa.DateTime(), nullable=False, server_default=sa.text('CURRENT_TIMESTAMP')),
        sa.Column('updated_at', sa.DateTime(), nullable=False, server_default=sa.text('CURRENT_TIMESTAMP')),
        sa.ForeignKeyConstraint(['institution_id'], ['institutions.id'], ondelete='CASCADE'),
        sa.ForeignKeyConstraint(['grade_id'], ['grades.id'], ondelete='CASCADE'),
        sa.ForeignKeyConstraint(['section_id'], ['sections.id'], ondelete='CASCADE'),
        sa.ForeignKeyConstraint(['subject_id'], ['subjects.id'], ondelete='CASCADE'),
        sa.PrimaryKeyConstraint('id')
    )
    op.create_index('idx_leaderboard_institution', 'leaderboards', ['institution_id'])
    op.create_index('idx_leaderboard_type', 'leaderboards', ['leaderboard_type'])
    op.create_index('idx_leaderboard_period', 'leaderboards', ['period'])
    op.create_index('idx_leaderboard_grade', 'leaderboards', ['grade_id'])
    op.create_index('idx_leaderboard_section', 'leaderboards', ['section_id'])
    op.create_index('idx_leaderboard_subject', 'leaderboards', ['subject_id'])
    op.create_index('idx_leaderboard_active', 'leaderboards', ['is_active'])
    
    op.create_table('leaderboard_entries',
        sa.Column('id', sa.Integer(), nullable=False),
        sa.Column('institution_id', sa.Integer(), nullable=False),
        sa.Column('leaderboard_id', sa.Integer(), nullable=False),
        sa.Column('user_id', sa.Integer(), nullable=False),
        sa.Column('rank', sa.Integer(), nullable=False),
        sa.Column('score', sa.Integer(), nullable=False),
        sa.Column('previous_rank', sa.Integer(), nullable=True),
        sa.Column('metadata', sa.JSON(), nullable=True),
        sa.Column('created_at', sa.DateTime(), nullable=False, server_default=sa.text('CURRENT_TIMESTAMP')),
        sa.Column('updated_at', sa.DateTime(), nullable=False, server_default=sa.text('CURRENT_TIMESTAMP')),
        sa.ForeignKeyConstraint(['institution_id'], ['institutions.id'], ondelete='CASCADE'),
        sa.ForeignKeyConstraint(['leaderboard_id'], ['leaderboards.id'], ondelete='CASCADE'),
        sa.ForeignKeyConstraint(['user_id'], ['users.id'], ondelete='CASCADE'),
        sa.PrimaryKeyConstraint('id'),
        sa.UniqueConstraint('leaderboard_id', 'user_id', name='uq_leaderboard_user')
    )
    op.create_index('idx_leaderboard_entry_institution', 'leaderboard_entries', ['institution_id'])
    op.create_index('idx_leaderboard_entry_leaderboard', 'leaderboard_entries', ['leaderboard_id'])
    op.create_index('idx_leaderboard_entry_user', 'leaderboard_entries', ['user_id'])
    op.create_index('idx_leaderboard_entry_rank', 'leaderboard_entries', ['rank'])
    op.create_index('idx_leaderboard_entry_score', 'leaderboard_entries', ['score'])
    
    op.create_table('streak_trackers',
        sa.Column('id', sa.Integer(), nullable=False),
        sa.Column('institution_id', sa.Integer(), nullable=False),
        sa.Column('user_id', sa.Integer(), nullable=False),
        sa.Column('streak_type', sa.String(length=50), nullable=False),
        sa.Column('current_streak', sa.Integer(), nullable=False, server_default='0'),
        sa.Column('longest_streak', sa.Integer(), nullable=False, server_default='0'),
        sa.Column('last_activity_date', sa.DateTime(), nullable=True),
        sa.Column('metadata', sa.JSON(), nullable=True),
        sa.Column('created_at', sa.DateTime(), nullable=False, server_default=sa.text('CURRENT_TIMESTAMP')),
        sa.Column('updated_at', sa.DateTime(), nullable=False, server_default=sa.text('CURRENT_TIMESTAMP')),
        sa.ForeignKeyConstraint(['institution_id'], ['institutions.id'], ondelete='CASCADE'),
        sa.ForeignKeyConstraint(['user_id'], ['users.id'], ondelete='CASCADE'),
        sa.PrimaryKeyConstraint('id'),
        sa.UniqueConstraint('institution_id', 'user_id', 'streak_type', name='uq_user_streak_type')
    )
    op.create_index('idx_streak_tracker_institution', 'streak_trackers', ['institution_id'])
    op.create_index('idx_streak_tracker_user', 'streak_trackers', ['user_id'])
    op.create_index('idx_streak_tracker_type', 'streak_trackers', ['streak_type'])
    op.create_index('idx_streak_tracker_current', 'streak_trackers', ['current_streak'])


def downgrade():
    op.drop_index('idx_streak_tracker_current', table_name='streak_trackers')
    op.drop_index('idx_streak_tracker_type', table_name='streak_trackers')
    op.drop_index('idx_streak_tracker_user', table_name='streak_trackers')
    op.drop_index('idx_streak_tracker_institution', table_name='streak_trackers')
    op.drop_table('streak_trackers')
    
    op.drop_index('idx_leaderboard_entry_score', table_name='leaderboard_entries')
    op.drop_index('idx_leaderboard_entry_rank', table_name='leaderboard_entries')
    op.drop_index('idx_leaderboard_entry_user', table_name='leaderboard_entries')
    op.drop_index('idx_leaderboard_entry_leaderboard', table_name='leaderboard_entries')
    op.drop_index('idx_leaderboard_entry_institution', table_name='leaderboard_entries')
    op.drop_table('leaderboard_entries')
    
    op.drop_index('idx_leaderboard_active', table_name='leaderboards')
    op.drop_index('idx_leaderboard_subject', table_name='leaderboards')
    op.drop_index('idx_leaderboard_section', table_name='leaderboards')
    op.drop_index('idx_leaderboard_grade', table_name='leaderboards')
    op.drop_index('idx_leaderboard_period', table_name='leaderboards')
    op.drop_index('idx_leaderboard_type', table_name='leaderboards')
    op.drop_index('idx_leaderboard_institution', table_name='leaderboards')
    op.drop_table('leaderboards')
    
    op.drop_index('idx_user_achievement_user_achievement', table_name='user_achievements')
    op.drop_index('idx_user_achievement_completed', table_name='user_achievements')
    op.drop_index('idx_user_achievement_achievement', table_name='user_achievements')
    op.drop_index('idx_user_achievement_user', table_name='user_achievements')
    op.drop_index('idx_user_achievement_institution', table_name='user_achievements')
    op.drop_table('user_achievements')
    
    op.drop_index('idx_achievement_active', table_name='achievements')
    op.drop_index('idx_achievement_type', table_name='achievements')
    op.drop_index('idx_achievement_institution', table_name='achievements')
    op.drop_table('achievements')
    
    op.drop_index('idx_point_history_created', table_name='point_history')
    op.drop_index('idx_point_history_reference', table_name='point_history')
    op.drop_index('idx_point_history_event_type', table_name='point_history')
    op.drop_index('idx_point_history_user_points', table_name='point_history')
    op.drop_index('idx_point_history_institution', table_name='point_history')
    op.drop_table('point_history')
    
    op.drop_index('idx_user_points_streak', table_name='user_points')
    op.drop_index('idx_user_points_level', table_name='user_points')
    op.drop_index('idx_user_points_total', table_name='user_points')
    op.drop_index('idx_user_points_user', table_name='user_points')
    op.drop_index('idx_user_points_institution', table_name='user_points')
    op.drop_table('user_points')
    
    op.drop_index('idx_user_badge_earned', table_name='user_badges')
    op.drop_index('idx_user_badge_badge', table_name='user_badges')
    op.drop_index('idx_user_badge_user', table_name='user_badges')
    op.drop_index('idx_user_badge_institution', table_name='user_badges')
    op.drop_table('user_badges')
    
    op.drop_index('idx_badge_auto_award', table_name='badges')
    op.drop_index('idx_badge_active', table_name='badges')
    op.drop_index('idx_badge_type', table_name='badges')
    op.drop_index('idx_badge_institution', table_name='badges')
    op.drop_table('badges')
    
    op.execute('DROP TYPE IF EXISTS leaderboardperiod')
    op.execute('DROP TYPE IF EXISTS leaderboardtype')
    op.execute('DROP TYPE IF EXISTS achievementtype')
    op.execute('DROP TYPE IF EXISTS pointeventtype')
    op.execute('DROP TYPE IF EXISTS badgerarity')
    op.execute('DROP TYPE IF EXISTS badgetype')
