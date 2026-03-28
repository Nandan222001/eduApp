# Carpool Coordination Platform

## Overview

The Carpool Coordination Platform enables parents to create, join, and manage carpooling groups for their students. It includes intelligent route matching, driver rotation scheduling, ride confirmation, and emergency notification features.

## Features

### 1. Carpool Groups
- Create and manage carpool groups with multiple families
- Configure pickup points with addresses and times
- Set up driver rotation schedules
- Manage group members and students
- Integrated group chat support

### 2. Carpool Requests
- Parents can create requests to seek or offer carpools
- Define routes with start/end locations and waypoints
- Specify schedule (days of week) and departure times
- Set matching criteria (distance, time windows, etc.)
- Track available seats for offering rides

### 3. Route Matching Algorithm
- Intelligent compatibility scoring based on:
  - Geographic proximity (distance between pickup points)
  - Time compatibility (departure time alignment)
  - Schedule overlap (common days)
  - Request type matching (seeking vs offering)
  - Seat availability
- Configurable matching criteria per request
- Support for both request-to-request and request-to-group matching

### 4. Ride Management
- Individual ride tracking with driver and passengers
- Pickup sequence with multiple stops
- Ride confirmation by all participating parents
- Track actual vs scheduled pickup/drop times
- Support for morning and afternoon rides

### 5. Driver Rotation
- Automated driver rotation based on schedule
- Track rotation history
- Update active driver for current week
- Notify group members of driver changes

### 6. Emergency Notifications
- Report emergencies during rides (breakdown, delay, etc.)
- Automatically notify all group members
- Track emergency severity and type
- Record resolution and estimated delays
- Location tracking for emergency situations

## API Endpoints

### Carpool Groups

#### Create Carpool Group
```http
POST /api/v1/carpools/groups
```

**Request Body:**
```json
{
  "institution_id": 1,
  "organizer_parent_id": 5,
  "group_name": "Morning School Carpool",
  "members": [
    {
      "parent_id": 5,
      "parent_name": "John Doe",
      "phone": "+1234567890",
      "students": [
        {
          "student_id": 10,
          "student_name": "Jane Doe",
          "grade": "5th"
        }
      ]
    }
  ],
  "pickup_points": [
    {
      "address": "123 Main St, City",
      "latitude": 40.7128,
      "longitude": -74.0060,
      "pickup_time": "07:30:00",
      "drop_time": "15:30:00"
    }
  ],
  "rotation_schedule": {
    "days": ["monday", "tuesday", "wednesday", "thursday", "friday"],
    "rotation_type": "weekly",
    "driver_order": [5, 6, 7]
  },
  "max_members": 8,
  "description": "Carpool for morning drop-off and afternoon pickup",
  "rules": "Please be on time. Driver should arrive 5 minutes early."
}
```

#### List Carpool Groups
```http
GET /api/v1/carpools/groups?skip=0&limit=100&status=active
```

#### Get Carpool Group
```http
GET /api/v1/carpools/groups/{group_id}
```

#### Update Carpool Group
```http
PUT /api/v1/carpools/groups/{group_id}
```

#### Join Carpool Group
```http
POST /api/v1/carpools/groups/{group_id}/join
```

**Request Body:**
```json
{
  "parent_id": 6,
  "students": [
    {
      "student_id": 11,
      "student_name": "Bob Smith",
      "grade": "5th"
    }
  ]
}
```

#### Rotate Driver
```http
POST /api/v1/carpools/groups/{group_id}/rotate-driver
```

**Request Body:**
```json
{
  "new_driver_parent_id": 6,
  "week_start_date": "2024-01-15",
  "notification_message": "Bob Smith will be driving this week"
}
```

### Carpool Requests

#### Create Carpool Request
```http
POST /api/v1/carpools/requests
```

