from datetime import datetime, date
from sqlalchemy import Column, Integer, String, Boolean, DateTime, ForeignKey, Date, Text, Numeric, Index, UniqueConstraint, Enum as SQLEnum, JSON, Float
from sqlalchemy.orm import relationship
from enum import Enum
from src.database import Base


class CareerInterestCategory(str, Enum):
    STEM = "stem"
    ARTS_HUMANITIES = "arts_humanities"
    BUSINESS = "business"
    HEALTHCARE = "healthcare"
    EDUCATION = "education"
    ENGINEERING = "engineering"
    TECHNOLOGY = "technology"
    SOCIAL_SERVICES = "social_services"
    CREATIVE_ARTS = "creative_arts"
    LAW_GOVERNMENT = "law_government"
    SPORTS_FITNESS = "sports_fitness"
    SKILLED_TRADES = "skilled_trades"


class PersonalityType(str, Enum):
    REALISTIC = "realistic"
    INVESTIGATIVE = "investigative"
    ARTISTIC = "artistic"
    SOCIAL = "social"
    ENTERPRISING = "enterprising"
    CONVENTIONAL = "conventional"


class EducationLevel(str, Enum):
    HIGH_SCHOOL = "high_school"
    ASSOCIATE_DEGREE = "associate_degree"
    BACHELOR_DEGREE = "bachelor_degree"
    MASTER_DEGREE = "master_degree"
    DOCTORAL_DEGREE = "doctoral_degree"
    PROFESSIONAL_DEGREE = "professional_degree"
    CERTIFICATION = "certification"
    DIPLOMA = "diploma"


class IndustryType(str, Enum):
    TECHNOLOGY = "technology"
    HEALTHCARE = "healthcare"
    FINANCE = "finance"
    EDUCATION = "education"
    MANUFACTURING = "manufacturing"
    RETAIL = "retail"
    HOSPITALITY = "hospitality"
    CONSTRUCTION = "construction"
    TRANSPORTATION = "transportation"
    MEDIA_ENTERTAINMENT = "media_entertainment"
    AGRICULTURE = "agriculture"
    ENERGY = "energy"
    GOVERNMENT = "government"
    NONPROFIT = "nonprofit"


class SkillLevel(str, Enum):
    BEGINNER = "beginner"
    INTERMEDIATE = "intermediate"
    ADVANCED = "advanced"
    EXPERT = "expert"


class RecommendationStatus(str, Enum):
    PENDING = "pending"
    ACCEPTED = "accepted"
    REJECTED = "rejected"
    IN_PROGRESS = "in_progress"
    COMPLETED = "completed"


class MentorshipStatus(str, Enum):
    PENDING = "pending"
    MATCHED = "matched"
    ACTIVE = "active"
    COMPLETED = "completed"
    CANCELLED = "cancelled"


