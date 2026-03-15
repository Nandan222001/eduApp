"""create community service tables

Revision ID: community_service_001
Revises: 027_create_carpool_tables
Create Date: 2024-01-15 00:00:00.000000

"""
from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql

# revision identifiers, used by Alembic.
revision = 'community_service_001'
down_revision = '027_create_carpool_tables'
branch_labels = None
depends_on = None


def upgrade():
    # Create service activity type enum
    service_activity_type_enum = postgresql.ENUM(
        'volunteer', 'fundraising', 'environmental', 
        'tutoring', 'healthcare', 'animal_welfare',
        name='serviceactivitytype'
    )
    service_activity_type_enum.create(op.get_bind())
    
    # Create verification status enum (check if it exists from volunteer_hours)
    # If it already exists, we'll use the existing one
    conn = op.get_bind()
    result = conn.execute(
        "SELECT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'verificationstatus')"
    ).scalar()
    
    if not result:
        verification_status_enum = postgresql.ENUM(
            'pending', 'verified', 'rejected',
            name='verificationstatus'
        )
        verification_status_enum.create(op.get_bind())
    
    # Create service_activities table
    op.create_table(
        'service_activities',
        sa.Column('id', sa.Integer(), nullable=False),
        sa.Column('institution_id', sa.Integer(), nullable=False),
        sa.Column('student_id', sa.Integer(), nullable=False),
        sa.Column('activity_name', sa.String(length=255), nullable=False),
        sa.Column('organization_name', sa.String(length=255), nullable=False),
        sa.Column('contact_person', sa.String(length=255), nullable=False),
        sa.Column('contact_email', sa.String(length=255), nullable=False),
        sa.Column('contact_phone', sa.String(length=20), nullable=True),
        sa.Column('activity_type', service_activity_type_enum, nullable=False),
        sa.Column('date', sa.Date(), nullable=False),
        sa.Column('hours_logged', sa.Numeric(precision=6, scale=2), nullable=False),
        sa.Column('description', sa.Text(), nullable=True),
        sa.Column('impact_statement', sa.Text(), nullable=True),
        sa.Column('reflection_essay', sa.Text(), nullable=True),
        sa.Column('verification_status', postgresql.ENUM('pending', 'verified', 'rejected', name='verificationstatus'), nullable=False),
        sa.Column('verifier_signature_url', sa.String(length=500), nullable=True),
        sa.Column('verification_date', sa.Date(), nullable=True),
        sa.Column('verification_token', sa.String(length=255), nullable=True),
        sa.Column('verification_token_expires', sa.DateTime(), nullable=True),
        sa.Column('attachments', postgresql.JSON(astext_type=sa.Text()), nullable=True),
        sa.Column('metadata', postgresql.JSON(astext_type=sa.Text()), nullable=True),
        sa.Column('created_at', sa.DateTime(), nullable=False),
        sa.Column('updated_at', sa.DateTime(), nullable=False),
        sa.ForeignKeyConstraint(['institution_id'], ['institutions.id'], ondelete='CASCADE'),
        sa.ForeignKeyConstraint(['student_id'], ['students.id'], ondelete='CASCADE'),
        sa.PrimaryKeyConstraint('id')
    )
    op.create_index('idx_service_activity_institution', 'service_activities', ['institution_id'])
    op.create_index('idx_service_activity_student', 'service_activities', ['student_id'])
    op.create_index('idx_service_activity_organization', 'service_activities', ['organization_name'])
    op.create_index('idx_service_activity_type', 'service_activities', ['activity_type'])
    op.create_index('idx_service_activity_date', 'service_activities', ['date'])
    op.create_index('idx_service_activity_status', 'service_activities', ['verification_status'])
    op.create_index('idx_service_activity_contact_email', 'service_activities', ['contact_email'])
    op.create_index('idx_service_activity_token', 'service_activities', ['verification_token'], unique=True)
    
    # Create organization_contacts table
    op.create_table(
        'organization_contacts',
        sa.Column('id', sa.Integer(), nullable=False),
        sa.Column('institution_id', sa.Integer(), nullable=False),
        sa.Column('organization_name', sa.String(length=255), nullable=False),
        sa.Column('contact_person', sa.String(length=255), nullable=False),
        sa.Column('contact_email', sa.String(length=255), nullable=False),
        sa.Column('contact_phone', sa.String(length=20), nullable=True),
        sa.Column('organization_address', sa.Text(), nullable=True),
        sa.Column('organization_website', sa.String(length=500), nullable=True),
        sa.Column('organization_type', sa.String(length=100), nullable=True),
        sa.Column('is_verified', sa.Boolean(), nullable=False, server_default='false'),
        sa.Column('is_active', sa.Boolean(), nullable=False, server_default='true'),
        sa.Column('notes', sa.Text(), nullable=True),
        sa.Column('metadata', postgresql.JSON(astext_type=sa.Text()), nullable=True),
        sa.Column('created_at', sa.DateTime(), nullable=False),
        sa.Column('updated_at', sa.DateTime(), nullable=False),
        sa.ForeignKeyConstraint(['institution_id'], ['institutions.id'], ondelete='CASCADE'),
        sa.PrimaryKeyConstraint('id'),
        sa.UniqueConstraint('institution_id', 'organization_name', 'contact_email', name='uq_institution_org_contact')
    )
    op.create_index('idx_org_contact_institution', 'organization_contacts', ['institution_id'])
    op.create_index('idx_org_contact_organization', 'organization_contacts', ['organization_name'])
    op.create_index('idx_org_contact_email', 'organization_contacts', ['contact_email'])
    op.create_index('idx_org_contact_verified', 'organization_contacts', ['is_verified'])
    op.create_index('idx_org_contact_active', 'organization_contacts', ['is_active'])
    
    # Create service_portfolios table
    op.create_table(
        'service_portfolios',
        sa.Column('id', sa.Integer(), nullable=False),
        sa.Column('institution_id', sa.Integer(), nullable=False),
        sa.Column('student_id', sa.Integer(), nullable=False),
        sa.Column('total_hours', sa.Numeric(precision=8, scale=2), nullable=False, server_default='0'),
        sa.Column('verified_hours', sa.Numeric(precision=8, scale=2), nullable=False, server_default='0'),
        sa.Column('pending_hours', sa.Numeric(precision=8, scale=2), nullable=False, server_default='0'),
        sa.Column('rejected_hours', sa.Numeric(precision=8, scale=2), nullable=False, server_default='0'),
        sa.Column('volunteer_hours', sa.Numeric(precision=8, scale=2), nullable=False, server_default='0'),
        sa.Column('fundraising_hours', sa.Numeric(precision=8, scale=2), nullable=False, server_default='0'),
        sa.Column('environmental_hours', sa.Numeric(precision=8, scale=2), nullable=False, server_default='0'),
        sa.Column('tutoring_hours', sa.Numeric(precision=8, scale=2), nullable=False, server_default='0'),
        sa.Column('healthcare_hours', sa.Numeric(precision=8, scale=2), nullable=False, server_default='0'),
        sa.Column('animal_welfare_hours', sa.Numeric(precision=8, scale=2), nullable=False, server_default='0'),
        sa.Column('total_activities', sa.Integer(), nullable=False, server_default='0'),
        sa.Column('organizations_count', sa.Integer(), nullable=False, server_default='0'),
        sa.Column('last_activity_date', sa.Date(), nullable=True),
        sa.Column('created_at', sa.DateTime(), nullable=False),
        sa.Column('updated_at', sa.DateTime(), nullable=False),
        sa.ForeignKeyConstraint(['institution_id'], ['institutions.id'], ondelete='CASCADE'),
        sa.ForeignKeyConstraint(['student_id'], ['students.id'], ondelete='CASCADE'),
        sa.PrimaryKeyConstraint('id'),
        sa.UniqueConstraint('institution_id', 'student_id', name='uq_institution_student_portfolio')
    )
    op.create_index('idx_service_portfolio_institution', 'service_portfolios', ['institution_id'])
    op.create_index('idx_service_portfolio_student', 'service_portfolios', ['student_id'])
    op.create_index('idx_service_portfolio_verified_hours', 'service_portfolios', ['verified_hours'])
    
    # Create graduation_requirements table
    op.create_table(
        'graduation_requirements',
        sa.Column('id', sa.Integer(), nullable=False),
        sa.Column('institution_id', sa.Integer(), nullable=False),
        sa.Column('grade_id', sa.Integer(), nullable=True),
        sa.Column('requirement_name', sa.String(length=255), nullable=False),
        sa.Column('required_hours', sa.Numeric(precision=8, scale=2), nullable=False),
        sa.Column('activity_type', service_activity_type_enum, nullable=True),
        sa.Column('is_mandatory', sa.Boolean(), nullable=False, server_default='true'),
        sa.Column('description', sa.Text(), nullable=True),
        sa.Column('academic_year_id', sa.Integer(), nullable=True),
        sa.Column('is_active', sa.Boolean(), nullable=False, server_default='true'),
        sa.Column('metadata', postgresql.JSON(astext_type=sa.Text()), nullable=True),
        sa.Column('created_at', sa.DateTime(), nullable=False),
        sa.Column('updated_at', sa.DateTime(), nullable=False),
        sa.ForeignKeyConstraint(['institution_id'], ['institutions.id'], ondelete='CASCADE'),
        sa.ForeignKeyConstraint(['grade_id'], ['grades.id'], ondelete='CASCADE'),
        sa.ForeignKeyConstraint(['academic_year_id'], ['academic_years.id'], ondelete='CASCADE'),
        sa.PrimaryKeyConstraint('id')
    )
    op.create_index('idx_graduation_req_institution', 'graduation_requirements', ['institution_id'])
    op.create_index('idx_graduation_req_grade', 'graduation_requirements', ['grade_id'])
    op.create_index('idx_graduation_req_activity_type', 'graduation_requirements', ['activity_type'])
    op.create_index('idx_graduation_req_academic_year', 'graduation_requirements', ['academic_year_id'])
    op.create_index('idx_graduation_req_active', 'graduation_requirements', ['is_active'])
    
    # Create student_graduation_progress table
    op.create_table(
        'student_graduation_progress',
        sa.Column('id', sa.Integer(), nullable=False),
        sa.Column('institution_id', sa.Integer(), nullable=False),
        sa.Column('student_id', sa.Integer(), nullable=False),
        sa.Column('requirement_id', sa.Integer(), nullable=False),
        sa.Column('hours_completed', sa.Numeric(precision=8, scale=2), nullable=False, server_default='0'),
        sa.Column('hours_required', sa.Numeric(precision=8, scale=2), nullable=False),
        sa.Column('is_completed', sa.Boolean(), nullable=False, server_default='false'),
        sa.Column('completion_date', sa.Date(), nullable=True),
        sa.Column('percentage_complete', sa.Numeric(precision=5, scale=2), nullable=False, server_default='0'),
        sa.Column('created_at', sa.DateTime(), nullable=False),
        sa.Column('updated_at', sa.DateTime(), nullable=False),
        sa.ForeignKeyConstraint(['institution_id'], ['institutions.id'], ondelete='CASCADE'),
        sa.ForeignKeyConstraint(['student_id'], ['students.id'], ondelete='CASCADE'),
        sa.ForeignKeyConstraint(['requirement_id'], ['graduation_requirements.id'], ondelete='CASCADE'),
        sa.PrimaryKeyConstraint('id'),
        sa.UniqueConstraint('student_id', 'requirement_id', name='uq_student_requirement_progress')
    )
    op.create_index('idx_student_grad_progress_institution', 'student_graduation_progress', ['institution_id'])
    op.create_index('idx_student_grad_progress_student', 'student_graduation_progress', ['student_id'])
    op.create_index('idx_student_grad_progress_requirement', 'student_graduation_progress', ['requirement_id'])
    op.create_index('idx_student_grad_progress_completed', 'student_graduation_progress', ['is_completed'])
    
    # Create service_certificates table
    op.create_table(
        'service_certificates',
        sa.Column('id', sa.Integer(), nullable=False),
        sa.Column('institution_id', sa.Integer(), nullable=False),
        sa.Column('student_id', sa.Integer(), nullable=False),
        sa.Column('certificate_number', sa.String(length=100), nullable=False),
        sa.Column('certificate_type', sa.String(length=50), nullable=False),
        sa.Column('total_hours', sa.Numeric(precision=8, scale=2), nullable=False),
        sa.Column('issue_date', sa.Date(), nullable=False),
        sa.Column('academic_year_id', sa.Integer(), nullable=True),
        sa.Column('certificate_url', sa.String(length=500), nullable=True),
        sa.Column('pdf_path', sa.String(length=500), nullable=True),
        sa.Column('signed_by', sa.Integer(), nullable=True),
        sa.Column('purpose', sa.String(length=100), nullable=True),
        sa.Column('notes', sa.Text(), nullable=True),
        sa.Column('metadata', postgresql.JSON(astext_type=sa.Text()), nullable=True),
        sa.Column('created_at', sa.DateTime(), nullable=False),
        sa.Column('updated_at', sa.DateTime(), nullable=False),
        sa.ForeignKeyConstraint(['institution_id'], ['institutions.id'], ondelete='CASCADE'),
        sa.ForeignKeyConstraint(['student_id'], ['students.id'], ondelete='CASCADE'),
        sa.ForeignKeyConstraint(['academic_year_id'], ['academic_years.id'], ondelete='SET NULL'),
        sa.ForeignKeyConstraint(['signed_by'], ['teachers.id'], ondelete='SET NULL'),
        sa.PrimaryKeyConstraint('id')
    )
    op.create_index('idx_service_cert_institution', 'service_certificates', ['institution_id'])
    op.create_index('idx_service_cert_student', 'service_certificates', ['student_id'])
    op.create_index('idx_service_cert_number', 'service_certificates', ['certificate_number'], unique=True)
    op.create_index('idx_service_cert_issue_date', 'service_certificates', ['issue_date'])
    op.create_index('idx_service_cert_academic_year', 'service_certificates', ['academic_year_id'])
    op.create_index('idx_service_cert_signed_by', 'service_certificates', ['signed_by'])


