"""create institution management tables

Revision ID: 005
Revises: 004
Create Date: 2024-01-15 10:00:00.000000

"""
from alembic import op
import sqlalchemy as sa

revision = '005'
down_revision = '004'
branch_labels = None
depends_on = None


def upgrade():
    op.create_table('academic_years',
        sa.Column('id', sa.Integer(), nullable=False),
        sa.Column('institution_id', sa.Integer(), nullable=False),
        sa.Column('name', sa.String(length=100), nullable=False),
        sa.Column('start_date', sa.Date(), nullable=False),
        sa.Column('end_date', sa.Date(), nullable=False),
        sa.Column('is_active', sa.Boolean(), nullable=False, server_default='true'),
        sa.Column('is_current', sa.Boolean(), nullable=False, server_default='false'),
        sa.Column('description', sa.Text(), nullable=True),
        sa.Column('created_at', sa.DateTime(), nullable=False, server_default=sa.text('CURRENT_TIMESTAMP')),
        sa.Column('updated_at', sa.DateTime(), nullable=False, server_default=sa.text('CURRENT_TIMESTAMP')),
        sa.ForeignKeyConstraint(['institution_id'], ['institutions.id'], ondelete='CASCADE'),
        sa.PrimaryKeyConstraint('id'),
        sa.UniqueConstraint('institution_id', 'name', name='uq_institution_academic_year_name')
    )
    op.create_index('idx_academic_year_institution', 'academic_years', ['institution_id'])
    op.create_index('idx_academic_year_current', 'academic_years', ['is_current'])
    op.create_index('idx_academic_year_active', 'academic_years', ['is_active'])
    
    op.create_table('grades',
        sa.Column('id', sa.Integer(), nullable=False),
        sa.Column('institution_id', sa.Integer(), nullable=False),
        sa.Column('academic_year_id', sa.Integer(), nullable=False),
        sa.Column('name', sa.String(length=100), nullable=False),
        sa.Column('display_order', sa.Integer(), nullable=False, server_default='0'),
        sa.Column('description', sa.Text(), nullable=True),
        sa.Column('is_active', sa.Boolean(), nullable=False, server_default='true'),
        sa.Column('created_at', sa.DateTime(), nullable=False, server_default=sa.text('CURRENT_TIMESTAMP')),
        sa.Column('updated_at', sa.DateTime(), nullable=False, server_default=sa.text('CURRENT_TIMESTAMP')),
        sa.ForeignKeyConstraint(['institution_id'], ['institutions.id'], ondelete='CASCADE'),
        sa.ForeignKeyConstraint(['academic_year_id'], ['academic_years.id'], ondelete='CASCADE'),
        sa.PrimaryKeyConstraint('id'),
        sa.UniqueConstraint('institution_id', 'academic_year_id', 'name', name='uq_institution_year_grade_name')
    )
    op.create_index('idx_grade_institution', 'grades', ['institution_id'])
    op.create_index('idx_grade_academic_year', 'grades', ['academic_year_id'])
    op.create_index('idx_grade_active', 'grades', ['is_active'])
    
    op.create_table('sections',
        sa.Column('id', sa.Integer(), nullable=False),
        sa.Column('institution_id', sa.Integer(), nullable=False),
        sa.Column('grade_id', sa.Integer(), nullable=False),
        sa.Column('name', sa.String(length=100), nullable=False),
        sa.Column('capacity', sa.Integer(), nullable=True),
        sa.Column('description', sa.Text(), nullable=True),
        sa.Column('is_active', sa.Boolean(), nullable=False, server_default='true'),
        sa.Column('created_at', sa.DateTime(), nullable=False, server_default=sa.text('CURRENT_TIMESTAMP')),
        sa.Column('updated_at', sa.DateTime(), nullable=False, server_default=sa.text('CURRENT_TIMESTAMP')),
        sa.ForeignKeyConstraint(['institution_id'], ['institutions.id'], ondelete='CASCADE'),
        sa.ForeignKeyConstraint(['grade_id'], ['grades.id'], ondelete='CASCADE'),
        sa.PrimaryKeyConstraint('id'),
        sa.UniqueConstraint('grade_id', 'name', name='uq_grade_section_name')
    )
    op.create_index('idx_section_institution', 'sections', ['institution_id'])
    op.create_index('idx_section_grade', 'sections', ['grade_id'])
    op.create_index('idx_section_active', 'sections', ['is_active'])
    
    op.create_table('subjects',
        sa.Column('id', sa.Integer(), nullable=False),
        sa.Column('institution_id', sa.Integer(), nullable=False),
        sa.Column('name', sa.String(length=200), nullable=False),
        sa.Column('code', sa.String(length=50), nullable=True),
        sa.Column('description', sa.Text(), nullable=True),
        sa.Column('is_active', sa.Boolean(), nullable=False, server_default='true'),
        sa.Column('created_at', sa.DateTime(), nullable=False, server_default=sa.text('CURRENT_TIMESTAMP')),
        sa.Column('updated_at', sa.DateTime(), nullable=False, server_default=sa.text('CURRENT_TIMESTAMP')),
        sa.ForeignKeyConstraint(['institution_id'], ['institutions.id'], ondelete='CASCADE'),
        sa.PrimaryKeyConstraint('id'),
        sa.UniqueConstraint('institution_id', 'name', name='uq_institution_subject_name'),
        sa.UniqueConstraint('institution_id', 'code', name='uq_institution_subject_code')
    )
    op.create_index('idx_subject_institution', 'subjects', ['institution_id'])
    op.create_index('idx_subject_active', 'subjects', ['is_active'])
    
    op.create_table('grade_subjects',
        sa.Column('id', sa.Integer(), nullable=False),
        sa.Column('institution_id', sa.Integer(), nullable=False),
        sa.Column('grade_id', sa.Integer(), nullable=False),
        sa.Column('subject_id', sa.Integer(), nullable=False),
        sa.Column('is_compulsory', sa.Boolean(), nullable=False, server_default='true'),
        sa.Column('created_at', sa.DateTime(), nullable=False, server_default=sa.text('CURRENT_TIMESTAMP')),
        sa.ForeignKeyConstraint(['institution_id'], ['institutions.id'], ondelete='CASCADE'),
        sa.ForeignKeyConstraint(['grade_id'], ['grades.id'], ondelete='CASCADE'),
        sa.ForeignKeyConstraint(['subject_id'], ['subjects.id'], ondelete='CASCADE'),
        sa.PrimaryKeyConstraint('id'),
        sa.UniqueConstraint('grade_id', 'subject_id', name='uq_grade_subject')
    )
    op.create_index('idx_grade_subject_institution', 'grade_subjects', ['institution_id'])
    op.create_index('idx_grade_subject_grade', 'grade_subjects', ['grade_id'])
    op.create_index('idx_grade_subject_subject', 'grade_subjects', ['subject_id'])
    
    op.create_table('teachers',
        sa.Column('id', sa.Integer(), nullable=False),
        sa.Column('institution_id', sa.Integer(), nullable=False),
        sa.Column('user_id', sa.Integer(), nullable=True),
        sa.Column('employee_id', sa.String(length=50), nullable=True),
        sa.Column('first_name', sa.String(length=100), nullable=False),
        sa.Column('last_name', sa.String(length=100), nullable=False),
        sa.Column('email', sa.String(length=255), nullable=False),
        sa.Column('phone', sa.String(length=20), nullable=True),
        sa.Column('date_of_birth', sa.Date(), nullable=True),
        sa.Column('gender', sa.String(length=20), nullable=True),
        sa.Column('address', sa.Text(), nullable=True),
        sa.Column('qualification', sa.String(length=255), nullable=True),
        sa.Column('specialization', sa.String(length=255), nullable=True),
        sa.Column('joining_date', sa.Date(), nullable=True),
        sa.Column('is_active', sa.Boolean(), nullable=False, server_default='true'),
        sa.Column('created_at', sa.DateTime(), nullable=False, server_default=sa.text('CURRENT_TIMESTAMP')),
        sa.Column('updated_at', sa.DateTime(), nullable=False, server_default=sa.text('CURRENT_TIMESTAMP')),
        sa.ForeignKeyConstraint(['institution_id'], ['institutions.id'], ondelete='CASCADE'),
        sa.ForeignKeyConstraint(['user_id'], ['users.id'], ondelete='CASCADE'),
        sa.PrimaryKeyConstraint('id'),
        sa.UniqueConstraint('institution_id', 'email', name='uq_institution_teacher_email'),
        sa.UniqueConstraint('institution_id', 'employee_id', name='uq_institution_teacher_employee_id')
    )
    op.create_index('idx_teacher_institution', 'teachers', ['institution_id'])
    op.create_index('idx_teacher_user', 'teachers', ['user_id'])
    op.create_index('idx_teacher_active', 'teachers', ['is_active'])
    op.create_index('idx_teacher_email', 'teachers', ['email'])
    
    op.create_table('teacher_subjects',
        sa.Column('id', sa.Integer(), nullable=False),
        sa.Column('institution_id', sa.Integer(), nullable=False),
        sa.Column('teacher_id', sa.Integer(), nullable=False),
        sa.Column('subject_id', sa.Integer(), nullable=False),
        sa.Column('is_primary', sa.Boolean(), nullable=False, server_default='false'),
        sa.Column('created_at', sa.DateTime(), nullable=False, server_default=sa.text('CURRENT_TIMESTAMP')),
        sa.ForeignKeyConstraint(['institution_id'], ['institutions.id'], ondelete='CASCADE'),
        sa.ForeignKeyConstraint(['teacher_id'], ['teachers.id'], ondelete='CASCADE'),
        sa.ForeignKeyConstraint(['subject_id'], ['subjects.id'], ondelete='CASCADE'),
        sa.PrimaryKeyConstraint('id'),
        sa.UniqueConstraint('teacher_id', 'subject_id', name='uq_teacher_subject')
    )
    op.create_index('idx_teacher_subject_institution', 'teacher_subjects', ['institution_id'])
    op.create_index('idx_teacher_subject_teacher', 'teacher_subjects', ['teacher_id'])
    op.create_index('idx_teacher_subject_subject', 'teacher_subjects', ['subject_id'])
    
    op.create_table('students',
        sa.Column('id', sa.Integer(), nullable=False),
        sa.Column('institution_id', sa.Integer(), nullable=False),
        sa.Column('user_id', sa.Integer(), nullable=True),
        sa.Column('section_id', sa.Integer(), nullable=True),
        sa.Column('admission_number', sa.String(length=50), nullable=True),
        sa.Column('roll_number', sa.String(length=50), nullable=True),
        sa.Column('first_name', sa.String(length=100), nullable=False),
        sa.Column('last_name', sa.String(length=100), nullable=False),
        sa.Column('email', sa.String(length=255), nullable=True),
        sa.Column('phone', sa.String(length=20), nullable=True),
        sa.Column('date_of_birth', sa.Date(), nullable=True),
        sa.Column('gender', sa.String(length=20), nullable=True),
        sa.Column('blood_group', sa.String(length=10), nullable=True),
        sa.Column('address', sa.Text(), nullable=True),
        sa.Column('parent_name', sa.String(length=255), nullable=True),
        sa.Column('parent_email', sa.String(length=255), nullable=True),
        sa.Column('parent_phone', sa.String(length=20), nullable=True),
        sa.Column('admission_date', sa.Date(), nullable=True),
        sa.Column('is_active', sa.Boolean(), nullable=False, server_default='true'),
        sa.Column('created_at', sa.DateTime(), nullable=False, server_default=sa.text('CURRENT_TIMESTAMP')),
        sa.Column('updated_at', sa.DateTime(), nullable=False, server_default=sa.text('CURRENT_TIMESTAMP')),
        sa.ForeignKeyConstraint(['institution_id'], ['institutions.id'], ondelete='CASCADE'),
        sa.ForeignKeyConstraint(['user_id'], ['users.id'], ondelete='CASCADE'),
        sa.ForeignKeyConstraint(['section_id'], ['sections.id'], ondelete='SET NULL'),
        sa.PrimaryKeyConstraint('id'),
        sa.UniqueConstraint('institution_id', 'email', name='uq_institution_student_email'),
        sa.UniqueConstraint('institution_id', 'admission_number', name='uq_institution_student_admission_number')
    )
    op.create_index('idx_student_institution', 'students', ['institution_id'])
    op.create_index('idx_student_user', 'students', ['user_id'])
    op.create_index('idx_student_section', 'students', ['section_id'])
    op.create_index('idx_student_active', 'students', ['is_active'])
    op.create_index('idx_student_email', 'students', ['email'])