class CareerPathway(Base):
    __tablename__ = "career_pathways"
    
    id = Column(Integer, primary_key=True, index=True)
    institution_id = Column(Integer, ForeignKey('institutions.id', ondelete='CASCADE'), nullable=True, index=True)
    
    title = Column(String(200), nullable=False, index=True)
    description = Column(Text, nullable=False)
    category = Column(SQLEnum(CareerInterestCategory), nullable=False, index=True)
    industry = Column(SQLEnum(IndustryType), nullable=False, index=True)
    
    required_education = Column(SQLEnum(EducationLevel), nullable=False)
    optional_education = Column(JSON, nullable=True)
    
    required_skills = Column(JSON, nullable=False)
    preferred_skills = Column(JSON, nullable=True)
    
    personality_match = Column(JSON, nullable=True)
    
    average_salary_min = Column(Numeric(12, 2), nullable=True)
    average_salary_max = Column(Numeric(12, 2), nullable=True)
    salary_currency = Column(String(10), default="USD", nullable=False)
    
    job_growth_rate = Column(Numeric(5, 2), nullable=True)
    demand_level = Column(String(20), nullable=True)
    market_outlook = Column(Text, nullable=True)
    
    typical_courses = Column(JSON, nullable=True)
    certifications = Column(JSON, nullable=True)
    extracurricular_activities = Column(JSON, nullable=True)
    
    work_environment = Column(Text, nullable=True)
    typical_tasks = Column(JSON, nullable=True)
    career_progression = Column(JSON, nullable=True)
    
    related_careers = Column(JSON, nullable=True)
    industry_connections = Column(JSON, nullable=True)
    
    data_sources = Column(JSON, nullable=True)
    last_updated_from_api = Column(DateTime, nullable=True)
    
    is_active = Column(Boolean, default=True, nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow, nullable=False)
    
    institution = relationship("Institution")
    recommendations = relationship("CareerRecommendation", back_populates="career_pathway", cascade="all, delete-orphan")
    skill_gaps = relationship("SkillGapAnalysis", back_populates="career_pathway", cascade="all, delete-orphan")
    
    __table_args__ = (
        Index('idx_career_pathway_institution', 'institution_id'),
        Index('idx_career_pathway_category', 'category'),
        Index('idx_career_pathway_industry', 'industry'),
        Index('idx_career_pathway_education', 'required_education'),
        Index('idx_career_pathway_active', 'is_active'),
    )


class StudentCareerProfile(Base):
    __tablename__ = "student_career_profiles"
    
    id = Column(Integer, primary_key=True, index=True)
    institution_id = Column(Integer, ForeignKey('institutions.id', ondelete='CASCADE'), nullable=False, index=True)
    student_id = Column(Integer, ForeignKey('students.id', ondelete='CASCADE'), nullable=False, index=True)
    
    interests = Column(JSON, nullable=True)
    strengths = Column(JSON, nullable=True)
    personality_type = Column(SQLEnum(PersonalityType), nullable=True, index=True)
    personality_assessment_data = Column(JSON, nullable=True)
    
    current_skills = Column(JSON, nullable=True)
    skill_proficiency = Column(JSON, nullable=True)
    
    career_goals = Column(JSON, nullable=True)
    preferred_industries = Column(JSON, nullable=True)
    preferred_work_environment = Column(JSON, nullable=True)
    
    academic_performance_summary = Column(JSON, nullable=True)
    top_subjects = Column(JSON, nullable=True)
    
    extracurricular_activities = Column(JSON, nullable=True)
    achievements = Column(JSON, nullable=True)
    
    work_experience = Column(JSON, nullable=True)
    volunteer_experience = Column(JSON, nullable=True)
    
    geographic_preferences = Column(JSON, nullable=True)
    salary_expectations = Column(JSON, nullable=True)
    
    last_assessment_date = Column(Date, nullable=True)
    profile_completeness = Column(Numeric(5, 2), default=0, nullable=False)
    
    is_active = Column(Boolean, default=True, nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow, nullable=False)
    
    institution = relationship("Institution")
    student = relationship("Student")
    recommendations = relationship("CareerRecommendation", back_populates="student_profile", cascade="all, delete-orphan")
    skill_gaps = relationship("SkillGapAnalysis", back_populates="student_profile", cascade="all, delete-orphan")
    learning_paths = relationship("PersonalizedLearningPath", back_populates="student_profile", cascade="all, delete-orphan")
    mentor_matches = relationship("IndustryMentorMatch", foreign_keys="[IndustryMentorMatch.student_profile_id]", back_populates="student_profile", cascade="all, delete-orphan")
    
    __table_args__ = (
        UniqueConstraint('institution_id', 'student_id', name='uq_student_career_profile'),
        Index('idx_student_career_profile_institution', 'institution_id'),
        Index('idx_student_career_profile_student', 'student_id'),
        Index('idx_student_career_profile_personality', 'personality_type'),
        Index('idx_student_career_profile_active', 'is_active'),
    )


