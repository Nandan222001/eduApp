from typing import Optional, List, Dict, Any, Tuple
from datetime import datetime, timedelta
from sqlalchemy.orm import Session, joinedload
from sqlalchemy import and_, or_, func, desc
from fastapi import HTTPException, status
import re
from transformers import pipeline
import numpy as np

from src.models.wellbeing import (
    WellbeingAlert,
    AlertNote,
    WellbeingIntervention,
    SentimentAnalysis,
    BehavioralPattern,
    WellbeingConsent,
    WellbeingDataAccess,
    CounselorProfile,
    StudentWellbeingProfile,
    AlertSeverity,
    AlertStatus,
    AlertType,
    SentimentCategory,
    ConsentStatus,
)
from src.models.student import Student
from src.models.attendance import Attendance, AttendanceStatus
from src.models.assignment import Submission, SubmissionStatus
from src.models.study_group import GroupMessage, GroupMember
from src.models.notification import Message
from src.schemas.wellbeing import (
    WellbeingAlertCreate,
    WellbeingAlertUpdate,
    SentimentAnalysisCreate,
    BehavioralPatternCreate,
    AlertNoteCreate,
    WellbeingInterventionCreate,
    WellbeingInterventionUpdate,
    CounselorDashboardStats,
    StudentRiskSummary,
    DataAccessLogRequest,
)


