"""create subject rpg tables

Revision ID: 034
Revises: 033
Create Date: 2024-01-15 00:00:00.000000

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa

revision: str = '034_create_subject_rpg'
down_revision: Union[str, None] = 'reverse_classroom_001'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.create_table('student_characters',
        sa.Column('id', sa.Integer(), nullable=False),
        sa.Column('institution_id', sa.Integer(), nullable=False),
        sa.Column('student_id', sa.Integer(), nullable=False),
        sa.Column('character_name', sa.String(length=100), nullable=False),
        sa.Column('avatar_url', sa.String(length=500), nullable=True),
        sa.Column('level', sa.Integer(), nullable=False, server_default='1'),
        sa.Column('xp', sa.Integer(), nullable=False, server_default='0'),
        sa.Column('health', sa.Integer(), nullable=False, server_default='100'),
        sa.Column('mana', sa.Integer(), nullable=False, server_default='50'),
        sa.Column('equipment', sa.JSON(), nullable=True),
        sa.Column('created_at', sa.DateTime(), nullable=False, server_default=sa.text('now()')),
        sa.Column('updated_at', sa.DateTime(), nullable=False, server_default=sa.text('now()')),
        sa.ForeignKeyConstraint(['institution_id'], ['institutions.id'], ondelete='CASCADE'),
        sa.ForeignKeyConstraint(['student_id'], ['students.id'], ondelete='CASCADE'),
        sa.PrimaryKeyConstraint('id'),
        sa.UniqueConstraint('institution_id', 'student_id', name='uq_institution_student_character')
    )
    op.create_index('idx_student_character_institution', 'student_characters', ['institution_id'], unique=False)
    op.create_index('idx_student_character_student', 'student_characters', ['student_id'], unique=False)
    op.create_index('idx_student_character_level', 'student_characters', ['level'], unique=False)
    op.create_index(op.f('ix_student_characters_id'), 'student_characters', ['id'], unique=False)

    op.create_table('subject_worlds',
        sa.Column('id', sa.Integer(), nullable=False),
        sa.Column('institution_id', sa.Integer(), nullable=False),
        sa.Column('subject_id', sa.Integer(), nullable=False),
        sa.Column('world_name', sa.String(length=200), nullable=False),
        sa.Column('chapters_as_regions', sa.JSON(), nullable=False),
        sa.Column('is_active', sa.Boolean(), nullable=False, server_default='true'),
        sa.Column('created_at', sa.DateTime(), nullable=False, server_default=sa.text('now()')),
        sa.Column('updated_at', sa.DateTime(), nullable=False, server_default=sa.text('now()')),
        sa.ForeignKeyConstraint(['institution_id'], ['institutions.id'], ondelete='CASCADE'),
        sa.ForeignKeyConstraint(['subject_id'], ['subjects.id'], ondelete='CASCADE'),
        sa.PrimaryKeyConstraint('id'),
        sa.UniqueConstraint('institution_id', 'subject_id', name='uq_institution_subject_world')
    )
    op.create_index('idx_subject_world_institution', 'subject_worlds', ['institution_id'], unique=False)
    op.create_index('idx_subject_world_subject', 'subject_worlds', ['subject_id'], unique=False)
    op.create_index('idx_subject_world_active', 'subject_worlds', ['is_active'], unique=False)
    op.create_index(op.f('ix_subject_worlds_id'), 'subject_worlds', ['id'], unique=False)

    op.create_table('battle_sessions',
        sa.Column('id', sa.Integer(), nullable=False),
        sa.Column('institution_id', sa.Integer(), nullable=False),
        sa.Column('student_id', sa.Integer(), nullable=False),
        sa.Column('character_id', sa.Integer(), nullable=False),
        sa.Column('chapter_id', sa.Integer(), nullable=True),
        sa.Column('boss_name', sa.String(length=200), nullable=False),
        sa.Column('questions', sa.JSON(), nullable=False),
        sa.Column('answers', sa.JSON(), nullable=True),
        sa.Column('score', sa.Float(), nullable=False, server_default='0'),
        sa.Column('xp_earned', sa.Integer(), nullable=False, server_default='0'),
        sa.Column('loot', sa.JSON(), nullable=True),
        sa.Column('is_completed', sa.Boolean(), nullable=False, server_default='false'),
        sa.Column('completed_at', sa.DateTime(), nullable=True),
        sa.Column('created_at', sa.DateTime(), nullable=False, server_default=sa.text('now()')),
        sa.Column('updated_at', sa.DateTime(), nullable=False, server_default=sa.text('now()')),
        sa.ForeignKeyConstraint(['institution_id'], ['institutions.id'], ondelete='CASCADE'),
        sa.ForeignKeyConstraint(['student_id'], ['students.id'], ondelete='CASCADE'),
        sa.ForeignKeyConstraint(['character_id'], ['student_characters.id'], ondelete='CASCADE'),
        sa.ForeignKeyConstraint(['chapter_id'], ['chapters.id'], ondelete='SET NULL'),
        sa.PrimaryKeyConstraint('id')
    )
    op.create_index('idx_battle_session_institution', 'battle_sessions', ['institution_id'], unique=False)
    op.create_index('idx_battle_session_student', 'battle_sessions', ['student_id'], unique=False)
    op.create_index('idx_battle_session_character', 'battle_sessions', ['character_id'], unique=False)
    op.create_index('idx_battle_session_chapter', 'battle_sessions', ['chapter_id'], unique=False)
    op.create_index('idx_battle_session_completed', 'battle_sessions', ['is_completed'], unique=False)
    op.create_index('idx_battle_session_created', 'battle_sessions', ['created_at'], unique=False)
    op.create_index(op.f('ix_battle_sessions_id'), 'battle_sessions', ['id'], unique=False)

    op.create_table('subject_passports',
        sa.Column('id', sa.Integer(), nullable=False),
        sa.Column('institution_id', sa.Integer(), nullable=False),
        sa.Column('student_id', sa.Integer(), nullable=False),
        sa.Column('subject_id', sa.Integer(), nullable=False),
        sa.Column('stamps', sa.JSON(), nullable=False, server_default='[]'),
        sa.Column('overall_progress_percent', sa.Float(), nullable=False, server_default='0.0'),
        sa.Column('created_at', sa.DateTime(), nullable=False, server_default=sa.text('now()')),
        sa.Column('updated_at', sa.DateTime(), nullable=False, server_default=sa.text('now()')),
        sa.ForeignKeyConstraint(['institution_id'], ['institutions.id'], ondelete='CASCADE'),
        sa.ForeignKeyConstraint(['student_id'], ['students.id'], ondelete='CASCADE'),
        sa.ForeignKeyConstraint(['subject_id'], ['subjects.id'], ondelete='CASCADE'),
        sa.PrimaryKeyConstraint('id'),
        sa.UniqueConstraint('institution_id', 'student_id', 'subject_id', name='uq_student_subject_passport')
    )
    op.create_index('idx_subject_passport_institution', 'subject_passports', ['institution_id'], unique=False)
    op.create_index('idx_subject_passport_student', 'subject_passports', ['student_id'], unique=False)
    op.create_index('idx_subject_passport_subject', 'subject_passports', ['subject_id'], unique=False)
    op.create_index('idx_subject_passport_progress', 'subject_passports', ['overall_progress_percent'], unique=False)
    op.create_index(op.f('ix_subject_passports_id'), 'subject_passports', ['id'], unique=False)

    op.create_table('quest_logs',
        sa.Column('id', sa.Integer(), nullable=False),
        sa.Column('institution_id', sa.Integer(), nullable=False),
        sa.Column('student_id', sa.Integer(), nullable=False),
        sa.Column('character_id', sa.Integer(), nullable=False),
        sa.Column('quest_type', sa.Enum('DAILY', 'WEEKLY', 'BOSS_BATTLE', 'CO_OP', name='questtype'), nullable=False),
        sa.Column('description', sa.Text(), nullable=False),
        sa.Column('target', sa.Integer(), nullable=False),
        sa.Column('progress', sa.Integer(), nullable=False, server_default='0'),
        sa.Column('reward_xp', sa.Integer(), nullable=False),
        sa.Column('reward_gold', sa.Integer(), nullable=False, server_default='0'),
        sa.Column('is_completed', sa.Boolean(), nullable=False, server_default='false'),
        sa.Column('completed_at', sa.DateTime(), nullable=True),
        sa.Column('expires_at', sa.DateTime(), nullable=True),
        sa.Column('created_at', sa.DateTime(), nullable=False, server_default=sa.text('now()')),
        sa.Column('updated_at', sa.DateTime(), nullable=False, server_default=sa.text('now()')),
        sa.ForeignKeyConstraint(['institution_id'], ['institutions.id'], ondelete='CASCADE'),
        sa.ForeignKeyConstraint(['student_id'], ['students.id'], ondelete='CASCADE'),
        sa.ForeignKeyConstraint(['character_id'], ['student_characters.id'], ondelete='CASCADE'),
        sa.PrimaryKeyConstraint('id')
    )
    op.create_index('idx_quest_log_institution', 'quest_logs', ['institution_id'], unique=False)
    op.create_index('idx_quest_log_student', 'quest_logs', ['student_id'], unique=False)
    op.create_index('idx_quest_log_character', 'quest_logs', ['character_id'], unique=False)
    op.create_index('idx_quest_log_type', 'quest_logs', ['quest_type'], unique=False)
    op.create_index('idx_quest_log_completed', 'quest_logs', ['is_completed'], unique=False)
    op.create_index('idx_quest_log_expires', 'quest_logs', ['expires_at'], unique=False)
    op.create_index(op.f('ix_quest_logs_id'), 'quest_logs', ['id'], unique=False)


def downgrade() -> None:
    op.drop_index(op.f('ix_quest_logs_id'), table_name='quest_logs')
    op.drop_index('idx_quest_log_expires', table_name='quest_logs')
    op.drop_index('idx_quest_log_completed', table_name='quest_logs')
    op.drop_index('idx_quest_log_type', table_name='quest_logs')
    op.drop_index('idx_quest_log_character', table_name='quest_logs')
    op.drop_index('idx_quest_log_student', table_name='quest_logs')
    op.drop_index('idx_quest_log_institution', table_name='quest_logs')
    op.drop_table('quest_logs')
    
    op.drop_index(op.f('ix_subject_passports_id'), table_name='subject_passports')
    op.drop_index('idx_subject_passport_progress', table_name='subject_passports')
    op.drop_index('idx_subject_passport_subject', table_name='subject_passports')
    op.drop_index('idx_subject_passport_student', table_name='subject_passports')
    op.drop_index('idx_subject_passport_institution', table_name='subject_passports')
    op.drop_table('subject_passports')
    
    op.drop_index(op.f('ix_battle_sessions_id'), table_name='battle_sessions')
    op.drop_index('idx_battle_session_created', table_name='battle_sessions')
    op.drop_index('idx_battle_session_completed', table_name='battle_sessions')
    op.drop_index('idx_battle_session_chapter', table_name='battle_sessions')
    op.drop_index('idx_battle_session_character', table_name='battle_sessions')
    op.drop_index('idx_battle_session_student', table_name='battle_sessions')
    op.drop_index('idx_battle_session_institution', table_name='battle_sessions')
    op.drop_table('battle_sessions')
    
    op.drop_index(op.f('ix_subject_worlds_id'), table_name='subject_worlds')
    op.drop_index('idx_subject_world_active', table_name='subject_worlds')
    op.drop_index('idx_subject_world_subject', table_name='subject_worlds')
    op.drop_index('idx_subject_world_institution', table_name='subject_worlds')
    op.drop_table('subject_worlds')
    
    op.drop_index(op.f('ix_student_characters_id'), table_name='student_characters')
    op.drop_index('idx_student_character_level', table_name='student_characters')
    op.drop_index('idx_student_character_student', table_name='student_characters')
    op.drop_index('idx_student_character_institution', table_name='student_characters')
    op.drop_table('student_characters')
    
    op.execute('DROP TYPE questtype')
