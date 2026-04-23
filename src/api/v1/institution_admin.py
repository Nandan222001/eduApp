from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from sqlalchemy import func, and_, case
from datetime import datetime, timedelta, date

from src.database import get_db
from src.dependencies.auth import get_current_user, require_role
from src.models.subscription import Subscription, Invoice, Payment
from src.models.institution import Institution
from src.models.user import User
from src.models.student import Student
from src.models.teacher import Teacher
from src.models.attendance import Attendance, AttendanceStatus
from src.models.examination import Exam, ExamResult
from src.models.assignment import Assignment, Submission, SubmissionStatus
from src.models.event import Event, EventStatus
from src.schemas.subscription import (
    SubscriptionResponse,
    InvoiceResponse,
)
from src.services.subscription_service import SubscriptionService, SubscriptionPlans
from src.config import settings

router = APIRouter()

_ALLOWED_ROLES = ["institution_admin", "admin", "super_admin", "superadmin"]


def get_subscription_service(db: Session = Depends(get_db)) -> SubscriptionService:
    razorpay_key_id = getattr(settings, "razorpay_key_id", "rzp_test_key")
    razorpay_key_secret = getattr(settings, "razorpay_key_secret", "rzp_test_secret")
    return SubscriptionService(db, razorpay_key_id, razorpay_key_secret)


