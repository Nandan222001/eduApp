export interface Event {
  id: number;
  institution_id: number;
  title: string;
  description?: string;
  event_type: string;
  start_date: string;
  end_date: string;
  location?: string;
  venue?: string;
  organizer?: string;
  contact_person?: string;
  contact_email?: string;
  contact_phone?: string;
  max_participants?: number;
  registration_required: boolean;
  registration_deadline?: string;
  is_public: boolean;
  allow_guests: boolean;
  status: string;
  banner_image_url?: string;
  created_by?: number;
  created_at: string;
  updated_at: string;
}

export interface EventWithDetails extends Event {
  rsvp_count: number;
  accepted_count: number;
  declined_count: number;
  photo_count: number;
}

export interface EventRSVP {
  id: number;
  event_id: number;
  user_id: number;
  status: string;
  response_date?: string;
  number_of_guests: number;
  remarks?: string;
  created_at: string;
  updated_at: string;
}

export interface EventRSVPWithUser extends EventRSVP {
  user_name: string;
  user_email?: string;
}

export interface EventPhoto {
  id: number;
  event_id: number;
  title?: string;
  description?: string;
  photo_url: string;
  thumbnail_url?: string;
  file_size?: number;
  file_type?: string;
  uploaded_by?: number;
  uploaded_at: string;
  display_order: number;
  is_featured: boolean;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface EventCalendarItem {
  id: number;
  title: string;
  event_type: string;
  start_date: string;
  end_date: string;
  location?: string;
  status: string;
}