**Request Body:**
```json
{
  "institution_id": 1,
  "parent_id": 8,
  "request_type": "seeking",
  "student_ids": [12, 13],
  "route": {
    "start_address": "456 Oak Ave, City",
    "start_latitude": 40.7200,
    "start_longitude": -74.0100,
    "end_address": "School Address",
    "end_latitude": 40.7300,
    "end_longitude": -74.0200
  },
  "schedule_days": ["monday", "wednesday", "friday"],
  "departure_time": "07:45:00",
  "return_time": "15:30:00",
  "matching_criteria": {
    "max_distance_km": 5,
    "preferred_departure_time_window": 15,
    "same_grade_only": false,
    "max_detour_minutes": 10
  },
  "notes": "Looking for reliable carpool for 2 students",
  "expires_at": "2024-12-31T23:59:59"
}
```

#### List Carpool Requests
```http
GET /api/v1/carpools/requests?request_type=seeking&status=active
```

#### Find Matching Carpools
```http
POST /api/v1/carpools/requests/{request_id}/match
```

**Request Body:**
```json
{
  "max_results": 10,
  "include_groups": true,
  "include_requests": true
}
```

**Response:**
```json
{
  "matches": [
    {
      "id": 1,
      "institution_id": 1,
      "request_id": 5,
      "matched_group_id": 3,
      "compatibility_score": 85.50,
      "match_details": {
        "distance_km": 2.3,
        "within_range": true,
        "time_difference_minutes": 10,
        "time_compatible": true,
        "common_days": ["monday", "wednesday", "friday"],
        "schedule_compatible": true,
        "has_capacity": true,
        "group_active": true,
        "group_member_count": 4
      },
      "status": "pending"
    }
  ],
  "total_matches": 1
}
```

### Carpool Rides

#### Create Ride
```http
POST /api/v1/carpools/rides
```

**Request Body:**
```json
{
  "institution_id": 1,
  "group_id": 3,
  "driver_parent_id": 5,
  "ride_date": "2024-01-15",
  "ride_type": "morning",
  "passengers": [
    {
      "student_id": 10,
      "student_name": "Jane Doe",
      "parent_id": 5,
      "parent_name": "John Doe"
    }
  ],
  "pickup_sequence": [
    {
      "address": "123 Main St",
      "pickup_time": "07:30:00",
      "latitude": 40.7128,
      "longitude": -74.0060
    }
  ],
  "pickup_time": "07:30:00",
  "drop_time": "08:15:00",
  "vehicle_info": {
    "make": "Toyota",
    "model": "Sienna",
    "color": "Blue",
    "license_plate": "ABC123"
  }
}
```

#### List Rides
```http
GET /api/v1/carpools/rides?group_id=3&ride_date=2024-01-15
```

#### Confirm Ride
```http
POST /api/v1/carpools/rides/{ride_id}/confirm
```

**Request Body:**
```json
{
  "parent_id": 5,
  "confirmation": true,
  "notes": "Will be ready at 7:25 AM"
}
```

#### Create Ride Schedule
```http
POST /api/v1/carpools/groups/{group_id}/schedule?start_date=2024-01-15&end_date=2024-01-31
```

### Emergency Notifications

#### Create Emergency Notification
```http
POST /api/v1/carpools/emergencies
```

**Request Body:**
```json
{
  "institution_id": 1,
  "ride_id": 10,
  "reporter_parent_id": 5,
  "emergency_type": "delay",
  "severity": "medium",
  "description": "Heavy traffic on highway, expecting 15 minute delay",
  "location": {
    "latitude": 40.7128,
    "longitude": -74.0060,
    "address": "Highway 101, near Exit 5"
  },
  "estimated_delay": 15,
  "notified_parents": [6, 7, 8]
}
```

#### List Emergency Notifications
```http
GET /api/v1/carpools/emergencies?resolved=false
```

#### Update Emergency Notification
```http
PUT /api/v1/carpools/emergencies/{emergency_id}
```

**Request Body:**
```json
{
  "resolution": "Traffic cleared, back on schedule",
  "resolved_at": "2024-01-15T08:00:00"
}
```

## Route Matching Algorithm

### Compatibility Score Calculation

The route matching algorithm calculates a compatibility score (0-100) based on multiple factors:

1. **Distance Compatibility (30 points max)**
   - Calculates distance between pickup points using Haversine formula
   - Score decreases as distance approaches max_distance_km threshold
   - Returns 0 if distance exceeds threshold

