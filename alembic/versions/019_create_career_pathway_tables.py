"""create career pathway tables

Revision ID: 019_create_career_pathway_tables
Revises: 018_create_plagiarism_detection_tables
Create Date: 2024-01-15 10:00:00.000000

"""
from alembic import op
import sqlalchemy as sa

revision = '019_create_career_pathway_tables'
down_revision = '018_impersonation_debug'
branch_labels = None
depends_on = None


def upgrade():
    op.create_table(
        'career_pathways',
        sa.Column('id', sa.Integer(), nullable=False),
        sa.Column('institution_id', sa.Integer(), nullable=True),
        sa.Column('title', sa.String(length=200), nullable=False),
        sa.Column('description', sa.Text(), nullable=False),
        sa.Column('category', sa.Enum('stem', 'arts_humanities', 'business', 'healthcare', 'education', 
                                     'engineering', 'technology', 'social_services', 'creative_arts', 
                                     'law_government', 'sports_fitness', 'skilled_trades', 
                                     name='careerinterestcategory'), nullable=False),
        sa.Column('industry', sa.Enum('technology', 'healthcare', 'finance', 'education', 'manufacturing', 
                                     'retail', 'hospitality', 'construction', 'transportation', 
                                     'media_entertainment', 'agriculture', 'energy', 'government', 'nonprofit', 
                                     name='industrytype'), nullable=False),
        sa.Column('required_education', sa.Enum('high_school', 'associate_degree', 'bachelor_degree', 
                                               'master_degree', 'doctoral_degree', 'professional_degree', 
                                               'certification', 'diploma', name='educationlevel'), nullable=False),
        sa.Column('optional_education', sa.JSON(), nullable=True),
        sa.Column('required_skills', sa.JSON(), nullable=False),
        sa.Column('preferred_skills', sa.JSON(), nullable=True),
        sa.Column('personality_match', sa.JSON(), nullable=True),
        sa.Column('average_salary_min', sa.Numeric(precision=12, scale=2), nullable=True),
        sa.Column('average_salary_max', sa.Numeric(precision=12, scale=2), nullable=True),
        sa.Column('salary_currency', sa.String(length=10), nullable=False, server_default='USD'),
        sa.Column('job_growth_rate', sa.Numeric(precision=5, scale=2), nullable=True),
        sa.Column('demand_level', sa.String(length=20), nullable=True),
        sa.Column('market_outlook', sa.Text(), nullable=True),
        sa.Column('typical_courses', sa.JSON(), nullable=True),
        sa.Column('certifications', sa.JSON(), nullable=True),
        sa.Column('extracurricular_activities', sa.JSON(), nullable=True),
        sa.Column('work_environment', sa.Text(), nullable=True),
        sa.Column('typical_tasks', sa.JSON(), nullable=True),
        sa.Column('career_progression', sa.JSON(), nullable=True),
        sa.Column('related_careers', sa.JSON(), nullable=True),
        sa.Column('industry_connections', sa.JSON(), nullable=True),
        sa.Column('data_sources', sa.JSON(), nullable=True),
        sa.Column('last_updated_from_api', sa.DateTime(), nullable=True),
        sa.Column('is_active', sa.Boolean(), nullable=False, server_default='true'),
        sa.Column('created_at', sa.DateTime(), nullable=False, server_default=sa.text('now()')),
        sa.Column('updated_at', sa.DateTime(), nullable=False, server_default=sa.text('now()')),
        sa.ForeignKeyConstraint(['institution_id'], ['institutions.id'], ondelete='CASCADE'),
        sa.PrimaryKeyConstraint('id')
    )
    op.create_index('idx_career_pathway_institution', 'career_pathways', ['institution_id'])
    op.create_index('idx_career_pathway_category', 'career_pathways', ['category'])
    op.create_index('idx_career_pathway_industry', 'career_pathways', ['industry'])
    op.create_index('idx_career_pathway_education', 'career_pathways', ['required_education'])
    op.create_index('idx_career_pathway_active', 'career_pathways', ['is_active'])
    op.create_index('idx_career_pathway_title', 'career_pathways', ['title'])

    op.create_table(
        'student_career_profiles',
        sa.Column('id', sa.Integer(), nullable=False),
        sa.Column('institution_id', sa.Integer(), nullable=False),
        sa.Column('student_id', sa.Integer(), nullable=False),
        sa.Column('interests', sa.JSON(), nullable=True),
        sa.Column('strengths', sa.JSON(), nullable=True),
        sa.Column('personality_type', sa.Enum('realistic', 'investigative', 'artistic', 'social', 
                                             'enterprising', 'conventional', name='personalitytype'), nullable=True),
        sa.Column('personality_assessment_data', sa.JSON(), nullable=True),
        sa.Column('current_skills', sa.JSON(), nullable=True),
        sa.Column('skill_proficiency', sa.JSON(), nullable=True),
        sa.Column('career_goals', sa.JSON(), nullable=True),
        sa.Column('preferred_industries', sa.JSON(), nullable=True),
        sa.Column('preferred_work_environment', sa.JSON(), nullable=True),
        sa.Column('academic_performance_summary', sa.JSON(), nullable=True),
        sa.Column('top_subjects', sa.JSON(), nullable=True),
        sa.Column('extracurricular_activities', sa.JSON(), nullable=True),
        sa.Column('achievements', sa.JSON(), nullable=True),
        sa.Column('work_experience', sa.JSON(), nullable=True),
        sa.Column('volunteer_experience', sa.JSON(), nullable=True),
        sa.Column('geographic_preferences', sa.JSON(), nullable=True),
        sa.Column('salary_expectations', sa.JSON(), nullable=True),
        sa.Column('last_assessment_date', sa.Date(), nullable=True),
        sa.Column('profile_completeness', sa.Numeric(precision=5, scale=2), nullable=False, server_default='0'),
        sa.Column('is_active', sa.Boolean(), nullable=False, server_default='true'),
        sa.Column('created_at', sa.DateTime(), nullable=False, server_default=sa.text('now()')),
        sa.Column('updated_at', sa.DateTime(), nullable=False, server_default=sa.text('now()')),
        sa.ForeignKeyConstraint(['institution_id'], ['institutions.id'], ondelete='CASCADE'),
        sa.ForeignKeyConstraint(['student_id'], ['students.id'], ondelete='CASCADE'),
        sa.PrimaryKeyConstraint('id'),
        sa.UniqueConstraint('institution_id', 'student_id', name='uq_student_career_profile')
    )
    op.create_index('idx_student_career_profile_institution', 'student_career_profiles', ['institution_id'])
    op.create_index('idx_student_career_profile_student', 'student_career_profiles', ['student_id'])
    op.create_index('idx_student_career_profile_personality', 'student_career_profiles', ['personality_type'])
    op.create_index('idx_student_career_profile_active', 'student_career_profiles', ['is_active'])

    op.create_table(
        'career_recommendations',
        sa.Column('id', sa.Integer(), nullable=False),
        sa.Column('institution_id', sa.Integer(), nullable=False),
        sa.Column('student_profile_id', sa.Integer(), nullable=False),
        sa.Column('career_pathway_id', sa.Integer(), nullable=False),
        sa.Column('match_score', sa.Numeric(precision=5, scale=2), nullable=False),
        sa.Column('confidence_level', sa.Numeric(precision=5, scale=2), nullable=False),
        sa.Column('skill_match_score', sa.Numeric(precision=5, scale=2), nullable=True),
        sa.Column('interest_match_score', sa.Numeric(precision=5, scale=2), nullable=True),
        sa.Column('personality_match_score', sa.Numeric(precision=5, scale=2), nullable=True),
        sa.Column('academic_match_score', sa.Numeric(precision=5, scale=2), nullable=True),
        sa.Column('matching_factors', sa.JSON(), nullable=True),
        sa.Column('recommendation_reasons', sa.JSON(), nullable=True),
        sa.Column('estimated_preparation_time', sa.String(length=100), nullable=True),
        sa.Column('difficulty_level', sa.String(length=20), nullable=True),
        sa.Column('status', sa.Enum('pending', 'accepted', 'rejected', 'in_progress', 'completed', 
                                   name='recommendationstatus'), nullable=False, server_default='pending'),
        sa.Column('student_feedback', sa.Text(), nullable=True),
        sa.Column('student_rating', sa.Integer(), nullable=True),
        sa.Column('rank', sa.Integer(), nullable=True),
        sa.Column('recommendation_date', sa.Date(), nullable=False),
        sa.Column('expires_at', sa.Date(), nullable=True),
        sa.Column('is_active', sa.Boolean(), nullable=False, server_default='true'),
        sa.Column('created_at', sa.DateTime(), nullable=False, server_default=sa.text('now()')),
        sa.Column('updated_at', sa.DateTime(), nullable=False, server_default=sa.text('now()')),
        sa.ForeignKeyConstraint(['institution_id'], ['institutions.id'], ondelete='CASCADE'),
        sa.ForeignKeyConstraint(['student_profile_id'], ['student_career_profiles.id'], ondelete='CASCADE'),
        sa.ForeignKeyConstraint(['career_pathway_id'], ['career_pathways.id'], ondelete='CASCADE'),
        sa.PrimaryKeyConstraint('id')
    )
    op.create_index('idx_career_recommendation_institution', 'career_recommendations', ['institution_id'])
    op.create_index('idx_career_recommendation_student', 'career_recommendations', ['student_profile_id'])
    op.create_index('idx_career_recommendation_pathway', 'career_recommendations', ['career_pathway_id'])
    op.create_index('idx_career_recommendation_score', 'career_recommendations', ['match_score'])
    op.create_index('idx_career_recommendation_status', 'career_recommendations', ['status'])
    op.create_index('idx_career_recommendation_date', 'career_recommendations', ['recommendation_date'])

    op.create_table(
        'skill_gap_analyses',
        sa.Column('id', sa.Integer(), nullable=False),
        sa.Column('institution_id', sa.Integer(), nullable=False),
        sa.Column('student_profile_id', sa.Integer(), nullable=False),
        sa.Column('career_pathway_id', sa.Integer(), nullable=False),
        sa.Column('required_skills', sa.JSON(), nullable=False),
        sa.Column('current_skills', sa.JSON(), nullable=False),
        sa.Column('skill_gaps', sa.JSON(), nullable=False),
        sa.Column('gap_severity', sa.String(length=20), nullable=True),
        sa.Column('estimated_time_to_close', sa.String(length=100), nullable=True),
        sa.Column('priority_skills', sa.JSON(), nullable=True),
        sa.Column('foundational_skills', sa.JSON(), nullable=True),
        sa.Column('advanced_skills', sa.JSON(), nullable=True),
        sa.Column('recommended_actions', sa.JSON(), nullable=True),
        sa.Column('learning_resources', sa.JSON(), nullable=True),
        sa.Column('analysis_date', sa.Date(), nullable=False),
        sa.Column('last_updated', sa.DateTime(), nullable=False, server_default=sa.text('now()')),
        sa.Column('is_active', sa.Boolean(), nullable=False, server_default='true'),
        sa.Column('created_at', sa.DateTime(), nullable=False, server_default=sa.text('now()')),
        sa.Column('updated_at', sa.DateTime(), nullable=False, server_default=sa.text('now()')),
        sa.ForeignKeyConstraint(['institution_id'], ['institutions.id'], ondelete='CASCADE'),
        sa.ForeignKeyConstraint(['student_profile_id'], ['student_career_profiles.id'], ondelete='CASCADE'),
        sa.ForeignKeyConstraint(['career_pathway_id'], ['career_pathways.id'], ondelete='CASCADE'),
        sa.PrimaryKeyConstraint('id')
    )
    op.create_index('idx_skill_gap_institution', 'skill_gap_analyses', ['institution_id'])
    op.create_index('idx_skill_gap_student', 'skill_gap_analyses', ['student_profile_id'])
    op.create_index('idx_skill_gap_pathway', 'skill_gap_analyses', ['career_pathway_id'])
    op.create_index('idx_skill_gap_date', 'skill_gap_analyses', ['analysis_date'])

    op.create_table(
        'personalized_learning_paths',
        sa.Column('id', sa.Integer(), nullable=False),
        sa.Column('institution_id', sa.Integer(), nullable=False),
        sa.Column('student_profile_id', sa.Integer(), nullable=False),
        sa.Column('title', sa.String(length=200), nullable=False),
        sa.Column('description', sa.Text(), nullable=True),
        sa.Column('target_career', sa.String(length=200), nullable=True),
        sa.Column('recommended_courses', sa.JSON(), nullable=False),
        sa.Column('recommended_certifications', sa.JSON(), nullable=True),
        sa.Column('recommended_extracurriculars', sa.JSON(), nullable=True),
        sa.Column('milestones', sa.JSON(), nullable=True),
        sa.Column('timeline', sa.JSON(), nullable=True),
        sa.Column('current_progress', sa.Numeric(precision=5, scale=2), nullable=False, server_default='0'),
        sa.Column('completed_items', sa.JSON(), nullable=True),
        sa.Column('in_progress_items', sa.JSON(), nullable=True),
        sa.Column('estimated_completion_date', sa.Date(), nullable=True),
        sa.Column('difficulty_level', sa.String(length=20), nullable=True),
        sa.Column('priority', sa.Integer(), nullable=False, server_default='1'),
        sa.Column('is_active', sa.Boolean(), nullable=False, server_default='true'),
        sa.Column('created_at', sa.DateTime(), nullable=False, server_default=sa.text('now()')),
        sa.Column('updated_at', sa.DateTime(), nullable=False, server_default=sa.text('now()')),
        sa.ForeignKeyConstraint(['institution_id'], ['institutions.id'], ondelete='CASCADE'),
        sa.ForeignKeyConstraint(['student_profile_id'], ['student_career_profiles.id'], ondelete='CASCADE'),
        sa.PrimaryKeyConstraint('id')
    )
    op.create_index('idx_learning_path_institution', 'personalized_learning_paths', ['institution_id'])
    op.create_index('idx_learning_path_student', 'personalized_learning_paths', ['student_profile_id'])
    op.create_index('idx_learning_path_active', 'personalized_learning_paths', ['is_active'])
    op.create_index('idx_learning_path_priority', 'personalized_learning_paths', ['priority'])

    op.create_table(
        'labor_market_data',
        sa.Column('id', sa.Integer(), nullable=False),
        sa.Column('career_title', sa.String(length=200), nullable=False),
        sa.Column('occupation_code', sa.String(length=50), nullable=True),
        sa.Column('industry', sa.String(length=100), nullable=True),
        sa.Column('total_jobs', sa.Integer(), nullable=True),
        sa.Column('job_growth_rate', sa.Numeric(precision=5, scale=2), nullable=True),
        sa.Column('projected_job_openings', sa.Integer(), nullable=True),
        sa.Column('median_salary', sa.Numeric(precision=12, scale=2), nullable=True),
        sa.Column('salary_range_min', sa.Numeric(precision=12, scale=2), nullable=True),
        sa.Column('salary_range_max', sa.Numeric(precision=12, scale=2), nullable=True),
        sa.Column('top_skills_demand', sa.JSON(), nullable=True),
        sa.Column('emerging_skills', sa.JSON(), nullable=True),
        sa.Column('geographic_data', sa.JSON(), nullable=True),
        sa.Column('industry_trends', sa.JSON(), nullable=True),
        sa.Column('automation_risk', sa.Numeric(precision=5, scale=2), nullable=True),
        sa.Column('remote_work_potential', sa.Numeric(precision=5, scale=2), nullable=True),
        sa.Column('data_source', sa.String(length=100), nullable=True),
        sa.Column('data_collection_date', sa.Date(), nullable=False),
        sa.Column('region', sa.String(length=100), nullable=True),
        sa.Column('is_active', sa.Boolean(), nullable=False, server_default='true'),
        sa.Column('created_at', sa.DateTime(), nullable=False, server_default=sa.text('now()')),
        sa.Column('updated_at', sa.DateTime(), nullable=False, server_default=sa.text('now()')),
        sa.PrimaryKeyConstraint('id')
    )
    op.create_index('idx_labor_market_career', 'labor_market_data', ['career_title'])
    op.create_index('idx_labor_market_code', 'labor_market_data', ['occupation_code'])
    op.create_index('idx_labor_market_industry', 'labor_market_data', ['industry'])
    op.create_index('idx_labor_market_date', 'labor_market_data', ['data_collection_date'])

    op.create_table(
        'industry_mentors',
        sa.Column('id', sa.Integer(), nullable=False),
        sa.Column('institution_id', sa.Integer(), nullable=True),
        sa.Column('first_name', sa.String(length=100), nullable=False),
        sa.Column('last_name', sa.String(length=100), nullable=False),
        sa.Column('email', sa.String(length=255), nullable=False),
        sa.Column('phone', sa.String(length=20), nullable=True),
        sa.Column('current_position', sa.String(length=200), nullable=False),
        sa.Column('company', sa.String(length=200), nullable=False),
        sa.Column('industry', sa.Enum('technology', 'healthcare', 'finance', 'education', 'manufacturing', 
                                     'retail', 'hospitality', 'construction', 'transportation', 
                                     'media_entertainment', 'agriculture', 'energy', 'government', 'nonprofit', 
                                     name='industrytype', create_type=False), nullable=False),
        sa.Column('years_of_experience', sa.Integer(), nullable=True),
        sa.Column('expertise_areas', sa.JSON(), nullable=False),
        sa.Column('career_path', sa.JSON(), nullable=True),
        sa.Column('bio', sa.Text(), nullable=True),
        sa.Column('linkedin_url', sa.String(length=500), nullable=True),
        sa.Column('photo_url', sa.String(length=500), nullable=True),
        sa.Column('mentoring_capacity', sa.Integer(), nullable=False, server_default='5'),
        sa.Column('current_mentees', sa.Integer(), nullable=False, server_default='0'),
        sa.Column('available_for_mentoring', sa.Boolean(), nullable=False, server_default='true'),
        sa.Column('preferred_communication', sa.JSON(), nullable=True),
        sa.Column('availability_schedule', sa.JSON(), nullable=True),
        sa.Column('personality_type', sa.Enum('realistic', 'investigative', 'artistic', 'social', 
                                             'enterprising', 'conventional', name='personalitytype', create_type=False), nullable=True),
        sa.Column('mentoring_style', sa.JSON(), nullable=True),
        sa.Column('total_mentorships', sa.Integer(), nullable=False, server_default='0'),
        sa.Column('average_rating', sa.Numeric(precision=3, scale=2), nullable=True),
        sa.Column('is_active', sa.Boolean(), nullable=False, server_default='true'),
        sa.Column('is_verified', sa.Boolean(), nullable=False, server_default='false'),
        sa.Column('verified_at', sa.DateTime(), nullable=True),
        sa.Column('created_at', sa.DateTime(), nullable=False, server_default=sa.text('now()')),
        sa.Column('updated_at', sa.DateTime(), nullable=False, server_default=sa.text('now()')),
        sa.ForeignKeyConstraint(['institution_id'], ['institutions.id'], ondelete='CASCADE'),
        sa.PrimaryKeyConstraint('id')
    )
    op.create_index('idx_industry_mentor_institution', 'industry_mentors', ['institution_id'])
    op.create_index('idx_industry_mentor_industry', 'industry_mentors', ['industry'])
    op.create_index('idx_industry_mentor_active', 'industry_mentors', ['is_active'])
    op.create_index('idx_industry_mentor_available', 'industry_mentors', ['available_for_mentoring'])
    op.create_index('idx_industry_mentor_email', 'industry_mentors', ['email'])

    op.create_table(
        'industry_mentor_matches',
        sa.Column('id', sa.Integer(), nullable=False),
        sa.Column('institution_id', sa.Integer(), nullable=False),
        sa.Column('student_profile_id', sa.Integer(), nullable=False),
        sa.Column('mentor_id', sa.Integer(), nullable=False),
        sa.Column('match_score', sa.Numeric(precision=5, scale=2), nullable=False),
        sa.Column('matching_criteria', sa.JSON(), nullable=True),
        sa.Column('status', sa.Enum('pending', 'matched', 'active', 'completed', 'cancelled', 
                                   name='mentorshipstatus'), nullable=False, server_default='pending'),
        sa.Column('start_date', sa.Date(), nullable=True),
        sa.Column('end_date', sa.Date(), nullable=True),
        sa.Column('duration_weeks', sa.Integer(), nullable=True),
        sa.Column('goals', sa.JSON(), nullable=True),
        sa.Column('meeting_frequency', sa.String(length=50), nullable=True),
        sa.Column('total_meetings', sa.Integer(), nullable=False, server_default='0'),
        sa.Column('progress_notes', sa.JSON(), nullable=True),
        sa.Column('student_feedback', sa.Text(), nullable=True),
        sa.Column('mentor_feedback', sa.Text(), nullable=True),
        sa.Column('student_rating', sa.Integer(), nullable=True),
        sa.Column('mentor_rating', sa.Integer(), nullable=True),
        sa.Column('is_active', sa.Boolean(), nullable=False, server_default='true'),
        sa.Column('created_at', sa.DateTime(), nullable=False, server_default=sa.text('now()')),
        sa.Column('updated_at', sa.DateTime(), nullable=False, server_default=sa.text('now()')),
        sa.ForeignKeyConstraint(['institution_id'], ['institutions.id'], ondelete='CASCADE'),
        sa.ForeignKeyConstraint(['student_profile_id'], ['student_career_profiles.id'], ondelete='CASCADE'),
        sa.ForeignKeyConstraint(['mentor_id'], ['industry_mentors.id'], ondelete='CASCADE'),
        sa.PrimaryKeyConstraint('id')
    )
    op.create_index('idx_mentor_match_institution', 'industry_mentor_matches', ['institution_id'])
    op.create_index('idx_mentor_match_student', 'industry_mentor_matches', ['student_profile_id'])
    op.create_index('idx_mentor_match_mentor', 'industry_mentor_matches', ['mentor_id'])
    op.create_index('idx_mentor_match_status', 'industry_mentor_matches', ['status'])
    op.create_index('idx_mentor_match_score', 'industry_mentor_matches', ['match_score'])