class WellbeingService:
    
    DISTRESS_KEYWORDS = [
        'depressed', 'depression', 'anxious', 'anxiety', 'worried', 'stress', 'stressed',
        'overwhelmed', 'hopeless', 'helpless', 'worthless', 'suicide', 'suicidal',
        'self-harm', 'hurt myself', 'kill myself', 'end it all', 'can\'t cope',
        'give up', 'no point', 'lonely', 'isolated', 'scared', 'afraid', 'panic',
        'crying', 'sad', 'unhappy', 'miserable', 'terrible', 'awful', 'hate myself',
        'can\'t sleep', 'nightmares', 'exhausted', 'tired all the time', 'no energy'
    ]
    
    CRISIS_KEYWORDS = [
        'suicide', 'suicidal', 'kill myself', 'end my life', 'self-harm', 'cut myself',
        'overdose', 'jump off', 'want to die', 'better off dead', 'end it all',
        'say goodbye', 'final message', 'can\'t go on'
    ]
    
    def __init__(self, db: Session):
        self.db = db
        self._sentiment_analyzer = None
    
    @property
    def sentiment_analyzer(self):
        if self._sentiment_analyzer is None:
            try:
                self._sentiment_analyzer = pipeline(
                    "sentiment-analysis",
                    model="distilbert-base-uncased-finetuned-sst-2-english",
                    device=-1
                )
            except Exception:
                self._sentiment_analyzer = None
        return self._sentiment_analyzer
    
    def analyze_sentiment(
        self,
        content: str,
        student_id: int,
        institution_id: int,
        source_type: str,
        source_id: int
    ) -> SentimentAnalysis:
        sentiment_score, sentiment_category, confidence = self._calculate_sentiment(content)
        
        distress_indicators = self._detect_distress_indicators(content)
        detected_keywords = self._extract_keywords(content)
        
        flagged = sentiment_category in [
            SentimentCategory.DISTRESSED.value,
            SentimentCategory.CRISIS.value
        ] or distress_indicators.get('has_crisis_keywords', False)
        
        sentiment_analysis = SentimentAnalysis(
            institution_id=institution_id,
            student_id=student_id,
            source_type=source_type,
            source_id=source_id,
            content=content,
            sentiment_score=sentiment_score,
            sentiment_category=sentiment_category,
            distress_indicators=distress_indicators,
            detected_keywords=detected_keywords,
            confidence_score=confidence,
            flagged_for_review=flagged
        )
        
        self.db.add(sentiment_analysis)
        self.db.flush()
        
        if flagged:
            self._create_sentiment_alert(sentiment_analysis)
        
        return sentiment_analysis
    
    def _calculate_sentiment(self, content: str) -> Tuple[float, str, float]:
        if not content or len(content.strip()) < 10:
            return 0.0, SentimentCategory.NEUTRAL.value, 0.5
        
        distress_count = sum(
            1 for keyword in self.DISTRESS_KEYWORDS
            if keyword.lower() in content.lower()
        )
        crisis_count = sum(
            1 for keyword in self.CRISIS_KEYWORDS
            if keyword.lower() in content.lower()
        )
        
        if crisis_count > 0:
            return -0.9, SentimentCategory.CRISIS.value, 0.95
        
        if distress_count >= 3:
            return -0.7, SentimentCategory.DISTRESSED.value, 0.85
        elif distress_count >= 1:
            return -0.5, SentimentCategory.NEGATIVE.value, 0.75
        
        if self.sentiment_analyzer:
            try:
                result = self.sentiment_analyzer(content[:512])[0]
                label = result['label']
                score = result['score']
                
                if label == 'NEGATIVE':
                    if distress_count > 0:
                        sentiment_score = -0.6 - (score * 0.3)
                        category = SentimentCategory.DISTRESSED.value
                    else:
                        sentiment_score = -score
                        category = SentimentCategory.NEGATIVE.value
                else:
                    sentiment_score = score
                    category = SentimentCategory.POSITIVE.value
                
                return sentiment_score, category, score
            except Exception:
                pass
        
        sentiment_score = -0.2 if distress_count > 0 else 0.0
        category = SentimentCategory.NEGATIVE.value if distress_count > 0 else SentimentCategory.NEUTRAL.value
        
        return sentiment_score, category, 0.6
    
    def _detect_distress_indicators(self, content: str) -> Dict[str, Any]:
        content_lower = content.lower()
        
        distress_keywords_found = [
            kw for kw in self.DISTRESS_KEYWORDS
            if kw in content_lower
        ]
        crisis_keywords_found = [
            kw for kw in self.CRISIS_KEYWORDS
            if kw in content_lower
        ]
        
        has_negation = any(
            word in content_lower
            for word in ['no', 'not', 'never', 'nothing', 'nobody', 'can\'t', 'won\'t', 'don\'t']
        )
        
        has_isolation_language = any(
            phrase in content_lower
            for phrase in ['alone', 'by myself', 'no one', 'nobody cares', 'isolated']
        )
        
        has_helplessness = any(
            phrase in content_lower
            for phrase in ['can\'t do', 'give up', 'no point', 'hopeless', 'helpless']
        )
        
        return {
            'has_distress_keywords': len(distress_keywords_found) > 0,
            'distress_keywords': distress_keywords_found,
            'has_crisis_keywords': len(crisis_keywords_found) > 0,
            'crisis_keywords': crisis_keywords_found,
            'has_negation': has_negation,
            'has_isolation_language': has_isolation_language,
            'has_helplessness': has_helplessness,
            'distress_keyword_count': len(distress_keywords_found),
            'crisis_keyword_count': len(crisis_keywords_found)
        }
    
    def _extract_keywords(self, content: str) -> Dict[str, Any]:
        words = re.findall(r'\b\w+\b', content.lower())
        word_freq = {}
        for word in words:
            if len(word) > 3:
                word_freq[word] = word_freq.get(word, 0) + 1
        
        sorted_words = sorted(word_freq.items(), key=lambda x: x[1], reverse=True)[:10]
        
        return {
            'top_keywords': [word for word, _ in sorted_words],
            'word_count': len(words),
            'unique_words': len(word_freq)
        }
    
    def _create_sentiment_alert(self, sentiment: SentimentAnalysis) -> Optional[WellbeingAlert]:
        if sentiment.sentiment_category == SentimentCategory.CRISIS.value:
            severity = AlertSeverity.CRITICAL.value
            risk_score = 0.95
        elif sentiment.sentiment_category == SentimentCategory.DISTRESSED.value:
            severity = AlertSeverity.HIGH.value
            risk_score = 0.75
        else:
            severity = AlertSeverity.MEDIUM.value
            risk_score = 0.5
        
        title = f"Distress Detected in {sentiment.source_type}"
        description = f"Concerning language detected in student communication. Sentiment: {sentiment.sentiment_category}"
        
        recommended_actions = self._get_recommended_actions(sentiment)
        
        alert = WellbeingAlert(
            institution_id=sentiment.institution_id,
            student_id=sentiment.student_id,
            alert_type=AlertType.SENTIMENT_DISTRESS.value,
            severity=severity,
            title=title,
            description=description,
            risk_score=risk_score,
            detected_indicators={
                'sentiment_score': sentiment.sentiment_score,
                'sentiment_category': sentiment.sentiment_category,
                'distress_indicators': sentiment.distress_indicators,
                'source_type': sentiment.source_type,
                'source_id': sentiment.source_id
            },
            recommended_actions=recommended_actions,
            metadata={
                'sentiment_analysis_id': sentiment.id,
                'auto_escalate': sentiment.sentiment_category == SentimentCategory.CRISIS.value
            }
        )
        
        self.db.add(alert)
        self.db.flush()
        
        if sentiment.sentiment_category == SentimentCategory.CRISIS.value:
            self._assign_crisis_counselor(alert)
        
        self._update_wellbeing_profile(sentiment.student_id, sentiment.institution_id)
        
        return alert
    
    def _get_recommended_actions(self, sentiment: SentimentAnalysis) -> List[str]:
        if sentiment.sentiment_category == SentimentCategory.CRISIS.value:
            return [
                "IMMEDIATE: Contact student and ensure safety",
                "IMMEDIATE: Notify school counselor and administrator",
                "IMMEDIATE: Contact parent/guardian",
                "Consider emergency mental health services",
                "Document all communications and actions taken"
            ]
        elif sentiment.sentiment_category == SentimentCategory.DISTRESSED.value:
            return [
                "Contact student within 24 hours for check-in",
                "Schedule meeting with school counselor",
                "Notify parent/guardian if consent allows",
                "Monitor communications closely",
                "Provide mental health resources"
            ]
        else:
            return [
                "Monitor student communications",
                "Consider informal check-in",
                "Track sentiment trends over time",
                "Provide general wellness resources"
            ]
    
    def analyze_behavioral_patterns(
        self,
        student_id: int,
        institution_id: int,
        analysis_days: int = 30
    ) -> List[BehavioralPattern]:
        end_date = datetime.utcnow()
        start_date = end_date - timedelta(days=analysis_days)
        baseline_start = start_date - timedelta(days=analysis_days)
        
        patterns = []
        
        attendance_pattern = self._analyze_attendance_pattern(
            student_id, institution_id, baseline_start, start_date, end_date
        )
        if attendance_pattern:
            patterns.append(attendance_pattern)
        
        grade_pattern = self._analyze_grade_pattern(
            student_id, institution_id, baseline_start, start_date, end_date
        )
        if grade_pattern:
            patterns.append(grade_pattern)
        
        participation_pattern = self._analyze_participation_pattern(
            student_id, institution_id, baseline_start, start_date, end_date
        )
        if participation_pattern:
            patterns.append(participation_pattern)
        
        social_pattern = self._analyze_social_pattern(
            student_id, institution_id, baseline_start, start_date, end_date
        )
        if social_pattern:
            patterns.append(social_pattern)
        
        for pattern in patterns:
            self.db.add(pattern)
            if pattern.is_concerning:
                self._create_behavioral_alert(pattern)
        
        self.db.flush()
        
        return patterns
    
    def _analyze_attendance_pattern(
        self,
        student_id: int,
        institution_id: int,
        baseline_start: datetime,
        current_start: datetime,
        end_date: datetime
    ) -> Optional[BehavioralPattern]:
        baseline_attendance = self.db.query(Attendance).filter(
            and_(
                Attendance.student_id == student_id,
                Attendance.date >= baseline_start.date(),
                Attendance.date < current_start.date()
            )
        ).all()
        
        current_attendance = self.db.query(Attendance).filter(
            and_(
                Attendance.student_id == student_id,
                Attendance.date >= current_start.date(),
                Attendance.date <= end_date.date()
            )
        ).all()
        
        if not baseline_attendance and not current_attendance:
            return None
        
        baseline_total = len(baseline_attendance)
        baseline_present = sum(
            1 for a in baseline_attendance
            if a.status == AttendanceStatus.PRESENT
        )
        baseline_rate = (baseline_present / baseline_total * 100) if baseline_total > 0 else 100
        
        current_total = len(current_attendance)
        current_present = sum(
            1 for a in current_attendance
            if a.status == AttendanceStatus.PRESENT
        )
        current_rate = (current_present / current_total * 100) if current_total > 0 else 100
        
        change_percentage = ((current_rate - baseline_rate) / baseline_rate * 100) if baseline_rate > 0 else 0
        
        is_concerning = change_percentage < -20
        concern_level = min(abs(change_percentage) / 100, 1.0) if is_concerning else 0.0
        
        return BehavioralPattern(
            institution_id=institution_id,
            student_id=student_id,
            pattern_type='attendance',
            period_start=current_start,
            period_end=end_date,
            baseline_metrics={
                'attendance_rate': baseline_rate,
                'total_days': baseline_total,
                'present_days': baseline_present
            },
            current_metrics={
                'attendance_rate': current_rate,
                'total_days': current_total,
                'present_days': current_present
            },
            change_percentage=change_percentage,
            is_concerning=is_concerning,
            concern_level=concern_level,
            details={
                'baseline_period': f"{baseline_start.date()} to {current_start.date()}",
                'current_period': f"{current_start.date()} to {end_date.date()}"
            }
        )
    
    def _analyze_grade_pattern(
        self,
        student_id: int,
        institution_id: int,
        baseline_start: datetime,
        current_start: datetime,
        end_date: datetime
    ) -> Optional[BehavioralPattern]:
        baseline_submissions = self.db.query(Submission).filter(
            and_(
                Submission.student_id == student_id,
                Submission.status == SubmissionStatus.GRADED,
                Submission.graded_at >= baseline_start,
                Submission.graded_at < current_start,
                Submission.marks_obtained.isnot(None)
            )
        ).all()
        
        current_submissions = self.db.query(Submission).filter(
            and_(
                Submission.student_id == student_id,
                Submission.status == SubmissionStatus.GRADED,
                Submission.graded_at >= current_start,
                Submission.graded_at <= end_date,
                Submission.marks_obtained.isnot(None)
            )
        ).all()
        
        if not baseline_submissions or not current_submissions:
            return None
        
        baseline_avg = sum(
            float(s.marks_obtained) for s in baseline_submissions
        ) / len(baseline_submissions)
        
        current_avg = sum(
            float(s.marks_obtained) for s in current_submissions
        ) / len(current_submissions)
        
        change_percentage = ((current_avg - baseline_avg) / baseline_avg * 100) if baseline_avg > 0 else 0
        
        is_concerning = change_percentage < -15
        concern_level = min(abs(change_percentage) / 100, 1.0) if is_concerning else 0.0
        
        return BehavioralPattern(
            institution_id=institution_id,
            student_id=student_id,
            pattern_type='grade',
            period_start=current_start,
            period_end=end_date,
            baseline_metrics={
                'average_grade': baseline_avg,
                'total_submissions': len(baseline_submissions)
            },
            current_metrics={
                'average_grade': current_avg,
                'total_submissions': len(current_submissions)
            },
            change_percentage=change_percentage,
            is_concerning=is_concerning,
            concern_level=concern_level
        )
    
    def _analyze_participation_pattern(
        self,
        student_id: int,
        institution_id: int,
        baseline_start: datetime,
        current_start: datetime,
        end_date: datetime
    ) -> Optional[BehavioralPattern]:
        student = self.db.query(Student).filter(Student.id == student_id).first()
        if not student or not student.user_id:
            return None
        
        baseline_messages = self.db.query(GroupMessage).filter(
            and_(
                GroupMessage.user_id == student.user_id,
                GroupMessage.created_at >= baseline_start,
                GroupMessage.created_at < current_start
            )
        ).count()
        
        current_messages = self.db.query(GroupMessage).filter(
            and_(
                GroupMessage.user_id == student.user_id,
                GroupMessage.created_at >= current_start,
                GroupMessage.created_at <= end_date
            )
        ).count()
        
        baseline_submissions = self.db.query(Submission).filter(
            and_(
                Submission.student_id == student_id,
                Submission.submitted_at >= baseline_start,
                Submission.submitted_at < current_start
            )
        ).count()
        
        current_submissions = self.db.query(Submission).filter(
            and_(
                Submission.student_id == student_id,
                Submission.submitted_at >= current_start,
                Submission.submitted_at <= end_date
            )
        ).count()
        
        baseline_total = baseline_messages + baseline_submissions
        current_total = current_messages + current_submissions
        
        if baseline_total == 0 and current_total == 0:
            return None
        
        change_percentage = (
            ((current_total - baseline_total) / baseline_total * 100)
            if baseline_total > 0 else 0
        )
        
        is_concerning = change_percentage < -30
        concern_level = min(abs(change_percentage) / 100, 1.0) if is_concerning else 0.0
        
        return BehavioralPattern(
            institution_id=institution_id,
            student_id=student_id,
            pattern_type='participation',
            period_start=current_start,
            period_end=end_date,
            baseline_metrics={
                'messages': baseline_messages,
                'submissions': baseline_submissions,
                'total_activities': baseline_total
            },
            current_metrics={
                'messages': current_messages,
                'submissions': current_submissions,
                'total_activities': current_total
            },
            change_percentage=change_percentage,
            is_concerning=is_concerning,
            concern_level=concern_level
        )
    
    def _analyze_social_pattern(
        self,
        student_id: int,
        institution_id: int,
        baseline_start: datetime,
        current_start: datetime,
        end_date: datetime
    ) -> Optional[BehavioralPattern]:
        student = self.db.query(Student).filter(Student.id == student_id).first()
        if not student or not student.user_id:
            return None
        
        baseline_groups = self.db.query(GroupMember).filter(
            and_(
                GroupMember.user_id == student.user_id,
                GroupMember.joined_at >= baseline_start,
                GroupMember.joined_at < current_start
            )
        ).count()
        
        current_groups = self.db.query(GroupMember).filter(
            and_(
                GroupMember.user_id == student.user_id,
                GroupMember.joined_at >= current_start,
                GroupMember.joined_at <= end_date
            )
        ).count()
        
        active_baseline_groups = self.db.query(GroupMember).filter(
            and_(
                GroupMember.user_id == student.user_id,
                GroupMember.last_active_at >= baseline_start,
                GroupMember.last_active_at < current_start
            )
        ).count()
        
        active_current_groups = self.db.query(GroupMember).filter(
            and_(
                GroupMember.user_id == student.user_id,
                GroupMember.last_active_at >= current_start,
                GroupMember.last_active_at <= end_date
            )
        ).count()
        
        if active_baseline_groups == 0 and active_current_groups == 0:
            return None
        
        change_percentage = (
            ((active_current_groups - active_baseline_groups) / active_baseline_groups * 100)
            if active_baseline_groups > 0 else 0
        )
        
        is_concerning = change_percentage < -50 or active_current_groups == 0
        concern_level = min(abs(change_percentage) / 100, 1.0) if is_concerning else 0.0
        
        return BehavioralPattern(
            institution_id=institution_id,
            student_id=student_id,
            pattern_type='social',
            period_start=current_start,
            period_end=end_date,
            baseline_metrics={
                'new_groups': baseline_groups,
                'active_groups': active_baseline_groups
            },
            current_metrics={
                'new_groups': current_groups,
                'active_groups': active_current_groups
            },
            change_percentage=change_percentage,
            is_concerning=is_concerning,
            concern_level=concern_level
        )
    
    def _create_behavioral_alert(self, pattern: BehavioralPattern) -> WellbeingAlert:
        pattern_labels = {
            'attendance': 'Attendance Drop',
            'grade': 'Grade Decline',
            'participation': 'Reduced Participation',
            'social': 'Social Isolation'
        }
        
        alert_types = {
            'attendance': AlertType.ATTENDANCE_DROP.value,
            'grade': AlertType.GRADE_DECLINE.value,
            'participation': AlertType.PARTICIPATION_DROP.value,
            'social': AlertType.SOCIAL_ISOLATION.value
        }
        
        if pattern.concern_level >= 0.7:
            severity = AlertSeverity.HIGH.value
        elif pattern.concern_level >= 0.5:
            severity = AlertSeverity.MEDIUM.value
        else:
            severity = AlertSeverity.LOW.value
        
        title = f"{pattern_labels.get(pattern.pattern_type, 'Behavioral Change')} Detected"
        description = (
            f"Significant change in {pattern.pattern_type} behavior detected. "
            f"Change: {pattern.change_percentage:.1f}%"
        )
        
        recommended_actions = [
            f"Review {pattern.pattern_type} patterns with student",
            "Schedule check-in meeting",
            "Assess for underlying issues",
            "Provide targeted support and resources"
        ]
        
        alert = WellbeingAlert(
            institution_id=pattern.institution_id,
            student_id=pattern.student_id,
            alert_type=alert_types.get(pattern.pattern_type, AlertType.BEHAVIORAL_CHANGE.value),
            severity=severity,
            title=title,
            description=description,
            risk_score=pattern.concern_level,
            detected_indicators={
                'pattern_type': pattern.pattern_type,
                'change_percentage': pattern.change_percentage,
                'baseline_metrics': pattern.baseline_metrics,
                'current_metrics': pattern.current_metrics
            },
            recommended_actions=recommended_actions,
            metadata={'behavioral_pattern_id': pattern.id}
        )
        
        self.db.add(alert)
        self.db.flush()
        
        self._update_wellbeing_profile(pattern.student_id, pattern.institution_id)
        
        return alert
    
    def _assign_crisis_counselor(self, alert: WellbeingAlert) -> None:
        counselor = self.db.query(CounselorProfile).filter(
            and_(
                CounselorProfile.institution_id == alert.institution_id,
                CounselorProfile.is_active == True,
                CounselorProfile.can_handle_crisis == True,
                CounselorProfile.current_case_load < CounselorProfile.max_case_load
            )
        ).order_by(CounselorProfile.current_case_load).first()
        
        if counselor:
            alert.assigned_counselor_id = counselor.user_id
            counselor.current_case_load += 1
    
    def _update_wellbeing_profile(self, student_id: int, institution_id: int) -> None:
        profile = self.db.query(StudentWellbeingProfile).filter(
            StudentWellbeingProfile.student_id == student_id
        ).first()
        
        if not profile:
            profile = StudentWellbeingProfile(
                institution_id=institution_id,
                student_id=student_id
            )
            self.db.add(profile)
        
        alerts = self.db.query(WellbeingAlert).filter(
            WellbeingAlert.student_id == student_id
        ).all()
        
        profile.total_alerts = len(alerts)
        profile.active_alerts = sum(
            1 for a in alerts
            if a.status in [AlertStatus.PENDING.value, AlertStatus.IN_PROGRESS.value, AlertStatus.ACKNOWLEDGED.value]
        )
        profile.resolved_alerts = sum(
            1 for a in alerts
            if a.status == AlertStatus.RESOLVED.value
        )
        
        recent_sentiments = self.db.query(SentimentAnalysis).filter(
            and_(
                SentimentAnalysis.student_id == student_id,
                SentimentAnalysis.created_at >= datetime.utcnow() - timedelta(days=30)
            )
        ).all()
        
        if recent_sentiments:
            avg_sentiment = sum(s.sentiment_score for s in recent_sentiments) / len(recent_sentiments)
            profile.sentiment_trend = avg_sentiment
        
        recent_patterns = self.db.query(BehavioralPattern).filter(
            and_(
                BehavioralPattern.student_id == student_id,
                BehavioralPattern.created_at >= datetime.utcnow() - timedelta(days=30)
            )
        ).all()
        
        for pattern in recent_patterns:
            if pattern.pattern_type == 'attendance':
                profile.attendance_trend = pattern.change_percentage / 100
            elif pattern.pattern_type == 'grade':
                profile.grade_trend = pattern.change_percentage / 100
            elif pattern.pattern_type == 'participation':
                profile.participation_trend = pattern.change_percentage / 100
            elif pattern.pattern_type == 'social':
                profile.social_trend = pattern.change_percentage / 100
        
        risk_factors = []
        if profile.sentiment_trend < -0.5:
            risk_factors.append(0.3)
        if profile.attendance_trend < -0.2:
            risk_factors.append(0.25)
        if profile.grade_trend < -0.15:
            risk_factors.append(0.2)
        if profile.participation_trend < -0.3:
            risk_factors.append(0.15)
        if profile.social_trend < -0.5:
            risk_factors.append(0.1)
        
        profile.overall_risk_score = min(sum(risk_factors), 1.0)
        
        if profile.overall_risk_score >= 0.7:
            profile.current_risk_level = 'critical'
        elif profile.overall_risk_score >= 0.5:
            profile.current_risk_level = 'high'
        elif profile.overall_risk_score >= 0.3:
            profile.current_risk_level = 'medium'
        else:
            profile.current_risk_level = 'low'
        
        profile.last_assessment_date = datetime.utcnow()
        profile.next_review_date = datetime.utcnow() + timedelta(
            days=7 if profile.current_risk_level in ['critical', 'high'] else 30
        )
    
    def get_counselor_dashboard(
        self,
        institution_id: int,
        counselor_id: Optional[int] = None
    ) -> Dict[str, Any]:
        query_filter = [WellbeingAlert.institution_id == institution_id]
        if counselor_id:
            query_filter.append(WellbeingAlert.assigned_counselor_id == counselor_id)
        
        active_alerts = self.db.query(WellbeingAlert).filter(
            and_(
                *query_filter,
                WellbeingAlert.status.in_([
                    AlertStatus.PENDING.value,
                    AlertStatus.ACKNOWLEDGED.value,
                    AlertStatus.IN_PROGRESS.value
                ])
            )
        ).all()
        
        critical_alerts = [a for a in active_alerts if a.severity == AlertSeverity.CRITICAL.value]
        
        high_risk_students = self.db.query(StudentWellbeingProfile).filter(
            and_(
                StudentWellbeingProfile.institution_id == institution_id,
                StudentWellbeingProfile.current_risk_level.in_(['high', 'critical'])
            )
        ).count()
        
        medium_risk_students = self.db.query(StudentWellbeingProfile).filter(
            and_(
                StudentWellbeingProfile.institution_id == institution_id,
                StudentWellbeingProfile.current_risk_level == 'medium'
            )
        ).count()
        
        pending_interventions = self.db.query(WellbeingIntervention).filter(
            and_(
                WellbeingIntervention.institution_id == institution_id,
                WellbeingIntervention.completed_at.is_(None)
            )
        ).count()
        
        overdue_reviews = self.db.query(StudentWellbeingProfile).filter(
            and_(
                StudentWellbeingProfile.institution_id == institution_id,
                StudentWellbeingProfile.next_review_date < datetime.utcnow()
            )
        ).count()
        
        stats = CounselorDashboardStats(
            total_students_monitored=self.db.query(StudentWellbeingProfile).filter(
                StudentWellbeingProfile.institution_id == institution_id
            ).count(),
            active_alerts_count=len(active_alerts),
            critical_alerts_count=len(critical_alerts),
            high_risk_students=high_risk_students,
            medium_risk_students=medium_risk_students,
            pending_interventions=pending_interventions,
            overdue_reviews=overdue_reviews
        )
        
        return {
            'stats': stats,
            'active_alerts': active_alerts[:10],
            'critical_alerts': critical_alerts
        }
    
    def check_data_access_consent(
        self,
        student_id: int,
        institution_id: int
    ) -> Tuple[bool, str]:
        consent = self.db.query(WellbeingConsent).filter(
            and_(
                WellbeingConsent.student_id == student_id,
                WellbeingConsent.institution_id == institution_id,
                WellbeingConsent.status == ConsentStatus.GRANTED.value,
                or_(
                    WellbeingConsent.expires_at.is_(None),
                    WellbeingConsent.expires_at > datetime.utcnow()
                )
            )
        ).first()
        
        if not consent:
            return False, 'none'
        
        return True, consent.data_access_level
    
    def log_data_access(
        self,
        user_id: int,
        student_id: int,
        institution_id: int,
        log_request: DataAccessLogRequest
    ) -> WellbeingDataAccess:
        access_log = WellbeingDataAccess(
            institution_id=institution_id,
            user_id=user_id,
            student_id=student_id,
            access_type='view',
            resource_type=log_request.resource_type,
            resource_id=log_request.resource_id,
            purpose=log_request.purpose
        )
        
        self.db.add(access_log)
        self.db.flush()
        
        return access_log
