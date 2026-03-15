import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { eventsApi } from '@/api/events';
import { EventReminder } from '@/types/event';

export const useEventReminders = () => {
  const queryClient = useQueryClient();

  const { data: reminders = [], isLoading } = useQuery<EventReminder[]>({
    queryKey: ['eventReminders'],
    queryFn: () => eventsApi.getReminders(),
  });

  const setReminderMutation = useMutation({
    mutationFn: ({
      eventId,
      reminderData,
    }: {
      eventId: number;
      reminderData: Partial<EventReminder>;
    }) => eventsApi.setReminder(eventId, reminderData),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['eventReminders'] });
    },
  });

  const deleteReminderMutation = useMutation({
    mutationFn: ({ eventId, reminderId }: { eventId: number; reminderId: number }) =>
      eventsApi.deleteReminder(eventId, reminderId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['eventReminders'] });
    },
  });

  const hasReminder = (eventId: number) => {
    return reminders.some((r) => r.event_id === eventId);
  };

  const getRemindersByEvent = (eventId: number) => {
    return reminders.filter((r) => r.event_id === eventId);
  };

  return {
    reminders,
    isLoading,
    setReminder: setReminderMutation.mutateAsync,
    deleteReminder: deleteReminderMutation.mutateAsync,
    hasReminder,
    getRemindersByEvent,
    isSettingReminder: setReminderMutation.isPending,
    isDeletingReminder: deleteReminderMutation.isPending,
  };
};

export default useEventReminders;
