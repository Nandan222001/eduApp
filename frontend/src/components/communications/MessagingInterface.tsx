import React, { useState } from 'react';
import {
  Box,
  Paper,
  TextField,
  IconButton,
  Typography,
  Avatar,
  List,
  ListItem,
  ListItemAvatar,
  ListItemText,
  Divider,
  InputAdornment,
  CircularProgress,
  Alert,
  Badge,
} from '@mui/material';
import { Send as SendIcon, Search as SearchIcon } from '@mui/icons-material';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { communicationsApi } from '@/api/communications';
import type { Message, MessageCreate } from '@/types/communications';
import { formatDistanceToNow } from 'date-fns';

interface ConversationListItemProps {
  message: Message;
  selected: boolean;
  onClick: () => void;
}

const ConversationListItem: React.FC<ConversationListItemProps> = ({
  message,
  selected,
  onClick,
}) => {
  const otherUser = message.sender_id !== message.recipient_id ? message.sender : message.recipient;
  const displayName = otherUser ? `${otherUser.first_name} ${otherUser.last_name}` : 'Unknown User';

  return (
    <ListItem
      button
      selected={selected}
      onClick={onClick}
      sx={{
        '&.Mui-selected': {
          backgroundColor: 'action.selected',
        },
      }}
    >
      <ListItemAvatar>
        <Badge color="error" variant="dot" invisible={message.is_read} overlap="circular">
          <Avatar>{displayName.charAt(0)}</Avatar>
        </Badge>
      </ListItemAvatar>
      <ListItemText
        primary={
          <Box display="flex" justifyContent="space-between" alignItems="center">
            <Typography variant="subtitle2" fontWeight={message.is_read ? 400 : 600}>
              {displayName}
            </Typography>
            <Typography variant="caption" color="text.secondary">
              {formatDistanceToNow(new Date(message.created_at), { addSuffix: true })}
            </Typography>
          </Box>
        }
        secondary={
          <Typography
            variant="body2"
            color="text.secondary"
            noWrap
            fontWeight={message.is_read ? 400 : 500}
          >
            {message.subject || message.content}
          </Typography>
        }
      />
    </ListItem>
  );
};

interface MessageBubbleProps {
  message: Message;
  isSent: boolean;
}

const MessageBubble: React.FC<MessageBubbleProps> = ({ message, isSent }) => {
  return (
    <Box
      sx={{
        display: 'flex',
        justifyContent: isSent ? 'flex-end' : 'flex-start',
        mb: 2,
      }}
    >
      <Box
        sx={{
          maxWidth: '70%',
          backgroundColor: isSent ? 'primary.main' : 'grey.200',
          color: isSent ? 'primary.contrastText' : 'text.primary',
          borderRadius: 2,
          px: 2,
          py: 1,
        }}
      >
        {message.subject && (
          <Typography variant="subtitle2" fontWeight={600} gutterBottom>
            {message.subject}
          </Typography>
        )}
        <Typography variant="body2">{message.content}</Typography>
        <Typography
          variant="caption"
          sx={{
            display: 'block',
            mt: 0.5,
            opacity: 0.7,
          }}
        >
          {formatDistanceToNow(new Date(message.created_at), { addSuffix: true })}
        </Typography>
      </Box>
    </Box>
  );
};

interface MessagingInterfaceProps {
  currentUserId?: number;
}