class CareerRecommendation(Base):
    __tablename__ = "career_recommendations"
    
    id = Column(Integer, primary_key=True, index=True)
    institution_id = Column(Integer, ForeignKey('institutions.id', ondelete='CASCADE'), nullable=False, index=True)
    student_profile_id = Column(Integer, ForeignKey('student_career_profiles.id', ondelete='CASCADE'), nullable=False, index=True)
    career_pathway_id = Column(Integer, ForeignKey('career_pathways.id', ondelete='CASCADE'), nullable=False, index=True)
    
    match_score = Column(Numeric(5, 2), nullable=False)
    confidence_level = Column(Numeric(5, 2), nullable=False)
    
    skill_match_score = Column(Numeric(5, 2), nullable=True)
    interest_match_score = Column(Numeric(5, 2), nullable=True)
    personality_match_score = Column(Numeric(5, 2), nullable=True)
    academic_match_score = Column(Numeric(5, 2), nullable=True)
    
    matching_factors = Column(JSON, nullable=True)
    recommendation_reasons = Column(JSON, nullable=True)
    
    estimated_preparation_time = Column(String(100), nullable=True)
    difficulty_level = Column(String(20), nullable=True)
    
    status = Column(SQLEnum(RecommendationStatus), default=RecommendationStatus.PENDING, nullable=False, index=True)
    student_feedback = Column(Text, nullable=True)
    student_rating = Column(Integer, nullable=True)
    
    rank = Column(Integer, nullable=True)
    recommendation_date = Column(Date, default=date.today, nullable=False, index=True)
    expires_at = Column(Date, nullable=True)
    
    is_active = Column(Boolean, default=True, nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow, nullable=False)
    
    institution = relationship("Institution")
    student_profile = relationship("StudentCareerProfile", back_populates="recommendations")
    career_pathway = relationship("CareerPathway", back_populates="recommendations")
    
    __table_args__ = (
        Index('idx_career_recommendation_institution', 'institution_id'),
        Index('idx_career_recommendation_student', 'student_profile_id'),
        Index('idx_career_recommendation_pathway', 'career_pathway_id'),
        Index('idx_career_recommendation_score', 'match_score'),
        Index('idx_career_recommendation_status', 'status'),
        Index('idx_career_recommendation_date', 'recommendation_date'),
    )


class SkillGapAnalysis(Base):
    __tablename__ = "skill_gap_analyses"
    
    id = Column(Integer, primary_key=True, index=True)
    institution_id = Column(Integer, ForeignKey('institutions.id', ondelete='CASCADE'), nullable=False, index=True)
    student_profile_id = Column(Integer, ForeignKey('student_career_profiles.id', ondelete='CASCADE'), nullable=False, index=True)
    career_pathway_id = Column(Integer, ForeignKey('career_pathways.id', ondelete='CASCADE'), nullable=False, index=True)
    
    required_skills = Column(JSON, nullable=False)
    current_skills = Column(JSON, nullable=False)
    skill_gaps = Column(JSON, nullable=False)
    
    gap_severity = Column(String(20), nullable=True)
    estimated_time_to_close = Column(String(100), nullable=True)
    
    priority_skills = Column(JSON, nullable=True)
    foundational_skills = Column(JSON, nullable=True)
    advanced_skills = Column(JSON, nullable=True)
    
    recommended_actions = Column(JSON, nullable=True)
    learning_resources = Column(JSON, nullable=True)
    
    analysis_date = Column(Date, default=date.today, nullable=False, index=True)
    last_updated = Column(DateTime, default=datetime.utcnow, nullable=False)
    
    is_active = Column(Boolean, default=True, nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow, nullable=False)
    
    institution = relationship("Institution")
    student_profile = relationship("StudentCareerProfile", back_populates="skill_gaps")
    career_pathway = relationship("CareerPathway", back_populates="skill_gaps")
    
    __table_args__ = (
        Index('idx_skill_gap_institution', 'institution_id'),
        Index('idx_skill_gap_student', 'student_profile_id'),
        Index('idx_skill_gap_pathway', 'career_pathway_id'),
        Index('idx_skill_gap_date', 'analysis_date'),
    )


