import { env } from '@/config/env';
import { tokenManager } from './tokenManager';

export type WebSocketMessageType =
  | 'connection'
  | 'disconnection'
  | 'error'
  | 'notification'
  | 'new_message'
  | 'new_announcement'
  | 'typing'
  | 'typing_indicator'
  | 'chat_message'
  | 'presence_update'
  | 'online_users'
  | 'user_presence'
  | 'attendance_update'
  | 'grade_update'
  | 'assignment_update'
  | 'quiz_leaderboard_update'
  | 'leaderboard_update'
  | 'study_group_update';

export interface WebSocketMessage {
  type: WebSocketMessageType;
  [key: string]: unknown;
}

type MessageHandler = (message: WebSocketMessage) => void;

class WebSocketClient {
  private ws: WebSocket | null = null;
  private reconnectAttempts = 0;
  private maxReconnectAttempts = 5;
  private reconnectDelay = 1000;
  private messageHandlers: Map<WebSocketMessageType, Set<MessageHandler>> = new Map();
  private heartbeatInterval: ReturnType<typeof setInterval> | null = null;
  private reconnectTimeout: ReturnType<typeof setTimeout> | null = null;

  connect(): void {
    const wsUrl = env.apiBaseUrl.replace(/^http/, 'ws');
    const token = tokenManager.getAccessToken();

    if (!token) {
      console.warn('No access token available for WebSocket connection');
      return;
    }

    try {
      this.ws = new WebSocket(`${wsUrl}/ws?token=${token}`);

      this.ws.onopen = () => {
        console.log('WebSocket connected');
        this.reconnectAttempts = 0;
        this.startHeartbeat();
        this.emit('connection', { type: 'connection', status: 'connected' });
      };

      this.ws.onmessage = (event) => {
        try {
          const message = JSON.parse(event.data) as WebSocketMessage;
          this.handleMessage(message);
        } catch (error) {
          console.error('Error parsing WebSocket message:', error);
        }
      };

      this.ws.onerror = (error) => {
        console.error('WebSocket error:', error);
        this.emit('error', { type: 'error', error });
      };

      this.ws.onclose = () => {
        console.log('WebSocket disconnected');
        this.stopHeartbeat();
        this.emit('disconnection', { type: 'disconnection', status: 'disconnected' });
        this.attemptReconnect();
      };
    } catch (error) {
      console.error('Error creating WebSocket connection:', error);
      this.attemptReconnect();
    }
  }

  disconnect(): void {
    if (this.reconnectTimeout) {
      clearTimeout(this.reconnectTimeout);
      this.reconnectTimeout = null;
    }

    this.stopHeartbeat();

    if (this.ws) {
      this.ws.close();
      this.ws = null;
    }

    this.reconnectAttempts = 0;
  }

  private attemptReconnect(): void {
    if (this.reconnectAttempts >= this.maxReconnectAttempts) {
      console.error('Max reconnection attempts reached');
      return;
    }

    this.reconnectAttempts++;
    const delay = this.reconnectDelay * Math.pow(2, this.reconnectAttempts - 1);

    console.log(`Attempting to reconnect in ${delay}ms (attempt ${this.reconnectAttempts})`);

    this.reconnectTimeout = setTimeout(() => {
      this.connect();
    }, delay);
  }

  private startHeartbeat(): void {
    this.heartbeatInterval = setInterval(() => {
      if (this.ws?.readyState === WebSocket.OPEN) {
        this.send({ type: 'ping' });
      }
    }, 30000);
  }

  private stopHeartbeat(): void {
    if (this.heartbeatInterval) {
      clearInterval(this.heartbeatInterval);
      this.heartbeatInterval = null;
    }
  }

  private handleMessage(message: WebSocketMessage): void {
    this.emit(message.type, message);
  }

  private emit(type: WebSocketMessageType, message: WebSocketMessage): void {
    const handlers = this.messageHandlers.get(type);
    if (handlers) {
      handlers.forEach((handler) => {
        try {
          handler(message);
        } catch (error) {
          console.error(`Error in WebSocket handler for ${type}:`, error);
        }
      });
    }
  }

  send(data: Record<string, unknown>): void {
    if (this.ws?.readyState === WebSocket.OPEN) {
      this.ws.send(JSON.stringify(data));
    } else {
      console.warn('WebSocket is not connected');
    }
  }

  on(type: WebSocketMessageType, handler: MessageHandler): () => void {
    if (!this.messageHandlers.has(type)) {
      this.messageHandlers.set(type, new Set());
    }

    this.messageHandlers.get(type)!.add(handler);

    return () => {
      const handlers = this.messageHandlers.get(type);
      if (handlers) {
        handlers.delete(handler);
        if (handlers.size === 0) {
          this.messageHandlers.delete(type);
        }
      }
    };
  }

  off(type: WebSocketMessageType, handler?: MessageHandler): void {
    if (handler) {
      const handlers = this.messageHandlers.get(type);
      if (handlers) {
        handlers.delete(handler);
        if (handlers.size === 0) {
          this.messageHandlers.delete(type);
        }
      }
    } else {
      this.messageHandlers.delete(type);
    }
  }

  subscribe(rooms: string[]): void {
    this.send({
      type: 'subscribe',
      rooms,
    });
  }

  unsubscribe(rooms: string[]): void {
    this.send({
      type: 'unsubscribe',
      rooms,
    });
  }

  sendTyping(room: string, isTyping: boolean): void {
    this.send({
      type: 'typing',
      room,
      is_typing: isTyping,
    });
  }

  updatePresence(status: 'online' | 'away' | 'busy'): void {
    this.send({
      type: 'presence',
      status,
    });
  }

  getOnlineUsers(userIds: number[]): void {
    this.send({
      type: 'get_online_users',
      user_ids: userIds,
    });
  }

  getUserPresence(userId: number): void {
    this.send({
      type: 'get_user_presence',
      user_id: userId,
    });
  }

  isConnected(): boolean {
    return this.ws?.readyState === WebSocket.OPEN;
  }

  getReadyState(): number {
    return this.ws?.readyState ?? WebSocket.CLOSED;
  }
}

export const websocketClient = new WebSocketClient();
