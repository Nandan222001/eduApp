"""create study materials tables

Revision ID: create_study_materials
Revises: 
Create Date: 2024-01-15 10:00:00.000000

"""
from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql

# revision identifiers, used by Alembic.
revision = 'create_study_materials'
down_revision = None  # Update this to the latest revision in your alembic chain
branch_labels = None
depends_on = None


def upgrade():
    # Create material_type enum
    material_type_enum = postgresql.ENUM(
        'pdf', 'video', 'audio', 'image', 'document', 'presentation', 
        'spreadsheet', 'archive', 'other',
        name='materialtype',
        create_type=False
    )
    material_type_enum.create(op.get_bind(), checkfirst=True)

    # Create study_materials table
    op.create_table(
        'study_materials',
        sa.Column('id', sa.Integer(), nullable=False),
        sa.Column('institution_id', sa.Integer(), nullable=False),
        sa.Column('subject_id', sa.Integer(), nullable=True),
        sa.Column('chapter_id', sa.Integer(), nullable=True),
        sa.Column('topic_id', sa.Integer(), nullable=True),
        sa.Column('grade_id', sa.Integer(), nullable=True),
        sa.Column('uploaded_by', sa.Integer(), nullable=True),
        sa.Column('title', sa.String(length=500), nullable=False),
        sa.Column('description', sa.Text(), nullable=True),
        sa.Column('file_path', sa.String(length=1000), nullable=False),
        sa.Column('file_name', sa.String(length=500), nullable=False),
        sa.Column('file_size', sa.BigInteger(), nullable=False),
        sa.Column('material_type', material_type_enum, nullable=False),
        sa.Column('mime_type', sa.String(length=200), nullable=True),
        sa.Column('thumbnail_path', sa.String(length=1000), nullable=True),
        sa.Column('preview_path', sa.String(length=1000), nullable=True),
        sa.Column('view_count', sa.Integer(), nullable=False, server_default='0'),
        sa.Column('download_count', sa.Integer(), nullable=False, server_default='0'),
        sa.Column('tags', postgresql.ARRAY(sa.String()), nullable=True),
        sa.Column('is_public', sa.Boolean(), nullable=False, server_default='false'),
        sa.Column('is_active', sa.Boolean(), nullable=False, server_default='true'),
        sa.Column('created_at', sa.DateTime(), nullable=False, server_default=sa.text('now()')),
        sa.Column('updated_at', sa.DateTime(), nullable=False, server_default=sa.text('now()')),
        sa.ForeignKeyConstraint(['institution_id'], ['institutions.id'], ondelete='CASCADE'),
        sa.ForeignKeyConstraint(['subject_id'], ['subjects.id'], ondelete='CASCADE'),
        sa.ForeignKeyConstraint(['chapter_id'], ['chapters.id'], ondelete='SET NULL'),
        sa.ForeignKeyConstraint(['topic_id'], ['topics.id'], ondelete='SET NULL'),
        sa.ForeignKeyConstraint(['grade_id'], ['grades.id'], ondelete='CASCADE'),
        sa.ForeignKeyConstraint(['uploaded_by'], ['users.id'], ondelete='SET NULL'),
        sa.PrimaryKeyConstraint('id')
    )
    op.create_index('idx_study_material_institution', 'study_materials', ['institution_id'])
    op.create_index('idx_study_material_subject', 'study_materials', ['subject_id'])
    op.create_index('idx_study_material_chapter', 'study_materials', ['chapter_id'])
    op.create_index('idx_study_material_topic', 'study_materials', ['topic_id'])
    op.create_index('idx_study_material_grade', 'study_materials', ['grade_id'])
    op.create_index('idx_study_material_uploaded_by', 'study_materials', ['uploaded_by'])
    op.create_index('idx_study_material_type', 'study_materials', ['material_type'])
    op.create_index('idx_study_material_active', 'study_materials', ['is_active'])
    op.create_index('idx_study_material_public', 'study_materials', ['is_public'])
    op.create_index('idx_study_material_created', 'study_materials', ['created_at'])
    op.create_index('idx_study_material_tags', 'study_materials', ['tags'], postgresql_using='gin')

    # Create material_bookmarks table
    op.create_table(
        'material_bookmarks',
        sa.Column('id', sa.Integer(), nullable=False),
        sa.Column('institution_id', sa.Integer(), nullable=False),
        sa.Column('material_id', sa.Integer(), nullable=False),
        sa.Column('user_id', sa.Integer(), nullable=False),
        sa.Column('notes', sa.Text(), nullable=True),
        sa.Column('is_favorite', sa.Boolean(), nullable=False, server_default='false'),
        sa.Column('created_at', sa.DateTime(), nullable=False, server_default=sa.text('now()')),
        sa.Column('updated_at', sa.DateTime(), nullable=False, server_default=sa.text('now()')),
        sa.ForeignKeyConstraint(['institution_id'], ['institutions.id'], ondelete='CASCADE'),
        sa.ForeignKeyConstraint(['material_id'], ['study_materials.id'], ondelete='CASCADE'),
        sa.ForeignKeyConstraint(['user_id'], ['users.id'], ondelete='CASCADE'),
        sa.PrimaryKeyConstraint('id'),
        sa.UniqueConstraint('material_id', 'user_id', name='uq_material_user_bookmark')
    )
    op.create_index('idx_material_bookmark_institution', 'material_bookmarks', ['institution_id'])
    op.create_index('idx_material_bookmark_material', 'material_bookmarks', ['material_id'])
    op.create_index('idx_material_bookmark_user', 'material_bookmarks', ['user_id'])
    op.create_index('idx_material_bookmark_favorite', 'material_bookmarks', ['is_favorite'])

    # Create material_access_logs table
    op.create_table(
        'material_access_logs',
        sa.Column('id', sa.Integer(), nullable=False),
        sa.Column('institution_id', sa.Integer(), nullable=False),
        sa.Column('material_id', sa.Integer(), nullable=False),
        sa.Column('user_id', sa.Integer(), nullable=False),
        sa.Column('action', sa.String(length=50), nullable=False),
        sa.Column('accessed_at', sa.DateTime(), nullable=False, server_default=sa.text('now()')),
        sa.ForeignKeyConstraint(['institution_id'], ['institutions.id'], ondelete='CASCADE'),
        sa.ForeignKeyConstraint(['material_id'], ['study_materials.id'], ondelete='CASCADE'),
        sa.ForeignKeyConstraint(['user_id'], ['users.id'], ondelete='CASCADE'),
        sa.PrimaryKeyConstraint('id')
    )
    op.create_index('idx_material_access_institution', 'material_access_logs', ['institution_id'])
    op.create_index('idx_material_access_material', 'material_access_logs', ['material_id'])
    op.create_index('idx_material_access_user', 'material_access_logs', ['user_id'])
    op.create_index('idx_material_access_action', 'material_access_logs', ['action'])
    op.create_index('idx_material_access_time', 'material_access_logs', ['accessed_at'])

    # Create material_shares table
    op.create_table(
        'material_shares',
        sa.Column('id', sa.Integer(), nullable=False),
        sa.Column('institution_id', sa.Integer(), nullable=False),
        sa.Column('material_id', sa.Integer(), nullable=False),
        sa.Column('shared_by', sa.Integer(), nullable=False),
        sa.Column('shared_with', sa.Integer(), nullable=True),
        sa.Column('share_token', sa.String(length=100), nullable=False),
        sa.Column('message', sa.Text(), nullable=True),
        sa.Column('expires_at', sa.DateTime(), nullable=True),
        sa.Column('is_active', sa.Boolean(), nullable=False, server_default='true'),
        sa.Column('created_at', sa.DateTime(), nullable=False, server_default=sa.text('now()')),
        sa.ForeignKeyConstraint(['institution_id'], ['institutions.id'], ondelete='CASCADE'),
        sa.ForeignKeyConstraint(['material_id'], ['study_materials.id'], ondelete='CASCADE'),
        sa.ForeignKeyConstraint(['shared_by'], ['users.id'], ondelete='CASCADE'),
        sa.ForeignKeyConstraint(['shared_with'], ['users.id'], ondelete='CASCADE'),
        sa.PrimaryKeyConstraint('id'),
        sa.UniqueConstraint('share_token', name='uq_share_token')
    )
    op.create_index('idx_material_share_institution', 'material_shares', ['institution_id'])
    op.create_index('idx_material_share_material', 'material_shares', ['material_id'])
    op.create_index('idx_material_share_shared_by', 'material_shares', ['shared_by'])
    op.create_index('idx_material_share_shared_with', 'material_shares', ['shared_with'])
    op.create_index('idx_material_share_token', 'material_shares', ['share_token'])
    op.create_index('idx_material_share_active', 'material_shares', ['is_active'])
    op.create_index('idx_material_share_expires', 'material_shares', ['expires_at'])

    # Create material_tags table
    op.create_table(
        'material_tags',
        sa.Column('id', sa.Integer(), nullable=False),
        sa.Column('institution_id', sa.Integer(), nullable=False),
        sa.Column('name', sa.String(length=100), nullable=False),
        sa.Column('description', sa.Text(), nullable=True),
        sa.Column('color', sa.String(length=20), nullable=True),
        sa.Column('usage_count', sa.Integer(), nullable=False, server_default='0'),
        sa.Column('is_active', sa.Boolean(), nullable=False, server_default='true'),
        sa.Column('created_at', sa.DateTime(), nullable=False, server_default=sa.text('now()')),
        sa.Column('updated_at', sa.DateTime(), nullable=False, server_default=sa.text('now()')),
        sa.ForeignKeyConstraint(['institution_id'], ['institutions.id'], ondelete='CASCADE'),
        sa.PrimaryKeyConstraint('id'),
        sa.UniqueConstraint('institution_id', 'name', name='uq_institution_material_tag_name')
    )
    op.create_index('idx_material_tag_institution', 'material_tags', ['institution_id'])
    op.create_index('idx_material_tag_active', 'material_tags', ['is_active'])
    op.create_index('idx_material_tag_usage', 'material_tags', ['usage_count'])


