export interface Message {
  id: string;
  content: string;
  role: 'user' | 'bot';
  timestamp: Date;
  type?: 'text' | 'image' | 'suggestion';
  imageUrl?: string;
  metadata?: Record<string, unknown>;
}

export interface QuickReply {
  id: string;
  label: string;
  value: string;
  category?: 'homework' | 'exam' | 'schedule' | 'grades' | 'general';
}

export interface ContextualSuggestion {
  id: string;
  text: string;
  icon?: string;
  page: string;
}

export interface ConversationHistory {
  id: string;
  title: string;
  lastMessage: string;
  timestamp: Date;
  messageCount: number;
}

export interface ChatbotState {
  isOpen: boolean;
  isMinimized: boolean;
  isTyping: boolean;
  isRecording: boolean;
  messages: Message[];
  selectedLanguage: string;
  currentPage: string;
  contextualSuggestions: ContextualSuggestion[];
}

export interface VoiceRecordingState {
  isRecording: boolean;
  duration: number;
  audioBlob: Blob | null;
}

export interface ChatResponse {
  message: string;
  suggestions?: string[];
  metadata?: Record<string, unknown>;
}

export interface ImageUploadResponse {
  imageUrl: string;
  extractedText?: string;
  analysis?: string;
}
