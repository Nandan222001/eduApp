import { useState, useEffect, useCallback } from 'react';
import { useWebSocket } from '@/contexts/WebSocketContext';

interface UserPresence {
  status: 'online' | 'offline' | 'away' | 'busy';
  last_seen?: string;
}

export const useOnlinePresence = (userIds: number[]) => {
  const { getOnlineUsers, getUserPresence, onMessage } = useWebSocket();
  const [onlineUsers, setOnlineUsers] = useState<Set<number>>(new Set());
  const [userPresences, setUserPresences] = useState<Map<number, UserPresence>>(new Map());

  useEffect(() => {
    if (userIds.length > 0) {
      getOnlineUsers(userIds);
    }

    const unsubscribeOnlineUsers = onMessage('online_users', (message) => {
      const userIds = message.user_ids as number[];
      setOnlineUsers(new Set(userIds));
    });

    const unsubscribePresence = onMessage('presence_update', (message) => {
      const userId = message.user_id as number;
      const status = message.status as string;

      setUserPresences((prev) => {
        const newMap = new Map(prev);
        newMap.set(userId, {
          status: status as 'online' | 'offline' | 'away' | 'busy',
          last_seen: message.timestamp as string,
        });
        return newMap;
      });

      if (status === 'online') {
        setOnlineUsers((prev) => new Set([...prev, userId]));
      } else if (status === 'offline') {
        setOnlineUsers((prev) => {
          const newSet = new Set(prev);
          newSet.delete(userId);
          return newSet;
        });
      }
    });

    const unsubscribeUserPresence = onMessage('user_presence', (message) => {
      const userId = message.user_id as number;
      const presence = message.presence as UserPresence;

      setUserPresences((prev) => {
        const newMap = new Map(prev);
        newMap.set(userId, presence);
        return newMap;
      });
    });

    return () => {
      unsubscribeOnlineUsers();
      unsubscribePresence();
      unsubscribeUserPresence();
    };
  }, [userIds, getOnlineUsers, onMessage]);

  const isUserOnline = useCallback(
    (userId: number): boolean => {
      return onlineUsers.has(userId);
    },
    [onlineUsers]
  );

  const getUserStatus = useCallback(
    (userId: number): UserPresence => {
      return (
        userPresences.get(userId) || {
          status: 'offline',
        }
      );
    },
    [userPresences]
  );

  const refreshPresence = useCallback(() => {
    if (userIds.length > 0) {
      getOnlineUsers(userIds);
      userIds.forEach((userId) => getUserPresence(userId));
    }
  }, [userIds, getOnlineUsers, getUserPresence]);

  return {
    onlineUsers: Array.from(onlineUsers),
    isUserOnline,
    getUserStatus,
    refreshPresence,
  };
};
