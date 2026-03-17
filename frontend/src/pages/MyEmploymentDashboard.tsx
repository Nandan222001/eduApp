import { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Grid,
  Card,
  CardContent,
  Button,
  TextField,
  Alert,
  CircularProgress,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  List,
  ListItem,
  ListItemText,
  Chip,
  Paper,
  Divider,
  Breadcrumbs,
  Link,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Tabs,
  Tab,
} from '@mui/material';
import {
  Work as WorkIcon,
  Schedule as ScheduleIcon,
  TrendingUp as TrendingUpIcon,
  Send as SendIcon,
  Download as DownloadIcon,
  Add as AddIcon,
  CheckCircle as VerifiedIcon,
  Assignment as AssignmentIcon,
} from '@mui/icons-material';
import employmentApi from '@/api/employment';
import { StudentEmployment, StudentEmploymentSummary, StudentEmploymentCreate } from '@/types/employment';
import { useAuth } from '@/hooks/useAuth';
import { TimesheetIntegration } from '@/components/employment';

interface TabPanelProps {
  children?: React.ReactNode;
  index: number;
  value: number;
}

function TabPanel(props: TabPanelProps) {
  const { children, value, index, ...other } = props;
  return (
    <div role="tabpanel" hidden={value !== index} {...other}>
      {value === index && <Box sx={{ py: 3 }}>{children}</Box>}
    </div>
  );
}

