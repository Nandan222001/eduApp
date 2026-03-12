import { io, Socket } from 'socket.io-client';

export enum WebSocketMessageType {
  MESSAGE = 'message',
  TYPING_START = 'typing_start',
  TYPING_STOP = 'typing_stop',
  USER_JOIN = 'user_join',
  USER_LEAVE = 'user_leave',
  PRESENCE_UPDATE = 'presence_update',
  ERROR = 'error',
}

export interface WebSocketMessage<T = unknown> {
  type: WebSocketMessageType;
  payload: T;
  timestamp?: number;
  userId?: string;
  roomId?: string;
}

export interface TypingIndicatorPayload {
  userId: string;
  username: string;
  roomId: string;
}

export interface PresenceUpdatePayload {
  userId: string;
  status: 'online' | 'offline' | 'away';
  timestamp: number;
}

export interface UserJoinPayload {
  userId: string;
  username: string;
  roomId: string;
}

export interface UserLeavePayload {
  userId: string;
  username: string;
  roomId: string;
}

type MessageHandler<T = unknown> = (message: WebSocketMessage<T>) => void;

export class WebSocketClient {
  private socket: Socket | null = null;
  private url: string;
  private isConnecting = false;
  private _isConnected = false;
  private messageHandlers: Map<WebSocketMessageType, Set<MessageHandler>> = new Map();
  private reconnectAttempts = 0;
  private maxReconnectAttempts = 5;
  private reconnectDelay = 1000;
  private currentRooms: Set<string> = new Set();

  constructor(url?: string) {
    this.url = url || import.meta.env.VITE_WEBSOCKET_URL || 'http://localhost:8000';
  }

  connect(token?: string): void {
    if (this._isConnected || this.isConnecting) {
      console.warn('WebSocket is already connected or connecting');
      return;
    }

    this.isConnecting = true;

    const options: Record<string, unknown> = {
      transports: ['websocket', 'polling'],
      reconnection: true,
      reconnectionAttempts: this.maxReconnectAttempts,
      reconnectionDelay: this.reconnectDelay,
      reconnectionDelayMax: 5000,
      timeout: 20000,
    };

    if (token) {
      options.auth = { token };
    }

    this.socket = io(this.url, options);

    this.socket.on('connect', () => {
      console.info('WebSocket connected');
      this._isConnected = true;
      this.isConnecting = false;
      this.reconnectAttempts = 0;

      this.currentRooms.forEach((room) => {
        this.socket?.emit('join_room', { roomId: room });
      });
    });

    this.socket.on('disconnect', (reason) => {
      console.info('WebSocket disconnected:', reason);
      this._isConnected = false;
      this.isConnecting = false;
    });

    this.socket.on('connect_error', (error) => {
      console.error('WebSocket connection error:', error);
      this.isConnecting = false;
      this.reconnectAttempts++;

      if (this.reconnectAttempts >= this.maxReconnectAttempts) {
        console.error('Max reconnection attempts reached');
        this.disconnect();
      }
    });

    this.socket.on('error', (error) => {
      console.error('WebSocket error:', error);
      const errorMessage: WebSocketMessage = {
        type: WebSocketMessageType.ERROR,
        payload: error,
        timestamp: Date.now(),
      };
      this.handleMessage(WebSocketMessageType.ERROR, errorMessage);
    });

    Object.values(WebSocketMessageType).forEach((messageType) => {
      this.socket?.on(messageType, (data: unknown) => {
        const message: WebSocketMessage = {
          type: messageType,
          payload: data,
          timestamp: Date.now(),
        };
        this.handleMessage(messageType, message);
      });
    });
  }

  disconnect(): void {
    if (!this.socket) {
      return;
    }

    this.currentRooms.clear();
    this.socket.disconnect();
    this.socket = null;
    this._isConnected = false;
    this.isConnecting = false;
    this.reconnectAttempts = 0;
    console.info('WebSocket disconnected manually');
  }

  subscribe<T = unknown>(
    messageType: WebSocketMessageType,
    handler: MessageHandler<T>
  ): () => void {
    if (!this.messageHandlers.has(messageType)) {
      this.messageHandlers.set(messageType, new Set());
    }

    this.messageHandlers.get(messageType)!.add(handler as MessageHandler);

    return () => {
      this.unsubscribe(messageType, handler);
    };
  }

