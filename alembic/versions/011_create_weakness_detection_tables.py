"""create weakness detection tables

Revision ID: 011
Revises: 010
Create Date: 2024-01-15 10:00:00.000000

"""
from alembic import op
import sqlalchemy as sa

revision = '011'
down_revision = '010_study_planner'
branch_labels = None
depends_on = ('006a',)


def upgrade():
    bind = op.get_bind()
    inspector = sa.inspect(bind)
    
    if 'chapter_performance' not in inspector.get_table_names():
        op.create_table(
            'chapter_performance',
            sa.Column('id', sa.Integer(), nullable=False),
            sa.Column('institution_id', sa.Integer(), nullable=False),
            sa.Column('student_id', sa.Integer(), nullable=False),
            sa.Column('subject_id', sa.Integer(), nullable=False),
            sa.Column('chapter_id', sa.Integer(), nullable=False),
            sa.Column('average_score', sa.Numeric(5, 2), nullable=False),
            sa.Column('total_attempts', sa.Integer(), nullable=False, server_default='0'),
            sa.Column('successful_attempts', sa.Integer(), nullable=False, server_default='0'),
            sa.Column('failed_attempts', sa.Integer(), nullable=False, server_default='0'),
            sa.Column('success_rate', sa.Numeric(5, 2), nullable=False),
            sa.Column('time_spent_minutes', sa.Integer(), nullable=False, server_default='0'),
            sa.Column('last_practiced_at', sa.DateTime(), nullable=True),
            sa.Column('proficiency_level', sa.String(50), nullable=True),
            sa.Column('trend', sa.String(50), nullable=True),
            sa.Column('improvement_rate', sa.Numeric(5, 2), nullable=True),
            sa.Column('difficulty_rating', sa.Numeric(5, 2), nullable=True),
            sa.Column('mastery_score', sa.Numeric(5, 2), nullable=False),
            sa.Column('created_at', sa.DateTime(), nullable=False, server_default=sa.text('CURRENT_TIMESTAMP')),
            sa.Column('updated_at', sa.DateTime(), nullable=False, server_default=sa.text('CURRENT_TIMESTAMP')),
            sa.ForeignKeyConstraint(['institution_id'], ['institutions.id'], ondelete='CASCADE'),
            sa.ForeignKeyConstraint(['student_id'], ['students.id'], ondelete='CASCADE'),
            sa.ForeignKeyConstraint(['subject_id'], ['subjects.id'], ondelete='CASCADE'),
            sa.ForeignKeyConstraint(['chapter_id'], ['chapters.id'], ondelete='CASCADE'),
            sa.PrimaryKeyConstraint('id'),
            sa.UniqueConstraint('student_id', 'chapter_id', name='uq_student_chapter_performance')
        )
    
    existing_indexes = {idx['name'] for idx in inspector.get_indexes('chapter_performance')}
    if 'idx_chapter_perf_institution' not in existing_indexes:
        op.create_index('idx_chapter_perf_institution', 'chapter_performance', ['institution_id'])
    if 'idx_chapter_perf_student' not in existing_indexes:
        op.create_index('idx_chapter_perf_student', 'chapter_performance', ['student_id'])
    if 'idx_chapter_perf_subject' not in existing_indexes:
        op.create_index('idx_chapter_perf_subject', 'chapter_performance', ['subject_id'])
    if 'idx_chapter_perf_chapter' not in existing_indexes:
        op.create_index('idx_chapter_perf_chapter', 'chapter_performance', ['chapter_id'])
    if 'idx_chapter_perf_mastery' not in existing_indexes:
        op.create_index('idx_chapter_perf_mastery', 'chapter_performance', ['mastery_score'])
    if 'idx_chapter_perf_proficiency' not in existing_indexes:
        op.create_index('idx_chapter_perf_proficiency', 'chapter_performance', ['proficiency_level'])

    if 'questions_bank' not in inspector.get_table_names():
        raise ValueError('questions_bank table must exist before creating question_recommendations')
    
    if 'question_recommendations' not in inspector.get_table_names():
        op.create_table(
            'question_recommendations',
            sa.Column('id', sa.Integer(), nullable=False),
            sa.Column('institution_id', sa.Integer(), nullable=False),
            sa.Column('student_id', sa.Integer(), nullable=False),
            sa.Column('question_id', sa.Integer(), nullable=False),
            sa.Column('recommendation_score', sa.Numeric(10, 4), nullable=False),
            sa.Column('relevance_score', sa.Numeric(5, 2), nullable=False),
            sa.Column('difficulty_match_score', sa.Numeric(5, 2), nullable=False),
            sa.Column('weakness_alignment_score', sa.Numeric(5, 2), nullable=False),
            sa.Column('spaced_repetition_score', sa.Numeric(5, 2), nullable=False),
            sa.Column('priority_rank', sa.Integer(), nullable=True),
            sa.Column('next_review_date', sa.Date(), nullable=True),
            sa.Column('repetition_number', sa.Integer(), nullable=False, server_default='0'),
            sa.Column('ease_factor', sa.Numeric(3, 2), nullable=False, server_default='2.5'),
            sa.Column('interval_days', sa.Integer(), nullable=False, server_default='0'),
            sa.Column('last_reviewed_at', sa.DateTime(), nullable=True),
            sa.Column('last_performance', sa.Numeric(5, 2), nullable=True),
            sa.Column('is_completed', sa.Boolean(), nullable=False, server_default=sa.text('0')),
            sa.Column('completed_at', sa.DateTime(), nullable=True),
            sa.Column('metadata', sa.JSON(), nullable=True),
            sa.Column('created_at', sa.DateTime(), nullable=False, server_default=sa.text('CURRENT_TIMESTAMP')),
            sa.Column('updated_at', sa.DateTime(), nullable=False, server_default=sa.text('CURRENT_TIMESTAMP')),
            sa.ForeignKeyConstraint(['institution_id'], ['institutions.id'], ondelete='CASCADE'),
            sa.ForeignKeyConstraint(['student_id'], ['students.id'], ondelete='CASCADE'),
            sa.ForeignKeyConstraint(['question_id'], ['questions_bank.id'], ondelete='CASCADE'),
            sa.PrimaryKeyConstraint('id')
        )
    
    existing_indexes = {idx['name'] for idx in inspector.get_indexes('question_recommendations')}
    if 'idx_question_rec_institution' not in existing_indexes:
        op.create_index('idx_question_rec_institution', 'question_recommendations', ['institution_id'])
    if 'idx_question_rec_student' not in existing_indexes:
        op.create_index('idx_question_rec_student', 'question_recommendations', ['student_id'])
    if 'idx_question_rec_question' not in existing_indexes:
        op.create_index('idx_question_rec_question', 'question_recommendations', ['question_id'])
    if 'idx_question_rec_score' not in existing_indexes:
        op.create_index('idx_question_rec_score', 'question_recommendations', ['recommendation_score'])
    if 'idx_question_rec_rank' not in existing_indexes:
        op.create_index('idx_question_rec_rank', 'question_recommendations', ['priority_rank'])
    if 'idx_question_rec_review_date' not in existing_indexes:
        op.create_index('idx_question_rec_review_date', 'question_recommendations', ['next_review_date'])
    if 'idx_question_rec_completed' not in existing_indexes:
        op.create_index('idx_question_rec_completed', 'question_recommendations', ['is_completed'])

    if 'focus_areas' not in inspector.get_table_names():
        op.create_table(
            'focus_areas',
            sa.Column('id', sa.Integer(), nullable=False),
            sa.Column('institution_id', sa.Integer(), nullable=False),
            sa.Column('student_id', sa.Integer(), nullable=False),
            sa.Column('subject_id', sa.Integer(), nullable=False),
            sa.Column('chapter_id', sa.Integer(), nullable=True),
            sa.Column('topic_id', sa.Integer(), nullable=True),
            sa.Column('focus_type', sa.String(50), nullable=False),
            sa.Column('urgency_score', sa.Numeric(5, 2), nullable=False),
            sa.Column('importance_score', sa.Numeric(5, 2), nullable=False),
            sa.Column('impact_score', sa.Numeric(5, 2), nullable=False),
            sa.Column('combined_priority', sa.Numeric(10, 4), nullable=False),
            sa.Column('current_performance', sa.Numeric(5, 2), nullable=True),
            sa.Column('target_performance', sa.Numeric(5, 2), nullable=True),
            sa.Column('performance_gap', sa.Numeric(5, 2), nullable=True),
            sa.Column('recommended_hours', sa.Numeric(5, 2), nullable=False),
            sa.Column('estimated_improvement', sa.Numeric(5, 2), nullable=True),
            sa.Column('confidence_level', sa.String(50), nullable=True),
            sa.Column('reasoning', sa.Text(), nullable=True),
            sa.Column('ai_insights', sa.JSON(), nullable=True),
            sa.Column('status', sa.String(50), nullable=False, server_default='active'),
            sa.Column('started_at', sa.DateTime(), nullable=True),
            sa.Column('completed_at', sa.DateTime(), nullable=True),
            sa.Column('created_at', sa.DateTime(), nullable=False, server_default=sa.text('CURRENT_TIMESTAMP')),
            sa.Column('updated_at', sa.DateTime(), nullable=False, server_default=sa.text('CURRENT_TIMESTAMP')),
            sa.ForeignKeyConstraint(['institution_id'], ['institutions.id'], ondelete='CASCADE'),
            sa.ForeignKeyConstraint(['student_id'], ['students.id'], ondelete='CASCADE'),
            sa.ForeignKeyConstraint(['subject_id'], ['subjects.id'], ondelete='CASCADE'),
            sa.ForeignKeyConstraint(['chapter_id'], ['chapters.id'], ondelete='SET NULL'),
            sa.ForeignKeyConstraint(['topic_id'], ['topics.id'], ondelete='SET NULL'),
            sa.PrimaryKeyConstraint('id')
        )
    
    existing_indexes = {idx['name'] for idx in inspector.get_indexes('focus_areas')}
    if 'idx_focus_area_institution' not in existing_indexes:
        op.create_index('idx_focus_area_institution', 'focus_areas', ['institution_id'])
    if 'idx_focus_area_student' not in existing_indexes:
        op.create_index('idx_focus_area_student', 'focus_areas', ['student_id'])
    if 'idx_focus_area_subject' not in existing_indexes:
        op.create_index('idx_focus_area_subject', 'focus_areas', ['subject_id'])
    if 'idx_focus_area_chapter' not in existing_indexes:
        op.create_index('idx_focus_area_chapter', 'focus_areas', ['chapter_id'])
    if 'idx_focus_area_type' not in existing_indexes:
        op.create_index('idx_focus_area_type', 'focus_areas', ['focus_type'])
    if 'idx_focus_area_priority' not in existing_indexes:
        op.create_index('idx_focus_area_priority', 'focus_areas', ['combined_priority'])
    if 'idx_focus_area_status' not in existing_indexes:
        op.create_index('idx_focus_area_status', 'focus_areas', ['status'])

    if 'personalized_insights' not in inspector.get_table_names():
        op.create_table(
            'personalized_insights',
            sa.Column('id', sa.Integer(), nullable=False),
            sa.Column('institution_id', sa.Integer(), nullable=False),
            sa.Column('student_id', sa.Integer(), nullable=False),
            sa.Column('insight_type', sa.String(100), nullable=False),
            sa.Column('category', sa.String(50), nullable=False),
            sa.Column('title', sa.String(255), nullable=False),
            sa.Column('description', sa.Text(), nullable=False),
            sa.Column('severity', sa.String(50), nullable=False),
            sa.Column('priority', sa.Integer(), nullable=False),
            sa.Column('is_actionable', sa.Boolean(), nullable=False, server_default=sa.text('1')),
            sa.Column('actionable_items', sa.JSON(), nullable=True),
            sa.Column('recommendations', sa.JSON(), nullable=True),
            sa.Column('supporting_data', sa.JSON(), nullable=True),
            sa.Column('affected_subjects', sa.JSON(), nullable=True),
            sa.Column('affected_chapters', sa.JSON(), nullable=True),
            sa.Column('ai_generated', sa.Boolean(), nullable=False, server_default=sa.text('0')),
            sa.Column('confidence_score', sa.Numeric(5, 2), nullable=True),
            sa.Column('is_acknowledged', sa.Boolean(), nullable=False, server_default=sa.text('0')),
            sa.Column('acknowledged_at', sa.DateTime(), nullable=True),
            sa.Column('is_resolved', sa.Boolean(), nullable=False, server_default=sa.text('0')),
            sa.Column('resolved_at', sa.DateTime(), nullable=True),
            sa.Column('expires_at', sa.DateTime(), nullable=True),
            sa.Column('created_at', sa.DateTime(), nullable=False, server_default=sa.text('CURRENT_TIMESTAMP')),
            sa.Column('updated_at', sa.DateTime(), nullable=False, server_default=sa.text('CURRENT_TIMESTAMP')),
            sa.ForeignKeyConstraint(['institution_id'], ['institutions.id'], ondelete='CASCADE'),
            sa.ForeignKeyConstraint(['student_id'], ['students.id'], ondelete='CASCADE'),
            sa.PrimaryKeyConstraint('id')
        )
    
    existing_indexes = {idx['name'] for idx in inspector.get_indexes('personalized_insights')}
    if 'idx_insight_institution' not in existing_indexes:
        op.create_index('idx_insight_institution', 'personalized_insights', ['institution_id'])
    if 'idx_insight_student' not in existing_indexes:
        op.create_index('idx_insight_student', 'personalized_insights', ['student_id'])
    if 'idx_insight_type' not in existing_indexes:
        op.create_index('idx_insight_type', 'personalized_insights', ['insight_type'])
    if 'idx_insight_category' not in existing_indexes:
        op.create_index('idx_insight_category', 'personalized_insights', ['category'])
    if 'idx_insight_severity' not in existing_indexes:
        op.create_index('idx_insight_severity', 'personalized_insights', ['severity'])
    if 'idx_insight_priority' not in existing_indexes:
        op.create_index('idx_insight_priority', 'personalized_insights', ['priority'])
    if 'idx_insight_resolved' not in existing_indexes:
        op.create_index('idx_insight_resolved', 'personalized_insights', ['is_resolved'])