class PersonalizedLearningPath(Base):
    __tablename__ = "personalized_learning_paths"
    
    id = Column(Integer, primary_key=True, index=True)
    institution_id = Column(Integer, ForeignKey('institutions.id', ondelete='CASCADE'), nullable=False, index=True)
    student_profile_id = Column(Integer, ForeignKey('student_career_profiles.id', ondelete='CASCADE'), nullable=False, index=True)
    
    title = Column(String(200), nullable=False)
    description = Column(Text, nullable=True)
    target_career = Column(String(200), nullable=True)
    
    recommended_courses = Column(JSON, nullable=False)
    recommended_certifications = Column(JSON, nullable=True)
    recommended_extracurriculars = Column(JSON, nullable=True)
    
    milestones = Column(JSON, nullable=True)
    timeline = Column(JSON, nullable=True)
    
    current_progress = Column(Numeric(5, 2), default=0, nullable=False)
    completed_items = Column(JSON, nullable=True)
    in_progress_items = Column(JSON, nullable=True)
    
    estimated_completion_date = Column(Date, nullable=True)
    difficulty_level = Column(String(20), nullable=True)
    
    priority = Column(Integer, default=1, nullable=False)
    is_active = Column(Boolean, default=True, nullable=False)
    
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow, nullable=False)
    
    institution = relationship("Institution")
    student_profile = relationship("StudentCareerProfile", back_populates="learning_paths")
    
    __table_args__ = (
        Index('idx_personalized_learning_path_institution', 'institution_id'),
        Index('idx_personalized_learning_path_student', 'student_profile_id'),
        Index('idx_personalized_learning_path_active', 'is_active'),
        Index('idx_learning_path_priority', 'priority'),
    )


class LaborMarketData(Base):
    __tablename__ = "labor_market_data"
    
    id = Column(Integer, primary_key=True, index=True)
    
    career_title = Column(String(200), nullable=False, index=True)
    occupation_code = Column(String(50), nullable=True, index=True)
    industry = Column(String(100), nullable=True, index=True)
    
    total_jobs = Column(Integer, nullable=True)
    job_growth_rate = Column(Numeric(5, 2), nullable=True)
    projected_job_openings = Column(Integer, nullable=True)
    
    median_salary = Column(Numeric(12, 2), nullable=True)
    salary_range_min = Column(Numeric(12, 2), nullable=True)
    salary_range_max = Column(Numeric(12, 2), nullable=True)
    
    top_skills_demand = Column(JSON, nullable=True)
    emerging_skills = Column(JSON, nullable=True)
    
    geographic_data = Column(JSON, nullable=True)
    industry_trends = Column(JSON, nullable=True)
    
    automation_risk = Column(Numeric(5, 2), nullable=True)
    remote_work_potential = Column(Numeric(5, 2), nullable=True)
    
    data_source = Column(String(100), nullable=True)
    data_collection_date = Column(Date, nullable=False, index=True)
    region = Column(String(100), nullable=True)
    
    is_active = Column(Boolean, default=True, nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow, nullable=False)
    
    __table_args__ = (
        Index('idx_labor_market_career', 'career_title'),
        Index('idx_labor_market_code', 'occupation_code'),
        Index('idx_labor_market_industry', 'industry'),
        Index('idx_labor_market_date', 'data_collection_date'),
    )


