import React, { useState, useRef, useEffect } from 'react';
import {
  Box,
  Paper,
  TextField,
  IconButton,
  List,
  ListItem,
  ListItemAvatar,
  Avatar,
  Typography,
  Divider,
  Popover,
  Grid,
  alpha,
  useTheme,
} from '@mui/material';
import { Send as SendIcon, EmojiEmotions as EmojiIcon } from '@mui/icons-material';
import { ChatMessage } from '@/types/event';
import { format } from 'date-fns';

interface LiveEventChatProps {
  messages: ChatMessage[];
  onSendMessage: (message: string) => void;
  currentUserId?: number;
  height?: string | number;
}

const EMOJI_CATEGORIES = {
  reactions: ['👍', '❤️', '😂', '🎉', '👏', '🔥', '😮', '💯'],
  emotions: ['😀', '😃', '😄', '😁', '😊', '😍', '🥰', '😘'],
  gestures: ['👋', '✌️', '🤞', '🙌', '👐', '🤲', '🙏', '💪'],
  school: ['📚', '✏️', '📝', '🎓', '🏫', '📖', '🖊️', '📐'],
};

export const LiveEventChat: React.FC<LiveEventChatProps> = ({
  messages,
  onSendMessage,
  currentUserId,
  height = '600px',
}) => {
  const theme = useTheme();
  const [message, setMessage] = useState('');
  const [emojiAnchorEl, setEmojiAnchorEl] = useState<HTMLButtonElement | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const chatContainerRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSendMessage = () => {
    if (message.trim()) {
      onSendMessage(message);
      setMessage('');
    }
  };

  const handleEmojiClick = (emoji: string) => {
    onSendMessage(emoji);
    setEmojiAnchorEl(null);
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const isOwnMessage = (msg: ChatMessage) => msg.user_id === currentUserId;

  return (
    <Paper
      sx={{
        height,
        display: 'flex',
        flexDirection: 'column',
        overflow: 'hidden',
      }}
    >
      <Box
        sx={{
          p: 2,
          borderBottom: 1,
          borderColor: 'divider',
          bgcolor: alpha(theme.palette.primary.main, 0.05),
        }}
      >
        <Typography variant="h6" fontWeight="bold">
          Live Chat
        </Typography>
        <Typography variant="caption" color="text.secondary">
          {messages.length} messages
        </Typography>
      </Box>

      <Box
        ref={chatContainerRef}
        sx={{
          flex: 1,
          overflow: 'auto',
          p: 2,
          bgcolor: 'grey.50',
        }}
      >
        <List sx={{ p: 0 }}>
          {messages.map((msg, index) => {
            const isEmoji = msg.message_type === 'emoji';
            const showAvatar = index === 0 || messages[index - 1].user_id !== msg.user_id;

            return (
              <ListItem
                key={msg.id}
                alignItems="flex-start"
                sx={{
                  px: 0,
                  py: 0.5,
                  flexDirection: isOwnMessage(msg) ? 'row-reverse' : 'row',
                }}
              >
                {showAvatar && (
                  <ListItemAvatar
                    sx={{
                      minWidth: isOwnMessage(msg) ? 'auto' : 40,
                      ml: isOwnMessage(msg) ? 1 : 0,
                      mr: isOwnMessage(msg) ? 0 : 1,
                    }}
                  >
                    <Avatar
                      src={msg.user_avatar}
                      sx={{
                        width: 32,
                        height: 32,
                        bgcolor: isOwnMessage(msg)
                          ? theme.palette.primary.main
                          : theme.palette.secondary.main,
                      }}
                    >
                      {msg.user_name[0]}
                    </Avatar>
                  </ListItemAvatar>
                )}
                <Box
                  sx={{
                    flex: 1,
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: isOwnMessage(msg) ? 'flex-end' : 'flex-start',
                    ml: !showAvatar && !isOwnMessage(msg) ? 5 : 0,
                    mr: !showAvatar && isOwnMessage(msg) ? 5 : 0,
                  }}
                >
                  {showAvatar && (
                    <Typography variant="caption" color="text.secondary" sx={{ mb: 0.5, px: 1.5 }}>
                      {msg.user_name}
                    </Typography>
                  )}
                  <Box
                    sx={{
                      bgcolor: isOwnMessage(msg) ? theme.palette.primary.main : 'white',
                      color: isOwnMessage(msg) ? 'white' : 'text.primary',
                      px: isEmoji ? 1 : 1.5,
                      py: isEmoji ? 0.5 : 1,
                      borderRadius: 2,
                      maxWidth: '70%',
                      wordBreak: 'break-word',
                      boxShadow: 1,
                    }}
                  >
                    <Typography
                      variant="body2"
                      sx={{
                        fontSize: isEmoji ? '2rem' : 'inherit',
                        lineHeight: isEmoji ? 1 : 1.5,
                      }}
                    >
                      {msg.message}
                    </Typography>
                  </Box>
                  <Typography
                    variant="caption"
                    color="text.secondary"
                    sx={{ mt: 0.25, px: 1.5, fontSize: '0.65rem' }}
                  >
                    {format(new Date(msg.timestamp), 'HH:mm')}
                  </Typography>
                </Box>
              </ListItem>
            );
          })}
          <div ref={messagesEndRef} />
        </List>
      </Box>

      <Divider />

      <Box sx={{ p: 2, bgcolor: 'background.paper' }}>
        <Box sx={{ display: 'flex', gap: 1, mb: 1 }}>
          <TextField
            fullWidth
            size="small"
            placeholder="Type a message..."
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            onKeyPress={handleKeyPress}
            multiline
            maxRows={3}
            sx={{
              '& .MuiOutlinedInput-root': {
                borderRadius: 3,
              },
            }}
          />
          <IconButton
            color="primary"
            onClick={(e) => setEmojiAnchorEl(e.currentTarget)}
            sx={{
              bgcolor: alpha(theme.palette.primary.main, 0.1),
              '&:hover': {
                bgcolor: alpha(theme.palette.primary.main, 0.2),
              },
            }}
          >
            <EmojiIcon />
          </IconButton>
          <IconButton
            color="primary"
            onClick={handleSendMessage}
            disabled={!message.trim()}
            sx={{
              bgcolor: message.trim()
                ? theme.palette.primary.main
                : alpha(theme.palette.action.disabled, 0.1),
              color: message.trim() ? 'white' : 'action.disabled',
              '&:hover': {
                bgcolor: message.trim()
                  ? theme.palette.primary.dark
                  : alpha(theme.palette.action.disabled, 0.1),
              },
            }}
          >
            <SendIcon />
          </IconButton>
        </Box>
      </Box>

      <Popover
        open={Boolean(emojiAnchorEl)}
        anchorEl={emojiAnchorEl}
        onClose={() => setEmojiAnchorEl(null)}
        anchorOrigin={{
          vertical: 'top',
          horizontal: 'right',
        }}
        transformOrigin={{
          vertical: 'bottom',
          horizontal: 'right',
        }}
      >
        <Box sx={{ p: 2, maxWidth: 320 }}>
          {Object.entries(EMOJI_CATEGORIES).map(([category, emojis]) => (
            <Box key={category} sx={{ mb: 2 }}>
              <Typography variant="caption" color="text.secondary" sx={{ mb: 1, display: 'block' }}>
                {category.charAt(0).toUpperCase() + category.slice(1)}
              </Typography>
              <Grid container spacing={1}>
                {emojis.map((emoji) => (
                  <Grid item key={emoji}>
                    <IconButton
                      onClick={() => handleEmojiClick(emoji)}
                      sx={{
                        fontSize: '1.5rem',
                        '&:hover': {
                          bgcolor: alpha(theme.palette.primary.main, 0.1),
                        },
                      }}
                    >
                      {emoji}
                    </IconButton>
                  </Grid>
                ))}
              </Grid>
            </Box>
          ))}
        </Box>
      </Popover>
    </Paper>
  );
};

export default LiveEventChat;
