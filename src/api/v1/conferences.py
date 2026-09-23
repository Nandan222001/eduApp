from typing import Optional, List
from fastapi import APIRouter, Depends, HTTPException, status, Query, UploadFile, File
from sqlalchemy.orm import Session
from datetime import date

from src.database import get_db
from src.models.user import User
from src.models.conferences import AvailabilityStatus, BookingStatus, LocationType
from src.dependencies.auth import get_current_user
from src.schemas.conference import (
    ConferenceSlotCreate,
    ConferenceSlotUpdate,
    ConferenceSlotResponse,
    ConferenceSlotWithBookingsResponse,
    ConferenceBookingCreate,
    ConferenceBookingUpdate,
    ConferenceBookingResponse,
    ConferenceBookingWithSlotResponse,
    ConferenceSurveyCreate,
    ConferenceSurveyUpdate,
    ConferenceSurveyResponse,
    ConferenceCheckInRequest,
    ConferenceRecordingUpload,
    BulkSlotCreate,
    ConferenceStatistics,
    TeacherConferenceStats
)
from src.services.conference_service import (
    ConferenceSlotService,
    ConferenceBookingService,
    ConferenceSurveyService,
    ConferenceAnalyticsService,
    PTMSpeedDatingService
)

router = APIRouter()


@router.post("/slots", response_model=ConferenceSlotResponse, status_code=status.HTTP_201_CREATED)
async def create_conference_slot(
    slot_data: ConferenceSlotCreate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    if current_user.institution_id != slot_data.institution_id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Not authorized to create slot for this institution"
        )

    service = ConferenceSlotService(db)
    slot = service.create_slot(slot_data)
    return slot


@router.post("/slots/bulk", response_model=List[ConferenceSlotResponse], status_code=status.HTTP_201_CREATED)
async def create_bulk_conference_slots(
    bulk_data: BulkSlotCreate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    if current_user.institution_id != bulk_data.institution_id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Not authorized to create slots for this institution"
        )

    service = ConferenceSlotService(db)
    slots = service.create_bulk_slots(bulk_data)
    return slots


@router.get("/slots", response_model=dict)
async def list_conference_slots(
    skip: int = Query(0, ge=0),
    limit: int = Query(100, ge=1, le=100),
    teacher_id: Optional[int] = Query(None),
    date_from: Optional[date] = Query(None),
    date_to: Optional[date] = Query(None),
    location: Optional[LocationType] = Query(None),
    availability_status: Optional[AvailabilityStatus] = Query(None),
    is_active: Optional[bool] = Query(None),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    service = ConferenceSlotService(db)
    slots, total = service.list_slots(
        institution_id=current_user.institution_id,
        skip=skip,
        limit=limit,
        teacher_id=teacher_id,
        date_from=date_from,
        date_to=date_to,
        location=location.value if location else None,
        availability_status=availability_status,
        is_active=is_active
    )
    return {
        "items": [ConferenceSlotResponse.model_validate(s) for s in slots],
        "total": total,
        "skip": skip,
        "limit": limit,
    }


@router.get("/slots/available", response_model=List[ConferenceSlotResponse])
async def get_available_slots(
    date_from: date = Query(...),
    date_to: date = Query(...),
    teacher_id: Optional[int] = Query(None),
    min_duration: Optional[int] = Query(None),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    service = ConferenceSlotService(db)
    slots = service.get_available_slots(
        institution_id=current_user.institution_id,
        date_from=date_from,
        date_to=date_to,
        teacher_id=teacher_id,
        min_duration=min_duration
    )
    return slots


@router.get("/slots/{slot_id}", response_model=ConferenceSlotWithBookingsResponse)
async def get_conference_slot(
    slot_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    service = ConferenceSlotService(db)
    slot = service.get_slot_with_bookings(slot_id)

    if not slot:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Conference slot not found"
        )

    if slot.institution_id != current_user.institution_id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Not authorized to access this slot"
        )

    return slot


@router.put("/slots/{slot_id}", response_model=ConferenceSlotResponse)
async def update_conference_slot(
    slot_id: int,
    slot_data: ConferenceSlotUpdate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    service = ConferenceSlotService(db)
    slot = service.get_slot(slot_id)

    if not slot:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Conference slot not found"
        )

    if slot.institution_id != current_user.institution_id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Not authorized to update this slot"
        )

    updated_slot = service.update_slot(slot_id, slot_data)
    return updated_slot


