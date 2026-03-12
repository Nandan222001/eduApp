export interface PeriodSlot {
  id: number;
  template_id: number;
  period_number: number;
  period_name?: string;
  period_type: string;
  start_time: string;
  end_time: string;
  is_break: boolean;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface TimetableTemplate {
  id: number;
  institution_id: number;
  academic_year_id: number;
  name: string;
  description?: string;
  school_start_time: string;
  school_end_time: string;
  periods_per_day: number;
  period_duration_minutes: number;
  break_duration_minutes: number;
  lunch_duration_minutes: number;
  working_days: string;
  is_default: boolean;
  is_active: boolean;
  created_at: string;
  updated_at: string;
  periods?: PeriodSlot[];
}

export interface Timetable {
  id: number;
  institution_id: number;
  academic_year_id: number;
  grade_id: number;
  section_id: number;
  template_id?: number;
  effective_from: string;
  effective_until?: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface TimetableEntry {
  id: number;
  timetable_id: number;
  subject_id: number;
  teacher_id?: number;
  day_of_week: string;
  period_number: number;
  start_time: string;
  end_time: string;
  period_type: string;
  room_number?: string;
  is_substitution: boolean;
  original_teacher_id?: number;
  substitution_reason?: string;
  remarks?: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface TimetableEntryWithDetails extends TimetableEntry {
  subject_name: string;
  subject_code?: string;
  teacher_name?: string;
  original_teacher_name?: string;
}

export interface TimetableWithEntries extends Timetable {
  entries: TimetableEntryWithDetails[];
}

export interface ConflictCheck {
  has_conflict: boolean;
  conflict_type?: string;
  conflict_message?: string;
  conflicting_entries: TimetableEntryWithDetails[];
}
