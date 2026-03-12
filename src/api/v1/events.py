from typing import Optional, List
from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.orm import Session
from sqlalchemy import and_, or_, func
from datetime import datetime
from src.database import get_db
from src.models.user import User
from src.models.event import Event, EventRSVP, EventPhoto
from src.dependencies.auth import get_current_user
from src.schemas.event import (
    EventCreate,
    EventUpdate,
    EventResponse,
    EventWithDetails,
    EventCalendarItem,
    EventRSVPCreate,
    EventRSVPUpdate,
    EventRSVPResponse,
    EventRSVPWithUser,
    EventPhotoCreate,
    EventPhotoUpdate,
    EventPhotoResponse
)

router = APIRouter()


# Events
@router.post("/", response_model=EventResponse, status_code=status.HTTP_201_CREATED)
async def create_event(
    event_data: EventCreate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    if current_user.institution_id != event_data.institution_id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Not authorized"
        )

    event = Event(**event_data.model_dump(), created_by=current_user.id)
    db.add(event)
    db.commit()
    db.refresh(event)
    return event


@router.get("/", response_model=dict)
async def list_events(
    skip: int = Query(0, ge=0),
    limit: int = Query(100, ge=1, le=100),
    event_type: Optional[str] = Query(None),
    status_filter: Optional[str] = Query(None, alias="status"),
    start_date: Optional[datetime] = Query(None),
    end_date: Optional[datetime] = Query(None),
    is_public: Optional[bool] = Query(None),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    query = db.query(Event).filter(Event.institution_id == current_user.institution_id)
    
    if event_type:
        query = query.filter(Event.event_type == event_type)
    if status_filter:
        query = query.filter(Event.status == status_filter)
    if start_date:
        query = query.filter(Event.start_date >= start_date)
    if end_date:
        query = query.filter(Event.end_date <= end_date)
    if is_public is not None:
        query = query.filter(Event.is_public == is_public)
    
    total = query.count()
    events = query.order_by(Event.start_date.desc()).offset(skip).limit(limit).all()
    
    return {
        "items": events,
        "total": total,
        "skip": skip,
        "limit": limit
    }


@router.get("/calendar", response_model=List[EventCalendarItem])
async def get_calendar_events(
    start_date: datetime = Query(...),
    end_date: datetime = Query(...),
    event_type: Optional[str] = Query(None),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    query = db.query(Event).filter(
        Event.institution_id == current_user.institution_id,
        Event.start_date >= start_date,
        Event.start_date <= end_date,
        Event.status != "cancelled"
    )
    
    if event_type:
        query = query.filter(Event.event_type == event_type)
    
    events = query.all()
    
    return [
        EventCalendarItem(
            id=event.id,
            title=event.title,
            event_type=event.event_type,
            start_date=event.start_date,
            end_date=event.end_date,
            location=event.location,
            status=event.status
        )
        for event in events
    ]


@router.get("/{event_id}", response_model=EventWithDetails)
async def get_event(
    event_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    event = db.query(Event).filter(
        Event.id == event_id,
        Event.institution_id == current_user.institution_id
    ).first()
    
    if not event:
        raise HTTPException(status_code=404, detail="Event not found")
    
    # Get RSVP counts
    rsvp_count = db.query(EventRSVP).filter(EventRSVP.event_id == event_id).count()
    accepted_count = db.query(EventRSVP).filter(
        EventRSVP.event_id == event_id,
        EventRSVP.status == "accepted"
    ).count()
    declined_count = db.query(EventRSVP).filter(
        EventRSVP.event_id == event_id,
        EventRSVP.status == "declined"
    ).count()
    photo_count = db.query(EventPhoto).filter(
        EventPhoto.event_id == event_id,
        EventPhoto.is_active == True
    ).count()
    
    event_dict = {
        **event.__dict__,
        "rsvp_count": rsvp_count,
        "accepted_count": accepted_count,
        "declined_count": declined_count,
        "photo_count": photo_count
    }
    
    return EventWithDetails(**event_dict)


@router.put("/{event_id}", response_model=EventResponse)
async def update_event(
    event_id: int,
    update_data: EventUpdate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    event = db.query(Event).filter(
        Event.id == event_id,
        Event.institution_id == current_user.institution_id
    ).first()
    
    if not event:
        raise HTTPException(status_code=404, detail="Event not found")
    
    for field, value in update_data.model_dump(exclude_unset=True).items():
        setattr(event, field, value)
    
    db.commit()
    db.refresh(event)
    return event


@router.delete("/{event_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_event(
    event_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    event = db.query(Event).filter(
        Event.id == event_id,
        Event.institution_id == current_user.institution_id
    ).first()
    
    if not event:
        raise HTTPException(status_code=404, detail="Event not found")
    
    db.delete(event)
    db.commit()
    return None


# RSVPs
@router.post("/{event_id}/rsvp", response_model=EventRSVPResponse, status_code=status.HTTP_201_CREATED)
async def create_rsvp(
    event_id: int,
    rsvp_data: EventRSVPCreate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    event = db.query(Event).filter(
        Event.id == event_id,
        Event.institution_id == current_user.institution_id
    ).first()
    
    if not event:
        raise HTTPException(status_code=404, detail="Event not found")
    
    # Check if RSVP already exists
    existing = db.query(EventRSVP).filter(
        EventRSVP.event_id == event_id,
        EventRSVP.user_id == current_user.id
    ).first()
    
    if existing:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="RSVP already exists"
        )

    rsvp = EventRSVP(
        event_id=event_id,
        user_id=current_user.id,
        **rsvp_data.model_dump()
    )
    db.add(rsvp)
    db.commit()
    db.refresh(rsvp)
    return rsvp


@router.get("/{event_id}/rsvps", response_model=List[EventRSVPWithUser])
async def list_event_rsvps(
    event_id: int,
    status_filter: Optional[str] = Query(None, alias="status"),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    event = db.query(Event).filter(
        Event.id == event_id,
        Event.institution_id == current_user.institution_id
    ).first()
    
    if not event:
        raise HTTPException(status_code=404, detail="Event not found")
    
    query = db.query(EventRSVP, User).join(User).filter(EventRSVP.event_id == event_id)
    
    if status_filter:
        query = query.filter(EventRSVP.status == status_filter)
    
    results = query.all()
    
    rsvps = []
    for rsvp, user in results:
        rsvp_dict = {
            **rsvp.__dict__,
            "user_name": f"{user.first_name} {user.last_name}",
            "user_email": user.email
        }
        rsvps.append(EventRSVPWithUser(**rsvp_dict))
    
    return rsvps


@router.put("/{event_id}/rsvp", response_model=EventRSVPResponse)
async def update_my_rsvp(
    event_id: int,
    update_data: EventRSVPUpdate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    rsvp = db.query(EventRSVP).filter(
        EventRSVP.event_id == event_id,
        EventRSVP.user_id == current_user.id
    ).first()
    
    if not rsvp:
        raise HTTPException(status_code=404, detail="RSVP not found")
    
    for field, value in update_data.model_dump(exclude_unset=True).items():
        setattr(rsvp, field, value)
    
    if update_data.status:
        rsvp.response_date = datetime.utcnow()
    
    db.commit()
    db.refresh(rsvp)
    return rsvp


# Photos
@router.post("/{event_id}/photos", response_model=EventPhotoResponse, status_code=status.HTTP_201_CREATED)
async def add_event_photo(
    event_id: int,
    photo_data: EventPhotoCreate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    event = db.query(Event).filter(
        Event.id == event_id,
        Event.institution_id == current_user.institution_id
    ).first()
    
    if not event:
        raise HTTPException(status_code=404, detail="Event not found")

    photo = EventPhoto(**photo_data.model_dump(), uploaded_by=current_user.id)
    db.add(photo)
    db.commit()
    db.refresh(photo)
    return photo


@router.get("/{event_id}/photos", response_model=List[EventPhotoResponse])
async def list_event_photos(
    event_id: int,
    is_active: Optional[bool] = Query(True),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    event = db.query(Event).filter(
        Event.id == event_id,
        Event.institution_id == current_user.institution_id
    ).first()
    
    if not event:
        raise HTTPException(status_code=404, detail="Event not found")
    
    query = db.query(EventPhoto).filter(EventPhoto.event_id == event_id)
    
    if is_active is not None:
        query = query.filter(EventPhoto.is_active == is_active)
    
    photos = query.order_by(EventPhoto.display_order, EventPhoto.uploaded_at.desc()).all()
    
    return photos


@router.put("/photos/{photo_id}", response_model=EventPhotoResponse)
async def update_event_photo(
    photo_id: int,
    update_data: EventPhotoUpdate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    photo = db.query(EventPhoto).join(Event).filter(
        EventPhoto.id == photo_id,
        Event.institution_id == current_user.institution_id
    ).first()
    
    if not photo:
        raise HTTPException(status_code=404, detail="Photo not found")
    
    for field, value in update_data.model_dump(exclude_unset=True).items():
        setattr(photo, field, value)
    
    db.commit()
    db.refresh(photo)
    return photo


@router.delete("/photos/{photo_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_event_photo(
    photo_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    photo = db.query(EventPhoto).join(Event).filter(
        EventPhoto.id == photo_id,
        Event.institution_id == current_user.institution_id
    ).first()
    
    if not photo:
        raise HTTPException(status_code=404, detail="Photo not found")
    
    db.delete(photo)
    db.commit()
    return None
