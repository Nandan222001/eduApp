from sqlalchemy.orm import Session
from typing import List, Optional, Dict, Any
from datetime import date, datetime
from src.models.college_planning import (
    CollegeVisit,
    CollegeApplication,
    ApplicationStatus,
    DecisionOutcome,
)
from src.models.notification import Notification


class CollegePlanningService:
    def __init__(self, db: Session):
        self.db = db

    def create_college_visit(self, visit_data: Dict[str, Any]) -> CollegeVisit:
        visit = CollegeVisit(**visit_data)
        self.db.add(visit)
        self.db.commit()
        self.db.refresh(visit)
        return visit

    def get_college_visit(self, visit_id: int, institution_id: int) -> Optional[CollegeVisit]:
        return self.db.query(CollegeVisit).filter(
            CollegeVisit.id == visit_id,
            CollegeVisit.institution_id == institution_id,
            CollegeVisit.is_active == True
        ).first()

    def list_college_visits(
        self,
        student_id: int,
        institution_id: int,
        limit: int = 50,
        offset: int = 0
    ) -> List[CollegeVisit]:
        query = self.db.query(CollegeVisit).filter(
            CollegeVisit.student_id == student_id,
            CollegeVisit.institution_id == institution_id,
            CollegeVisit.is_active == True
        )
        return query.order_by(CollegeVisit.visit_date.desc()).limit(limit).offset(offset).all()

    def update_college_visit(
        self,
        visit_id: int,
        institution_id: int,
        update_data: Dict[str, Any]
    ) -> Optional[CollegeVisit]:
        visit = self.get_college_visit(visit_id, institution_id)
        if not visit:
            return None

        for key, value in update_data.items():
            setattr(visit, key, value)

        self.db.commit()
        self.db.refresh(visit)
        return visit

    def delete_college_visit(self, visit_id: int, institution_id: int) -> bool:
        visit = self.get_college_visit(visit_id, institution_id)
        if not visit:
            return False

        visit.is_active = False
        self.db.commit()
        return True

    def create_college_application(self, application_data: Dict[str, Any]) -> CollegeApplication:
        application = CollegeApplication(**application_data)
        self.db.add(application)
        self.db.commit()
        self.db.refresh(application)
        return application

    def get_college_application(
        self,
        application_id: int,
        institution_id: int
    ) -> Optional[CollegeApplication]:
        return self.db.query(CollegeApplication).filter(
            CollegeApplication.id == application_id,
            CollegeApplication.institution_id == institution_id,
            CollegeApplication.is_active == True
        ).first()

    def list_college_applications(
        self,
        student_id: int,
        institution_id: int,
        status: Optional[str] = None,
        limit: int = 50,
        offset: int = 0
    ) -> List[CollegeApplication]:
        query = self.db.query(CollegeApplication).filter(
            CollegeApplication.student_id == student_id,
            CollegeApplication.institution_id == institution_id,
            CollegeApplication.is_active == True
        )

        if status:
            query = query.filter(CollegeApplication.application_status == status)

        return query.order_by(CollegeApplication.deadline.asc()).limit(limit).offset(offset).all()

    def update_college_application(
        self,
        application_id: int,
        institution_id: int,
        update_data: Dict[str, Any]
    ) -> Optional[CollegeApplication]:
        application = self.get_college_application(application_id, institution_id)
        if not application:
            return None

        for key, value in update_data.items():
            setattr(application, key, value)

        self.db.commit()
        self.db.refresh(application)
        return application

    def delete_college_application(self, application_id: int, institution_id: int) -> bool:
        application = self.get_college_application(application_id, institution_id)
        if not application:
            return False

        application.is_active = False
        self.db.commit()
        return True

    def update_application_checklist(
        self,
        application_id: int,
        institution_id: int,
        checklist_data: Dict[str, Any]
    ) -> Optional[CollegeApplication]:
        application = self.get_college_application(application_id, institution_id)
        if not application:
            return None

        for key, value in checklist_data.items():
            if value is not None:
                setattr(application, key, value)

        if application.application_status == ApplicationStatus.NOT_STARTED:
            application.application_status = ApplicationStatus.IN_PROGRESS

        self.db.commit()
        self.db.refresh(application)
        return application

    def record_decision(
        self,
        application_id: int,
        institution_id: int,
        decision_outcome: str,
        financial_aid_offered: Optional[float] = None,
        scholarship_amount: Optional[float] = None,
        deposit_deadline: Optional[date] = None
    ) -> Optional[CollegeApplication]:
        application = self.get_college_application(application_id, institution_id)
        if not application:
            return None

        application.application_status = ApplicationStatus.DECISION_RECEIVED
        application.decision_outcome = decision_outcome
        application.financial_aid_offered = financial_aid_offered
        application.scholarship_amount = scholarship_amount
        application.deposit_deadline = deposit_deadline

        self.db.commit()
        self.db.refresh(application)

        self._create_decision_notification(application)

        return application

    def _create_decision_notification(self, application: CollegeApplication) -> None:
        outcome_messages = {
            DecisionOutcome.ACCEPTED: f"Congratulations! You've been accepted to {application.college_name}!",
            DecisionOutcome.REJECTED: f"Decision received from {application.college_name}.",
            DecisionOutcome.WAITLISTED: f"You've been waitlisted at {application.college_name}.",
            DecisionOutcome.DEFERRED: f"Your application to {application.college_name} has been deferred.",
        }

        message = outcome_messages.get(
            application.decision_outcome,
            f"Decision received from {application.college_name}."
        )

        notification = Notification(
            institution_id=application.institution_id,
            user_id=application.student_id,
            title="College Application Decision",
            message=message,
            type="college_decision",
            priority="high" if application.decision_outcome == DecisionOutcome.ACCEPTED else "medium",
            is_read=False,
        )

        self.db.add(notification)
        self.db.commit()

    def get_upcoming_deadlines(
        self,
        student_id: int,
        institution_id: int,
        days_ahead: int = 30
    ) -> List[CollegeApplication]:
        from datetime import timedelta
        
        today = date.today()
        future_date = today + timedelta(days=days_ahead)

        return self.db.query(CollegeApplication).filter(
            CollegeApplication.student_id == student_id,
            CollegeApplication.institution_id == institution_id,
            CollegeApplication.is_active == True,
            CollegeApplication.deadline >= today,
            CollegeApplication.deadline <= future_date,
            CollegeApplication.application_status != ApplicationStatus.SUBMITTED,
            CollegeApplication.application_status != ApplicationStatus.DECISION_RECEIVED
        ).order_by(CollegeApplication.deadline.asc()).all()

    def get_application_statistics(
        self,
        student_id: int,
        institution_id: int
    ) -> Dict[str, Any]:
        applications = self.list_college_applications(student_id, institution_id)

        stats = {
            "total_applications": len(applications),
            "by_status": {},
            "by_type": {},
            "by_outcome": {},
            "total_financial_aid": 0,
            "total_scholarships": 0,
        }

        for app in applications:
            status_key = app.application_status.value if hasattr(app.application_status, 'value') else app.application_status
            stats["by_status"][status_key] = stats["by_status"].get(status_key, 0) + 1

            type_key = app.application_type.value if hasattr(app.application_type, 'value') else app.application_type
            stats["by_type"][type_key] = stats["by_type"].get(type_key, 0) + 1

            if app.decision_outcome:
                outcome_key = app.decision_outcome.value if hasattr(app.decision_outcome, 'value') else app.decision_outcome
                stats["by_outcome"][outcome_key] = stats["by_outcome"].get(outcome_key, 0) + 1

            if app.financial_aid_offered:
                stats["total_financial_aid"] += float(app.financial_aid_offered)

            if app.scholarship_amount:
                stats["total_scholarships"] += float(app.scholarship_amount)

        return stats

    def share_with_counselor(
        self,
        student_id: int,
        institution_id: int,
        counselor_user_id: int,
        message: str,
        application_id: Optional[int] = None
    ) -> Notification:
        notification_message = f"Student collaboration request: {message}"
        
        if application_id:
            application = self.get_college_application(application_id, institution_id)
            if application:
                notification_message = f"Collaboration request for {application.college_name} application: {message}"

        notification = Notification(
            institution_id=institution_id,
            user_id=counselor_user_id,
            title="College Planning Collaboration Request",
            message=notification_message,
            type="counselor_collaboration",
            priority="medium",
            is_read=False,
        )

        self.db.add(notification)
        self.db.commit()
        self.db.refresh(notification)

        return notification
