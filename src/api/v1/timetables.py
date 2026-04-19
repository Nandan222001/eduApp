from typing import Optional, List
from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.orm import Session, joinedload
from src.database import get_db
from src.models.user import User
from src.dependencies.auth import get_current_user
from src.schemas.academic import (
    TimetableTemplateCreate,
    TimetableTemplateUpdate,
    TimetableTemplateResponse,
    TimetableTemplateWithPeriodsResponse,
    PeriodCreate,
    PeriodUpdate,
    PeriodResponse,
    TimetableEntryCreate,
    TimetableEntryUpdate,
    TimetableEntryResponse,
    TimetableEntryWithDetailsResponse,
    TimetableValidationResponse,
    TimetableConflict,
    BulkPeriodOrderUpdate,
    DayOfWeekEnum,
)
from src.models.timetable import TimetableTemplate, PeriodSlot as Period, TimetableEntry
from src.models.academic import DayOfWeek

router = APIRouter()


@router.post("/templates", response_model=TimetableTemplateResponse, status_code=status.HTTP_201_CREATED)
async def create_timetable_template(
    template_data: TimetableTemplateCreate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    if current_user.institution_id != template_data.institution_id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Not authorized to create timetable for this institution"
        )
    
    template = TimetableTemplate(**template_data.model_dump())
    db.add(template)
    db.commit()
    db.refresh(template)
    return template


@router.get("/templates", response_model=dict)
async def list_timetable_templates(
    academic_year_id: Optional[int] = Query(None),
    skip: int = Query(0, ge=0),
    limit: int = Query(100, ge=1, le=100),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    query = db.query(TimetableTemplate).filter(
        TimetableTemplate.institution_id == current_user.institution_id
    )
    
    if academic_year_id:
        query = query.filter(TimetableTemplate.academic_year_id == academic_year_id)
    
    total = query.count()
    templates = query.offset(skip).limit(limit).all()
    
    return {
        "items": templates,
        "total": total,
        "skip": skip,
        "limit": limit,
    }


@router.get("/templates/{template_id}", response_model=TimetableTemplateWithPeriodsResponse)
async def get_timetable_template(
    template_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    template = db.query(TimetableTemplate).options(
        joinedload(TimetableTemplate.periods)
    ).filter(TimetableTemplate.id == template_id).first()
    
    if not template:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Timetable template not found"
        )
    
    if template.institution_id != current_user.institution_id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Not authorized to access this timetable"
        )
    
    return template


@router.put("/templates/{template_id}", response_model=TimetableTemplateResponse)
async def update_timetable_template(
    template_id: int,
    template_data: TimetableTemplateUpdate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    template = db.query(TimetableTemplate).filter(TimetableTemplate.id == template_id).first()
    
    if not template:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Timetable template not found"
        )
    
    if template.institution_id != current_user.institution_id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Not authorized to update this timetable"
        )
    
    for key, value in template_data.model_dump(exclude_unset=True).items():
        setattr(template, key, value)
    
    db.commit()
    db.refresh(template)
    return template


@router.delete("/templates/{template_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_timetable_template(
    template_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    template = db.query(TimetableTemplate).filter(TimetableTemplate.id == template_id).first()
    
    if not template:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Timetable template not found"
        )
    
    if template.institution_id != current_user.institution_id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Not authorized to delete this timetable"
        )
    
    db.delete(template)
    db.commit()
    return None


@router.post("/periods", response_model=PeriodResponse, status_code=status.HTTP_201_CREATED)
async def create_period(
    period_data: PeriodCreate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    if current_user.institution_id != period_data.institution_id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Not authorized"
        )
    
    period = Period(**period_data.model_dump())
    db.add(period)
    db.commit()
    db.refresh(period)
    return period


@router.get("/periods", response_model=dict)
async def list_periods(
    template_id: int = Query(...),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    periods = db.query(Period).filter(
        Period.institution_id == current_user.institution_id,
        Period.template_id == template_id
    ).order_by(Period.display_order, Period.start_time).all()
    
    return {
        "items": periods,
        "total": len(periods),
    }


@router.put("/periods/{period_id}", response_model=PeriodResponse)
async def update_period(
    period_id: int,
    period_data: PeriodUpdate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    period = db.query(Period).filter(Period.id == period_id).first()
    
    if not period:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Period not found"
        )
    
    if period.institution_id != current_user.institution_id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Not authorized"
        )
    
    for key, value in period_data.model_dump(exclude_unset=True).items():
        setattr(period, key, value)
    
    db.commit()
    db.refresh(period)
    return period


