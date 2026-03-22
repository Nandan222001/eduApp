"""add dashboard widgets

Revision ID: 001a
Revises: 005
Create Date: 2024-01-15 10:00:00.000000

"""
from alembic import op
import sqlalchemy as sa

revision = '001a'
down_revision = '005'
branch_labels = None
depends_on = None


def upgrade():
    op.create_table(
        'dashboard_widgets',
        sa.Column('id', sa.Integer(), nullable=False),
        sa.Column('user_id', sa.Integer(), nullable=False),
        sa.Column('widget_type', sa.Enum(
            'UPCOMING_DEADLINES', 'PENDING_GRADING', 'ATTENDANCE_ALERTS', 
            'RECENT_GRADES', 'QUICK_STATS', 'UPCOMING_EXAMS', 
            'RECENT_ANNOUNCEMENTS', 'PROGRESS_TRACKER', 'GOAL_TRACKER', 
            'LEADERBOARD', 'STUDY_STREAK', 'BADGES', 'PENDING_ASSIGNMENTS', 
            'CLASS_PERFORMANCE', 'ATTENDANCE_SUMMARY', 'RECENT_ACTIVITY', 
            'CALENDAR', 'TIMETABLE', 'NOTIFICATIONS', 'QUICK_ACTIONS',
            name='widgettype'
        ), nullable=False),
        sa.Column('title', sa.String(length=255), nullable=False),
        sa.Column('position', sa.Integer(), nullable=False, default=0),
        sa.Column('size', sa.Enum('SMALL', 'MEDIUM', 'LARGE', 'FULL', name='widgetsize'), nullable=False),
        sa.Column('is_visible', sa.Boolean(), nullable=False, default=True),
        sa.Column('config', sa.JSON(), nullable=True),
        sa.Column('created_at', sa.DateTime(), nullable=False),
        sa.Column('updated_at', sa.DateTime(), nullable=False),
        sa.ForeignKeyConstraint(['user_id'], ['users.id'], ondelete='CASCADE'),
        sa.PrimaryKeyConstraint('id')
    )
    op.create_index('idx_dashboard_widget_user', 'dashboard_widgets', ['user_id'])
    op.create_index('idx_dashboard_widget_position', 'dashboard_widgets', ['user_id', 'position'])
    op.create_index('idx_dashboard_widget_visible', 'dashboard_widgets', ['user_id', 'is_visible'])

    op.create_table(
        'widget_presets',
        sa.Column('id', sa.Integer(), nullable=False),
        sa.Column('role_slug', sa.String(length=100), nullable=False),
        sa.Column('widget_type', sa.Enum(
            'UPCOMING_DEADLINES', 'PENDING_GRADING', 'ATTENDANCE_ALERTS', 
            'RECENT_GRADES', 'QUICK_STATS', 'UPCOMING_EXAMS', 
            'RECENT_ANNOUNCEMENTS', 'PROGRESS_TRACKER', 'GOAL_TRACKER', 
            'LEADERBOARD', 'STUDY_STREAK', 'BADGES', 'PENDING_ASSIGNMENTS', 
            'CLASS_PERFORMANCE', 'ATTENDANCE_SUMMARY', 'RECENT_ACTIVITY', 
            'CALENDAR', 'TIMETABLE', 'NOTIFICATIONS', 'QUICK_ACTIONS',
            name='widgettype'
        ), nullable=False),
        sa.Column('default_title', sa.String(length=255), nullable=False),
        sa.Column('default_position', sa.Integer(), nullable=False),
        sa.Column('default_size', sa.Enum('SMALL', 'MEDIUM', 'LARGE', 'FULL', name='widgetsize'), nullable=False),
        sa.Column('default_visible', sa.Boolean(), nullable=False, default=True),
        sa.Column('default_config', sa.JSON(), nullable=True),
        sa.Column('description', sa.Text(), nullable=True),
        sa.Column('created_at', sa.DateTime(), nullable=False),
        sa.Column('updated_at', sa.DateTime(), nullable=False),
        sa.PrimaryKeyConstraint('id')
    )
    op.create_index('idx_widget_preset_role', 'widget_presets', ['role_slug'])
    op.create_index('idx_widget_preset_type', 'widget_presets', ['widget_type'])


def downgrade():
    op.drop_index('idx_widget_preset_type', table_name='widget_presets')
    op.drop_index('idx_widget_preset_role', table_name='widget_presets')
    op.drop_table('widget_presets')
    
    op.drop_index('idx_dashboard_widget_visible', table_name='dashboard_widgets')
    op.drop_index('idx_dashboard_widget_position', table_name='dashboard_widgets')
    op.drop_index('idx_dashboard_widget_user', table_name='dashboard_widgets')
    op.drop_table('dashboard_widgets')
    
    op.execute('DROP TYPE widgettype')
    op.execute('DROP TYPE widgetsize')