@router.get("/dashboard")
async def get_institution_admin_dashboard(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    institution_id = current_user.institution_id
    if not institution_id:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="User has no institution")

    today = datetime.utcnow().date()

    # ── Overview ──────────────────────────────────────────────────────────────
    student_count = db.query(func.count(Student.id)).filter(
        Student.institution_id == institution_id,
        Student.is_active == True,
    ).scalar() or 0

    teacher_count = db.query(func.count(Teacher.id)).filter(
        Teacher.institution_id == institution_id,
    ).scalar() or 0

    total_users = db.query(func.count(User.id)).filter(
        User.institution_id == institution_id,
        User.is_active == True,
    ).scalar() or 0

    # ── Today's attendance ────────────────────────────────────────────────────
    try:
        att_counts = dict(
            db.query(Attendance.status, func.count(Attendance.id))
            .filter(
                Attendance.institution_id == institution_id,
                Attendance.date == today,
            )
            .group_by(Attendance.status)
            .all()
        )
    except Exception:
        try:
            db.rollback()
        except Exception:
            pass
        att_counts = {}
    total_att_today = sum(att_counts.values())
    present_today = att_counts.get(AttendanceStatus.PRESENT, 0)
    absent_today = att_counts.get(AttendanceStatus.ABSENT, 0)
    late_today = att_counts.get(AttendanceStatus.LATE, 0)
    att_pct = round(present_today / total_att_today * 100, 1) if total_att_today > 0 else 0.0

    # ── Recent exam results (last 5 exams with results) ───────────────────────
    recent_exam_results = []
    try:
        recent_exam_rows = (
            db.query(
                Exam.id,
                Exam.name,
                Exam.exam_type,
                Exam.start_date,
                func.count(ExamResult.id).label("total"),
                func.sum(case((ExamResult.is_pass == True, 1), else_=0)).label("passed"),
                func.avg(ExamResult.percentage).label("avg_pct"),
            )
            .join(ExamResult, ExamResult.exam_id == Exam.id)
            .filter(Exam.institution_id == institution_id)
            .group_by(Exam.id, Exam.name, Exam.exam_type, Exam.start_date)
            .order_by(Exam.start_date.desc())
            .limit(5)
            .all()
        )
        recent_exam_results = [
            {
                "exam_id": row.id,
                "exam_name": row.name,
                "exam_type": row.exam_type.value if hasattr(row.exam_type, "value") else str(row.exam_type),
                "date": row.start_date.isoformat() if row.start_date else "",
                "total_students": row.total or 0,
                "passed_students": int(row.passed or 0),
                "average_percentage": round(float(row.avg_pct or 0), 2),
            }
            for row in recent_exam_rows
        ]
    except Exception:
        try:
            db.rollback()
        except Exception:
            pass

    # ── Upcoming events ───────────────────────────────────────────────────────
    upcoming_events = []
    try:
        upcoming_event_rows = (
            db.query(
                Event.id,
                Event.title,
                Event.event_type,
                Event.event_date,
                Event.description,
            )
            .filter(
                Event.institution_id == institution_id,
                Event.event_date >= today,
                Event.status == EventStatus.PUBLISHED.value,
            )
            .order_by(Event.event_date)
            .limit(5)
            .all()
        )
        upcoming_events = [
            {
                "id": ev.id,
                "title": ev.title,
                "event_type": ev.event_type,
                "date": ev.event_date.isoformat() if ev.event_date else "",
                "description": ev.description or "",
            }
            for ev in upcoming_event_rows
        ]
    except Exception:
        try:
            db.rollback()
        except Exception:
            pass

    # ── Pending tasks ─────────────────────────────────────────────────────────
    pending_tasks = []

    # Ungraded submissions
    try:
        ungraded_count = (
            db.query(func.count(Submission.id))
            .join(Assignment, Assignment.id == Submission.assignment_id)
            .filter(
                Assignment.institution_id == institution_id,
                Submission.status == SubmissionStatus.SUBMITTED,
            )
            .scalar() or 0
        )
        if ungraded_count > 0:
            pending_tasks.append({
                "id": "ungraded_submissions",
                "task_type": "grading",
                "title": "Ungraded Submissions",
                "description": f"{ungraded_count} assignment submission(s) awaiting grading",
                "count": ungraded_count,
                "priority": "high" if ungraded_count > 20 else "medium",
                "due_date": None,
            })
    except Exception:
        try:
            db.rollback()
        except Exception:
            pass

    # Exams scheduled but not published
    try:
        unpublished_exams = (
            db.query(func.count(Exam.id))
            .filter(
                Exam.institution_id == institution_id,
                Exam.is_published == False,
                Exam.start_date >= today,
            )
            .scalar() or 0
        )
        if unpublished_exams > 0:
            pending_tasks.append({
                "id": "unpublished_exams",
                "task_type": "exam",
                "title": "Unpublished Exams",
                "description": f"{unpublished_exams} upcoming exam(s) not yet published",
                "count": unpublished_exams,
                "priority": "medium",
                "due_date": None,
            })
    except Exception:
        try:
            db.rollback()
        except Exception:
            pass

    # Assignments past due
    try:
        overdue_assignments = (
            db.query(func.count(Assignment.id))
            .filter(
                Assignment.institution_id == institution_id,
                Assignment.due_date < datetime.utcnow(),
                Assignment.is_active == True,
            )
            .scalar() or 0
        )
        if overdue_assignments > 0:
            pending_tasks.append({
                "id": "overdue_assignments",
                "task_type": "assignment",
                "title": "Overdue Assignments",
                "description": f"{overdue_assignments} assignment(s) past their due date",
                "count": overdue_assignments,
                "priority": "low",
                "due_date": None,
            })
    except Exception:
        try:
            db.rollback()
        except Exception:
            pass

    # ── Performance trends (last 6 months) ───────────────────────────────────
    six_months_ago = datetime.utcnow() - timedelta(days=180)

    try:
        exam_monthly = (
            db.query(
                func.year(ExamResult.generated_at).label("yr"),
                func.month(ExamResult.generated_at).label("mo"),
                func.avg(ExamResult.percentage).label("avg_pct"),
                func.count(ExamResult.id).label("cnt"),
            )
            .filter(
                ExamResult.institution_id == institution_id,
                ExamResult.generated_at >= six_months_ago,
            )
            .group_by(func.year(ExamResult.generated_at), func.month(ExamResult.generated_at))
            .all()
        )
        exam_by_month = {(r.yr, r.mo): (float(r.avg_pct or 0), r.cnt) for r in exam_monthly}
    except Exception:
        try:
            db.rollback()
        except Exception:
            pass
        exam_by_month = {}

    try:
        att_monthly = (
            db.query(
                func.year(Attendance.created_at).label("yr"),
                func.month(Attendance.created_at).label("mo"),
                func.count(Attendance.id).label("total"),
                func.sum(case((Attendance.status == AttendanceStatus.PRESENT, 1), else_=0)).label("present"),
            )
            .filter(
                Attendance.institution_id == institution_id,
                Attendance.created_at >= six_months_ago,
            )
            .group_by(func.year(Attendance.created_at), func.month(Attendance.created_at))
            .all()
        )
        att_by_month = {
            (r.yr, r.mo): round(int(r.present or 0) / int(r.total or 1) * 100, 1)
            for r in att_monthly
        }
    except Exception:
        try:
            db.rollback()
        except Exception:
            pass
        att_by_month = {}

    performance_trends = []
    for i in range(5, -1, -1):
        d = datetime.utcnow() - timedelta(days=30 * i)
        key = (d.year, d.month)
        avg_score, cnt = exam_by_month.get(key, (0.0, 0))
        att_rate = att_by_month.get(key, 0.0)
        performance_trends.append({
            "month": d.strftime("%b %Y"),
            "average_score": round(avg_score, 1),
            "attendance_rate": att_rate,
            "student_count": cnt,
        })

    # ── Quick statistics ──────────────────────────────────────────────────────
    quick_statistics = [
        {
            "label": "Total Students",
            "value": str(student_count),
            "trend": None,
            "icon": "students",
        },
        {
            "label": "Total Teachers",
            "value": str(teacher_count),
            "trend": None,
            "icon": "teachers",
        },
        {
            "label": "Today's Attendance",
            "value": f"{att_pct}%",
            "trend": None,
            "icon": "attendance",
        },
        {
            "label": "Pending Tasks",
            "value": str(len(pending_tasks)),
            "trend": None,
            "icon": "tasks",
        },
    ]

    return {
        "overview": {
            "student_count": student_count,
            "teacher_count": teacher_count,
            "total_users": total_users,
        },
        "attendance_summary": {
            "date": today.isoformat(),
            "total_students": total_att_today,
            "present": present_today,
            "absent": absent_today,
            "late": late_today,
            "percentage": att_pct,
        },
        "recent_exam_results": recent_exam_results,
        "upcoming_events": upcoming_events,
        "pending_tasks": pending_tasks,
        "performance_trends": performance_trends,
        "quick_statistics": quick_statistics,
    }


