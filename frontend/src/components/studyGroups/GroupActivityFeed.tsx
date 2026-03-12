import React from 'react';
import {
  Box,
  Paper,
  Typography,
  List,
  ListItem,
  ListItemAvatar,
  ListItemText,
  Avatar,
  Chip,
} from '@mui/material';
import { PersonAdd, ExitToApp, Upload, Message, Edit, Star } from '@mui/icons-material';
import { GroupActivity, ActivityType } from '../../types/studyGroup';
import { formatDistanceToNow } from 'date-fns';

interface GroupActivityFeedProps {
  activities: GroupActivity[];
}

const GroupActivityFeed: React.FC<GroupActivityFeedProps> = ({ activities }) => {
  const getActivityIcon = (type: ActivityType) => {
    switch (type) {
      case ActivityType.MEMBER_JOINED:
        return <PersonAdd color="success" />;
      case ActivityType.MEMBER_LEFT:
        return <ExitToApp color="error" />;
      case ActivityType.MEMBER_PROMOTED:
        return <Star color="warning" />;
      case ActivityType.MESSAGE_SENT:
        return <Message color="primary" />;
      case ActivityType.RESOURCE_UPLOADED:
        return <Upload color="info" />;
      case ActivityType.GROUP_UPDATED:
        return <Edit color="action" />;
      default:
        return null;
    }
  };

  const getActivityColor = (type: ActivityType) => {
    switch (type) {
      case ActivityType.MEMBER_JOINED:
        return 'success';
      case ActivityType.MEMBER_LEFT:
        return 'error';
      case ActivityType.MEMBER_PROMOTED:
        return 'warning';
      case ActivityType.MESSAGE_SENT:
        return 'primary';
      case ActivityType.RESOURCE_UPLOADED:
        return 'info';
      default:
        return 'default';
    }
  };

  return (
    <Paper sx={{ p: 2 }}>
      <Typography variant="h6" gutterBottom>
        Recent Activity
      </Typography>

      {activities.length === 0 ? (
        <Box textAlign="center" py={4}>
          <Typography color="text.secondary">No recent activity</Typography>
        </Box>
      ) : (
        <List>
          {activities.map((activity) => (
            <ListItem key={activity.id} divider>
              <ListItemAvatar>
                <Avatar src={activity.user_avatar} alt={activity.user_name}>
                  {getActivityIcon(activity.activity_type)}
                </Avatar>
              </ListItemAvatar>

              <ListItemText
                primary={
                  <Box display="flex" alignItems="center" gap={1}>
                    <Typography variant="body2">{activity.content}</Typography>
                    <Chip
                      label={activity.activity_type.replace('_', ' ')}
                      size="small"
                      color={getActivityColor(activity.activity_type)}
                    />
                  </Box>
                }
                secondary={formatDistanceToNow(new Date(activity.created_at), {
                  addSuffix: true,
                })}
              />
            </ListItem>
          ))}
        </List>
      )}
    </Paper>
  );
};

export default GroupActivityFeed;