@router.delete("/slots/{slot_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_conference_slot(
    slot_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    service = ConferenceSlotService(db)
    slot = service.get_slot(slot_id)

    if not slot:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Conference slot not found"
        )

    if slot.institution_id != current_user.institution_id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Not authorized to delete this slot"
        )

    service.delete_slot(slot_id)


@router.post("/bookings", response_model=ConferenceBookingResponse, status_code=status.HTTP_201_CREATED)
async def create_conference_booking(
    booking_data: ConferenceBookingCreate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    if current_user.institution_id != booking_data.institution_id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Not authorized to create booking for this institution"
        )

    service = ConferenceBookingService(db)
    booking = service.create_booking(booking_data)
    return booking


@router.get("/bookings", response_model=dict)
async def list_conference_bookings(
    skip: int = Query(0, ge=0),
    limit: int = Query(100, ge=1, le=100),
    booking_status: Optional[BookingStatus] = Query(None),
    teacher_id: Optional[int] = Query(None),
    parent_id: Optional[int] = Query(None),
    student_id: Optional[int] = Query(None),
    date_from: Optional[date] = Query(None),
    date_to: Optional[date] = Query(None),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    service = ConferenceBookingService(db)
    bookings, total = service.list_bookings(
        institution_id=current_user.institution_id,
        skip=skip,
        limit=limit,
        booking_status=booking_status,
        teacher_id=teacher_id,
        parent_id=parent_id,
        student_id=student_id,
        date_from=date_from,
        date_to=date_to
    )
    return {
        "items": [ConferenceBookingResponse.model_validate(b) for b in bookings],
        "total": total,
        "skip": skip,
        "limit": limit,
    }


@router.get("/bookings/my", response_model=List[ConferenceBookingWithSlotResponse])
async def get_my_bookings(
    skip: int = Query(0, ge=0),
    limit: int = Query(100, ge=1, le=100),
    booking_status: Optional[BookingStatus] = Query(None),
    date_from: Optional[date] = Query(None),
    date_to: Optional[date] = Query(None),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    if not hasattr(current_user, 'parent_profile') or not current_user.parent_profile:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Only parents can access this endpoint"
        )

    from src.repositories.parent_repository import ParentRepository
    parent_repo = ParentRepository(db)
    parent = parent_repo.get_by_user_id(current_user.id, current_user.institution_id)

    if not parent:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Parent profile not found"
        )

    service = ConferenceBookingService(db)
    bookings = service.list_parent_bookings(
        parent_id=parent.id,
        skip=skip,
        limit=limit,
        booking_status=booking_status,
        date_from=date_from,
        date_to=date_to
    )
    return bookings


@router.get("/bookings/{booking_id}", response_model=ConferenceBookingWithSlotResponse)
async def get_conference_booking(
    booking_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    service = ConferenceBookingService(db)
    booking = service.get_booking_with_slot(booking_id)

    if not booking:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Conference booking not found"
        )

    if booking.institution_id != current_user.institution_id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Not authorized to access this booking"
        )

    return booking


@router.put("/bookings/{booking_id}", response_model=ConferenceBookingResponse)
async def update_conference_booking(
    booking_id: int,
    booking_data: ConferenceBookingUpdate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    service = ConferenceBookingService(db)
    booking = service.get_booking(booking_id)

    if not booking:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Conference booking not found"
        )

    if booking.institution_id != current_user.institution_id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Not authorized to update this booking"
        )

    updated_booking = service.update_booking(booking_id, booking_data)
    return updated_booking


@router.post("/bookings/{booking_id}/cancel", response_model=ConferenceBookingResponse)
async def cancel_conference_booking(
    booking_id: int,
    cancellation_reason: Optional[str] = None,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    service = ConferenceBookingService(db)
    booking = service.get_booking(booking_id)

    if not booking:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Conference booking not found"
        )

    if booking.institution_id != current_user.institution_id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Not authorized to cancel this booking"
        )

    cancelled_booking = service.cancel_booking(booking_id, cancellation_reason)
    return cancelled_booking


@router.post("/bookings/{booking_id}/check-in", response_model=ConferenceBookingResponse)
async def check_in_conference(
    booking_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    service = ConferenceBookingService(db)
    booking = service.get_booking(booking_id)

    if not booking:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Conference booking not found"
        )

    if booking.institution_id != current_user.institution_id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Not authorized to check in to this booking"
        )

    checked_in_booking = service.check_in_booking(booking_id)
    return checked_in_booking