def downgrade():
    op.drop_index('idx_mentor_match_score', table_name='industry_mentor_matches')
    op.drop_index('idx_mentor_match_status', table_name='industry_mentor_matches')
    op.drop_index('idx_mentor_match_mentor', table_name='industry_mentor_matches')
    op.drop_index('idx_mentor_match_student', table_name='industry_mentor_matches')
    op.drop_index('idx_mentor_match_institution', table_name='industry_mentor_matches')
    op.drop_table('industry_mentor_matches')
    
    op.drop_index('idx_industry_mentor_email', table_name='industry_mentors')
    op.drop_index('idx_industry_mentor_available', table_name='industry_mentors')
    op.drop_index('idx_industry_mentor_active', table_name='industry_mentors')
    op.drop_index('idx_industry_mentor_industry', table_name='industry_mentors')
    op.drop_index('idx_industry_mentor_institution', table_name='industry_mentors')
    op.drop_table('industry_mentors')
    
    op.drop_index('idx_labor_market_date', table_name='labor_market_data')
    op.drop_index('idx_labor_market_industry', table_name='labor_market_data')
    op.drop_index('idx_labor_market_code', table_name='labor_market_data')
    op.drop_index('idx_labor_market_career', table_name='labor_market_data')
    op.drop_table('labor_market_data')
    
    op.drop_index('idx_learning_path_priority', table_name='personalized_learning_paths')
    op.drop_index('idx_learning_path_active', table_name='personalized_learning_paths')
    op.drop_index('idx_learning_path_student', table_name='personalized_learning_paths')
    op.drop_index('idx_learning_path_institution', table_name='personalized_learning_paths')
    op.drop_table('personalized_learning_paths')
    
    op.drop_index('idx_skill_gap_date', table_name='skill_gap_analyses')
    op.drop_index('idx_skill_gap_pathway', table_name='skill_gap_analyses')
    op.drop_index('idx_skill_gap_student', table_name='skill_gap_analyses')
    op.drop_index('idx_skill_gap_institution', table_name='skill_gap_analyses')
    op.drop_table('skill_gap_analyses')
    
    op.drop_index('idx_career_recommendation_date', table_name='career_recommendations')
    op.drop_index('idx_career_recommendation_status', table_name='career_recommendations')
    op.drop_index('idx_career_recommendation_score', table_name='career_recommendations')
    op.drop_index('idx_career_recommendation_pathway', table_name='career_recommendations')
    op.drop_index('idx_career_recommendation_student', table_name='career_recommendations')
    op.drop_index('idx_career_recommendation_institution', table_name='career_recommendations')
    op.drop_table('career_recommendations')
    
    op.drop_index('idx_student_career_profile_active', table_name='student_career_profiles')
    op.drop_index('idx_student_career_profile_personality', table_name='student_career_profiles')
    op.drop_index('idx_student_career_profile_student', table_name='student_career_profiles')
    op.drop_index('idx_student_career_profile_institution', table_name='student_career_profiles')
    op.drop_table('student_career_profiles')
    
    op.drop_index('idx_career_pathway_title', table_name='career_pathways')
    op.drop_index('idx_career_pathway_active', table_name='career_pathways')
    op.drop_index('idx_career_pathway_education', table_name='career_pathways')
    op.drop_index('idx_career_pathway_industry', table_name='career_pathways')
    op.drop_index('idx_career_pathway_category', table_name='career_pathways')
    op.drop_index('idx_career_pathway_institution', table_name='career_pathways')
    op.drop_table('career_pathways')
    
    op.execute('DROP TYPE IF EXISTS mentorshipstatus')
    op.execute('DROP TYPE IF EXISTS recommendationstatus')
    op.execute('DROP TYPE IF EXISTS personalitytype')
    op.execute('DROP TYPE IF EXISTS educationlevel')
    op.execute('DROP TYPE IF EXISTS industrytype')
    op.execute('DROP TYPE IF EXISTS careerinterestcategory')
