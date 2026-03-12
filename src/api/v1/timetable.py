from typing import Optional, List
from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.orm import Session
from sqlalchemy import and_, or_
from datetime import datetime, time
from src.database import get_db
from src.models.user import User
from src.models.timetable import TimetableTemplate, PeriodSlot, Timetable, TimetableEntry
from src.models.academic import Subject
from src.models.teacher import Teacher
from src.dependencies.auth import get_current_user
from src.schemas.timetable import (
    TimetableTemplateCreate,
    TimetableTemplateUpdate,
    TimetableTemplateResponse,
    TimetableTemplateWithPeriods,
    PeriodSlotCreate,
    PeriodSlotUpdate,
    PeriodSlotResponse,
    TimetableCreate,
    TimetableUpdate,
    TimetableResponse,
    TimetableWithEntries,
    TimetableEntryCreate,
    TimetableEntryUpdate,
    TimetableEntryResponse,
    TimetableEntryWithDetails,
    ConflictCheck
)

router = APIRouter()


# Templates
@router.post("/templates", response_model=TimetableTemplateResponse, status_code=status.HTTP_201_CREATED)
async def create_template(
    template_data: TimetableTemplateCreate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    if current_user.institution_id != template_data.institution_id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Not authorized"
        )

    template = TimetableTemplate(**template_data.model_dump())
    db.add(template)
    db.commit()
    db.refresh(template)
    return template