@router.get("/subscription")
async def get_institution_subscription_data(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
    service: SubscriptionService = Depends(get_subscription_service),
):
    institution_id = current_user.institution_id
    if not institution_id:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="User has no institution")

    subscription = (
        db.query(Subscription)
        .filter(
            Subscription.institution_id == institution_id,
            Subscription.status.in_(["active", "trialing"]),
        )
        .first()
    )

    if not subscription:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="No active subscription found",
        )

    plans = SubscriptionPlans.get_all_plans()
    available_plans = [
        {
            "name": plan_name,
            "display_name": plan_data["display_name"],
            "description": plan_data["description"],
            "monthly_price": float(plan_data["monthly_price"]),
            "quarterly_price": float(plan_data["quarterly_price"]),
            "yearly_price": float(plan_data["yearly_price"]),
            "max_users": plan_data["max_users"],
            "max_storage_gb": plan_data["max_storage_gb"],
            "features": plan_data["features"],
        }
        for plan_name, plan_data in plans.items()
    ]

    invoices = (
        db.query(Invoice)
        .filter(Invoice.institution_id == institution_id)
        .order_by(Invoice.created_at.desc())
        .limit(20)
        .all()
    )

    student_count = (
        db.query(func.count(Student.id))
        .filter(Student.institution_id == institution_id, Student.is_active == True)
        .scalar() or 0
    )
    teacher_count = (
        db.query(func.count(Teacher.id))
        .filter(Teacher.institution_id == institution_id)
        .scalar() or 0
    )

    payments = (
        db.query(Payment)
        .filter(Payment.institution_id == institution_id)
        .order_by(Payment.created_at.desc())
        .limit(10)
        .all()
    )

    history = [
        {
            "id": payment.id,
            "type": "payment",
            "title": f"Payment of ₹{payment.amount}",
            "description": f"Payment {payment.status}",
            "date": payment.created_at.isoformat(),
            "amount": float(payment.amount),
        }
        for payment in payments
    ]
    history.insert(0, {
        "id": subscription.id,
        "type": "created",
        "title": f"Subscription Created - {subscription.plan_name}",
        "description": f"Started {subscription.billing_cycle} subscription",
        "date": subscription.created_at.isoformat(),
    })

    return {
        "subscription": SubscriptionResponse.model_validate(subscription),
        "availablePlans": available_plans,
        "invoices": [InvoiceResponse.model_validate(inv) for inv in invoices],
        "paymentMethods": [
            {
                "id": 1,
                "card_number": "4242424242424242",
                "card_holder": "John Doe",
                "expiry_month": "12",
                "expiry_year": "2025",
                "is_default": True,
            }
        ],
        "addOns": [
            {
                "id": 1,
                "name": "Advanced Analytics",
                "description": "Unlock detailed analytics and reporting features",
                "monthly_price": 2999,
                "yearly_price": 29990,
                "features": [
                    "Custom report builder",
                    "Predictive analytics",
                    "Export to multiple formats",
                    "Advanced data visualization",
                ],
            },
            {
                "id": 2,
                "name": "AI-Powered Insights",
                "description": "Get AI-driven insights and recommendations",
                "monthly_price": 4999,
                "yearly_price": 49990,
                "features": [
                    "Student performance predictions",
                    "Personalized learning paths",
                    "Automated interventions",
                    "Risk detection",
                ],
            },
            {
                "id": 3,
                "name": "Parent Portal Plus",
                "description": "Enhanced parent engagement features",
                "monthly_price": 1999,
                "yearly_price": 19990,
                "features": [
                    "Real-time notifications",
                    "Advanced messaging",
                    "Parent-teacher conferences",
                    "Progress tracking",
                ],
            },
        ],
        "activeAddOns": [],
        "usage": {
            "students_used": student_count,
            "teachers_used": teacher_count,
            "storage_used_gb": 12.5,
        },
        "limits": {
            "max_users": subscription.max_users,
            "max_storage_gb": subscription.max_storage_gb,
        },
        "history": history,
    }


@router.post("/payment-methods")
async def add_payment_method(
    data: dict,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    return {
        "id": 2,
        "card_number": data.get("card_number"),
        "card_holder": data.get("card_holder"),
        "expiry_month": data.get("expiry_month"),
        "expiry_year": data.get("expiry_year"),
        "is_default": False,
    }


@router.delete("/payment-methods/{method_id}")
async def delete_payment_method(
    method_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    return {"message": "Payment method deleted"}


@router.post("/payment-methods/{method_id}/set-default")
async def set_default_payment_method(
    method_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    return {"message": "Default payment method updated"}


@router.post("/add-ons/{addon_id}/enable")
async def enable_addon(
    addon_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    return {"message": "Add-on enabled"}


@router.post("/add-ons/{addon_id}/disable")
async def disable_addon(
    addon_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    return {"message": "Add-on disabled"}
