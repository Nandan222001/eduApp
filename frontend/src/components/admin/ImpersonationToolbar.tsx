import React, { useState, useEffect } from 'react';
import {
  Box,
  Paper,
  Typography,
  IconButton,
  Chip,
  Button,
  Collapse,
  Avatar,
  Stack,
  Divider,
  Alert,
  Tooltip,
  Timeline,
  TimelineItem,
  TimelineSeparator,
  TimelineConnector,
  TimelineContent,
  TimelineDot,
  TimelineOppositeContent,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
} from '@mui/material';
import {
  Close as CloseIcon,
  ExpandMore as ExpandMoreIcon,
  ExpandLess as ExpandLessIcon,
  Person as PersonIcon,
  Business as BusinessIcon,
  AccessTime as AccessTimeIcon,
  ExitToApp as ExitToAppIcon,
  SwapHoriz as SwapHorizIcon,
  Timeline as TimelineIcon,
  Visibility as VisibilityIcon,
} from '@mui/icons-material';
import { useAuth } from '../../contexts/AuthContext';
import { api } from '../../api/client';
import { format } from 'date-fns';

interface ImpersonationData {
  isImpersonating: boolean;
  impersonatedUser?: {
    id: number;
    email: string;
    name: string;
  };
  institution?: {
    id: number;
    name: string;
  };
  superAdmin?: {
    id: number;
    email: string;
  };
  startedAt?: string;
  expiresAt?: string;
  impersonationLogId?: number;
}

interface ActivityItem {
  id: number;
  activityType: string;
  description: string;
  timestamp: string;
  endpoint?: string;
  statusCode?: number;
}

