import { useState, useEffect, useCallback } from 'react';
import {
  Box,
  Typography,
  Grid,
  Card,
  CardContent,
  CardHeader,
  Button,
  Tabs,
  Tab,
  Chip,
  Avatar,
  Paper,
  List,
  ListItem,
  ListItemText,
  ListItemAvatar,
  Divider,
  Alert,
  CircularProgress,
  useTheme,
  alpha,
  Badge,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
} from '@mui/material';
import {
  Person as PersonIcon,
  School as SchoolIcon,
  Message as MessageIcon,
  Share as ShareIcon,
  CheckCircleIcon,
  Warning as WarningIcon,
  Info as InfoIcon,
  Visibility as VisibilityIcon,
} from '@mui/icons-material';
import { useAuth } from '@/hooks/useAuth';
import collegeApi from '@/api/college';
import { CounselorFeedback, StudentCollegeList, CollegeApplication } from '@/types/college';

interface TabPanelProps {
  children?: React.ReactNode;
  index: number;
  value: number;
}

function TabPanel(props: TabPanelProps) {
  const { children, value, index, ...other } = props;
  return (
    <div
      role="tabpanel"
      hidden={value !== index}
      id={`counselor-tabpanel-${index}`}
      aria-labelledby={`counselor-tab-${index}`}
      {...other}
    >
      {value === index && <Box sx={{ py: 3 }}>{children}</Box>}
    </div>
  );
}

