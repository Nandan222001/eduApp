export interface Location {
  address: string;
  latitude: number;
  longitude: number;
  formatted_address?: string;
}

export interface CarpoolMatch {
  id: number;
  parent_id: number;
  parent_name: string;
  parent_photo_url?: string;
  home_location: Location;
  school_route: Location[];
  compatibility_score: number;
  schedule_alignment: number;
  available_seats: number;
  distance_from_you: number;
  estimated_time_savings: number;
  shared_route_percentage: number;
  children: {
    id: number;
    name: string;
    grade: string;
  }[];
  preferred_times: {
    morning_pickup: string;
    afternoon_dropoff: string;
  };
  vehicle_info?: {
    make: string;
    model: string;
    year: number;
    color: string;
    license_plate: string;
  };
  verified_driver: boolean;
  rating: number;
  total_rides: number;
}

export interface CarpoolGroup {
  id: number;
  name: string;
  description?: string;
  created_by: number;
  created_at: string;
  member_count: number;
  active_members: CarpoolMember[];
  rotation_schedule: RotationSchedule[];
  pickup_points: PickupPoint[];
  group_settings: {
    max_members: number;
    auto_rotate: boolean;
    notification_enabled: boolean;
    allow_guests: boolean;
  };
  statistics: {
    total_rides: number;
    total_distance: number;
    co2_saved: number;
    cost_saved: number;
  };
}

export interface CarpoolMember {
  id: number;
  user_id: number;
  parent_name: string;
  parent_photo_url?: string;
  parent_phone: string;
  parent_email: string;
  children: {
    id: number;
    name: string;
    grade: string;
    age: number;
  }[];
  role: 'admin' | 'member';
  joined_at: string;
  available_seats: number;
  emergency_contact: {
    name: string;
    phone: string;
    relationship: string;
  };
  verification_status: {
    driver_license_verified: boolean;
    background_check_verified: boolean;
    vehicle_insurance_verified: boolean;
  };
  preferences: {
    willing_to_drive: boolean;
    max_passengers: number;
    pet_friendly: boolean;
    music_preference?: string;
  };
}

export interface RotationSchedule {
  id: number;
  carpool_group_id: number;
  week_start: string;
  week_end: string;
  assignments: DailyAssignment[];
}

export interface DailyAssignment {
  date: string;
  day_of_week: string;
  morning_driver_id?: number;
  morning_driver_name?: string;
  afternoon_driver_id?: number;
  afternoon_driver_name?: string;
  status: 'scheduled' | 'confirmed' | 'completed' | 'cancelled';
  ride_ids?: {
    morning?: number;
    afternoon?: number;
  };
}

export interface PickupPoint {
  id: number;
  carpool_group_id: number;
  name: string;
  location: Location;
  pickup_time_morning?: string;
  dropoff_time_afternoon?: string;
  order_sequence: number;
  notes?: string;
  assigned_members: number[];
}

export interface CarpoolMessage {
  id: number;
  carpool_group_id: number;
  sender_id: number;
  sender_name: string;
  sender_photo_url?: string;
  content: string;
  message_type: 'text' | 'announcement' | 'alert';
  created_at: string;
  is_read: boolean;
  attachments?: string[];
}

export interface RideConfirmation {
  id: number;
  carpool_group_id: number;
  date: string;
  ride_type: 'morning' | 'afternoon';
  driver_id: number;
  driver_name: string;
  status: 'pending' | 'confirmed' | 'in_progress' | 'completed' | 'cancelled';
  passengers: RidePassenger[];
  scheduled_time: string;
  actual_start_time?: string;
  actual_end_time?: string;
  notifications_sent: boolean;
}

export interface RidePassenger {
  member_id: number;
  child_id: number;
  child_name: string;
  pickup_point_id: number;
  pickup_time: string;
  check_in_status: 'pending' | 'picked_up' | 'dropped_off' | 'absent';
  check_in_time?: string;
  parent_notified: boolean;
  notes?: string;
}

export interface RideTracking {
  ride_id: number;
  current_location: Location;
  driver_id: number;
  driver_name: string;
  estimated_arrival_times: {
    pickup_point_id: number;
    eta: string;
  }[];
  route_progress: number;
  last_updated: string;
  sharing_enabled: boolean;
  shared_with: number[];
}

export interface CarpoolAnalytics {
  carpool_group_id: number;
  period_start: string;
  period_end: string;
  cost_savings: {
    total_gas_saved: number;
    total_mileage_saved: number;
    estimated_cost_saved: number;
    cost_per_member: number;
  };
  environmental_impact: {
    co2_reduced_kg: number;
    trees_equivalent: number;
    gallons_saved: number;
  };
  participation: {
    total_rides: number;
    total_members: number;
    participation_rate: number;
    member_stats: {
      member_id: number;
      member_name: string;
      rides_driven: number;
      rides_taken: number;
      consistency_score: number;
    }[];
  };
  reliability: {
    on_time_percentage: number;
    cancellation_rate: number;
    average_delay_minutes: number;
  };
}

export interface DriverVerification {
  user_id: number;
  drivers_license_number: string;
  license_state: string;
  license_expiry: string;
  license_verified: boolean;
  license_verified_at?: string;
  background_check_completed: boolean;
  background_check_date?: string;
  vehicle_insurance_verified: boolean;
  insurance_expiry?: string;
  overall_verification_status: 'pending' | 'verified' | 'expired' | 'rejected';
}

export interface EmergencySOS {
  id: number;
  triggered_by: number;
  triggered_at: string;
  ride_id: number;
  location: Location;
  status: 'active' | 'resolved' | 'false_alarm';
  authorities_notified: boolean;
  parents_notified: boolean;
  resolution_notes?: string;
  resolved_at?: string;
}

export interface CarpoolSearchFilters {
  max_distance?: number;
  min_compatibility_score?: number;
  available_seats?: number;
  verified_drivers_only?: boolean;
  similar_schedule?: boolean;
  same_grade?: boolean;
}

export interface CarpoolGroupCreate {
  name: string;
  description?: string;
  max_members?: number;
  auto_rotate?: boolean;
  notification_enabled?: boolean;
}

export interface CarpoolGroupUpdate {
  name?: string;
  description?: string;
  max_members?: number;
  auto_rotate?: boolean;
  notification_enabled?: boolean;
}

export interface PickupPointCreate {
  name: string;
  location: Location;
  pickup_time_morning?: string;
  dropoff_time_afternoon?: string;
  order_sequence: number;
  notes?: string;
}

export interface RideCheckIn {
  ride_id: number;
  passenger_member_id: number;
  child_id: number;
  check_in_type: 'picked_up' | 'dropped_off';
  check_in_time: string;
  location?: Location;
  notes?: string;
}

export interface LateNotification {
  ride_id: number;
  estimated_delay_minutes: number;
  reason?: string;
  notified_members: number[];
}

export interface AbsenceNotification {
  ride_id: number;
  absent_child_id: number;
  reason?: string;
  notified_at: string;
}
