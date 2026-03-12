from typing import Optional, List
from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.orm import Session
from sqlalchemy import and_, or_
from src.database import get_db
from src.models.user import User
from src.models.transport import TransportRoute, RouteStop, StudentTransport
from src.models.student import Student
from src.dependencies.auth import get_current_user
from src.schemas.transport import (
    TransportRouteCreate,
    TransportRouteUpdate,
    TransportRouteResponse,
    TransportRouteWithStops,
    RouteStopCreate,
    RouteStopUpdate,
    RouteStopResponse,
    StudentTransportCreate,
    StudentTransportUpdate,
    StudentTransportResponse,
    StudentTransportWithDetails
)

router = APIRouter()


# Routes
@router.post("/routes", response_model=TransportRouteResponse, status_code=status.HTTP_201_CREATED)
async def create_route(
    route_data: TransportRouteCreate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    if current_user.institution_id != route_data.institution_id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Not authorized"
        )

    route = TransportRoute(**route_data.model_dump())
    db.add(route)
    db.commit()
    db.refresh(route)
    return route


@router.get("/routes", response_model=dict)
async def list_routes(
    skip: int = Query(0, ge=0),
    limit: int = Query(100, ge=1, le=100),
    status_filter: Optional[str] = Query(None, alias="status"),
    vehicle_type: Optional[str] = Query(None),
    is_active: Optional[bool] = Query(None),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    query = db.query(TransportRoute).filter(
        TransportRoute.institution_id == current_user.institution_id
    )
    
    if status_filter:
        query = query.filter(TransportRoute.status == status_filter)
    if vehicle_type:
        query = query.filter(TransportRoute.vehicle_type == vehicle_type)
    if is_active is not None:
        query = query.filter(TransportRoute.is_active == is_active)
    
    total = query.count()
    routes = query.offset(skip).limit(limit).all()
    
    return {
        "items": routes,
        "total": total,
        "skip": skip,
        "limit": limit
    }


@router.get("/routes/{route_id}", response_model=TransportRouteWithStops)
async def get_route(
    route_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    route = db.query(TransportRoute).filter(
        TransportRoute.id == route_id,
        TransportRoute.institution_id == current_user.institution_id
    ).first()
    
    if not route:
        raise HTTPException(status_code=404, detail="Route not found")
    
    return route


@router.put("/routes/{route_id}", response_model=TransportRouteResponse)
async def update_route(
    route_id: int,
    update_data: TransportRouteUpdate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    route = db.query(TransportRoute).filter(
        TransportRoute.id == route_id,
        TransportRoute.institution_id == current_user.institution_id
    ).first()
    
    if not route:
        raise HTTPException(status_code=404, detail="Route not found")
    
    for field, value in update_data.model_dump(exclude_unset=True).items():
        setattr(route, field, value)
    
    db.commit()
    db.refresh(route)
    return route


@router.delete("/routes/{route_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_route(
    route_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    route = db.query(TransportRoute).filter(
        TransportRoute.id == route_id,
        TransportRoute.institution_id == current_user.institution_id
    ).first()
    
    if not route:
        raise HTTPException(status_code=404, detail="Route not found")
    
    db.delete(route)
    db.commit()
    return None


# Route Stops
@router.post("/stops", response_model=RouteStopResponse, status_code=status.HTTP_201_CREATED)
async def create_stop(
    stop_data: RouteStopCreate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    route = db.query(TransportRoute).filter(
        TransportRoute.id == stop_data.route_id,
        TransportRoute.institution_id == current_user.institution_id
    ).first()
    
    if not route:
        raise HTTPException(status_code=404, detail="Route not found")

    stop = RouteStop(**stop_data.model_dump())
    db.add(stop)
    db.commit()
    db.refresh(stop)
    return stop


@router.get("/routes/{route_id}/stops", response_model=List[RouteStopResponse])
async def list_route_stops(
    route_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    route = db.query(TransportRoute).filter(
        TransportRoute.id == route_id,
        TransportRoute.institution_id == current_user.institution_id
    ).first()
    
    if not route:
        raise HTTPException(status_code=404, detail="Route not found")
    
    stops = db.query(RouteStop).filter(
        RouteStop.route_id == route_id,
        RouteStop.is_active == True
    ).order_by(RouteStop.stop_order).all()
    
    return stops


@router.put("/stops/{stop_id}", response_model=RouteStopResponse)
async def update_stop(
    stop_id: int,
    update_data: RouteStopUpdate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    stop = db.query(RouteStop).join(TransportRoute).filter(
        RouteStop.id == stop_id,
        TransportRoute.institution_id == current_user.institution_id
    ).first()
    
    if not stop:
        raise HTTPException(status_code=404, detail="Stop not found")
    
    for field, value in update_data.model_dump(exclude_unset=True).items():
        setattr(stop, field, value)
    
    db.commit()
    db.refresh(stop)
    return stop


# Student Transport Assignment
@router.post("/student-assignments", response_model=StudentTransportResponse, status_code=status.HTTP_201_CREATED)
async def assign_student_to_route(
    assignment_data: StudentTransportCreate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    if current_user.institution_id != assignment_data.institution_id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Not authorized"
        )

    # Check if student is already assigned
    existing = db.query(StudentTransport).filter(
        StudentTransport.student_id == assignment_data.student_id,
        StudentTransport.is_active == True
    ).first()
    
    if existing:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Student already assigned to a route"
        )

    assignment = StudentTransport(**assignment_data.model_dump())
    db.add(assignment)
    db.commit()
    db.refresh(assignment)
    return assignment


@router.get("/student-assignments", response_model=dict)
async def list_student_assignments(
    skip: int = Query(0, ge=0),
    limit: int = Query(100, ge=1, le=100),
    route_id: Optional[int] = Query(None),
    student_id: Optional[int] = Query(None),
    is_active: Optional[bool] = Query(None),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    query = db.query(StudentTransport).filter(
        StudentTransport.institution_id == current_user.institution_id
    )
    
    if route_id:
        query = query.filter(StudentTransport.route_id == route_id)
    if student_id:
        query = query.filter(StudentTransport.student_id == student_id)
    if is_active is not None:
        query = query.filter(StudentTransport.is_active == is_active)
    
    total = query.count()
    assignments = query.offset(skip).limit(limit).all()
    
    return {
        "items": assignments,
        "total": total,
        "skip": skip,
        "limit": limit
    }


@router.get("/student-assignments/{assignment_id}", response_model=StudentTransportResponse)
async def get_student_assignment(
    assignment_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    assignment = db.query(StudentTransport).filter(
        StudentTransport.id == assignment_id,
        StudentTransport.institution_id == current_user.institution_id
    ).first()
    
    if not assignment:
        raise HTTPException(status_code=404, detail="Assignment not found")
    
    return assignment


@router.put("/student-assignments/{assignment_id}", response_model=StudentTransportResponse)
async def update_student_assignment(
    assignment_id: int,
    update_data: StudentTransportUpdate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    assignment = db.query(StudentTransport).filter(
        StudentTransport.id == assignment_id,
        StudentTransport.institution_id == current_user.institution_id
    ).first()
    
    if not assignment:
        raise HTTPException(status_code=404, detail="Assignment not found")
    
    for field, value in update_data.model_dump(exclude_unset=True).items():
        setattr(assignment, field, value)
    
    db.commit()
    db.refresh(assignment)
    return assignment


@router.delete("/student-assignments/{assignment_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_student_assignment(
    assignment_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    assignment = db.query(StudentTransport).filter(
        StudentTransport.id == assignment_id,
        StudentTransport.institution_id == current_user.institution_id
    ).first()
    
    if not assignment:
        raise HTTPException(status_code=404, detail="Assignment not found")
    
    db.delete(assignment)
    db.commit()
    return None