class IndustryMentor(Base):
    __tablename__ = "industry_mentors"
    
    id = Column(Integer, primary_key=True, index=True)
    institution_id = Column(Integer, ForeignKey('institutions.id', ondelete='CASCADE'), nullable=True, index=True)
    
    first_name = Column(String(100), nullable=False)
    last_name = Column(String(100), nullable=False)
    email = Column(String(255), nullable=False, index=True)
    phone = Column(String(20), nullable=True)
    
    current_position = Column(String(200), nullable=False)
    company = Column(String(200), nullable=False)
    industry = Column(SQLEnum(IndustryType), nullable=False, index=True)
    
    years_of_experience = Column(Integer, nullable=True)
    expertise_areas = Column(JSON, nullable=False)
    career_path = Column(JSON, nullable=True)
    
    bio = Column(Text, nullable=True)
    linkedin_url = Column(String(500), nullable=True)
    photo_url = Column(String(500), nullable=True)
    
    mentoring_capacity = Column(Integer, default=5, nullable=False)
    current_mentees = Column(Integer, default=0, nullable=False)
    
    available_for_mentoring = Column(Boolean, default=True, nullable=False)
    preferred_communication = Column(JSON, nullable=True)
    availability_schedule = Column(JSON, nullable=True)
    
    personality_type = Column(SQLEnum(PersonalityType), nullable=True)
    mentoring_style = Column(JSON, nullable=True)
    
    total_mentorships = Column(Integer, default=0, nullable=False)
    average_rating = Column(Numeric(3, 2), nullable=True)
    
    is_active = Column(Boolean, default=True, nullable=False)
    is_verified = Column(Boolean, default=False, nullable=False)
    verified_at = Column(DateTime, nullable=True)
    
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow, nullable=False)
    
    institution = relationship("Institution")
    mentor_matches = relationship("IndustryMentorMatch", back_populates="mentor", cascade="all, delete-orphan")
    
    __table_args__ = (
        Index('idx_industry_mentor_institution', 'institution_id'),
        Index('idx_industry_mentor_industry', 'industry'),
        Index('idx_industry_mentor_active', 'is_active'),
        Index('idx_industry_mentor_available', 'available_for_mentoring'),
    )


class IndustryMentorMatch(Base):
    __tablename__ = "industry_mentor_matches"
    
    id = Column(Integer, primary_key=True, index=True)
    institution_id = Column(Integer, ForeignKey('institutions.id', ondelete='CASCADE'), nullable=False, index=True)
    student_profile_id = Column(Integer, ForeignKey('student_career_profiles.id', ondelete='CASCADE'), nullable=False, index=True)
    mentor_id = Column(Integer, ForeignKey('industry_mentors.id', ondelete='CASCADE'), nullable=False, index=True)
    
    match_score = Column(Numeric(5, 2), nullable=False)
    matching_criteria = Column(JSON, nullable=True)
    
    status = Column(SQLEnum(MentorshipStatus), default=MentorshipStatus.PENDING, nullable=False, index=True)
    
    start_date = Column(Date, nullable=True)
    end_date = Column(Date, nullable=True)
    duration_weeks = Column(Integer, nullable=True)
    
    goals = Column(JSON, nullable=True)
    meeting_frequency = Column(String(50), nullable=True)
    total_meetings = Column(Integer, default=0, nullable=False)
    
    progress_notes = Column(JSON, nullable=True)
    student_feedback = Column(Text, nullable=True)
    mentor_feedback = Column(Text, nullable=True)
    
    student_rating = Column(Integer, nullable=True)
    mentor_rating = Column(Integer, nullable=True)
    
    is_active = Column(Boolean, default=True, nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow, nullable=False)
    
    institution = relationship("Institution")
    student_profile = relationship("StudentCareerProfile", back_populates="mentor_matches")
    mentor = relationship("IndustryMentor", back_populates="mentor_matches")
    
    __table_args__ = (
        Index('idx_mentor_match_institution', 'institution_id'),
        Index('idx_mentor_match_student', 'student_profile_id'),
        Index('idx_mentor_match_mentor', 'mentor_id'),
        Index('idx_mentor_match_status', 'status'),
        Index('idx_mentor_match_score', 'match_score'),
    )
