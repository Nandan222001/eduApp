"""Add assignment and submission tables

Revision ID: <revision_id>
Revises: <previous_revision>
Create Date: <date>

This is a template for the Alembic migration. 
Run: alembic revision --autogenerate -m "Add assignment and submission tables"

The migration will create the following tables:
1. assignments - Main assignment table
2. assignment_files - Assignment attachment files
3. submissions - Student submissions
4. submission_files - Submission attachment files

Key Indexes:
- institution_id, teacher_id, grade_id, section_id, subject_id on assignments
- assignment_id, student_id on submissions
- status fields on both tables
- due_date, submitted_at for date-based queries

Constraints:
- Foreign keys to institutions, teachers, grades, sections, subjects, chapters, students
- Unique constraint on (assignment_id, student_id) for submissions
- Cascade deletes for file relationships
"""

from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql

def upgrade():
    # Create assignment_status enum
    op.execute("CREATE TYPE assignmentstatus AS ENUM ('draft', 'published', 'closed', 'archived')")
    
    # Create submission_status enum
    op.execute("CREATE TYPE submissionstatus AS ENUM ('not_submitted', 'submitted', 'late_submitted', 'graded', 'returned')")
    
    # Create assignments table
    op.create_table(
        'assignments',
        sa.Column('id', sa.Integer(), nullable=False),
        sa.Column('institution_id', sa.Integer(), nullable=False),
        sa.Column('teacher_id', sa.Integer(), nullable=False),
        sa.Column('grade_id', sa.Integer(), nullable=False),
        sa.Column('section_id', sa.Integer(), nullable=True),
        sa.Column('subject_id', sa.Integer(), nullable=False),
        sa.Column('chapter_id', sa.Integer(), nullable=True),
        sa.Column('title', sa.String(length=255), nullable=False),
        sa.Column('description', sa.Text(), nullable=True),
        sa.Column('content', sa.Text(), nullable=True),
        sa.Column('instructions', sa.Text(), nullable=True),
        sa.Column('due_date', sa.DateTime(), nullable=True),
        sa.Column('publish_date', sa.DateTime(), nullable=True),
        sa.Column('close_date', sa.DateTime(), nullable=True),
        sa.Column('max_marks', sa.Numeric(precision=10, scale=2), nullable=False),
        sa.Column('passing_marks', sa.Numeric(precision=10, scale=2), nullable=True),
        sa.Column('allow_late_submission', sa.Boolean(), nullable=False),
        sa.Column('late_penalty_percentage', sa.Float(), nullable=True),
        sa.Column('max_file_size_mb', sa.Integer(), nullable=False),
        sa.Column('allowed_file_types', sa.String(length=255), nullable=True),
        sa.Column('status', postgresql.ENUM('draft', 'published', 'closed', 'archived', name='assignmentstatus'), nullable=False),
        sa.Column('is_active', sa.Boolean(), nullable=False),
        sa.Column('created_at', sa.DateTime(), nullable=False),
        sa.Column('updated_at', sa.DateTime(), nullable=False),
        sa.ForeignKeyConstraint(['chapter_id'], ['chapters.id'], ondelete='SET NULL'),
        sa.ForeignKeyConstraint(['grade_id'], ['grades.id'], ondelete='CASCADE'),
        sa.ForeignKeyConstraint(['institution_id'], ['institutions.id'], ondelete='CASCADE'),
        sa.ForeignKeyConstraint(['section_id'], ['sections.id'], ondelete='SET NULL'),
        sa.ForeignKeyConstraint(['subject_id'], ['subjects.id'], ondelete='CASCADE'),
        sa.ForeignKeyConstraint(['teacher_id'], ['teachers.id'], ondelete='CASCADE'),
        sa.PrimaryKeyConstraint('id')
    )
    
    op.create_index('idx_assignment_active', 'assignments', ['is_active'])
    op.create_index('idx_assignment_chapter', 'assignments', ['chapter_id'])
    op.create_index('idx_assignment_due_date', 'assignments', ['due_date'])
    op.create_index('idx_assignment_grade', 'assignments', ['grade_id'])
    op.create_index('idx_assignment_institution', 'assignments', ['institution_id'])
    op.create_index('idx_assignment_section', 'assignments', ['section_id'])
    op.create_index('idx_assignment_status', 'assignments', ['status'])
    op.create_index('idx_assignment_subject', 'assignments', ['subject_id'])
    op.create_index('idx_assignment_teacher', 'assignments', ['teacher_id'])
    
    # Create assignment_files table
    op.create_table(
        'assignment_files',
        sa.Column('id', sa.Integer(), nullable=False),
        sa.Column('assignment_id', sa.Integer(), nullable=False),
        sa.Column('file_name', sa.String(length=255), nullable=False),
        sa.Column('file_size', sa.Integer(), nullable=False),
        sa.Column('file_type', sa.String(length=100), nullable=False),
        sa.Column('file_url', sa.String(length=500), nullable=False),
        sa.Column('s3_key', sa.String(length=500), nullable=False),
        sa.Column('uploaded_at', sa.DateTime(), nullable=False),
        sa.ForeignKeyConstraint(['assignment_id'], ['assignments.id'], ondelete='CASCADE'),
        sa.PrimaryKeyConstraint('id')
    )
    
    op.create_index('idx_assignment_file_assignment', 'assignment_files', ['assignment_id'])
    
    # Create submissions table
    op.create_table(
        'submissions',
        sa.Column('id', sa.Integer(), nullable=False),
        sa.Column('assignment_id', sa.Integer(), nullable=False),
        sa.Column('student_id', sa.Integer(), nullable=False),
        sa.Column('content', sa.Text(), nullable=True),
        sa.Column('submission_text', sa.Text(), nullable=True),
        sa.Column('submitted_at', sa.DateTime(), nullable=True),
        sa.Column('is_late', sa.Boolean(), nullable=False),
        sa.Column('marks_obtained', sa.Numeric(precision=10, scale=2), nullable=True),
        sa.Column('grade', sa.String(length=10), nullable=True),
        sa.Column('feedback', sa.Text(), nullable=True),
        sa.Column('graded_by', sa.Integer(), nullable=True),
        sa.Column('graded_at', sa.DateTime(), nullable=True),
        sa.Column('status', postgresql.ENUM('not_submitted', 'submitted', 'late_submitted', 'graded', 'returned', name='submissionstatus'), nullable=False),
        sa.Column('created_at', sa.DateTime(), nullable=False),
        sa.Column('updated_at', sa.DateTime(), nullable=False),
        sa.ForeignKeyConstraint(['assignment_id'], ['assignments.id'], ondelete='CASCADE'),
        sa.ForeignKeyConstraint(['graded_by'], ['teachers.id'], ondelete='SET NULL'),
        sa.ForeignKeyConstraint(['student_id'], ['students.id'], ondelete='CASCADE'),
        sa.PrimaryKeyConstraint('id'),
        sa.UniqueConstraint('assignment_id', 'student_id', name='uq_assignment_student_submission')
    )
    
    op.create_index('idx_submission_assignment', 'submissions', ['assignment_id'])
    op.create_index('idx_submission_graded_by', 'submissions', ['graded_by'])
    op.create_index('idx_submission_is_late', 'submissions', ['is_late'])
    op.create_index('idx_submission_status', 'submissions', ['status'])
    op.create_index('idx_submission_student', 'submissions', ['student_id'])
    op.create_index('idx_submission_submitted_at', 'submissions', ['submitted_at'])
    
    # Create submission_files table
    op.create_table(
        'submission_files',
        sa.Column('id', sa.Integer(), nullable=False),
        sa.Column('submission_id', sa.Integer(), nullable=False),
        sa.Column('file_name', sa.String(length=255), nullable=False),
        sa.Column('file_size', sa.Integer(), nullable=False),
        sa.Column('file_type', sa.String(length=100), nullable=False),
        sa.Column('file_url', sa.String(length=500), nullable=False),
        sa.Column('s3_key', sa.String(length=500), nullable=False),
        sa.Column('uploaded_at', sa.DateTime(), nullable=False),
        sa.ForeignKeyConstraint(['submission_id'], ['submissions.id'], ondelete='CASCADE'),
        sa.PrimaryKeyConstraint('id')
    )
    
    op.create_index('idx_submission_file_submission', 'submission_files', ['submission_id'])


def downgrade():
    # Drop tables
    op.drop_table('submission_files')
    op.drop_table('submissions')
    op.drop_table('assignment_files')
    op.drop_table('assignments')
    
    # Drop enums
    op.execute("DROP TYPE submissionstatus")
    op.execute("DROP TYPE assignmentstatus")
