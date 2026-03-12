export interface RouteStop {
  id: number;
  route_id: number;
  stop_name: string;
  stop_address?: string;
  latitude?: number;
  longitude?: number;
  stop_order: number;
  pickup_time?: string;
  drop_time?: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface TransportRoute {
  id: number;
  institution_id: number;
  route_number: string;
  route_name: string;
  description?: string;
  start_location: string;
  end_location: string;
  total_distance_km?: number;
  estimated_duration_minutes?: number;
  pickup_time?: string;
  drop_time?: string;
  vehicle_type?: string;
  vehicle_number?: string;
  vehicle_capacity?: number;
  driver_name?: string;
  driver_phone?: string;
  driver_license_number?: string;
  conductor_name?: string;
  conductor_phone?: string;
  monthly_fee?: number;
  status: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
  stops?: RouteStop[];
}

export interface StudentTransport {
  id: number;
  institution_id: number;
  student_id: number;
  route_id: number;
  stop_id?: number;
  pickup_location?: string;
  drop_location?: string;
  monthly_fee?: number;
  start_date: string;
  end_date?: string;
  is_active: boolean;
  emergency_contact_name?: string;
  emergency_contact_phone?: string;
  remarks?: string;
  created_at: string;
  updated_at: string;
}

export interface StudentTransportWithDetails extends StudentTransport {
  student_name: string;
  route_number: string;
  route_name: string;
  stop_name?: string;
}
