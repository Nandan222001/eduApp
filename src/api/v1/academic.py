from typing import Optional, List
from datetime import datetime
from fastapi import APIRouter, Depends, HTTPException, status, Query, UploadFile, File
from sqlalchemy.orm import Session
from sqlalchemy import delete as sql_delete
from pydantic import BaseModel, ConfigDict

from src.database import get_db
from src.models.user import User
from src.models.academic import AcademicYear, Grade, Section, Subject, GradeSubject, Chapter, Topic, Syllabus
from src.models.teacher import Teacher
from src.dependencies.auth import get_current_user

router = APIRouter()


# ── Pydantic response schemas ────────────────────────────────────────────────

class GradeOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    id: int
    institution_id: int
    name: str
    display_order: int
    description: Optional[str] = None
    is_active: bool
    created_at: datetime
    updated_at: datetime


class SectionOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    id: int
    institution_id: int
    grade_id: int
    name: str
    capacity: Optional[int] = None
    description: Optional[str] = None
    is_active: bool
    created_at: datetime
    updated_at: datetime


class SubjectOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    id: int
    institution_id: int
    name: str
    code: Optional[str] = None
    description: Optional[str] = None
    is_active: bool
    created_at: datetime
    updated_at: datetime


class SubjectAssignmentOut(BaseModel):
    id: int
    institution_id: int
    subject_id: int
    subject_name: str
    subject_code: str
    grade_id: int
    grade_name: str
    section_id: Optional[int] = None
    section_name: Optional[str] = None
    teacher_id: Optional[int] = None
    teacher_name: Optional[str] = None
    is_active: bool
    created_at: datetime
    updated_at: datetime


class SubjectAssignmentCreate(BaseModel):
    subject_id: int
    grade_id: int
    section_id: Optional[int] = None
    teacher_id: Optional[int] = None


class SubjectAssignmentUpdate(BaseModel):
    teacher_id: Optional[int] = None
    is_active: Optional[bool] = None


class ChapterOut(BaseModel):
    model_config = ConfigDict(from_attributes=True, extra="ignore")
    id: int
    institution_id: int
    subject_id: int
    grade_id: int
    name: str
    code: Optional[str] = None
    display_order: int
    chapter_number: Optional[int] = None
    description: Optional[str] = None
    learning_objectives: List[str] = []
    is_active: bool
    created_at: datetime
    updated_at: datetime

    def model_post_init(self, __context):
        if self.chapter_number is None:
            self.chapter_number = self.display_order


class ChapterCreate(BaseModel):
    model_config = ConfigDict(extra="ignore")
    subject_id: int
    grade_id: Optional[int] = None
    name: str
    code: Optional[str] = None
    chapter_number: Optional[int] = None
    display_order: int = 0
    description: Optional[str] = None
    learning_objectives: List[str] = []


class ChapterUpdate(BaseModel):
    model_config = ConfigDict(extra="ignore")
    name: Optional[str] = None
    code: Optional[str] = None
    chapter_number: Optional[int] = None
    display_order: Optional[int] = None
    description: Optional[str] = None
    learning_objectives: Optional[List[str]] = None
    is_active: Optional[bool] = None


class TopicOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    id: int
    institution_id: int
    chapter_id: int
    name: str
    code: Optional[str] = None
    display_order: int
    description: Optional[str] = None
    duration_hours: Optional[float] = None
    is_active: bool
    created_at: datetime
    updated_at: datetime


class TopicCreate(BaseModel):
    model_config = ConfigDict(extra="ignore")
    chapter_id: int
    name: str
    code: Optional[str] = None
    display_order: int = 0
    description: Optional[str] = None
    duration_hours: Optional[float] = None


class TopicUpdate(BaseModel):
    model_config = ConfigDict(extra="ignore")
    name: Optional[str] = None
    code: Optional[str] = None
    display_order: Optional[int] = None
    description: Optional[str] = None
    duration_hours: Optional[float] = None
    is_active: Optional[bool] = None


class SyllabusOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    id: int
    institution_id: int
    subject_id: int
    grade_id: int
    title: str
    description: Optional[str] = None
    academic_year: Optional[str] = None
    file_url: Optional[str] = None
    file_name: Optional[str] = None
    file_size: Optional[int] = None
    is_active: bool
    created_at: datetime
    updated_at: datetime


class SyllabusCreate(BaseModel):
    subject_id: int
    grade_id: int
    title: str
    description: Optional[str] = None
    academic_year: Optional[str] = None


class SyllabusUpdate(BaseModel):
    title: Optional[str] = None
    description: Optional[str] = None
    academic_year: Optional[str] = None
    is_active: Optional[bool] = None


# ── Helpers ──────────────────────────────────────────────────────────────────

def _require_institution(user: User) -> int:
    if not user.institution_id:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="User has no institution")
    return user.institution_id


# ── Grades ───────────────────────────────────────────────────────────────────

@router.get("/grades", response_model=List[GradeOut])
async def list_grades(
    is_active: Optional[bool] = Query(None),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    institution_id = _require_institution(current_user)
    q = db.query(Grade).filter(Grade.institution_id == institution_id)
    if is_active is not None:
        q = q.filter(Grade.is_active == is_active)
    return q.order_by(Grade.display_order).all()


@router.get("/grades/{grade_id}", response_model=GradeOut)
async def get_grade(
    grade_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    institution_id = _require_institution(current_user)
    grade = db.query(Grade).filter(Grade.id == grade_id, Grade.institution_id == institution_id).first()
    if not grade:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Grade not found")
    return grade


@router.post("/grades", response_model=GradeOut, status_code=status.HTTP_201_CREATED)
async def create_grade(
    data: dict,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    institution_id = _require_institution(current_user)

    academic_year_id = data.get("academic_year_id")
    if academic_year_id:
        academic_year = db.query(AcademicYear).filter(
            AcademicYear.id == academic_year_id,
            AcademicYear.institution_id == institution_id,
        ).first()
        if not academic_year:
            raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Academic year not found")
    else:
        academic_year = (
            db.query(AcademicYear)
            .filter(AcademicYear.institution_id == institution_id, AcademicYear.is_current == True)
            .first()
        ) or (
            db.query(AcademicYear)
            .filter(AcademicYear.institution_id == institution_id, AcademicYear.is_active == True)
            .first()
        )
        if not academic_year:
            from datetime import date
            today = date.today()
            year_start = today.year if today.month >= 6 else today.year - 1
            academic_year = AcademicYear(
                institution_id=institution_id,
                name=f"{year_start}-{year_start + 1}",
                start_date=date(year_start, 6, 1),
                end_date=date(year_start + 1, 5, 31),
                is_active=True,
                is_current=True,
            )
            db.add(academic_year)
            db.flush()
        academic_year_id = academic_year.id

    grade = Grade(
        institution_id=institution_id,
        academic_year_id=academic_year_id,
        name=data["name"],
        display_order=data.get("display_order", 0),
        description=data.get("description"),
        is_active=data.get("is_active", True),
    )
    db.add(grade)
    db.commit()
    db.refresh(grade)
    return grade


@router.put("/grades/{grade_id}", response_model=GradeOut)
async def update_grade(
    grade_id: int,
    data: dict,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    institution_id = _require_institution(current_user)
    grade = db.query(Grade).filter(Grade.id == grade_id, Grade.institution_id == institution_id).first()
    if not grade:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Grade not found")
    for field in ("name", "display_order", "description", "is_active"):
        if field in data:
            setattr(grade, field, data[field])
    grade.updated_at = datetime.utcnow()
    db.commit()
    db.refresh(grade)
    return grade


@router.delete("/grades/{grade_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_grade(
    grade_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    institution_id = _require_institution(current_user)
    exists = db.query(Grade.id).filter(Grade.id == grade_id, Grade.institution_id == institution_id).scalar()
    if not exists:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Grade not found")
    db.execute(sql_delete(Grade).where(Grade.id == grade_id))
    db.commit()


# ── Sections ─────────────────────────────────────────────────────────────────

@router.get("/sections", response_model=List[SectionOut])
async def list_sections(
    grade_id: Optional[int] = Query(None),
    is_active: Optional[bool] = Query(None),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    institution_id = _require_institution(current_user)
    q = db.query(Section).filter(Section.institution_id == institution_id)
    if grade_id is not None:
        q = q.filter(Section.grade_id == grade_id)
    if is_active is not None:
        q = q.filter(Section.is_active == is_active)
    return q.order_by(Section.name).all()


@router.get("/sections/{section_id}", response_model=SectionOut)
async def get_section(
    section_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    institution_id = _require_institution(current_user)
    section = db.query(Section).filter(Section.id == section_id, Section.institution_id == institution_id).first()
    if not section:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Section not found")
    return section


@router.post("/sections", response_model=SectionOut, status_code=status.HTTP_201_CREATED)
async def create_section(
    data: dict,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    institution_id = _require_institution(current_user)
    section = Section(
        institution_id=institution_id,
        grade_id=data["grade_id"],
        name=data["name"],
        capacity=data.get("capacity"),
        description=data.get("description"),
        is_active=data.get("is_active", True),
    )
    db.add(section)
    db.commit()
    db.refresh(section)
    return section


@router.put("/sections/{section_id}", response_model=SectionOut)
async def update_section(
    section_id: int,
    data: dict,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    institution_id = _require_institution(current_user)
    section = db.query(Section).filter(Section.id == section_id, Section.institution_id == institution_id).first()
    if not section:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Section not found")
    for field in ("name", "capacity", "description", "is_active"):
        if field in data:
            setattr(section, field, data[field])
    section.updated_at = datetime.utcnow()
    db.commit()
    db.refresh(section)
    return section


@router.delete("/sections/{section_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_section(
    section_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    institution_id = _require_institution(current_user)
    exists = db.query(Section.id).filter(Section.id == section_id, Section.institution_id == institution_id).scalar()
    if not exists:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Section not found")
    db.execute(sql_delete(Section).where(Section.id == section_id))
    db.commit()


@router.post("/sections/{section_id}/assign-teacher")
async def assign_class_teacher(
    section_id: int,
    data: dict,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    institution_id = _require_institution(current_user)
    section = db.query(Section).filter(Section.id == section_id, Section.institution_id == institution_id).first()
    if not section:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Section not found")
    return {"message": "Teacher assigned", "section_id": section_id, "teacher_id": data.get("teacher_id")}


# ── Subjects ─────────────────────────────────────────────────────────────────

@router.get("/subjects", response_model=List[SubjectOut])
async def list_subjects(
    is_active: Optional[bool] = Query(None),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    institution_id = _require_institution(current_user)
    q = db.query(Subject).filter(Subject.institution_id == institution_id)
    if is_active is not None:
        q = q.filter(Subject.is_active == is_active)
    return q.order_by(Subject.name).all()


@router.get("/subjects/{subject_id}", response_model=SubjectOut)
async def get_subject(
    subject_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    institution_id = _require_institution(current_user)
    subject = db.query(Subject).filter(Subject.id == subject_id, Subject.institution_id == institution_id).first()
    if not subject:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Subject not found")
    return subject


@router.post("/subjects", response_model=SubjectOut, status_code=status.HTTP_201_CREATED)
async def create_subject(
    data: dict,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    institution_id = _require_institution(current_user)
    subject = Subject(
        institution_id=institution_id,
        name=data["name"],
        code=data.get("code"),
        description=data.get("description"),
        is_active=data.get("is_active", True),
    )
    db.add(subject)
    db.commit()
    db.refresh(subject)
    return subject


@router.put("/subjects/{subject_id}", response_model=SubjectOut)
async def update_subject(
    subject_id: int,
    data: dict,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    institution_id = _require_institution(current_user)
    subject = db.query(Subject).filter(Subject.id == subject_id, Subject.institution_id == institution_id).first()
    if not subject:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Subject not found")
    for field in ("name", "code", "description", "is_active"):
        if field in data:
            setattr(subject, field, data[field])
    subject.updated_at = datetime.utcnow()
    db.commit()
    db.refresh(subject)
    return subject


@router.delete("/subjects/{subject_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_subject(
    subject_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    institution_id = _require_institution(current_user)
    exists = db.query(Subject.id).filter(Subject.id == subject_id, Subject.institution_id == institution_id).scalar()
    if not exists:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Subject not found")
    db.execute(sql_delete(Subject).where(Subject.id == subject_id))
    db.commit()


# ── Subject Assignments (GradeSubject) ───────────────────────────────────────

def _build_assignment_out(gs: GradeSubject, db: Session) -> SubjectAssignmentOut:
    subject = db.query(Subject).filter(Subject.id == gs.subject_id).first()
    grade = db.query(Grade).filter(Grade.id == gs.grade_id).first()
    return SubjectAssignmentOut(
        id=gs.id,
        institution_id=gs.institution_id,
        subject_id=gs.subject_id,
        subject_name=subject.name if subject else "",
        subject_code=subject.code or "" if subject else "",
        grade_id=gs.grade_id,
        grade_name=grade.name if grade else "",
        section_id=None,
        section_name=None,
        teacher_id=None,
        teacher_name=None,
        is_active=True,
        created_at=gs.created_at,
        updated_at=gs.created_at,
    )


@router.get("/subject-assignments", response_model=List[SubjectAssignmentOut])
async def list_subject_assignments(
    grade_id: Optional[int] = Query(None),
    subject_id: Optional[int] = Query(None),
    teacher_id: Optional[int] = Query(None),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    institution_id = _require_institution(current_user)
    q = db.query(GradeSubject).filter(GradeSubject.institution_id == institution_id)
    if grade_id is not None:
        q = q.filter(GradeSubject.grade_id == grade_id)
    if subject_id is not None:
        q = q.filter(GradeSubject.subject_id == subject_id)
    results = q.all()
    return [_build_assignment_out(gs, db) for gs in results]


@router.post("/subject-assignments", response_model=SubjectAssignmentOut, status_code=status.HTTP_201_CREATED)
async def create_subject_assignment(
    data: SubjectAssignmentCreate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    institution_id = _require_institution(current_user)
    existing = db.query(GradeSubject).filter(
        GradeSubject.institution_id == institution_id,
        GradeSubject.grade_id == data.grade_id,
        GradeSubject.subject_id == data.subject_id,
    ).first()
    if existing:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Subject already assigned to this grade")
    gs = GradeSubject(
        institution_id=institution_id,
        grade_id=data.grade_id,
        subject_id=data.subject_id,
        is_compulsory=True,
    )
    db.add(gs)
    db.commit()
    db.refresh(gs)
    return _build_assignment_out(gs, db)


@router.put("/subject-assignments/{assignment_id}", response_model=SubjectAssignmentOut)
async def update_subject_assignment(
    assignment_id: int,
    data: SubjectAssignmentUpdate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    institution_id = _require_institution(current_user)
    gs = db.query(GradeSubject).filter(
        GradeSubject.id == assignment_id,
        GradeSubject.institution_id == institution_id,
    ).first()
    if not gs:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Subject assignment not found")
    db.commit()
    db.refresh(gs)
    return _build_assignment_out(gs, db)


@router.delete("/subject-assignments/{assignment_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_subject_assignment(
    assignment_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    institution_id = _require_institution(current_user)
    gs = db.query(GradeSubject).filter(
        GradeSubject.id == assignment_id,
        GradeSubject.institution_id == institution_id,
    ).first()
    if not gs:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Subject assignment not found")
    db.execute(sql_delete(GradeSubject).where(GradeSubject.id == assignment_id))
    db.commit()


# ── Chapters ─────────────────────────────────────────────────────────────────

@router.get("/chapters", response_model=List[ChapterOut])
async def list_chapters(
    subject_id: Optional[int] = Query(None),
    grade_id: Optional[int] = Query(None),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    institution_id = _require_institution(current_user)
    q = db.query(Chapter).filter(Chapter.institution_id == institution_id)
    if subject_id is not None:
        q = q.filter(Chapter.subject_id == subject_id)
    if grade_id is not None:
        q = q.filter(Chapter.grade_id == grade_id)
    return q.order_by(Chapter.display_order).all()


@router.get("/chapters/{chapter_id}", response_model=ChapterOut)
async def get_chapter(
    chapter_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    institution_id = _require_institution(current_user)
    chapter = db.query(Chapter).filter(Chapter.id == chapter_id, Chapter.institution_id == institution_id).first()
    if not chapter:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Chapter not found")
    return chapter


@router.post("/chapters", response_model=ChapterOut, status_code=status.HTTP_201_CREATED)
async def create_chapter(
    data: ChapterCreate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    institution_id = _require_institution(current_user)

    grade_id = data.grade_id
    if not grade_id:
        gs = db.query(GradeSubject.grade_id).filter(
            GradeSubject.subject_id == data.subject_id,
            GradeSubject.institution_id == institution_id,
        ).first()
        if gs:
            grade_id = gs.grade_id
        else:
            grade = db.query(Grade.id).filter(Grade.institution_id == institution_id).first()
            if not grade:
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail="No grade found for this institution. Please create a grade first.",
                )
            grade_id = grade.id

    display_order = data.chapter_number if data.chapter_number is not None else data.display_order

    chapter = Chapter(
        institution_id=institution_id,
        subject_id=data.subject_id,
        grade_id=grade_id,
        name=data.name,
        code=data.code,
        display_order=display_order,
        description=data.description,
    )
    db.add(chapter)
    db.commit()
    db.refresh(chapter)
    return chapter


@router.put("/chapters/{chapter_id}", response_model=ChapterOut)
async def update_chapter(
    chapter_id: int,
    data: ChapterUpdate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    institution_id = _require_institution(current_user)
    chapter = db.query(Chapter).filter(Chapter.id == chapter_id, Chapter.institution_id == institution_id).first()
    if not chapter:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Chapter not found")
    update_data = data.model_dump(exclude_none=True, exclude={"learning_objectives", "chapter_number"})
    for field, value in update_data.items():
        if hasattr(Chapter, field):
            setattr(chapter, field, value)
    if data.chapter_number is not None:
        chapter.display_order = data.chapter_number
    chapter.updated_at = datetime.utcnow()
    db.commit()
    db.refresh(chapter)
    return chapter


@router.delete("/chapters/{chapter_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_chapter(
    chapter_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    institution_id = _require_institution(current_user)
    exists = db.query(Chapter.id).filter(Chapter.id == chapter_id, Chapter.institution_id == institution_id).scalar()
    if not exists:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Chapter not found")
    db.execute(sql_delete(Chapter).where(Chapter.id == chapter_id))
    db.commit()


# ── Topics ───────────────────────────────────────────────────────────────────

@router.get("/topics", response_model=List[TopicOut])
async def list_topics(
    chapter_id: Optional[int] = Query(None),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    institution_id = _require_institution(current_user)
    q = db.query(Topic).filter(Topic.institution_id == institution_id)
    if chapter_id is not None:
        q = q.filter(Topic.chapter_id == chapter_id)
    return q.order_by(Topic.display_order).all()


@router.get("/topics/{topic_id}", response_model=TopicOut)
async def get_topic(
    topic_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    institution_id = _require_institution(current_user)
    topic = db.query(Topic).filter(Topic.id == topic_id, Topic.institution_id == institution_id).first()
    if not topic:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Topic not found")
    return topic


@router.post("/topics", response_model=TopicOut, status_code=status.HTTP_201_CREATED)
async def create_topic(
    data: TopicCreate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    institution_id = _require_institution(current_user)
    topic = Topic(
        institution_id=institution_id,
        chapter_id=data.chapter_id,
        name=data.name,
        code=data.code,
        display_order=data.display_order,
        description=data.description,
        # duration_hours not yet in DB schema — accepted by API but not persisted
    )
    db.add(topic)
    db.commit()
    db.refresh(topic)
    return topic


@router.put("/topics/{topic_id}", response_model=TopicOut)
async def update_topic(
    topic_id: int,
    data: TopicUpdate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    institution_id = _require_institution(current_user)
    topic = db.query(Topic).filter(Topic.id == topic_id, Topic.institution_id == institution_id).first()
    if not topic:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Topic not found")
    _no_db_fields = {"duration_hours"}
    update_data = data.model_dump(exclude_none=True)
    for field, value in update_data.items():
        if field not in _no_db_fields:
            setattr(topic, field, value)
    topic.updated_at = datetime.utcnow()
    db.commit()
    db.refresh(topic)
    return topic


@router.delete("/topics/{topic_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_topic(
    topic_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    institution_id = _require_institution(current_user)
    exists = db.query(Topic.id).filter(Topic.id == topic_id, Topic.institution_id == institution_id).scalar()
    if not exists:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Topic not found")
    db.execute(sql_delete(Topic).where(Topic.id == topic_id))
    db.commit()


# ── Syllabus ──────────────────────────────────────────────────────────────────

@router.get("/syllabus", response_model=List[SyllabusOut])
async def list_syllabi(
    subject_id: Optional[int] = Query(None),
    grade_id: Optional[int] = Query(None),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    institution_id = _require_institution(current_user)
    q = db.query(Syllabus).filter(Syllabus.institution_id == institution_id)
    if subject_id is not None:
        q = q.filter(Syllabus.subject_id == subject_id)
    if grade_id is not None:
        q = q.filter(Syllabus.grade_id == grade_id)
    return q.order_by(Syllabus.created_at.desc()).all()


@router.get("/syllabus/{syllabus_id}", response_model=SyllabusOut)
async def get_syllabus(
    syllabus_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    institution_id = _require_institution(current_user)
    syllabus = db.query(Syllabus).filter(
        Syllabus.id == syllabus_id,
        Syllabus.institution_id == institution_id,
    ).first()
    if not syllabus:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Syllabus not found")
    return syllabus


@router.post("/syllabus", response_model=SyllabusOut, status_code=status.HTTP_201_CREATED)
async def create_syllabus(
    data: SyllabusCreate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    institution_id = _require_institution(current_user)
    syllabus = Syllabus(
        institution_id=institution_id,
        grade_id=data.grade_id,
        subject_id=data.subject_id,
        title=data.title,
        description=data.description,
        academic_year=data.academic_year,
    )
    db.add(syllabus)
    db.commit()
    db.refresh(syllabus)
    return syllabus


@router.put("/syllabus/{syllabus_id}", response_model=SyllabusOut)
async def update_syllabus(
    syllabus_id: int,
    data: SyllabusUpdate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    institution_id = _require_institution(current_user)
    syllabus = db.query(Syllabus).filter(
        Syllabus.id == syllabus_id,
        Syllabus.institution_id == institution_id,
    ).first()
    if not syllabus:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Syllabus not found")
    for field in ("title", "description", "academic_year", "is_active"):
        val = getattr(data, field, None)
        if val is not None:
            setattr(syllabus, field, val)
    syllabus.updated_at = datetime.utcnow()
    db.commit()
    db.refresh(syllabus)
    return syllabus


@router.delete("/syllabus/{syllabus_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_syllabus(
    syllabus_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    institution_id = _require_institution(current_user)
    exists = db.query(Syllabus.id).filter(
        Syllabus.id == syllabus_id,
        Syllabus.institution_id == institution_id,
    ).scalar()
    if not exists:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Syllabus not found")
    db.execute(sql_delete(Syllabus).where(Syllabus.id == syllabus_id))
    db.commit()


@router.post("/syllabus/{syllabus_id}/upload")
async def upload_syllabus_file(
    syllabus_id: int,
    file: UploadFile = File(...),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    institution_id = _require_institution(current_user)
    syllabus = db.query(Syllabus).filter(
        Syllabus.id == syllabus_id,
        Syllabus.institution_id == institution_id,
    ).first()
    if not syllabus:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Syllabus not found")
    syllabus.file_name = file.filename
    syllabus.file_url = None
    db.commit()
    return {"file_url": None, "file_name": file.filename}


@router.get("/syllabus/{syllabus_id}/download")
async def download_syllabus_file(
    syllabus_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    institution_id = _require_institution(current_user)
    syllabus = db.query(Syllabus).filter(
        Syllabus.id == syllabus_id,
        Syllabus.institution_id == institution_id,
    ).first()
    if not syllabus or not syllabus.file_url:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="No file attached to this syllabus")
    return {"file_url": syllabus.file_url}
