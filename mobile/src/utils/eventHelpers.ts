import { Event, EventType, EventStatus } from '@/types';
import { format, isToday, isTomorrow, isThisWeek, isPast, isFuture } from 'date-fns';

export const getEventStatusText = (event: Event): string => {
  const eventDate = new Date(`${event.startDate}T${event.startTime || '00:00:00'}`);
  
  if (isPast(eventDate)) {
    return 'Completed';
  }
  
  if (isToday(eventDate)) {
    return 'Today';
  }
  
  if (isTomorrow(eventDate)) {
    return 'Tomorrow';
  }
  
  if (isThisWeek(eventDate)) {
    return 'This Week';
  }
  
  return 'Upcoming';
};

export const formatEventDateRange = (startDate: string, endDate: string): string => {
  const start = new Date(startDate);
  const end = new Date(endDate);
  
  if (startDate === endDate) {
    return format(start, 'MMM dd, yyyy');
  }
  
  if (start.getFullYear() === end.getFullYear()) {
    if (start.getMonth() === end.getMonth()) {
      return `${format(start, 'MMM dd')} - ${format(end, 'dd, yyyy')}`;
    }
    return `${format(start, 'MMM dd')} - ${format(end, 'MMM dd, yyyy')}`;
  }
  
  return `${format(start, 'MMM dd, yyyy')} - ${format(end, 'MMM dd, yyyy')}`;
};

export const getEventTypeLabel = (type: EventType): string => {
  const labels: Record<EventType, string> = {
    [EventType.EXAM]: 'Exam',
    [EventType.ASSIGNMENT]: 'Assignment',
    [EventType.PARENT_TEACHER_MEETING]: 'Parent-Teacher Meeting',
    [EventType.SCHOOL_EVENT]: 'School Event',
    [EventType.HOLIDAY]: 'Holiday',
    [EventType.SPORTS_DAY]: 'Sports Day',
    [EventType.CULTURAL_EVENT]: 'Cultural Event',
    [EventType.WORKSHOP]: 'Workshop',
    [EventType.OTHER]: 'Other',
  };
  
  return labels[type] || type;
};

export const groupEventsByDate = (events: Event[]): Map<string, Event[]> => {
  const grouped = new Map<string, Event[]>();
  
  events.forEach(event => {
    const dateKey = event.startDate;
    const existing = grouped.get(dateKey) || [];
    grouped.set(dateKey, [...existing, event]);
  });
  
  return grouped;
};

export const sortEventsByDate = (events: Event[], ascending: boolean = true): Event[] => {
  return [...events].sort((a, b) => {
    const dateA = new Date(`${a.startDate}T${a.startTime || '00:00:00'}`);
    const dateB = new Date(`${b.startDate}T${b.startTime || '00:00:00'}`);
    
    return ascending 
      ? dateA.getTime() - dateB.getTime()
      : dateB.getTime() - dateA.getTime();
  });
};

export const filterEventsByType = (events: Event[], types: EventType[]): Event[] => {
  if (types.length === 0) return events;
  return events.filter(event => types.includes(event.type));
};

export const filterEventsByStatus = (events: Event[], statuses: EventStatus[]): Event[] => {
  if (statuses.length === 0) return events;
  return events.filter(event => statuses.includes(event.status));
};

export const getUpcomingEvents = (events: Event[], limit?: number): Event[] => {
  const now = new Date();
  const upcoming = events
    .filter(event => {
      const eventDate = new Date(`${event.startDate}T${event.startTime || '00:00:00'}`);
      return isFuture(eventDate);
    })
    .sort((a, b) => {
      const dateA = new Date(`${a.startDate}T${a.startTime || '00:00:00'}`);
      const dateB = new Date(`${b.startDate}T${b.startTime || '00:00:00'}`);
      return dateA.getTime() - dateB.getTime();
    });
  
  return limit ? upcoming.slice(0, limit) : upcoming;
};

export const isEventUpcoming = (event: Event): boolean => {
  const eventDate = new Date(`${event.startDate}T${event.startTime || '00:00:00'}`);
  return isFuture(eventDate);
};

export const isEventToday = (event: Event): boolean => {
  const eventDate = new Date(event.startDate);
  return isToday(eventDate);
};

export const getEventDuration = (event: Event): number => {
  const start = new Date(`${event.startDate}T${event.startTime || '00:00:00'}`);
  const end = new Date(`${event.endDate}T${event.endTime || '23:59:59'}`);
  return Math.ceil((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24));
};

export const canRSVP = (event: Event): boolean => {
  if (!event.requiresRSVP) return false;
  
  if (event.rsvpDeadline) {
    const deadline = new Date(event.rsvpDeadline);
    return isFuture(deadline);
  }
  
  return isEventUpcoming(event);
};

export const isEventFull = (event: Event): boolean => {
  if (!event.maxAttendees) return false;
  return (event.currentAttendees || 0) >= event.maxAttendees;
};
