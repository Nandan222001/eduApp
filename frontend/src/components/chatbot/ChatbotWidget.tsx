import React, { useState, useRef, useEffect } from 'react';
import {
  Box,
  Paper,
  IconButton,
  TextField,
  Typography,
  Tooltip,
  Badge,
  Tabs,
  Tab,
  Divider,
  Fab,
} from '@mui/material';
import { Close, Minimize, Send, SmartToy, AttachFile, Delete } from '@mui/icons-material';
import { ChatMessage } from './ChatMessage';
import { TypingIndicator } from './TypingIndicator';
import { QuickReplies } from './QuickReplies';
import { VoiceRecorder } from './VoiceRecorder';
import { ImageUploader } from './ImageUploader';
import { LanguageSelector } from './LanguageSelector';
import { ConversationHistoryList } from './ConversationHistoryList';
import { ContextualHelp } from './ContextualHelp';
import { chatbotApi } from '../../api/chatbot';
import type { Message, ConversationHistory, ContextualSuggestion } from '../../types/chatbot';
import { useLocation } from 'react-router-dom';

interface TabPanelProps {
  children?: React.ReactNode;
  index: number;
  value: number;
}

function TabPanel(props: TabPanelProps) {
  const { children, value, index, ...other } = props;

  return (
    <div
      role="tabpanel"
      hidden={value !== index}
      id={`chatbot-tabpanel-${index}`}
      aria-labelledby={`chatbot-tab-${index}`}
      {...other}
      style={{
        height: '100%',
        display: value === index ? 'flex' : 'none',
        flexDirection: 'column',
      }}
    >
      {value === index && children}
    </div>
  );
}

