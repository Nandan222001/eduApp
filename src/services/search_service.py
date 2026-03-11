from typing import List, Optional, Dict, Any
from sqlalchemy.orm import Session, joinedload
from sqlalchemy import or_, and_, func, distinct
from datetime import datetime, timedelta
import time

from src.models.student import Student
from src.models.teacher import Teacher
from src.models.assignment import Assignment
from src.models.previous_year_papers import PreviousYearPaper
from src.models.notification import Announcement
from src.models.academic import Grade, Subject, Section
from src.models.search import SearchHistory, PopularSearch
from src.schemas.search import (
    SearchQuery,
    SearchResults,
    StudentSearchResult,
    TeacherSearchResult,
    AssignmentSearchResult,
    PaperSearchResult,
    AnnouncementSearchResult,
    QuickSearchResult,
    QuickSearchResults,
    SearchHistoryItem,
    SearchHistoryResponse,
    SearchSuggestion,
    SearchSuggestionsResponse,
    SearchFilterOptions,
)


class SearchService:
    def __init__(self, db: Session):
        self.db = db

    def global_search(
        self,
        institution_id: int,
        user_id: int,
        user_role: str,
        search_query: SearchQuery,
    ) -> SearchResults:
        start_time = time.time()
        query_text = f"%{search_query.query.lower()}%"
        
        results = SearchResults(
            query=search_query.query,
            total_results=0,
            students=[],
            teachers=[],
            assignments=[],
            papers=[],
            announcements=[],
            search_time_ms=0,
        )
        
        search_types = search_query.search_types or ["students", "teachers", "assignments", "papers", "announcements"]
        
        if "students" in search_types:
            results.students = self._search_students(
                institution_id, query_text, search_query.limit, search_query.offset, search_query.filters
            )
        
        if "teachers" in search_types:
            results.teachers = self._search_teachers(
                institution_id, query_text, search_query.limit, search_query.offset, search_query.filters
            )
        
        if "assignments" in search_types:
            results.assignments = self._search_assignments(
                institution_id, query_text, search_query.limit, search_query.offset, search_query.filters
            )
        
        if "papers" in search_types:
            results.papers = self._search_papers(
                institution_id, query_text, search_query.limit, search_query.offset, search_query.filters
            )
        
        if "announcements" in search_types:
            results.announcements = self._search_announcements(
                institution_id, query_text, search_query.limit, search_query.offset, search_query.filters
            )
        
        results.total_results = (
            len(results.students) +
            len(results.teachers) +
            len(results.assignments) +
            len(results.papers) +
            len(results.announcements)
        )
        
        results.search_time_ms = round((time.time() - start_time) * 1000, 2)
        
        self._save_search_history(
            user_id, institution_id, search_query.query, None, 
            search_query.filters, results.total_results
        )
        
        self._update_popular_searches(
            institution_id, user_role, search_query.query
        )
        
        return results

    def quick_search(
        self,
        institution_id: int,
        user_id: int,
        query: str,
        limit: int = 10,
    ) -> QuickSearchResults:
        start_time = time.time()
        query_text = f"%{query.lower()}%"
        
        results = []
        
        students = self._search_students(institution_id, query_text, limit // 5, 0, None)
        for student in students:
            results.append(QuickSearchResult(
                type="student",
                id=student.id,
                title=f"{student.first_name} {student.last_name}",
                subtitle=f"{student.admission_number or ''} - {student.section_name or ''} {student.grade_name or ''}",
                metadata={"email": student.email},
                url=f"/admin/students/{student.id}"
            ))
        
        teachers = self._search_teachers(institution_id, query_text, limit // 5, 0, None)
        for teacher in teachers:
            results.append(QuickSearchResult(
                type="teacher",
                id=teacher.id,
                title=f"{teacher.first_name} {teacher.last_name}",
                subtitle=f"{teacher.employee_id or ''} - {teacher.specialization or ''}",
                metadata={"email": teacher.email},
                url=f"/admin/users/teachers/{teacher.id}"
            ))
        
        assignments = self._search_assignments(institution_id, query_text, limit // 5, 0, None)
        for assignment in assignments:
            results.append(QuickSearchResult(
                type="assignment",
                id=assignment.id,
                title=assignment.title,
                subtitle=f"{assignment.subject_name or ''} - {assignment.grade_name or ''}",
                metadata={"due_date": assignment.due_date.isoformat() if assignment.due_date else None},
                url=f"/admin/assignments/{assignment.id}"
            ))
        
        papers = self._search_papers(institution_id, query_text, limit // 5, 0, None)
        for paper in papers:
            results.append(QuickSearchResult(
                type="paper",
                id=paper.id,
                title=paper.title,
                subtitle=f"{paper.board} {paper.year} - {paper.subject_name or ''}",
                metadata={"year": paper.year},
                url=f"/admin/papers/view/{paper.id}"
            ))
        
        announcements = self._search_announcements(institution_id, query_text, limit // 5, 0, None)
        for announcement in announcements:
            results.append(QuickSearchResult(
                type="announcement",
                id=announcement.id,
                title=announcement.title,
                subtitle=announcement.content[:100] if announcement.content else "",
                metadata={"priority": announcement.priority},
                url=f"/admin/communication/announcements/{announcement.id}"
            ))
        
        results = results[:limit]
        
        return QuickSearchResults(
            query=query,
            results=results,
            total=len(results),
            search_time_ms=round((time.time() - start_time) * 1000, 2)
        )

    def get_search_history(
        self,
        user_id: int,
        limit: int = 20,
        offset: int = 0,
    ) -> SearchHistoryResponse:
        history = (
            self.db.query(SearchHistory)
            .filter(SearchHistory.user_id == user_id)
            .order_by(SearchHistory.created_at.desc())
            .limit(limit)
            .offset(offset)
            .all()
        )
        
        total = (
            self.db.query(func.count(SearchHistory.id))
            .filter(SearchHistory.user_id == user_id)
            .scalar()
        )
        
        return SearchHistoryResponse(
            items=[SearchHistoryItem.model_validate(item) for item in history],
            total=total
        )

    def clear_search_history(self, user_id: int):
        self.db.query(SearchHistory).filter(
            SearchHistory.user_id == user_id
        ).delete()
        self.db.commit()

    def get_search_suggestions(
        self,
        institution_id: int,
        user_role: str,
        query: str,
        limit: int = 10,
    ) -> SearchSuggestionsResponse:
        query_text = f"%{query.lower()}%"
        
        history_suggestions = (
            self.db.query(
                SearchHistory.query,
                func.count(SearchHistory.id).label("count")
            )
            .filter(
                SearchHistory.institution_id == institution_id,
                func.lower(SearchHistory.query).like(query_text),
            )
            .group_by(SearchHistory.query)
            .order_by(func.count(SearchHistory.id).desc())
            .limit(limit)
            .all()
        )
        
        suggestions = [
            SearchSuggestion(query=item.query, type="history", count=item.count)
            for item in history_suggestions
        ]
        
        popular = self._get_popular_searches(institution_id, user_role, limit)
        
        return SearchSuggestionsResponse(
            suggestions=suggestions,
            popular=popular
        )

    def get_filter_options(self, institution_id: int) -> SearchFilterOptions:
        grades = (
            self.db.query(Grade.id, Grade.name)
            .filter(Grade.institution_id == institution_id, Grade.is_active == True)
            .all()
        )
        
        subjects = (
            self.db.query(Subject.id, Subject.name)
            .filter(Subject.institution_id == institution_id, Subject.is_active == True)
            .all()
        )
        
        sections = (
            self.db.query(Section.id, Section.name, Section.grade_id)
            .filter(Section.institution_id == institution_id, Section.is_active == True)
            .all()
        )
        
        years = (
            self.db.query(distinct(PreviousYearPaper.year))
            .filter(
                PreviousYearPaper.institution_id == institution_id,
                PreviousYearPaper.is_active == True
            )
            .order_by(PreviousYearPaper.year.desc())
            .limit(10)
            .all()
        )
        
        return SearchFilterOptions(
            grades=[{"id": g.id, "name": g.name} for g in grades],
            subjects=[{"id": s.id, "name": s.name} for s in subjects],
            sections=[{"id": s.id, "name": s.name, "grade_id": s.grade_id} for s in sections],
            statuses=["active", "inactive", "draft", "published", "closed"],
            boards=["cbse", "icse", "state_board", "ib", "cambridge"],
            years=[y[0] for y in years]
        )

    def _search_students(
        self,
        institution_id: int,
        query_text: str,
        limit: int,
        offset: int,
        filters: Optional[Dict[str, Any]],
    ) -> List[StudentSearchResult]:
        query = (
            self.db.query(Student)
            .outerjoin(Section)
            .outerjoin(Grade)
            .filter(
                Student.institution_id == institution_id,
                or_(
                    func.lower(Student.first_name).like(query_text),
                    func.lower(Student.last_name).like(query_text),
                    func.lower(Student.email).like(query_text),
                    func.lower(Student.admission_number).like(query_text),
                    func.lower(Student.roll_number).like(query_text),
                    func.lower(Student.phone).like(query_text),
                )
            )
        )
        
        if filters:
            if filters.get("grade_id"):
                query = query.filter(Section.grade_id == filters["grade_id"])
            if filters.get("section_id"):
                query = query.filter(Student.section_id == filters["section_id"])
            if filters.get("status"):
                query = query.filter(Student.status == filters["status"])
        
        students = query.order_by(Student.first_name).limit(limit).offset(offset).all()
        
        results = []
        for student in students:
            results.append(StudentSearchResult(
                id=student.id,
                first_name=student.first_name,
                last_name=student.last_name,
                email=student.email,
                admission_number=student.admission_number,
                roll_number=student.roll_number,
                section_name=student.section.name if student.section else None,
                grade_name=student.section.grade.name if student.section and student.section.grade else None,
                photo_url=student.photo_url,
                status=student.status,
            ))
        
        return results

    def _search_teachers(
        self,
        institution_id: int,
        query_text: str,
        limit: int,
        offset: int,
        filters: Optional[Dict[str, Any]],
    ) -> List[TeacherSearchResult]:
        query = (
            self.db.query(Teacher)
            .filter(
                Teacher.institution_id == institution_id,
                or_(
                    func.lower(Teacher.first_name).like(query_text),
                    func.lower(Teacher.last_name).like(query_text),
                    func.lower(Teacher.email).like(query_text),
                    func.lower(Teacher.employee_id).like(query_text),
                    func.lower(Teacher.phone).like(query_text),
                    func.lower(Teacher.specialization).like(query_text),
                )
            )
        )
        
        if filters:
            if filters.get("is_active") is not None:
                query = query.filter(Teacher.is_active == filters["is_active"])
        
        teachers = query.order_by(Teacher.first_name).limit(limit).offset(offset).all()
        
        return [TeacherSearchResult.model_validate(teacher) for teacher in teachers]

    def _search_assignments(
        self,
        institution_id: int,
        query_text: str,
        limit: int,
        offset: int,
        filters: Optional[Dict[str, Any]],
    ) -> List[AssignmentSearchResult]:
        query = (
            self.db.query(Assignment)
            .outerjoin(Subject)
            .outerjoin(Grade)
            .outerjoin(Section)
            .outerjoin(Teacher)
            .filter(
                Assignment.institution_id == institution_id,
                or_(
                    func.lower(Assignment.title).like(query_text),
                    func.lower(Assignment.description).like(query_text),
                )
            )
        )
        
        if filters:
            if filters.get("grade_id"):
                query = query.filter(Assignment.grade_id == filters["grade_id"])
            if filters.get("section_id"):
                query = query.filter(Assignment.section_id == filters["section_id"])
            if filters.get("subject_id"):
                query = query.filter(Assignment.subject_id == filters["subject_id"])
            if filters.get("status"):
                query = query.filter(Assignment.status == filters["status"])
        
        assignments = query.order_by(Assignment.due_date.desc()).limit(limit).offset(offset).all()
        
        results = []
        for assignment in assignments:
            results.append(AssignmentSearchResult(
                id=assignment.id,
                title=assignment.title,
                description=assignment.description,
                due_date=assignment.due_date,
                status=assignment.status.value if hasattr(assignment.status, 'value') else assignment.status,
                subject_name=assignment.subject.name if assignment.subject else None,
                grade_name=assignment.grade.name if assignment.grade else None,
                section_name=assignment.section.name if assignment.section else None,
                teacher_name=f"{assignment.teacher.first_name} {assignment.teacher.last_name}" if assignment.teacher else None,
                max_marks=float(assignment.max_marks) if assignment.max_marks else 0.0,
            ))
        
        return results

    def _search_papers(
        self,
        institution_id: int,
        query_text: str,
        limit: int,
        offset: int,
        filters: Optional[Dict[str, Any]],
    ) -> List[PaperSearchResult]:
        query = (
            self.db.query(PreviousYearPaper)
            .outerjoin(Subject)
            .outerjoin(Grade)
            .filter(
                PreviousYearPaper.institution_id == institution_id,
                PreviousYearPaper.is_active == True,
                or_(
                    func.lower(PreviousYearPaper.title).like(query_text),
                    func.lower(PreviousYearPaper.description).like(query_text),
                    func.lower(PreviousYearPaper.tags).like(query_text),
                )
            )
        )
        
        if filters:
            if filters.get("grade_id"):
                query = query.filter(PreviousYearPaper.grade_id == filters["grade_id"])
            if filters.get("subject_id"):
                query = query.filter(PreviousYearPaper.subject_id == filters["subject_id"])
            if filters.get("board"):
                query = query.filter(PreviousYearPaper.board == filters["board"])
            if filters.get("year"):
                query = query.filter(PreviousYearPaper.year == filters["year"])
        
        papers = query.order_by(PreviousYearPaper.year.desc()).limit(limit).offset(offset).all()
        
        results = []
        for paper in papers:
            results.append(PaperSearchResult(
                id=paper.id,
                title=paper.title,
                description=paper.description,
                board=paper.board.value if hasattr(paper.board, 'value') else paper.board,
                year=paper.year,
                exam_month=paper.exam_month,
                subject_name=paper.subject.name if paper.subject else None,
                grade_name=paper.grade.name if paper.grade else None,
                total_marks=paper.total_marks,
                tags=paper.tags,
                view_count=paper.view_count,
            ))
        
        return results

    def _search_announcements(
        self,
        institution_id: int,
        query_text: str,
        limit: int,
        offset: int,
        filters: Optional[Dict[str, Any]],
    ) -> List[AnnouncementSearchResult]:
        query = (
            self.db.query(Announcement)
            .outerjoin(Announcement.creator)
            .filter(
                Announcement.institution_id == institution_id,
                or_(
                    func.lower(Announcement.title).like(query_text),
                    func.lower(Announcement.content).like(query_text),
                )
            )
        )
        
        if filters:
            if filters.get("is_published") is not None:
                query = query.filter(Announcement.is_published == filters["is_published"])
            if filters.get("priority"):
                query = query.filter(Announcement.priority == filters["priority"])
        
        announcements = query.order_by(Announcement.created_at.desc()).limit(limit).offset(offset).all()
        
        results = []
        for announcement in announcements:
            creator = announcement.creator
            creator_name = f"{creator.first_name} {creator.last_name}" if creator else None
            
            results.append(AnnouncementSearchResult(
                id=announcement.id,
                title=announcement.title,
                content=announcement.content,
                priority=announcement.priority,
                audience_type=announcement.audience_type,
                is_published=announcement.is_published,
                published_at=announcement.published_at,
                expires_at=announcement.expires_at,
                creator_name=creator_name,
            ))
        
        return results

    def _save_search_history(
        self,
        user_id: int,
        institution_id: int,
        query: str,
        search_type: Optional[str],
        filters: Optional[Dict[str, Any]],
        results_count: int,
    ):
        history = SearchHistory(
            user_id=user_id,
            institution_id=institution_id,
            query=query,
            search_type=search_type,
            filters=filters,
            results_count=results_count,
        )
        self.db.add(history)
        
        one_month_ago = datetime.utcnow() - timedelta(days=30)
        self.db.query(SearchHistory).filter(
            SearchHistory.user_id == user_id,
            SearchHistory.created_at < one_month_ago
        ).delete()
        
        self.db.commit()

    def _update_popular_searches(
        self,
        institution_id: int,
        role: str,
        query: str,
    ):
        popular = (
            self.db.query(PopularSearch)
            .filter(
                PopularSearch.institution_id == institution_id,
                PopularSearch.role == role,
                PopularSearch.query == query,
            )
            .first()
        )
        
        if popular:
            popular.search_count += 1
            popular.last_searched_at = datetime.utcnow()
        else:
            popular = PopularSearch(
                institution_id=institution_id,
                role=role,
                query=query,
                search_count=1,
            )
            self.db.add(popular)
        
        self.db.commit()

    def _get_popular_searches(
        self,
        institution_id: int,
        role: str,
        limit: int,
    ) -> List[SearchSuggestion]:
        popular = (
            self.db.query(PopularSearch)
            .filter(
                PopularSearch.institution_id == institution_id,
                PopularSearch.role == role,
            )
            .order_by(PopularSearch.search_count.desc())
            .limit(limit)
            .all()
        )
        
        return [
            SearchSuggestion(query=item.query, type="popular", count=item.search_count)
            for item in popular
        ]
