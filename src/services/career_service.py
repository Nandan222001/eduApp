from typing import Dict, List, Optional, Any, Tuple
from sqlalchemy.orm import Session, joinedload
from sqlalchemy import and_, or_, desc, func
from datetime import date, datetime, timedelta
from fastapi import HTTPException, status
import requests
import json

from src.models.career import (
    CareerPathway, StudentCareerProfile, CareerRecommendation,
    SkillGapAnalysis, PersonalizedLearningPath, LaborMarketData,
    IndustryMentor, IndustryMentorMatch, RecommendationStatus,
    MentorshipStatus, CareerInterestCategory, IndustryType
)
from src.models.student import Student
from src.models.examination import ExamMarks, ExamResult, ExamSubject
from src.models.assignment import Submission
from src.models.attendance import Attendance
from src.ml.career_recommender import CareerRecommenderModel


class CareerService:
    
    def __init__(self, db: Session):
        self.db = db
        self.recommender = CareerRecommenderModel()
    
    def create_career_pathway(
        self,
        pathway_data: Dict[str, Any]
    ) -> CareerPathway:
        pathway = CareerPathway(**pathway_data)
        self.db.add(pathway)
        self.db.commit()
        self.db.refresh(pathway)
        return pathway
    
    def get_career_pathway(self, pathway_id: int) -> Optional[CareerPathway]:
        return self.db.query(CareerPathway).filter(
            CareerPathway.id == pathway_id,
            CareerPathway.is_active == True
        ).first()
    
    def list_career_pathways(
        self,
        institution_id: Optional[int] = None,
        category: Optional[str] = None,
        industry: Optional[str] = None,
        limit: int = 50,
        offset: int = 0
    ) -> List[CareerPathway]:
        query = self.db.query(CareerPathway).filter(
            CareerPathway.is_active == True
        )
        
        if institution_id:
            query = query.filter(
                or_(
                    CareerPathway.institution_id == institution_id,
                    CareerPathway.institution_id.is_(None)
                )
            )
        
        if category:
            query = query.filter(CareerPathway.category == category)
        
        if industry:
            query = query.filter(CareerPathway.industry == industry)
        
        return query.offset(offset).limit(limit).all()
    
    def update_career_pathway(
        self,
        pathway_id: int,
        update_data: Dict[str, Any]
    ) -> Optional[CareerPathway]:
        pathway = self.get_career_pathway(pathway_id)
        if not pathway:
            return None
        
        for key, value in update_data.items():
            if hasattr(pathway, key):
                setattr(pathway, key, value)
        
        self.db.commit()
        self.db.refresh(pathway)
        return pathway
    
    def create_or_update_student_profile(
        self,
        student_id: int,
        institution_id: int,
        profile_data: Dict[str, Any]
    ) -> StudentCareerProfile:
        profile = self.db.query(StudentCareerProfile).filter(
            StudentCareerProfile.student_id == student_id,
            StudentCareerProfile.institution_id == institution_id
        ).first()
        
        if profile:
            for key, value in profile_data.items():
                if hasattr(profile, key):
                    setattr(profile, key, value)
            profile.updated_at = datetime.utcnow()
        else:
            profile_data['student_id'] = student_id
            profile_data['institution_id'] = institution_id
            profile = StudentCareerProfile(**profile_data)
            self.db.add(profile)
        
        profile.profile_completeness = self._calculate_profile_completeness(profile)
        
        self.db.commit()
        self.db.refresh(profile)
        return profile
    
    def get_student_profile(
        self,
        student_id: int,
        institution_id: int
    ) -> Optional[StudentCareerProfile]:
        return self.db.query(StudentCareerProfile).filter(
            StudentCareerProfile.student_id == student_id,
            StudentCareerProfile.institution_id == institution_id,
            StudentCareerProfile.is_active == True
        ).first()
    
    def _calculate_profile_completeness(
        self,
        profile: StudentCareerProfile
    ) -> float:
        fields = [
            'interests', 'strengths', 'personality_type',
            'current_skills', 'career_goals', 'preferred_industries',
            'academic_performance_summary', 'top_subjects',
            'extracurricular_activities'
        ]
        
        completed = 0
        for field in fields:
            value = getattr(profile, field, None)
            if value:
                if isinstance(value, (list, dict)) and len(value) > 0:
                    completed += 1
                elif isinstance(value, str) and value.strip():
                    completed += 1
        
        return round((completed / len(fields)) * 100, 2)
    
    def build_student_profile_from_data(
        self,
        student_id: int,
        institution_id: int
    ) -> Dict[str, Any]:
        student = self.db.query(Student).filter(
            Student.id == student_id,
            Student.institution_id == institution_id
        ).first()
        
        if not student:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Student not found"
            )
        
        academic_performance = self._get_academic_performance(student_id)
        top_subjects = self._get_top_subjects(student_id)
        
        profile_data = {
            'academic_performance_summary': academic_performance,
            'top_subjects': top_subjects
        }
        
        return profile_data
    
    def _get_academic_performance(self, student_id: int) -> Dict[str, Any]:
        # `ExamMarks` has no `subject_id`/`marks_obtained`/`total_marks`
        # columns of its own (model/schema drift, bug class 11) -- marks are
        # split into `theory_marks_obtained`/`practical_marks_obtained`, and
        # the corresponding max marks (`theory_max_marks`/
        # `practical_max_marks`) live on the joined `ExamSubject` row via
        # `exam_subject_id`. This previously raised `AttributeError` on
        # every call with at least one exam record for the student.
        exam_marks = self.db.query(ExamMarks).join(
            ExamSubject, ExamMarks.exam_subject_id == ExamSubject.id
        ).filter(
            ExamMarks.student_id == student_id
        ).all()

        if not exam_marks:
            return {
                'overall_gpa': 0,
                'average_score': 0,
                'attendance_percentage': 0
            }

        total_marks = sum(
            float(mark.theory_marks_obtained or 0) + float(mark.practical_marks_obtained or 0)
            for mark in exam_marks
        )
        max_marks = sum(
            float(mark.exam_subject.theory_max_marks or 0) + float(mark.exam_subject.practical_max_marks or 0)
            for mark in exam_marks
        )
        average_score = (total_marks / max_marks * 100) if max_marks > 0 else 0
        
        attendance_records = self.db.query(Attendance).filter(
            Attendance.student_id == student_id
        ).all()
        
        total_days = len(attendance_records)
        present_days = sum(1 for a in attendance_records if a.status == 'present')
        attendance_percentage = (present_days / total_days * 100) if total_days > 0 else 0
        
        return {
            'overall_gpa': round(average_score / 25, 2),
            'average_score': round(average_score, 2),
            'attendance_percentage': round(attendance_percentage, 2),
            'total_exams': len(exam_marks)
        }
    
    def _get_top_subjects(self, student_id: int) -> List[Dict[str, Any]]:
        # Same drift as `_get_academic_performance` above: `subject_id` and
        # the max-marks columns live on the joined `ExamSubject`, not on
        # `ExamMarks` itself -- this previously raised `AttributeError:
        # type object 'ExamMarks' has no attribute 'subject_id'`
        # unconditionally, even with zero exam records (the bad column
        # reference is built into the query itself).
        exam_marks = self.db.query(
            ExamSubject.subject_id,
            func.avg(
                func.coalesce(ExamMarks.theory_marks_obtained, 0)
                + func.coalesce(ExamMarks.practical_marks_obtained, 0)
            ).label('avg_marks'),
            func.avg(
                func.coalesce(ExamSubject.theory_max_marks, 0)
                + func.coalesce(ExamSubject.practical_max_marks, 0)
            ).label('avg_total')
        ).join(
            ExamSubject, ExamMarks.exam_subject_id == ExamSubject.id
        ).filter(
            ExamMarks.student_id == student_id
        ).group_by(
            ExamSubject.subject_id
        ).all()
        
        subjects = []
        for mark in exam_marks:
            if mark.avg_total and mark.avg_total > 0:
                # `func.avg(...)` returns a `Decimal` via pymysql (bug class
                # 4) -- explicitly cast to float before this dict is stored
                # in `StudentCareerProfile.top_subjects` (a JSON column):
                # Decimal isn't JSON-serializable, so committing a Decimal
                # here raised a TypeError on every call with exam data.
                percentage = (float(mark.avg_marks) / float(mark.avg_total)) * 100
                subjects.append({
                    'subject_id': mark.subject_id,
                    'score': round(percentage, 2)
                })
        
        subjects.sort(key=lambda x: x['score'], reverse=True)
        return subjects[:5]
    
    def generate_career_recommendations(
        self,
        student_id: int,
        institution_id: int,
        top_n: int = 10
    ) -> List[CareerRecommendation]:
        student_profile = self.get_student_profile(student_id, institution_id)
        
        if not student_profile:
            auto_profile = self.build_student_profile_from_data(student_id, institution_id)
            student_profile = self.create_or_update_student_profile(
                student_id, institution_id, auto_profile
            )
        
        career_pathways = self.list_career_pathways(
            institution_id=institution_id,
            limit=100
        )
        
        if not career_pathways:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="No career pathways available"
            )
        
        student_profile_dict = {
            'personality_type': student_profile.personality_type,
            'interests': student_profile.interests or [],
            'current_skills': student_profile.current_skills or [],
            'top_subjects': student_profile.top_subjects or [],
            'academic_performance_summary': student_profile.academic_performance_summary or {},
            'extracurricular_activities': student_profile.extracurricular_activities or [],
            'achievements': student_profile.achievements or []
        }
        
        career_pathways_dict = []
        for pathway in career_pathways:
            career_pathways_dict.append({
                'id': pathway.id,
                'title': pathway.title,
                'category': pathway.category,
                'industry': pathway.industry,
                'required_education': pathway.required_education,
                'required_skills': pathway.required_skills or [],
                'personality_match': pathway.personality_match or [],
                'job_growth_rate': float(pathway.job_growth_rate) if pathway.job_growth_rate else 0,
                'demand_level': pathway.demand_level,
                'average_salary_min': float(pathway.average_salary_min) if pathway.average_salary_min else 0,
                'average_salary_max': float(pathway.average_salary_max) if pathway.average_salary_max else 0
            })
        
        recommendations_data = self.recommender.generate_recommendations(
            student_profile_dict,
            career_pathways_dict,
            top_n=top_n
        )
        
        self.db.query(CareerRecommendation).filter(
            CareerRecommendation.student_profile_id == student_profile.id,
            CareerRecommendation.is_active == True
        ).update({'is_active': False})
        
        recommendations = []
        for rec_data in recommendations_data:
            recommendation = CareerRecommendation(
                institution_id=institution_id,
                student_profile_id=student_profile.id,
                career_pathway_id=rec_data['career_pathway_id'],
                match_score=rec_data['match_score'],
                confidence_level=rec_data['confidence_level'],
                skill_match_score=rec_data['skill_match_score'],
                interest_match_score=rec_data['interest_match_score'],
                personality_match_score=rec_data['personality_match_score'],
                academic_match_score=rec_data['academic_match_score'],
                matching_factors=rec_data['matching_factors'],
                recommendation_reasons=rec_data['recommendation_reasons'],
                estimated_preparation_time=rec_data['estimated_preparation_time'],
                difficulty_level=rec_data['difficulty_level'],
                rank=rec_data['rank'],
                status=RecommendationStatus.PENDING
            )
            self.db.add(recommendation)
            recommendations.append(recommendation)
        
        self.db.commit()
        return recommendations
    
    def get_student_recommendations(
        self,
        student_id: int,
        institution_id: int
    ) -> List[CareerRecommendation]:
        student_profile = self.get_student_profile(student_id, institution_id)
        
        if not student_profile:
            return []
        
        return self.db.query(CareerRecommendation).options(
            joinedload(CareerRecommendation.career_pathway)
        ).filter(
            CareerRecommendation.student_profile_id == student_profile.id,
            CareerRecommendation.is_active == True
        ).order_by(CareerRecommendation.rank).all()
    
    def analyze_skill_gap(
        self,
        student_id: int,
        institution_id: int,
        career_pathway_id: int
    ) -> SkillGapAnalysis:
        student_profile = self.get_student_profile(student_id, institution_id)
        
        if not student_profile:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Student career profile not found"
            )
        
        career_pathway = self.get_career_pathway(career_pathway_id)
        
        if not career_pathway:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Career pathway not found"
            )
        
        student_profile_dict = {
            'current_skills': student_profile.current_skills or []
        }
        
        career_pathway_dict = {
            'required_skills': career_pathway.required_skills or []
        }
        
        gap_analysis = self.recommender.analyze_skill_gap(
            student_profile_dict,
            career_pathway_dict
        )
        
        existing_analysis = self.db.query(SkillGapAnalysis).filter(
            SkillGapAnalysis.student_profile_id == student_profile.id,
            SkillGapAnalysis.career_pathway_id == career_pathway_id,
            SkillGapAnalysis.is_active == True
        ).first()
        
        if existing_analysis:
            for key, value in gap_analysis.items():
                if hasattr(existing_analysis, key):
                    setattr(existing_analysis, key, value)
            existing_analysis.last_updated = datetime.utcnow()
            analysis = existing_analysis
        else:
            analysis = SkillGapAnalysis(
                institution_id=institution_id,
                student_profile_id=student_profile.id,
                career_pathway_id=career_pathway_id,
                **gap_analysis
            )
            self.db.add(analysis)
        
        self.db.commit()
        self.db.refresh(analysis)
        return analysis
    
    def create_personalized_learning_path(
        self,
        student_id: int,
        institution_id: int,
        career_pathway_id: int
    ) -> PersonalizedLearningPath:
        student_profile = self.get_student_profile(student_id, institution_id)
        
        if not student_profile:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Student career profile not found"
            )
        
        career_pathway = self.get_career_pathway(career_pathway_id)
        
        if not career_pathway:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Career pathway not found"
            )
        
        skill_gap = self.analyze_skill_gap(student_id, institution_id, career_pathway_id)
        
        recommended_courses = self._generate_course_recommendations(
            career_pathway,
            skill_gap
        )
        
        recommended_certifications = career_pathway.certifications or []
        
        recommended_extracurriculars = career_pathway.extracurricular_activities or []
        
        milestones = self._generate_milestones(
            career_pathway,
            skill_gap
        )
        
        timeline = self._generate_timeline(milestones)
        
        learning_path = PersonalizedLearningPath(
            institution_id=institution_id,
            student_profile_id=student_profile.id,
            title=f"Path to {career_pathway.title}",
            description=f"Personalized learning path to become a {career_pathway.title}",
            target_career=career_pathway.title,
            recommended_courses=recommended_courses,
            recommended_certifications=recommended_certifications,
            recommended_extracurriculars=recommended_extracurriculars,
            milestones=milestones,
            timeline=timeline,
            current_progress=0,
            estimated_completion_date=self._calculate_completion_date(timeline),
            difficulty_level=self._get_learning_path_difficulty(skill_gap)
        )
        
        self.db.add(learning_path)
        self.db.commit()
        self.db.refresh(learning_path)
        return learning_path
    
    def _generate_course_recommendations(
        self,
        career_pathway: CareerPathway,
        skill_gap: SkillGapAnalysis
    ) -> List[Dict[str, Any]]:
        courses = []
        
        typical_courses = career_pathway.typical_courses or []
        courses.extend(typical_courses)
        
        for skill in skill_gap.priority_skills or []:
            courses.append({
                'title': f"Fundamentals of {skill['name']}",
                'type': 'Core Skill',
                'priority': 'High',
                'estimated_duration': '8-12 weeks'
            })
        
        for skill in skill_gap.foundational_skills or []:
            if skill not in (skill_gap.priority_skills or []):
                courses.append({
                    'title': f"Introduction to {skill['name']}",
                    'type': 'Foundation',
                    'priority': 'Medium',
                    'estimated_duration': '4-8 weeks'
                })
        
        return courses[:15]
    
    def _generate_milestones(
        self,
        career_pathway: CareerPathway,
        skill_gap: SkillGapAnalysis
    ) -> List[Dict[str, Any]]:
        milestones = []
        
        milestones.append({
            'title': 'Complete foundational courses',
            'description': 'Build core knowledge base',
            'timeline': '0-6 months',
            'required_skills': [s['name'] for s in (skill_gap.foundational_skills or [])[:5]]
        })
        
        milestones.append({
            'title': 'Acquire priority skills',
            'description': 'Master high-priority skills for the career',
            'timeline': '6-12 months',
            'required_skills': [s['name'] for s in (skill_gap.priority_skills or [])[:5]]
        })
        
        if career_pathway.certifications:
            milestones.append({
                'title': 'Obtain relevant certifications',
                'description': 'Complete industry-recognized certifications',
                'timeline': '12-18 months',
                'certifications': career_pathway.certifications[:3]
            })
        
        milestones.append({
            'title': 'Gain practical experience',
            'description': 'Complete projects and internships',
            'timeline': '18-24 months',
            'activities': ['Portfolio projects', 'Internships', 'Volunteer work']
        })
        
        return milestones
    
    def _generate_timeline(
        self,
        milestones: List[Dict[str, Any]]
    ) -> Dict[str, Any]:
        return {
            'total_duration': '24 months',
            'phases': len(milestones),
            'milestones': milestones
        }
    
    def _calculate_completion_date(
        self,
        timeline: Dict[str, Any]
    ) -> date:
        duration = timeline.get('total_duration', '24 months')
        months = int(duration.split()[0])
        return date.today() + timedelta(days=months * 30)
    
    def _get_learning_path_difficulty(
        self,
        skill_gap: SkillGapAnalysis
    ) -> str:
        return skill_gap.gap_severity if skill_gap.gap_severity else 'medium'
    
    def get_student_learning_paths(
        self,
        student_id: int,
        institution_id: int
    ) -> List[PersonalizedLearningPath]:
        student_profile = self.get_student_profile(student_id, institution_id)
        
        if not student_profile:
            return []
        
        return self.db.query(PersonalizedLearningPath).filter(
            PersonalizedLearningPath.student_profile_id == student_profile.id,
            PersonalizedLearningPath.is_active == True
        ).order_by(desc(PersonalizedLearningPath.priority)).all()
    
    def update_labor_market_data(
        self,
        career_title: str,
        market_data: Dict[str, Any]
    ) -> LaborMarketData:
        existing_data = self.db.query(LaborMarketData).filter(
            LaborMarketData.career_title == career_title,
            LaborMarketData.data_collection_date == date.today()
        ).first()
        
        if existing_data:
            for key, value in market_data.items():
                if hasattr(existing_data, key):
                    setattr(existing_data, key, value)
            data = existing_data
        else:
            data = LaborMarketData(
                career_title=career_title,
                data_collection_date=date.today(),
                **market_data
            )
            self.db.add(data)
        
        self.db.commit()
        self.db.refresh(data)
        return data
    
    def fetch_labor_market_trends(
        self,
        career_pathway_id: int,
        api_endpoint: Optional[str] = None
    ) -> Optional[Dict[str, Any]]:
        career_pathway = self.get_career_pathway(career_pathway_id)
        
        if not career_pathway:
            return None
        
        if not api_endpoint:
            return self._get_mock_labor_data(career_pathway.title)
        
        try:
            response = requests.get(
                api_endpoint,
                params={'career': career_pathway.title},
                timeout=10
            )
            
            if response.status_code == 200:
                data = response.json()
                
                self.update_labor_market_data(career_pathway.title, data)
                
                career_pathway.last_updated_from_api = datetime.utcnow()
                self.db.commit()
                
                return data
        except Exception as e:
            return self._get_mock_labor_data(career_pathway.title)
        
        return None
    
    def _get_mock_labor_data(self, career_title: str) -> Dict[str, Any]:
        return {
            'total_jobs': 50000,
            'job_growth_rate': 7.5,
            'projected_job_openings': 5000,
            'median_salary': 75000,
            'salary_range_min': 50000,
            'salary_range_max': 120000,
            'top_skills_demand': [
                {'skill': 'Communication', 'demand_level': 'high'},
                {'skill': 'Problem Solving', 'demand_level': 'high'},
                {'skill': 'Technical Skills', 'demand_level': 'medium'}
            ],
            'emerging_skills': ['AI/ML', 'Data Analysis', 'Cloud Computing'],
            'automation_risk': 15.5,
            'remote_work_potential': 65.0,
            'data_source': 'Mock Data'
        }
    
    def create_industry_mentor(
        self,
        mentor_data: Dict[str, Any]
    ) -> IndustryMentor:
        mentor = IndustryMentor(**mentor_data)
        self.db.add(mentor)
        self.db.commit()
        self.db.refresh(mentor)
        return mentor
    
    def get_industry_mentor(self, mentor_id: int) -> Optional[IndustryMentor]:
        return self.db.query(IndustryMentor).filter(
            IndustryMentor.id == mentor_id,
            IndustryMentor.is_active == True
        ).first()
    
    def list_available_mentors(
        self,
        institution_id: Optional[int] = None,
        industry: Optional[str] = None,
        limit: int = 50
    ) -> List[IndustryMentor]:
        query = self.db.query(IndustryMentor).filter(
            IndustryMentor.is_active == True,
            IndustryMentor.available_for_mentoring == True,
            IndustryMentor.current_mentees < IndustryMentor.mentoring_capacity
        )
        
        if institution_id:
            query = query.filter(
                or_(
                    IndustryMentor.institution_id == institution_id,
                    IndustryMentor.institution_id.is_(None)
                )
            )
        
        if industry:
            query = query.filter(IndustryMentor.industry == industry)
        
        return query.limit(limit).all()
    
    def match_student_with_mentors(
        self,
        student_id: int,
        institution_id: int,
        top_n: int = 5
    ) -> List[IndustryMentorMatch]:
        student_profile = self.get_student_profile(student_id, institution_id)
        
        if not student_profile:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Student career profile not found"
            )
        
        preferred_industries = student_profile.preferred_industries or []
        
        mentors = self.list_available_mentors(
            institution_id=institution_id,
            limit=100
        )
        
        matches = []
        for mentor in mentors:
            match_score = self._calculate_mentor_match_score(
                student_profile,
                mentor
            )
            
            matching_criteria = self._get_mentor_matching_criteria(
                student_profile,
                mentor
            )
            
            matches.append({
                'mentor': mentor,
                'match_score': match_score,
                'matching_criteria': matching_criteria
            })
        
        matches.sort(key=lambda x: x['match_score'], reverse=True)
        
        mentor_matches = []
        for match_data in matches[:top_n]:
            mentor_match = IndustryMentorMatch(
                institution_id=institution_id,
                student_profile_id=student_profile.id,
                mentor_id=match_data['mentor'].id,
                match_score=match_data['match_score'],
                matching_criteria=match_data['matching_criteria'],
                status=MentorshipStatus.PENDING
            )
            self.db.add(mentor_match)
            mentor_matches.append(mentor_match)
        
        self.db.commit()
        return mentor_matches
    
    def _calculate_mentor_match_score(
        self,
        student_profile: StudentCareerProfile,
        mentor: IndustryMentor
    ) -> float:
        score = 0.0
        
        preferred_industries = student_profile.preferred_industries or []
        if mentor.industry in preferred_industries:
            score += 40.0
        
        if student_profile.personality_type and mentor.personality_type:
            compatible_types = {
                'realistic': ['investigative', 'conventional'],
                'investigative': ['realistic', 'artistic'],
                'artistic': ['investigative', 'social'],
                'social': ['artistic', 'enterprising'],
                'enterprising': ['social', 'conventional'],
                'conventional': ['enterprising', 'realistic']
            }
            
            if (mentor.personality_type == student_profile.personality_type or
                mentor.personality_type in compatible_types.get(student_profile.personality_type, [])):
                score += 30.0
        
        student_interests = student_profile.interests or []
        mentor_expertise = mentor.expertise_areas or []
        
        common_interests = 0
        for interest in student_interests:
            if isinstance(interest, dict):
                category = interest.get('category', '')
                for expertise in mentor_expertise:
                    if isinstance(expertise, str) and category.lower() in expertise.lower():
                        common_interests += 1
        
        score += min(common_interests * 10, 30.0)
        
        return round(min(score, 100.0), 2)
    
    def _get_mentor_matching_criteria(
        self,
        student_profile: StudentCareerProfile,
        mentor: IndustryMentor
    ) -> List[Dict[str, Any]]:
        criteria = []
        
        preferred_industries = student_profile.preferred_industries or []
        if mentor.industry in preferred_industries:
            criteria.append({
                'criterion': 'Industry Match',
                'matched': True,
                'detail': f"Mentor works in preferred industry: {mentor.industry}"
            })
        
        if student_profile.personality_type == mentor.personality_type:
            criteria.append({
                'criterion': 'Personality Type',
                'matched': True,
                'detail': f"Same personality type: {mentor.personality_type}"
            })
        
        if mentor.years_of_experience and mentor.years_of_experience > 5:
            criteria.append({
                'criterion': 'Experience',
                'matched': True,
                'detail': f"{mentor.years_of_experience} years of industry experience"
            })
        
        return criteria
    
    def accept_mentor_match(
        self,
        match_id: int,
        goals: Optional[List[Dict[str, Any]]] = None
    ) -> IndustryMentorMatch:
        match = self.db.query(IndustryMentorMatch).filter(
            IndustryMentorMatch.id == match_id
        ).first()
        
        if not match:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Mentor match not found"
            )
        
        match.status = MentorshipStatus.MATCHED
        match.start_date = date.today()
        match.goals = goals or []
        
        mentor = match.mentor
        mentor.current_mentees += 1
        
        self.db.commit()
        self.db.refresh(match)
        return match
    
    def get_student_mentor_matches(
        self,
        student_id: int,
        institution_id: int
    ) -> List[IndustryMentorMatch]:
        student_profile = self.get_student_profile(student_id, institution_id)
        
        if not student_profile:
            return []
        
        return self.db.query(IndustryMentorMatch).options(
            joinedload(IndustryMentorMatch.mentor)
        ).filter(
            IndustryMentorMatch.student_profile_id == student_profile.id,
            IndustryMentorMatch.is_active == True
        ).order_by(desc(IndustryMentorMatch.match_score)).all()
