import { useState, useCallback, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { chatbotApi } from '../api/chatbot';
import type { Message, ConversationHistory, ContextualSuggestion } from '../types/chatbot';

export const useChatbot = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [isMinimized, setIsMinimized] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);
  const [isTyping, setIsTyping] = useState(false);
  const [selectedLanguage, setSelectedLanguage] = useState('en');
  const [conversations, setConversations] = useState<ConversationHistory[]>([]);
  const [contextualSuggestions, setContextualSuggestions] = useState<ContextualSuggestion[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);

  const location = useLocation();

  const loadContextualSuggestions = useCallback(async () => {
    try {
      const suggestions = await chatbotApi.getContextualSuggestions(location.pathname);
      setContextualSuggestions(
        suggestions.map((text, index) => ({
          id: `suggestion-${index}`,
          text,
          page: location.pathname,
        }))
      );
    } catch (error) {
      console.error('Failed to load contextual suggestions:', error);
    }
  }, [location.pathname]);

  const loadConversationHistory = useCallback(async () => {
    try {
      const history = await chatbotApi.getConversationHistory();
      setConversations(history);
    } catch (error) {
      console.error('Failed to load conversation history:', error);
    }
  }, []);

  const sendMessage = useCallback(
    async (content: string, imageFile?: File) => {
      if (!content.trim() && !imageFile) return;

      const userMessage: Message = {
        id: Date.now().toString(),
        content: imageFile ? `[Image] ${content}` : content,
        role: 'user',
        timestamp: new Date(),
        type: imageFile ? 'image' : 'text',
      };

      setMessages((prev) => [...prev, userMessage]);
      setIsTyping(true);

      try {
        let imageUrl: string | undefined;
        let extractedText: string | undefined;

        if (imageFile) {
          const imageResponse = await chatbotApi.uploadImage(imageFile);
          imageUrl = imageResponse.imageUrl;
          extractedText = imageResponse.extractedText;
        }

        const context = {
          page: location.pathname,
          language: selectedLanguage,
          hasImage: !!imageFile,
          extractedText,
        };

        const response = await chatbotApi.sendMessage(content || 'Analyze this image', context);

        const botMessage: Message = {
          id: (Date.now() + 1).toString(),
          content: response.message,
          role: 'bot',
          timestamp: new Date(),
          type: 'text',
          imageUrl,
        };

        setMessages((prev) => [...prev, botMessage]);

        if (!isOpen || isMinimized) {
          setUnreadCount((prev) => prev + 1);
        }
      } catch (error) {
        console.error('Failed to send message:', error);
        const errorMessage: Message = {
          id: (Date.now() + 1).toString(),
          content: 'Sorry, I encountered an error. Please try again.',
          role: 'bot',
          timestamp: new Date(),
          type: 'text',
        };
        setMessages((prev) => [...prev, errorMessage]);
      } finally {
        setIsTyping(false);
      }
    },
    [location.pathname, selectedLanguage, isOpen, isMinimized]
  );

  const clearMessages = useCallback(() => {
    setMessages([]);
  }, []);

  const toggleOpen = useCallback(() => {
    setIsOpen((prev) => !prev);
    setIsMinimized(false);
    setUnreadCount(0);
  }, []);

  const toggleMinimize = useCallback(() => {
    setIsMinimized((prev) => !prev);
  }, []);

  const deleteConversation = useCallback((id: string) => {
    setConversations((prev) => prev.filter((conv) => conv.id !== id));
  }, []);

  useEffect(() => {
    if (isOpen && messages.length === 0) {
      const welcomeMessage: Message = {
        id: Date.now().toString(),
        content: "Hello! I'm your AI assistant. How can I help you today?",
        role: 'bot',
        timestamp: new Date(),
        type: 'text',
      };
      setMessages([welcomeMessage]);
    }
  }, [isOpen, messages.length]);

  useEffect(() => {
    if (isOpen) {
      loadContextualSuggestions();
    }
  }, [isOpen, loadContextualSuggestions]);

  return {
    isOpen,
    isMinimized,
    messages,
    isTyping,
    selectedLanguage,
    conversations,
    contextualSuggestions,
    unreadCount,
    setSelectedLanguage,
    sendMessage,
    clearMessages,
    toggleOpen,
    toggleMinimize,
    loadConversationHistory,
    deleteConversation,
  };
};