const ImpersonationToolbar: React.FC = () => {
  const { user, token } = useAuth();
  const [impersonationData, setImpersonationData] = useState<ImpersonationData | null>(null);
  const [expanded, setExpanded] = useState(true);
  const [showTimeline, setShowTimeline] = useState(false);
  const [activities, setActivities] = useState<ActivityItem[]>([]);
  const [timeRemaining, setTimeRemaining] = useState<string>('');
  const [showConfirmExit, setShowConfirmExit] = useState(false);

  useEffect(() => {
    const checkImpersonation = () => {
      if (token) {
        try {
          const payload = JSON.parse(atob(token.split('.')[1]));
          if (payload.is_impersonated) {
            setImpersonationData({
              isImpersonating: true,
              impersonatedUser: {
                id: payload.sub,
                email: user?.email || '',
                name: user?.name || user?.email || '',
              },
              institution: payload.institution_id
                ? {
                    id: payload.institution_id,
                    name: 'Institution',
                  }
                : undefined,
              superAdmin: payload.super_admin_id
                ? {
                    id: payload.super_admin_id,
                    email: 'Super Admin',
                  }
                : undefined,
              expiresAt: payload.exp ? new Date(payload.exp * 1000).toISOString() : undefined,
              impersonationLogId: payload.impersonation_log_id,
            });
          }
        } catch (error) {
          console.error('Error parsing token:', error);
        }
      }
    };

    checkImpersonation();
  }, [token, user]);

  useEffect(() => {
    if (impersonationData?.expiresAt) {
      const interval = setInterval(() => {
        const now = new Date().getTime();
        const expiry = new Date(impersonationData.expiresAt!).getTime();
        const diff = expiry - now;

        if (diff <= 0) {
          setTimeRemaining('Expired');
          clearInterval(interval);
        } else {
          const minutes = Math.floor(diff / 60000);
          const seconds = Math.floor((diff % 60000) / 1000);
          setTimeRemaining(`${minutes}m ${seconds}s`);
        }
      }, 1000);

      return () => clearInterval(interval);
    }
  }, [impersonationData]);

  useEffect(() => {
    if (showTimeline && impersonationData?.impersonatedUser?.id) {
      fetchActivities();
    }
  }, [showTimeline, impersonationData]);

  const fetchActivities = async () => {
    try {
      const response = await api.get('/super-admin/activity-logs', {
        params: {
          user_id: impersonationData?.impersonatedUser?.id,
          page: 1,
          page_size: 10,
        },
      });
      setActivities(response.data.items);
    } catch (error) {
      console.error('Error fetching activities:', error);
    }
  };

  const handleEndImpersonation = async () => {
    if (!impersonationData?.impersonationLogId) return;

    try {
      await api.post('/super-admin/end-impersonation', {
        impersonation_log_id: impersonationData.impersonationLogId,
      });
      
      window.location.href = '/super-admin';
    } catch (error) {
      console.error('Error ending impersonation:', error);
      alert('Failed to end impersonation. Please try again.');
    }
  };

  if (!impersonationData?.isImpersonating) {
    return null;
  }

  return (
    <>
      <Paper
        elevation={8}
        sx={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          zIndex: 9999,
          background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
          color: 'white',
          borderRadius: 0,
        }}
      >
        <Box sx={{ px: 3, py: 1.5 }}>
          <Stack direction="row" alignItems="center" spacing={2}>
            <Chip
              icon={<VisibilityIcon />}
              label="IMPERSONATION MODE"
              color="warning"
              sx={{
                fontWeight: 'bold',
                fontSize: '0.9rem',
                animation: 'pulse 2s infinite',
                '@keyframes pulse': {
                  '0%, 100%': { opacity: 1 },
                  '50%': { opacity: 0.7 },
                },
              }}
            />

            <Stack direction="row" alignItems="center" spacing={1} sx={{ flex: 1 }}>
              <Avatar sx={{ width: 32, height: 32, bgcolor: 'rgba(255, 255, 255, 0.2)' }}>
                <PersonIcon fontSize="small" />
              </Avatar>
              <Box>
                <Typography variant="body2" fontWeight="bold">
                  {impersonationData.impersonatedUser?.name}
                </Typography>
                <Typography variant="caption" sx={{ opacity: 0.9 }}>
                  {impersonationData.impersonatedUser?.email}
                </Typography>
              </Box>
            </Stack>

            {impersonationData.institution && (
              <Stack direction="row" alignItems="center" spacing={1}>
                <BusinessIcon fontSize="small" />
                <Typography variant="body2">{impersonationData.institution.name}</Typography>
              </Stack>
            )}

            <Stack direction="row" alignItems="center" spacing={1}>
              <AccessTimeIcon fontSize="small" />
              <Typography variant="body2" fontWeight="medium">
                {timeRemaining}
              </Typography>
            </Stack>

            <Tooltip title="View Activity Timeline">
              <IconButton
                size="small"
                onClick={() => setShowTimeline(!showTimeline)}
                sx={{ color: 'white' }}
              >
                <TimelineIcon />
              </IconButton>
            </Tooltip>

            <Button
              variant="contained"
              size="small"
              startIcon={<ExitToAppIcon />}
              onClick={() => setShowConfirmExit(true)}
              sx={{
                bgcolor: 'rgba(255, 255, 255, 0.2)',
                '&:hover': {
                  bgcolor: 'rgba(255, 255, 255, 0.3)',
                },
              }}
            >
              Exit Impersonation
            </Button>

            <IconButton
              size="small"
              onClick={() => setExpanded(!expanded)}
              sx={{ color: 'white' }}
            >
              {expanded ? <ExpandLessIcon /> : <ExpandMoreIcon />}
            </IconButton>
          </Stack>
        </Box>

        <Collapse in={expanded}>
          <Divider sx={{ borderColor: 'rgba(255, 255, 255, 0.2)' }} />
          <Box sx={{ px: 3, py: 2, bgcolor: 'rgba(0, 0, 0, 0.1)' }}>
            <Alert severity="warning" icon={<VisibilityIcon />} sx={{ mb: 2 }}>
              <Typography variant="body2" fontWeight="medium">
                You are viewing this account as a super admin. All actions are being logged.
              </Typography>
            </Alert>

            <Stack direction="row" spacing={4} sx={{ color: 'rgba(255, 255, 255, 0.9)' }}>
              <Box>
                <Typography variant="caption" sx={{ opacity: 0.8 }}>
                  User ID
                </Typography>
                <Typography variant="body2" fontWeight="medium">
                  {impersonationData.impersonatedUser?.id}
                </Typography>
              </Box>
              <Box>
                <Typography variant="caption" sx={{ opacity: 0.8 }}>
                  Institution ID
                </Typography>
                <Typography variant="body2" fontWeight="medium">
                  {impersonationData.institution?.id || 'N/A'}
                </Typography>
              </Box>
              <Box>
                <Typography variant="caption" sx={{ opacity: 0.8 }}>
                  Session Started
                </Typography>
                <Typography variant="body2" fontWeight="medium">
                  {impersonationData.startedAt
                    ? format(new Date(impersonationData.startedAt), 'HH:mm:ss')
                    : 'N/A'}
                </Typography>
              </Box>
              <Box>
                <Typography variant="caption" sx={{ opacity: 0.8 }}>
                  Session Expires
                </Typography>
                <Typography variant="body2" fontWeight="medium">
                  {impersonationData.expiresAt
                    ? format(new Date(impersonationData.expiresAt), 'HH:mm:ss')
                    : 'N/A'}
                </Typography>
              </Box>
            </Stack>
          </Box>
        </Collapse>
      </Paper>

      <Dialog
        open={showTimeline}
        onClose={() => setShowTimeline(false)}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle>
          <Stack direction="row" alignItems="center" justifyContent="space-between">
            <Typography variant="h6">Activity Timeline</Typography>
            <IconButton onClick={() => setShowTimeline(false)} size="small">
              <CloseIcon />
            </IconButton>
          </Stack>
        </DialogTitle>
        <DialogContent>
          {activities.length === 0 ? (
            <Typography variant="body2" color="text.secondary" textAlign="center" py={4}>
              No recent activity to display
            </Typography>
          ) : (
            <Timeline>
              {activities.map((activity, index) => (
                <TimelineItem key={activity.id}>
                  <TimelineOppositeContent color="text.secondary" sx={{ flex: 0.3 }}>
                    <Typography variant="caption">
                      {format(new Date(activity.timestamp), 'HH:mm:ss')}
                    </Typography>
                  </TimelineOppositeContent>
                  <TimelineSeparator>
                    <TimelineDot
                      color={
                        activity.statusCode && activity.statusCode >= 400
                          ? 'error'
                          : activity.statusCode && activity.statusCode >= 200
                          ? 'success'
                          : 'grey'
                      }
                    />
                    {index < activities.length - 1 && <TimelineConnector />}
                  </TimelineSeparator>
                  <TimelineContent>
                    <Typography variant="body2" fontWeight="medium">
                      {activity.activityType}
                    </Typography>
                    <Typography variant="caption" color="text.secondary">
                      {activity.description}
                    </Typography>
                    {activity.endpoint && (
                      <Typography variant="caption" display="block" sx={{ opacity: 0.7 }}>
                        {activity.endpoint}
                      </Typography>
                    )}
                  </TimelineContent>
                </TimelineItem>
              ))}
            </Timeline>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setShowTimeline(false)}>Close</Button>
        </DialogActions>
      </Dialog>

      <Dialog open={showConfirmExit} onClose={() => setShowConfirmExit(false)}>
        <DialogTitle>Exit Impersonation Mode?</DialogTitle>
        <DialogContent>
          <Typography>
            Are you sure you want to exit impersonation mode? You will be returned to the super
            admin dashboard.
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setShowConfirmExit(false)}>Cancel</Button>
          <Button
            onClick={() => {
              setShowConfirmExit(false);
              handleEndImpersonation();
            }}
            variant="contained"
            color="primary"
          >
            Exit Impersonation
          </Button>
        </DialogActions>
      </Dialog>

      <Box sx={{ height: expanded ? 180 : 60 }} />
    </>
  );
};

export default ImpersonationToolbar;