@router.get("/templates", response_model=List[TimetableTemplateResponse])
async def list_templates(
    academic_year_id: Optional[int] = Query(None),
    is_active: Optional[bool] = Query(None),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    query = db.query(TimetableTemplate).filter(
        TimetableTemplate.institution_id == current_user.institution_id
    )
    
    if academic_year_id:
        query = query.filter(TimetableTemplate.academic_year_id == academic_year_id)
    if is_active is not None:
        query = query.filter(TimetableTemplate.is_active == is_active)
    
    templates = query.all()
    return templates


@router.get("/templates/{template_id}", response_model=TimetableTemplateWithPeriods)
async def get_template(
    template_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    template = db.query(TimetableTemplate).filter(
        TimetableTemplate.id == template_id,
        TimetableTemplate.institution_id == current_user.institution_id
    ).first()
    
    if not template:
        raise HTTPException(status_code=404, detail="Template not found")
    
    return template


# Period Slots
@router.post("/period-slots", response_model=PeriodSlotResponse, status_code=status.HTTP_201_CREATED)
async def create_period_slot(
    slot_data: PeriodSlotCreate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    template = db.query(TimetableTemplate).filter(
        TimetableTemplate.id == slot_data.template_id,
        TimetableTemplate.institution_id == current_user.institution_id
    ).first()
    
    if not template:
        raise HTTPException(status_code=404, detail="Template not found")

    slot = PeriodSlot(**slot_data.model_dump())
    db.add(slot)
    db.commit()
    db.refresh(slot)
    return slot


# Timetables
@router.post("/", response_model=TimetableResponse, status_code=status.HTTP_201_CREATED)
async def create_timetable(
    timetable_data: TimetableCreate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    if current_user.institution_id != timetable_data.institution_id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Not authorized"
        )

    timetable = Timetable(**timetable_data.model_dump())
    db.add(timetable)
    db.commit()
    db.refresh(timetable)
    return timetable


@router.get("/", response_model=dict)
async def list_timetables(
    skip: int = Query(0, ge=0),
    limit: int = Query(100, ge=1, le=100),
    academic_year_id: Optional[int] = Query(None),
    grade_id: Optional[int] = Query(None),
    section_id: Optional[int] = Query(None),
    is_active: Optional[bool] = Query(None),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    query = db.query(Timetable).filter(
        Timetable.institution_id == current_user.institution_id
    )
    
    if academic_year_id:
        query = query.filter(Timetable.academic_year_id == academic_year_id)
    if grade_id:
        query = query.filter(Timetable.grade_id == grade_id)
    if section_id:
        query = query.filter(Timetable.section_id == section_id)
    if is_active is not None:
        query = query.filter(Timetable.is_active == is_active)
    
    total = query.count()
    timetables = query.offset(skip).limit(limit).all()
    
    return {
        "items": timetables,
        "total": total,
        "skip": skip,
        "limit": limit
    }


@router.get("/{timetable_id}", response_model=TimetableWithEntries)
async def get_timetable(
    timetable_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    timetable = db.query(Timetable).filter(
        Timetable.id == timetable_id,
        Timetable.institution_id == current_user.institution_id
    ).first()
    
    if not timetable:
        raise HTTPException(status_code=404, detail="Timetable not found")
    
    # Get entries with details
    entries_data = db.query(
        TimetableEntry,
        Subject.name.label('subject_name'),
        Subject.code.label('subject_code'),
        Teacher.first_name.label('teacher_first_name'),
        Teacher.last_name.label('teacher_last_name')
    ).join(
        Subject, TimetableEntry.subject_id == Subject.id
    ).outerjoin(
        Teacher, TimetableEntry.teacher_id == Teacher.id
    ).filter(
        TimetableEntry.timetable_id == timetable_id,
        TimetableEntry.is_active == True
    ).all()
    
    entries = []
    for entry, subject_name, subject_code, teacher_first, teacher_last in entries_data:
        teacher_name = f"{teacher_first} {teacher_last}" if teacher_first else None
        entry_dict = {
            **entry.__dict__,
            "subject_name": subject_name,
            "subject_code": subject_code,
            "teacher_name": teacher_name,
            "original_teacher_name": None  # Would need similar join for original teacher
        }
        entries.append(TimetableEntryWithDetails(**entry_dict))
    
    timetable_dict = {**timetable.__dict__, "entries": entries}
    return TimetableWithEntries(**timetable_dict)


# Timetable Entries
@router.post("/entries", response_model=TimetableEntryResponse, status_code=status.HTTP_201_CREATED)
async def create_entry(
    entry_data: TimetableEntryCreate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    timetable = db.query(Timetable).filter(
        Timetable.id == entry_data.timetable_id,
        Timetable.institution_id == current_user.institution_id
    ).first()
    
    if not timetable:
        raise HTTPException(status_code=404, detail="Timetable not found")
    
    # Check for conflicts
    conflict = check_conflicts(db, entry_data, current_user.institution_id)
    if conflict.has_conflict:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=conflict.conflict_message
        )

    entry = TimetableEntry(**entry_data.model_dump())
    db.add(entry)
    db.commit()
    db.refresh(entry)
    return entry


@router.get("/entries/check-conflict", response_model=ConflictCheck)
async def check_entry_conflict(
    timetable_id: int = Query(...),
    teacher_id: Optional[int] = Query(None),
    day_of_week: str = Query(...),
    start_time: time = Query(...),
    end_time: time = Query(...),
    exclude_entry_id: Optional[int] = Query(None),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    # Check if entry already exists at same time
    existing_query = db.query(TimetableEntry).filter(
        TimetableEntry.timetable_id == timetable_id,
        TimetableEntry.day_of_week == day_of_week,
        TimetableEntry.is_active == True,
        or_(
            and_(
                TimetableEntry.start_time <= start_time,
                TimetableEntry.end_time > start_time
            ),
            and_(
                TimetableEntry.start_time < end_time,
                TimetableEntry.end_time >= end_time
            ),
            and_(
                TimetableEntry.start_time >= start_time,
                TimetableEntry.end_time <= end_time
            )
        )
    )
    
    if exclude_entry_id:
        existing_query = existing_query.filter(TimetableEntry.id != exclude_entry_id)
    
    existing_entry = existing_query.first()
    
    if existing_entry:
        return ConflictCheck(
            has_conflict=True,
            conflict_type="period",
            conflict_message="Time slot already occupied in this timetable",
            conflicting_entries=[]
        )
    
    # Check teacher conflict
    if teacher_id:
        teacher_conflict_query = db.query(TimetableEntry).join(Timetable).filter(
            Timetable.institution_id == current_user.institution_id,
            TimetableEntry.teacher_id == teacher_id,
            TimetableEntry.day_of_week == day_of_week,
            TimetableEntry.is_active == True,
            Timetable.is_active == True,
            or_(
                and_(
                    TimetableEntry.start_time <= start_time,
                    TimetableEntry.end_time > start_time
                ),
                and_(
                    TimetableEntry.start_time < end_time,
                    TimetableEntry.end_time >= end_time
                ),
                and_(
                    TimetableEntry.start_time >= start_time,
                    TimetableEntry.end_time <= end_time
                )
            )
        )
        
        if exclude_entry_id:
            teacher_conflict_query = teacher_conflict_query.filter(TimetableEntry.id != exclude_entry_id)
        
        teacher_conflict = teacher_conflict_query.first()
        
        if teacher_conflict:
            return ConflictCheck(
                has_conflict=True,
                conflict_type="teacher",
                conflict_message="Teacher is already assigned to another class at this time",
                conflicting_entries=[]
            )
    
    return ConflictCheck(
        has_conflict=False,
        conflicting_entries=[]
    )


@router.put("/entries/{entry_id}", response_model=TimetableEntryResponse)
async def update_entry(
    entry_id: int,
    update_data: TimetableEntryUpdate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    entry = db.query(TimetableEntry).join(Timetable).filter(
        TimetableEntry.id == entry_id,
        Timetable.institution_id == current_user.institution_id
    ).first()
    
    if not entry:
        raise HTTPException(status_code=404, detail="Entry not found")
    
    for field, value in update_data.model_dump(exclude_unset=True).items():
        setattr(entry, field, value)
    
    db.commit()
    db.refresh(entry)
    return entry


@router.delete("/entries/{entry_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_entry(
    entry_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    entry = db.query(TimetableEntry).join(Timetable).filter(
        TimetableEntry.id == entry_id,
        Timetable.institution_id == current_user.institution_id
    ).first()
    
    if not entry:
        raise HTTPException(status_code=404, detail="Entry not found")
    
    db.delete(entry)
    db.commit()
    return None


def check_conflicts(db: Session, entry_data: TimetableEntryCreate, institution_id: int) -> ConflictCheck:
    # Check period conflict
    existing = db.query(TimetableEntry).filter(
        TimetableEntry.timetable_id == entry_data.timetable_id,
        TimetableEntry.day_of_week == entry_data.day_of_week,
        TimetableEntry.period_number == entry_data.period_number,
        TimetableEntry.is_active == True
    ).first()
    
    if existing:
        return ConflictCheck(
            has_conflict=True,
            conflict_type="period",
            conflict_message="Period already exists for this day",
            conflicting_entries=[]
        )
    
    # Check teacher conflict
    if entry_data.teacher_id:
        teacher_conflict = db.query(TimetableEntry).join(Timetable).filter(
            Timetable.institution_id == institution_id,
            TimetableEntry.teacher_id == entry_data.teacher_id,
            TimetableEntry.day_of_week == entry_data.day_of_week,
            TimetableEntry.is_active == True,
            Timetable.is_active == True,
            or_(
                and_(
                    TimetableEntry.start_time <= entry_data.start_time,
                    TimetableEntry.end_time > entry_data.start_time
                ),
                and_(
                    TimetableEntry.start_time < entry_data.end_time,
                    TimetableEntry.end_time >= entry_data.end_time
                )
            )
        ).first()
        
        if teacher_conflict:
            return ConflictCheck(
                has_conflict=True,
                conflict_type="teacher",
                conflict_message="Teacher already assigned at this time",
                conflicting_entries=[]
            )
    
    return ConflictCheck(has_conflict=False, conflicting_entries=[])