def downgrade():
    op.drop_index('idx_student_email', table_name='students')
    op.drop_index('idx_student_active', table_name='students')
    op.drop_index('idx_student_section', table_name='students')
    op.drop_index('idx_student_user', table_name='students')
    op.drop_index('idx_student_institution', table_name='students')
    op.drop_table('students')
    
    op.drop_index('idx_teacher_subject_subject', table_name='teacher_subjects')
    op.drop_index('idx_teacher_subject_teacher', table_name='teacher_subjects')
    op.drop_index('idx_teacher_subject_institution', table_name='teacher_subjects')
    op.drop_table('teacher_subjects')
    
    op.drop_index('idx_teacher_email', table_name='teachers')
    op.drop_index('idx_teacher_active', table_name='teachers')
    op.drop_index('idx_teacher_user', table_name='teachers')
    op.drop_index('idx_teacher_institution', table_name='teachers')
    op.drop_table('teachers')
    
    op.drop_index('idx_grade_subject_subject', table_name='grade_subjects')
    op.drop_index('idx_grade_subject_grade', table_name='grade_subjects')
    op.drop_index('idx_grade_subject_institution', table_name='grade_subjects')
    op.drop_table('grade_subjects')
    
    op.drop_index('idx_subject_active', table_name='subjects')
    op.drop_index('idx_subject_institution', table_name='subjects')
    op.drop_table('subjects')
    
    op.drop_index('idx_section_active', table_name='sections')
    op.drop_index('idx_section_grade', table_name='sections')
    op.drop_index('idx_section_institution', table_name='sections')
    op.drop_table('sections')
    
    op.drop_index('idx_grade_active', table_name='grades')
    op.drop_index('idx_grade_academic_year', table_name='grades')
    op.drop_index('idx_grade_institution', table_name='grades')
    op.drop_table('grades')
    
    op.drop_index('idx_academic_year_active', table_name='academic_years')
    op.drop_index('idx_academic_year_current', table_name='academic_years')
    op.drop_index('idx_academic_year_institution', table_name='academic_years')
    op.drop_table('academic_years')
