export enum EventType {
  EXAM = 'exam',
  ASSIGNMENT = 'assignment',
  PARENT_TEACHER_MEETING = 'parent_teacher_meeting',
  SCHOOL_EVENT = 'school_event',
  HOLIDAY = 'holiday',
  SPORTS_DAY = 'sports_day',
  CULTURAL_EVENT = 'cultural_event',
  WORKSHOP = 'workshop',
  OTHER = 'other',
}

export enum EventStatus {
  UPCOMING = 'upcoming',
  ONGOING = 'ongoing',
  COMPLETED = 'completed',
  CANCELLED = 'cancelled',
}

export enum RSVPStatus {
  PENDING = 'pending',
  ACCEPTED = 'accepted',
  DECLINED = 'declined',
  MAYBE = 'maybe',
}

export interface Event {
  id: number;
  title: string;
  description?: string;
  type: EventType;
  status: EventStatus;
  startDate: string;
  endDate: string;
  startTime?: string;
  endTime?: string;
  location?: string;
  organizerId?: number;
  organizerName?: string;
  isAllDay: boolean;
  requiresRSVP: boolean;
  rsvpDeadline?: string;
  maxAttendees?: number;
  currentAttendees?: number;
  metadata?: {
    subjectId?: number;
    subjectName?: string;
    classId?: number;
    className?: string;
    examId?: number;
    assignmentId?: number;
  };
  createdAt: string;
  updatedAt: string;
}

export interface EventRSVP {
  id: number;
  eventId: number;
  userId: number;
  status: RSVPStatus;
  note?: string;
  createdAt: string;
  updatedAt: string;
}

export interface EventsResponse {
  events: Event[];
  total: number;
  page: number;
  pageSize: number;
}

export interface CalendarEvent {
  id: number;
  title: string;
  type: EventType;
  date: string;
  startTime?: string;
  endTime?: string;
  isAllDay: boolean;
}

export interface MarkedDate {
  marked: boolean;
  dotColor?: string;
  selected?: boolean;
  selectedColor?: string;
  dots?: Array<{ key: string; color: string }>;
}

export interface MarkedDates {
  [date: string]: MarkedDate;
}

export enum CalendarViewMode {
  MONTH = 'month',
  WEEK = 'week',
  DAY = 'day',
  AGENDA = 'agenda',
}

export interface AcademicTerm {
  id: number;
  name: string;
  startDate: string;
  endDate: string;
  year: string;
  isActive: boolean;
}

export interface AcademicYear {
  id: number;
  name: string;
  startDate: string;
  endDate: string;
  terms: AcademicTerm[];
  holidays: Event[];
}

export interface EventFilters {
  types?: EventType[];
  status?: EventStatus[];
  startDate?: string;
  endDate?: string;
  requiresRSVP?: boolean;
}

export interface EventReminder {
  eventId: number;
  eventTitle: string;
  eventDate: string;
  reminderTime: number;
  notificationId?: string;
}
