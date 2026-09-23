from typing import Optional, List
from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.orm import Session
from sqlalchemy import and_, or_, desc
from datetime import date, datetime

from src.database import get_db
from src.models.user import User
from src.models.carpools import (
    CarpoolGroup,
    CarpoolRequest,
    CarpoolRide,
    EmergencyNotification,
    CarpoolMatch,
    CarpoolRequestStatus,
    CarpoolGroupStatus,
    RideStatus
)
from src.models.student import Parent
from src.dependencies.auth import get_current_user
from src.schemas.carpool import (
    CarpoolGroupCreate,
    CarpoolGroupUpdate,
    CarpoolGroupResponse,
    CarpoolRequestCreate,
    CarpoolRequestUpdate,
    CarpoolRequestResponse,
    CarpoolRideCreate,
    CarpoolRideUpdate,
    CarpoolRideResponse,
    EmergencyNotificationCreate,
    EmergencyNotificationUpdate,
    EmergencyNotificationResponse,
    CarpoolMatchResponse,
    RideConfirmationRequest,
    DriverRotationUpdate,
    RouteMatchRequest,
    RouteMatchResponse
)
from src.services.carpool_service import CarpoolService

router = APIRouter()


@router.post("/groups", response_model=CarpoolGroupResponse, status_code=status.HTTP_201_CREATED)
async def create_carpool_group(
    group_data: CarpoolGroupCreate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    if current_user.institution_id != group_data.institution_id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Not authorized"
        )
    
    parent = db.query(Parent).filter(
        and_(
            Parent.id == group_data.organizer_parent_id,
            Parent.institution_id == group_data.institution_id
        )
    ).first()
    
    if not parent:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Parent not found"
        )
    
    group = CarpoolGroup(**group_data.model_dump())
    db.add(group)
    db.commit()
    db.refresh(group)
    
    return group


@router.get("/groups", response_model=dict)
async def list_carpool_groups(
    skip: int = Query(0, ge=0),
    limit: int = Query(100, ge=1, le=100),
    status_filter: Optional[str] = Query(None, alias="status"),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    query = db.query(CarpoolGroup).filter(
        CarpoolGroup.institution_id == current_user.institution_id
    )
    
    if status_filter:
        query = query.filter(CarpoolGroup.status == status_filter)
    
    query = query.order_by(desc(CarpoolGroup.created_at))
    
    total = query.count()
    groups = query.offset(skip).limit(limit).all()
    
    return {
        "items": [CarpoolGroupResponse.model_validate(g) for g in groups],
        "total": total,
        "skip": skip,
        "limit": limit
    }


@router.get("/groups/{group_id}", response_model=CarpoolGroupResponse)
async def get_carpool_group(
    group_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    group = db.query(CarpoolGroup).filter(
        and_(
            CarpoolGroup.id == group_id,
            CarpoolGroup.institution_id == current_user.institution_id
        )
    ).first()
    
    if not group:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Carpool group not found"
        )
    
    return group


@router.put("/groups/{group_id}", response_model=CarpoolGroupResponse)
async def update_carpool_group(
    group_id: int,
    update_data: CarpoolGroupUpdate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    group = db.query(CarpoolGroup).filter(
        and_(
            CarpoolGroup.id == group_id,
            CarpoolGroup.institution_id == current_user.institution_id
        )
    ).first()
    
    if not group:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Carpool group not found"
        )
    
    for field, value in update_data.model_dump(exclude_unset=True).items():
        setattr(group, field, value)
    
    db.commit()
    db.refresh(group)
    
    return group


@router.delete("/groups/{group_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_carpool_group(
    group_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    group = db.query(CarpoolGroup).filter(
        and_(
            CarpoolGroup.id == group_id,
            CarpoolGroup.institution_id == current_user.institution_id
        )
    ).first()
    
    if not group:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Carpool group not found"
        )
    
    db.delete(group)
    db.commit()


@router.post("/groups/{group_id}/join", response_model=CarpoolGroupResponse)
async def join_carpool_group(
    group_id: int,
    parent_id: int,
    students: List[dict],
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    service = CarpoolService(db)
    
    try:
        group = service.add_member_to_group(group_id, parent_id, students)
        return group
    except ValueError as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(e)
        )


@router.post("/groups/{group_id}/rotate-driver", response_model=CarpoolGroupResponse)
async def rotate_group_driver(
    group_id: int,
    rotation_data: DriverRotationUpdate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    service = CarpoolService(db)
    
    try:
        group = service.rotate_driver(
            group_id,
            rotation_data.new_driver_parent_id,
            rotation_data.week_start_date
        )
        return group
    except ValueError as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(e)
        )


@router.post("/requests", response_model=CarpoolRequestResponse, status_code=status.HTTP_201_CREATED)
async def create_carpool_request(
    request_data: CarpoolRequestCreate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    if current_user.institution_id != request_data.institution_id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Not authorized"
        )
    
    parent = db.query(Parent).filter(
        and_(
            Parent.id == request_data.parent_id,
            Parent.institution_id == request_data.institution_id
        )
    ).first()
    
    if not parent:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Parent not found"
        )
    
    request = CarpoolRequest(**request_data.model_dump())
    db.add(request)
    db.commit()
    db.refresh(request)
    
    return request