export const ChatbotWidget: React.FC = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [isMinimized, setIsMinimized] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputValue, setInputValue] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [selectedLanguage, setSelectedLanguage] = useState('en');
  const [selectedImage, setSelectedImage] = useState<File | null>(null);
  const [tabValue, setTabValue] = useState(0);
  const [conversations, setConversations] = useState<ConversationHistory[]>([]);
  const [contextualSuggestions, setContextualSuggestions] = useState<ContextualSuggestion[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const location = useLocation();

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
    scrollToBottom();
  }, [messages]);

  useEffect(() => {
    const loadContextualSuggestions = async () => {
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
    };

    if (isOpen) {
      loadContextualSuggestions();
    }
  }, [location.pathname, isOpen]);

  useEffect(() => {
    const loadHistory = async () => {
      try {
        const history = await chatbotApi.getConversationHistory();
        setConversations(history);
      } catch (error) {
        console.error('Failed to load conversation history:', error);
      }
    };

    if (isOpen && tabValue === 1) {
      loadHistory();
    }
  }, [isOpen, tabValue]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const handleSendMessage = async (content: string, imageFile?: File) => {
    if (!content.trim() && !imageFile) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      content: imageFile ? `[Image] ${content}` : content,
      role: 'user',
      timestamp: new Date(),
      type: imageFile ? 'image' : 'text',
    };

    setMessages((prev) => [...prev, userMessage]);
    setInputValue('');
    setSelectedImage(null);
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
  };

  const handleQuickReplySelect = (value: string) => {
    handleSendMessage(value);
  };

  const handleVoiceRecordingComplete = async (audioBlob: Blob) => {
    try {
      const result = await chatbotApi.uploadVoice(audioBlob);
      setInputValue(result.text);
    } catch (error) {
      console.error('Failed to convert voice to text:', error);
    }
  };

  const handleImageSelect = (file: File) => {
    setSelectedImage(file);
  };

  const handleClearImage = () => {
    setSelectedImage(null);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    handleSendMessage(inputValue, selectedImage || undefined);
  };

  const handleClearChat = () => {
    setMessages([]);
  };

  const handleConversationSelect = (id: string) => {
    console.log('Load conversation:', id);
  };

  const handleConversationDelete = async (id: string) => {
    setConversations((prev) => prev.filter((conv) => conv.id !== id));
  };

  const toggleOpen = () => {
    setIsOpen(!isOpen);
    setIsMinimized(false);
    if (!isOpen) {
      setUnreadCount(0);
    }
  };

  const toggleMinimize = () => {
    setIsMinimized(!isMinimized);
  };

  if (!isOpen) {
    return (
      <Fab
        color="primary"
        aria-label="Open AI Assistant"
        onClick={toggleOpen}
        sx={{
          position: 'fixed',
          bottom: 24,
          right: 24,
          zIndex: 1300,
        }}
      >
        <Badge badgeContent={unreadCount} color="error">
          <SmartToy />
        </Badge>
      </Fab>
    );
  }

  return (
    <Paper
      elevation={8}
      sx={{
        position: 'fixed',
        bottom: 24,
        right: 24,
        width: { xs: '90vw', sm: 400 },
        height: isMinimized ? 'auto' : { xs: '80vh', sm: 600 },
        zIndex: 1300,
        display: 'flex',
        flexDirection: 'column',
        overflow: 'hidden',
        transition: 'height 0.3s ease-in-out',
      }}
    >
      <Box
        sx={{
          bgcolor: 'primary.main',
          color: 'primary.contrastText',
          p: 1.5,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
        }}
      >
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <SmartToy />
          <Typography variant="subtitle1" fontWeight={600}>
            AI Assistant
          </Typography>
        </Box>
        <Box>
          <Tooltip title="Minimize">
            <IconButton size="small" onClick={toggleMinimize} sx={{ color: 'inherit' }}>
              <Minimize />
            </IconButton>
          </Tooltip>
          <Tooltip title="Close">
            <IconButton size="small" onClick={toggleOpen} sx={{ color: 'inherit' }}>
              <Close />
            </IconButton>
          </Tooltip>
        </Box>
      </Box>

      {!isMinimized && (
        <>
          <Box sx={{ borderBottom: 1, borderColor: 'divider' }}>
            <Tabs
              value={tabValue}
              onChange={(_, newValue) => setTabValue(newValue)}
              variant="fullWidth"
            >
              <Tab label="Chat" />
              <Tab label="History" />
            </Tabs>
          </Box>

          <TabPanel value={tabValue} index={0}>
            <Box
              sx={{
                flex: 1,
                overflowY: 'auto',
                p: 2,
                bgcolor: 'background.default',
              }}
            >
              {contextualSuggestions.length > 0 && (
                <ContextualHelp
                  suggestions={contextualSuggestions}
                  onSuggestionClick={handleQuickReplySelect}
                />
              )}

              {messages.map((message) => (
                <ChatMessage key={message.id} message={message} />
              ))}

              {isTyping && <TypingIndicator />}
              <div ref={messagesEndRef} />
            </Box>

            <Divider />

            <QuickReplies onSelect={handleQuickReplySelect} />

            <Box sx={{ p: 2, bgcolor: 'background.paper' }}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                <LanguageSelector value={selectedLanguage} onChange={setSelectedLanguage} />
                <Box sx={{ flex: 1 }} />
                <Tooltip title="Clear chat">
                  <IconButton size="small" onClick={handleClearChat}>
                    <Delete />
                  </IconButton>
                </Tooltip>
              </Box>

              {selectedImage && (
                <Box sx={{ mb: 1 }}>
                  <ImageUploader
                    onImageSelect={handleImageSelect}
                    selectedImage={selectedImage}
                    onClearImage={handleClearImage}
                  />
                </Box>
              )}

              <Box component="form" onSubmit={handleSubmit} sx={{ display: 'flex', gap: 1 }}>
                <Tooltip title="Attach image">
                  <IconButton
                    size="small"
                    component="label"
                    sx={{ alignSelf: 'flex-end', mb: 0.5 }}
                  >
                    <AttachFile />
                    <input
                      type="file"
                      hidden
                      accept="image/*"
                      onChange={(e) => {
                        const file = e.target.files?.[0];
                        if (file) handleImageSelect(file);
                      }}
                    />
                  </IconButton>
                </Tooltip>

                <VoiceRecorder onRecordingComplete={handleVoiceRecordingComplete} />

                <TextField
                  fullWidth
                  size="small"
                  placeholder="Type your message..."
                  value={inputValue}
                  onChange={(e) => setInputValue(e.target.value)}
                  multiline
                  maxRows={3}
                />

                <IconButton
                  type="submit"
                  color="primary"
                  disabled={!inputValue.trim() && !selectedImage}
                  sx={{ alignSelf: 'flex-end', mb: 0.5 }}
                >
                  <Send />
                </IconButton>
              </Box>
            </Box>
          </TabPanel>

          <TabPanel value={tabValue} index={1}>
            <Box sx={{ flex: 1, overflowY: 'auto' }}>
              <ConversationHistoryList
                conversations={conversations}
                onSelect={handleConversationSelect}
                onDelete={handleConversationDelete}
              />
            </Box>
          </TabPanel>
        </>
      )}
    </Paper>
  );
};
