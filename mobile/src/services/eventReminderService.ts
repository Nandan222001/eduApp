import * as Notifications from 'expo-notifications';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Event, EventReminder } from '@/types';

const REMINDERS_STORAGE_KEY = 'event_reminders';

export class EventReminderService {
  static async scheduleEventReminder(
    event: Event,
    minutesBefore: number
  ): Promise<string | null> {
    try {
      const eventDateTime = new Date(`${event.startDate}T${event.startTime || '00:00:00'}`);
      const reminderTime = new Date(eventDateTime.getTime() - minutesBefore * 60 * 1000);

      if (reminderTime.getTime() < Date.now()) {
        return null;
      }

      const notificationId = await Notifications.scheduleNotificationAsync({
        content: {
          title: `Upcoming: ${event.title}`,
          body: `${event.type.replace('_', ' ')} starts in ${minutesBefore} minutes`,
          data: { eventId: event.id, type: 'event_reminder' },
          sound: true,
        },
        trigger: {
          date: reminderTime,
        },
      });

      const reminder: EventReminder = {
        eventId: event.id,
        eventTitle: event.title,
        eventDate: event.startDate,
        reminderTime: minutesBefore,
        notificationId,
      };

      await this.saveReminder(reminder);

      return notificationId;
    } catch (error) {
      console.error('Error scheduling event reminder:', error);
      return null;
    }
  }

  static async scheduleMultipleReminders(
    event: Event,
    minutesBeforeArray: number[]
  ): Promise<string[]> {
    const notificationIds: string[] = [];

    for (const minutes of minutesBeforeArray) {
      const notificationId = await this.scheduleEventReminder(event, minutes);
      if (notificationId) {
        notificationIds.push(notificationId);
      }
    }

    return notificationIds;
  }

  static async cancelEventReminder(notificationId: string): Promise<void> {
    try {
      await Notifications.cancelScheduledNotificationAsync(notificationId);
      await this.removeReminder(notificationId);
    } catch (error) {
      console.error('Error canceling event reminder:', error);
    }
  }

  static async cancelAllEventReminders(eventId: number): Promise<void> {
    try {
      const reminders = await this.getReminders();
      const eventReminders = reminders.filter(r => r.eventId === eventId);

      for (const reminder of eventReminders) {
        if (reminder.notificationId) {
          await Notifications.cancelScheduledNotificationAsync(reminder.notificationId);
        }
      }

      const updatedReminders = reminders.filter(r => r.eventId !== eventId);
      await AsyncStorage.setItem(REMINDERS_STORAGE_KEY, JSON.stringify(updatedReminders));
    } catch (error) {
      console.error('Error canceling all event reminders:', error);
    }
  }

  static async getEventReminders(eventId: number): Promise<EventReminder[]> {
    const reminders = await this.getReminders();
    return reminders.filter(r => r.eventId === eventId);
  }

  private static async saveReminder(reminder: EventReminder): Promise<void> {
    try {
      const reminders = await this.getReminders();
      reminders.push(reminder);
      await AsyncStorage.setItem(REMINDERS_STORAGE_KEY, JSON.stringify(reminders));
    } catch (error) {
      console.error('Error saving reminder:', error);
    }
  }

  private static async removeReminder(notificationId: string): Promise<void> {
    try {
      const reminders = await this.getReminders();
      const updatedReminders = reminders.filter(r => r.notificationId !== notificationId);
      await AsyncStorage.setItem(REMINDERS_STORAGE_KEY, JSON.stringify(updatedReminders));
    } catch (error) {
      console.error('Error removing reminder:', error);
    }
  }

  private static async getReminders(): Promise<EventReminder[]> {
    try {
      const data = await AsyncStorage.getItem(REMINDERS_STORAGE_KEY);
      return data ? JSON.parse(data) : [];
    } catch (error) {
      console.error('Error getting reminders:', error);
      return [];
    }
  }

  static async cleanupExpiredReminders(): Promise<void> {
    try {
      const reminders = await this.getReminders();
      const now = new Date();
      
      const validReminders = reminders.filter(reminder => {
        const eventDate = new Date(reminder.eventDate);
        return eventDate > now;
      });

      await AsyncStorage.setItem(REMINDERS_STORAGE_KEY, JSON.stringify(validReminders));
    } catch (error) {
      console.error('Error cleaning up expired reminders:', error);
    }
  }
}