@router.get("/requests", response_model=dict)
async def list_carpool_requests(
    skip: int = Query(0, ge=0),
    limit: int = Query(100, ge=1, le=100),
    request_type: Optional[str] = Query(None),
    status_filter: Optional[str] = Query(None, alias="status"),
    parent_id: Optional[int] = Query(None),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    query = db.query(CarpoolRequest).filter(
        CarpoolRequest.institution_id == current_user.institution_id
    )
    
    if request_type:
        query = query.filter(CarpoolRequest.request_type == request_type)
    
    if status_filter:
        query = query.filter(CarpoolRequest.status == status_filter)
    
    if parent_id:
        query = query.filter(CarpoolRequest.parent_id == parent_id)
    
    query = query.order_by(desc(CarpoolRequest.created_at))
    
    total = query.count()
    requests = query.offset(skip).limit(limit).all()
    
    return {
        "items": [CarpoolRequestResponse.model_validate(r) for r in requests],
        "total": total,
        "skip": skip,
        "limit": limit
    }


@router.get("/requests/{request_id}", response_model=CarpoolRequestResponse)
async def get_carpool_request(
    request_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    request = db.query(CarpoolRequest).filter(
        and_(
            CarpoolRequest.id == request_id,
            CarpoolRequest.institution_id == current_user.institution_id
        )
    ).first()
    
    if not request:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Carpool request not found"
        )
    
    return request


@router.put("/requests/{request_id}", response_model=CarpoolRequestResponse)
async def update_carpool_request(
    request_id: int,
    update_data: CarpoolRequestUpdate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    request = db.query(CarpoolRequest).filter(
        and_(
            CarpoolRequest.id == request_id,
            CarpoolRequest.institution_id == current_user.institution_id
        )
    ).first()
    
    if not request:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Carpool request not found"
        )
    
    for field, value in update_data.model_dump(exclude_unset=True).items():
        setattr(request, field, value)
    
    db.commit()
    db.refresh(request)
    
    return request


@router.delete("/requests/{request_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_carpool_request(
    request_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    request = db.query(CarpoolRequest).filter(
        and_(
            CarpoolRequest.id == request_id,
            CarpoolRequest.institution_id == current_user.institution_id
        )
    ).first()
    
    if not request:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Carpool request not found"
        )
    
    db.delete(request)
    db.commit()


@router.post("/requests/{request_id}/match", response_model=RouteMatchResponse)
async def find_matching_carpools(
    request_id: int,
    match_params: RouteMatchRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    request = db.query(CarpoolRequest).filter(
        and_(
            CarpoolRequest.id == request_id,
            CarpoolRequest.institution_id == current_user.institution_id
        )
    ).first()
    
    if not request:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Carpool request not found"
        )
    
    service = CarpoolService(db)
    
    matches = service.find_compatible_carpools(
        request_id,
        max_results=match_params.max_results,
        include_groups=match_params.include_groups,
        include_requests=match_params.include_requests
    )
    
    return {
        "matches": matches,
        "total_matches": len(matches)
    }


@router.get("/matches/{request_id}", response_model=dict)
async def get_carpool_matches(
    request_id: int,
    skip: int = Query(0, ge=0),
    limit: int = Query(100, ge=1, le=100),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    query = db.query(CarpoolMatch).filter(
        and_(
            CarpoolMatch.request_id == request_id,
            CarpoolMatch.institution_id == current_user.institution_id
        )
    ).order_by(desc(CarpoolMatch.compatibility_score))
    
    total = query.count()
    matches = query.offset(skip).limit(limit).all()
    
    return {
        "items": [CarpoolMatchResponse.model_validate(m) for m in matches],
        "total": total,
        "skip": skip,
        "limit": limit
    }


@router.post("/rides", response_model=CarpoolRideResponse, status_code=status.HTTP_201_CREATED)
async def create_carpool_ride(
    ride_data: CarpoolRideCreate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    if current_user.institution_id != ride_data.institution_id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Not authorized"
        )
    
    group = db.query(CarpoolGroup).filter(
        and_(
            CarpoolGroup.id == ride_data.group_id,
            CarpoolGroup.institution_id == ride_data.institution_id
        )
    ).first()
    
    if not group:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Carpool group not found"
        )
    
    ride = CarpoolRide(**ride_data.model_dump())
    db.add(ride)
    db.commit()
    db.refresh(ride)
    
    return ride


@router.get("/rides", response_model=dict)
async def list_carpool_rides(
    skip: int = Query(0, ge=0),
    limit: int = Query(100, ge=1, le=100),
    group_id: Optional[int] = Query(None),
    driver_parent_id: Optional[int] = Query(None),
    ride_date: Optional[date] = Query(None),
    status_filter: Optional[str] = Query(None, alias="status"),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    query = db.query(CarpoolRide).filter(
        CarpoolRide.institution_id == current_user.institution_id
    )
    
    if group_id:
        query = query.filter(CarpoolRide.group_id == group_id)
    
    if driver_parent_id:
        query = query.filter(CarpoolRide.driver_parent_id == driver_parent_id)
    
    if ride_date:
        query = query.filter(CarpoolRide.ride_date == ride_date)
    
    if status_filter:
        query = query.filter(CarpoolRide.confirmation_status == status_filter)
    
    query = query.order_by(desc(CarpoolRide.ride_date), CarpoolRide.pickup_time)
    
    total = query.count()
    rides = query.offset(skip).limit(limit).all()
    
    return {
        "items": [CarpoolRideResponse.model_validate(r) for r in rides],
        "total": total,
        "skip": skip,
        "limit": limit
    }


@router.get("/rides/{ride_id}", response_model=CarpoolRideResponse)
async def get_carpool_ride(
    ride_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    ride = db.query(CarpoolRide).filter(
        and_(
            CarpoolRide.id == ride_id,
            CarpoolRide.institution_id == current_user.institution_id
        )
    ).first()
    
    if not ride:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Carpool ride not found"
        )
    
    return ride


@router.put("/rides/{ride_id}", response_model=CarpoolRideResponse)
async def update_carpool_ride(
    ride_id: int,
    update_data: CarpoolRideUpdate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    ride = db.query(CarpoolRide).filter(
        and_(
            CarpoolRide.id == ride_id,
            CarpoolRide.institution_id == current_user.institution_id
        )
    ).first()
    
    if not ride:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Carpool ride not found"
        )
    
    for field, value in update_data.model_dump(exclude_unset=True).items():
        setattr(ride, field, value)
    
    db.commit()
    db.refresh(ride)
    
    return ride


@router.delete("/rides/{ride_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_carpool_ride(
    ride_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    ride = db.query(CarpoolRide).filter(
        and_(
            CarpoolRide.id == ride_id,
            CarpoolRide.institution_id == current_user.institution_id
        )
    ).first()
    
    if not ride:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Carpool ride not found"
        )
    
    db.delete(ride)
    db.commit()


@router.post("/rides/{ride_id}/confirm", response_model=CarpoolRideResponse)
async def confirm_ride(
    ride_id: int,
    confirmation_data: RideConfirmationRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    service = CarpoolService(db)
    
    try:
        ride = service.confirm_ride(
            ride_id,
            confirmation_data.parent_id,
            confirmation_data.confirmation,
            confirmation_data.notes
        )
        return ride
    except ValueError as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(e)
        )


@router.post("/groups/{group_id}/schedule", response_model=dict, status_code=status.HTTP_201_CREATED)
async def create_ride_schedule(
    group_id: int,
    start_date: date = Query(...),
    end_date: date = Query(...),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    group = db.query(CarpoolGroup).filter(
        and_(
            CarpoolGroup.id == group_id,
            CarpoolGroup.institution_id == current_user.institution_id
        )
    ).first()
    
    if not group:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Carpool group not found"
        )
    
    service = CarpoolService(db)
    
    rides = service.create_ride_schedule(group_id, start_date, end_date)
    
    return {
        "message": "Ride schedule created successfully",
        "rides_created": len(rides),
        "start_date": start_date,
        "end_date": end_date
    }


@router.post("/emergencies", response_model=EmergencyNotificationResponse, status_code=status.HTTP_201_CREATED)
async def create_emergency_notification(
    emergency_data: EmergencyNotificationCreate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    if current_user.institution_id != emergency_data.institution_id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Not authorized"
        )
    
    service = CarpoolService(db)
    
    try:
        emergency = service.create_emergency_notification(
            emergency_data.ride_id,
            emergency_data.reporter_parent_id,
            emergency_data.emergency_type,
            emergency_data.severity,
            emergency_data.description,
            emergency_data.location,
            emergency_data.estimated_delay
        )
        return emergency
    except ValueError as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(e)
        )


@router.get("/emergencies", response_model=dict)
async def list_emergency_notifications(
    skip: int = Query(0, ge=0),
    limit: int = Query(100, ge=1, le=100),
    ride_id: Optional[int] = Query(None),
    emergency_type: Optional[str] = Query(None),
    resolved: Optional[bool] = Query(None),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    query = db.query(EmergencyNotification).filter(
        EmergencyNotification.institution_id == current_user.institution_id
    )
    
    if ride_id:
        query = query.filter(EmergencyNotification.ride_id == ride_id)
    
    if emergency_type:
        query = query.filter(EmergencyNotification.emergency_type == emergency_type)
    
    if resolved is not None:
        if resolved:
            query = query.filter(EmergencyNotification.resolved_at.isnot(None))
        else:
            query = query.filter(EmergencyNotification.resolved_at.is_(None))
    
    query = query.order_by(desc(EmergencyNotification.created_at))
    
    total = query.count()
    emergencies = query.offset(skip).limit(limit).all()
    
    return {
        "items": [EmergencyNotificationResponse.model_validate(e) for e in emergencies],
        "total": total,
        "skip": skip,
        "limit": limit
    }


@router.get("/emergencies/{emergency_id}", response_model=EmergencyNotificationResponse)
async def get_emergency_notification(
    emergency_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    emergency = db.query(EmergencyNotification).filter(
        and_(
            EmergencyNotification.id == emergency_id,
            EmergencyNotification.institution_id == current_user.institution_id
        )
    ).first()
    
    if not emergency:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Emergency notification not found"
        )
    
    return emergency


@router.put("/emergencies/{emergency_id}", response_model=EmergencyNotificationResponse)
async def update_emergency_notification(
    emergency_id: int,
    update_data: EmergencyNotificationUpdate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    emergency = db.query(EmergencyNotification).filter(
        and_(
            EmergencyNotification.id == emergency_id,
            EmergencyNotification.institution_id == current_user.institution_id
        )
    ).first()
    
    if not emergency:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Emergency notification not found"
        )
    
    for field, value in update_data.model_dump(exclude_unset=True).items():
        setattr(emergency, field, value)
    
    db.commit()
    db.refresh(emergency)
    
    return emergency