def downgrade():
    bind = op.get_bind()
    inspector = sa.inspect(bind)
    
    # Drop personalized_insights table and indexes
    if 'personalized_insights' in inspector.get_table_names():
        existing_indexes = {idx['name'] for idx in inspector.get_indexes('personalized_insights')}
        if 'idx_insight_resolved' in existing_indexes:
            op.drop_index('idx_insight_resolved', 'personalized_insights')
        if 'idx_insight_priority' in existing_indexes:
            op.drop_index('idx_insight_priority', 'personalized_insights')
        if 'idx_insight_severity' in existing_indexes:
            op.drop_index('idx_insight_severity', 'personalized_insights')
        if 'idx_insight_category' in existing_indexes:
            op.drop_index('idx_insight_category', 'personalized_insights')
        if 'idx_insight_type' in existing_indexes:
            op.drop_index('idx_insight_type', 'personalized_insights')
        if 'idx_insight_student' in existing_indexes:
            op.drop_index('idx_insight_student', 'personalized_insights')
        if 'idx_insight_institution' in existing_indexes:
            op.drop_index('idx_insight_institution', 'personalized_insights')
        op.drop_table('personalized_insights')
    
    # Drop focus_areas table and indexes
    if 'focus_areas' in inspector.get_table_names():
        existing_indexes = {idx['name'] for idx in inspector.get_indexes('focus_areas')}
        if 'idx_focus_area_status' in existing_indexes:
            op.drop_index('idx_focus_area_status', 'focus_areas')
        if 'idx_focus_area_priority' in existing_indexes:
            op.drop_index('idx_focus_area_priority', 'focus_areas')
        if 'idx_focus_area_type' in existing_indexes:
            op.drop_index('idx_focus_area_type', 'focus_areas')
        if 'idx_focus_area_chapter' in existing_indexes:
            op.drop_index('idx_focus_area_chapter', 'focus_areas')
        if 'idx_focus_area_subject' in existing_indexes:
            op.drop_index('idx_focus_area_subject', 'focus_areas')
        if 'idx_focus_area_student' in existing_indexes:
            op.drop_index('idx_focus_area_student', 'focus_areas')
        if 'idx_focus_area_institution' in existing_indexes:
            op.drop_index('idx_focus_area_institution', 'focus_areas')
        op.drop_table('focus_areas')
    
    # Drop question_recommendations table and indexes
    if 'question_recommendations' in inspector.get_table_names():
        existing_indexes = {idx['name'] for idx in inspector.get_indexes('question_recommendations')}
        if 'idx_question_rec_completed' in existing_indexes:
            op.drop_index('idx_question_rec_completed', 'question_recommendations')
        if 'idx_question_rec_review_date' in existing_indexes:
            op.drop_index('idx_question_rec_review_date', 'question_recommendations')
        if 'idx_question_rec_rank' in existing_indexes:
            op.drop_index('idx_question_rec_rank', 'question_recommendations')
        if 'idx_question_rec_score' in existing_indexes:
            op.drop_index('idx_question_rec_score', 'question_recommendations')
        if 'idx_question_rec_question' in existing_indexes:
            op.drop_index('idx_question_rec_question', 'question_recommendations')
        if 'idx_question_rec_student' in existing_indexes:
            op.drop_index('idx_question_rec_student', 'question_recommendations')
        if 'idx_question_rec_institution' in existing_indexes:
            op.drop_index('idx_question_rec_institution', 'question_recommendations')
        op.drop_table('question_recommendations')
    
    # Drop chapter_performance table and indexes
    if 'chapter_performance' in inspector.get_table_names():
        existing_indexes = {idx['name'] for idx in inspector.get_indexes('chapter_performance')}
        if 'idx_chapter_perf_proficiency' in existing_indexes:
            op.drop_index('idx_chapter_perf_proficiency', 'chapter_performance')
        if 'idx_chapter_perf_mastery' in existing_indexes:
            op.drop_index('idx_chapter_perf_mastery', 'chapter_performance')
        if 'idx_chapter_perf_chapter' in existing_indexes:
            op.drop_index('idx_chapter_perf_chapter', 'chapter_performance')
        if 'idx_chapter_perf_subject' in existing_indexes:
            op.drop_index('idx_chapter_perf_subject', 'chapter_performance')
        if 'idx_chapter_perf_student' in existing_indexes:
            op.drop_index('idx_chapter_perf_student', 'chapter_performance')
        if 'idx_chapter_perf_institution' in existing_indexes:
            op.drop_index('idx_chapter_perf_institution', 'chapter_performance')
        op.drop_table('chapter_performance')