@router.post("/bookings/{booking_id}/complete", response_model=ConferenceBookingResponse)
async def complete_conference(
    booking_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    service = ConferenceBookingService(db)
    booking = service.get_booking(booking_id)

    if not booking:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Conference booking not found"
        )

    if booking.institution_id != current_user.institution_id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Not authorized to complete this booking"
        )

    completed_booking = service.complete_booking(booking_id)
    return completed_booking


@router.post("/bookings/{booking_id}/recording", response_model=ConferenceBookingResponse)
async def upload_conference_recording(
    booking_id: int,
    recording_data: ConferenceRecordingUpload,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    service = ConferenceBookingService(db)
    booking = service.get_booking(booking_id)

    if not booking:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Conference booking not found"
        )

    if booking.institution_id != current_user.institution_id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Not authorized to upload recording for this booking"
        )

    updated_booking = service.upload_recording(
        booking_id=booking_id,
        recording_url=recording_data.recording_url,
        recording_s3_key=recording_data.recording_s3_key
    )
    return updated_booking


@router.post("/bookings/{booking_id}/survey", response_model=ConferenceSurveyResponse, status_code=status.HTTP_201_CREATED)
async def submit_conference_survey(
    booking_id: int,
    survey_data: ConferenceSurveyCreate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    if survey_data.booking_id != booking_id:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Booking ID mismatch"
        )

    booking_service = ConferenceBookingService(db)
    booking = booking_service.get_booking(booking_id)

    if not booking:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Conference booking not found"
        )

    if booking.institution_id != current_user.institution_id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Not authorized to submit survey for this booking"
        )

    survey_service = ConferenceSurveyService(db)
    survey = survey_service.create_or_update_survey(survey_data)
    return survey


@router.get("/bookings/{booking_id}/survey", response_model=ConferenceSurveyResponse)
async def get_conference_survey(
    booking_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    booking_service = ConferenceBookingService(db)
    booking = booking_service.get_booking(booking_id)

    if not booking:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Conference booking not found"
        )

    if booking.institution_id != current_user.institution_id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Not authorized to access survey for this booking"
        )

    survey_service = ConferenceSurveyService(db)
    survey = survey_service.get_survey_by_booking(booking_id)

    if not survey:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Survey not found"
        )

    return survey


@router.get("/statistics", response_model=ConferenceStatistics)
async def get_conference_statistics(
    date_from: Optional[date] = Query(None),
    date_to: Optional[date] = Query(None),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    service = ConferenceAnalyticsService(db)
    statistics = service.get_institution_statistics(
        institution_id=current_user.institution_id,
        date_from=date_from,
        date_to=date_to
    )
    return statistics


@router.get("/statistics/teacher/{teacher_id}", response_model=TeacherConferenceStats)
async def get_teacher_conference_statistics(
    teacher_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    service = ConferenceAnalyticsService(db)
    statistics = service.get_teacher_statistics(teacher_id=teacher_id)
    return statistics


@router.post("/ptm-speed-dating/schedule", response_model=List[ConferenceBookingResponse], status_code=status.HTTP_201_CREATED)
async def schedule_ptm_speed_dating(
    parent_id: int,
    student_id: int,
    target_date: date,
    start_time: str,
    notes: Optional[str] = None,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """
    Schedule PTM Speed Dating - auto-creates 5-minute sequential slots with all teachers
    """
    from datetime import time as dt_time
    
    # Parse time string (format: "HH:MM")
    try:
        hour, minute = map(int, start_time.split(':'))
        start_time_obj = dt_time(hour=hour, minute=minute)
    except:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid time format. Use HH:MM format (e.g., '14:30')"
        )
    
    service = PTMSpeedDatingService(db)
    
    try:
        bookings = service.generate_ptm_speed_schedule(
            parent_id=parent_id,
            student_id=student_id,
            institution_id=current_user.institution_id,
            target_date=target_date,
            start_time=start_time_obj,
            notes=notes
        )
        
        return bookings
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to schedule PTM speed dating: {str(e)}"
        )


@router.get("/bookings/{booking_id}/talking-points")
async def get_booking_talking_points(
    booking_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Get auto-generated talking points for a speed dating booking"""
    booking_service = ConferenceBookingService(db)
    booking = booking_service.get_booking(booking_id)
    
    if not booking:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Conference booking not found"
        )
    
    if booking.institution_id != current_user.institution_id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Not authorized to access this booking"
        )
    
    if not booking.speed_round:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="This is not a speed dating booking"
        )
    
    return {
        "booking_id": booking.id,
        "speed_round": booking.speed_round,
        "auto_talking_points": booking.auto_talking_points or {}
    }
