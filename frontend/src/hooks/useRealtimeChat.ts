import { useState, useEffect, useCallback } from 'react';
import { useWebSocket } from '@/contexts/WebSocketContext';
import { useDebounce } from './useDebounce';

interface ChatMessage {
  type: 'chat_message';
  room: string;
  sender_id: number;
  sender_name: string;
  message: string;
  message_id?: number;
  timestamp?: string;
}

interface TypingIndicator {
  room: string;
  user_id: number;
  user_name: string;
  is_typing: boolean;
}

export const useRealtimeChat = (room: string) => {
  const { subscribe, unsubscribe, sendTyping: wsSendTyping, onMessage } = useWebSocket();
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [typingUsers, setTypingUsers] = useState<Set<number>>(new Set());
  const [isTyping, setIsTyping] = useState(false);

  const debouncedStopTyping = useDebounce(() => {
    setIsTyping(false);
    wsSendTyping(room, false);
  }, 2000);

  useEffect(() => {
    subscribe([room]);

    const unsubscribeChatMessage = onMessage('chat_message', (message) => {
      if (message.room === room) {
        setMessages((prev) => [...prev, message as unknown as ChatMessage]);
      }
    });

    const unsubscribeTyping = onMessage('typing_indicator', (message) => {
      const typingMsg = message as unknown as TypingIndicator;
      if (typingMsg.room === room) {
        setTypingUsers((prev) => {
          const newSet = new Set(prev);
          if (typingMsg.is_typing) {
            newSet.add(typingMsg.user_id);
          } else {
            newSet.delete(typingMsg.user_id);
          }
          return newSet;
        });
      }
    });

    return () => {
      unsubscribe([room]);
      unsubscribeChatMessage();
      unsubscribeTyping();
    };
  }, [room, subscribe, unsubscribe, onMessage]);

  const sendTyping = useCallback(() => {
    if (!isTyping) {
      setIsTyping(true);
      wsSendTyping(room, true);
    }
    debouncedStopTyping();
  }, [isTyping, room, wsSendTyping, debouncedStopTyping]);

  const stopTyping = useCallback(() => {
    setIsTyping(false);
    wsSendTyping(room, false);
  }, [room, wsSendTyping]);

  return {
    messages,
    typingUsers: Array.from(typingUsers),
    sendTyping,
    stopTyping,
  };
};
