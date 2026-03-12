import React, { useState, useEffect, useRef } from 'react';
import {
  Box,
  Paper,
  TextField,
  IconButton,
  Avatar,
  Typography,
  Button,
  Menu,
  MenuItem,
  Chip,
} from '@mui/material';
import {
  Send,
  AttachFile,
  Image as ImageIcon,
  MoreVert,
  Reply,
  PushPin,
  Delete,
} from '@mui/icons-material';
import { GroupMessage, MessageType } from '../../types/studyGroup';
import { format } from 'date-fns';

interface GroupChatInterfaceProps {
  groupId: number;
  messages: GroupMessage[];
  onSendMessage: (content: string, attachments: File[], replyToId?: number) => Promise<void>;
  onDeleteMessage?: (messageId: number) => void;
  onPinMessage?: (messageId: number) => void;
  currentUserId: number;
}

const GroupChatInterface: React.FC<GroupChatInterfaceProps> = ({
  messages,
  onSendMessage,
  onDeleteMessage,
  onPinMessage,
  currentUserId,
}) => {
  const [messageText, setMessageText] = useState('');
  const [attachments, setAttachments] = useState<File[]>([]);
  const [replyTo, setReplyTo] = useState<GroupMessage | null>(null);
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const [selectedMessage, setSelectedMessage] = useState<GroupMessage | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const handleAttachmentSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(event.target.files || []);
    setAttachments([...attachments, ...files]);
  };

  const handleSendMessage = async () => {
    if (!messageText.trim() && attachments.length === 0) return;

    try {
      await onSendMessage(messageText, attachments, replyTo?.id);
      setMessageText('');
      setAttachments([]);
      setReplyTo(null);
    } catch (error) {
      console.error('Failed to send message:', error);
    }
  };

  const handleKeyPress = (event: React.KeyboardEvent) => {
    if (event.key === 'Enter' && !event.shiftKey) {
      event.preventDefault();
      handleSendMessage();
    }
  };

  const handleMenuOpen = (event: React.MouseEvent<HTMLElement>, message: GroupMessage) => {
    setAnchorEl(event.currentTarget);
    setSelectedMessage(message);
  };

  const handleMenuClose = () => {
    setAnchorEl(null);
    setSelectedMessage(null);
  };

  const pinnedMessages = messages.filter((m) => m.is_pinned);
  const regularMessages = messages.filter((m) => !m.is_pinned);

  return (
    <Box display="flex" flexDirection="column" height="600px">
      {pinnedMessages.length > 0 && (
        <Paper sx={{ p: 1, mb: 1, bgcolor: 'info.50' }}>
          <Box display="flex" alignItems="center" gap={1}>
            <PushPin fontSize="small" color="info" />
            <Typography variant="caption" fontWeight="bold">
              Pinned Messages
            </Typography>
          </Box>
          {pinnedMessages.map((message) => (
            <Typography key={message.id} variant="caption" display="block" sx={{ ml: 3 }}>
              {message.content}
            </Typography>
          ))}
        </Paper>
      )}

      <Paper
        sx={{
          flex: 1,
          overflow: 'auto',
          p: 2,
          display: 'flex',
          flexDirection: 'column',
          gap: 2,
        }}
      >
        {regularMessages.map((message) => {
          const isOwnMessage = message.user_id === currentUserId;
          const messageDate = new Date(message.created_at);

          return (
            <Box
              key={message.id}
              display="flex"
              justifyContent={isOwnMessage ? 'flex-end' : 'flex-start'}
            >
              <Box display="flex" gap={1} maxWidth="70%">
                {!isOwnMessage && (
                  <Avatar src={message.user_avatar} sx={{ width: 32, height: 32 }}>
                    {message.user_name?.[0]}
                  </Avatar>
                )}

                <Box>
                  {!isOwnMessage && (
                    <Typography variant="caption" color="text.secondary" display="block">
                      {message.user_name}
                    </Typography>
                  )}

                  {message.reply_to_message && (
                    <Paper
                      sx={{
                        p: 0.5,
                        mb: 0.5,
                        bgcolor: 'grey.100',
                        borderLeft: 2,
                        borderColor: 'primary.main',
                      }}
                    >
                      <Typography variant="caption" color="text.secondary">
                        Replying to {message.reply_to_message.user_name}
                      </Typography>
                      <Typography variant="caption" display="block" noWrap>
                        {message.reply_to_message.content}
                      </Typography>
                    </Paper>
                  )}

                  <Paper
                    sx={{
                      p: 1.5,
                      bgcolor: isOwnMessage ? 'primary.main' : 'grey.100',
                      color: isOwnMessage ? 'white' : 'text.primary',
                      position: 'relative',
                    }}
                  >
                    {message.message_type === MessageType.ANNOUNCEMENT && (
                      <Chip label="Announcement" size="small" color="warning" sx={{ mb: 1 }} />
                    )}

                    <Typography variant="body2" sx={{ whiteSpace: 'pre-wrap' }}>
                      {message.content}
                    </Typography>

                    {message.attachments && message.attachments.length > 0 && (
                      <Box mt={1}>
                        {message.attachments.map((attachment, index) => (
                          <Box key={index} mb={1}>
                            {attachment.match(/\.(jpg|jpeg|png|gif)$/i) ? (
                              <img
                                src={attachment}
                                alt="Attachment"
                                style={{ maxWidth: '100%', borderRadius: 4 }}
                              />
                            ) : (
                              <Button size="small" startIcon={<AttachFile />}>
                                {attachment.split('/').pop()}
                              </Button>
                            )}
                          </Box>
                        ))}
                      </Box>
                    )}

                    <Typography
                      variant="caption"
                      sx={{
                        display: 'block',
                        mt: 0.5,
                        opacity: 0.8,
                      }}
                    >
                      {format(messageDate, 'HH:mm')}
                    </Typography>

                    <IconButton
                      size="small"
                      sx={{
                        position: 'absolute',
                        top: 4,
                        right: 4,
                        opacity: 0.7,
                      }}
                      onClick={(e) => handleMenuOpen(e, message)}
                    >
                      <MoreVert fontSize="small" />
                    </IconButton>
                  </Paper>
                </Box>
              </Box>
            </Box>
          );
        })}
        <div ref={messagesEndRef} />
      </Paper>

      {replyTo && (
        <Paper
          sx={{ p: 1, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}
        >
          <Box>
            <Typography variant="caption" color="primary">
              Replying to {replyTo.user_name}
            </Typography>
            <Typography variant="caption" display="block" noWrap>
              {replyTo.content}
            </Typography>
          </Box>
          <IconButton size="small" onClick={() => setReplyTo(null)}>
            <Delete fontSize="small" />
          </IconButton>
        </Paper>
      )}

      {attachments.length > 0 && (
        <Paper sx={{ p: 1 }}>
          <Box display="flex" gap={1} flexWrap="wrap">
            {attachments.map((file, index) => (
              <Chip
                key={index}
                label={file.name}
                onDelete={() => {
                  const newAttachments = [...attachments];
                  newAttachments.splice(index, 1);
                  setAttachments(newAttachments);
                }}
              />
            ))}
          </Box>
        </Paper>
      )}

      <Paper sx={{ p: 2 }}>
        <Box display="flex" gap={1} alignItems="flex-end">
          <IconButton component="label">
            <ImageIcon />
            <input type="file" hidden accept="image/*" multiple onChange={handleAttachmentSelect} />
          </IconButton>

          <IconButton component="label">
            <AttachFile />
            <input type="file" hidden multiple onChange={handleAttachmentSelect} />
          </IconButton>

          <TextField
            fullWidth
            multiline
            maxRows={4}
            placeholder="Type a message..."
            value={messageText}
            onChange={(e) => setMessageText(e.target.value)}
            onKeyPress={handleKeyPress}
            size="small"
          />

          <IconButton color="primary" onClick={handleSendMessage}>
            <Send />
          </IconButton>
        </Box>
      </Paper>

      <Menu anchorEl={anchorEl} open={Boolean(anchorEl)} onClose={handleMenuClose}>
        <MenuItem
          onClick={() => {
            setReplyTo(selectedMessage);
            handleMenuClose();
          }}
        >
          <Reply fontSize="small" sx={{ mr: 1 }} />
          Reply
        </MenuItem>
        {onPinMessage && selectedMessage && (
          <MenuItem
            onClick={() => {
              onPinMessage(selectedMessage.id);
              handleMenuClose();
            }}
          >
            <PushPin fontSize="small" sx={{ mr: 1 }} />
            {selectedMessage.is_pinned ? 'Unpin' : 'Pin'} Message
          </MenuItem>
        )}
        {onDeleteMessage && selectedMessage && selectedMessage.user_id === currentUserId && (
          <MenuItem
            onClick={() => {
              onDeleteMessage(selectedMessage.id);
              handleMenuClose();
            }}
          >
            <Delete fontSize="small" sx={{ mr: 1 }} />
            Delete
          </MenuItem>
        )}
      </Menu>
    </Box>
  );
};

export default GroupChatInterface;
