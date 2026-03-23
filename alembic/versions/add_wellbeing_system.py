"""add wellbeing system

Revision ID: add_wellbeing_system
Revises: 
Create Date: 2024-01-15 10:00:00.000000

"""
from alembic import op
import sqlalchemy as sa

# revision identifiers, used by Alembic.
revision = 'add_wellbeing_system'
down_revision = '005'
branch_labels = None
depends_on = None


def upgrade() -> None:
    # Create counselor_profiles table
    op.create_table('counselor_profiles',
    sa.Column('id', sa.Integer(), nullable=False),
    sa.Column('institution_id', sa.Integer(), nullable=False),
    sa.Column('user_id', sa.Integer(), nullable=False),
    sa.Column('license_number', sa.String(length=100), nullable=True),
    sa.Column('specializations', sa.JSON(), nullable=True),
    sa.Column('qualifications', sa.JSON(), nullable=True),
    sa.Column('bio', sa.Text(), nullable=True),
    sa.Column('max_case_load', sa.Integer(), nullable=False, server_default='50'),
    sa.Column('current_case_load', sa.Integer(), nullable=False, server_default='0'),
    sa.Column('availability_schedule', sa.JSON(), nullable=True),
    sa.Column('contact_email', sa.String(length=255), nullable=True),
    sa.Column('contact_phone', sa.String(length=20), nullable=True),
    sa.Column('office_location', sa.String(length=255), nullable=True),
    sa.Column('is_active', sa.Boolean(), nullable=False, server_default='true'),
    sa.Column('can_handle_crisis', sa.Boolean(), nullable=False, server_default='false'),
    sa.Column('created_at', sa.DateTime(), nullable=False, server_default=sa.text('now()')),
    sa.Column('updated_at', sa.DateTime(), nullable=False, server_default=sa.text('now()')),
    sa.ForeignKeyConstraint(['institution_id'], ['institutions.id'], ondelete='CASCADE'),
    sa.ForeignKeyConstraint(['user_id'], ['users.id'], ondelete='CASCADE'),
    sa.PrimaryKeyConstraint('id')
    )
    op.create_index('idx_counselor_active', 'counselor_profiles', ['is_active'], unique=False)
    op.create_index('idx_counselor_crisis', 'counselor_profiles', ['can_handle_crisis'], unique=False)
    op.create_index('idx_counselor_institution', 'counselor_profiles', ['institution_id'], unique=False)
    op.create_index('idx_counselor_user', 'counselor_profiles', ['user_id'], unique=False)

    # Create student_wellbeing_profiles table
    op.create_table('student_wellbeing_profiles',
    sa.Column('id', sa.Integer(), nullable=False),
    sa.Column('institution_id', sa.Integer(), nullable=False),
    sa.Column('student_id', sa.Integer(), nullable=False),
    sa.Column('current_risk_level', sa.String(length=20), nullable=False, server_default='low'),
    sa.Column('overall_risk_score', sa.Float(), nullable=False, server_default='0.0'),
    sa.Column('sentiment_trend', sa.Float(), nullable=False, server_default='0.0'),
    sa.Column('attendance_trend', sa.Float(), nullable=False, server_default='0.0'),
    sa.Column('grade_trend', sa.Float(), nullable=False, server_default='0.0'),
    sa.Column('participation_trend', sa.Float(), nullable=False, server_default='0.0'),
    sa.Column('social_trend', sa.Float(), nullable=False, server_default='0.0'),
    sa.Column('total_alerts', sa.Integer(), nullable=False, server_default='0'),
    sa.Column('active_alerts', sa.Integer(), nullable=False, server_default='0'),
    sa.Column('resolved_alerts', sa.Integer(), nullable=False, server_default='0'),
    sa.Column('last_intervention_date', sa.DateTime(), nullable=True),
    sa.Column('last_assessment_date', sa.DateTime(), nullable=True),
    sa.Column('next_review_date', sa.DateTime(), nullable=True),
    sa.Column('additional_info', sa.JSON(), nullable=True),
    sa.Column('created_at', sa.DateTime(), nullable=False, server_default=sa.text('now()')),
    sa.Column('updated_at', sa.DateTime(), nullable=False, server_default=sa.text('now()')),
    sa.ForeignKeyConstraint(['institution_id'], ['institutions.id'], ondelete='CASCADE'),
    sa.ForeignKeyConstraint(['student_id'], ['students.id'], ondelete='CASCADE'),
    sa.PrimaryKeyConstraint('id')
    )
    op.create_index('idx_wellbeing_profile_institution', 'student_wellbeing_profiles', ['institution_id'], unique=False)
    op.create_index('idx_wellbeing_profile_next_review', 'student_wellbeing_profiles', ['next_review_date'], unique=False)
    op.create_index('idx_wellbeing_profile_risk_level', 'student_wellbeing_profiles', ['current_risk_level'], unique=False)
    op.create_index('idx_wellbeing_profile_risk_score', 'student_wellbeing_profiles', ['overall_risk_score'], unique=False)
    op.create_index('idx_wellbeing_profile_student', 'student_wellbeing_profiles', ['student_id'], unique=False)

    # Create wellbeing_alerts table
    op.create_table('wellbeing_alerts',
    sa.Column('id', sa.Integer(), nullable=False),
    sa.Column('institution_id', sa.Integer(), nullable=False),
    sa.Column('student_id', sa.Integer(), nullable=False),
    sa.Column('alert_type', sa.String(length=50), nullable=False),
    sa.Column('severity', sa.String(length=20), nullable=False),
    sa.Column('status', sa.String(length=20), nullable=False, server_default='pending'),
    sa.Column('title', sa.String(length=255), nullable=False),
    sa.Column('description', sa.Text(), nullable=False),
    sa.Column('risk_score', sa.Float(), nullable=False),
    sa.Column('detected_indicators', sa.JSON(), nullable=False),
    sa.Column('recommended_actions', sa.JSON(), nullable=False),
    sa.Column('metadata', sa.JSON(), nullable=True),
    sa.Column('assigned_counselor_id', sa.Integer(), nullable=True),
    sa.Column('acknowledged_by', sa.Integer(), nullable=True),
    sa.Column('acknowledged_at', sa.DateTime(), nullable=True),
    sa.Column('resolved_by', sa.Integer(), nullable=True),
    sa.Column('resolved_at', sa.DateTime(), nullable=True),
    sa.Column('resolution_notes', sa.Text(), nullable=True),
    sa.Column('parent_notified', sa.Boolean(), nullable=False, server_default='false'),
    sa.Column('parent_notified_at', sa.DateTime(), nullable=True),
    sa.Column('auto_detected', sa.Boolean(), nullable=False, server_default='true'),
    sa.Column('detected_at', sa.DateTime(), nullable=False, server_default=sa.text('now()')),
    sa.Column('created_at', sa.DateTime(), nullable=False, server_default=sa.text('now()')),
    sa.Column('updated_at', sa.DateTime(), nullable=False, server_default=sa.text('now()')),
    sa.ForeignKeyConstraint(['acknowledged_by'], ['users.id'], ondelete='SET NULL'),
    sa.ForeignKeyConstraint(['assigned_counselor_id'], ['users.id'], ondelete='SET NULL'),
    sa.ForeignKeyConstraint(['institution_id'], ['institutions.id'], ondelete='CASCADE'),
    sa.ForeignKeyConstraint(['resolved_by'], ['users.id'], ondelete='SET NULL'),
    sa.ForeignKeyConstraint(['student_id'], ['students.id'], ondelete='CASCADE'),
    sa.PrimaryKeyConstraint('id')
    )
    op.create_index('idx_wellbeing_alert_counselor', 'wellbeing_alerts', ['assigned_counselor_id'], unique=False)
    op.create_index('idx_wellbeing_alert_detected', 'wellbeing_alerts', ['detected_at'], unique=False)
    op.create_index('idx_wellbeing_alert_institution', 'wellbeing_alerts', ['institution_id'], unique=False)
    op.create_index('idx_wellbeing_alert_risk_score', 'wellbeing_alerts', ['risk_score'], unique=False)
    op.create_index('idx_wellbeing_alert_severity', 'wellbeing_alerts', ['severity'], unique=False)
    op.create_index('idx_wellbeing_alert_status', 'wellbeing_alerts', ['status'], unique=False)
    op.create_index('idx_wellbeing_alert_student', 'wellbeing_alerts', ['student_id'], unique=False)
    op.create_index('idx_wellbeing_alert_student_status', 'wellbeing_alerts', ['student_id', 'status'], unique=False)
    op.create_index('idx_wellbeing_alert_type', 'wellbeing_alerts', ['alert_type'], unique=False)

    # Create sentiment_analyses table
    op.create_table('sentiment_analyses',
    sa.Column('id', sa.Integer(), nullable=False),
    sa.Column('institution_id', sa.Integer(), nullable=False),
    sa.Column('student_id', sa.Integer(), nullable=False),
    sa.Column('source_type', sa.String(length=50), nullable=False),
    sa.Column('source_id', sa.Integer(), nullable=False),
    sa.Column('content', sa.Text(), nullable=False),
    sa.Column('sentiment_score', sa.Float(), nullable=False),
    sa.Column('sentiment_category', sa.String(length=20), nullable=False),
    sa.Column('distress_indicators', sa.JSON(), nullable=True),
    sa.Column('detected_keywords', sa.JSON(), nullable=True),
    sa.Column('confidence_score', sa.Float(), nullable=False),
    sa.Column('flagged_for_review', sa.Boolean(), nullable=False, server_default='false'),
    sa.Column('reviewed', sa.Boolean(), nullable=False, server_default='false'),
    sa.Column('reviewed_by', sa.Integer(), nullable=True),
    sa.Column('reviewed_at', sa.DateTime(), nullable=True),
    sa.Column('created_at', sa.DateTime(), nullable=False, server_default=sa.text('now()')),
    sa.ForeignKeyConstraint(['institution_id'], ['institutions.id'], ondelete='CASCADE'),
    sa.ForeignKeyConstraint(['reviewed_by'], ['users.id'], ondelete='SET NULL'),
    sa.ForeignKeyConstraint(['student_id'], ['students.id'], ondelete='CASCADE'),
    sa.PrimaryKeyConstraint('id')
    )
    op.create_index('idx_sentiment_category', 'sentiment_analyses', ['sentiment_category'], unique=False)
    op.create_index('idx_sentiment_flagged', 'sentiment_analyses', ['flagged_for_review'], unique=False)
    op.create_index('idx_sentiment_institution', 'sentiment_analyses', ['institution_id'], unique=False)
    op.create_index('idx_sentiment_score', 'sentiment_analyses', ['sentiment_score'], unique=False)
    op.create_index('idx_sentiment_source', 'sentiment_analyses', ['source_type', 'source_id'], unique=False)
    op.create_index('idx_sentiment_student', 'sentiment_analyses', ['student_id'], unique=False)
    op.create_index('idx_sentiment_student_created', 'sentiment_analyses', ['student_id', 'created_at'], unique=False)

    # Create behavioral_patterns table
    op.create_table('behavioral_patterns',
    sa.Column('id', sa.Integer(), nullable=False),
    sa.Column('institution_id', sa.Integer(), nullable=False),
    sa.Column('student_id', sa.Integer(), nullable=False),
    sa.Column('pattern_type', sa.String(length=50), nullable=False),
    sa.Column('period_start', sa.DateTime(), nullable=False),
    sa.Column('period_end', sa.DateTime(), nullable=False),
    sa.Column('baseline_metrics', sa.JSON(), nullable=False),
    sa.Column('current_metrics', sa.JSON(), nullable=False),
    sa.Column('change_percentage', sa.Float(), nullable=False),
    sa.Column('is_concerning', sa.Boolean(), nullable=False, server_default='false'),
    sa.Column('concern_level', sa.Float(), nullable=False),
    sa.Column('details', sa.JSON(), nullable=True),
    sa.Column('created_at', sa.DateTime(), nullable=False, server_default=sa.text('now()')),
    sa.Column('updated_at', sa.DateTime(), nullable=False, server_default=sa.text('now()')),
    sa.ForeignKeyConstraint(['institution_id'], ['institutions.id'], ondelete='CASCADE'),
    sa.ForeignKeyConstraint(['student_id'], ['students.id'], ondelete='CASCADE'),
    sa.PrimaryKeyConstraint('id')
    )
    op.create_index('idx_behavioral_pattern_change', 'behavioral_patterns', ['change_percentage'], unique=False)
    op.create_index('idx_behavioral_pattern_concerning', 'behavioral_patterns', ['is_concerning'], unique=False)
    op.create_index('idx_behavioral_pattern_institution', 'behavioral_patterns', ['institution_id'], unique=False)
    op.create_index('idx_behavioral_pattern_period', 'behavioral_patterns', ['period_start', 'period_end'], unique=False)
    op.create_index('idx_behavioral_pattern_student', 'behavioral_patterns', ['student_id'], unique=False)
    op.create_index('idx_behavioral_pattern_type', 'behavioral_patterns', ['pattern_type'], unique=False)

    # Create wellbeing_consents table
    op.create_table('wellbeing_consents',
    sa.Column('id', sa.Integer(), nullable=False),
    sa.Column('institution_id', sa.Integer(), nullable=False),
    sa.Column('student_id', sa.Integer(), nullable=False),
    sa.Column('parent_id', sa.Integer(), nullable=True),
    sa.Column('consent_type', sa.String(length=100), nullable=False),
    sa.Column('status', sa.String(length=20), nullable=False, server_default='pending'),
    sa.Column('data_access_level', sa.String(length=20), nullable=False, server_default='basic'),
    sa.Column('granted_by_parent', sa.Boolean(), nullable=False, server_default='false'),
    sa.Column('granted_by_student', sa.Boolean(), nullable=False, server_default='false'),
    sa.Column('consent_details', sa.JSON(), nullable=True),
    sa.Column('restrictions', sa.JSON(), nullable=True),
    sa.Column('granted_at', sa.DateTime(), nullable=True),
    sa.Column('expires_at', sa.DateTime(), nullable=True),
    sa.Column('revoked_at', sa.DateTime(), nullable=True),
    sa.Column('revoked_by', sa.Integer(), nullable=True),
    sa.Column('revocation_reason', sa.Text(), nullable=True),
    sa.Column('created_at', sa.DateTime(), nullable=False, server_default=sa.text('now()')),
    sa.Column('updated_at', sa.DateTime(), nullable=False, server_default=sa.text('now()')),
    sa.ForeignKeyConstraint(['institution_id'], ['institutions.id'], ondelete='CASCADE'),
    sa.ForeignKeyConstraint(['parent_id'], ['parents.id'], ondelete='CASCADE'),
    sa.ForeignKeyConstraint(['revoked_by'], ['users.id'], ondelete='SET NULL'),
    sa.ForeignKeyConstraint(['student_id'], ['students.id'], ondelete='CASCADE'),
    sa.PrimaryKeyConstraint('id')
    )
    op.create_index('idx_wellbeing_consent_expires', 'wellbeing_consents', ['expires_at'], unique=False)
    op.create_index('idx_wellbeing_consent_institution', 'wellbeing_consents', ['institution_id'], unique=False)
    op.create_index('idx_wellbeing_consent_parent', 'wellbeing_consents', ['parent_id'], unique=False)
    op.create_index('idx_wellbeing_consent_status', 'wellbeing_consents', ['status'], unique=False)
    op.create_index('idx_wellbeing_consent_student', 'wellbeing_consents', ['student_id'], unique=False)

    # Create alert_notes table
    op.create_table('alert_notes',
    sa.Column('id', sa.Integer(), nullable=False),
    sa.Column('alert_id', sa.Integer(), nullable=False),
    sa.Column('created_by', sa.Integer(), nullable=False),
    sa.Column('content', sa.Text(), nullable=False),
    sa.Column('is_confidential', sa.Boolean(), nullable=False, server_default='true'),
    sa.Column('created_at', sa.DateTime(), nullable=False, server_default=sa.text('now()')),
    sa.Column('updated_at', sa.DateTime(), nullable=False, server_default=sa.text('now()')),
    sa.ForeignKeyConstraint(['alert_id'], ['wellbeing_alerts.id'], ondelete='CASCADE'),
    sa.ForeignKeyConstraint(['created_by'], ['users.id'], ondelete='CASCADE'),
    sa.PrimaryKeyConstraint('id')
    )
    op.create_index('idx_alert_note_alert', 'alert_notes', ['alert_id'], unique=False)
    op.create_index('idx_alert_note_creator', 'alert_notes', ['created_by'], unique=False)

    # Create wellbeing_interventions table
    op.create_table('wellbeing_interventions',
    sa.Column('id', sa.Integer(), nullable=False),
    sa.Column('alert_id', sa.Integer(), nullable=False),
    sa.Column('institution_id', sa.Integer(), nullable=False),
    sa.Column('student_id', sa.Integer(), nullable=False),
    sa.Column('counselor_id', sa.Integer(), nullable=False),
    sa.Column('intervention_type', sa.String(length=100), nullable=False),
    sa.Column('description', sa.Text(), nullable=False),
    sa.Column('action_taken', sa.Text(), nullable=False),
    sa.Column('scheduled_at', sa.DateTime(), nullable=True),
    sa.Column('completed_at', sa.DateTime(), nullable=True),
    sa.Column('outcome', sa.Text(), nullable=True),
    sa.Column('follow_up_required', sa.Boolean(), nullable=False, server_default='false'),
    sa.Column('follow_up_date', sa.DateTime(), nullable=True),
    sa.Column('created_at', sa.DateTime(), nullable=False, server_default=sa.text('now()')),
    sa.Column('updated_at', sa.DateTime(), nullable=False, server_default=sa.text('now()')),
    sa.ForeignKeyConstraint(['alert_id'], ['wellbeing_alerts.id'], ondelete='CASCADE'),
    sa.ForeignKeyConstraint(['counselor_id'], ['users.id'], ondelete='CASCADE'),
    sa.ForeignKeyConstraint(['institution_id'], ['institutions.id'], ondelete='CASCADE'),
    sa.ForeignKeyConstraint(['student_id'], ['students.id'], ondelete='CASCADE'),
    sa.PrimaryKeyConstraint('id')
    )
    op.create_index('idx_intervention_alert', 'wellbeing_interventions', ['alert_id'], unique=False)
    op.create_index('idx_intervention_counselor', 'wellbeing_interventions', ['counselor_id'], unique=False)
    op.create_index('idx_intervention_institution', 'wellbeing_interventions', ['institution_id'], unique=False)
    op.create_index('idx_intervention_scheduled', 'wellbeing_interventions', ['scheduled_at'], unique=False)
    op.create_index('idx_intervention_student', 'wellbeing_interventions', ['student_id'], unique=False)

    # Create wellbeing_data_access table
    op.create_table('wellbeing_data_access',
    sa.Column('id', sa.Integer(), nullable=False),
    sa.Column('institution_id', sa.Integer(), nullable=False),
    sa.Column('user_id', sa.Integer(), nullable=False),
    sa.Column('student_id', sa.Integer(), nullable=False),
    sa.Column('access_type', sa.String(length=50), nullable=False),
    sa.Column('resource_type', sa.String(length=50), nullable=False),
    sa.Column('resource_id', sa.Integer(), nullable=False),
    sa.Column('purpose', sa.String(length=255), nullable=False),
    sa.Column('ip_address', sa.String(length=45), nullable=True),
    sa.Column('user_agent', sa.String(length=500), nullable=True),
    sa.Column('accessed_at', sa.DateTime(), nullable=False, server_default=sa.text('now()')),
    sa.ForeignKeyConstraint(['institution_id'], ['institutions.id'], ondelete='CASCADE'),
    sa.ForeignKeyConstraint(['student_id'], ['students.id'], ondelete='CASCADE'),
    sa.ForeignKeyConstraint(['user_id'], ['users.id'], ondelete='CASCADE'),
    sa.PrimaryKeyConstraint('id')
    )
    op.create_index('idx_data_access_accessed', 'wellbeing_data_access', ['accessed_at'], unique=False)
    op.create_index('idx_data_access_institution', 'wellbeing_data_access', ['institution_id'], unique=False)
    op.create_index('idx_data_access_resource', 'wellbeing_data_access', ['resource_type', 'resource_id'], unique=False)
    op.create_index('idx_data_access_student', 'wellbeing_data_access', ['student_id'], unique=False)
    op.create_index('idx_data_access_user', 'wellbeing_data_access', ['user_id'], unique=False)


