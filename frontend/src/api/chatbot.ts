import axios from 'axios';
import type { ChatResponse, ImageUploadResponse, ConversationHistory } from '../types/chatbot';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000';

export const chatbotApi = {
  sendMessage: async (
    message: string,
    context?: Record<string, unknown>
  ): Promise<ChatResponse> => {
    const response = await axios.post(`${API_BASE_URL}/api/v1/chatbot/message`, {
      message,
      context,
    });
    return response.data;
  },

  uploadImage: async (file: File): Promise<ImageUploadResponse> => {
    const formData = new FormData();
    formData.append('image', file);

    const response = await axios.post(`${API_BASE_URL}/api/v1/chatbot/upload-image`, formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    return response.data;
  },

  uploadVoice: async (audioBlob: Blob): Promise<{ text: string }> => {
    const formData = new FormData();
    formData.append('audio', audioBlob, 'voice.webm');

    const response = await axios.post(`${API_BASE_URL}/api/v1/chatbot/voice-to-text`, formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    return response.data;
  },

  getConversationHistory: async (): Promise<ConversationHistory[]> => {
    const response = await axios.get(`${API_BASE_URL}/api/v1/chatbot/history`);
    return response.data;
  },

  getContextualSuggestions: async (page: string): Promise<string[]> => {
    const response = await axios.get(`${API_BASE_URL}/api/v1/chatbot/suggestions`, {
      params: { page },
    });
    return response.data;
  },

  clearHistory: async (): Promise<void> => {
    await axios.delete(`${API_BASE_URL}/api/v1/chatbot/history`);
  },
};
