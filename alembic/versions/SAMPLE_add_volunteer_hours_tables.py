"""add volunteer hours tables

Revision ID: volunteer_hours_001
Revises: 
Create Date: 2024-01-01 00:00:00.000000

"""
from alembic import op
import sqlalchemy as sa

# revision identifiers, used by Alembic.
revision = 'volunteer_hours_001'
down_revision = '013_create_parent_linking_tables'
branch_labels = None
depends_on = None


def upgrade():
    # Create activity type enum
    op.execute("CREATE TYPE IF NOT EXISTS activitytype AS ENUM ('classroom_help', 'event_support', 'fundraising', 'field_trip_chaperone', 'committee_work')")
    
    # Create verification status enum
    op.execute("CREATE TYPE IF NOT EXISTS verificationstatus AS ENUM ('pending', 'approved', 'rejected')")
    
    # Create badge tier enum
    op.execute("CREATE TYPE IF NOT EXISTS badgetier AS ENUM ('bronze', 'silver', 'gold', 'platinum')")
    
    # Create volunteer_hour_logs table
    op.create_table(
        'volunteer_hour_logs',
        sa.Column('id', sa.Integer(), nullable=False),
        sa.Column('institution_id', sa.Integer(), nullable=False),
        sa.Column('parent_id', sa.Integer(), nullable=False),
        sa.Column('academic_year_id', sa.Integer(), nullable=False),
        sa.Column('activity_name', sa.String(length=255), nullable=False),
        sa.Column('activity_type', activity_type_enum, nullable=False),
        sa.Column('date', sa.Date(), nullable=False),
        sa.Column('hours_logged', sa.Numeric(precision=5, scale=2), nullable=False),
        sa.Column('description', sa.Text(), nullable=True),
        sa.Column('location', sa.String(length=255), nullable=True),
        sa.Column('supervisor_teacher_id', sa.Integer(), nullable=True),
        sa.Column('verification_status', verification_status_enum, nullable=False),
        sa.Column('verification_notes', sa.Text(), nullable=True),
        sa.Column('verified_at', sa.DateTime(), nullable=True),
        sa.Column('verified_by', sa.Integer(), nullable=True),
        sa.Column('attachments', sa.JSON(), nullable=True),
        sa.Column('metadata', sa.JSON(), nullable=True),
        sa.Column('created_at', sa.DateTime(), nullable=False),
        sa.Column('updated_at', sa.DateTime(), nullable=False),
        sa.ForeignKeyConstraint(['academic_year_id'], ['academic_years.id'], ondelete='CASCADE'),
        sa.ForeignKeyConstraint(['institution_id'], ['institutions.id'], ondelete='CASCADE'),
        sa.ForeignKeyConstraint(['parent_id'], ['parents.id'], ondelete='CASCADE'),
        sa.ForeignKeyConstraint(['supervisor_teacher_id'], ['teachers.id'], ondelete='SET NULL'),
        sa.ForeignKeyConstraint(['verified_by'], ['teachers.id'], ondelete='SET NULL'),
        sa.PrimaryKeyConstraint('id')
    )
    op.create_index('idx_volunteer_hour_institution', 'volunteer_hour_logs', ['institution_id'])
    op.create_index('idx_volunteer_hour_parent', 'volunteer_hour_logs', ['parent_id'])
    op.create_index('idx_volunteer_hour_academic_year', 'volunteer_hour_logs', ['academic_year_id'])
    op.create_index('idx_volunteer_hour_activity_type', 'volunteer_hour_logs', ['activity_type'])
    op.create_index('idx_volunteer_hour_date', 'volunteer_hour_logs', ['date'])
    op.create_index('idx_volunteer_hour_status', 'volunteer_hour_logs', ['verification_status'])
    op.create_index('idx_volunteer_hour_supervisor', 'volunteer_hour_logs', ['supervisor_teacher_id'])
    op.create_index('idx_volunteer_hour_verifier', 'volunteer_hour_logs', ['verified_by'])
    
    # Create volunteer_hour_summaries table
    op.create_table(
        'volunteer_hour_summaries',
        sa.Column('id', sa.Integer(), nullable=False),
        sa.Column('institution_id', sa.Integer(), nullable=False),
        sa.Column('parent_id', sa.Integer(), nullable=False),
        sa.Column('academic_year_id', sa.Integer(), nullable=False),
        sa.Column('total_hours', sa.Numeric(precision=8, scale=2), nullable=False),
        sa.Column('approved_hours', sa.Numeric(precision=8, scale=2), nullable=False),
        sa.Column('pending_hours', sa.Numeric(precision=8, scale=2), nullable=False),
        sa.Column('rejected_hours', sa.Numeric(precision=8, scale=2), nullable=False),
        sa.Column('classroom_help_hours', sa.Numeric(precision=8, scale=2), nullable=False),
        sa.Column('event_support_hours', sa.Numeric(precision=8, scale=2), nullable=False),
        sa.Column('fundraising_hours', sa.Numeric(precision=8, scale=2), nullable=False),
        sa.Column('field_trip_hours', sa.Numeric(precision=8, scale=2), nullable=False),
        sa.Column('committee_work_hours', sa.Numeric(precision=8, scale=2), nullable=False),
        sa.Column('current_rank', sa.Integer(), nullable=True),
        sa.Column('last_activity_date', sa.Date(), nullable=True),
        sa.Column('created_at', sa.DateTime(), nullable=False),
        sa.Column('updated_at', sa.DateTime(), nullable=False),
        sa.ForeignKeyConstraint(['academic_year_id'], ['academic_years.id'], ondelete='CASCADE'),
        sa.ForeignKeyConstraint(['institution_id'], ['institutions.id'], ondelete='CASCADE'),
        sa.ForeignKeyConstraint(['parent_id'], ['parents.id'], ondelete='CASCADE'),
        sa.PrimaryKeyConstraint('id'),
        sa.UniqueConstraint('parent_id', 'academic_year_id', name='uq_parent_academic_year_summary')
    )
    op.create_index('idx_volunteer_summary_institution', 'volunteer_hour_summaries', ['institution_id'])
    op.create_index('idx_volunteer_summary_parent', 'volunteer_hour_summaries', ['parent_id'])
    op.create_index('idx_volunteer_summary_academic_year', 'volunteer_hour_summaries', ['academic_year_id'])
    op.create_index('idx_volunteer_summary_approved_hours', 'volunteer_hour_summaries', ['approved_hours'])
    op.create_index('idx_volunteer_summary_rank', 'volunteer_hour_summaries', ['current_rank'])
    
    # Create volunteer_badges table
    op.create_table(
        'volunteer_badges',
        sa.Column('id', sa.Integer(), nullable=False),
        sa.Column('institution_id', sa.Integer(), nullable=False),
        sa.Column('name', sa.String(length=100), nullable=False),
        sa.Column('description', sa.Text(), nullable=True),
        sa.Column('badge_tier', badge_tier_enum, nullable=False),
        sa.Column('hours_required', sa.Numeric(precision=8, scale=2), nullable=False),
        sa.Column('icon_url', sa.String(length=500), nullable=True),
        sa.Column('color_code', sa.String(length=7), nullable=True),
        sa.Column('is_active', sa.Boolean(), nullable=False),
        sa.Column('created_at', sa.DateTime(), nullable=False),
        sa.Column('updated_at', sa.DateTime(), nullable=False),
        sa.ForeignKeyConstraint(['institution_id'], ['institutions.id'], ondelete='CASCADE'),
        sa.PrimaryKeyConstraint('id'),
        sa.UniqueConstraint('institution_id', 'hours_required', name='uq_institution_badge_hours')
    )
    op.create_index('idx_volunteer_badge_institution', 'volunteer_badges', ['institution_id'])
    op.create_index('idx_volunteer_badge_tier', 'volunteer_badges', ['badge_tier'])
    op.create_index('idx_volunteer_badge_hours', 'volunteer_badges', ['hours_required'])
    op.create_index('idx_volunteer_badge_active', 'volunteer_badges', ['is_active'])
    
    # Create parent_volunteer_badges table
    op.create_table(
        'parent_volunteer_badges',
        sa.Column('id', sa.Integer(), nullable=False),
        sa.Column('institution_id', sa.Integer(), nullable=False),
        sa.Column('parent_id', sa.Integer(), nullable=False),
        sa.Column('badge_id', sa.Integer(), nullable=False),
        sa.Column('academic_year_id', sa.Integer(), nullable=False),
        sa.Column('earned_at', sa.DateTime(), nullable=False),
        sa.Column('hours_at_earning', sa.Numeric(precision=8, scale=2), nullable=False),
        sa.Column('metadata', sa.JSON(), nullable=True),
        sa.Column('created_at', sa.DateTime(), nullable=False),
        sa.ForeignKeyConstraint(['academic_year_id'], ['academic_years.id'], ondelete='CASCADE'),
        sa.ForeignKeyConstraint(['badge_id'], ['volunteer_badges.id'], ondelete='CASCADE'),
        sa.ForeignKeyConstraint(['institution_id'], ['institutions.id'], ondelete='CASCADE'),
        sa.ForeignKeyConstraint(['parent_id'], ['parents.id'], ondelete='CASCADE'),
        sa.PrimaryKeyConstraint('id')
    )
    op.create_index('idx_parent_volunteer_badge_institution', 'parent_volunteer_badges', ['institution_id'])
    op.create_index('idx_parent_volunteer_badge_parent', 'parent_volunteer_badges', ['parent_id'])
    op.create_index('idx_parent_volunteer_badge_badge', 'parent_volunteer_badges', ['badge_id'])
    op.create_index('idx_parent_volunteer_badge_academic_year', 'parent_volunteer_badges', ['academic_year_id'])
    op.create_index('idx_parent_volunteer_badge_earned', 'parent_volunteer_badges', ['earned_at'])
    
    # Create volunteer_leaderboards table
    op.create_table(
        'volunteer_leaderboards',
        sa.Column('id', sa.Integer(), nullable=False),
        sa.Column('institution_id', sa.Integer(), nullable=False),
        sa.Column('academic_year_id', sa.Integer(), nullable=False),
        sa.Column('parent_id', sa.Integer(), nullable=False),
        sa.Column('grade_id', sa.Integer(), nullable=True),
        sa.Column('rank', sa.Integer(), nullable=False),
        sa.Column('total_hours', sa.Numeric(precision=8, scale=2), nullable=False),
        sa.Column('previous_rank', sa.Integer(), nullable=True),
        sa.Column('rank_change', sa.Integer(), nullable=True),
        sa.Column('percentile', sa.Numeric(precision=5, scale=2), nullable=True),
        sa.Column('created_at', sa.DateTime(), nullable=False),
        sa.Column('updated_at', sa.DateTime(), nullable=False),
        sa.ForeignKeyConstraint(['academic_year_id'], ['academic_years.id'], ondelete='CASCADE'),
        sa.ForeignKeyConstraint(['grade_id'], ['grades.id'], ondelete='CASCADE'),
        sa.ForeignKeyConstraint(['institution_id'], ['institutions.id'], ondelete='CASCADE'),
        sa.ForeignKeyConstraint(['parent_id'], ['parents.id'], ondelete='CASCADE'),
        sa.PrimaryKeyConstraint('id'),
        sa.UniqueConstraint('academic_year_id', 'parent_id', name='uq_academic_year_parent_leaderboard')
    )
    op.create_index('idx_volunteer_leaderboard_institution', 'volunteer_leaderboards', ['institution_id'])
    op.create_index('idx_volunteer_leaderboard_academic_year', 'volunteer_leaderboards', ['academic_year_id'])
    op.create_index('idx_volunteer_leaderboard_parent', 'volunteer_leaderboards', ['parent_id'])
    op.create_index('idx_volunteer_leaderboard_grade', 'volunteer_leaderboards', ['grade_id'])
    op.create_index('idx_volunteer_leaderboard_rank', 'volunteer_leaderboards', ['rank'])
    op.create_index('idx_volunteer_leaderboard_hours', 'volunteer_leaderboards', ['total_hours'])
    
    # Create volunteer_certificates table
    op.create_table(
        'volunteer_certificates',
        sa.Column('id', sa.Integer(), nullable=False),
        sa.Column('institution_id', sa.Integer(), nullable=False),
        sa.Column('parent_id', sa.Integer(), nullable=False),
        sa.Column('academic_year_id', sa.Integer(), nullable=False),
        sa.Column('certificate_number', sa.String(length=100), nullable=False),
        sa.Column('total_hours', sa.Numeric(precision=8, scale=2), nullable=False),
        sa.Column('issue_date', sa.Date(), nullable=False),
        sa.Column('certificate_url', sa.String(length=500), nullable=True),
        sa.Column('pdf_path', sa.String(length=500), nullable=True),
        sa.Column('signed_by', sa.Integer(), nullable=True),
        sa.Column('is_tax_deductible', sa.Boolean(), nullable=False),
        sa.Column('tax_year', sa.Integer(), nullable=True),
        sa.Column('notes', sa.Text(), nullable=True),
        sa.Column('metadata', sa.JSON(), nullable=True),
        sa.Column('created_at', sa.DateTime(), nullable=False),
        sa.Column('updated_at', sa.DateTime(), nullable=False),
        sa.ForeignKeyConstraint(['academic_year_id'], ['academic_years.id'], ondelete='CASCADE'),
        sa.ForeignKeyConstraint(['institution_id'], ['institutions.id'], ondelete='CASCADE'),
        sa.ForeignKeyConstraint(['parent_id'], ['parents.id'], ondelete='CASCADE'),
        sa.ForeignKeyConstraint(['signed_by'], ['teachers.id'], ondelete='SET NULL'),
        sa.PrimaryKeyConstraint('id'),
        sa.UniqueConstraint('parent_id', 'academic_year_id', name='uq_parent_academic_year_certificate')
    )
    op.create_index('idx_volunteer_cert_institution', 'volunteer_certificates', ['institution_id'])
    op.create_index('idx_volunteer_cert_parent', 'volunteer_certificates', ['parent_id'])
    op.create_index('idx_volunteer_cert_academic_year', 'volunteer_certificates', ['academic_year_id'])
    op.create_index('idx_volunteer_cert_number', 'volunteer_certificates', ['certificate_number'], unique=True)
    op.create_index('idx_volunteer_cert_issue_date', 'volunteer_certificates', ['issue_date'])
    op.create_index('idx_volunteer_cert_signed_by', 'volunteer_certificates', ['signed_by'])
    op.create_index('idx_volunteer_cert_tax_deductible', 'volunteer_certificates', ['is_tax_deductible'])