export default function CounselorCollaboration() {
  const theme = useTheme();
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState(0);
  const [collegeList, setCollegeList] = useState<StudentCollegeList | null>(null);
  const [applications, setApplications] = useState<CollegeApplication[]>([]);
  const [feedback, setFeedback] = useState<CounselorFeedback[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [shareDialogOpen, setShareDialogOpen] = useState(false);

  const studentId = user?.id ? parseInt(user.id, 10) : 1;

  const loadData = useCallback(async () => {
    try {
      setLoading(true);
      const [listData, appsData, feedbackData] = await Promise.all([
        collegeApi.getCollegeList(studentId),
        collegeApi.getApplications(studentId),
        collegeApi.getCounselorFeedback(studentId),
      ]);
      setCollegeList(listData);
      setApplications(appsData);
      setFeedback(feedbackData);
      setError(null);
    } catch (err) {
      setError('Failed to load counselor collaboration data');
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, [studentId]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const handleShareList = async () => {
    try {
      await collegeApi.shareCollegeListWithCounselor(studentId);
      await loadData();
      setShareDialogOpen(false);
      setError(null);
    } catch (err) {
      setError('Failed to share college list');
      console.error(err);
    }
  };

  const handleMarkAsRead = async (feedbackId: number) => {
    try {
      await collegeApi.markFeedbackAsRead(feedbackId);
      await loadData();
    } catch (err) {
      setError('Failed to mark feedback as read');
      console.error(err);
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high':
        return theme.palette.error.main;
      case 'medium':
        return theme.palette.warning.main;
      case 'low':
        return theme.palette.info.main;
      default:
        return theme.palette.grey[500];
    }
  };

  const unreadCount = feedback.filter((f) => !f.is_read).length;

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '60vh' }}>
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box>
      <Box sx={{ mb: 3, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <Typography variant="h4" fontWeight={700}>
          Counselor Collaboration
        </Typography>
        <Button
          variant="contained"
          startIcon={<ShareIcon />}
          onClick={() => setShareDialogOpen(true)}
          disabled={collegeList?.shared_with_counselor}
        >
          {collegeList?.shared_with_counselor ? 'Shared with Counselor' : 'Share College List'}
        </Button>
      </Box>

      {error && (
        <Alert severity="error" sx={{ mb: 3 }} onClose={() => setError(null)}>
          {error}
        </Alert>
      )}

      <Tabs value={activeTab} onChange={(_, newValue) => setActiveTab(newValue)} sx={{ mb: 3 }}>
        <Tab
          label={
            <Badge badgeContent={unreadCount} color="error">
              Feedback
            </Badge>
          }
        />
        <Tab label="My College List" />
        <Tab label="Application Review" />
      </Tabs>

      <TabPanel value={activeTab} index={0}>
        {feedback.length === 0 ? (
          <Card>
            <CardContent sx={{ textAlign: 'center', py: 8 }}>
              <MessageIcon sx={{ fontSize: 64, color: 'text.secondary', mb: 2 }} />
              <Typography variant="h6" color="text.secondary" gutterBottom>
                No feedback yet
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Your counselor will provide feedback on your college list and applications here
              </Typography>
            </CardContent>
          </Card>
        ) : (
          <Grid container spacing={3}>
            {feedback.map((item) => (
              <Grid item xs={12} key={item.id}>
                <Card
                  sx={{
                    bgcolor: item.is_read ? 'transparent' : alpha(theme.palette.primary.main, 0.05),
                    border: !item.is_read ? `1px solid ${theme.palette.primary.main}` : undefined,
                  }}
                >
                  <CardContent>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 2 }}>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                        <Avatar sx={{ bgcolor: theme.palette.primary.main }}>
                          <PersonIcon />
                        </Avatar>
                        <Box>
                          <Typography variant="subtitle2" fontWeight={600}>
                            {item.counselor_name}
                          </Typography>
                          <Typography variant="caption" color="text.secondary">
                            {new Date(item.created_at).toLocaleDateString()} at{' '}
                            {new Date(item.created_at).toLocaleTimeString()}
                          </Typography>
                        </Box>
                      </Box>
                      <Box sx={{ display: 'flex', gap: 1 }}>
                        <Chip label={item.feedback_type} size="small" variant="outlined" />
                        <Chip
                          label={item.priority}
                          size="small"
                          sx={{
                            bgcolor: alpha(getPriorityColor(item.priority), 0.1),
                            color: getPriorityColor(item.priority),
                          }}
                        />
                        {!item.is_read && <Chip label="New" size="small" color="primary" />}
                      </Box>
                    </Box>

                    {item.college_id && (
                      <Chip
                        icon={<SchoolIcon />}
                        label="Related to specific college"
                        size="small"
                        sx={{ mb: 2 }}
                      />
                    )}

                    <Paper sx={{ p: 2, bgcolor: alpha(theme.palette.grey[500], 0.05) }}>
                      <Typography variant="body1">{item.message}</Typography>
                    </Paper>

                    {!item.is_read && (
                      <Box sx={{ mt: 2, textAlign: 'right' }}>
                        <Button
                          size="small"
                          startIcon={<CheckCircleIcon />}
                          onClick={() => handleMarkAsRead(item.id)}
                        >
                          Mark as Read
                        </Button>
                      </Box>
                    )}
                  </CardContent>
                </Card>
              </Grid>
            ))}
          </Grid>
        )}
      </TabPanel>

      <TabPanel value={activeTab} index={1}>
        <Card sx={{ mb: 3 }}>
          <CardHeader title="College List Status" avatar={<InfoIcon />} />
          <CardContent>
            <Grid container spacing={2}>
              <Grid item xs={12} md={6}>
                <Typography variant="body2" color="text.secondary" gutterBottom>
                  Shared with Counselor
                </Typography>
                <Chip
                  icon={collegeList?.shared_with_counselor ? <CheckCircleIcon /> : <WarningIcon />}
                  label={collegeList?.shared_with_counselor ? 'Yes' : 'No'}
                  color={collegeList?.shared_with_counselor ? 'success' : 'warning'}
                />
              </Grid>
              <Grid item xs={12} md={6}>
                <Typography variant="body2" color="text.secondary" gutterBottom>
                  Counselor Approval
                </Typography>
                <Chip
                  icon={collegeList?.counselor_approved ? <CheckCircleIcon /> : <InfoIcon />}
                  label={
                    collegeList?.counselor_approved === true
                      ? 'Approved'
                      : collegeList?.counselor_approved === false
                        ? 'Needs Revision'
                        : 'Pending Review'
                  }
                  color={
                    collegeList?.counselor_approved === true
                      ? 'success'
                      : collegeList?.counselor_approved === false
                        ? 'error'
                        : 'default'
                  }
                />
              </Grid>
            </Grid>

            {collegeList?.counselor_notes && (
              <Box sx={{ mt: 3 }}>
                <Typography variant="subtitle2" fontWeight={700} gutterBottom>
                  Counselor Notes
                </Typography>
                <Paper sx={{ p: 2, bgcolor: alpha(theme.palette.info.main, 0.05) }}>
                  <Typography variant="body2">{collegeList.counselor_notes}</Typography>
                </Paper>
              </Box>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader
            title="My College Applications"
            subheader={`${applications.length} colleges in your list`}
          />
          <CardContent>
            {applications.length === 0 ? (
              <Box sx={{ textAlign: 'center', py: 4 }}>
                <SchoolIcon sx={{ fontSize: 64, color: 'text.secondary', mb: 2 }} />
                <Typography variant="body1" color="text.secondary">
                  No colleges in your list yet
                </Typography>
              </Box>
            ) : (
              <List>
                {applications.map((app, index) => (
                  <Box key={app.id}>
                    <ListItem>
                      <ListItemAvatar>
                        <Avatar sx={{ bgcolor: theme.palette.primary.main }}>
                          <SchoolIcon />
                        </Avatar>
                      </ListItemAvatar>
                      <ListItemText
                        primary={app.college?.name || 'College'}
                        secondary={
                          <Box sx={{ display: 'flex', gap: 0.5, mt: 0.5 }}>
                            <Chip label={app.priority} size="small" />
                            <Chip label={app.application_type} size="small" variant="outlined" />
                            <Chip label={app.status} size="small" color="primary" />
                          </Box>
                        }
                      />
                      <Typography variant="caption" color="text.secondary">
                        Deadline: {new Date(app.application_deadline).toLocaleDateString()}
                      </Typography>
                    </ListItem>
                    {index < applications.length - 1 && <Divider />}
                  </Box>
                ))}
              </List>
            )}
          </CardContent>
        </Card>
      </TabPanel>

      <TabPanel value={activeTab} index={2}>
        <Card>
          <CardHeader
            title="Application Review"
            subheader="Counselor's review of your application materials"
          />
          <CardContent>
            <Alert severity="info" icon={<InfoIcon />} sx={{ mb: 3 }}>
              Share your college list with your counselor to receive personalized feedback on your
              applications, essays, and overall college strategy.
            </Alert>

            {!collegeList?.shared_with_counselor ? (
              <Box sx={{ textAlign: 'center', py: 4 }}>
                <VisibilityIcon sx={{ fontSize: 64, color: 'text.secondary', mb: 2 }} />
                <Typography variant="h6" color="text.secondary" gutterBottom>
                  List not shared yet
                </Typography>
                <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
                  Share your college list with your counselor to get started
                </Typography>
                <Button
                  variant="contained"
                  startIcon={<ShareIcon />}
                  onClick={() => setShareDialogOpen(true)}
                >
                  Share Now
                </Button>
              </Box>
            ) : (
              <Grid container spacing={3}>
                <Grid item xs={12} md={6}>
                  <Card variant="outlined">
                    <CardContent>
                      <Typography variant="subtitle2" fontWeight={700} gutterBottom>
                        Overall Strategy
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        Your counselor has{' '}
                        {collegeList?.counselor_approved ? 'approved' : 'not yet reviewed'} your
                        overall college application strategy.
                      </Typography>
                    </CardContent>
                  </Card>
                </Grid>

                <Grid item xs={12} md={6}>
                  <Card variant="outlined">
                    <CardContent>
                      <Typography variant="subtitle2" fontWeight={700} gutterBottom>
                        College Balance
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        Reach: {applications.filter((a) => a.priority === 'reach').length} | Target:{' '}
                        {applications.filter((a) => a.priority === 'target').length} | Safety:{' '}
                        {applications.filter((a) => a.priority === 'safety').length}
                      </Typography>
                    </CardContent>
                  </Card>
                </Grid>
              </Grid>
            )}
          </CardContent>
        </Card>
      </TabPanel>

      <Dialog
        open={shareDialogOpen}
        onClose={() => setShareDialogOpen(false)}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>Share College List with Counselor</DialogTitle>
        <DialogContent>
          <Alert severity="info" sx={{ mb: 2 }}>
            Your counselor will be able to view your college list, applications, and provide
            personalized feedback.
          </Alert>
          <Typography variant="body2" paragraph>
            By sharing your college list, you&apos;ll receive:
          </Typography>
          <List dense>
            <ListItem>
              <ListItemText primary="• Personalized feedback on your college choices" />
            </ListItem>
            <ListItem>
              <ListItemText primary="• Guidance on balancing reach, target, and safety schools" />
            </ListItem>
            <ListItem>
              <ListItemText primary="• Review of application materials and essays" />
            </ListItem>
            <ListItem>
              <ListItemText primary="• Strategic advice for improving your applications" />
            </ListItem>
          </List>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setShareDialogOpen(false)}>Cancel</Button>
          <Button variant="contained" startIcon={<ShareIcon />} onClick={handleShareList}>
            Share List
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
