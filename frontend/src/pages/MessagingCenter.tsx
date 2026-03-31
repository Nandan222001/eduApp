import { useState, useEffect, useMemo } from 'react';
import {
  Box,
  Paper,
  Typography,
  Tabs,
  Tab,
  Button,
  TextField,
  InputAdornment,
  IconButton,
  List,
  ListItem,
  ListItemAvatar,
  ListItemText,
  Avatar,
  Badge,
  Divider,
  Chip,
  CircularProgress,
  Alert,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Autocomplete,
  Menu,
  MenuItem,
  Tooltip,
  useTheme,
  alpha,
} from '@mui/material';
import {
  Search as SearchIcon,
  Send as SendIcon,
  Inbox as InboxIcon,
  Send as SentIcon,
  FilterList as FilterListIcon,
  Refresh as RefreshIcon,
  MoreVert as MoreVertIcon,
  Delete as DeleteIcon,
  Reply as ReplyIcon,
  Close as CloseIcon,
  Create as CreateIcon,
  MarkEmailRead as MarkReadIcon,
} from '@mui/icons-material';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { communicationsApi } from '@/api/communications';
import teachersApi, { Teacher } from '@/api/teachers';
import studentsApi, { Student } from '@/api/students';
import type { Message, MessageCreate } from '@/types/communications';
import { formatDistanceToNow } from 'date-fns';
import { useAuth } from '@/hooks/useAuth';
import { useWebSocket } from '@/contexts/WebSocketContext';

interface RecipientOption {
  id: number;
  first_name: string;
  last_name: string;
  email: string;
  role?: string;
}