2. **Time Compatibility (25 points max)**
   - Compares departure times
   - Score decreases as time difference approaches window threshold
   - Returns 0 if time difference exceeds preferred_departure_time_window

3. **Schedule Overlap (20 points max)**
   - Calculates intersection of schedule days
   - Score based on ratio of common days to total days
   - Returns 0 if no common days

4. **Request Type Match (15 points)**
   - Matches "seeking" with "offering" requests
   - Full points awarded for complementary request types

5. **Seat Availability (10 points)**
   - For "offering" requests, checks available seats
   - Deducts points if insufficient seats

6. **Group Capacity (20 points)**
   - For group matches, checks if group has space
   - Full points if group is active and has capacity

### Example Match Details

```json
{
  "distance_km": 2.3,
  "within_range": true,
  "time_difference_minutes": 10,
  "time_compatible": true,
  "common_days": ["monday", "wednesday", "friday"],
  "schedule_compatible": true,
  "request_type_match": "seeking_offering",
  "seats_available": true,
  "closest_pickup_point": {
    "address": "123 Main St",
    "latitude": 40.7128,
    "longitude": -74.0060
  }
}
```

## Database Schema

### Tables

1. **carpool_groups** - Main carpool group information
2. **carpool_requests** - Parent requests for carpools
3. **carpool_rides** - Individual ride instances
4. **emergency_notifications** - Emergency alerts during rides
5. **carpool_matches** - Compatibility matches between requests/groups

### Key Relationships

- Groups have many rides
- Requests can be matched to groups or other requests
- Rides belong to groups and have one driver
- Emergency notifications belong to rides
- Matches link requests to compatible requests or groups

## Business Logic

### Driver Rotation

1. Group organizer sets up rotation schedule with driver order
2. System tracks active driver and current week
3. Driver rotation can be manual or automated
4. Rotation history is maintained in rotation_schedule JSON

### Ride Confirmation Flow

1. Ride is created with "scheduled" status
2. Parents confirm participation
3. All confirmations tracked in confirmations JSON
4. Status changes to "confirmed" when all parents confirm
5. Rides can be marked as "in_progress", "completed", "cancelled", or "no_show"

### Emergency Notification Flow

1. Driver or parent reports emergency
2. System identifies all group members
3. Notifications sent to all parents except reporter
4. Emergency details and location tracked
5. Resolution recorded when emergency is resolved

## Usage Examples

### Example 1: Create a Carpool Group

```python
# Parent creates a new carpool group
POST /api/v1/carpools/groups
{
  "organizer_parent_id": 5,
  "group_name": "Oak Street Morning Carpool",
  "members": [...],
  "pickup_points": [...],
  "rotation_schedule": {...}
}
```

### Example 2: Find Compatible Carpools

```python
# Parent creates a request
POST /api/v1/carpools/requests
{
  "request_type": "seeking",
  "route": {...},
  "schedule_days": ["monday", "wednesday", "friday"],
  "departure_time": "07:45:00"
}

# System finds matches
POST /api/v1/carpools/requests/5/match
{
  "max_results": 10,
  "include_groups": true
}
```

### Example 3: Report Emergency

```python
# Driver reports delay
POST /api/v1/carpools/emergencies
{
  "ride_id": 10,
  "emergency_type": "delay",
  "severity": "low",
  "description": "Traffic delay",
  "estimated_delay": 10
}
```

## Security Considerations

1. **Authorization**: Parents can only access carpools for their institution
2. **Privacy**: Student and parent information shared only within groups
3. **Validation**: All location data and times validated
4. **Rate Limiting**: API endpoints protected against abuse
5. **Data Integrity**: Foreign key constraints ensure referential integrity

## Future Enhancements

1. Real-time GPS tracking for active rides
2. Automated driver rotation based on calendar
3. Integration with school calendar for schedule changes
4. Cost sharing and expense tracking
5. Ride history and analytics
6. Mobile app notifications
7. Integration with mapping services for optimal routes
8. Weather-based alerts and recommendations
