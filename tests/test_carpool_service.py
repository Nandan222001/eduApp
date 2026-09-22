import pytest
from datetime import date, time, datetime, timedelta
from decimal import Decimal
from sqlalchemy.orm import Session

from src.services.carpool_service import CarpoolService
from src.models.carpools import (
    CarpoolGroup,
    CarpoolRequest,
    CarpoolRide,
    EmergencyNotification,
    CarpoolMatch,
    CarpoolRequestType,
    CarpoolRequestStatus,
    RideStatus
)
from src.models.student import Parent, Student


class TestCarpoolService:
    
    def test_calculate_distance(self, db_session: Session):
        service = CarpoolService(db_session)
        
        lat1 = Decimal("40.7128")
        lon1 = Decimal("-74.0060")
        lat2 = Decimal("40.7580")
        lon2 = Decimal("-73.9855")
        
        distance = service.calculate_distance(lat1, lon1, lat2, lon2)
        
        assert distance is not None
        assert distance > 0
        assert distance < 10
    
    def test_calculate_time_difference(self, db_session: Session):
        service = CarpoolService(db_session)
        
        time1 = time(7, 30)
        time2 = time(7, 45)
        
        diff = service.calculate_time_difference(time1, time2)
        
        assert diff == 15
    
    def test_calculate_route_compatibility_requests(self, db_session: Session, sample_requests):
        service = CarpoolService(db_session)
        request1, request2 = sample_requests
        
        score, details = service.calculate_route_compatibility(request1, request2=request2)
        
        assert score > 0
        assert 'distance_km' in details
        assert 'time_compatible' in details
        assert 'schedule_compatible' in details
    
    def test_calculate_route_compatibility_group(self, db_session: Session, sample_request, sample_group):
        service = CarpoolService(db_session)
        
        score, details = service.calculate_route_compatibility(sample_request, group=sample_group)
        
        assert score > 0
        assert 'closest_distance_km' in details
        assert 'has_capacity' in details
        assert 'group_active' in details
    
    def test_find_compatible_carpools(self, db_session: Session, institution, sample_group):
        service = CarpoolService(db_session)

        other_parent = Parent(
            institution_id=institution.id,
            first_name="Jane",
            last_name="Smith",
            email="jane.smith@example.com",
            phone="+1234567891"
        )
        db_session.add(other_parent)
        db_session.commit()

        other_request = CarpoolRequest(
            institution_id=institution.id,
            parent_id=other_parent.id,
            request_type=CarpoolRequestType.SEEKING.value,
            student_ids=[3],
            route={
                "start_address": "123 Main St",
                "start_latitude": 40.7128,
                "start_longitude": -74.0060,
                "end_address": "School",
                "end_latitude": 40.7300,
                "end_longitude": -74.0200
            },
            schedule_days=["monday", "wednesday", "friday"],
            departure_time=time(7, 30),
            matching_criteria={
                "max_distance_km": 5,
                "preferred_departure_time_window": 15
            }
        )
        db_session.add(other_request)
        db_session.add(sample_group)
        db_session.commit()

        matches = service.find_compatible_carpools(
            other_request.id,
            max_results=10,
            include_groups=True,
            include_requests=False
        )
        
        assert isinstance(matches, list)
        assert len(matches) > 0
        assert all(isinstance(m, CarpoolMatch) for m in matches)
    
    def test_rotate_driver(self, db_session: Session, sample_group, sample_parent):
        service = CarpoolService(db_session)
        db_session.add(sample_group)
        db_session.add(sample_parent)
        db_session.commit()
        
        new_week = date.today() + timedelta(days=7)
        
        group = service.rotate_driver(
            sample_group.id,
            sample_parent.id,
            new_week
        )
        
        assert group.active_driver_parent_id == sample_parent.id
        assert group.current_week_start == new_week
    
    def test_create_ride_schedule(self, db_session: Session, sample_group):
        service = CarpoolService(db_session)
        db_session.add(sample_group)
        db_session.commit()
        
        start_date = date.today()
        end_date = start_date + timedelta(days=7)
        
        rides = service.create_ride_schedule(
            sample_group.id,
            start_date,
            end_date
        )
        
        assert isinstance(rides, list)
        assert len(rides) > 0
        assert all(isinstance(r, CarpoolRide) for r in rides)
    
    def test_confirm_ride(self, db_session: Session, sample_ride, sample_parent):
        service = CarpoolService(db_session)
        db_session.add(sample_ride)
        db_session.add(sample_parent)
        db_session.commit()
        
        ride = service.confirm_ride(
            sample_ride.id,
            sample_parent.id,
            True,
            "Will be ready"
        )
        
        assert ride.confirmations is not None
        assert str(sample_parent.id) in ride.confirmations
        assert ride.confirmations[str(sample_parent.id)]['confirmed'] is True
    
    def test_create_emergency_notification(self, db_session: Session, sample_ride, sample_parent):
        service = CarpoolService(db_session)
        db_session.add(sample_ride)
        db_session.add(sample_parent)
        db_session.commit()
        
        emergency = service.create_emergency_notification(
            sample_ride.id,
            sample_parent.id,
            "delay",
            "medium",
            "Traffic delay on highway",
            {"latitude": 40.7128, "longitude": -74.0060},
            15
        )
        
        assert emergency.ride_id == sample_ride.id
        assert emergency.reporter_parent_id == sample_parent.id
        assert emergency.emergency_type == "delay"
        assert emergency.estimated_delay == 15
    
    def test_add_member_to_group(self, db_session: Session, sample_group, sample_parent):
        service = CarpoolService(db_session)
        db_session.add(sample_group)
        db_session.add(sample_parent)
        db_session.commit()
        
        students = [
            {
                "student_id": 1,
                "student_name": "Test Student",
                "grade": "5th"
            }
        ]
        
        group = service.add_member_to_group(
            sample_group.id,
            sample_parent.id,
            students
        )
        
        assert len(group.members) > 0
        assert any(m['parent_id'] == sample_parent.id for m in group.members)


