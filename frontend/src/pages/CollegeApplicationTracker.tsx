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
  LinearProgress,
  Divider,
  Alert,
  CircularProgress,
  useTheme,
  alpha,
  Checkbox,
  FormControlLabel,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
} from '@mui/material';
import {
  Add as AddIcon,
  School as SchoolIcon,
  Event as EventIcon,
  CheckCircleIcon,
  Person as PersonIcon,
  Warning as WarningIcon,
  Send as SendIcon,
  Drafts as DraftsIcon,
  Mail as MailIcon,
} from '@mui/icons-material';
import { useAuth } from '@/hooks/useAuth';
import collegeApi from '@/api/college';
import { CollegeApplication, ApplicationStatistics, DeadlineUrgency } from '@/types/college';

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
      id={`tracker-tabpanel-${index}`}
      aria-labelledby={`tracker-tab-${index}`}
      {...other}
    >
      {value === index && <Box sx={{ py: 3 }}>{children}</Box>}
    </div>
  );
}

export default function CollegeApplicationTracker() {
  const theme = useTheme();
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState(0);
  const [applications, setApplications] = useState<CollegeApplication[]>([]);
  const [statistics, setStatistics] = useState<ApplicationStatistics | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const studentId = user?.id ? parseInt(user.id, 10) : 1;

  const loadData = useCallback(async () => {
    try {
      setLoading(true);
      const [applicationsData, statsData] = await Promise.all([
        collegeApi.getApplications(studentId),
        collegeApi.getApplicationStatistics(studentId),
      ]);
      setApplications(applicationsData);
      setStatistics(statsData);
      setError(null);
    } catch (err) {
      setError('Failed to load application data');
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, [studentId]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const getDeadlineUrgency = (deadline: string): DeadlineUrgency => {
    const today = new Date();
    const deadlineDate = new Date(deadline);
    const daysRemaining = Math.ceil(
      (deadlineDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24)
    );

    if (daysRemaining < 0) {
      return {
        application_id: 0,
        college_name: '',
        deadline,
        days_remaining: daysRemaining,
        urgency: 'critical',
        color: theme.palette.error.main,
      };
    } else if (daysRemaining <= 7) {
      return {
        application_id: 0,
        college_name: '',
        deadline,
        days_remaining: daysRemaining,
        urgency: 'critical',
        color: theme.palette.error.main,
      };
    } else if (daysRemaining <= 30) {
      return {
        application_id: 0,
        college_name: '',
        deadline,
        days_remaining: daysRemaining,
        urgency: 'warning',
        color: theme.palette.warning.main,
      };
    } else {
      return {
        application_id: 0,
        college_name: '',
        deadline,
        days_remaining: daysRemaining,
        urgency: 'normal',
        color: theme.palette.success.main,
      };
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'accepted':
        return theme.palette.success.main;
      case 'rejected':
        return theme.palette.error.main;
      case 'waitlisted':
      case 'deferred':
        return theme.palette.warning.main;
      case 'submitted':
      case 'under-review':
        return theme.palette.info.main;
      default:
        return theme.palette.grey[500];
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'reach':
        return theme.palette.error.main;
      case 'target':
        return theme.palette.warning.main;
      case 'safety':
        return theme.palette.success.main;
      default:
        return theme.palette.grey[500];
    }
  };

  const calculateCompletionPercentage = (app: CollegeApplication): number => {
    if (!app.checklist_items || app.checklist_items.length === 0) return 0;
    const completed = app.checklist_items.filter((item) => item.is_completed).length;
    return (completed / app.checklist_items.length) * 100;
  };

  const handleChecklistToggle = async (itemId: number, isCompleted: boolean) => {
    try {
      await collegeApi.updateChecklistItem(itemId, { is_completed: !isCompleted });
      await loadData();
    } catch (err) {
      setError('Failed to update checklist item');
      console.error(err);
    }
  };

  const groupByStatus = () => {
    const groups: { [key: string]: CollegeApplication[] } = {
      planning: [],
      'in-progress': [],
      submitted: [],
      'under-review': [],
      accepted: [],
      waitlisted: [],
      deferred: [],
      rejected: [],
    };

    applications.forEach((app) => {
      if (groups[app.status]) {
        groups[app.status].push(app);
      }
    });

    return groups;
  };

  const kanbanColumns = [
    { key: 'planning', label: 'Planning', color: theme.palette.grey[500] },
    { key: 'in-progress', label: 'In Progress', color: theme.palette.info.main },
    { key: 'submitted', label: 'Submitted', color: theme.palette.primary.main },
    { key: 'under-review', label: 'Under Review', color: theme.palette.warning.main },
    { key: 'accepted', label: 'Accepted', color: theme.palette.success.main },
  ];

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
          College Application Tracker
        </Typography>
        <Button
          variant="contained"
          startIcon={<AddIcon />}
          onClick={() => setApplicationDialogOpen(true)}
        >
          Add Application
        </Button>
      </Box>

      {error && (
        <Alert severity="error" sx={{ mb: 3 }} onClose={() => setError(null)}>
          {error}
        </Alert>
      )}

      {statistics && (
        <Grid container spacing={3} sx={{ mb: 3 }}>
          <Grid item xs={12} sm={6} md={3}>
            <Card>
              <CardContent>
                <Box
                  sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}
                >
                  <Box>
                    <Typography variant="h4" fontWeight={700}>
                      {statistics.total_applications}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      Total Applications
                    </Typography>
                  </Box>
                  <Avatar sx={{ bgcolor: alpha(theme.palette.primary.main, 0.1) }}>
                    <SchoolIcon color="primary" />
                  </Avatar>
                </Box>
              </CardContent>
            </Card>
          </Grid>

          <Grid item xs={12} sm={6} md={3}>
            <Card>
              <CardContent>
                <Box
                  sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}
                >
                  <Box>
                    <Typography variant="h4" fontWeight={700}>
                      {statistics.by_status.submitted + statistics.by_status.under_review}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      Submitted
                    </Typography>
                  </Box>
                  <Avatar sx={{ bgcolor: alpha(theme.palette.info.main, 0.1) }}>
                    <SendIcon color="info" />
                  </Avatar>
                </Box>
              </CardContent>
            </Card>
          </Grid>

          <Grid item xs={12} sm={6} md={3}>
            <Card>
              <CardContent>
                <Box
                  sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}
                >
                  <Box>
                    <Typography variant="h4" fontWeight={700}>
                      {statistics.by_status.accepted}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      Accepted
                    </Typography>
                  </Box>
                  <Avatar sx={{ bgcolor: alpha(theme.palette.success.main, 0.1) }}>
                    <CheckCircleIcon color="success" />
                  </Avatar>
                </Box>
              </CardContent>
            </Card>
          </Grid>

          <Grid item xs={12} sm={6} md={3}>
            <Card>
              <CardContent>
                <Box
                  sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}
                >
                  <Box>
                    <Typography variant="h4" fontWeight={700}>
                      {statistics.upcoming_deadlines}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      Upcoming Deadlines
                    </Typography>
                  </Box>
                  <Avatar sx={{ bgcolor: alpha(theme.palette.warning.main, 0.1) }}>
                    <WarningIcon color="warning" />
                  </Avatar>
                </Box>
              </CardContent>
            </Card>
          </Grid>
        </Grid>
      )}

      <Tabs value={activeTab} onChange={(_, newValue) => setActiveTab(newValue)} sx={{ mb: 3 }}>
        <Tab label="Kanban Board" />
        <Tab label="Timeline" />
        <Tab label="Checklist" />
        <Tab label="Essays" />
        <Tab label="Recommendations" />
        <Tab label="Decisions" />
      </Tabs>

      <TabPanel value={activeTab} index={0}>
        <Box sx={{ display: 'flex', gap: 2, overflowX: 'auto', pb: 2 }}>
          {kanbanColumns.map((column) => {
            const apps = groupByStatus()[column.key] || [];
            return (
              <Paper
                key={column.key}
                sx={{
                  minWidth: 300,
                  maxWidth: 300,
                  bgcolor: alpha(column.color, 0.05),
                  p: 2,
                }}
              >
                <Box sx={{ mb: 2, display: 'flex', alignItems: 'center', gap: 1 }}>
                  <Box
                    sx={{
                      width: 12,
                      height: 12,
                      borderRadius: '50%',
                      bgcolor: column.color,
                    }}
                  />
                  <Typography variant="subtitle2" fontWeight={700}>
                    {column.label}
                  </Typography>
                  <Chip label={apps.length} size="small" />
                </Box>

                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                  {apps.map((app) => (
                    <Card
                      key={app.id}
                      sx={{
                        cursor: 'pointer',
                        '&:hover': { boxShadow: theme.shadows[4] },
                      }}
                      onClick={() => setSelectedApplication(app)}
                    >
                      <CardContent>
                        <Typography variant="subtitle2" fontWeight={600} gutterBottom>
                          {app.college?.name || 'College'}
                        </Typography>
                        <Box sx={{ display: 'flex', gap: 0.5, mb: 1 }}>
                          <Chip
                            label={app.priority}
                            size="small"
                            sx={{
                              bgcolor: alpha(getPriorityColor(app.priority), 0.1),
                              color: getPriorityColor(app.priority),
                              fontSize: '0.7rem',
                            }}
                          />
                          <Chip
                            label={app.application_type}
                            size="small"
                            variant="outlined"
                            sx={{ fontSize: '0.7rem' }}
                          />
                        </Box>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                          <EventIcon fontSize="small" color="action" />
                          <Typography variant="caption" color="text.secondary">
                            {new Date(app.application_deadline).toLocaleDateString()}
                          </Typography>
                        </Box>
                        {app.checklist_items && app.checklist_items.length > 0 && (
                          <Box>
                            <Typography variant="caption" color="text.secondary" display="block">
                              {calculateCompletionPercentage(app).toFixed(0)}% Complete
                            </Typography>
                            <LinearProgress
                              variant="determinate"
                              value={calculateCompletionPercentage(app)}
                              sx={{ mt: 0.5 }}
                            />
                          </Box>
                        )}
                      </CardContent>
                    </Card>
                  ))}
                </Box>
              </Paper>
            );
          })}
        </Box>
      </TabPanel>

      <TabPanel value={activeTab} index={1}>
        <Card>
          <CardHeader
            title="Application Timeline"
            subheader="Deadlines sorted by urgency"
            avatar={<EventIcon />}
          />
          <CardContent>
            <List>
              {applications
                .filter((app) => app.status !== 'accepted' && app.status !== 'rejected')
                .sort(
                  (a, b) =>
                    new Date(a.application_deadline).getTime() -
                    new Date(b.application_deadline).getTime()
                )
                .map((app) => {
                  const urgency = getDeadlineUrgency(app.application_deadline);
                  return (
                    <Box key={app.id}>
                      <ListItem>
                        <Box sx={{ width: '100%' }}>
                          <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                              <Box
                                sx={{
                                  width: 8,
                                  height: 8,
                                  borderRadius: '50%',
                                  bgcolor: urgency.color,
                                }}
                              />
                              <Typography variant="subtitle2" fontWeight={600}>
                                {app.college?.name || 'College'}
                              </Typography>
                            </Box>
                            <Chip
                              label={`${urgency.days_remaining} days`}
                              size="small"
                              sx={{
                                bgcolor: alpha(urgency.color, 0.1),
                                color: urgency.color,
                                fontWeight: 600,
                              }}
                            />
                          </Box>
                          <Box sx={{ display: 'flex', gap: 1, mb: 1 }}>
                            <Chip label={app.application_type} size="small" variant="outlined" />
                            <Chip
                              label={app.priority}
                              size="small"
                              sx={{
                                bgcolor: alpha(getPriorityColor(app.priority), 0.1),
                                color: getPriorityColor(app.priority),
                              }}
                            />
                          </Box>
                          <Typography variant="caption" color="text.secondary">
                            Deadline: {new Date(app.application_deadline).toLocaleDateString()}
                          </Typography>
                        </Box>
                      </ListItem>
                      <Divider />
                    </Box>
                  );
                })}
            </List>
          </CardContent>
        </Card>
      </TabPanel>

      <TabPanel value={activeTab} index={2}>
        <Grid container spacing={3}>
          {applications.map((app) => (
            <Grid item xs={12} md={6} key={app.id}>
              <Card>
                <CardHeader
                  title={app.college?.name || 'College'}
                  subheader={`${calculateCompletionPercentage(app).toFixed(0)}% Complete`}
                  avatar={
                    <Avatar sx={{ bgcolor: theme.palette.primary.main }}>
                      <SchoolIcon />
                    </Avatar>
                  }
                />
                <CardContent>
                  <LinearProgress
                    variant="determinate"
                    value={calculateCompletionPercentage(app)}
                    sx={{ mb: 2 }}
                  />
                  <List dense>
                    {app.checklist_items?.map((item) => (
                      <ListItem key={item.id} disablePadding>
                        <FormControlLabel
                          control={
                            <Checkbox
                              checked={item.is_completed}
                              onChange={() => handleChecklistToggle(item.id, item.is_completed)}
                            />
                          }
                          label={
                            <Box>
                              <Typography variant="body2">{item.title}</Typography>
                              {item.due_date && (
                                <Typography variant="caption" color="text.secondary">
                                  Due: {new Date(item.due_date).toLocaleDateString()}
                                </Typography>
                              )}
                            </Box>
                          }
                        />
                      </ListItem>
                    ))}
                  </List>
                </CardContent>
              </Card>
            </Grid>
          ))}
        </Grid>
      </TabPanel>

      <TabPanel value={activeTab} index={3}>
        <Grid container spacing={3}>
          {applications.map((app) => (
            <Grid item xs={12} key={app.id}>
              <Card>
                <CardHeader
                  title={app.college?.name || 'College'}
                  avatar={
                    <Avatar sx={{ bgcolor: theme.palette.primary.main }}>
                      <DraftsIcon />
                    </Avatar>
                  }
                />
                <CardContent>
                  {app.essays && app.essays.length > 0 ? (
                    <List>
                      {app.essays.map((essay) => (
                        <Box key={essay.id}>
                          <ListItem
                            secondaryAction={
                              <Button
                                size="small"
                                variant="outlined"
                                onClick={() => {
                                  setSelectedEssay(essay);
                                  setEssayDialogOpen(true);
                                }}
                              >
                                Edit
                              </Button>
                            }
                          >
                            <ListItemText
                              primary={essay.prompt.substring(0, 100) + '...'}
                              secondary={
                                <Box sx={{ display: 'flex', gap: 1, mt: 1 }}>
                                  <Chip
                                    label={essay.status}
                                    size="small"
                                    color={
                                      essay.status === 'final'
                                        ? 'success'
                                        : essay.status === 'revision'
                                          ? 'warning'
                                          : 'default'
                                    }
                                  />
                                  <Chip
                                    label={`${essay.current_word_count} words`}
                                    size="small"
                                    variant="outlined"
                                  />
                                  <Chip
                                    label={`${essay.draft_count} drafts`}
                                    size="small"
                                    variant="outlined"
                                  />
                                </Box>
                              }
                            />
                          </ListItem>
                          <Divider />
                        </Box>
                      ))}
                    </List>
                  ) : (
                    <Typography variant="body2" color="text.secondary">
                      No essays yet
                    </Typography>
                  )}
                </CardContent>
              </Card>
            </Grid>
          ))}
        </Grid>
      </TabPanel>

      <TabPanel value={activeTab} index={4}>
        <Card>
          <CardHeader
            title="Recommendation Requests"
            subheader="Track teacher recommendations"
            avatar={<PersonIcon />}
          />
          <CardContent>
            <TableContainer>
              <Table>
                <TableHead>
                  <TableRow>
                    <TableCell>College</TableCell>
                    <TableCell>Teacher</TableCell>
                    <TableCell>Subject</TableCell>
                    <TableCell>Status</TableCell>
                    <TableCell>Due Date</TableCell>
                    <TableCell>Actions</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {applications.map((app) =>
                    app.recommendations?.map((rec) => (
                      <TableRow key={rec.id}>
                        <TableCell>{app.college?.name || 'College'}</TableCell>
                        <TableCell>{rec.teacher_name}</TableCell>
                        <TableCell>{rec.subject || '-'}</TableCell>
                        <TableCell>
                          <Chip
                            label={rec.status}
                            size="small"
                            color={
                              rec.status === 'submitted'
                                ? 'success'
                                : rec.status === 'in-progress'
                                  ? 'warning'
                                  : 'default'
                            }
                          />
                        </TableCell>
                        <TableCell>{new Date(rec.due_date).toLocaleDateString()}</TableCell>
                        <TableCell>
                          {rec.status !== 'submitted' && (
                            <Button
                              size="small"
                              startIcon={<MailIcon />}
                              onClick={() => collegeApi.sendRecommendationReminder(rec.id)}
                            >
                              Remind
                            </Button>
                          )}
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </TableContainer>
          </CardContent>
        </Card>
      </TabPanel>

      <TabPanel value={activeTab} index={5}>
        <Grid container spacing={3}>
          <Grid item xs={12} md={4}>
            <Card>
              <CardContent>
                <Box sx={{ textAlign: 'center' }}>
                  <Typography variant="h3" fontWeight={700} color="success.main">
                    {statistics?.by_status.accepted || 0}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Acceptances
                  </Typography>
                </Box>
              </CardContent>
            </Card>
          </Grid>

          <Grid item xs={12} md={4}>
            <Card>
              <CardContent>
                <Box sx={{ textAlign: 'center' }}>
                  <Typography variant="h3" fontWeight={700} color="warning.main">
                    {statistics?.by_status.waitlisted || 0}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Waitlisted
                  </Typography>
                </Box>
              </CardContent>
            </Card>
          </Grid>

          <Grid item xs={12} md={4}>
            <Card>
              <CardContent>
                <Box sx={{ textAlign: 'center' }}>
                  <Typography variant="h3" fontWeight={700}>
                    {statistics?.acceptance_rate.toFixed(1) || 0}%
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Acceptance Rate
                  </Typography>
                </Box>
              </CardContent>
            </Card>
          </Grid>

          <Grid item xs={12}>
            <Card>
              <CardHeader title="Decision Results" />
              <CardContent>
                <TableContainer>
                  <Table>
                    <TableHead>
                      <TableRow>
                        <TableCell>College</TableCell>
                        <TableCell>Priority</TableCell>
                        <TableCell>Decision</TableCell>
                        <TableCell>Decision Date</TableCell>
                        <TableCell>Financial Aid</TableCell>
                        <TableCell>Net Cost</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {applications
                        .filter((app) =>
                          ['accepted', 'waitlisted', 'deferred', 'rejected'].includes(app.status)
                        )
                        .map((app) => (
                          <TableRow key={app.id}>
                            <TableCell>{app.college?.name || 'College'}</TableCell>
                            <TableCell>
                              <Chip
                                label={app.priority}
                                size="small"
                                sx={{
                                  bgcolor: alpha(getPriorityColor(app.priority), 0.1),
                                  color: getPriorityColor(app.priority),
                                }}
                              />
                            </TableCell>
                            <TableCell>
                              <Chip
                                label={app.decision_result || app.status}
                                size="small"
                                sx={{
                                  bgcolor: alpha(getStatusColor(app.status), 0.1),
                                  color: getStatusColor(app.status),
                                }}
                              />
                            </TableCell>
                            <TableCell>
                              {app.decision_date
                                ? new Date(app.decision_date).toLocaleDateString()
                                : '-'}
                            </TableCell>
                            <TableCell>
                              {app.financial_aid_offered
                                ? `$${app.financial_aid_offered.toLocaleString()}`
                                : '-'}
                            </TableCell>
                            <TableCell>
                              {app.net_cost ? `$${app.net_cost.toLocaleString()}` : '-'}
                            </TableCell>
                          </TableRow>
                        ))}
                    </TableBody>
                  </Table>
                </TableContainer>
              </CardContent>
            </Card>
          </Grid>
        </Grid>
      </TabPanel>
    </Box>
  );
}
