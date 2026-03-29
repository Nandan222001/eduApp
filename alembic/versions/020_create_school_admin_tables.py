"""create school admin tables

Revision ID: 020
Revises: 019
Create Date: 2024-01-20 00:00:00.000000

"""
from collections.abc import Sequence

import sqlalchemy as sa
from sqlalchemy.dialects import mysql

from alembic import op

revision: str = '020'
down_revision: str | None = '019'
branch_labels: str | Sequence[str] | None = None
depends_on: str | Sequence[str] | None = None


def upgrade() -> None:
    # Create certificate_templates table
    op.create_table(
        'certificate_templates',
        sa.Column('id', sa.Integer(), nullable=False),
        sa.Column('institution_id', sa.Integer(), nullable=False),
        sa.Column('template_name', sa.String(length=200), nullable=False),
        sa.Column('certificate_type', sa.String(length=50), nullable=False),
        sa.Column('template_config', mysql.JSON(), nullable=False),
        sa.Column('is_default', sa.Boolean(), nullable=False, server_default=sa.text('0')),
        sa.Column('is_active', sa.Boolean(), nullable=False, server_default=sa.text('1')),
        sa.Column('created_at', sa.DateTime(), nullable=False, server_default=sa.text('CURRENT_TIMESTAMP')),
        sa.Column('updated_at', sa.DateTime(), nullable=False, server_default=sa.text('CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP')),
        sa.ForeignKeyConstraint(['institution_id'], ['institutions.id'], ondelete='CASCADE'),
        sa.PrimaryKeyConstraint('id')
    )

    op.create_index('idx_certificate_template_institution', 'certificate_templates', ['institution_id'])
    op.create_index('idx_certificate_template_type', 'certificate_templates', ['certificate_type'])
    op.create_index('idx_certificate_template_active', 'certificate_templates', ['is_active'])

    # Create issued_certificates table
    op.create_table(
        'issued_certificates',
        sa.Column('id', sa.Integer(), nullable=False),
        sa.Column('institution_id', sa.Integer(), nullable=False),
        sa.Column('student_id', sa.Integer(), nullable=False),
        sa.Column('certificate_type', sa.String(length=50), nullable=False),
        sa.Column('template_id', sa.Integer(), nullable=True),
        sa.Column('serial_number', sa.String(length=100), nullable=False),
        sa.Column('issue_date', sa.Date(), nullable=False),
        sa.Column('data_snapshot', mysql.JSON(), nullable=False),
        sa.Column('pdf_url', sa.String(length=500), nullable=True),
        sa.Column('issued_by', sa.Integer(), nullable=True),
        sa.Column('remarks', sa.Text(), nullable=True),
        sa.Column('status', sa.String(length=20), nullable=False, server_default='draft'),
        sa.Column('created_at', sa.DateTime(), nullable=False, server_default=sa.text('CURRENT_TIMESTAMP')),
        sa.Column('updated_at', sa.DateTime(), nullable=False, server_default=sa.text('CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP')),
        sa.ForeignKeyConstraint(['institution_id'], ['institutions.id'], ondelete='CASCADE'),
        sa.ForeignKeyConstraint(['student_id'], ['students.id'], ondelete='CASCADE'),
        sa.ForeignKeyConstraint(['template_id'], ['certificate_templates.id'], ondelete='SET NULL'),
        sa.ForeignKeyConstraint(['issued_by'], ['users.id'], ondelete='SET NULL'),
        sa.PrimaryKeyConstraint('id'),
        sa.UniqueConstraint('serial_number', name='uq_certificate_serial_number')
    )

    op.create_index('idx_issued_certificate_institution', 'issued_certificates', ['institution_id'])
    op.create_index('idx_issued_certificate_student', 'issued_certificates', ['student_id'])
    op.create_index('idx_issued_certificate_type', 'issued_certificates', ['certificate_type'])
    op.create_index('idx_issued_certificate_template', 'issued_certificates', ['template_id'])
    op.create_index('idx_issued_certificate_serial', 'issued_certificates', ['serial_number'])
    op.create_index('idx_issued_certificate_issue_date', 'issued_certificates', ['issue_date'])
    op.create_index('idx_issued_certificate_status', 'issued_certificates', ['status'])
    op.create_index('idx_issued_certificate_issued_by', 'issued_certificates', ['issued_by'])

    # Create id_card_templates table
    op.create_table(
        'id_card_templates',
        sa.Column('id', sa.Integer(), nullable=False),
        sa.Column('institution_id', sa.Integer(), nullable=False),
        sa.Column('template_name', sa.String(length=200), nullable=False),
        sa.Column('layout_config', mysql.JSON(), nullable=False),
        sa.Column('color_scheme', sa.String(length=100), nullable=True),
        sa.Column('logo_position', sa.String(length=50), nullable=True),
        sa.Column('fields_to_show', mysql.JSON(), nullable=True),
        sa.Column('orientation', sa.String(length=20), nullable=False, server_default='portrait'),
        sa.Column('is_default', sa.Boolean(), nullable=False, server_default=sa.text('0')),
        sa.Column('created_at', sa.DateTime(), nullable=False, server_default=sa.text('CURRENT_TIMESTAMP')),
        sa.Column('updated_at', sa.DateTime(), nullable=False, server_default=sa.text('CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP')),
        sa.ForeignKeyConstraint(['institution_id'], ['institutions.id'], ondelete='CASCADE'),
        sa.PrimaryKeyConstraint('id')
    )

    op.create_index('idx_id_card_template_institution', 'id_card_templates', ['institution_id'])
    op.create_index('idx_id_card_template_orientation', 'id_card_templates', ['orientation'])

    # Create staff_members table
    op.create_table(
        'staff_members',
        sa.Column('id', sa.Integer(), nullable=False),
        sa.Column('institution_id', sa.Integer(), nullable=False),
        sa.Column('employee_id', sa.String(length=50), nullable=False),
        sa.Column('first_name', sa.String(length=100), nullable=False),
        sa.Column('last_name', sa.String(length=100), nullable=False),
        sa.Column('email', sa.String(length=255), nullable=True),
        sa.Column('phone', sa.String(length=20), nullable=True),
        sa.Column('designation', sa.String(length=200), nullable=True),
        sa.Column('department', sa.String(length=50), nullable=False),
        sa.Column('date_of_birth', sa.Date(), nullable=True),
        sa.Column('gender', sa.String(length=20), nullable=True),
        sa.Column('address', sa.Text(), nullable=True),
        sa.Column('qualification', sa.String(length=255), nullable=True),
        sa.Column('joining_date', sa.Date(), nullable=True),
        sa.Column('leaving_date', sa.Date(), nullable=True),
        sa.Column('bank_account_number', sa.String(length=50), nullable=True),
        sa.Column('bank_name', sa.String(length=200), nullable=True),
        sa.Column('ifsc_code', sa.String(length=20), nullable=True),
        sa.Column('pan_number', sa.String(length=20), nullable=True),
        sa.Column('aadhar_number', sa.String(length=20), nullable=True),
        sa.Column('basic_salary', sa.Numeric(precision=10, scale=2), nullable=True),
        sa.Column('photo_url', sa.String(length=500), nullable=True),
        sa.Column('is_active', sa.Boolean(), nullable=False, server_default=sa.text('1')),
        sa.Column('status', sa.String(length=20), nullable=False, server_default='active'),
        sa.Column('created_at', sa.DateTime(), nullable=False, server_default=sa.text('CURRENT_TIMESTAMP')),
        sa.Column('updated_at', sa.DateTime(), nullable=False, server_default=sa.text('CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP')),
        sa.ForeignKeyConstraint(['institution_id'], ['institutions.id'], ondelete='CASCADE'),
        sa.PrimaryKeyConstraint('id'),
        sa.UniqueConstraint('institution_id', 'employee_id', name='uq_institution_employee_id')
    )

    op.create_index('idx_staff_institution', 'staff_members', ['institution_id'])
    op.create_index('idx_staff_employee_id', 'staff_members', ['employee_id'])
    op.create_index('idx_staff_email', 'staff_members', ['email'])
    op.create_index('idx_staff_department', 'staff_members', ['department'])
    op.create_index('idx_staff_joining_date', 'staff_members', ['joining_date'])
    op.create_index('idx_staff_leaving_date', 'staff_members', ['leaving_date'])
    op.create_index('idx_staff_active', 'staff_members', ['is_active'])
    op.create_index('idx_staff_status', 'staff_members', ['status'])

    # Create staff_payrolls table
    op.create_table(
        'staff_payrolls',
        sa.Column('id', sa.Integer(), nullable=False),
        sa.Column('institution_id', sa.Integer(), nullable=False),
        sa.Column('staff_id', sa.Integer(), nullable=False),
        sa.Column('month', sa.Integer(), nullable=False),
        sa.Column('year', sa.Integer(), nullable=False),
        sa.Column('basic_salary', sa.Numeric(precision=10, scale=2), nullable=False),
        sa.Column('hra', sa.Numeric(precision=10, scale=2), nullable=False, server_default='0'),
        sa.Column('da', sa.Numeric(precision=10, scale=2), nullable=False, server_default='0'),
        sa.Column('ta', sa.Numeric(precision=10, scale=2), nullable=False, server_default='0'),
        sa.Column('special_allowance', sa.Numeric(precision=10, scale=2), nullable=False, server_default='0'),
        sa.Column('pf_deduction', sa.Numeric(precision=10, scale=2), nullable=False, server_default='0'),
        sa.Column('esi_deduction', sa.Numeric(precision=10, scale=2), nullable=False, server_default='0'),
        sa.Column('professional_tax', sa.Numeric(precision=10, scale=2), nullable=False, server_default='0'),
        sa.Column('tds', sa.Numeric(precision=10, scale=2), nullable=False, server_default='0'),
        sa.Column('other_deductions', sa.Numeric(precision=10, scale=2), nullable=False, server_default='0'),
        sa.Column('gross_salary', sa.Numeric(precision=10, scale=2), nullable=False),
        sa.Column('net_salary', sa.Numeric(precision=10, scale=2), nullable=False),
        sa.Column('payment_status', sa.String(length=20), nullable=False, server_default='pending'),
        sa.Column('payment_date', sa.Date(), nullable=True),
        sa.Column('transaction_reference', sa.String(length=255), nullable=True),
        sa.Column('created_at', sa.DateTime(), nullable=False, server_default=sa.text('CURRENT_TIMESTAMP')),
        sa.Column('updated_at', sa.DateTime(), nullable=False, server_default=sa.text('CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP')),
        sa.ForeignKeyConstraint(['institution_id'], ['institutions.id'], ondelete='CASCADE'),
        sa.ForeignKeyConstraint(['staff_id'], ['staff_members.id'], ondelete='CASCADE'),
        sa.PrimaryKeyConstraint('id'),
        sa.UniqueConstraint('staff_id', 'month', 'year', name='uq_staff_month_year')
    )

    op.create_index('idx_payroll_institution', 'staff_payrolls', ['institution_id'])
    op.create_index('idx_payroll_staff', 'staff_payrolls', ['staff_id'])
    op.create_index('idx_payroll_month_year', 'staff_payrolls', ['month', 'year'])
    op.create_index('idx_payroll_payment_status', 'staff_payrolls', ['payment_status'])
    op.create_index('idx_payroll_payment_date', 'staff_payrolls', ['payment_date'])

    # Create sms_templates table
    op.create_table(
        'sms_templates',
        sa.Column('id', sa.Integer(), nullable=False),
        sa.Column('institution_id', sa.Integer(), nullable=False),
        sa.Column('template_name', sa.String(length=200), nullable=False),
        sa.Column('template_type', sa.String(length=50), nullable=False),
        sa.Column('message_body', sa.Text(), nullable=False),
        sa.Column('is_active', sa.Boolean(), nullable=False, server_default=sa.text('1')),
        sa.Column('created_at', sa.DateTime(), nullable=False, server_default=sa.text('CURRENT_TIMESTAMP')),
        sa.Column('updated_at', sa.DateTime(), nullable=False, server_default=sa.text('CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP')),
        sa.ForeignKeyConstraint(['institution_id'], ['institutions.id'], ondelete='CASCADE'),
        sa.PrimaryKeyConstraint('id')
    )

    op.create_index('idx_sms_template_institution', 'sms_templates', ['institution_id'])
    op.create_index('idx_sms_template_type', 'sms_templates', ['template_type'])
    op.create_index('idx_sms_template_active', 'sms_templates', ['is_active'])

    # Create enquiry_records table
    op.create_table(
        'enquiry_records',
        sa.Column('id', sa.Integer(), nullable=False),
        sa.Column('institution_id', sa.Integer(), nullable=False),
        sa.Column('enquiry_date', sa.Date(), nullable=False),
        sa.Column('student_name', sa.String(length=200), nullable=False),
        sa.Column('parent_name', sa.String(length=200), nullable=False),
        sa.Column('parent_phone', sa.String(length=20), nullable=False),
        sa.Column('parent_email', sa.String(length=255), nullable=True),
        sa.Column('enquiry_for_grade', sa.String(length=50), nullable=True),
        sa.Column('source', sa.String(length=50), nullable=False),
        sa.Column('status', sa.String(length=20), nullable=False, server_default='new'),
        sa.Column('notes', sa.Text(), nullable=True),
        sa.Column('assigned_to', sa.Integer(), nullable=True),
        sa.Column('sms_sent_count', sa.Integer(), nullable=False, server_default='0'),
        sa.Column('last_sms_sent_at', sa.DateTime(), nullable=True),
        sa.Column('follow_up_date', sa.Date(), nullable=True),
        sa.Column('created_at', sa.DateTime(), nullable=False, server_default=sa.text('CURRENT_TIMESTAMP')),
        sa.Column('updated_at', sa.DateTime(), nullable=False, server_default=sa.text('CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP')),
        sa.ForeignKeyConstraint(['institution_id'], ['institutions.id'], ondelete='CASCADE'),
        sa.ForeignKeyConstraint(['assigned_to'], ['staff_members.id'], ondelete='SET NULL'),
        sa.PrimaryKeyConstraint('id')
    )

    op.create_index('idx_enquiry_institution', 'enquiry_records', ['institution_id'])
    op.create_index('idx_enquiry_date', 'enquiry_records', ['enquiry_date'])
    op.create_index('idx_enquiry_phone', 'enquiry_records', ['parent_phone'])
    op.create_index('idx_enquiry_source', 'enquiry_records', ['source'])
    op.create_index('idx_enquiry_status', 'enquiry_records', ['status'])
    op.create_index('idx_enquiry_assigned_to', 'enquiry_records', ['assigned_to'])
    op.create_index('idx_enquiry_follow_up_date', 'enquiry_records', ['follow_up_date'])


def downgrade() -> None:
    op.drop_table('enquiry_records')
    op.drop_table('sms_templates')
    op.drop_table('staff_payrolls')
    op.drop_table('staff_members')
    op.drop_table('id_card_templates')
    op.drop_table('issued_certificates')
    op.drop_table('certificate_templates')
