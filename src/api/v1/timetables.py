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
    TimetableInstanceCreate,
    TimetableInstanceResponse,
    TimetableInstanceWithEntriesResponse,
    TimetableEntryCreate,
    TimetableEntryUpdate,
    TimetableEntryResponse,
    TimetableEntryWithDetailsResponse,
    TimetableValidationResponse,
    TimetableConflict,
    BulkPeriodOrderUpdate,
    DayOfWeekEnum,
)
from src.models.timetable import TimetableTemplate, PeriodSlot as Period, Timetable, TimetableEntry

router = APIRouter()


def _check_institution_access(current_user: User, institution_id: int) -> None:
    if not current_user.is_superuser and current_user.institution_id != institution_id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Not authorized to access this institution's data"
        )


def _get_owned_template(db: Session, template_id: int, current_user: User) -> TimetableTemplate:
    """Looks up a template and 403s unless it belongs to the caller's institution."""
    template = db.query(TimetableTemplate).filter(TimetableTemplate.id == template_id).first()
    if not template:
        raise HTTPException(status_code=404, detail="Timetable template not found")
    _check_institution_access(current_user, template.institution_id)
    return template


def _get_owned_instance(db: Session, instance_id: int, current_user: User) -> Timetable:
    """Looks up a Timetable (a section's period grid for an academic year)
    and 403s unless it belongs to the caller's institution."""
    instance = db.query(Timetable).filter(Timetable.id == instance_id).first()
    if not instance:
        raise HTTPException(status_code=404, detail="Timetable not found")
    _check_institution_access(current_user, instance.institution_id)
    return instance