def downgrade() -> None:
    op.drop_index('idx_data_access_user', table_name='wellbeing_data_access')
    op.drop_index('idx_data_access_student', table_name='wellbeing_data_access')
    op.drop_index('idx_data_access_resource', table_name='wellbeing_data_access')
    op.drop_index('idx_data_access_institution', table_name='wellbeing_data_access')
    op.drop_index('idx_data_access_accessed', table_name='wellbeing_data_access')
    op.drop_table('wellbeing_data_access')
    
    op.drop_index('idx_intervention_student', table_name='wellbeing_interventions')
    op.drop_index('idx_intervention_scheduled', table_name='wellbeing_interventions')
    op.drop_index('idx_intervention_institution', table_name='wellbeing_interventions')
    op.drop_index('idx_intervention_counselor', table_name='wellbeing_interventions')
    op.drop_index('idx_intervention_alert', table_name='wellbeing_interventions')
    op.drop_table('wellbeing_interventions')
    
    op.drop_index('idx_alert_note_creator', table_name='alert_notes')
    op.drop_index('idx_alert_note_alert', table_name='alert_notes')
    op.drop_table('alert_notes')
    
    op.drop_index('idx_wellbeing_consent_student', table_name='wellbeing_consents')
    op.drop_index('idx_wellbeing_consent_status', table_name='wellbeing_consents')
    op.drop_index('idx_wellbeing_consent_parent', table_name='wellbeing_consents')
    op.drop_index('idx_wellbeing_consent_institution', table_name='wellbeing_consents')
    op.drop_index('idx_wellbeing_consent_expires', table_name='wellbeing_consents')
    op.drop_table('wellbeing_consents')
    
    op.drop_index('idx_behavioral_pattern_type', table_name='behavioral_patterns')
    op.drop_index('idx_behavioral_pattern_student', table_name='behavioral_patterns')
    op.drop_index('idx_behavioral_pattern_period', table_name='behavioral_patterns')
    op.drop_index('idx_behavioral_pattern_institution', table_name='behavioral_patterns')
    op.drop_index('idx_behavioral_pattern_concerning', table_name='behavioral_patterns')
    op.drop_index('idx_behavioral_pattern_change', table_name='behavioral_patterns')
    op.drop_table('behavioral_patterns')
    
    op.drop_index('idx_sentiment_student_created', table_name='sentiment_analyses')
    op.drop_index('idx_sentiment_student', table_name='sentiment_analyses')
    op.drop_index('idx_sentiment_source', table_name='sentiment_analyses')
    op.drop_index('idx_sentiment_score', table_name='sentiment_analyses')
    op.drop_index('idx_sentiment_institution', table_name='sentiment_analyses')
    op.drop_index('idx_sentiment_flagged', table_name='sentiment_analyses')
    op.drop_index('idx_sentiment_category', table_name='sentiment_analyses')
    op.drop_table('sentiment_analyses')
    
    op.drop_index('idx_wellbeing_alert_type', table_name='wellbeing_alerts')
    op.drop_index('idx_wellbeing_alert_student_status', table_name='wellbeing_alerts')
    op.drop_index('idx_wellbeing_alert_student', table_name='wellbeing_alerts')
    op.drop_index('idx_wellbeing_alert_status', table_name='wellbeing_alerts')
    op.drop_index('idx_wellbeing_alert_severity', table_name='wellbeing_alerts')
    op.drop_index('idx_wellbeing_alert_risk_score', table_name='wellbeing_alerts')
    op.drop_index('idx_wellbeing_alert_institution', table_name='wellbeing_alerts')
    op.drop_index('idx_wellbeing_alert_detected', table_name='wellbeing_alerts')
    op.drop_index('idx_wellbeing_alert_counselor', table_name='wellbeing_alerts')
    op.drop_table('wellbeing_alerts')
    
    op.drop_index('idx_wellbeing_profile_student', table_name='student_wellbeing_profiles')
    op.drop_index('idx_wellbeing_profile_risk_score', table_name='student_wellbeing_profiles')
    op.drop_index('idx_wellbeing_profile_risk_level', table_name='student_wellbeing_profiles')
    op.drop_index('idx_wellbeing_profile_next_review', table_name='student_wellbeing_profiles')
    op.drop_index('idx_wellbeing_profile_institution', table_name='student_wellbeing_profiles')
    op.drop_table('student_wellbeing_profiles')
    
    op.drop_index('idx_counselor_user', table_name='counselor_profiles')
    op.drop_index('idx_counselor_institution', table_name='counselor_profiles')
    op.drop_index('idx_counselor_crisis', table_name='counselor_profiles')
    op.drop_index('idx_counselor_active', table_name='counselor_profiles')
    op.drop_table('counselor_profiles')