def downgrade():
    # Drop tables in reverse order
    op.drop_index('idx_service_cert_signed_by', 'service_certificates')
    op.drop_index('idx_service_cert_academic_year', 'service_certificates')
    op.drop_index('idx_service_cert_issue_date', 'service_certificates')
    op.drop_index('idx_service_cert_number', 'service_certificates')
    op.drop_index('idx_service_cert_student', 'service_certificates')
    op.drop_index('idx_service_cert_institution', 'service_certificates')
    op.drop_table('service_certificates')
    
    op.drop_index('idx_student_grad_progress_completed', 'student_graduation_progress')
    op.drop_index('idx_student_grad_progress_requirement', 'student_graduation_progress')
    op.drop_index('idx_student_grad_progress_student', 'student_graduation_progress')
    op.drop_index('idx_student_grad_progress_institution', 'student_graduation_progress')
    op.drop_table('student_graduation_progress')
    
    op.drop_index('idx_graduation_req_active', 'graduation_requirements')
    op.drop_index('idx_graduation_req_academic_year', 'graduation_requirements')
    op.drop_index('idx_graduation_req_activity_type', 'graduation_requirements')
    op.drop_index('idx_graduation_req_grade', 'graduation_requirements')
    op.drop_index('idx_graduation_req_institution', 'graduation_requirements')
    op.drop_table('graduation_requirements')
    
    op.drop_index('idx_service_portfolio_verified_hours', 'service_portfolios')
    op.drop_index('idx_service_portfolio_student', 'service_portfolios')
    op.drop_index('idx_service_portfolio_institution', 'service_portfolios')
    op.drop_table('service_portfolios')
    
    op.drop_index('idx_org_contact_active', 'organization_contacts')
    op.drop_index('idx_org_contact_verified', 'organization_contacts')
    op.drop_index('idx_org_contact_email', 'organization_contacts')
    op.drop_index('idx_org_contact_organization', 'organization_contacts')
    op.drop_index('idx_org_contact_institution', 'organization_contacts')
    op.drop_table('organization_contacts')
    
    op.drop_index('idx_service_activity_token', 'service_activities')
    op.drop_index('idx_service_activity_contact_email', 'service_activities')
    op.drop_index('idx_service_activity_status', 'service_activities')
    op.drop_index('idx_service_activity_date', 'service_activities')
    op.drop_index('idx_service_activity_type', 'service_activities')
    op.drop_index('idx_service_activity_organization', 'service_activities')
    op.drop_index('idx_service_activity_student', 'service_activities')
    op.drop_index('idx_service_activity_institution', 'service_activities')
    op.drop_table('service_activities')
    
    # Drop enum
    service_activity_type_enum = postgresql.ENUM(
        'volunteer', 'fundraising', 'environmental', 
        'tutoring', 'healthcare', 'animal_welfare',
        name='serviceactivitytype'
    )
    service_activity_type_enum.drop(op.get_bind())