def downgrade():
    # Drop tables in reverse order
    op.drop_index('idx_volunteer_cert_tax_deductible', 'volunteer_certificates')
    op.drop_index('idx_volunteer_cert_signed_by', 'volunteer_certificates')
    op.drop_index('idx_volunteer_cert_issue_date', 'volunteer_certificates')
    op.drop_index('idx_volunteer_cert_number', 'volunteer_certificates')
    op.drop_index('idx_volunteer_cert_academic_year', 'volunteer_certificates')
    op.drop_index('idx_volunteer_cert_parent', 'volunteer_certificates')
    op.drop_index('idx_volunteer_cert_institution', 'volunteer_certificates')
    op.drop_table('volunteer_certificates')
    
    op.drop_index('idx_volunteer_leaderboard_hours', 'volunteer_leaderboards')
    op.drop_index('idx_volunteer_leaderboard_rank', 'volunteer_leaderboards')
    op.drop_index('idx_volunteer_leaderboard_grade', 'volunteer_leaderboards')
    op.drop_index('idx_volunteer_leaderboard_parent', 'volunteer_leaderboards')
    op.drop_index('idx_volunteer_leaderboard_academic_year', 'volunteer_leaderboards')
    op.drop_index('idx_volunteer_leaderboard_institution', 'volunteer_leaderboards')
    op.drop_table('volunteer_leaderboards')
    
    op.drop_index('idx_parent_volunteer_badge_earned', 'parent_volunteer_badges')
    op.drop_index('idx_parent_volunteer_badge_academic_year', 'parent_volunteer_badges')
    op.drop_index('idx_parent_volunteer_badge_badge', 'parent_volunteer_badges')
    op.drop_index('idx_parent_volunteer_badge_parent', 'parent_volunteer_badges')
    op.drop_index('idx_parent_volunteer_badge_institution', 'parent_volunteer_badges')
    op.drop_table('parent_volunteer_badges')
    
    op.drop_index('idx_volunteer_badge_active', 'volunteer_badges')
    op.drop_index('idx_volunteer_badge_hours', 'volunteer_badges')
    op.drop_index('idx_volunteer_badge_tier', 'volunteer_badges')
    op.drop_index('idx_volunteer_badge_institution', 'volunteer_badges')
    op.drop_table('volunteer_badges')
    
    op.drop_index('idx_volunteer_summary_rank', 'volunteer_hour_summaries')
    op.drop_index('idx_volunteer_summary_approved_hours', 'volunteer_hour_summaries')
    op.drop_index('idx_volunteer_summary_academic_year', 'volunteer_hour_summaries')
    op.drop_index('idx_volunteer_summary_parent', 'volunteer_hour_summaries')
    op.drop_index('idx_volunteer_summary_institution', 'volunteer_hour_summaries')
    op.drop_table('volunteer_hour_summaries')
    
    op.drop_index('idx_volunteer_hour_verifier', 'volunteer_hour_logs')
    op.drop_index('idx_volunteer_hour_supervisor', 'volunteer_hour_logs')
    op.drop_index('idx_volunteer_hour_status', 'volunteer_hour_logs')
    op.drop_index('idx_volunteer_hour_date', 'volunteer_hour_logs')
    op.drop_index('idx_volunteer_hour_activity_type', 'volunteer_hour_logs')
    op.drop_index('idx_volunteer_hour_academic_year', 'volunteer_hour_logs')
    op.drop_index('idx_volunteer_hour_parent', 'volunteer_hour_logs')
    op.drop_index('idx_volunteer_hour_institution', 'volunteer_hour_logs')
    op.drop_table('volunteer_hour_logs')
    
    # Drop enums
    op.execute('DROP TYPE IF EXISTS badgetier')
    op.execute('DROP TYPE IF EXISTS verificationstatus')
    op.execute('DROP TYPE IF EXISTS activitytype')
