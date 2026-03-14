from datetime import datetime, timedelta
from typing import List
from sqlalchemy.orm import Session
from sqlalchemy import and_

from src.database import SessionLocal
from src.services.wellbeing_service import WellbeingService
from src.models.student import Student
from src.models.assignment import Submission
from src.models.study_group import GroupMessage
from src.models.notification import Message
from src.models.wellbeing import WellbeingConsent, ConsentStatus
from src.celery_app import celery_app


@celery_app.task(name="monitor_student_wellbeing")
def monitor_student_wellbeing(institution_id: int) -> dict:
    """
    Background task to monitor student wellbeing across the institution.
    Analyzes recent communications and behavioral patterns.
    """
    db = SessionLocal()
    
    try:
        service = WellbeingService(db)
        
        students_with_consent = db.query(Student).join(
            WellbeingConsent,
            and_(
                WellbeingConsent.student_id == Student.id,
                WellbeingConsent.status == ConsentStatus.GRANTED.value,
                WellbeingConsent.institution_id == institution_id
            )
        ).filter(
            Student.institution_id == institution_id,
            Student.is_active == True
        ).all()
        
        analyzed_count = 0
        alerts_created = 0
        
        lookback_time = datetime.utcnow() - timedelta(hours=24)
        
        for student in students_with_consent:
            if not student.user_id:
                continue
            
            recent_messages = db.query(GroupMessage).filter(
                and_(
                    GroupMessage.user_id == student.user_id,
                    GroupMessage.created_at >= lookback_time
                )
            ).all()
            
            for message in recent_messages:
                if len(message.content) >= 10:
                    sentiment = service.analyze_sentiment(
                        content=message.content,
                        student_id=student.id,
                        institution_id=institution_id,
                        source_type="group_message",
                        source_id=message.id
                    )
                    if sentiment.flagged_for_review:
                        alerts_created += 1
            
            recent_submissions = db.query(Submission).filter(
                and_(
                    Submission.student_id == student.id,
                    Submission.submitted_at >= lookback_time,
                    Submission.submission_text.isnot(None)
                )
            ).all()
            
            for submission in recent_submissions:
                if submission.submission_text and len(submission.submission_text) >= 10:
                    sentiment = service.analyze_sentiment(
                        content=submission.submission_text,
                        student_id=student.id,
                        institution_id=institution_id,
                        source_type="assignment_submission",
                        source_id=submission.id
                    )
                    if sentiment.flagged_for_review:
                        alerts_created += 1
            
            analyzed_count += 1
        
        db.commit()
        
        return {
            'status': 'success',
            'students_analyzed': analyzed_count,
            'alerts_created': alerts_created,
            'timestamp': datetime.utcnow().isoformat()
        }
        
    except Exception as e:
        db.rollback()
        return {
            'status': 'error',
            'error': str(e),
            'timestamp': datetime.utcnow().isoformat()
        }
    finally:
        db.close()


@celery_app.task(name="analyze_behavioral_patterns_batch")
def analyze_behavioral_patterns_batch(institution_id: int) -> dict:
    """
    Background task to analyze behavioral patterns for all students.
    Runs weekly to detect trends.
    """
    db = SessionLocal()
    
    try:
        service = WellbeingService(db)
        
        students_with_consent = db.query(Student).join(
            WellbeingConsent,
            and_(
                WellbeingConsent.student_id == Student.id,
                WellbeingConsent.status == ConsentStatus.GRANTED.value,
                WellbeingConsent.institution_id == institution_id
            )
        ).filter(
            Student.institution_id == institution_id,
            Student.is_active == True
        ).all()
        
        analyzed_count = 0
        patterns_detected = 0
        
        for student in students_with_consent:
            patterns = service.analyze_behavioral_patterns(
                student_id=student.id,
                institution_id=institution_id,
                analysis_days=30
            )
            
            patterns_detected += len([p for p in patterns if p.is_concerning])
            analyzed_count += 1
        
        db.commit()
        
        return {
            'status': 'success',
            'students_analyzed': analyzed_count,
            'patterns_detected': patterns_detected,
            'timestamp': datetime.utcnow().isoformat()
        }
        
    except Exception as e:
        db.rollback()
        return {
            'status': 'error',
            'error': str(e),
            'timestamp': datetime.utcnow().isoformat()
        }
    finally:
        db.close()


@celery_app.task(name="update_wellbeing_profiles")
def update_wellbeing_profiles(institution_id: int) -> dict:
    """
    Background task to update all student wellbeing profiles.
    Runs daily to refresh risk scores and trends.
    """
    db = SessionLocal()
    
    try:
        service = WellbeingService(db)
        
        students = db.query(Student).filter(
            Student.institution_id == institution_id,
            Student.is_active == True
        ).all()
        
        updated_count = 0
        
        for student in students:
            service._update_wellbeing_profile(student.id, institution_id)
            updated_count += 1
        
        db.commit()
        
        return {
            'status': 'success',
            'profiles_updated': updated_count,
            'timestamp': datetime.utcnow().isoformat()
        }
        
    except Exception as e:
        db.rollback()
        return {
            'status': 'error',
            'error': str(e),
            'timestamp': datetime.utcnow().isoformat()
        }
    finally:
        db.close()


@celery_app.task(name="notify_overdue_reviews")
def notify_overdue_reviews(institution_id: int) -> dict:
    """
    Background task to notify counselors about overdue student reviews.
    """
    db = SessionLocal()
    
    try:
        from src.models.wellbeing import StudentWellbeingProfile
        from src.models.notification import Notification, NotificationChannel, NotificationPriority
        
        overdue_profiles = db.query(StudentWellbeingProfile).filter(
            and_(
                StudentWellbeingProfile.institution_id == institution_id,
                StudentWellbeingProfile.next_review_date < datetime.utcnow(),
                StudentWellbeingProfile.current_risk_level.in_(['medium', 'high', 'critical'])
            )
        ).all()
        
        notifications_sent = 0
        
        for profile in overdue_profiles:
            from src.models.wellbeing import WellbeingAlert, AlertStatus
            
            active_alert = db.query(WellbeingAlert).filter(
                and_(
                    WellbeingAlert.student_id == profile.student_id,
                    WellbeingAlert.assigned_counselor_id.isnot(None),
                    WellbeingAlert.status.in_([
                        AlertStatus.PENDING.value,
                        AlertStatus.ACKNOWLEDGED.value,
                        AlertStatus.IN_PROGRESS.value
                    ])
                )
            ).first()
            
            if active_alert and active_alert.assigned_counselor_id:
                notification = Notification(
                    institution_id=institution_id,
                    user_id=active_alert.assigned_counselor_id,
                    title="Overdue Student Wellbeing Review",
                    message=f"Student review is overdue. Risk level: {profile.current_risk_level}",
                    notification_type="wellbeing_review_overdue",
                    priority=NotificationPriority.HIGH.value,
                    channel=NotificationChannel.IN_APP.value,
                    data={
                        'student_id': profile.student_id,
                        'risk_level': profile.current_risk_level,
                        'alert_id': active_alert.id
                    }
                )
                db.add(notification)
                notifications_sent += 1
        
        db.commit()
        
        return {
            'status': 'success',
            'overdue_reviews': len(overdue_profiles),
            'notifications_sent': notifications_sent,
            'timestamp': datetime.utcnow().isoformat()
        }
        
    except Exception as e:
        db.rollback()
        return {
            'status': 'error',
            'error': str(e),
            'timestamp': datetime.utcnow().isoformat()
        }
    finally:
        db.close()
