import { apiClient } from './client';
import {
  Event,
  EventsResponse,
  EventRSVP,
  RSVPStatus,
  EventFilters,
  AcademicYear,
} from '@/types';

export const eventsApi = {
  getEvents: async (filters?: EventFilters) => {
    const params = new URLSearchParams();
    
    if (filters?.types?.length) {
      params.append('types', filters.types.join(','));
    }
    if (filters?.status?.length) {
      params.append('status', filters.status.join(','));
    }
    if (filters?.startDate) {
      params.append('startDate', filters.startDate);
    }
    if (filters?.endDate) {
      params.append('endDate', filters.endDate);
    }
    if (filters?.requiresRSVP !== undefined) {
      params.append('requiresRSVP', String(filters.requiresRSVP));
    }

    const queryString = params.toString();
    const url = queryString ? `/api/v1/events?${queryString}` : '/api/v1/events';
    
    return apiClient.get<EventsResponse>(url);
  },

  getEventById: async (eventId: number) => {
    return apiClient.get<Event>(`/api/v1/events/${eventId}`);
  },

  getEventsByDateRange: async (startDate: string, endDate: string) => {
    return apiClient.get<Event[]>(
      `/api/v1/events?startDate=${startDate}&endDate=${endDate}`
    );
  },

  getUpcomingEvents: async (limit?: number) => {
    const url = limit 
      ? `/api/v1/events/upcoming?limit=${limit}` 
      : '/api/v1/events/upcoming';
    return apiClient.get<Event[]>(url);
  },

  rsvpToEvent: async (eventId: number, status: RSVPStatus, note?: string) => {
    return apiClient.post<EventRSVP>(`/api/v1/events/${eventId}/rsvp`, {
      status,
      note,
    });
  },

  updateRSVP: async (eventId: number, status: RSVPStatus, note?: string) => {
    return apiClient.put<EventRSVP>(`/api/v1/events/${eventId}/rsvp`, {
      status,
      note,
    });
  },

  getEventRSVP: async (eventId: number) => {
    return apiClient.get<EventRSVP>(`/api/v1/events/${eventId}/rsvp`);
  },

  getAcademicYear: async (yearId?: number) => {
    const url = yearId 
      ? `/api/v1/events/academic-year/${yearId}` 
      : '/api/v1/events/academic-year/current';
    return apiClient.get<AcademicYear>(url);
  },
};
