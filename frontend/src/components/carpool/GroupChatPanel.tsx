import React, { useState, useRef, useEffect } from 'react';
import { Box, Paper, TextField, IconButton, Avatar, Typography, Chip } from '@mui/material';
import { Send, AttachFile, Announcement } from '@mui/icons-material';
import { format } from 'date-fns';

interface GroupChatPanelProps {
  groupId: number;
}

interface ChatMessage {
  id: number;
  sender_id: number;
  sender_name: string;
  content: string;
  message_type: 'text' | 'announcement' | 'alert';
  created_at: string;
  is_read: boolean;
}

const mockMessages: ChatMessage[] = [
  {
    id: 1,
    sender_id: 1,
    sender_name: 'Sarah Johnson',
    content: "Hi everyone! Just wanted to confirm tomorrow's pickup time at 7:30 AM.",
    message_type: 'text',
    created_at: '2024-03-15T09:30:00Z',
    is_read: true,
  },
  {
    id: 2,
    sender_id: 2,
    sender_name: 'Michael Chen',
    content: "Perfect! I'll be ready. Thanks for coordinating.",
    message_type: 'text',
    created_at: '2024-03-15T09:45:00Z',
    is_read: true,
  },
  {
    id: 3,
    sender_id: 3,
    sender_name: 'Jessica Martinez',
    content: 'IMPORTANT: School schedule changed for Friday - early dismissal at 2:00 PM',
    message_type: 'announcement',
    created_at: '2024-03-15T14:20:00Z',
    is_read: false,
  },
];

const GroupChatPanel: React.FC<GroupChatPanelProps> = () => {
  const [messages, setMessages] = useState<ChatMessage[]>(mockMessages);
  const [newMessage, setNewMessage] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const currentUserId = 1;

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSendMessage = () => {
    if (!newMessage.trim()) return;

    const message: ChatMessage = {
      id: messages.length + 1,
      sender_id: currentUserId,
      sender_name: 'You',
      content: newMessage,
      message_type: 'text',
      created_at: new Date().toISOString(),
      is_read: true,
    };

    setMessages([...messages, message]);
    setNewMessage('');
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', height: 500 }}>
      <Paper
        sx={{
          flex: 1,
          overflow: 'auto',
          p: 2,
          bgcolor: 'grey.50',
          display: 'flex',
          flexDirection: 'column',
          gap: 2,
        }}
      >
        {messages.map((message) => {
          const isOwnMessage = message.sender_id === currentUserId;
          const messageDate = new Date(message.created_at);

          return (
            <Box
              key={message.id}
              sx={{
                display: 'flex',
                justifyContent: isOwnMessage ? 'flex-end' : 'flex-start',
              }}
            >
              <Box sx={{ display: 'flex', gap: 1, maxWidth: '70%' }}>
                {!isOwnMessage && (
                  <Avatar sx={{ width: 32, height: 32 }}>{message.sender_name.charAt(0)}</Avatar>
                )}

                <Box>
                  {!isOwnMessage && (
                    <Typography variant="caption" color="text.secondary" display="block">
                      {message.sender_name}
                    </Typography>
                  )}

                  <Paper
                    sx={{
                      p: 1.5,
                      bgcolor: isOwnMessage ? 'primary.main' : 'white',
                      color: isOwnMessage ? 'white' : 'text.primary',
                    }}
                  >
                    {message.message_type === 'announcement' && (
                      <Chip
                        label="Important"
                        icon={<Announcement />}
                        size="small"
                        color="warning"
                        sx={{ mb: 1 }}
                      />
                    )}

                    <Typography variant="body2" sx={{ whiteSpace: 'pre-wrap' }}>
                      {message.content}
                    </Typography>

                    <Typography
                      variant="caption"
                      sx={{
                        display: 'block',
                        mt: 0.5,
                        opacity: 0.8,
                      }}
                    >
                      {format(messageDate, 'h:mm a')}
                    </Typography>
                  </Paper>
                </Box>
              </Box>
            </Box>
          );
        })}
        <div ref={messagesEndRef} />
      </Paper>

      <Paper sx={{ p: 2 }}>
        <Box sx={{ display: 'flex', gap: 1, alignItems: 'flex-end' }}>
          <IconButton component="label">
            <AttachFile />
            <input type="file" hidden multiple />
          </IconButton>

          <TextField
            fullWidth
            multiline
            maxRows={4}
            placeholder="Type a message..."
            value={newMessage}
            onChange={(e) => setNewMessage(e.target.value)}
            onKeyPress={handleKeyPress}
            size="small"
          />

          <IconButton color="primary" onClick={handleSendMessage} disabled={!newMessage.trim()}>
            <Send />
          </IconButton>
        </Box>
      </Paper>
    </Box>
  );
};

export default GroupChatPanel;
