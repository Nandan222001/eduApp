import json
import math
from typing import Dict, List, Any, Optional
from datetime import datetime, date, timedelta
from sqlalchemy.orm import Session
from sqlalchemy import func, and_

from src.models.previous_year_papers import (
    QuestionBank,
    Board,
    TopicPrediction,
    QuestionType,
    DifficultyLevel,
    BloomTaxonomyLevel
)
from src.models.academic import Topic, Chapter, Subject
from src.repositories.previous_year_papers_repository import TopicPredictionRepository
from src.schemas.ai_prediction_dashboard import (
    AIPredictionDashboardResponse,
    TopicProbabilityRanking,
    PredictedQuestionBlueprint,
    QuestionPaperSection,
    MarksDistribution,
    FocusAreaRecommendation,
    StudyTimeAllocation,
    StudyPlanResponse,
    StudyPlanWeek,
    DailyTask,
    WhatIfScenarioResponse,
    PredictionChange,
    CrashCourseModeResponse,
    CrashCourseTopicPriority,
    CrashCourseDay
)


class AIPredictionDashboardService:
    def __init__(self, db: Session):
        self.db = db
        self.prediction_repo = TopicPredictionRepository(db)

    async def get_dashboard(
        self,
        institution_id: int,
        student_id: int,
        board: Board,
        grade_id: int,
        subject_id: int
    ) -> AIPredictionDashboardResponse:
        """Get comprehensive AI prediction dashboard"""
        
        # Get subject name
        subject = self.db.query(Subject).filter(Subject.id == subject_id).first()
        subject_name = subject.name if subject else "Unknown Subject"
        
        # Get topic predictions
        predictions = self.prediction_repo.get_top_predictions(
            institution_id, board, grade_id, subject_id, top_n=50
        )
        
        # Generate topic probability rankings
        topic_rankings = self._generate_topic_rankings(predictions)
        
        # Generate predicted question paper blueprint
        predicted_blueprint = self._generate_question_blueprint(
            institution_id, board, grade_id, subject_id, predictions
        )
        
        # Generate marks distribution
        marks_distribution = self._generate_marks_distribution(predictions)
        
        # Generate focus area recommendations
        focus_areas = self._generate_focus_areas(predictions, student_id)
        
        # Generate study time allocation
        study_time_allocation = self._generate_study_time_allocation(predictions)
        
        # Generate overall predictions
        overall_prediction = self._generate_overall_prediction(predictions)
        
        return AIPredictionDashboardResponse(
            board=board,
            grade_id=grade_id,
            subject_id=subject_id,
            subject_name=subject_name,
            generated_at=datetime.utcnow(),
            topic_rankings=topic_rankings,
            predicted_blueprint=predicted_blueprint,
            marks_distribution=marks_distribution,
            focus_areas=focus_areas,
            study_time_allocation=study_time_allocation,
            overall_prediction=overall_prediction
        )

    def _generate_topic_rankings(
        self,
        predictions: List[TopicPrediction]
    ) -> List[TopicProbabilityRanking]:
        """Generate topic probability rankings with star ratings"""
        rankings = []
        
        for pred in predictions:
            # Get chapter name
            chapter_name = None
            if pred.chapter_id:
                chapter = self.db.query(Chapter).filter(Chapter.id == pred.chapter_id).first()
                chapter_name = chapter.name if chapter else None
            
            # Calculate star rating (1-5 based on probability score)
            star_rating = self._calculate_star_rating(pred.probability_score)
            
            # Determine priority tag
            priority_tag = self._determine_priority_tag(
                pred.probability_score,
                pred.is_due,
                pred.years_since_last_appearance
            )
            
            # Estimate study hours needed
            study_hours = self._estimate_study_hours(
                pred.total_marks,
                pred.probability_score
            )
            
            rankings.append(TopicProbabilityRanking(
                topic_id=pred.topic_id,
                topic_name=pred.topic_name,
                chapter_name=chapter_name,
                probability_score=round(pred.probability_score, 2),
                star_rating=star_rating,
                confidence_level=pred.confidence_level or "Medium",
                frequency_count=pred.frequency_count,
                last_appeared_year=pred.last_appeared_year,
                years_since_last_appearance=pred.years_since_last_appearance,
                is_due=pred.is_due,
                priority_tag=priority_tag,
                expected_marks=round(pred.avg_marks_per_appearance, 2),
                study_hours_recommended=study_hours
            ))
        
        return rankings

    def _calculate_star_rating(self, probability_score: float) -> int:
        """Calculate star rating based on probability score"""
        if probability_score >= 85:
            return 5
        elif probability_score >= 70:
            return 4
        elif probability_score >= 55:
            return 3
        elif probability_score >= 40:
            return 2
        else:
            return 1

    def _determine_priority_tag(
        self,
        probability_score: float,
        is_due: bool,
        years_since_last: int
    ) -> str:
        """Determine priority tag for topic"""
        if is_due and probability_score >= 75:
            return "MUST STUDY"
        elif probability_score >= 80:
            return "VERY HIGH"
        elif probability_score >= 65:
            return "HIGH"
        elif probability_score >= 50:
            return "MEDIUM"
        elif years_since_last >= 5:
            return "OVERDUE"
        else:
            return "LOW"

    def _estimate_study_hours(self, total_marks: float, probability_score: float) -> float:
        """Estimate study hours needed for a topic"""
        # Base hours on marks weightage and probability
        base_hours = (total_marks / 10) * (probability_score / 100)
        return round(max(base_hours, 0.5), 1)

    def _generate_question_blueprint(
        self,
        institution_id: int,
        board: Board,
        grade_id: int,
        subject_id: int,
        predictions: List[TopicPrediction]
    ) -> PredictedQuestionBlueprint:
        """Generate predicted question paper blueprint"""
        
        # Analyze historical paper patterns
        from src.models.previous_year_papers import PreviousYearPaper
        
        papers = self.db.query(PreviousYearPaper).filter(
            and_(
                PreviousYearPaper.institution_id == institution_id,
                PreviousYearPaper.board == board,
                PreviousYearPaper.grade_id == grade_id,
                PreviousYearPaper.subject_id == subject_id
            )
        ).order_by(PreviousYearPaper.year.desc()).limit(5).all()
        
        # Calculate average total marks and duration
        total_marks = int(sum(p.total_marks for p in papers if p.total_marks) / len(papers)) if papers else 100
        duration_minutes = int(sum(p.duration_minutes for p in papers if p.duration_minutes) / len(papers)) if papers else 180
        
        # Generate sections based on common patterns
        sections = self._generate_blueprint_sections(
            institution_id, board, grade_id, subject_id, predictions, total_marks
        )
        
        # Calculate topic coverage
        topic_coverage = {}
        for pred in predictions[:20]:  # Top 20 topics
            topic_coverage[pred.topic_name] = round(pred.probability_score, 2)
        
        # Calculate difficulty breakdown
        difficulty_breakdown = {
            "Easy": 30,
            "Medium": 50,
            "Hard": 20
        }
        
        return PredictedQuestionBlueprint(
            total_marks=total_marks,
            duration_minutes=duration_minutes,
            sections=sections,
            topic_coverage=topic_coverage,
            difficulty_breakdown=difficulty_breakdown
        )

    def _generate_blueprint_sections(
        self,
        institution_id: int,
        board: Board,
        grade_id: int,
        subject_id: int,
        predictions: List[TopicPrediction],
        total_marks: int
    ) -> List[QuestionPaperSection]:
        """Generate sections for question paper blueprint"""
        sections = []
        
        # Section A: Multiple Choice Questions
        sections.append(QuestionPaperSection(
            section_name="Section A: Multiple Choice Questions",
            total_marks=int(total_marks * 0.20),
            question_types=["Multiple Choice", "True/False"],
            topics_included=[p.topic_name for p in predictions[:10]],
            difficulty_distribution={"Easy": 60, "Medium": 30, "Hard": 10},
            bloom_level_distribution={"Remember": 40, "Understand": 40, "Apply": 20}
        ))
        
        # Section B: Short Answer Questions
        sections.append(QuestionPaperSection(
            section_name="Section B: Short Answer Questions",
            total_marks=int(total_marks * 0.30),
            question_types=["Short Answer"],
            topics_included=[p.topic_name for p in predictions[:15]],
            difficulty_distribution={"Easy": 30, "Medium": 50, "Hard": 20},
            bloom_level_distribution={"Understand": 40, "Apply": 40, "Analyze": 20}
        ))
        
        # Section C: Long Answer Questions
        sections.append(QuestionPaperSection(
            section_name="Section C: Long Answer Questions",
            total_marks=int(total_marks * 0.35),
            question_types=["Long Answer"],
            topics_included=[p.topic_name for p in predictions[:12]],
            difficulty_distribution={"Easy": 20, "Medium": 50, "Hard": 30},
            bloom_level_distribution={"Apply": 30, "Analyze": 40, "Evaluate": 30}
        ))
        
        # Section D: Case Study / Application Based
        sections.append(QuestionPaperSection(
            section_name="Section D: Case Study / Application",
            total_marks=int(total_marks * 0.15),
            question_types=["Case Study", "Application"],
            topics_included=[p.topic_name for p in predictions[:8]],
            difficulty_distribution={"Medium": 40, "Hard": 60},
            bloom_level_distribution={"Analyze": 40, "Evaluate": 40, "Create": 20}
        ))
        
        return sections

    def _generate_marks_distribution(
        self,
        predictions: List[TopicPrediction]
    ) -> List[MarksDistribution]:
        """Generate expected marks distribution for pie chart"""
        
        # Group predictions by probability ranges
        categories = {
            "Very High Probability (80-100%)": {"marks": 0, "color": "#4CAF50"},
            "High Probability (65-79%)": {"marks": 0, "color": "#8BC34A"},
            "Medium Probability (50-64%)": {"marks": 0, "color": "#FFC107"},
            "Low Probability (35-49%)": {"marks": 0, "color": "#FF9800"},
            "Very Low Probability (0-34%)": {"marks": 0, "color": "#F44336"}
        }
        
        for pred in predictions:
            if pred.probability_score >= 80:
                categories["Very High Probability (80-100%)"]["marks"] += pred.avg_marks_per_appearance
            elif pred.probability_score >= 65:
                categories["High Probability (65-79%)"]["marks"] += pred.avg_marks_per_appearance
            elif pred.probability_score >= 50:
                categories["Medium Probability (50-64%)"]["marks"] += pred.avg_marks_per_appearance
            elif pred.probability_score >= 35:
                categories["Low Probability (35-49%)"]["marks"] += pred.avg_marks_per_appearance
            else:
                categories["Very Low Probability (0-34%)"]["marks"] += pred.avg_marks_per_appearance
        
        total_marks = sum(cat["marks"] for cat in categories.values())
        
        distribution = []
        for category, data in categories.items():
            if data["marks"] > 0:
                percentage = (data["marks"] / total_marks * 100) if total_marks > 0 else 0
                distribution.append(MarksDistribution(
                    category=category,
                    marks=round(data["marks"], 2),
                    percentage=round(percentage, 2),
                    color=data["color"]
                ))
        
        return distribution

    def _generate_focus_areas(
        self,
        predictions: List[TopicPrediction],
        student_id: int
    ) -> List[FocusAreaRecommendation]:
        """Generate focus area recommendations with priority tags"""
        focus_areas = []
        
        # Prioritize topics that are due and high probability
        for pred in predictions[:15]:  # Top 15 topics
            # Get chapter name
            chapter_name = None
            if pred.chapter_id:
                chapter = self.db.query(Chapter).filter(Chapter.id == pred.chapter_id).first()
                chapter_name = chapter.name if chapter else None
            
            # Determine priority
            priority = self._determine_focus_priority(pred)
            priority_score = pred.probability_score
            
            # Generate reason and expected impact
            reason = self._generate_focus_reason(pred)
            expected_impact = self._generate_expected_impact(pred)
            
            # Estimate study hours needed
            study_hours_needed = self._estimate_study_hours(
                pred.total_marks,
                pred.probability_score
            )
            
            # Generate resources
            resources = [
                f"NCERT Chapter {chapter_name or pred.topic_name}",
                f"Practice Questions from {pred.last_appeared_year or 'previous years'}",
                "Video lectures and explanations",
                "Revision notes and mind maps"
            ]
            
            # Determine difficulty
            difficulty_level = "Medium"
            if pred.avg_marks_per_appearance >= 8:
                difficulty_level = "High"
            elif pred.avg_marks_per_appearance <= 3:
                difficulty_level = "Low"
            
            focus_areas.append(FocusAreaRecommendation(
                topic_id=pred.topic_id,
                topic_name=pred.topic_name,
                chapter_name=chapter_name,
                priority=priority,
                priority_score=round(priority_score, 2),
                reason=reason,
                expected_impact=expected_impact,
                study_hours_needed=study_hours_needed,
                resources=resources,
                difficulty_level=difficulty_level
            ))
        
        return focus_areas

    def _determine_focus_priority(self, pred: TopicPrediction) -> str:
        """Determine focus priority level"""
        if pred.is_due and pred.probability_score >= 75:
            return "critical"
        elif pred.probability_score >= 70:
            return "high"
        elif pred.probability_score >= 50:
            return "medium"
        else:
            return "low"

    def _generate_focus_reason(self, pred: TopicPrediction) -> str:
        """Generate reason for focus recommendation"""
        reasons = []
        
        if pred.is_due:
            reasons.append(f"Topic is due (not appeared for {pred.years_since_last_appearance} years)")
        
        if pred.probability_score >= 80:
            reasons.append("Very high probability of appearing")
        
        if pred.frequency_count >= 7:
            reasons.append(f"Appeared {pred.frequency_count} times in analyzed period")
        
        if pred.avg_marks_per_appearance >= 5:
            reasons.append(f"Carries significant weightage ({pred.avg_marks_per_appearance:.1f} marks average)")
        
        return "; ".join(reasons) if reasons else "Moderate probability with consistent pattern"

    def _generate_expected_impact(self, pred: TopicPrediction) -> str:
        """Generate expected impact statement"""
        expected_marks = pred.avg_marks_per_appearance
        confidence = pred.confidence_level or "Medium"
        
        if expected_marks >= 8:
            return f"Mastering this topic could secure {expected_marks:.0f}+ marks (High impact, {confidence} confidence)"
        elif expected_marks >= 5:
            return f"Could contribute {expected_marks:.0f} marks to your score (Medium impact, {confidence} confidence)"
        else:
            return f"Expected contribution: {expected_marks:.0f} marks ({confidence} confidence)"

    def _generate_study_time_allocation(
        self,
        predictions: List[TopicPrediction]
    ) -> List[StudyTimeAllocation]:
        """Generate study time allocation for donut chart"""
        
        # Calculate total study hours needed
        high_priority_hours = sum(
            self._estimate_study_hours(p.total_marks, p.probability_score)
            for p in predictions if p.probability_score >= 70
        )
        
        medium_priority_hours = sum(
            self._estimate_study_hours(p.total_marks, p.probability_score)
            for p in predictions if 50 <= p.probability_score < 70
        )
        
        low_priority_hours = sum(
            self._estimate_study_hours(p.total_marks, p.probability_score)
            for p in predictions if p.probability_score < 50
        )
        
        revision_hours = (high_priority_hours + medium_priority_hours) * 0.3
        practice_hours = (high_priority_hours + medium_priority_hours) * 0.4
        
        total_hours = (
            high_priority_hours + medium_priority_hours + low_priority_hours +
            revision_hours + practice_hours
        )
        
        allocations = [
            StudyTimeAllocation(
                category="High Priority Topics",
                hours=round(high_priority_hours, 1),
                percentage=round(high_priority_hours / total_hours * 100, 1) if total_hours > 0 else 0,
                color="#4CAF50",
                description="Topics with 70%+ probability score"
            ),
            StudyTimeAllocation(
                category="Medium Priority Topics",
                hours=round(medium_priority_hours, 1),
                percentage=round(medium_priority_hours / total_hours * 100, 1) if total_hours > 0 else 0,
                color="#FFC107",
                description="Topics with 50-69% probability score"
            ),
            StudyTimeAllocation(
                category="Practice & Tests",
                hours=round(practice_hours, 1),
                percentage=round(practice_hours / total_hours * 100, 1) if total_hours > 0 else 0,
                color="#2196F3",
                description="Solving previous year questions and mock tests"
            ),
            StudyTimeAllocation(
                category="Revision",
                hours=round(revision_hours, 1),
                percentage=round(revision_hours / total_hours * 100, 1) if total_hours > 0 else 0,
                color="#9C27B0",
                description="Quick revision of completed topics"
            ),
            StudyTimeAllocation(
                category="Low Priority Topics",
                hours=round(low_priority_hours, 1),
                percentage=round(low_priority_hours / total_hours * 100, 1) if total_hours > 0 else 0,
                color="#FF9800",
                description="Topics with <50% probability score"
            )
        ]
        
        return allocations

    def _generate_overall_prediction(
        self,
        predictions: List[TopicPrediction]
    ) -> Dict[str, Any]:
        """Generate overall prediction summary"""
        
        high_prob_count = sum(1 for p in predictions if p.probability_score >= 70)
        due_topics_count = sum(1 for p in predictions if p.is_due)
        
        avg_probability = sum(p.probability_score for p in predictions) / len(predictions) if predictions else 0
        
        total_expected_marks = sum(
            p.avg_marks_per_appearance * (p.probability_score / 100)
            for p in predictions[:20]
        )
        
        return {
            "total_topics_analyzed": len(predictions),
            "high_probability_topics": high_prob_count,
            "due_topics": due_topics_count,
            "average_probability_score": round(avg_probability, 2),
            "total_expected_marks": round(total_expected_marks, 2),
            "preparation_completeness": round(avg_probability, 2),
            "recommended_study_hours": round(sum(
                self._estimate_study_hours(p.total_marks, p.probability_score)
                for p in predictions[:20]
            ), 1)
        }

    async def generate_study_plan(
        self,
        institution_id: int,
        student_id: int,
        board: Board,
        grade_id: int,
        subject_id: int,
        exam_date: date,
        available_hours_per_day: float,
        weak_areas: Optional[List[int]]
    ) -> StudyPlanResponse:
        """Generate personalized study plan timeline"""
        
        # Get predictions
        predictions = self.prediction_repo.get_top_predictions(
            institution_id, board, grade_id, subject_id, top_n=30
        )
        
        # Calculate days until exam
        today = date.today()
        days_until_exam = (exam_date - today).days
        
        if days_until_exam <= 0:
            days_until_exam = 1
        
        # Prioritize topics
        prioritized_topics = self._prioritize_topics_for_study_plan(
            predictions, weak_areas
        )
        
        # Generate weekly schedule
        weeks = self._generate_weekly_schedule(
            prioritized_topics,
            exam_date,
            available_hours_per_day,
            days_until_exam
        )
        
        # Calculate total study hours
        total_study_hours = sum(week.total_hours for week in weeks)
        
        # Generate milestone dates
        milestone_dates = {
            "Complete High Priority Topics": today + timedelta(days=int(days_until_exam * 0.4)),
            "Complete Medium Priority Topics": today + timedelta(days=int(days_until_exam * 0.7)),
            "Start Revision Phase": today + timedelta(days=int(days_until_exam * 0.8)),
            "Final Mock Tests": exam_date - timedelta(days=3)
        }
        
        return StudyPlanResponse(
            exam_date=exam_date,
            days_until_exam=days_until_exam,
            total_study_hours=round(total_study_hours, 1),
            weeks=weeks,
            completion_percentage=0,
            milestone_dates=milestone_dates
        )

    def _prioritize_topics_for_study_plan(
        self,
        predictions: List[TopicPrediction],
        weak_areas: Optional[List[int]]
    ) -> List[TopicPrediction]:
        """Prioritize topics for study plan"""
        
        # Create priority scores
        topic_scores = []
        
        for pred in predictions:
            score = pred.probability_score
            
            # Boost score if it's a weak area
            if weak_areas and pred.topic_id in weak_areas:
                score *= 1.3
            
            # Boost score if topic is due
            if pred.is_due:
                score *= 1.2
            
            topic_scores.append((pred, score))
        
        # Sort by priority score
        topic_scores.sort(key=lambda x: x[1], reverse=True)
        
        return [pred for pred, _ in topic_scores]

    def _generate_weekly_schedule(
        self,
        prioritized_topics: List[TopicPrediction],
        exam_date: date,
        available_hours_per_day: float,
        days_until_exam: int
    ) -> List[StudyPlanWeek]:
        """Generate weekly schedule with daily tasks"""
        
        weeks = []
        current_date = date.today()
        week_number = 1
        topic_index = 0
        
        while current_date < exam_date:
            week_start = current_date
            week_end = min(current_date + timedelta(days=6), exam_date - timedelta(days=1))
            
            tasks = []
            focus_topics = []
            week_hours = 0
            
            # Generate daily tasks for the week
            day = week_start
            while day <= week_end and topic_index < len(prioritized_topics):
                pred = prioritized_topics[topic_index]
                
                # Determine task type based on week phase
                progress = (day - date.today()).days / days_until_exam
                if progress < 0.7:
                    task_type = "study"
                elif progress < 0.85:
                    task_type = "revision"
                else:
                    task_type = "test"
                
                study_hours = min(
                    available_hours_per_day,
                    self._estimate_study_hours(pred.total_marks, pred.probability_score)
                )
                
                task = DailyTask(
                    task_id=f"task_{week_number}_{day.day}_{topic_index}",
                    date=day,
                    topic_name=pred.topic_name,
                    task_type=task_type,
                    duration_hours=study_hours,
                    priority=self._determine_focus_priority(pred),
                    description=f"{task_type.capitalize()} {pred.topic_name}",
                    resources=[
                        f"Study material for {pred.topic_name}",
                        "Practice questions"
                    ],
                    is_completed=False
                )
                
                tasks.append(task)
                focus_topics.append(pred.topic_name)
                week_hours += study_hours
                
                # Move to next day or topic
                if study_hours >= available_hours_per_day:
                    day += timedelta(days=1)
                    topic_index += 1
                else:
                    topic_index += 1
            
            weeks.append(StudyPlanWeek(
                week_number=week_number,
                start_date=week_start,
                end_date=week_end,
                focus_topics=list(set(focus_topics))[:5],  # Top 5 unique topics
                total_hours=round(week_hours, 1),
                tasks=tasks
            ))
            
            current_date = week_end + timedelta(days=1)
            week_number += 1
        
        return weeks

    async def simulate_what_if_scenario(
        self,
        institution_id: int,
        student_id: int,
        board: Board,
        grade_id: int,
        subject_id: int,
        study_hours_adjustment: float,
        focus_topic_ids: Optional[List[int]],
        practice_test_count: int
    ) -> WhatIfScenarioResponse:
        """Simulate what-if scenario"""
        
        # Get current predictions
        predictions = self.prediction_repo.get_top_predictions(
            institution_id, board, grade_id, subject_id, top_n=30
        )
        
        # Calculate current predicted score
        current_score = sum(
            p.avg_marks_per_appearance * (p.probability_score / 100)
            for p in predictions[:20]
        )
        
        # Calculate projected score with adjustments
        study_hours_multiplier = 1 + (study_hours_adjustment / 10)
        practice_test_multiplier = 1 + (practice_test_count * 0.05)
        
        # If focusing on specific topics, boost their contribution
        projected_score = current_score * study_hours_multiplier * practice_test_multiplier
        
        if focus_topic_ids:
            focused_contribution = sum(
                p.avg_marks_per_appearance * (p.probability_score / 100) * 0.2
                for p in predictions if p.topic_id in focus_topic_ids
            )
            projected_score += focused_contribution
        
        score_improvement = projected_score - current_score
        
        # Determine confidence level
        confidence_level = "High" if practice_test_count >= 5 and study_hours_adjustment >= 2 else "Medium"
        
        # Generate prediction changes
        prediction_changes = [
            PredictionChange(
                metric="Expected Total Score",
                current_value=round(current_score, 2),
                projected_value=round(projected_score, 2),
                change_percentage=round((score_improvement / current_score * 100) if current_score > 0 else 0, 2),
                impact_level="High" if score_improvement >= 10 else "Medium"
            ),
            PredictionChange(
                metric="Preparation Level",
                current_value=70.0,
                projected_value=min(70.0 + (study_hours_adjustment * 3) + (practice_test_count * 2), 100.0),
                change_percentage=round(study_hours_adjustment * 3 + practice_test_count * 2, 2),
                impact_level="Medium"
            ),
            PredictionChange(
                metric="Test-Taking Confidence",
                current_value=65.0,
                projected_value=min(65.0 + (practice_test_count * 5), 95.0),
                change_percentage=round(practice_test_count * 5, 2),
                impact_level="High" if practice_test_count >= 3 else "Low"
            )
        ]
        
        # Generate recommendations
        recommended_adjustments = []
        if study_hours_adjustment < 2:
            recommended_adjustments.append("Increase daily study hours by at least 2 hours for better results")
        if practice_test_count < 5:
            recommended_adjustments.append("Complete at least 5 practice tests to build confidence")
        if not focus_topic_ids or len(focus_topic_ids) < 5:
            recommended_adjustments.append("Focus on top 5-7 high-probability topics for maximum impact")
        
        # Identify risk factors
        risk_factors = []
        if study_hours_adjustment < 0:
            risk_factors.append("Reducing study hours may significantly impact performance")
        if practice_test_count == 0:
            risk_factors.append("No practice tests may lead to exam anxiety and time management issues")
        
        return WhatIfScenarioResponse(
            current_predicted_score=round(current_score, 2),
            projected_score=round(projected_score, 2),
            score_improvement=round(score_improvement, 2),
            confidence_level=confidence_level,
            prediction_changes=prediction_changes,
            recommended_adjustments=recommended_adjustments,
            risk_factors=risk_factors
        )

    async def activate_crash_course_mode(
        self,
        institution_id: int,
        student_id: int,
        board: Board,
        grade_id: int,
        subject_id: int,
        days_until_exam: int
    ) -> CrashCourseModeResponse:
        """Activate last-minute crash course mode"""
        
        # Get predictions
        predictions = self.prediction_repo.get_top_predictions(
            institution_id, board, grade_id, subject_id, top_n=50
        )
        
        # Calculate time available
        total_hours_available = days_until_exam * 8  # 8 hours per day in crash mode
        
        # Prioritize topics for crash course
        priority_topics = self._generate_crash_course_priorities(
            predictions, total_hours_available
        )
        
        # Generate daily schedule
        daily_schedule = self._generate_crash_course_schedule(
            priority_topics, days_until_exam
        )
        
        # Generate quick wins
        quick_wins = [
            f"Master {predictions[0].topic_name} - appeared {predictions[0].frequency_count} times, worth {predictions[0].avg_marks_per_appearance:.0f} marks",
            "Focus on formula-based questions for quick scores",
            "Memorize key definitions and theorems",
            "Practice previous year MCQs for pattern recognition",
            "Create flashcards for important dates/facts"
        ]
        
        # Topics to skip
        topics_to_skip = [
            p.topic_name for p in predictions
            if p.probability_score < 30 or p.years_since_last_appearance > 10
        ][:5]
        
        # Calculate estimated coverage
        covered_topics = len([p for p in priority_topics if p.time_to_study_hours <= total_hours_available * 0.7])
        estimated_coverage = min((covered_topics / len(predictions[:20]) * 100), 95)
        
        # Expected score range
        optimistic_score = sum(p.expected_marks for p in priority_topics[:15])
        realistic_score = optimistic_score * 0.75
        
        expected_score_range = {
            "minimum": round(realistic_score * 0.8, 2),
            "realistic": round(realistic_score, 2),
            "optimistic": round(optimistic_score, 2)
        }
        
        return CrashCourseModeResponse(
            days_until_exam=days_until_exam,
            mode_activated=True,
            priority_topics=priority_topics[:20],
            daily_schedule=daily_schedule,
            quick_wins=quick_wins,
            topics_to_skip=topics_to_skip,
            estimated_coverage=round(estimated_coverage, 2),
            expected_score_range=expected_score_range
        )

    def _generate_crash_course_priorities(
        self,
        predictions: List[TopicPrediction],
        total_hours_available: float
    ) -> List[CrashCourseTopicPriority]:
        """Generate priority topics for crash course"""
        
        priorities = []
        
        for idx, pred in enumerate(predictions[:25], start=1):
            # Calculate ROI (Return on Investment) score
            study_time = self._estimate_study_hours(pred.total_marks, pred.probability_score)
            expected_marks = pred.avg_marks_per_appearance * (pred.probability_score / 100)
            roi_score = expected_marks / study_time if study_time > 0 else 0
            
            # Priority level (1-5, with 1 being highest)
            if pred.probability_score >= 80 and roi_score >= 2:
                priority_level = 1
            elif pred.probability_score >= 70:
                priority_level = 2
            elif pred.probability_score >= 55:
                priority_level = 3
            elif pred.probability_score >= 40:
                priority_level = 4
            else:
                priority_level = 5
            
            priorities.append(CrashCourseTopicPriority(
                topic_id=pred.topic_id,
                topic_name=pred.topic_name,
                priority_level=priority_level,
                time_to_study_hours=study_time,
                expected_marks=round(expected_marks, 2),
                roi_score=round(roi_score, 2),
                quick_revision_points=[
                    f"Key formula/theorem for {pred.topic_name}",
                    "Common question patterns",
                    "Important examples"
                ],
                must_know_concepts=[
                    "Core concept 1",
                    "Core concept 2",
                    "Core concept 3"
                ],
                practice_questions=[
                    f"PYQ {pred.last_appeared_year or 2023} Q1",
                    f"PYQ {pred.last_appeared_year - 1 if pred.last_appeared_year else 2022} Q2"
                ]
            ))
        
        # Sort by priority level and ROI score
        priorities.sort(key=lambda x: (x.priority_level, -x.roi_score))
        
        return priorities

    def _generate_crash_course_schedule(
        self,
        priority_topics: List[CrashCourseTopicPriority],
        days_until_exam: int
    ) -> List[CrashCourseDay]:
        """Generate daily schedule for crash course"""
        
        schedule = []
        current_date = date.today()
        topic_index = 0
        
        for day in range(1, days_until_exam + 1):
            day_date = current_date + timedelta(days=day - 1)
            
            # Determine phase
            if day <= days_until_exam * 0.7:
                # Study phase
                morning_session = []
                afternoon_session = []
                evening_session = []
                
                # Morning: 3 hours - New topic study
                if topic_index < len(priority_topics):
                    morning_session.append(f"Study: {priority_topics[topic_index].topic_name} (3 hours)")
                    topic_index += 1
                
                # Afternoon: 3 hours - Continue or next topic
                if topic_index < len(priority_topics):
                    afternoon_session.append(f"Study: {priority_topics[topic_index].topic_name} (3 hours)")
                    topic_index += 1
                
                # Evening: 2 hours - Practice
                evening_session.append("Practice questions from today's topics (2 hours)")
                
                revision_topics = []
                practice_tests = []
                
            elif day <= days_until_exam * 0.9:
                # Revision phase
                morning_session = ["Quick revision of high-priority topics (3 hours)"]
                afternoon_session = ["Solve previous year papers (3 hours)"]
                evening_session = ["Review mistakes and weak areas (2 hours)"]
                
                revision_topics = [t.topic_name for t in priority_topics[:5]]
                practice_tests = [f"Mock Test {day - int(days_until_exam * 0.7)}"]
                
            else:
                # Final preparation phase
                morning_session = ["Light revision of formulas and key points (2 hours)"]
                afternoon_session = ["Final mock test (3 hours)"]
                evening_session = ["Relax and review confidence topics (1 hour)"]
                
                revision_topics = [t.topic_name for t in priority_topics[:10]]
                practice_tests = [f"Final Mock Test {day}"]
            
            schedule.append(CrashCourseDay(
                day_number=day,
                date=day_date,
                morning_session=morning_session,
                afternoon_session=afternoon_session,
                evening_session=evening_session,
                revision_topics=revision_topics,
                practice_tests=practice_tests,
                total_hours=8.0
            ))
        
        return schedule