@router.delete("/periods/{period_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_period(
    period_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    period = db.query(Period).filter(Period.id == period_id).first()
    
    if not period:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Period not found"
        )
    
    if period.institution_id != current_user.institution_id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Not authorized"
        )
    
    db.delete(period)
    db.commit()
    return None


@router.put("/periods/bulk-order", response_model=dict)
async def update_period_order(
    order_data: BulkPeriodOrderUpdate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    for item in order_data.periods:
        period = db.query(Period).filter(
            Period.id == item['id'],
            Period.institution_id == current_user.institution_id
        ).first()
        
        if period:
            period.display_order = item['display_order']
    
    db.commit()
    return {"message": "Order updated successfully"}


@router.post("/entries", response_model=TimetableEntryResponse, status_code=status.HTTP_201_CREATED)
async def create_timetable_entry(
    entry_data: TimetableEntryCreate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    if current_user.institution_id != entry_data.institution_id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Not authorized"
        )
    
    existing = db.query(TimetableEntry).filter(
        TimetableEntry.section_id == entry_data.section_id,
        TimetableEntry.period_id == entry_data.period_id,
        TimetableEntry.day_of_week == entry_data.day_of_week.value
    ).first()
    
    if existing:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Timetable entry already exists for this section, period, and day"
        )
    
    entry = TimetableEntry(**entry_data.model_dump())
    db.add(entry)
    db.commit()
    db.refresh(entry)
    return entry


@router.get("/entries", response_model=dict)
async def list_timetable_entries(
    template_id: Optional[int] = Query(None),
    section_id: Optional[int] = Query(None),
    day_of_week: Optional[DayOfWeekEnum] = Query(None),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    query = db.query(TimetableEntry).filter(
        TimetableEntry.institution_id == current_user.institution_id
    )
    
    if template_id:
        query = query.filter(TimetableEntry.template_id == template_id)
    if section_id:
        query = query.filter(TimetableEntry.section_id == section_id)
    if day_of_week:
        query = query.filter(TimetableEntry.day_of_week == day_of_week.value)
    
    entries = query.options(
        joinedload(TimetableEntry.subject),
        joinedload(TimetableEntry.period)
    ).all()
    
    return {
        "items": entries,
        "total": len(entries),
    }


@router.get("/entries/{entry_id}", response_model=TimetableEntryWithDetailsResponse)
async def get_timetable_entry(
    entry_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    entry = db.query(TimetableEntry).options(
        joinedload(TimetableEntry.subject),
        joinedload(TimetableEntry.period)
    ).filter(TimetableEntry.id == entry_id).first()
    
    if not entry:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Timetable entry not found"
        )
    
    if entry.institution_id != current_user.institution_id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Not authorized"
        )
    
    return entry


@router.put("/entries/{entry_id}", response_model=TimetableEntryResponse)
async def update_timetable_entry(
    entry_id: int,
    entry_data: TimetableEntryUpdate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    entry = db.query(TimetableEntry).filter(TimetableEntry.id == entry_id).first()
    
    if not entry:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Timetable entry not found"
        )
    
    if entry.institution_id != current_user.institution_id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Not authorized"
        )
    
    for key, value in entry_data.model_dump(exclude_unset=True).items():
        setattr(entry, key, value)
    
    db.commit()
    db.refresh(entry)
    return entry


@router.delete("/entries/{entry_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_timetable_entry(
    entry_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    entry = db.query(TimetableEntry).filter(TimetableEntry.id == entry_id).first()
    
    if not entry:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Timetable entry not found"
        )
    
    if entry.institution_id != current_user.institution_id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Not authorized"
        )
    
    db.delete(entry)
    db.commit()
    return None


@router.get("/validate/{template_id}", response_model=TimetableValidationResponse)
async def validate_timetable(
    template_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    conflicts = []
    
    entries = db.query(TimetableEntry).filter(
        TimetableEntry.template_id == template_id,
        TimetableEntry.institution_id == current_user.institution_id
    ).all()
    
    teacher_schedule = {}
    for entry in entries:
        if entry.teacher_id:
            key = (entry.teacher_id, entry.day_of_week, entry.period_id)
            if key in teacher_schedule:
                conflicts.append(TimetableConflict(
                    type="teacher_conflict",
                    message=f"Teacher is assigned to multiple classes at the same time",
                    entry_id=entry.id,
                    teacher_id=entry.teacher_id,
                    period_id=entry.period_id,
                    day_of_week=DayOfWeekEnum(entry.day_of_week)
                ))
            else:
                teacher_schedule[key] = entry.id
    
    return TimetableValidationResponse(
        is_valid=len(conflicts) == 0,
        conflicts=conflicts
    )