def downgrade():
    op.drop_index('idx_material_tag_usage', table_name='material_tags')
    op.drop_index('idx_material_tag_active', table_name='material_tags')
    op.drop_index('idx_material_tag_institution', table_name='material_tags')
    op.drop_table('material_tags')
    
    op.drop_index('idx_material_share_expires', table_name='material_shares')
    op.drop_index('idx_material_share_active', table_name='material_shares')
    op.drop_index('idx_material_share_token', table_name='material_shares')
    op.drop_index('idx_material_share_shared_with', table_name='material_shares')
    op.drop_index('idx_material_share_shared_by', table_name='material_shares')
    op.drop_index('idx_material_share_material', table_name='material_shares')
    op.drop_index('idx_material_share_institution', table_name='material_shares')
    op.drop_table('material_shares')
    
    op.drop_index('idx_material_access_time', table_name='material_access_logs')
    op.drop_index('idx_material_access_action', table_name='material_access_logs')
    op.drop_index('idx_material_access_user', table_name='material_access_logs')
    op.drop_index('idx_material_access_material', table_name='material_access_logs')
    op.drop_index('idx_material_access_institution', table_name='material_access_logs')
    op.drop_table('material_access_logs')
    
    op.drop_index('idx_material_bookmark_favorite', table_name='material_bookmarks')
    op.drop_index('idx_material_bookmark_user', table_name='material_bookmarks')
    op.drop_index('idx_material_bookmark_material', table_name='material_bookmarks')
    op.drop_index('idx_material_bookmark_institution', table_name='material_bookmarks')
    op.drop_table('material_bookmarks')
    
    op.drop_index('idx_study_material_tags', table_name='study_materials')
    op.drop_index('idx_study_material_created', table_name='study_materials')
    op.drop_index('idx_study_material_public', table_name='study_materials')
    op.drop_index('idx_study_material_active', table_name='study_materials')
    op.drop_index('idx_study_material_type', table_name='study_materials')
    op.drop_index('idx_study_material_uploaded_by', table_name='study_materials')
    op.drop_index('idx_study_material_grade', table_name='study_materials')
    op.drop_index('idx_study_material_topic', table_name='study_materials')
    op.drop_index('idx_study_material_chapter', table_name='study_materials')
    op.drop_index('idx_study_material_subject', table_name='study_materials')
    op.drop_index('idx_study_material_institution', table_name='study_materials')
    op.drop_table('study_materials')
    
    material_type_enum = postgresql.ENUM(
        'pdf', 'video', 'audio', 'image', 'document', 'presentation', 
        'spreadsheet', 'archive', 'other',
        name='materialtype'
    )
    material_type_enum.drop(op.get_bind(), checkfirst=True)
