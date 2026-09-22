from typing import List, Optional, Dict, Any, Tuple
from datetime import datetime, date, time, timedelta
from sqlalchemy.orm import Session
from sqlalchemy import and_, or_, func
from decimal import Decimal
import math
import logging

from src.models.carpools import (
    CarpoolGroup,
    CarpoolRequest,
    CarpoolRide,
    EmergencyNotification,
    CarpoolMatch,
    CarpoolRequestType,
    CarpoolRequestStatus,
    CarpoolGroupStatus,
    RideStatus
)
from src.models.student import Parent, Student
from src.schemas.carpool import (
    CarpoolGroupCreate,
    CarpoolRequestCreate,
    CarpoolRideCreate,
    EmergencyNotificationCreate,
    RouteMatchRequest
)

logger = logging.getLogger(__name__)


class CarpoolService:
    def __init__(self, db: Session):
        self.db = db

    def calculate_distance(
        self,
        lat1: Optional[Decimal],
        lon1: Optional[Decimal],
        lat2: Optional[Decimal],
        lon2: Optional[Decimal]
    ) -> Optional[float]:
        if not all([lat1, lon1, lat2, lon2]):
            return None
        
        lat1, lon1, lat2, lon2 = float(lat1), float(lon1), float(lat2), float(lon2)
        
        R = 6371
        
        lat1_rad = math.radians(lat1)
        lat2_rad = math.radians(lat2)
        delta_lat = math.radians(lat2 - lat1)
        delta_lon = math.radians(lon2 - lon1)
        
        a = math.sin(delta_lat / 2) ** 2 + math.cos(lat1_rad) * math.cos(lat2_rad) * math.sin(delta_lon / 2) ** 2
        c = 2 * math.asin(math.sqrt(a))
        
        return R * c

    def calculate_time_difference(self, time1: time, time2: time) -> int:
        datetime1 = datetime.combine(date.today(), time1)
        datetime2 = datetime.combine(date.today(), time2)
        diff = abs((datetime1 - datetime2).total_seconds())
        return int(diff / 60)

    def calculate_route_compatibility(
        self,
        request1: CarpoolRequest,
        request2: Optional[CarpoolRequest] = None,
        group: Optional[CarpoolGroup] = None
    ) -> Tuple[float, Dict[str, Any]]:
        score = 0.0
        details = {}
        
        if request2:
            route1 = request1.route
            route2 = request2.route
            
            criteria1 = request1.matching_criteria
            criteria2 = request2.matching_criteria
            
            distance = self.calculate_distance(
                route1.get('start_latitude'),
                route1.get('start_longitude'),
                route2.get('start_latitude'),
                route2.get('start_longitude')
            )
            
            if distance is not None:
                max_dist1 = criteria1.get('max_distance_km', 10)
                max_dist2 = criteria2.get('max_distance_km', 10)
                max_distance = min(max_dist1, max_dist2)
                
                if distance <= max_distance:
                    score += 30 * (1 - (distance / max_distance))
                    details['distance_km'] = round(distance, 2)
                    details['within_range'] = True
                else:
                    details['distance_km'] = round(distance, 2)
                    details['within_range'] = False
                    return 0.0, details
            
            time_diff = self.calculate_time_difference(
                request1.departure_time,
                request2.departure_time
            )
            
            window1 = criteria1.get('preferred_departure_time_window', 30)
            window2 = criteria2.get('preferred_departure_time_window', 30)
            time_window = min(window1, window2)
            
            if time_diff <= time_window:
                score += 25 * (1 - (time_diff / time_window))
                details['time_difference_minutes'] = time_diff
                details['time_compatible'] = True
            else:
                details['time_difference_minutes'] = time_diff
                details['time_compatible'] = False
                return 0.0, details
            
            days1 = set(request1.schedule_days)
            days2 = set(request2.schedule_days)
            common_days = days1.intersection(days2)
            
            if common_days:
                overlap_ratio = len(common_days) / max(len(days1), len(days2))
                score += 20 * overlap_ratio
                details['common_days'] = list(common_days)
                details['schedule_compatible'] = True
            else:
                details['schedule_compatible'] = False
                return 0.0, details
            
            if request1.request_type == CarpoolRequestType.OFFERING.value:
                if request2.request_type == CarpoolRequestType.SEEKING.value:
                    score += 15
                    details['request_type_match'] = 'offering_seeking'
            elif request1.request_type == CarpoolRequestType.SEEKING.value:
                if request2.request_type == CarpoolRequestType.OFFERING.value:
                    score += 15
                    details['request_type_match'] = 'seeking_offering'
            
            if request1.request_type == CarpoolRequestType.OFFERING.value:
                if request1.available_seats and request1.available_seats >= len(request2.student_ids):
                    score += 10
                    details['seats_available'] = True
                else:
                    details['seats_available'] = False
                    score -= 10
            
        elif group:
            route = request1.route
            pickup_points = group.pickup_points
            
            if not pickup_points:
                return 0.0, {'error': 'No pickup points in group'}
            
            min_distance = float('inf')
            closest_point = None
            
            for point in pickup_points:
                distance = self.calculate_distance(
                    route.get('start_latitude'),
                    route.get('start_longitude'),
                    point.get('latitude'),
                    point.get('longitude')
                )
                
                if distance is not None and distance < min_distance:
                    min_distance = distance
                    closest_point = point
            
            criteria = request1.matching_criteria
            max_distance = criteria.get('max_distance_km', 10)
            
            if min_distance <= max_distance:
                score += 30 * (1 - (min_distance / max_distance))
                details['closest_distance_km'] = round(min_distance, 2)
                details['closest_pickup_point'] = closest_point
                details['within_range'] = True
            else:
                details['closest_distance_km'] = round(min_distance, 2)
                details['within_range'] = False
                return 0.0, details
            
            if len(group.members) < group.max_members:
                score += 20
                details['has_capacity'] = True
            else:
                details['has_capacity'] = False
                return 0.0, details
            
            if group.status == CarpoolGroupStatus.ACTIVE.value:
                score += 15
                details['group_active'] = True
            else:
                details['group_active'] = False
                return 0.0, details
            
            details['group_member_count'] = len(group.members)
        
        return round(score, 2), details

    def find_compatible_carpools(
        self,
        request_id: int,
        max_results: int = 10,
        include_groups: bool = True,
        include_requests: bool = True
    ) -> List[CarpoolMatch]:
        request = self.db.query(CarpoolRequest).filter(
            CarpoolRequest.id == request_id
        ).first()
        
        if not request:
            return []
        
        matches = []
        
        if include_requests:
            other_requests = self.db.query(CarpoolRequest).filter(
                and_(
                    CarpoolRequest.institution_id == request.institution_id,
                    CarpoolRequest.id != request_id,
                    CarpoolRequest.status == CarpoolRequestStatus.ACTIVE.value,
                    CarpoolRequest.parent_id != request.parent_id
                )
            ).all()
            
            for other_request in other_requests:
                score, details = self.calculate_route_compatibility(request, request2=other_request)
                
                if score > 0:
                    existing_match = self.db.query(CarpoolMatch).filter(
                        and_(
                            CarpoolMatch.request_id == request_id,
                            CarpoolMatch.matched_request_id == other_request.id
                        )
                    ).first()
                    
                    if not existing_match:
                        match = CarpoolMatch(
                            institution_id=request.institution_id,
                            request_id=request_id,
                            matched_request_id=other_request.id,
                            compatibility_score=score,
                            match_details=details,
                            status='pending'
                        )
                        matches.append(match)
        
        if include_groups:
            groups = self.db.query(CarpoolGroup).filter(
                and_(
                    CarpoolGroup.institution_id == request.institution_id,
                    CarpoolGroup.status == CarpoolGroupStatus.ACTIVE.value
                )
            ).all()
            
            for group in groups:
                if request.parent_id in [m.get('parent_id') for m in group.members]:
                    continue
                
                score, details = self.calculate_route_compatibility(request, group=group)
                
                if score > 0:
                    existing_match = self.db.query(CarpoolMatch).filter(
                        and_(
                            CarpoolMatch.request_id == request_id,
                            CarpoolMatch.matched_group_id == group.id
                        )
                    ).first()
                    
                    if not existing_match:
                        match = CarpoolMatch(
                            institution_id=request.institution_id,
                            request_id=request_id,
                            matched_group_id=group.id,
                            compatibility_score=score,
                            match_details=details,
                            status='pending'
                        )
                        matches.append(match)
        
        matches.sort(key=lambda x: x.compatibility_score, reverse=True)
        
        for match in matches[:max_results]:
            self.db.add(match)
        
        self.db.commit()
        
        return matches[:max_results]

    def rotate_driver(
        self,
        group_id: int,
        new_driver_parent_id: int,
        week_start_date: date
    ) -> CarpoolGroup:
        group = self.db.query(CarpoolGroup).filter(
            CarpoolGroup.id == group_id
        ).first()
        
        if not group:
            raise ValueError("Group not found")
        
        member_ids = [m.get('parent_id') for m in group.members]
        if new_driver_parent_id not in member_ids:
            raise ValueError("Driver must be a member of the group")
        
        group.active_driver_parent_id = new_driver_parent_id
        group.current_week_start = week_start_date
        
        rotation = group.rotation_schedule
        if isinstance(rotation, dict):
            rotation['history'] = rotation.get('history', [])
            rotation['history'].append({
                'parent_id': new_driver_parent_id,
                'week_start': week_start_date.isoformat(),
                'updated_at': datetime.utcnow().isoformat()
            })
            group.rotation_schedule = rotation
        
        self.db.commit()
        self.db.refresh(group)
        
        return group

    def create_ride_schedule(
        self,
        group_id: int,
        start_date: date,
        end_date: date
    ) -> List[CarpoolRide]:
        group = self.db.query(CarpoolGroup).filter(
            CarpoolGroup.id == group_id
        ).first()
        
        if not group:
            raise ValueError("Group not found")
        
        rides = []
        current_date = start_date
        
        while current_date <= end_date:
            day_name = current_date.strftime('%A')
            
            rotation = group.rotation_schedule
            if isinstance(rotation, dict) and day_name.lower() in [d.lower() for d in rotation.get('days', [])]:
                passengers = []
                for member in group.members:
                    for student in member.get('students', []):
                        passengers.append({
                            'student_id': student.get('student_id'),
                            'student_name': student.get('student_name'),
                            'parent_id': member.get('parent_id'),
                            'parent_name': member.get('parent_name')
                        })
                
                pickup_sequence = group.pickup_points
                
                morning_ride = CarpoolRide(
                    institution_id=group.institution_id,
                    group_id=group_id,
                    driver_parent_id=group.active_driver_parent_id or group.organizer_parent_id,
                    ride_date=current_date,
                    ride_type='morning',
                    passengers=passengers,
                    pickup_sequence=pickup_sequence,
                    pickup_time=pickup_sequence[0].get('pickup_time') if pickup_sequence else time(7, 0),
                    drop_time=pickup_sequence[-1].get('pickup_time') if pickup_sequence else time(8, 0),
                    confirmation_status=RideStatus.SCHEDULED.value
                )
                rides.append(morning_ride)
                self.db.add(morning_ride)
                
                afternoon_ride = CarpoolRide(
                    institution_id=group.institution_id,
                    group_id=group_id,
                    driver_parent_id=group.active_driver_parent_id or group.organizer_parent_id,
                    ride_date=current_date,
                    ride_type='afternoon',
                    passengers=passengers,
                    pickup_sequence=list(reversed(pickup_sequence)),
                    pickup_time=pickup_sequence[-1].get('drop_time') or pickup_sequence[-1].get('pickup_time') if pickup_sequence else time(14, 0),
                    drop_time=pickup_sequence[0].get('drop_time') or pickup_sequence[0].get('pickup_time') if pickup_sequence else time(15, 0),
                    confirmation_status=RideStatus.SCHEDULED.value
                )
                rides.append(afternoon_ride)
                self.db.add(afternoon_ride)
            
            current_date += timedelta(days=1)
        
        self.db.commit()
        
        return rides

    def confirm_ride(
        self,
        ride_id: int,
        parent_id: int,
        confirmation: bool,
        notes: Optional[str] = None
    ) -> CarpoolRide:
        ride = self.db.query(CarpoolRide).filter(
            CarpoolRide.id == ride_id
        ).first()
        
        if not ride:
            raise ValueError("Ride not found")
        
        confirmations = ride.confirmations or {}
        confirmations[str(parent_id)] = {
            'confirmed': confirmation,
            'confirmed_at': datetime.utcnow().isoformat(),
            'notes': notes
        }
        ride.confirmations = confirmations
        
        all_confirmed = all(c.get('confirmed', False) for c in confirmations.values())
        
        if all_confirmed and len(confirmations) >= len([p for p in ride.passengers]):
            ride.confirmation_status = RideStatus.CONFIRMED.value
        
        self.db.commit()
        self.db.refresh(ride)
        
        return ride

    def create_emergency_notification(
        self,
        ride_id: int,
        reporter_parent_id: int,
        emergency_type: str,
        severity: str,
        description: str,
        location: Optional[Dict[str, Any]] = None,
        estimated_delay: Optional[int] = None
    ) -> EmergencyNotification:
        ride = self.db.query(CarpoolRide).filter(
            CarpoolRide.id == ride_id
        ).first()
        
        if not ride:
            raise ValueError("Ride not found")
        
        group = self.db.query(CarpoolGroup).filter(
            CarpoolGroup.id == ride.group_id
        ).first()
        
        notified_parents = [m.get('parent_id') for m in group.members if m.get('parent_id') != reporter_parent_id]
        
        emergency = EmergencyNotification(
            institution_id=ride.institution_id,
            ride_id=ride_id,
            reporter_parent_id=reporter_parent_id,
            emergency_type=emergency_type,
            severity=severity,
            description=description,
            location=location,
            estimated_delay=estimated_delay,
            notified_parents=notified_parents
        )
        
        self.db.add(emergency)
        self.db.commit()
        self.db.refresh(emergency)
        
        return emergency

    def add_member_to_group(
        self,
        group_id: int,
        parent_id: int,
        students: List[Dict[str, Any]]
    ) -> CarpoolGroup:
        group = self.db.query(CarpoolGroup).filter(
            CarpoolGroup.id == group_id
        ).first()
        
        if not group:
            raise ValueError("Group not found")
        
        if len(group.members) >= group.max_members:
            raise ValueError("Group is full")
        
        parent = self.db.query(Parent).filter(
            Parent.id == parent_id
        ).first()
        
        if not parent:
            raise ValueError("Parent not found")
        
        members = group.members
        members.append({
            'parent_id': parent_id,
            'parent_name': f"{parent.first_name} {parent.last_name}",
            'phone': parent.phone,
            'students': students,
            'joined_at': datetime.utcnow().isoformat()
        })
        
        group.members = members
        self.db.commit()
        self.db.refresh(group)
        
        return group