export const MessagingInterface: React.FC<MessagingInterfaceProps> = ({ currentUserId }) => {
  const queryClient = useQueryClient();
  const [selectedConversationUserId, setSelectedConversationUserId] = useState<number | null>(null);
  const [messageContent, setMessageContent] = useState('');
  const [searchQuery, setSearchQuery] = useState('');

  const { data: inbox = [], isLoading: inboxLoading } = useQuery({
    queryKey: ['messages', 'inbox'],
    queryFn: () => communicationsApi.getInbox(),
  });

  const { data: conversation = [], isLoading: conversationLoading } = useQuery({
    queryKey: ['messages', 'conversation', selectedConversationUserId],
    queryFn: () => communicationsApi.getConversation(selectedConversationUserId!),
    enabled: !!selectedConversationUserId,
  });

  const { data: unreadCount = 0 } = useQuery({
    queryKey: ['messages', 'unread-count'],
    queryFn: () => communicationsApi.getUnreadCount(),
    refetchInterval: 30000,
  });

  const sendMutation = useMutation({
    mutationFn: (data: MessageCreate) => communicationsApi.sendMessage(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['messages'] });
      setMessageContent('');
    },
  });

  const markReadMutation = useMutation({
    mutationFn: (id: number) => communicationsApi.markMessageRead(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['messages'] });
    },
  });

  const handleSelectConversation = (message: Message) => {
    const otherUserId =
      message.sender_id === currentUserId ? message.recipient_id : message.sender_id;
    setSelectedConversationUserId(otherUserId);

    if (!message.is_read && message.recipient_id === currentUserId) {
      markReadMutation.mutate(message.id);
    }
  };

  const handleSendMessage = () => {
    if (!messageContent.trim() || !selectedConversationUserId) return;

    sendMutation.mutate({
      recipient_id: selectedConversationUserId,
      content: messageContent,
    });
  };

  const filteredInbox = searchQuery
    ? inbox.filter((msg) => {
        const otherUser = msg.sender_id === currentUserId ? msg.recipient : msg.sender;
        const name = otherUser
          ? `${otherUser.first_name} ${otherUser.last_name}`.toLowerCase()
          : '';
        const content = `${msg.subject || ''} ${msg.content}`.toLowerCase();
        return (
          name.includes(searchQuery.toLowerCase()) || content.includes(searchQuery.toLowerCase())
        );
      })
    : inbox;

  return (
    <Box sx={{ display: 'flex', height: '600px', border: 1, borderColor: 'divider' }}>
      <Paper
        sx={{
          width: 350,
          borderRight: 1,
          borderColor: 'divider',
          display: 'flex',
          flexDirection: 'column',
        }}
      >
        <Box sx={{ p: 2 }}>
          <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
            <Typography variant="h6">Messages</Typography>
            {unreadCount > 0 && (
              <Badge badgeContent={unreadCount} color="error">
                <Typography variant="body2">Unread</Typography>
              </Badge>
            )}
          </Box>
          <TextField
            fullWidth
            size="small"
            placeholder="Search messages..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <SearchIcon />
                </InputAdornment>
              ),
            }}
          />
        </Box>
        <Divider />
        <Box sx={{ flex: 1, overflow: 'auto' }}>
          {inboxLoading ? (
            <Box display="flex" justifyContent="center" py={4}>
              <CircularProgress />
            </Box>
          ) : filteredInbox.length === 0 ? (
            <Box p={2}>
              <Alert severity="info">No messages found</Alert>
            </Box>
          ) : (
            <List disablePadding>
              {filteredInbox.map((message, index) => (
                <React.Fragment key={message.id}>
                  {index > 0 && <Divider />}
                  <ConversationListItem
                    message={message}
                    selected={
                      (message.sender_id === currentUserId
                        ? message.recipient_id
                        : message.sender_id) === selectedConversationUserId
                    }
                    onClick={() => handleSelectConversation(message)}
                  />
                </React.Fragment>
              ))}
            </List>
          )}
        </Box>
      </Paper>

      <Box sx={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
        {selectedConversationUserId ? (
          <>
            <Box
              sx={{
                p: 2,
                borderBottom: 1,
                borderColor: 'divider',
                backgroundColor: 'background.paper',
              }}
            >
              <Typography variant="h6">
                {(() => {
                  const selectedMessage = inbox.find(
                    (msg) =>
                      (msg.sender_id === currentUserId ? msg.recipient_id : msg.sender_id) ===
                      selectedConversationUserId
                  );
                  if (!selectedMessage) return 'Conversation';
                  const otherUser =
                    selectedMessage.sender_id === currentUserId
                      ? selectedMessage.recipient
                      : selectedMessage.sender;
                  return otherUser ? `${otherUser.first_name} ${otherUser.last_name}` : 'User';
                })()}
              </Typography>
            </Box>

            <Box sx={{ flex: 1, overflow: 'auto', p: 2, backgroundColor: 'grey.50' }}>
              {conversationLoading ? (
                <Box display="flex" justifyContent="center" py={4}>
                  <CircularProgress />
                </Box>
              ) : (
                conversation.map((message) => (
                  <MessageBubble
                    key={message.id}
                    message={message}
                    isSent={message.sender_id === currentUserId}
                  />
                ))
              )}
            </Box>

            <Box
              sx={{
                p: 2,
                borderTop: 1,
                borderColor: 'divider',
                backgroundColor: 'background.paper',
              }}
            >
              {sendMutation.isError && (
                <Alert severity="error" sx={{ mb: 2 }}>
                  Failed to send message
                </Alert>
              )}
              <Box display="flex" gap={1}>
                <TextField
                  fullWidth
                  multiline
                  maxRows={4}
                  placeholder="Type a message..."
                  value={messageContent}
                  onChange={(e) => setMessageContent(e.target.value)}
                  onKeyPress={(e) => {
                    if (e.key === 'Enter' && !e.shiftKey) {
                      e.preventDefault();
                      handleSendMessage();
                    }
                  }}
                />
                <IconButton
                  color="primary"
                  onClick={handleSendMessage}
                  disabled={!messageContent.trim()}
                >
                  <SendIcon />
                </IconButton>
              </Box>
            </Box>
          </>
        ) : (
          <Box
            sx={{
              flex: 1,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: 'text.secondary',
            }}
          >
            <Typography variant="body1">Select a conversation to start messaging</Typography>
          </Box>
        )}
      </Box>
    </Box>
  );
};