  unsubscribe<T = unknown>(messageType: WebSocketMessageType, handler: MessageHandler<T>): void {
    const handlers = this.messageHandlers.get(messageType);
    if (handlers) {
      handlers.delete(handler as MessageHandler);
    }
  }

  joinRoom(roomId: string): void {
    if (!this.socket || !this._isConnected) {
      console.warn('WebSocket is not connected. Room will be joined after connection.');
      this.currentRooms.add(roomId);
      return;
    }

    this.currentRooms.add(roomId);
    this.socket.emit('join_room', { roomId });
    console.info(`Joined room: ${roomId}`);
  }

  leaveRoom(roomId: string): void {
    if (!this.socket || !this._isConnected) {
      this.currentRooms.delete(roomId);
      return;
    }

    this.currentRooms.delete(roomId);
    this.socket.emit('leave_room', { roomId });
    console.info(`Left room: ${roomId}`);
  }

  sendMessage<T = unknown>(messageType: WebSocketMessageType, payload: T, roomId?: string): void {
    if (!this.socket || !this._isConnected) {
      console.error('Cannot send message: WebSocket is not connected');
      return;
    }

    const message: WebSocketMessage<T> = {
      type: messageType,
      payload,
      timestamp: Date.now(),
      roomId,
    };

    this.socket.emit(messageType, message);
  }

  sendTypingIndicator(roomId: string, isTyping: boolean): void {
    if (!this.socket || !this._isConnected) {
      return;
    }

    const messageType = isTyping
      ? WebSocketMessageType.TYPING_START
      : WebSocketMessageType.TYPING_STOP;

    this.socket.emit(messageType, { roomId });
  }

  updatePresence(status: 'online' | 'offline' | 'away'): void {
    if (!this.socket || !this._isConnected) {
      console.warn('Cannot update presence: WebSocket is not connected');
      return;
    }

    const payload: PresenceUpdatePayload = {
      userId: '',
      status,
      timestamp: Date.now(),
    };

    this.socket.emit(WebSocketMessageType.PRESENCE_UPDATE, payload);
  }

  getConnectionStatus(): { isConnected: boolean; isConnecting: boolean } {
    return {
      isConnected: this._isConnected,
      isConnecting: this.isConnecting,
    };
  }

  getCurrentRooms(): string[] {
    return Array.from(this.currentRooms);
  }

  on<T = unknown>(
    messageType: WebSocketMessageType | string,
    handler: MessageHandler<T>
  ): () => void {
    if (
      typeof messageType === 'string' &&
      !Object.values(WebSocketMessageType).includes(messageType as WebSocketMessageType)
    ) {
      if (!this.socket) {
        console.warn('Cannot subscribe to custom event: WebSocket is not initialized');
        return () => {};
      }

      this.socket.on(messageType, (data: unknown) => {
        const message: WebSocketMessage = {
          type: messageType as WebSocketMessageType,
          payload: data,
          timestamp: Date.now(),
        };
        handler(message as WebSocketMessage<T>);
      });

      return () => {
        this.socket?.off(messageType);
      };
    }

    return this.subscribe(messageType as WebSocketMessageType, handler);
  }

  isConnected(): boolean {
    return this.getConnectionStatus().isConnected;
  }

  sendTyping(roomId: string, isTyping: boolean): void {
    this.sendTypingIndicator(roomId, isTyping);
  }

  getOnlineUsers(userIds?: number[]): void {
    if (!this.socket || !this._isConnected) {
      console.warn('Cannot get online users: WebSocket is not connected');
      return;
    }

    this.socket.emit('get_online_users', userIds ? { userIds } : undefined);
  }

  getUserPresence(userId: number | string): void {
    if (!this.socket || !this._isConnected) {
      console.warn('Cannot get user presence: WebSocket is not connected');
      return;
    }

    this.socket.emit('get_user_presence', { userId });
  }

  private handleMessage(messageType: WebSocketMessageType, message: WebSocketMessage): void {
    const handlers = this.messageHandlers.get(messageType);
    if (handlers && handlers.size > 0) {
      handlers.forEach((handler) => {
        try {
          handler(message);
        } catch (error) {
          console.error('Error handling message:', error);
        }
      });
    }
  }
}

export const websocketClient = new WebSocketClient();
