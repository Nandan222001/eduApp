from typing import Optional, List, Dict, Any
from datetime import datetime, date, timedelta
from decimal import Decimal
from sqlalchemy.orm import Session
from sqlalchemy import func, desc
from openai import OpenAI
import json

from src.models.study_buddy import StudyBuddySession, StudyBuddyMessage, StudyBuddyInsight
from src.models.student import Student
from src.models.study_planner import WeakArea, DailyStudyTask, ChapterPerformance
from src.models.examination import ExamResult
from src.models.assignment import Submission
from src.config import settings


class StudyBuddyService:
    def __init__(self, db: Session):
        self.db = db
        self.openai_client = OpenAI(api_key=settings.openai_api_key) if settings.openai_api_key else None
    
    def create_session(
        self,
        institution_id: int,
        student_id: int,
        session_title: Optional[str] = None,
        context: Optional[Dict[str, Any]] = None
    ) -> StudyBuddySession:
        session = StudyBuddySession(
            institution_id=institution_id,
            student_id=student_id,
            session_title=session_title,
            context=context
        )
        self.db.add(session)
        self.db.commit()
        self.db.refresh(session)
        return session
    
    def get_session(self, session_id: int) -> Optional[StudyBuddySession]:
        return self.db.query(StudyBuddySession).filter(
            StudyBuddySession.id == session_id
        ).first()
    
    def end_session(self, session_id: int) -> Optional[StudyBuddySession]:
        session = self.get_session(session_id)
        if session:
            session.is_active = False
            session.ended_at = datetime.utcnow()
            self.db.commit()
            self.db.refresh(session)
        return session
    
    def get_student_sessions(
        self,
        student_id: int,
        is_active: Optional[bool] = None,
        limit: int = 10
    ) -> List[StudyBuddySession]:
        query = self.db.query(StudyBuddySession).filter(
            StudyBuddySession.student_id == student_id
        )
        if is_active is not None:
            query = query.filter(StudyBuddySession.is_active == is_active)
        return query.order_by(desc(StudyBuddySession.created_at)).limit(limit).all()
    
    def get_session_messages(self, session_id: int, limit: int = 50) -> List[StudyBuddyMessage]:
        return self.db.query(StudyBuddyMessage).filter(
            StudyBuddyMessage.session_id == session_id
        ).order_by(StudyBuddyMessage.created_at).limit(limit).all()
    
    def chat(
        self,
        institution_id: int,
        student_id: int,
        message: str,
        session_id: Optional[int] = None,
        context: Optional[Dict[str, Any]] = None
    ) -> Dict[str, Any]:
        if not self.openai_client:
            return {
                "session_id": session_id,
                "response": "AI service is not configured. Please contact administrator.",
                "suggestions": [],
                "related_topics": []
            }
        
        if not session_id:
            session = self.create_session(
                institution_id=institution_id,
                student_id=student_id,
                session_title=message[:50] if len(message) > 50 else message,
                context=context
            )
            session_id = session.id
        else:
            session = self.get_session(session_id)
            if not session:
                session = self.create_session(
                    institution_id=institution_id,
                    student_id=student_id,
                    context=context
                )
                session_id = session.id
        
        user_message = StudyBuddyMessage(
            session_id=session_id,
            role="user",
            content=message
        )
        self.db.add(user_message)
        
        student = self.db.query(Student).filter(Student.id == student_id).first()
        student_context = self._get_student_context(student_id)
        
        previous_messages = self.get_session_messages(session_id)
        
        messages = [
            {
                "role": "system",
                "content": f"""You are an AI Study Buddy helping a student named {student.first_name if student else 'Student'}. 
                You are supportive, encouraging, and knowledgeable. Help them with their studies, 
                provide explanations, suggest study strategies, and motivate them.
                
                Student Context:
                - Weak Areas: {student_context.get('weak_areas', [])}
                - Recent Performance: {student_context.get('recent_performance', 'No data')}
                - Study Streak: {student_context.get('study_streak', 0)} days
                
                Be concise but thorough. If they ask about homework or problems, break down solutions step by step."""
            }
        ]
        
        for msg in previous_messages[-10:]:
            messages.append({"role": msg.role, "content": msg.content})
        
        messages.append({"role": "user", "content": message})
        
        try:
            response = self.openai_client.chat.completions.create(
                model=settings.openai_model,
                messages=messages,
                temperature=0.7,
                max_tokens=1000
            )
            
            ai_response = response.choices[0].message.content
            
            assistant_message = StudyBuddyMessage(
                session_id=session_id,
                role="assistant",
                content=ai_response
            )
            self.db.add(assistant_message)
            
            session.total_messages += 2
            self.db.commit()
            
            suggestions = self._generate_suggestions(message, student_context)
            related_topics = self._get_related_topics(message, student_id)
            
            return {
                "session_id": session_id,
                "response": ai_response,
                "suggestions": suggestions,
                "related_topics": related_topics
            }
        except Exception as e:
            self.db.rollback()
            return {
                "session_id": session_id,
                "response": f"I'm having trouble connecting to my knowledge base right now. Error: {str(e)}",
                "suggestions": [],
                "related_topics": []
            }
    
    def _get_student_context(self, student_id: int) -> Dict[str, Any]:
        weak_areas = self.db.query(WeakArea).filter(
            WeakArea.student_id == student_id,
            WeakArea.is_resolved == False
        ).order_by(desc(WeakArea.weakness_score)).limit(3).all()
        
        recent_results = self.db.query(ExamResult).filter(
            ExamResult.student_id == student_id
        ).order_by(desc(ExamResult.created_at)).limit(3).all()
        
        return {
            "weak_areas": [
                f"{wa.subject.name if wa.subject else 'Unknown'} - {wa.topic.name if wa.topic else 'General'}"
                for wa in weak_areas
            ],
            "recent_performance": f"Average: {sum(float(r.percentage) for r in recent_results) / len(recent_results):.1f}%" if recent_results else "No data",
            "study_streak": 0
        }
    
    def _generate_suggestions(self, message: str, student_context: Dict[str, Any]) -> List[str]:
        suggestions = []
        message_lower = message.lower()
        
        if any(word in message_lower for word in ["homework", "problem", "solve", "help"]):
            suggestions.append("Would you like me to break down this problem step by step?")
            suggestions.append("Need clarification on any specific concept?")
        elif any(word in message_lower for word in ["test", "exam", "prepare"]):
            suggestions.append("Want me to create a study plan for your exam?")
            suggestions.append("Should I suggest practice questions?")
        elif any(word in message_lower for word in ["weak", "difficult", "struggling"]):
            suggestions.append("Let's identify your weak areas and work on them")
            suggestions.append("I can recommend targeted practice materials")
        
        return suggestions[:3]
    
    def _get_related_topics(self, message: str, student_id: int) -> List[Dict[str, Any]]:
        weak_areas = self.db.query(WeakArea).filter(
            WeakArea.student_id == student_id,
            WeakArea.is_resolved == False
        ).order_by(desc(WeakArea.weakness_score)).limit(3).all()
        
        return [
            {
                "subject": wa.subject.name if wa.subject else "Unknown",
                "topic": wa.topic.name if wa.topic else "General",
                "weakness_score": float(wa.weakness_score)
            }
            for wa in weak_areas
        ]
    
    def analyze_study_patterns(self, student_id: int) -> Dict[str, Any]:
        thirty_days_ago = date.today() - timedelta(days=30)
        
        exam_results = self.db.query(ExamResult).filter(
            ExamResult.student_id == student_id,
            ExamResult.created_at >= thirty_days_ago
        ).order_by(ExamResult.created_at).all()
        
        chapter_performance = self.db.query(ChapterPerformance).filter(
            ChapterPerformance.student_id == student_id
        ).order_by(desc(ChapterPerformance.mastery_score)).all()
        
        daily_tasks = self.db.query(DailyStudyTask).filter(
            DailyStudyTask.student_id == student_id,
            DailyStudyTask.task_date >= thirty_days_ago
        ).all()
        
        strong_subjects = []
        weak_subjects = []
        
        for perf in chapter_performance[:5]:
            if float(perf.mastery_score) >= 70:
                strong_subjects.append({
                    "subject": perf.subject.name if perf.subject else "Unknown",
                    "chapter": perf.chapter.name if perf.chapter else "Unknown",
                    "mastery_score": float(perf.mastery_score),
                    "proficiency": perf.proficiency_level
                })
        
        weak_areas = self.db.query(WeakArea).filter(
            WeakArea.student_id == student_id,
            WeakArea.is_resolved == False
        ).order_by(desc(WeakArea.weakness_score)).limit(5).all()
        
        for wa in weak_areas:
            weak_subjects.append({
                "subject": wa.subject.name if wa.subject else "Unknown",
                "topic": wa.topic.name if wa.topic else "General",
                "weakness_score": float(wa.weakness_score),
                "attempts": wa.attempts_count
            })
        
        study_hours_trend = []
        completed_tasks = [t for t in daily_tasks if t.status.value == "completed"]
        total_hours = sum(float(t.actual_duration_minutes or 0) / 60 for t in completed_tasks)
        avg_hours_per_day = total_hours / 30 if total_hours > 0 else 0
        
        performance_trend = []
        for result in exam_results:
            performance_trend.append({
                "date": result.created_at.strftime("%Y-%m-%d"),
                "percentage": float(result.percentage),
                "subject": result.subject.name if result.subject else "Unknown"
            })
        
        consistency_score = self._calculate_consistency_score(daily_tasks)
        
        recommendations = self._generate_study_recommendations(
            strong_subjects, weak_subjects, consistency_score, avg_hours_per_day
        )
        
        return {
            "strong_subjects": strong_subjects,
            "weak_subjects": weak_subjects,
            "study_hours_trend": [
                {"period": "Last 30 days", "hours": round(total_hours, 2), "avg_per_day": round(avg_hours_per_day, 2)}
            ],
            "performance_trend": performance_trend,
            "consistency_score": consistency_score,
            "recommendations": recommendations
        }
    
    def _calculate_consistency_score(self, tasks: List[DailyStudyTask]) -> float:
        if not tasks:
            return 0.0
        
        completed = sum(1 for t in tasks if t.status.value == "completed")
        total = len(tasks)
        return round((completed / total) * 100, 2)
    
    def _generate_study_recommendations(
        self,
        strong_subjects: List[Dict],
        weak_subjects: List[Dict],
        consistency_score: float,
        avg_hours: float
    ) -> List[str]:
        recommendations = []
        
        if consistency_score < 50:
            recommendations.append("Try to maintain a more consistent study schedule. Aim for daily study sessions.")
        
        if avg_hours < 2:
            recommendations.append("Consider increasing your daily study time to at least 2-3 hours.")
        
        if weak_subjects:
            top_weak = weak_subjects[0]
            recommendations.append(f"Focus on improving {top_weak['subject']} - {top_weak['topic']} with targeted practice.")
        
        if strong_subjects:
            recommendations.append(f"Great work on {strong_subjects[0]['subject']}! Keep up the momentum.")
        
        recommendations.append("Take regular breaks using the Pomodoro technique (25 min study, 5 min break).")
        
        return recommendations
    
    def generate_daily_plan(self, student_id: int, target_date: date) -> Dict[str, Any]:
        weak_areas = self.db.query(WeakArea).filter(
            WeakArea.student_id == student_id,
            WeakArea.is_resolved == False
        ).order_by(desc(WeakArea.weakness_score)).limit(5).all()
        
        existing_tasks = self.db.query(DailyStudyTask).filter(
            DailyStudyTask.student_id == student_id,
            DailyStudyTask.task_date == target_date
        ).all()
        
        tasks = []
        total_hours = 0.0
        
        for task in existing_tasks:
            tasks.append({
                "id": task.id,
                "title": task.title,
                "subject": task.subject.name if task.subject else "Unknown",
                "duration_minutes": task.estimated_duration_minutes,
                "priority": task.priority.value,
                "status": task.status.value
            })
            total_hours += task.estimated_duration_minutes / 60
        
        if not existing_tasks and weak_areas:
            for idx, wa in enumerate(weak_areas[:3]):
                duration = 60 if idx == 0 else 45
                tasks.append({
                    "title": f"Practice {wa.topic.name if wa.topic else 'General'}",
                    "subject": wa.subject.name if wa.subject else "Unknown",
                    "duration_minutes": duration,
                    "priority": "high" if idx == 0 else "medium",
                    "status": "pending",
                    "description": f"Focus on improving weak area: {wa.topic.name if wa.topic else 'General'}"
                })
                total_hours += duration / 60
        
        break_intervals = [
            {"time": "10:00 AM - 10:15 AM", "type": "short_break"},
            {"time": "12:30 PM - 1:30 PM", "type": "lunch_break"},
            {"time": "3:00 PM - 3:15 PM", "type": "short_break"},
            {"time": "5:00 PM - 5:15 PM", "type": "short_break"}
        ]
        
        priority_areas = [wa.topic.name if wa.topic else wa.subject.name for wa in weak_areas[:3]]
        
        motivational_tips = [
            "Start with your most challenging task when your mind is fresh",
            "Use active recall techniques instead of passive reading",
            "Teach concepts to someone else to reinforce learning",
            "Stay hydrated and take short breaks to maintain focus"
        ]
        
        return {
            "date": target_date.strftime("%Y-%m-%d"),
            "total_study_hours": round(total_hours, 2),
            "tasks": tasks,
            "break_intervals": break_intervals,
            "priority_areas": priority_areas,
            "motivational_tips": motivational_tips
        }
    
    def generate_motivational_message(self, student_id: int) -> Dict[str, Any]:
        student = self.db.query(Student).filter(Student.id == student_id).first()
        
        recent_results = self.db.query(ExamResult).filter(
            ExamResult.student_id == student_id
        ).order_by(desc(ExamResult.created_at)).limit(3).all()
        
        completed_tasks_count = self.db.query(func.count(DailyStudyTask.id)).filter(
            DailyStudyTask.student_id == student_id,
            DailyStudyTask.status == "completed",
            DailyStudyTask.task_date >= date.today() - timedelta(days=7)
        ).scalar() or 0
        
        message_type = "encouragement"
        message = f"Keep up the great work, {student.first_name if student else 'Student'}! "
        tips = []
        
        if recent_results:
            avg_percentage = sum(float(r.percentage) for r in recent_results) / len(recent_results)
            if avg_percentage >= 80:
                message += "Your recent performance has been excellent! 🌟"
                message_type = "celebration"
                tips.append("Maintain this momentum by consistent practice")
            elif avg_percentage >= 60:
                message += "You're making good progress! Keep pushing forward! 💪"
                tips.append("Focus on your weak areas to reach even greater heights")
            else:
                message += "Remember, every expert was once a beginner. You've got this! 🚀"
                tips.append("Break down complex topics into smaller, manageable chunks")
                tips.append("Don't hesitate to ask for help when needed")
        
        if completed_tasks_count >= 5:
            message += f" You've completed {completed_tasks_count} tasks this week - that's amazing dedication!"
            tips.append("Your consistency is paying off!")
        
        encouragement = "Success is not final, failure is not fatal: it is the courage to continue that counts. Keep learning, keep growing!"
        
        return {
            "message": message,
            "type": message_type,
            "tips": tips if tips else ["Stay focused", "Take breaks", "Believe in yourself"],
            "encouragement": encouragement
        }
    
    def create_insight(
        self,
        institution_id: int,
        student_id: int,
        insight_type: str,
        title: str,
        content: str,
        priority: int = 1,
        metadata: Optional[Dict[str, Any]] = None
    ) -> StudyBuddyInsight:
        insight = StudyBuddyInsight(
            institution_id=institution_id,
            student_id=student_id,
            insight_type=insight_type,
            title=title,
            content=content,
            priority=priority,
            metadata=metadata
        )
        self.db.add(insight)
        self.db.commit()
        self.db.refresh(insight)
        return insight
    
    def get_student_insights(
        self,
        student_id: int,
        is_read: Optional[bool] = None,
        limit: int = 20
    ) -> List[StudyBuddyInsight]:
        query = self.db.query(StudyBuddyInsight).filter(
            StudyBuddyInsight.student_id == student_id
        )
        if is_read is not None:
            query = query.filter(StudyBuddyInsight.is_read == is_read)
        return query.order_by(desc(StudyBuddyInsight.priority), desc(StudyBuddyInsight.created_at)).limit(limit).all()
    
    def mark_insight_read(self, insight_id: int) -> Optional[StudyBuddyInsight]:
        insight = self.db.query(StudyBuddyInsight).filter(
            StudyBuddyInsight.id == insight_id
        ).first()
        if insight:
            insight.is_read = True
            insight.read_at = datetime.utcnow()
            self.db.commit()
            self.db.refresh(insight)
        return insight
