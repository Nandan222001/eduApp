import React from 'react';
import {
  Card,
  CardContent,
  Typography,
  List,
  ListItem,
  ListItemAvatar,
  ListItemText,
  Avatar,
  Box,
  Chip,
  Alert,
  Divider,
  IconButton,
} from '@mui/material';
import {
  Mail as MailIcon,
  MailOutline as MailOutlineIcon,
  Reply as ReplyIcon,
} from '@mui/icons-material';
import { formatDistanceToNow, parseISO } from 'date-fns';
import type { TeacherMessage } from '@/types/parent';

interface TeacherCommunicationPanelProps {
  messages: TeacherMessage[];
}

export const TeacherCommunicationPanel: React.FC<TeacherCommunicationPanelProps> = ({
  messages,
}) => {
  const unreadCount = messages.filter((m) => !m.is_read).length;

  return (
    <Card sx={{ height: '100%' }}>
      <CardContent>
        <Box display="flex" alignItems="center" justifyContent="space-between" mb={1}>
          <Box display="flex" alignItems="center" gap={1}>
            <MailIcon color="primary" />
            <Typography variant="h6">Teacher Messages</Typography>
          </Box>
          {unreadCount > 0 && <Chip label={`${unreadCount} unread`} color="error" size="small" />}
        </Box>
        <Typography variant="body2" color="text.secondary" gutterBottom>
          Recent communications from teachers
        </Typography>

        {messages.length === 0 ? (
          <Alert severity="info" sx={{ mt: 2 }}>
            No messages from teachers yet
          </Alert>
        ) : (
          <List sx={{ mt: 2, maxHeight: 500, overflow: 'auto' }}>
            {messages.map((message, index) => (
              <React.Fragment key={message.id}>
                {index > 0 && <Divider />}
                <ListItem
                  alignItems="flex-start"
                  sx={{
                    backgroundColor: message.is_read ? 'transparent' : 'action.hover',
                    borderRadius: 1,
                  }}
                  secondaryAction={
                    <IconButton edge="end" size="small">
                      <ReplyIcon fontSize="small" />
                    </IconButton>
                  }
                >
                  <ListItemAvatar>
                    <Avatar sx={{ bgcolor: 'primary.main' }}>
                      {message.is_read ? <MailOutlineIcon /> : <MailIcon />}
                    </Avatar>
                  </ListItemAvatar>
                  <ListItemText
                    primary={
                      <Box display="flex" alignItems="center" gap={1}>
                        <Typography
                          variant="subtitle2"
                          fontWeight={message.is_read ? 'normal' : 'bold'}
                        >
                          {message.teacher_name}
                        </Typography>
                        {!message.is_read && (
                          <Chip label="New" color="error" size="small" sx={{ height: 20 }} />
                        )}
                      </Box>
                    }
                    secondary={
                      <>
                        {message.subject && (
                          <Typography
                            component="span"
                            variant="body2"
                            fontWeight={message.is_read ? 'normal' : 'bold'}
                            color="text.primary"
                            display="block"
                          >
                            {message.subject}
                          </Typography>
                        )}
                        <Typography
                          component="span"
                          variant="body2"
                          color="text.secondary"
                          display="block"
                          sx={{
                            overflow: 'hidden',
                            textOverflow: 'ellipsis',
                            display: '-webkit-box',
                            WebkitLineClamp: 2,
                            WebkitBoxOrient: 'vertical',
                          }}
                        >
                          {message.content}
                        </Typography>
                        <Typography
                          component="span"
                          variant="caption"
                          color="text.secondary"
                          display="block"
                          sx={{ mt: 0.5 }}
                        >
                          {formatDistanceToNow(parseISO(message.created_at), { addSuffix: true })}
                        </Typography>
                      </>
                    }
                  />
                </ListItem>
              </React.Fragment>
            ))}
          </List>
        )}
      </CardContent>
    </Card>
  );
};
