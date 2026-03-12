import { useEffect } from 'react';
import { useWebSocket } from '@/contexts/WebSocketContext';
import { useToast } from './useToast';
import { useQueryClient } from '@tanstack/react-query';

export const useRealtimeNotifications = () => {
  const { onMessage } = useWebSocket();
  const { showInfo } = useToast();
  const queryClient = useQueryClient();

  useEffect(() => {
    const unsubscribeMessage = onMessage('new_message', (message) => {
      showInfo(`New message from ${message.sender_name}: ${message.subject}`);
      queryClient.invalidateQueries({ queryKey: ['messages'] });
      queryClient.invalidateQueries({ queryKey: ['unreadCount'] });
    });

    const unsubscribeAnnouncement = onMessage('new_announcement', (message) => {
      const priorityLabel = message.priority === 'high' ? '⚠️ ' : '';
      showInfo(`${priorityLabel}New announcement: ${message.title}`);
      queryClient.invalidateQueries({ queryKey: ['announcements'] });
    });

    return () => {
      unsubscribeMessage();
      unsubscribeAnnouncement();
    };
  }, [onMessage, showInfo, queryClient]);
};
