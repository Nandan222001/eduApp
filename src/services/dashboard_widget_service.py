from datetime import datetime, timedelta
from sqlalchemy.orm import Session
from sqlalchemy import func
from typing import List, Dict, Any, Optional
from src.models.dashboard_widget import DashboardWidget, WidgetPreset, WidgetType, WidgetSize
from src.models.user import User
from src.models.assignment import Assignment, Submission, AssignmentStatus, SubmissionStatus
from src.models.attendance import Attendance, AttendanceStatus
from src.models.examination import Exam, ExamMarks, ExamStatus
from src.models.student import Student, Parent
from src.models.teacher import Teacher
from src.models.gamification import UserBadge, UserPoints, StreakTracker
from src.models.goal import Goal, GoalStatus
from src.models.notification import Announcement
from src.schemas.dashboard_widget import (
    DashboardWidgetCreate, DashboardWidgetUpdate,
    DeadlineItem, GradingItem, AttendanceAlertItem, RecentGradeItem, QuickStatItem
)


class DashboardWidgetService:
    
    @staticmethod
    def get_user_widgets(db: Session, user_id: int) -> List[DashboardWidget]:
        return db.query(DashboardWidget).filter(
            DashboardWidget.user_id == user_id
        ).order_by(DashboardWidget.position).all()
    
    @staticmethod
    def get_widget_by_id(db: Session, widget_id: int, user_id: int) -> Optional[DashboardWidget]:
        return db.query(DashboardWidget).filter(
            DashboardWidget.id == widget_id,
            DashboardWidget.user_id == user_id
        ).first()
    
    @staticmethod
    def create_widget(db: Session, user_id: int, widget_data: DashboardWidgetCreate) -> DashboardWidget:
        widget = DashboardWidget(
            user_id=user_id,
            widget_type=widget_data.widget_type,
            title=widget_data.title,
            position=widget_data.position,
            size=widget_data.size,
            is_visible=widget_data.is_visible,
            config=widget_data.config
        )
        db.add(widget)
        db.commit()
        db.refresh(widget)
        return widget
    
    @staticmethod
    def update_widget(
        db: Session, widget_id: int, user_id: int, widget_data: DashboardWidgetUpdate
    ) -> Optional[DashboardWidget]:
        widget = DashboardWidgetService.get_widget_by_id(db, widget_id, user_id)
        if not widget:
            return None
        
        update_data = widget_data.dict(exclude_unset=True)
        for field, value in update_data.items():
            setattr(widget, field, value)
        
        widget.updated_at = datetime.utcnow()
        db.commit()
        db.refresh(widget)
        return widget
    
    @staticmethod
    def delete_widget(db: Session, widget_id: int, user_id: int) -> bool:
        widget = DashboardWidgetService.get_widget_by_id(db, widget_id, user_id)
        if not widget:
            return False
        
        db.delete(widget)
        db.commit()
        return True
    
    @staticmethod
    def update_positions(db: Session, user_id: int, updates: List[Dict[str, int]]) -> bool:
        for update in updates:
            widget = db.query(DashboardWidget).filter(
                DashboardWidget.id == update['widget_id'],
                DashboardWidget.user_id == user_id
            ).first()
            if widget:
                widget.position = update['position']
                widget.updated_at = datetime.utcnow()
        
        db.commit()
        return True
    
    @staticmethod
    def get_role_presets(db: Session, role_slug: str) -> List[WidgetPreset]:
        return db.query(WidgetPreset).filter(
            WidgetPreset.role_slug == role_slug
        ).order_by(WidgetPreset.default_position).all()
    
    @staticmethod
    def initialize_default_widgets(db: Session, user: User) -> List[DashboardWidget]:
        existing = db.query(DashboardWidget).filter(
            DashboardWidget.user_id == user.id
        ).count()
        
        if existing > 0:
            return DashboardWidgetService.get_user_widgets(db, user.id)
        
        presets = DashboardWidgetService.get_role_presets(db, user.role.slug)
        
        if not presets:
            presets = DashboardWidgetService._get_default_presets_for_role(user.role.slug)
        
        widgets = []
        for preset in presets:
            widget = DashboardWidget(
                user_id=user.id,
                widget_type=preset.widget_type if hasattr(preset, 'widget_type') else preset['widget_type'],
                title=preset.default_title if hasattr(preset, 'default_title') else preset['title'],
                position=preset.default_position if hasattr(preset, 'default_position') else preset['position'],
                size=preset.default_size if hasattr(preset, 'default_size') else preset['size'],
                is_visible=preset.default_visible if hasattr(preset, 'default_visible') else preset['visible'],
                config=preset.default_config if hasattr(preset, 'default_config') else preset.get('config')
            )
            db.add(widget)
            widgets.append(widget)
        
        db.commit()
        for widget in widgets:
            db.refresh(widget)
        
        return widgets
    
    @staticmethod
    def _get_default_presets_for_role(role_slug: str) -> List[Dict]:
        presets = {
            'student': [
                {'widget_type': WidgetType.UPCOMING_DEADLINES, 'title': 'Upcoming Deadlines', 'position': 0, 'size': WidgetSize.LARGE, 'visible': True},
                {'widget_type': WidgetType.RECENT_GRADES, 'title': 'Recent Grades', 'position': 1, 'size': WidgetSize.MEDIUM, 'visible': True},
                {'widget_type': WidgetType.QUICK_STATS, 'title': 'Quick Stats', 'position': 2, 'size': WidgetSize.SMALL, 'visible': True},
                {'widget_type': WidgetType.STUDY_STREAK, 'title': 'Study Streak', 'position': 3, 'size': WidgetSize.SMALL, 'visible': True},
                {'widget_type': WidgetType.GOAL_TRACKER, 'title': 'Goal Progress', 'position': 4, 'size': WidgetSize.MEDIUM, 'visible': True},
                {'widget_type': WidgetType.BADGES, 'title': 'Recent Badges', 'position': 5, 'size': WidgetSize.SMALL, 'visible': True},
            ],
            'teacher': [
                {'widget_type': WidgetType.PENDING_GRADING, 'title': 'Pending Grading', 'position': 0, 'size': WidgetSize.LARGE, 'visible': True},
                {'widget_type': WidgetType.CLASS_PERFORMANCE, 'title': 'Class Performance', 'position': 1, 'size': WidgetSize.MEDIUM, 'visible': True},
                {'widget_type': WidgetType.ATTENDANCE_ALERTS, 'title': 'Attendance Alerts', 'position': 2, 'size': WidgetSize.MEDIUM, 'visible': True},
                {'widget_type': WidgetType.UPCOMING_EXAMS, 'title': 'Upcoming Exams', 'position': 3, 'size': WidgetSize.SMALL, 'visible': True},
                {'widget_type': WidgetType.QUICK_ACTIONS, 'title': 'Quick Actions', 'position': 4, 'size': WidgetSize.SMALL, 'visible': True},
            ],
            'parent': [
                {'widget_type': WidgetType.ATTENDANCE_ALERTS, 'title': 'Attendance Alerts', 'position': 0, 'size': WidgetSize.LARGE, 'visible': True},
                {'widget_type': WidgetType.RECENT_GRADES, 'title': 'Recent Grades', 'position': 1, 'size': WidgetSize.MEDIUM, 'visible': True},
                {'widget_type': WidgetType.UPCOMING_DEADLINES, 'title': 'Upcoming Deadlines', 'position': 2, 'size': WidgetSize.MEDIUM, 'visible': True},
                {'widget_type': WidgetType.ATTENDANCE_SUMMARY, 'title': 'Attendance Summary', 'position': 3, 'size': WidgetSize.SMALL, 'visible': True},
                {'widget_type': WidgetType.RECENT_ANNOUNCEMENTS, 'title': 'Announcements', 'position': 4, 'size': WidgetSize.MEDIUM, 'visible': True},
            ],
        }
        return presets.get(role_slug, [])
    
    @staticmethod
    def get_widget_data(db: Session, user: User, widget: DashboardWidget) -> Dict[str, Any]:
        handlers = {
            WidgetType.UPCOMING_DEADLINES: DashboardWidgetService._get_upcoming_deadlines,
            WidgetType.PENDING_GRADING: DashboardWidgetService._get_pending_grading,
            WidgetType.ATTENDANCE_ALERTS: DashboardWidgetService._get_attendance_alerts,
            WidgetType.RECENT_GRADES: DashboardWidgetService._get_recent_grades,
            WidgetType.QUICK_STATS: DashboardWidgetService._get_quick_stats,
            WidgetType.STUDY_STREAK: DashboardWidgetService._get_study_streak,
            WidgetType.BADGES: DashboardWidgetService._get_recent_badges,
            WidgetType.GOAL_TRACKER: DashboardWidgetService._get_goal_tracker,
        }
        
        handler = handlers.get(widget.widget_type)
        if handler:
            return handler(db, user, widget.config or {})
        
        return {'message': 'Widget data not available'}
    
    @staticmethod
    def _get_upcoming_deadlines(db: Session, user: User, config: Dict) -> Dict[str, Any]:
        max_items = config.get('max_items', 10)
        now = datetime.utcnow()
        deadlines = []
        
        if user.role.slug == 'student':
            assignments = db.query(Assignment).filter(
                Assignment.grade_id == user.student_profile.section.grade_id,
                Assignment.section_id == user.student_profile.section_id,
                Assignment.due_date > now,
                Assignment.status == AssignmentStatus.PUBLISHED
            ).order_by(Assignment.due_date).limit(max_items).all()
            
            for assignment in assignments:
                submission = db.query(Submission).filter(
                    Submission.assignment_id == assignment.id,
                    Submission.student_id == user.student_profile.id
                ).first()
                
                deadlines.append(DeadlineItem(
                    id=assignment.id,
                    title=assignment.title,
                    type='assignment',
                    due_date=assignment.due_date,
                    subject=assignment.subject.name if assignment.subject else None,
                    priority='high' if (assignment.due_date - now).days <= 2 else 'normal',
                    status='submitted' if submission and submission.status == SubmissionStatus.SUBMITTED else 'pending'
                ))
            
            exams = db.query(Exam).filter(
                Exam.grade_id == user.student_profile.section.grade_id,
                Exam.start_date > now,
                Exam.status == ExamStatus.SCHEDULED
            ).order_by(Exam.start_date).limit(max_items - len(deadlines)).all()
            
            for exam in exams:
                deadlines.append(DeadlineItem(
                    id=exam.id,
                    title=exam.title,
                    type='exam',
                    due_date=exam.start_date,
                    priority='high' if (exam.start_date - now).days <= 7 else 'normal',
                    status='scheduled'
                ))
        
        return {
            'deadlines': [d.dict() for d in deadlines],
            'total_count': len(deadlines)
        }
    
    @staticmethod
    def _get_pending_grading(db: Session, user: User, config: Dict) -> Dict[str, Any]:
        max_items = config.get('max_items', 10)
        items = []
        
        if user.role.slug == 'teacher':
            assignments = db.query(Assignment).filter(
                Assignment.teacher_id == user.teacher_profile.id,
                Assignment.status == AssignmentStatus.PUBLISHED
            ).limit(max_items).all()
            
            for assignment in assignments:
                total_submissions = db.query(Submission).filter(
                    Submission.assignment_id == assignment.id
                ).count()
                
                graded_submissions = db.query(Submission).filter(
                    Submission.assignment_id == assignment.id,
                    Submission.status == SubmissionStatus.GRADED
                ).count()
                
                pending_count = total_submissions - graded_submissions
                
                if pending_count > 0:
                    items.append(GradingItem(
                        id=assignment.id,
                        title=assignment.title,
                        type='assignment',
                        submitted_count=total_submissions,
                        # Student has no grade_id column -- section_id alone
                        # already fully determines the class roster here.
                        total_count=db.query(func.count(Student.id)).filter(
                            Student.section_id == assignment.section_id
                        ).scalar(),
                        subject=assignment.subject.name if assignment.subject else 'General',
                        deadline=assignment.due_date,
                        pending_count=pending_count
                    ))
        
        return {
            'items': [i.dict() for i in items],
            'total_count': len(items)
        }
    
    @staticmethod
    def _get_attendance_alerts(db: Session, user: User, config: Dict) -> Dict[str, Any]:
        max_items = config.get('max_items', 10)
        threshold = config.get('threshold', 75.0)
        alerts = []
        
        if user.role.slug == 'teacher':
            students = db.query(Student).filter(
                Student.institution_id == user.institution_id
            ).limit(max_items * 2).all()
            
            for student in students:
                total_days = db.query(Attendance).filter(
                    Attendance.student_id == student.id
                ).count()
                
                present_days = db.query(Attendance).filter(
                    Attendance.student_id == student.id,
                    Attendance.status == AttendanceStatus.PRESENT
                ).count()
                
                if total_days > 0:
                    attendance_percentage = (present_days / total_days) * 100
                    if attendance_percentage < threshold:
                        absent_days = total_days - present_days
                        alert_type = 'critical' if attendance_percentage < 50 else 'warning'
                        
                        alerts.append(AttendanceAlertItem(
                            id=student.id,
                            student_name=f"{student.user.first_name} {student.user.last_name}",
                            student_id=student.id,
                            attendance_percentage=round(attendance_percentage, 2),
                            absent_days=absent_days,
                            alert_type=alert_type,
                            grade=student.section.grade.name if student.section and student.section.grade else None,
                            section=student.section.name if student.section else None
                        ))
                        
                        if len(alerts) >= max_items:
                            break
        
        elif user.role.slug == 'parent':
            parent = db.query(Parent).filter(Parent.user_id == user.id).first()
            if parent:
                for student_parent in parent.students:
                    student = student_parent.student
                    total_days = db.query(Attendance).filter(
                        Attendance.student_id == student.id
                    ).count()
                    
                    present_days = db.query(Attendance).filter(
                        Attendance.student_id == student.id,
                        Attendance.status == AttendanceStatus.PRESENT
                    ).count()
                    
                    if total_days > 0:
                        attendance_percentage = (present_days / total_days) * 100
                        if attendance_percentage < threshold:
                            absent_days = total_days - present_days
                            alert_type = 'critical' if attendance_percentage < 50 else 'warning'
                            
                            alerts.append(AttendanceAlertItem(
                                id=student.id,
                                student_name=f"{student.user.first_name} {student.user.last_name}",
                                student_id=student.id,
                                attendance_percentage=round(attendance_percentage, 2),
                                absent_days=absent_days,
                                alert_type=alert_type,
                                grade=student.section.grade.name if student.section and student.section.grade else None,
                                section=student.section.name if student.section else None
                            ))
        
        return {
            'alerts': [a.dict() for a in alerts],
            'total_count': len(alerts)
        }
    
    @staticmethod
    def _get_recent_grades(db: Session, user: User, config: Dict) -> Dict[str, Any]:
        max_items = config.get('max_items', 10)
        grades = []
        
        if user.role.slug == 'student':
            exam_marks = db.query(ExamMarks).filter(
                ExamMarks.student_id == user.student_profile.id
            ).order_by(ExamMarks.created_at.desc()).limit(max_items).all()
            
            for mark in exam_marks:
                percentage = (mark.marks_obtained / mark.total_marks * 100) if mark.total_marks > 0 else 0
                grades.append(RecentGradeItem(
                    id=mark.id,
                    subject=mark.subject.name if mark.subject else 'Unknown',
                    exam_name=mark.exam.title if mark.exam else 'Unknown',
                    marks_obtained=mark.marks_obtained,
                    total_marks=mark.total_marks,
                    percentage=round(percentage, 2),
                    grade=mark.grade,
                    date=mark.created_at
                ))
        
        elif user.role.slug == 'parent':
            parent = db.query(Parent).filter(Parent.user_id == user.id).first()
            if parent and parent.students:
                student = parent.students[0].student
                exam_marks = db.query(ExamMarks).filter(
                    ExamMarks.student_id == student.id
                ).order_by(ExamMarks.created_at.desc()).limit(max_items).all()
                
                for mark in exam_marks:
                    percentage = (mark.marks_obtained / mark.total_marks * 100) if mark.total_marks > 0 else 0
                    grades.append(RecentGradeItem(
                        id=mark.id,
                        subject=mark.subject.name if mark.subject else 'Unknown',
                        exam_name=mark.exam.title if mark.exam else 'Unknown',
                        marks_obtained=mark.marks_obtained,
                        total_marks=mark.total_marks,
                        percentage=round(percentage, 2),
                        grade=mark.grade,
                        date=mark.created_at
                    ))
        
        avg_percentage = sum(g.percentage for g in grades) / len(grades) if grades else 0
        
        return {
            'grades': [g.dict() for g in grades],
            'average_percentage': round(avg_percentage, 2)
        }
    
    @staticmethod
    def _get_quick_stats(db: Session, user: User, config: Dict) -> Dict[str, Any]:
        stats = []
        
        if user.role.slug == 'student':
            pending_assignments = db.query(Assignment).join(Submission, 
                (Submission.assignment_id == Assignment.id) & 
                (Submission.student_id == user.student_profile.id),
                isouter=True
            ).filter(
                Assignment.grade_id == user.student_profile.section.grade_id,
                Assignment.section_id == user.student_profile.section_id,
                Assignment.status == AssignmentStatus.PUBLISHED,
                Submission.id.is_(None)
            ).count()
            
            stats.append(QuickStatItem(
                label='Pending Assignments',
                value=str(pending_assignments),
                icon='assignment',
                color='#FF9800'
            ))
            
            total_attendance = db.query(Attendance).filter(
                Attendance.student_id == user.student_profile.id
            ).count()
            
            present_count = db.query(Attendance).filter(
                Attendance.student_id == user.student_profile.id,
                Attendance.status == AttendanceStatus.PRESENT
            ).count()
            
            attendance_pct = (present_count / total_attendance * 100) if total_attendance > 0 else 0
            
            stats.append(QuickStatItem(
                label='Attendance',
                value=f"{round(attendance_pct, 1)}%",
                icon='event',
                color='#4CAF50' if attendance_pct >= 75 else '#F44336'
            ))
            
            user_points = db.query(UserPoints).filter(UserPoints.user_id == user.id).first()
            if user_points:
                stats.append(QuickStatItem(
                    label='Total Points',
                    value=str(user_points.total_points),
                    icon='stars',
                    color='#9C27B0'
                ))
        
        elif user.role.slug == 'teacher':
            total_students = db.query(Student).filter(
                Student.institution_id == user.institution_id
            ).count()
            
            stats.append(QuickStatItem(
                label='Total Students',
                value=str(total_students),
                icon='people',
                color='#2196F3'
            ))
            
            pending_grading = db.query(Submission).join(Assignment).filter(
                Assignment.teacher_id == user.teacher_profile.id,
                Submission.status == SubmissionStatus.SUBMITTED
            ).count()
            
            stats.append(QuickStatItem(
                label='Pending Grading',
                value=str(pending_grading),
                icon='grading',
                color='#FF9800'
            ))
        
        return {'stats': [s.dict() for s in stats]}
    
    @staticmethod
    def _get_study_streak(db: Session, user: User, config: Dict) -> Dict[str, Any]:
        streak = db.query(StreakTracker).filter(
            StreakTracker.user_id == user.id
        ).first()
        
        return {
            'current_streak': streak.current_streak if streak else 0,
            'longest_streak': streak.longest_streak if streak else 0,
            'last_activity_date': streak.last_activity_date if streak else None
        }
    
    @staticmethod
    def _get_recent_badges(db: Session, user: User, config: Dict) -> Dict[str, Any]:
        max_items = config.get('max_items', 6)
        
        user_badges = db.query(UserBadge).filter(
            UserBadge.user_id == user.id
        ).order_by(UserBadge.earned_at.desc()).limit(max_items).all()
        
        return {
            'badges': [
                {
                    'id': ub.badge.id,
                    'name': ub.badge.name,
                    'description': ub.badge.description,
                    'icon_url': ub.badge.icon_url,
                    'rarity': ub.badge.rarity.value,
                    'earned_at': ub.earned_at
                }
                for ub in user_badges
            ]
        }
    
    @staticmethod
    def _get_goal_tracker(db: Session, user: User, config: Dict) -> Dict[str, Any]:
        max_items = config.get('max_items', 5)
        
        active_goals = db.query(Goal).filter(
            Goal.user_id == user.id,
            Goal.status == GoalStatus.IN_PROGRESS
        ).limit(max_items).all()
        
        return {
            'goals': [
                {
                    'id': goal.id,
                    'title': goal.title,
                    'target_value': goal.target_value,
                    'current_value': goal.current_value,
                    'progress_percentage': (goal.current_value / goal.target_value * 100) if goal.target_value > 0 else 0,
                    'deadline': goal.deadline,
                    'category': goal.goal_type.value
                }
                for goal in active_goals
            ]
        }
