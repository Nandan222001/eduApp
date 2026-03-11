import React, { useState } from 'react';
import {
  Box,
  Paper,
  Typography,
  Card,
  CardContent,
  Avatar,
  Button,
  TextField,
  Divider,
  List,
  ListItem,
  ListItemAvatar,
  ListItemText,
  Chip,
  Alert,
  CircularProgress,
  Tabs,
  Tab,
} from '@mui/material';
import { Send as SendIcon, School as SchoolIcon, Reply as ReplyIcon } from '@mui/icons-material';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { communicationsApi } from '@/api/communications';
import type { Message, MessageCreate } from '@/types/communications';
import { formatDistanceToNow } from 'date-fns';

interface MessageThreadProps {
  message: Message;
  onReply: (message: Message) => void;
}

const MessageThread: React.FC<MessageThreadProps> = ({ message, onReply }) => {
  const sender = message.sender;
  const displayName = sender ? `${sender.first_name} ${sender.last_name}` : 'Teacher';

  return (
    <Card variant="outlined" sx={{ mb: 2 }}>
      <CardContent>
        <Box display="flex" justifyContent="space-between" alignItems="start" mb={2}>
          <Box display="flex" gap={2} flex={1}>
            <Avatar>
              <SchoolIcon />
            </Avatar>
            <Box flex={1}>
              <Typography variant="subtitle1" fontWeight={600}>
                {displayName}
              </Typography>
              <Typography variant="caption" color="text.secondary">
                {formatDistanceToNow(new Date(message.created_at), { addSuffix: true })}
              </Typography>
            </Box>
          </Box>
          {!message.is_read && <Chip label="Unread" size="small" color="primary" />}
        </Box>

        {message.subject && (
          <Typography variant="subtitle2" fontWeight={600} gutterBottom>
            {message.subject}
          </Typography>
        )}

        <Typography variant="body2" paragraph>
          {message.content}
        </Typography>

        <Button size="small" startIcon={<ReplyIcon />} onClick={() => onReply(message)}>
          Reply
        </Button>
      </CardContent>
    </Card>
  );
};

interface ReplyFormProps {
  originalMessage: Message;
  onCancel: () => void;
  onSuccess: () => void;
}

const ReplyForm: React.FC<ReplyFormProps> = ({ originalMessage, onCancel, onSuccess }) => {
  const queryClient = useQueryClient();
  const [replyContent, setReplyContent] = useState('');

  const sendMutation = useMutation({
    mutationFn: (data: MessageCreate) => communicationsApi.sendMessage(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['messages'] });
      setReplyContent('');
      onSuccess();
    },
  });

  const handleSend = () => {
    if (!replyContent.trim()) return;

    sendMutation.mutate({
      recipient_id: originalMessage.sender_id,
      subject: `Re: ${originalMessage.subject || 'Message'}`,
      content: replyContent,
      parent_id: originalMessage.id,
    });
  };

  return (
    <Paper sx={{ p: 2, mb: 2, backgroundColor: 'grey.50' }}>
      <Typography variant="subtitle2" gutterBottom>
        Reply to{' '}
        {originalMessage.sender
          ? `${originalMessage.sender.first_name} ${originalMessage.sender.last_name}`
          : 'Teacher'}
      </Typography>
      {sendMutation.isError && (
        <Alert severity="error" sx={{ mb: 2 }}>
          Failed to send reply. Please try again.
        </Alert>
      )}
      <TextField
        fullWidth
        multiline
        rows={4}
        placeholder="Type your reply..."
        value={replyContent}
        onChange={(e) => setReplyContent(e.target.value)}
        sx={{ mb: 2 }}
      />
      <Box display="flex" gap={1} justifyContent="flex-end">
        <Button onClick={onCancel} disabled={sendMutation.isPending}>
          Cancel
        </Button>
        <Button
          variant="contained"
          startIcon={<SendIcon />}
          onClick={handleSend}
          disabled={!replyContent.trim() || sendMutation.isPending}
        >
          {sendMutation.isPending ? <CircularProgress size={20} /> : 'Send Reply'}
        </Button>
      </Box>
    </Paper>
  );
};

interface TeacherContactProps {
  teacher: {
    id: number;
    first_name: string;
    last_name: string;
    email: string;
    subject?: string;
  };
  onSendMessage: (teacherId: number) => void;
}

