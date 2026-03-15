import { useState, useEffect, useCallback } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { eventsApi } from '@/api/events';
import { LiveEvent, ChatMessage } from '@/types/event';

export const useLiveEvent = (eventId: number) => {
  const queryClient = useQueryClient();
  const [isFullscreen, setIsFullscreen] = useState(false);

  const {
    data: event,
    isLoading,
    error,
  } = useQuery<LiveEvent>({
    queryKey: ['liveEvent', eventId],
    queryFn: () => eventsApi.getLiveEvent(eventId),
    refetchInterval: 30000,
  });

  const { data: chatMessages = [] } = useQuery<ChatMessage[]>({
    queryKey: ['eventChat', eventId],
    queryFn: () => eventsApi.getChatMessages(eventId),
    refetchInterval: 2000,
  });

  const { data: streamHealth } = useQuery({
    queryKey: ['streamHealth', eventId],
    queryFn: () => eventsApi.getStreamHealth(eventId),
    refetchInterval: 5000,
    enabled: !!event?.is_live,
  });

  const sendMessageMutation = useMutation({
    mutationFn: (message: string) => eventsApi.sendChatMessage(eventId, message),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['eventChat', eventId] });
    },
  });

  const shareEventMutation = useMutation({
    mutationFn: (platform: string) => eventsApi.shareEvent(eventId, platform),
  });

  const setReminderMutation = useMutation({
    mutationFn: (reminderData: Record<string, unknown>) =>
      eventsApi.setReminder(eventId, reminderData),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['eventReminders'] });
    },
  });

  const sendMessage = useCallback(
    (message: string) => {
      return sendMessageMutation.mutateAsync(message);
    },
    [sendMessageMutation]
  );

  const shareEvent = useCallback(
    (platform: string) => {
      return shareEventMutation.mutateAsync(platform);
    },
    [shareEventMutation]
  );

  const setReminder = useCallback(
    (reminderData: Record<string, unknown>) => {
      return setReminderMutation.mutateAsync(reminderData);
    },
    [setReminderMutation]
  );

  useEffect(() => {
    const handleFullscreenChange = () => {
      setIsFullscreen(!!document.fullscreenElement);
    };

    document.addEventListener('fullscreenchange', handleFullscreenChange);
    return () => {
      document.removeEventListener('fullscreenchange', handleFullscreenChange);
    };
  }, []);

  return {
    event,
    isLoading,
    error,
    chatMessages,
    streamHealth,
    sendMessage,
    shareEvent,
    setReminder,
    isFullscreen,
    isSendingMessage: sendMessageMutation.isPending,
  };
};

export default useLiveEvent;
