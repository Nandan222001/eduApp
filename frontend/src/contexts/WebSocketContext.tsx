import { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { websocketClient, WebSocketMessage, WebSocketMessageType } from '@/lib/websocket';
import { useToast } from '@/hooks/useToast';
import { useAuth } from '@/hooks/useAuth';

interface WebSocketContextType {
  isConnected: boolean;
  subscribe: (rooms: string[]) => void;
  unsubscribe: (rooms: string[]) => void;
  sendTyping: (room: string, isTyping: boolean) => void;
  updatePresence: (status: 'online' | 'away' | 'busy') => void;
  getOnlineUsers: (userIds: number[]) => void;
  getUserPresence: (userId: number) => void;
  onMessage: (
    type: WebSocketMessageType,
    handler: (message: WebSocketMessage) => void
  ) => () => void;
}

const WebSocketContext = createContext<WebSocketContextType | undefined>(undefined);

interface WebSocketProviderProps {
  children: ReactNode;
}

export const WebSocketProvider = ({ children }: WebSocketProviderProps) => {
  const [isConnected, setIsConnected] = useState(false);
  const { showInfo, showError, showSuccess, showWarning } = useToast();
  const { user } = useAuth();

  useEffect(() => {
    if (!user) {
      return;
    }

    const unsubscribeConnection = websocketClient.on('connection', (message) => {
      setIsConnected(true);
      console.log('WebSocket connected:', message);
    });

    const unsubscribeNotification = websocketClient.on('notification', (message) => {
      const { title, message: text, notification_type } = message;

      switch (notification_type) {
        case 'success':
          showSuccess(`${title}: ${text}`);
          break;
        case 'error':
          showError(`${title}: ${text}`);
          break;
        case 'warning':
          showWarning(`${title}: ${text}`);
          break;
        default:
          showInfo(`${title}: ${text}`);
      }
    });

    const unsubscribeError = websocketClient.on('error', (message) => {
      console.error('WebSocket error:', message);
      setIsConnected(false);
    });

    const checkConnection = setInterval(() => {
      setIsConnected(websocketClient.isConnected());
    }, 5000);

    return () => {
      unsubscribeConnection();
      unsubscribeNotification();
      unsubscribeError();
      clearInterval(checkConnection);
    };
  }, [user, showInfo, showError, showSuccess, showWarning]);

  const subscribe = (rooms: string[]) => {
    websocketClient.subscribe(rooms);
  };

  const unsubscribe = (rooms: string[]) => {
    websocketClient.unsubscribe(rooms);
  };

  const sendTyping = (room: string, isTyping: boolean) => {
    websocketClient.sendTyping(room, isTyping);
  };

  const updatePresence = (status: 'online' | 'away' | 'busy') => {
    websocketClient.updatePresence(status);
  };

  const getOnlineUsers = (userIds: number[]) => {
    websocketClient.getOnlineUsers(userIds);
  };

  const getUserPresence = (userId: number) => {
    websocketClient.getUserPresence(userId);
  };

  const onMessage = (type: WebSocketMessageType, handler: (message: WebSocketMessage) => void) => {
    return websocketClient.on(type, handler);
  };

  return (
    <WebSocketContext.Provider
      value={{
        isConnected,
        subscribe,
        unsubscribe,
        sendTyping,
        updatePresence,
        getOnlineUsers,
        getUserPresence,
        onMessage,
      }}
    >
      {children}
    </WebSocketContext.Provider>
  );
};

export const useWebSocket = (): WebSocketContextType => {
  const context = useContext(WebSocketContext);
  if (!context) {
    throw new Error('useWebSocket must be used within a WebSocketProvider');
  }
  return context;
};
