from datetime import date, datetime, timedelta
from typing import Any

from fastapi import HTTPException, status
from sqlalchemy import func, or_
from sqlalchemy.orm import Session, joinedload

from src.models.institution import Institution
from src.models.school_admin import (
    EnquiryRecord,
    EnquiryStatus,
    SMSTemplate,
)
from src.services.notification_providers import NotificationProviderFactory


class EnquirySMSService:
    def __init__(self, db: Session):
        self.db = db

    def create_enquiry(
        self,
        institution_id: int,
        student_name: str,
        parent_name: str,
        parent_phone: str,
        source: str,
        enquiry_for_grade: str | None = None,
        parent_email: str | None = None,
        notes: str | None = None,
        assigned_to: int | None = None,
        follow_up_date: date | None = None,
    ) -> EnquiryRecord:
        enquiry = EnquiryRecord(
            institution_id=institution_id,
            enquiry_date=date.today(),
            student_name=student_name,
            parent_name=parent_name,
            parent_phone=parent_phone,
            parent_email=parent_email,
            enquiry_for_grade=enquiry_for_grade,
            source=source,
            status=EnquiryStatus.NEW.value,
            notes=notes,
            assigned_to=assigned_to,
            follow_up_date=follow_up_date,
            sms_sent_count=0,
        )

        self.db.add(enquiry)
        self.db.commit()
        self.db.refresh(enquiry)
        return enquiry

    def update_enquiry_status(
        self,
        enquiry_id: int,
        status: str,
        notes: str | None = None,
        follow_up_date: date | None = None,
        assigned_to: int | None = None,
    ) -> EnquiryRecord | None:
        enquiry = (
            self.db.query(EnquiryRecord)
            .filter(EnquiryRecord.id == enquiry_id)
            .first()
        )

        if not enquiry:
            return None

        enquiry.status = status

        if notes is not None:
            if enquiry.notes:
                enquiry.notes += f"\n\n[{datetime.now().strftime('%Y-%m-%d %H:%M:%S')}] {notes}"
            else:
                enquiry.notes = notes

        if follow_up_date is not None:
            enquiry.follow_up_date = follow_up_date

        if assigned_to is not None:
            enquiry.assigned_to = assigned_to

        self.db.commit()
        self.db.refresh(enquiry)
        return enquiry

    def _substitute_placeholders(
        self, template: str, enquiry: EnquiryRecord, institution_name: str
    ) -> str:
        placeholders = {
            "{{student_name}}": enquiry.student_name or "",
            "{{parent_name}}": enquiry.parent_name or "",
            "{{grade}}": enquiry.enquiry_for_grade or "",
            "{{institution_name}}": institution_name or "",
        }

        result = template
        for placeholder, value in placeholders.items():
            result = result.replace(placeholder, value)

        return result

    async def send_enquiry_sms(
        self,
        enquiry_id: int,
        template_id: int | None = None,
        custom_message: str | None = None,
    ) -> dict[str, Any]:
        enquiry = (
            self.db.query(EnquiryRecord)
            .filter(EnquiryRecord.id == enquiry_id)
            .first()
        )

        if not enquiry:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Enquiry not found",
            )

        institution = (
            self.db.query(Institution)
            .filter(Institution.id == enquiry.institution_id)
            .first()
        )

        institution_name = institution.name if institution else ""

        if custom_message:
            message = self._substitute_placeholders(
                custom_message, enquiry, institution_name
            )
        elif template_id:
            template = (
                self.db.query(SMSTemplate)
                .filter(
                    SMSTemplate.id == template_id,
                    SMSTemplate.institution_id == enquiry.institution_id,
                    SMSTemplate.is_active is True,
                )
                .first()
            )

            if not template:
                raise HTTPException(
                    status_code=status.HTTP_404_NOT_FOUND,
                    detail="SMS template not found or inactive",
                )

            message = self._substitute_placeholders(
                template.message_body, enquiry, institution_name
            )
        else:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Either template_id or custom_message must be provided",
            )

        sms_provider = NotificationProviderFactory.get_provider("sms")

        success = await sms_provider.send(
            recipient=enquiry.parent_phone,
            subject="Enquiry Response",
            content=message,
            data={"template_id": str(template_id) if template_id else None},
        )

        if success:
            enquiry.sms_sent_count += 1
            enquiry.last_sms_sent_at = datetime.now()
            self.db.commit()

            return {
                "success": True,
                "message": "SMS sent successfully",
                "enquiry_id": enquiry_id,
                "sms_sent_count": enquiry.sms_sent_count,
            }
        else:
            return {
                "success": False,
                "message": "Failed to send SMS",
                "enquiry_id": enquiry_id,
            }

    def get_enquiry_statistics(
        self, institution_id: int, start_date: date | None = None, end_date: date | None = None
    ) -> dict[str, Any]:
        query = self.db.query(EnquiryRecord).filter(
            EnquiryRecord.institution_id == institution_id
        )

        if start_date:
            query = query.filter(EnquiryRecord.enquiry_date >= start_date)
        if end_date:
            query = query.filter(EnquiryRecord.enquiry_date <= end_date)

        total_enquiries = query.count()

        status_counts = (
            query.with_entities(
                EnquiryRecord.status, func.count(EnquiryRecord.id).label("count")
            )
            .group_by(EnquiryRecord.status)
            .all()
        )

        status_breakdown = dict(status_counts)

        source_counts = (
            query.with_entities(
                EnquiryRecord.source, func.count(EnquiryRecord.id).label("count")
            )
            .group_by(EnquiryRecord.source)
            .all()
        )

        source_breakdown = dict(source_counts)

        grade_counts = (
            query.filter(EnquiryRecord.enquiry_for_grade.isnot(None))
            .with_entities(
                EnquiryRecord.enquiry_for_grade,
                func.count(EnquiryRecord.id).label("count"),
            )
            .group_by(EnquiryRecord.enquiry_for_grade)
            .all()
        )

        grade_breakdown = dict(grade_counts)

        conversion_rate = 0
        if total_enquiries > 0:
            converted_count = status_breakdown.get(EnquiryStatus.CONVERTED.value, 0)
            conversion_rate = (converted_count / total_enquiries) * 100

        return {
            "total_enquiries": total_enquiries,
            "status_breakdown": status_breakdown,
            "source_breakdown": source_breakdown,
            "grade_breakdown": grade_breakdown,
            "conversion_rate": round(conversion_rate, 2),
            "date_range": {
                "start_date": start_date.isoformat() if start_date else None,
                "end_date": end_date.isoformat() if end_date else None,
            },
        }

    def get_follow_up_due(
        self,
        institution_id: int,
        days_ahead: int = 7,
        assigned_to: int | None = None,
    ) -> list[EnquiryRecord]:
        today = date.today()
        end_date = today + timedelta(days=days_ahead)

        query = (
            self.db.query(EnquiryRecord)
            .filter(
                EnquiryRecord.institution_id == institution_id,
                EnquiryRecord.follow_up_date.isnot(None),
                EnquiryRecord.follow_up_date <= end_date,
                EnquiryRecord.follow_up_date >= today,
                EnquiryRecord.status.notin_(
                    [EnquiryStatus.CONVERTED.value, EnquiryStatus.CLOSED.value]
                ),
            )
            .options(joinedload(EnquiryRecord.assigned_to_staff))
        )

        if assigned_to:
            query = query.filter(EnquiryRecord.assigned_to == assigned_to)

        enquiries = query.order_by(EnquiryRecord.follow_up_date).all()

        return enquiries

    def get_enquiry(self, enquiry_id: int) -> EnquiryRecord | None:
        return (
            self.db.query(EnquiryRecord)
            .options(
                joinedload(EnquiryRecord.assigned_to_staff),
                joinedload(EnquiryRecord.institution),
            )
            .filter(EnquiryRecord.id == enquiry_id)
            .first()
        )

    def list_enquiries(
        self,
        institution_id: int,
        skip: int = 0,
        limit: int = 100,
        status: str | None = None,
        source: str | None = None,
        grade: str | None = None,
        assigned_to: int | None = None,
        search: str | None = None,
        start_date: date | None = None,
        end_date: date | None = None,
    ) -> tuple[list[EnquiryRecord], int]:
        query = self.db.query(EnquiryRecord).filter(
            EnquiryRecord.institution_id == institution_id
        )

        if status:
            query = query.filter(EnquiryRecord.status == status)

        if source:
            query = query.filter(EnquiryRecord.source == source)

        if grade:
            query = query.filter(EnquiryRecord.enquiry_for_grade == grade)

        if assigned_to:
            query = query.filter(EnquiryRecord.assigned_to == assigned_to)

        if search:
            search_pattern = f"%{search}%"
            query = query.filter(
                or_(
                    EnquiryRecord.student_name.ilike(search_pattern),
                    EnquiryRecord.parent_name.ilike(search_pattern),
                    EnquiryRecord.parent_phone.ilike(search_pattern),
                    EnquiryRecord.parent_email.ilike(search_pattern),
                )
            )

        if start_date:
            query = query.filter(EnquiryRecord.enquiry_date >= start_date)

        if end_date:
            query = query.filter(EnquiryRecord.enquiry_date <= end_date)

        total = query.count()

        enquiries = (
            query.options(joinedload(EnquiryRecord.assigned_to_staff))
            .order_by(EnquiryRecord.enquiry_date.desc())
            .offset(skip)
            .limit(limit)
            .all()
        )

        return enquiries, total

    def get_sms_template(
        self, template_id: int, institution_id: int
    ) -> SMSTemplate | None:
        return (
            self.db.query(SMSTemplate)
            .filter(
                SMSTemplate.id == template_id,
                SMSTemplate.institution_id == institution_id,
            )
            .first()
        )

    def list_sms_templates(
        self,
        institution_id: int,
        template_type: str | None = None,
        is_active: bool | None = None,
    ) -> list[SMSTemplate]:
        query = self.db.query(SMSTemplate).filter(
            SMSTemplate.institution_id == institution_id
        )

        if template_type:
            query = query.filter(SMSTemplate.template_type == template_type)

        if is_active is not None:
            query = query.filter(SMSTemplate.is_active == is_active)

        return query.order_by(SMSTemplate.template_name).all()

    def create_sms_template(
        self,
        institution_id: int,
        template_name: str,
        template_type: str,
        message_body: str,
        is_active: bool = True,
    ) -> SMSTemplate:
        template = SMSTemplate(
            institution_id=institution_id,
            template_name=template_name,
            template_type=template_type,
            message_body=message_body,
            is_active=is_active,
        )

        self.db.add(template)
        self.db.commit()
        self.db.refresh(template)
        return template

    def update_sms_template(
        self, template_id: int, update_data: dict[str, Any]
    ) -> SMSTemplate | None:
        template = (
            self.db.query(SMSTemplate)
            .filter(SMSTemplate.id == template_id)
            .first()
        )

        if not template:
            return None

        for key, value in update_data.items():
            if hasattr(template, key):
                setattr(template, key, value)

        self.db.commit()
        self.db.refresh(template)
        return template
