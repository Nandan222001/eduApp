import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { eventsApi } from '@/api/events';
import { EventFilters, RSVPStatus } from '@/types';
import { CalendarService } from '@/services/calendarService';
import { EventReminderService } from '@/services/eventReminderService';

export const useEvents = (filters?: EventFilters) => {
  return useQuery({
    queryKey: ['events', filters],
    queryFn: async () => {
      const response = await eventsApi.getEvents(filters);
      return response.data;
    },
  });
};

export const useEvent = (eventId: number) => {
  return useQuery({
    queryKey: ['event', eventId],
    queryFn: async () => {
      const response = await eventsApi.getEventById(eventId);
      return response.data;
    },
    enabled: !!eventId,
  });
};

export const useUpcomingEvents = (limit?: number) => {
  return useQuery({
    queryKey: ['upcomingEvents', limit],
    queryFn: async () => {
      const response = await eventsApi.getUpcomingEvents(limit);
      return response.data;
    },
  });
};

export const useEventsByDateRange = (startDate: string, endDate: string) => {
  return useQuery({
    queryKey: ['events', 'dateRange', startDate, endDate],
    queryFn: async () => {
      const response = await eventsApi.getEventsByDateRange(startDate, endDate);
      return response.data;
    },
    enabled: !!startDate && !!endDate,
  });
};

export const useEventRSVP = (eventId: number) => {
  const queryClient = useQueryClient();

  const { data: rsvp, ...query } = useQuery({
    queryKey: ['eventRSVP', eventId],
    queryFn: async () => {
      const response = await eventsApi.getEventRSVP(eventId);
      return response.data;
    },
    enabled: !!eventId,
  });

  const submitRSVP = useMutation({
    mutationFn: async ({ status, note }: { status: RSVPStatus; note?: string }) => {
      return eventsApi.rsvpToEvent(eventId, status, note);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['eventRSVP', eventId] });
      queryClient.invalidateQueries({ queryKey: ['events'] });
    },
  });

  const updateRSVP = useMutation({
    mutationFn: async ({ status, note }: { status: RSVPStatus; note?: string }) => {
      return eventsApi.updateRSVP(eventId, status, note);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['eventRSVP', eventId] });
      queryClient.invalidateQueries({ queryKey: ['events'] });
    },
  });

  return {
    rsvp,
    submitRSVP,
    updateRSVP,
    ...query,
  };
};

export const useAcademicYear = (yearId?: number) => {
  return useQuery({
    queryKey: ['academicYear', yearId],
    queryFn: async () => {
      const response = await eventsApi.getAcademicYear(yearId);
      return response.data;
    },
  });
};

export const useSyncEventToCalendar = () => {
  return useMutation({
    mutationFn: async (eventId: number) => {
      const response = await eventsApi.getEventById(eventId);
      const event = response.data;
      return CalendarService.syncEventToDeviceCalendar(event);
    },
  });
};

export const useScheduleEventReminder = () => {
  return useMutation({
    mutationFn: async ({
      eventId,
      minutesBefore,
    }: {
      eventId: number;
      minutesBefore: number[];
    }) => {
      const response = await eventsApi.getEventById(eventId);
      const event = response.data;
      return EventReminderService.scheduleMultipleReminders(event, minutesBefore);
    },
  });
};