export default function MessagingCenter() {
  const theme = useTheme();
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const { isConnected } = useWebSocket();
  const [tabValue, setTabValue] = useState(0);
  const [selectedConversationUserId, setSelectedConversationUserId] = useState<number | null>(null);
  const [messageContent, setMessageContent] = useState('');
  const [messageSubject, setMessageSubject] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [composeDialogOpen, setComposeDialogOpen] = useState(false);
  const [selectedRecipient, setSelectedRecipient] = useState<RecipientOption | null>(null);
  const [recipientSearch, setRecipientSearch] = useState('');
  const [filterUnread, setFilterUnread] = useState(false);
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const [selectedMessage, setSelectedMessage] = useState<Message | null>(null);
  const [replyMessage, setReplyMessage] = useState<Message | null>(null);

  const {
    data: inboxData = [],
    isLoading: inboxLoading,
    refetch: refetchInbox,
  } = useQuery({
    queryKey: ['messages', 'inbox', filterUnread],
    queryFn: () => communicationsApi.getInbox(0, 100, filterUnread),
  });

  const {
    data: sentData = [],
    isLoading: sentLoading,
    refetch: refetchSent,
  } = useQuery({
    queryKey: ['messages', 'sent'],
    queryFn: () => communicationsApi.getSentMessages(0, 100),
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

  const { data: teachers = [], isLoading: loadingTeachers } = useQuery({
    queryKey: ['teachers', 'list', recipientSearch],
    queryFn: () => teachersApi.listTeachers({ search: recipientSearch, limit: 50 }),
    enabled: composeDialogOpen && recipientSearch.length >= 2,
  });

  const { data: students = [], isLoading: loadingStudents } = useQuery({
    queryKey: ['students', 'list', recipientSearch],
    queryFn: () => studentsApi.listStudents({ search: recipientSearch, limit: 50 }),
    enabled: composeDialogOpen && recipientSearch.length >= 2,
  });

  const sendMutation = useMutation({
    mutationFn: (data: MessageCreate) => communicationsApi.sendMessage(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['messages'] });
      setMessageContent('');
      setMessageSubject('');
      setComposeDialogOpen(false);
      setSelectedRecipient(null);
      setReplyMessage(null);
    },
  });

  const markReadMutation = useMutation({
    mutationFn: (id: number) => communicationsApi.markMessageRead(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['messages'] });
    },
  });

  const markAllReadMutation = useMutation({
    mutationFn: () => communicationsApi.markAllMessagesRead(),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['messages'] });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id: number) => communicationsApi.deleteMessage(id, false),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['messages'] });
      if (selectedMessage?.id === selectedConversationUserId) {
        setSelectedConversationUserId(null);
      }
    },
  });

  useEffect(() => {
    if (isConnected) {
      refetchInbox();
      refetchSent();
    }
  }, [isConnected, refetchInbox, refetchSent]);

  const handleSelectConversation = (message: Message) => {
    const currentUserId = user?.id ? Number(user.id) : null;
    const otherUserId =
      message.sender_id === currentUserId ? message.recipient_id : message.sender_id;
    setSelectedConversationUserId(otherUserId);

    if (!message.is_read && message.recipient_id === currentUserId) {
      markReadMutation.mutate(message.id);
    }
  };

  const handleSendMessage = () => {
    if (!messageContent.trim()) return;

    let recipientId: number | null = null;

    if (selectedConversationUserId) {
      recipientId = selectedConversationUserId;
    } else if (selectedRecipient) {
      recipientId = selectedRecipient.id;
    } else if (replyMessage) {
      recipientId = replyMessage.sender_id;
    }

    if (!recipientId) return;

    sendMutation.mutate({
      recipient_id: recipientId,
      subject: messageSubject.trim() || undefined,
      content: messageContent.trim(),
      parent_id: replyMessage?.id,
    });
  };

  const handleComposeNew = () => {
    setComposeDialogOpen(true);
    setSelectedRecipient(null);
    setMessageSubject('');
    setMessageContent('');
    setReplyMessage(null);
  };

  const handleReply = (message: Message) => {
    setReplyMessage(message);
    setMessageSubject(message.subject ? `Re: ${message.subject}` : '');
    handleMenuClose();
  };

  const handleMenuOpen = (event: React.MouseEvent<HTMLElement>, message: Message) => {
    setAnchorEl(event.currentTarget);
    setSelectedMessage(message);
  };

  const handleMenuClose = () => {
    setAnchorEl(null);
  };

  const handleDelete = () => {
    if (selectedMessage) {
      deleteMutation.mutate(selectedMessage.id);
    }
    handleMenuClose();
  };

  const handleMarkAsRead = () => {
    if (selectedMessage && !selectedMessage.is_read) {
      markReadMutation.mutate(selectedMessage.id);
    }
    handleMenuClose();
  };

  const recipientOptions = useMemo(() => {
    const options: RecipientOption[] = [];

    if (Array.isArray(teachers) && teachers.length > 0) {
      teachers.forEach((t: Teacher) => {
        options.push({
          id: t.user_id || t.id,
          first_name: t.first_name,
          last_name: t.last_name,
          email: t.email,
          role: 'Teacher',
        });
      });
    } else if (
      teachers &&
      typeof teachers === 'object' &&
      'items' in teachers &&
      Array.isArray(teachers.items)
    ) {
      teachers.items.forEach((t: Teacher) => {
        options.push({
          id: t.user_id || t.id,
          first_name: t.first_name,
          last_name: t.last_name,
          email: t.email,
          role: 'Teacher',
        });
      });
    }

    if (Array.isArray(students) && students.length > 0) {
      students.forEach((s: Student) => {
        if (s.user_id) {
          options.push({
            id: s.user_id,
            first_name: s.first_name,
            last_name: s.last_name,
            email: s.email || '',
            role: 'Student',
          });
        }
      });
    } else if (
      students &&
      typeof students === 'object' &&
      'items' in students &&
      Array.isArray(students.items)
    ) {
      students.items.forEach((s: Student) => {
        if (s.user_id) {
          options.push({
            id: s.user_id,
            first_name: s.first_name,
            last_name: s.last_name,
            email: s.email || '',
            role: 'Student',
          });
        }
      });
    }

    return options;
  }, [teachers, students]);

  const currentMessages = tabValue === 0 ? inboxData : sentData;
  const currentLoading = tabValue === 0 ? inboxLoading : sentLoading;

  const filteredMessages = useMemo(() => {
    if (!searchQuery) return currentMessages;

    const currentUserId = user?.id ? Number(user.id) : null;
    return currentMessages.filter((msg) => {
      const otherUser = msg.sender_id === currentUserId ? msg.recipient : msg.sender;
      const name = otherUser ? `${otherUser.first_name} ${otherUser.last_name}`.toLowerCase() : '';
      const content = `${msg.subject || ''} ${msg.content}`.toLowerCase();
      return (
        name.includes(searchQuery.toLowerCase()) || content.includes(searchQuery.toLowerCase())
      );
    });
  }, [currentMessages, searchQuery, user?.id]);

  const selectedConversationName = useMemo(() => {
    if (!selectedConversationUserId) return '';

    const currentUserId = user?.id ? Number(user.id) : null;
    const relevantMessages = tabValue === 0 ? inboxData : sentData;
    const message = relevantMessages.find(
      (msg) =>
        (msg.sender_id === currentUserId ? msg.recipient_id : msg.sender_id) ===
        selectedConversationUserId
    );

    if (!message) return 'User';
    const otherUser = message.sender_id === currentUserId ? message.recipient : message.sender;
    return otherUser ? `${otherUser.first_name} ${otherUser.last_name}` : 'User';
  }, [selectedConversationUserId, inboxData, sentData, tabValue, user?.id]);

  return (
    <Box>
      <Box sx={{ mb: 4, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <Box>
          <Typography variant="h4" fontWeight={700} gutterBottom>
            Messaging Center
          </Typography>
          <Typography variant="body1" color="text.secondary">
            Send and receive messages with teachers, students, and staff
          </Typography>
        </Box>
        <Box sx={{ display: 'flex', gap: 2, alignItems: 'center' }}>
          {isConnected && (
            <Chip label="Connected" color="success" size="small" variant="outlined" />
          )}
          <Button variant="contained" startIcon={<CreateIcon />} onClick={handleComposeNew}>
            Compose
          </Button>
        </Box>
      </Box>

      <Paper
        elevation={0}
        sx={{ border: `1px solid ${theme.palette.divider}`, height: 'calc(100vh - 280px)' }}
      >
        <Box sx={{ display: 'flex', height: '100%' }}>
          <Box
            sx={{
              width: 350,
              borderRight: 1,
              borderColor: 'divider',
              display: 'flex',
              flexDirection: 'column',
            }}
          >
            <Box sx={{ borderBottom: 1, borderColor: 'divider' }}>
              <Tabs
                value={tabValue}
                onChange={(_, newValue) => {
                  setTabValue(newValue);
                  setSelectedConversationUserId(null);
                }}
                variant="fullWidth"
              >
                <Tab
                  icon={
                    <Badge badgeContent={unreadCount} color="error">
                      <InboxIcon />
                    </Badge>
                  }
                  label="Inbox"
                />
                <Tab icon={<SentIcon />} label="Sent" />
              </Tabs>
            </Box>

            <Box sx={{ p: 2, borderBottom: 1, borderColor: 'divider' }}>
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
              <Box sx={{ display: 'flex', gap: 1, mt: 1 }}>
                <Tooltip title="Filter Unread">
                  <IconButton
                    size="small"
                    onClick={() => setFilterUnread(!filterUnread)}
                    color={filterUnread ? 'primary' : 'default'}
                  >
                    <FilterListIcon />
                  </IconButton>
                </Tooltip>
                <Tooltip title="Mark All as Read">
                  <IconButton
                    size="small"
                    onClick={() => markAllReadMutation.mutate()}
                    disabled={markAllReadMutation.isPending || unreadCount === 0}
                  >
                    <MarkReadIcon />
                  </IconButton>
                </Tooltip>
                <Tooltip title="Refresh">
                  <IconButton
                    size="small"
                    onClick={() => {
                      refetchInbox();
                      refetchSent();
                    }}
                  >
                    <RefreshIcon />
                  </IconButton>
                </Tooltip>
              </Box>
            </Box>

            <Box sx={{ flex: 1, overflow: 'auto' }}>
              {currentLoading ? (
                <Box display="flex" justifyContent="center" py={4}>
                  <CircularProgress />
                </Box>
              ) : filteredMessages.length === 0 ? (
                <Box p={2}>
                  <Alert severity="info">No messages found</Alert>
                </Box>
              ) : (
                <List disablePadding>
                  {filteredMessages.map((message, index) => {
                    const currentUserId = user?.id ? Number(user.id) : null;
                    const otherUser =
                      message.sender_id === currentUserId ? message.recipient : message.sender;
                    const displayName = otherUser
                      ? `${otherUser.first_name} ${otherUser.last_name}`
                      : 'Unknown User';
                    const isSelected =
                      (message.sender_id === currentUserId
                        ? message.recipient_id
                        : message.sender_id) === selectedConversationUserId;

                    return (
                      <div key={message.id}>
                        {index > 0 && <Divider />}
                        <ListItem
                          button
                          selected={isSelected}
                          onClick={() => handleSelectConversation(message)}
                          secondaryAction={
                            <IconButton
                              edge="end"
                              size="small"
                              onClick={(e) => {
                                e.stopPropagation();
                                handleMenuOpen(e, message);
                              }}
                            >
                              <MoreVertIcon />
                            </IconButton>
                          }
                          sx={{
                            '&.Mui-selected': {
                              backgroundColor: alpha(theme.palette.primary.main, 0.1),
                            },
                          }}
                        >
                          <ListItemAvatar>
                            <Badge
                              color="error"
                              variant="dot"
                              invisible={message.is_read || tabValue === 1}
                              overlap="circular"
                            >
                              <Avatar
                                sx={{
                                  bgcolor: alpha(theme.palette.primary.main, 0.1),
                                  color: theme.palette.primary.main,
                                }}
                              >
                                {displayName.charAt(0)}
                              </Avatar>
                            </Badge>
                          </ListItemAvatar>
                          <ListItemText
                            primary={
                              <Box
                                display="flex"
                                justifyContent="space-between"
                                alignItems="center"
                              >
                                <Typography
                                  variant="subtitle2"
                                  fontWeight={!message.is_read && tabValue === 0 ? 600 : 400}
                                  noWrap
                                >
                                  {displayName}
                                </Typography>
                                <Typography variant="caption" color="text.secondary">
                                  {formatDistanceToNow(new Date(message.created_at), {
                                    addSuffix: true,
                                  })}
                                </Typography>
                              </Box>
                            }
                            secondary={
                              <>
                                {message.subject && (
                                  <Typography
                                    variant="body2"
                                    fontWeight={!message.is_read && tabValue === 0 ? 600 : 400}
                                    noWrap
                                  >
                                    {message.subject}
                                  </Typography>
                                )}
                                <Typography
                                  variant="body2"
                                  color="text.secondary"
                                  noWrap
                                  fontWeight={!message.is_read && tabValue === 0 ? 500 : 400}
                                >
                                  {message.content}
                                </Typography>
                              </>
                            }
                          />
                        </ListItem>
                      </div>
                    );
                  })}
                </List>
              )}
            </Box>
          </Box>

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
                  <Typography variant="h6">{selectedConversationName}</Typography>
                </Box>

                <Box sx={{ flex: 1, overflow: 'auto', p: 2, backgroundColor: 'grey.50' }}>
                  {conversationLoading ? (
                    <Box display="flex" justifyContent="center" py={4}>
                      <CircularProgress />
                    </Box>
                  ) : (
                    conversation.map((message) => {
                      const currentUserId = user?.id ? Number(user.id) : null;
                      const isSent = message.sender_id === currentUserId;
                      return (
                        <Box
                          key={message.id}
                          sx={{
                            display: 'flex',
                            justifyContent: isSent ? 'flex-end' : 'flex-start',
                            mb: 2,
                          }}
                        >
                          <Box
                            sx={{
                              maxWidth: '70%',
                              backgroundColor: isSent ? 'primary.main' : 'background.paper',
                              color: isSent ? 'primary.contrastText' : 'text.primary',
                              borderRadius: 2,
                              px: 2,
                              py: 1.5,
                              boxShadow: 1,
                            }}
                          >
                            {message.subject && (
                              <Typography variant="subtitle2" fontWeight={600} gutterBottom>
                                {message.subject}
                              </Typography>
                            )}
                            <Typography variant="body2" sx={{ whiteSpace: 'pre-wrap' }}>
                              {message.content}
                            </Typography>
                            <Typography
                              variant="caption"
                              sx={{
                                display: 'block',
                                mt: 0.5,
                                opacity: 0.7,
                              }}
                            >
                              {formatDistanceToNow(new Date(message.created_at), {
                                addSuffix: true,
                              })}
                            </Typography>
                          </Box>
                        </Box>
                      );
                    })
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
                  {replyMessage && (
                    <Box
                      sx={{
                        mb: 1,
                        p: 1,
                        backgroundColor: 'action.hover',
                        borderRadius: 1,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                      }}
                    >
                      <Typography variant="caption" color="text.secondary">
                        Replying to: {replyMessage.subject || 'Message'}
                      </Typography>
                      <IconButton size="small" onClick={() => setReplyMessage(null)}>
                        <CloseIcon fontSize="small" />
                      </IconButton>
                    </Box>
                  )}
                  {sendMutation.isError && (
                    <Alert severity="error" sx={{ mb: 2 }}>
                      Failed to send message
                    </Alert>
                  )}
                  <Box display="flex" flexDirection="column" gap={1}>
                    <TextField
                      fullWidth
                      size="small"
                      placeholder="Subject (optional)"
                      value={messageSubject}
                      onChange={(e) => setMessageSubject(e.target.value)}
                    />
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
                        disabled={!messageContent.trim() || sendMutation.isPending}
                      >
                        <SendIcon />
                      </IconButton>
                    </Box>
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
                <Box textAlign="center">
                  <InboxIcon sx={{ fontSize: 64, mb: 2, opacity: 0.5 }} />
                  <Typography variant="h6">Select a conversation</Typography>
                  <Typography variant="body2">
                    Choose a message from the left to start chatting
                  </Typography>
                </Box>
              </Box>
            )}
          </Box>
        </Box>
      </Paper>

      <Menu anchorEl={anchorEl} open={Boolean(anchorEl)} onClose={handleMenuClose}>
        {selectedMessage && !selectedMessage.is_read && tabValue === 0 && (
          <MenuItem onClick={handleMarkAsRead}>
            <MarkReadIcon sx={{ mr: 1 }} fontSize="small" />
            Mark as Read
          </MenuItem>
        )}
        {selectedMessage && tabValue === 0 && (
          <MenuItem onClick={() => handleReply(selectedMessage)}>
            <ReplyIcon sx={{ mr: 1 }} fontSize="small" />
            Reply
          </MenuItem>
        )}
        <MenuItem onClick={handleDelete} sx={{ color: 'error.main' }}>
          <DeleteIcon sx={{ mr: 1 }} fontSize="small" />
          Delete
        </MenuItem>
      </Menu>

      <Dialog
        open={composeDialogOpen}
        onClose={() => setComposeDialogOpen(false)}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>
          <Box display="flex" justifyContent="space-between" alignItems="center">
            <Typography variant="h6">New Message</Typography>
            <IconButton onClick={() => setComposeDialogOpen(false)} size="small">
              <CloseIcon />
            </IconButton>
          </Box>
        </DialogTitle>
        <DialogContent dividers>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
            {sendMutation.isError && (
              <Alert severity="error">Failed to send message. Please try again.</Alert>
            )}

            <Autocomplete
              options={recipientOptions}
              getOptionLabel={(option) =>
                `${option.first_name} ${option.last_name}${option.role ? ` (${option.role})` : ''}`
              }
              value={selectedRecipient}
              onChange={(_, newValue) => setSelectedRecipient(newValue)}
              onInputChange={(_, newInputValue) => setRecipientSearch(newInputValue)}
              loading={loadingTeachers || loadingStudents}
              renderInput={(params) => (
                <TextField
                  {...params}
                  label="To"
                  placeholder="Search for teachers or students..."
                  required
                  helperText="Type at least 2 characters to search"
                  InputProps={{
                    ...params.InputProps,
                    endAdornment: (
                      <>
                        {loadingTeachers || loadingStudents ? (
                          <CircularProgress color="inherit" size={20} />
                        ) : null}
                        {params.InputProps.endAdornment}
                      </>
                    ),
                  }}
                />
              )}
            />

            <TextField
              label="Subject"
              value={messageSubject}
              onChange={(e) => setMessageSubject(e.target.value)}
              fullWidth
              placeholder="Optional"
            />

            <TextField
              label="Message"
              value={messageContent}
              onChange={(e) => setMessageContent(e.target.value)}
              fullWidth
              required
              multiline
              rows={6}
              placeholder="Type your message here..."
            />
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setComposeDialogOpen(false)} disabled={sendMutation.isPending}>
            Cancel
          </Button>
          <Button
            variant="contained"
            startIcon={<SendIcon />}
            onClick={handleSendMessage}
            disabled={!selectedRecipient || !messageContent.trim() || sendMutation.isPending}
          >
            {sendMutation.isPending ? <CircularProgress size={20} /> : 'Send Message'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