@pytest.fixture
def sample_parent(db_session: Session, institution):
    parent = Parent(
        id=1,
        institution_id=institution.id,
        first_name="John",
        last_name="Doe",
        email="john@example.com",
        phone="+1234567890"
    )
    db_session.add(parent)
    db_session.commit()
    return parent


@pytest.fixture
def sample_request(db_session: Session, institution, sample_parent):
    request = CarpoolRequest(
        institution_id=institution.id,
        parent_id=sample_parent.id,
        request_type=CarpoolRequestType.SEEKING.value,
        student_ids=[1, 2],
        route={
            "start_address": "123 Main St",
            "start_latitude": 40.7128,
            "start_longitude": -74.0060,
            "end_address": "School",
            "end_latitude": 40.7300,
            "end_longitude": -74.0200
        },
        schedule_days=["monday", "wednesday", "friday"],
        departure_time=time(7, 30),
        matching_criteria={
            "max_distance_km": 5,
            "preferred_departure_time_window": 15
        }
    )
    db_session.add(request)
    db_session.commit()
    return request


@pytest.fixture
def sample_requests(db_session: Session, institution, sample_parent):
    request1 = CarpoolRequest(
        institution_id=institution.id,
        parent_id=sample_parent.id,
        request_type=CarpoolRequestType.SEEKING.value,
        student_ids=[1],
        route={
            "start_latitude": 40.7128,
            "start_longitude": -74.0060
        },
        schedule_days=["monday", "wednesday"],
        departure_time=time(7, 30),
        matching_criteria={"max_distance_km": 5}
    )

    request2 = CarpoolRequest(
        institution_id=institution.id,
        parent_id=sample_parent.id,
        request_type=CarpoolRequestType.OFFERING.value,
        student_ids=[2],
        route={
            "start_latitude": 40.7150,
            "start_longitude": -74.0070
        },
        schedule_days=["monday", "wednesday", "friday"],
        departure_time=time(7, 35),
        available_seats=3,
        matching_criteria={"max_distance_km": 5}
    )

    db_session.add(request1)
    db_session.add(request2)
    db_session.commit()
    return request1, request2


@pytest.fixture
def sample_group(db_session: Session, institution, sample_parent):
    group = CarpoolGroup(
        institution_id=institution.id,
        organizer_parent_id=sample_parent.id,
        group_name="Test Carpool",
        members=[
            {
                "parent_id": sample_parent.id,
                "parent_name": "John Doe",
                "phone": "+1234567890",
                "students": [{"student_id": 1, "student_name": "Jane"}]
            }
        ],
        pickup_points=[
            {
                "address": "123 Main St",
                "latitude": 40.7128,
                "longitude": -74.0060,
                "pickup_time": "07:30:00"
            }
        ],
        rotation_schedule={
            "days": ["monday", "wednesday", "friday"],
            "driver_order": [1, 2]
        },
        max_members=8
    )
    db_session.add(group)
    db_session.commit()
    return group


@pytest.fixture
def sample_ride(db_session: Session, sample_group, institution, sample_parent):
    ride = CarpoolRide(
        institution_id=institution.id,
        group_id=sample_group.id,
        driver_parent_id=sample_parent.id,
        ride_date=date.today(),
        ride_type="morning",
        passengers=[
            {
                "student_id": 1,
                "student_name": "Jane Doe",
                "parent_id": 1,
                "parent_name": "John Doe"
            }
        ],
        pickup_sequence=[
            {
                "address": "123 Main St",
                "pickup_time": "07:30:00"
            }
        ],
        pickup_time=time(7, 30),
        drop_time=time(8, 0)
    )
    return ride
