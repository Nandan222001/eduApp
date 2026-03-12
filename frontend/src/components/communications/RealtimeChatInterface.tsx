import { useState, useRef, useEffect } from 'react';
import {
  Box,
  Paper,
  TextField,
  IconButton,
  List,
  ListItem,
  Typography,
  Avatar,
  Divider,
} from '@mui/material';
import { Send } from '@mui/icons-material';
import { useRealtimeChat } from '@/hooks/useRealtimeChat';
import { TypingIndicator } from '@/components/common/TypingIndicator';
import { OnlinePresenceIndicator } from '@/components/common/OnlinePresenceIndicator';
import { useAuth } from '@/hooks/useAuth';

interface RealtimeChatInterfaceProps {
  room: string;
  title: string;
  onSendMessage: (message: string) => Promise<void>;
  participants?: Array<{ id: number; name: string }>;
}

export const RealtimeChatInterface = ({
  room,
  title,
  onSendMessage,
  participants = [],
}: RealtimeChatInterfaceProps) => {
  const [message, setMessage] = useState('');
  const [isSending, setIsSending] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const { messages, typingUsers, sendTyping, stopTyping } = useRealtimeChat(room);
  const { user } = useAuth();

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSendMessage = async () => {
    if (!message.trim() || isSending) return;

    setIsSending(true);
    try {
      await onSendMessage(message);
      setMessage('');
      stopTyping();
    } catch (error) {
      console.error('Failed to send message:', error);
    } finally {
      setIsSending(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setMessage(e.target.value);
    if (e.target.value.length > 0) {
      sendTyping();
    }
  };

  const typingUserNames = typingUsers
    .map((userId) => participants.find((p) => p.id === userId)?.name || 'Someone')
    .filter(Boolean);

  return (
    <Paper elevation={3} sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
      <Box sx={{ p: 2, borderBottom: 1, borderColor: 'divider' }}>
        <Typography variant="h6">{title}</Typography>
        <Box sx={{ display: 'flex', gap: 1, mt: 1, flexWrap: 'wrap' }}>
          {participants.map((participant) => (
            <Box key={participant.id} sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
              <OnlinePresenceIndicator userId={participant.id} size="small" />
              <Typography variant="caption">{participant.name}</Typography>
            </Box>
          ))}
        </Box>
      </Box>

      <List sx={{ flex: 1, overflow: 'auto', p: 2 }}>
        {messages.map((msg, index) => {
          const isOwnMessage = msg.sender_id === Number(user?.id);
          return (
            <ListItem
              key={index}
              sx={{
                flexDirection: 'column',
                alignItems: isOwnMessage ? 'flex-end' : 'flex-start',
                py: 1,
              }}
            >
              <Box
                sx={{
                  display: 'flex',
                  alignItems: 'flex-start',
                  gap: 1,
                  maxWidth: '70%',
                  flexDirection: isOwnMessage ? 'row-reverse' : 'row',
                }}
              >
                <Avatar sx={{ width: 32, height: 32 }}>
                  {msg.sender_name.charAt(0).toUpperCase()}
                </Avatar>
                <Paper
                  elevation={1}
                  sx={{
                    p: 1.5,
                    backgroundColor: isOwnMessage ? 'primary.main' : 'grey.100',
                    color: isOwnMessage ? 'primary.contrastText' : 'text.primary',
                  }}
                >
                  <Typography variant="caption" sx={{ fontWeight: 'bold', display: 'block' }}>
                    {msg.sender_name}
                  </Typography>
                  <Typography variant="body2">{msg.message}</Typography>
                  {msg.timestamp && (
                    <Typography variant="caption" sx={{ opacity: 0.7, mt: 0.5, display: 'block' }}>
                      {new Date(msg.timestamp).toLocaleTimeString()}
                    </Typography>
                  )}
                </Paper>
              </Box>
            </ListItem>
          );
        })}
        <div ref={messagesEndRef} />
      </List>

      {typingUserNames.length > 0 && <TypingIndicator userNames={typingUserNames} />}

      <Divider />

      <Box sx={{ p: 2, display: 'flex', gap: 1 }}>
        <TextField
          fullWidth
          multiline
          maxRows={3}
          placeholder="Type a message..."
          value={message}
          onChange={handleInputChange}
          onKeyPress={handleKeyPress}
          disabled={isSending}
          size="small"
        />
        <IconButton
          color="primary"
          onClick={handleSendMessage}
          disabled={!message.trim() || isSending}
        >
          <Send />
        </IconButton>
      </Box>
    </Paper>
  );
};