# ---------------------------------------------------------------------------
# Templates
# ---------------------------------------------------------------------------
@router.post("/templates", response_model=TimetableTemplateResponse, status_code=status.HTTP_201_CREATED)
async def create_timetable_template(
    template_data: TimetableTemplateCreate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    _check_institution_access(current_user, template_data.institution_id)

    template = TimetableTemplate(**template_data.model_dump())
    db.add(template)
    db.commit()
    db.refresh(template)
    return template


@router.get("/templates", response_model=dict)
async def list_timetable_templates(
    skip: int = Query(0, ge=0),
    limit: int = Query(100, ge=1, le=100),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    query = db.query(TimetableTemplate).filter(
        TimetableTemplate.institution_id == current_user.institution_id
    )

    total = query.count()
    templates = query.offset(skip).limit(limit).all()

    return {
        "items": [TimetableTemplateResponse.model_validate(t) for t in templates],
        "total": total,
        "skip": skip,
        "limit": limit,
    }


@router.get("/templates/{template_id:int}", response_model=TimetableTemplateWithPeriodsResponse)
async def get_timetable_template(
    template_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    template = db.query(TimetableTemplate).options(
        joinedload(TimetableTemplate.period_slots)
    ).filter(TimetableTemplate.id == template_id).first()

    if not template:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Timetable template not found"
        )

    _check_institution_access(current_user, template.institution_id)

    # `TimetableTemplateWithPeriodsResponse.periods` has no matching
    # attribute on the ORM object -- the relationship is named
    # `period_slots` -- so a plain `model_validate(template)` silently fell
    # back to the field's `[]` default instead of raising, and periods
    # never appeared in the response no matter how many existed. Built
    # explicitly instead of relying on attribute-name matching.
    ordered_periods = sorted(template.period_slots, key=lambda p: p.period_number)
    return TimetableTemplateWithPeriodsResponse(
        **TimetableTemplateResponse.model_validate(template).model_dump(),
        periods=[PeriodResponse.model_validate(p) for p in ordered_periods],
    )


@router.put("/templates/{template_id:int}", response_model=TimetableTemplateResponse)
async def update_timetable_template(
    template_id: int,
    template_data: TimetableTemplateUpdate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    template = _get_owned_template(db, template_id, current_user)

    for key, value in template_data.model_dump(exclude_unset=True).items():
        setattr(template, key, value)

    db.commit()
    db.refresh(template)
    return template


@router.delete("/templates/{template_id:int}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_timetable_template(
    template_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    template = _get_owned_template(db, template_id, current_user)

    db.delete(template)
    db.commit()
    return None


# ---------------------------------------------------------------------------
# Periods (a template's period grid)
# ---------------------------------------------------------------------------
@router.post("/periods", response_model=PeriodResponse, status_code=status.HTTP_201_CREATED)
async def create_period(
    period_data: PeriodCreate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    # `PeriodSlot` belongs to a template, which is the thing actually scoped
    # to an institution -- there is no `institution_id` column on the period
    # itself, so ownership is checked through its (now-validated) template.
    _get_owned_template(db, period_data.template_id, current_user)

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
    _get_owned_template(db, template_id, current_user)

    periods = db.query(Period).filter(
        Period.template_id == template_id
    ).order_by(Period.period_number).all()

    return {
        "items": [PeriodResponse.model_validate(p) for p in periods],
        "total": len(periods),
    }


@router.put("/periods/{period_id:int}", response_model=PeriodResponse)
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

    _get_owned_template(db, period.template_id, current_user)

    for key, value in period_data.model_dump(exclude_unset=True).items():
        setattr(period, key, value)

    db.commit()
    db.refresh(period)
    return period


@router.delete("/periods/{period_id:int}", status_code=status.HTTP_204_NO_CONTENT)
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

    _get_owned_template(db, period.template_id, current_user)

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
        period = db.query(Period).join(
            TimetableTemplate, Period.template_id == TimetableTemplate.id
        ).filter(
            Period.id == item['id'],
            TimetableTemplate.institution_id == current_user.institution_id
        ).first()

        if period:
            # Accept `period_number` (matches the real column) and fall
            # back to the old `display_order` key for callers still on the
            # previous (broken) wire shape.
            new_number = item.get('period_number', item.get('display_order'))
            if new_number is not None:
                period.period_number = new_number

    db.commit()
    return {"message": "Order updated successfully"}


# ---------------------------------------------------------------------------
# Timetable instances (a section's actual grid for an academic year)
# ---------------------------------------------------------------------------
@router.post("/instances", response_model=TimetableInstanceResponse, status_code=status.HTTP_201_CREATED)
async def create_timetable_instance(
    instance_data: TimetableInstanceCreate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    _check_institution_access(current_user, instance_data.institution_id)

    if instance_data.template_id:
        _get_owned_template(db, instance_data.template_id, current_user)

    instance = Timetable(**instance_data.model_dump())
    db.add(instance)
    db.commit()
    db.refresh(instance)
    return instance


@router.get("/instances", response_model=dict)
async def list_timetable_instances(
    section_id: Optional[int] = Query(None),
    academic_year_id: Optional[int] = Query(None),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    query = db.query(Timetable).filter(
        Timetable.institution_id == current_user.institution_id
    )

    if section_id:
        query = query.filter(Timetable.section_id == section_id)
    if academic_year_id:
        query = query.filter(Timetable.academic_year_id == academic_year_id)

    instances = query.all()

    return {
        "items": [TimetableInstanceResponse.model_validate(i) for i in instances],
        "total": len(instances),
    }


@router.get("/instances/{instance_id:int}", response_model=TimetableInstanceWithEntriesResponse)
async def get_timetable_instance(
    instance_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    instance = db.query(Timetable).options(
        joinedload(Timetable.entries)
    ).filter(Timetable.id == instance_id).first()

    if not instance:
        raise HTTPException(status_code=404, detail="Timetable not found")

    _check_institution_access(current_user, instance.institution_id)
    return instance


@router.delete("/instances/{instance_id:int}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_timetable_instance(
    instance_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    instance = _get_owned_instance(db, instance_id, current_user)

    db.delete(instance)
    db.commit()
    return None


# ---------------------------------------------------------------------------
# Entries (one section's day/period/subject/teacher grid)
# ---------------------------------------------------------------------------
@router.post("/entries", response_model=TimetableEntryResponse, status_code=status.HTTP_201_CREATED)
async def create_timetable_entry(
    entry_data: TimetableEntryCreate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    _get_owned_instance(db, entry_data.timetable_id, current_user)

    existing = db.query(TimetableEntry).filter(
        TimetableEntry.timetable_id == entry_data.timetable_id,
        TimetableEntry.period_number == entry_data.period_number,
        TimetableEntry.day_of_week == entry_data.day_of_week.value
    ).first()

    if existing:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Timetable entry already exists for this timetable, period, and day"
        )

    data = entry_data.model_dump()
    data['day_of_week'] = data['day_of_week'].value if hasattr(data['day_of_week'], 'value') else data['day_of_week']
    entry = TimetableEntry(**data)
    db.add(entry)
    db.commit()
    db.refresh(entry)
    return entry


@router.get("/entries", response_model=dict)
async def list_timetable_entries(
    timetable_id: int = Query(...),
    day_of_week: Optional[DayOfWeekEnum] = Query(None),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    _get_owned_instance(db, timetable_id, current_user)

    query = db.query(TimetableEntry).filter(TimetableEntry.timetable_id == timetable_id)

    if day_of_week:
        query = query.filter(TimetableEntry.day_of_week == day_of_week.value)

    entries = query.options(
        joinedload(TimetableEntry.subject)
    ).order_by(TimetableEntry.day_of_week, TimetableEntry.period_number).all()

    return {
        "items": [TimetableEntryResponse.model_validate(e) for e in entries],
        "total": len(entries),
    }


@router.get("/entries/{entry_id:int}", response_model=TimetableEntryWithDetailsResponse)
async def get_timetable_entry(
    entry_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    entry = db.query(TimetableEntry).options(
        joinedload(TimetableEntry.subject)
    ).filter(TimetableEntry.id == entry_id).first()

    if not entry:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Timetable entry not found"
        )

    _get_owned_instance(db, entry.timetable_id, current_user)
    return entry


@router.put("/entries/{entry_id:int}", response_model=TimetableEntryResponse)
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

    _get_owned_instance(db, entry.timetable_id, current_user)

    for key, value in entry_data.model_dump(exclude_unset=True).items():
        setattr(entry, key, value)

    db.commit()
    db.refresh(entry)
    return entry


@router.delete("/entries/{entry_id:int}", status_code=status.HTTP_204_NO_CONTENT)
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

    _get_owned_instance(db, entry.timetable_id, current_user)

    db.delete(entry)
    db.commit()
    return None


# ---------------------------------------------------------------------------
# Validation
# ---------------------------------------------------------------------------
@router.get("/validate/{template_id:int}", response_model=TimetableValidationResponse)
async def validate_timetable(
    template_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Detects a teacher double-booked at the same day/period across the
    different sections' Timetable instances that share this template.

    A single Timetable instance can't have two entries at the same
    day_of_week+period_number (the DB enforces that uniqueness directly), so
    the only real conflict shape is the *same teacher* appearing at the same
    day/period across two *different* sections following this template.
    """
    _get_owned_template(db, template_id, current_user)

    entries = db.query(TimetableEntry).join(
        Timetable, TimetableEntry.timetable_id == Timetable.id
    ).filter(
        Timetable.template_id == template_id,
        Timetable.institution_id == current_user.institution_id
    ).all()

    conflicts = []
    teacher_schedule = {}
    for entry in entries:
        if entry.teacher_id:
            key = (entry.teacher_id, entry.day_of_week, entry.period_number)
            if key in teacher_schedule:
                conflicts.append(TimetableConflict(
                    type="teacher_conflict",
                    message="Teacher is assigned to multiple classes at the same time",
                    entry_id=entry.id,
                    timetable_id=entry.timetable_id,
                    teacher_id=entry.teacher_id,
                    period_number=entry.period_number,
                    day_of_week=DayOfWeekEnum(entry.day_of_week)
                ))
            else:
                teacher_schedule[key] = entry.id

    return TimetableValidationResponse(
        is_valid=len(conflicts) == 0,
        conflicts=conflicts
    )