const TeacherContact: React.FC<TeacherContactProps> = ({ teacher, onSendMessage }) => {
  return (
    <ListItem
      secondaryAction={
        <Button size="small" variant="outlined" onClick={() => onSendMessage(teacher.id)}>
          Message
        </Button>
      }
    >
      <ListItemAvatar>
        <Avatar>
          {teacher.first_name.charAt(0)}
          {teacher.last_name.charAt(0)}
        </Avatar>
      </ListItemAvatar>
      <ListItemText
        primary={`${teacher.first_name} ${teacher.last_name}`}
        secondary={
          <>
            <Typography component="span" variant="body2" color="text.secondary">
              {teacher.subject || 'Teacher'}
            </Typography>
            <br />
            <Typography component="span" variant="caption" color="text.secondary">
              {teacher.email}
            </Typography>
          </>
        }
      />
    </ListItem>
  );
};

interface ParentCommunicationViewProps {
  studentId?: number;
  teachers?: Array<{
    id: number;
    first_name: string;
    last_name: string;
    email: string;
    subject?: string;
  }>;
}

export const ParentCommunicationView: React.FC<ParentCommunicationViewProps> = ({
  teachers = [],
}) => {
  const [tabValue, setTabValue] = useState(0);
  const [replyingTo, setReplyingTo] = useState<Message | null>(null);

  const { data: inbox = [], isLoading: inboxLoading } = useQuery({
    queryKey: ['messages', 'inbox'],
    queryFn: () => communicationsApi.getInbox(),
  });

  const { data: announcements = [], isLoading: announcementsLoading } = useQuery({
    queryKey: ['announcements', 'my'],
    queryFn: () => communicationsApi.getMyAnnouncements(),
  });

  const handleReply = (message: Message) => {
    setReplyingTo(message);
  };

  const handleCancelReply = () => {
    setReplyingTo(null);
  };

  const handleReplySuccess = () => {
    setReplyingTo(null);
  };

  return (
    <Box>
      <Typography variant="h5" gutterBottom>
        Communication Center
      </Typography>
      <Typography variant="body2" color="text.secondary" paragraph>
        Stay connected with your child&apos;s teachers and school
      </Typography>

      <Tabs value={tabValue} onChange={(_, v) => setTabValue(v)} sx={{ mb: 3 }}>
        <Tab label="Messages from Teachers" />
        <Tab label="Announcements" />
        <Tab label="Teacher Contacts" />
      </Tabs>

      {tabValue === 0 && (
        <Box>
          {replyingTo && (
            <ReplyForm
              originalMessage={replyingTo}
              onCancel={handleCancelReply}
              onSuccess={handleReplySuccess}
            />
          )}

          {inboxLoading ? (
            <Box display="flex" justifyContent="center" py={4}>
              <CircularProgress />
            </Box>
          ) : inbox.length === 0 ? (
            <Alert severity="info">No messages from teachers yet</Alert>
          ) : (
            inbox.map((message) => (
              <MessageThread key={message.id} message={message} onReply={handleReply} />
            ))
          )}
        </Box>
      )}

      {tabValue === 1 && (
        <Box>
          {announcementsLoading ? (
            <Box display="flex" justifyContent="center" py={4}>
              <CircularProgress />
            </Box>
          ) : announcements.length === 0 ? (
            <Alert severity="info">No announcements available</Alert>
          ) : (
            announcements.map((announcement) => (
              <Card key={announcement.id} variant="outlined" sx={{ mb: 2 }}>
                <CardContent>
                  <Box display="flex" justifyContent="space-between" alignItems="start" mb={2}>
                    <Typography variant="h6">{announcement.title}</Typography>
                    <Chip
                      label={announcement.priority}
                      size="small"
                      color={
                        announcement.priority === 'urgent'
                          ? 'error'
                          : announcement.priority === 'high'
                            ? 'warning'
                            : 'info'
                      }
                    />
                  </Box>
                  <Typography variant="body2" paragraph>
                    {announcement.content}
                  </Typography>
                  <Typography variant="caption" color="text.secondary">
                    Published{' '}
                    {formatDistanceToNow(
                      new Date(announcement.published_at || announcement.created_at),
                      { addSuffix: true }
                    )}
                  </Typography>
                </CardContent>
              </Card>
            ))
          )}
        </Box>
      )}

      {tabValue === 2 && (
        <Box>
          {teachers.length === 0 ? (
            <Alert severity="info">No teacher contacts available</Alert>
          ) : (
            <List>
              {teachers.map((teacher, index) => (
                <React.Fragment key={teacher.id}>
                  {index > 0 && <Divider />}
                  <TeacherContact teacher={teacher} onSendMessage={() => {}} />
                </React.Fragment>
              ))}
            </List>
          )}
        </Box>
      )}
    </Box>
  );
};
