import * as Calendar from 'expo-calendar';
import { Platform } from 'react-native';
import { Event } from '@/types';

export class CalendarService {
  private static calendarId: string | null = null;

  static async requestPermissions(): Promise<boolean> {
    if (Platform.OS === 'android') {
      const { status } = await Calendar.requestCalendarPermissionsAsync();
      return status === 'granted';
    } else {
      const { status } = await Calendar.requestCalendarPermissionsAsync();
      return status === 'granted';
    }
  }

  static async getDefaultCalendar(): Promise<string | null> {
    if (this.calendarId) {
      return this.calendarId;
    }

    const hasPermission = await this.requestPermissions();
    if (!hasPermission) {
      return null;
    }

    const calendars = await Calendar.getCalendarsAsync(Calendar.EntityTypes.EVENT);
    
    let defaultCalendar = calendars.find(
      (cal: Calendar.Calendar) => cal.source.name === 'Default' || cal.isPrimary
    );

    if (!defaultCalendar && calendars.length > 0) {
      defaultCalendar = calendars[0];
    }

    if (defaultCalendar) {
      this.calendarId = defaultCalendar.id;
      return defaultCalendar.id;
    }

    if (Platform.OS === 'ios') {
      const defaultSource = await Calendar.getDefaultCalendarAsync();
      this.calendarId = defaultSource.id;
      return defaultSource.id;
    }

    return null;
  }

  static async syncEventToDeviceCalendar(event: Event): Promise<string | null> {
    try {
      const calendarId = await this.getDefaultCalendar();
      if (!calendarId) {
        throw new Error('No calendar available');
      }

      const startDate = new Date(`${event.startDate}T${event.startTime || '00:00:00'}`);
      const endDate = new Date(`${event.endDate}T${event.endTime || '23:59:59'}`);

      const eventId = await Calendar.createEventAsync(calendarId, {
        title: event.title,
        startDate,
        endDate,
        location: event.location,
        notes: event.description,
        alarms: [
          { relativeOffset: -60 },
          { relativeOffset: -1440 },
        ],
        allDay: event.isAllDay,
      });

      return eventId;
    } catch (error) {
      console.error('Error syncing event to device calendar:', error);
      return null;
    }
  }

  static async syncMultipleEvents(events: Event[]): Promise<Map<number, string>> {
    const syncedEvents = new Map<number, string>();

    for (const event of events) {
      const deviceEventId = await this.syncEventToDeviceCalendar(event);
      if (deviceEventId) {
        syncedEvents.set(event.id, deviceEventId);
      }
    }

    return syncedEvents;
  }

  static async removeEventFromDeviceCalendar(deviceEventId: string): Promise<boolean> {
    try {
      await Calendar.deleteEventAsync(deviceEventId);
      return true;
    } catch (error) {
      console.error('Error removing event from device calendar:', error);
      return false;
    }
  }

  static async updateDeviceCalendarEvent(
    deviceEventId: string,
    event: Event
  ): Promise<boolean> {
    try {
      const startDate = new Date(`${event.startDate}T${event.startTime || '00:00:00'}`);
      const endDate = new Date(`${event.endDate}T${event.endTime || '23:59:59'}`);

      await Calendar.updateEventAsync(deviceEventId, {
        title: event.title,
        startDate,
        endDate,
        location: event.location,
        notes: event.description,
        allDay: event.isAllDay,
      });

      return true;
    } catch (error) {
      console.error('Error updating device calendar event:', error);
      return false;
    }
  }
}