export default function MyEmploymentDashboard() {
  const { user } = useAuth();
  const [tabValue, setTabValue] = useState(0);
  const [employments, setEmployments] = useState<StudentEmployment[]>([]);
  const [currentJobs, setCurrentJobs] = useState<StudentEmployment[]>([]);
  const [employmentHistory, setEmploymentHistory] = useState<StudentEmployment[]>([]);
  const [summary, setSummary] = useState<StudentEmploymentSummary | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [addJobDialogOpen, setAddJobDialogOpen] = useState(false);
  const [referenceDialogOpen, setReferenceDialogOpen] = useState(false);
  const [selectedJob, setSelectedJob] = useState<StudentEmployment | null>(null);
  const [referenceMessage, setReferenceMessage] = useState('');

  const [jobForm, setJobForm] = useState<Partial<StudentEmploymentCreate>>({
    employer: '',
    job_title: '',
    job_type: 'part_time',
    start_date: new Date().toISOString().split('T')[0],
    hours_per_week: 0,
    hourly_pay: 0,
    skills_gained: '',
    responsibilities: '',
    supervisor_name: '',
    supervisor_contact: '',
  });

  useEffect(() => {
    if (user?.id) {
      fetchEmploymentData();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user]);

  const fetchEmploymentData = async () => {
    if (!user?.id) return;

    try {
      setLoading(true);
      const studentId = parseInt(user.id);

      const [allJobs, summaryData] = await Promise.all([
        employmentApi.getStudentEmployments(studentId),
        employmentApi.getStudentEmploymentSummary(studentId),
      ]);

      setEmployments(allJobs);
      setCurrentJobs(allJobs.filter((job) => job.is_current));
      setEmploymentHistory(allJobs.filter((job) => !job.is_current));
      setSummary(summaryData);
      setError(null);
    } catch (err) {
      setError('Failed to load employment data');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleAddJob = async () => {
    if (!user?.id || !user?.institution_id) return;

    try {
      const employmentData: StudentEmploymentCreate = {
        institution_id: user.institution_id,
        student_id: parseInt(user.id),
        employer: jobForm.employer!,
        job_title: jobForm.job_title!,
        job_type: jobForm.job_type!,
        start_date: jobForm.start_date!,
        hours_per_week: jobForm.hours_per_week,
        hourly_pay: jobForm.hourly_pay,
        skills_gained: jobForm.skills_gained,
        responsibilities: jobForm.responsibilities,
        supervisor_name: jobForm.supervisor_name,
        supervisor_contact: jobForm.supervisor_contact,
        is_current: true,
      };

      await employmentApi.createEmployment(employmentData);
      setAddJobDialogOpen(false);
      resetJobForm();
      fetchEmploymentData();
      setError(null);
    } catch (err) {
      setError('Failed to add employment record');
      console.error(err);
    }
  };

  const resetJobForm = () => {
    setJobForm({
      employer: '',
      job_title: '',
      job_type: 'part_time',
      start_date: new Date().toISOString().split('T')[0],
      hours_per_week: 0,
      hourly_pay: 0,
      skills_gained: '',
      responsibilities: '',
      supervisor_name: '',
      supervisor_contact: '',
    });
  };

  const handleRequestReference = (job: StudentEmployment) => {
    setSelectedJob(job);
    setReferenceDialogOpen(true);
    setReferenceMessage(
      `Dear ${job.supervisor_name || 'Supervisor'},\n\nI am requesting a letter of reference for my employment as ${job.job_title} at ${job.employer}. This reference will be used for college applications and future employment opportunities.\n\nThank you for your time and consideration.\n\nBest regards,`
    );
  };

  const handleSendReferenceRequest = () => {
    setReferenceDialogOpen(false);
    setReferenceMessage('');
    alert('Reference request sent successfully!');
  };

  const handleDownloadSummary = () => {
    alert('Work experience summary downloaded!');
  };

  const getJobTypeColor = (type: string) => {
    switch (type) {
      case 'part_time':
        return 'primary';
      case 'seasonal':
        return 'secondary';
      case 'internship':
        return 'success';
      case 'volunteer':
        return 'info';
      default:
        return 'default';
    }
  };

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '60vh' }}>
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box>
      <Box sx={{ mb: 4 }}>
        <Breadcrumbs sx={{ mb: 2 }}>
          <Link color="inherit" href="/" underline="hover">
            Home
          </Link>
          <Typography color="text.primary">My Employment</Typography>
        </Breadcrumbs>

        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 2 }}>
          <Typography variant="h4" fontWeight={700}>
            My Employment Dashboard
          </Typography>
          <Button variant="contained" startIcon={<AddIcon />} onClick={() => setAddJobDialogOpen(true)}>
            Add Employment
          </Button>
        </Box>

        <Typography variant="body1" color="text.secondary">
          Track your work experience and build your professional portfolio
        </Typography>
      </Box>

      {error && (
        <Alert severity="error" sx={{ mb: 3 }} onClose={() => setError(null)}>
          {error}
        </Alert>
      )}

      {summary && (
        <Grid container spacing={3} sx={{ mb: 4 }}>
          <Grid item xs={12} sm={6} md={3}>
            <Card>
              <CardContent>
                <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <Box>
                    <Typography variant="body2" color="text.secondary">
                      Total Jobs
                    </Typography>
                    <Typography variant="h4" fontWeight={700}>
                      {summary.total_jobs}
                    </Typography>
                  </Box>
                  <WorkIcon sx={{ fontSize: 48, color: 'primary.main', opacity: 0.3 }} />
                </Box>
              </CardContent>
            </Card>
          </Grid>

          <Grid item xs={12} sm={6} md={3}>
            <Card>
              <CardContent>
                <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <Box>
                    <Typography variant="body2" color="text.secondary">
                      Current Jobs
                    </Typography>
                    <Typography variant="h4" fontWeight={700}>
                      {summary.current_jobs}
                    </Typography>
                  </Box>
                  <ScheduleIcon sx={{ fontSize: 48, color: 'success.main', opacity: 0.3 }} />
                </Box>
              </CardContent>
            </Card>
          </Grid>

          <Grid item xs={12} sm={6} md={3}>
            <Card>
              <CardContent>
                <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <Box>
                    <Typography variant="body2" color="text.secondary">
                      Total Hours
                    </Typography>
                    <Typography variant="h4" fontWeight={700}>
                      {summary.total_hours_worked.toFixed(0)}
                    </Typography>
                  </Box>
                  <TrendingUpIcon sx={{ fontSize: 48, color: 'info.main', opacity: 0.3 }} />
                </Box>
              </CardContent>
            </Card>
          </Grid>

          <Grid item xs={12} sm={6} md={3}>
            <Card>
              <CardContent>
                <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <Box>
                    <Typography variant="body2" color="text.secondary">
                      Verified Jobs
                    </Typography>
                    <Typography variant="h4" fontWeight={700}>
                      {summary.verified_jobs}
                    </Typography>
                  </Box>
                  <VerifiedIcon sx={{ fontSize: 48, color: 'warning.main', opacity: 0.3 }} />
                </Box>
              </CardContent>
            </Card>
          </Grid>
        </Grid>
      )}

      <Card>
        <Box sx={{ borderBottom: 1, borderColor: 'divider' }}>
          <Tabs value={tabValue} onChange={(_, val) => setTabValue(val)}>
            <Tab label="Current Employment" />
            <Tab label="Employment History" />
            <Tab label="Skills & Experience" />
          </Tabs>
        </Box>

        <TabPanel value={tabValue} index={0}>
          {currentJobs.length === 0 ? (
            <Box sx={{ textAlign: 'center', py: 6 }}>
              <WorkIcon sx={{ fontSize: 64, color: 'text.secondary', mb: 2 }} />
              <Typography variant="h6" gutterBottom>
                No current employment
              </Typography>
              <Typography variant="body2" color="text.secondary" paragraph>
                Add your current job to track hours and build your experience
              </Typography>
              <Button variant="contained" startIcon={<AddIcon />} onClick={() => setAddJobDialogOpen(true)}>
                Add Current Job
              </Button>
            </Box>
          ) : (
            <Grid container spacing={3}>
              {currentJobs.map((job) => (
                <Grid item xs={12} key={job.id}>
                  <Card variant="outlined">
                    <CardContent>
                      <Grid container spacing={3}>
                        <Grid item xs={12} md={6}>
                          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start', mb: 2 }}>
                            <Box>
                              <Typography variant="h6" fontWeight={600}>
                                {job.job_title}
                              </Typography>
                              <Typography variant="body2" color="text.secondary">
                                {job.employer}
                              </Typography>
                            </Box>
                            <Chip
                              label={job.job_type.replace('_', ' ').toUpperCase()}
                              color={getJobTypeColor(job.job_type) as 'default' | 'primary' | 'secondary' | 'error' | 'info' | 'success' | 'warning'}
                              size="small"
                            />
                          </Box>

                          <Divider sx={{ my: 2 }} />

                          <Grid container spacing={2}>
                            {job.hours_per_week && (
                              <Grid item xs={6}>
                                <Typography variant="body2" color="text.secondary">
                                  Hours/Week
                                </Typography>
                                <Typography variant="body1" fontWeight={600}>
                                  {job.hours_per_week}
                                </Typography>
                              </Grid>
                            )}
                            {job.hourly_pay && (
                              <Grid item xs={6}>
                                <Typography variant="body2" color="text.secondary">
                                  Hourly Pay
                                </Typography>
                                <Typography variant="body1" fontWeight={600}>
                                  ${job.hourly_pay}
                                </Typography>
                              </Grid>
                            )}
                            <Grid item xs={6}>
                              <Typography variant="body2" color="text.secondary">
                                Start Date
                              </Typography>
                              <Typography variant="body2">
                                {new Date(job.start_date).toLocaleDateString()}
                              </Typography>
                            </Grid>
                            {job.total_hours_worked && (
                              <Grid item xs={6}>
                                <Typography variant="body2" color="text.secondary">
                                  Total Hours
                                </Typography>
                                <Typography variant="body2">{job.total_hours_worked}</Typography>
                              </Grid>
                            )}
                          </Grid>

                          {job.supervisor_name && (
                            <Box sx={{ mt: 2 }}>
                              <Typography variant="body2" color="text.secondary">
                                Supervisor
                              </Typography>
                              <Typography variant="body2">{job.supervisor_name}</Typography>
                            </Box>
                          )}

                          {job.verified_for_graduation && (
                            <Alert severity="success" sx={{ mt: 2 }}>
                              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                <VerifiedIcon fontSize="small" />
                                Verified for Graduation
                              </Box>
                            </Alert>
                          )}

                          <Box sx={{ mt: 2, display: 'flex', gap: 1 }}>
                            <Button size="small" variant="outlined" fullWidth onClick={() => handleRequestReference(job)}>
                              Request Reference
                            </Button>
                          </Box>
                        </Grid>
                        <Grid item xs={12} md={6}>
                          <TimesheetIntegration employmentId={job.id} currentHours={job.total_hours_worked} />
                        </Grid>
                      </Grid>
                    </CardContent>
                  </Card>
                </Grid>
              ))}
            </Grid>
          )}
        </TabPanel>

        <TabPanel value={tabValue} index={1}>
          {employmentHistory.length === 0 ? (
            <Box sx={{ textAlign: 'center', py: 6 }}>
              <AssignmentIcon sx={{ fontSize: 64, color: 'text.secondary', mb: 2 }} />
              <Typography variant="h6" gutterBottom>
                No employment history
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Your past jobs will appear here
              </Typography>
            </Box>
          ) : (
            <TableContainer>
              <Table>
                <TableHead>
                  <TableRow>
                    <TableCell>Position</TableCell>
                    <TableCell>Employer</TableCell>
                    <TableCell>Duration</TableCell>
                    <TableCell>Hours/Week</TableCell>
                    <TableCell>Skills Gained</TableCell>
                    <TableCell>Status</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {employmentHistory.map((job) => (
                    <TableRow key={job.id}>
                      <TableCell>
                        <Typography variant="body2" fontWeight={600}>
                          {job.job_title}
                        </Typography>
                        <Chip
                          label={job.job_type.replace('_', ' ')}
                          size="small"
                          color={getJobTypeColor(job.job_type) as 'default' | 'primary' | 'secondary' | 'error' | 'info' | 'success' | 'warning'}
                          sx={{ mt: 0.5 }}
                        />
                      </TableCell>
                      <TableCell>{job.employer}</TableCell>
                      <TableCell>
                        <Typography variant="body2">
                          {new Date(job.start_date).toLocaleDateString()}
                        </Typography>
                        {job.end_date && (
                          <Typography variant="body2" color="text.secondary">
                            to {new Date(job.end_date).toLocaleDateString()}
                          </Typography>
                        )}
                      </TableCell>
                      <TableCell>{job.hours_per_week || 'N/A'}</TableCell>
                      <TableCell>
                        {job.skills_gained ? (
                          <Typography variant="body2" sx={{ maxWidth: 200 }}>
                            {job.skills_gained.substring(0, 50)}
                            {job.skills_gained.length > 50 ? '...' : ''}
                          </Typography>
                        ) : (
                          'N/A'
                        )}
                      </TableCell>
                      <TableCell>
                        {job.verified_for_graduation ? (
                          <Chip label="Verified" color="success" size="small" />
                        ) : (
                          <Chip label="Pending" color="default" size="small" />
                        )}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          )}
        </TabPanel>

        <TabPanel value={tabValue} index={2}>
          <Grid container spacing={3}>
            <Grid item xs={12} md={6}>
              <Paper variant="outlined" sx={{ p: 3 }}>
                <Typography variant="h6" fontWeight={600} gutterBottom>
                  Skills Gained
                </Typography>
                {employments.filter((job) => job.skills_gained).length === 0 ? (
                  <Typography variant="body2" color="text.secondary">
                    No skills recorded yet
                  </Typography>
                ) : (
                  <List>
                    {employments
                      .filter((job) => job.skills_gained)
                      .map((job) => (
                        <ListItem key={job.id} sx={{ px: 0 }}>
                          <ListItemText
                            primary={job.job_title}
                            secondary={job.skills_gained}
                            primaryTypographyProps={{ fontWeight: 600 }}
                          />
                        </ListItem>
                      ))}
                  </List>
                )}
              </Paper>
            </Grid>

            <Grid item xs={12} md={6}>
              <Paper variant="outlined" sx={{ p: 3 }}>
                <Typography variant="h6" fontWeight={600} gutterBottom>
                  Work Experience Summary
                </Typography>
                <Typography variant="body2" color="text.secondary" paragraph>
                  Download your work experience summary for college applications and resumes
                </Typography>
                <Button variant="contained" startIcon={<DownloadIcon />} onClick={handleDownloadSummary} fullWidth>
                  Download Summary
                </Button>
              </Paper>
            </Grid>

            <Grid item xs={12}>
              <Alert severity="info">
                <Typography variant="body2" fontWeight={600} gutterBottom>
                  Tips for Building Your Portfolio
                </Typography>
                <Typography variant="body2">
                  • Keep detailed records of your responsibilities and achievements
                  <br />
                  • Request references from supervisors before leaving a position
                  <br />
                  • Track specific skills and competencies you develop
                  <br />• Update your employment records regularly
                </Typography>
              </Alert>
            </Grid>
          </Grid>
        </TabPanel>
      </Card>

      <Dialog open={addJobDialogOpen} onClose={() => setAddJobDialogOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Add Employment Record</DialogTitle>
        <DialogContent>
          <Grid container spacing={2} sx={{ mt: 1 }}>
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Employer"
                value={jobForm.employer}
                onChange={(e) => setJobForm({ ...jobForm, employer: e.target.value })}
                required
              />
            </Grid>
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Job Title"
                value={jobForm.job_title}
                onChange={(e) => setJobForm({ ...jobForm, job_title: e.target.value })}
                required
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                select
                label="Job Type"
                value={jobForm.job_type}
                onChange={(e) => setJobForm({ ...jobForm, job_type: e.target.value })}
                SelectProps={{ native: true }}
              >
                <option value="part_time">Part Time</option>
                <option value="seasonal">Seasonal</option>
                <option value="internship">Internship</option>
                <option value="volunteer">Volunteer</option>
              </TextField>
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Start Date"
                type="date"
                value={jobForm.start_date}
                onChange={(e) => setJobForm({ ...jobForm, start_date: e.target.value })}
                InputLabelProps={{ shrink: true }}
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Hours per Week"
                type="number"
                value={jobForm.hours_per_week}
                onChange={(e) => setJobForm({ ...jobForm, hours_per_week: parseInt(e.target.value) })}
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Hourly Pay"
                type="number"
                value={jobForm.hourly_pay}
                onChange={(e) => setJobForm({ ...jobForm, hourly_pay: parseFloat(e.target.value) })}
                inputProps={{ step: 0.01 }}
              />
            </Grid>
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Supervisor Name"
                value={jobForm.supervisor_name}
                onChange={(e) => setJobForm({ ...jobForm, supervisor_name: e.target.value })}
              />
            </Grid>
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Supervisor Contact"
                value={jobForm.supervisor_contact}
                onChange={(e) => setJobForm({ ...jobForm, supervisor_contact: e.target.value })}
              />
            </Grid>
            <Grid item xs={12}>
              <TextField
                fullWidth
                multiline
                rows={3}
                label="Skills Gained"
                value={jobForm.skills_gained}
                onChange={(e) => setJobForm({ ...jobForm, skills_gained: e.target.value })}
                placeholder="Communication, Time Management, Customer Service..."
              />
            </Grid>
            <Grid item xs={12}>
              <TextField
                fullWidth
                multiline
                rows={3}
                label="Responsibilities"
                value={jobForm.responsibilities}
                onChange={(e) => setJobForm({ ...jobForm, responsibilities: e.target.value })}
              />
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions sx={{ px: 3, py: 2 }}>
          <Button onClick={() => setAddJobDialogOpen(false)}>Cancel</Button>
          <Button variant="contained" onClick={handleAddJob}>
            Add Employment
          </Button>
        </DialogActions>
      </Dialog>

      <Dialog open={referenceDialogOpen} onClose={() => setReferenceDialogOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Request Supervisor Reference</DialogTitle>
        <DialogContent>
          {selectedJob && (
            <>
              <Typography variant="body2" color="text.secondary" paragraph>
                Sending reference request to: {selectedJob.supervisor_name}
              </Typography>
              <TextField
                fullWidth
                multiline
                rows={8}
                label="Message"
                value={referenceMessage}
                onChange={(e) => setReferenceMessage(e.target.value)}
                sx={{ mt: 2 }}
              />
            </>
          )}
        </DialogContent>
        <DialogActions sx={{ px: 3, py: 2 }}>
          <Button onClick={() => setReferenceDialogOpen(false)}>Cancel</Button>
          <Button variant="contained" startIcon={<SendIcon />} onClick={handleSendReferenceRequest}>
            Send Request
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
