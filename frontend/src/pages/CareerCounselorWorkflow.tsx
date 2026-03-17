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
  Chip,
  Paper,
  Divider,
  Breadcrumbs,
  Link,
  Tabs,
  Tab,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  List,
  ListItem,
  ListItemText,
  IconButton,
} from '@mui/material';
import {
  School as SchoolIcon,
  CheckCircle as ApproveIcon,
  Cancel as DenyIcon,
  Visibility as ViewIcon,
  Assignment as AssignmentIcon,
  Work as WorkIcon,
  Warning as WarningIcon,
  VerifiedUser as VerifyIcon,
  People as PeopleIcon,
  Description as DescriptionIcon,
} from '@mui/icons-material';
import employmentApi from '@/api/employment';
import {
  WorkPermit,
  StudentJobListing,
  StudentEmployment,
  StudentJobListingUpdate,
} from '@/types/employment';
import { useAuth } from '@/hooks/useAuth';

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

export default function CareerCounselorWorkflow() {
  const { user } = useAuth();
  const [tabValue, setTabValue] = useState(0);
  const [workPermits, setWorkPermits] = useState<WorkPermit[]>([]);
  const [jobListings, setJobListings] = useState<StudentJobListing[]>([]);
  const [employments, setEmployments] = useState<StudentEmployment[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [reviewDialogOpen, setReviewDialogOpen] = useState(false);
  const [selectedPermit, setSelectedPermit] = useState<WorkPermit | null>(null);
  const [selectedListing, setSelectedListing] = useState<StudentJobListing | null>(null);
  const [reviewNotes, setReviewNotes] = useState('');
  const [reviewDecision, setReviewDecision] = useState<'approve' | 'deny' | null>(null);
  const [jobReviewDialogOpen, setJobReviewDialogOpen] = useState(false);

  useEffect(() => {
    fetchData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [jobs, pendingEmployments] = await Promise.all([
        employmentApi.listJobListings({}),
        employmentApi.getPendingEmploymentVerifications(),
      ]);

      const pendingPermits = jobs.filter((job) => !job.employer_verified);
      setJobListings(jobs);
      setEmployments(pendingEmployments);
      setError(null);
    } catch (err) {
      setError('Failed to load data');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleReviewPermit = (permit: WorkPermit) => {
    setSelectedPermit(permit);
    setReviewDialogOpen(true);
    setReviewNotes('');
    setReviewDecision(null);
  };

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const handleSubmitPermitReview = async () => {
    if (!selectedPermit || !reviewDecision) return;

    try {
      const status = reviewDecision === 'approve' ? 'approved' : 'denied';
      await employmentApi.authorizeWorkPermit(selectedPermit.id, status);
      setReviewDialogOpen(false);
      setSelectedPermit(null);
      setReviewNotes('');
      setReviewDecision(null);
      fetchData();
      setError(null);
    } catch (err) {
      setError('Failed to submit review');
      console.error(err);
    }
  };

  const handleReviewJobListing = (listing: StudentJobListing) => {
    setSelectedListing(listing);
    setJobReviewDialogOpen(true);
    setReviewNotes('');
    setReviewDecision(null);
  };

  const handleSubmitJobReview = async () => {
    if (!selectedListing || reviewDecision === null) return;

    try {
      const updateData: StudentJobListingUpdate = {
        employer_verified: reviewDecision === 'approve',
        is_active: reviewDecision === 'approve',
      };

      await employmentApi.updateJobListing(selectedListing.id, updateData);
      setJobReviewDialogOpen(false);
      setSelectedListing(null);
      setReviewNotes('');
      setReviewDecision(null);
      fetchData();
      setError(null);
    } catch (err) {
      setError('Failed to submit job review');
      console.error(err);
    }
  };

  const handleVerifyEmployment = async (employmentId: number, verified: boolean) => {
    try {
      await employmentApi.verifyEmploymentForGraduation(employmentId, verified, reviewNotes);
      fetchData();
      setError(null);
    } catch (err) {
      setError('Failed to verify employment');
      console.error(err);
    }
  };

  const getAgeAppropriatenessScore = (listing: StudentJobListing): { score: number; issues: string[] } => {
    const issues: string[] = [];
    let score = 100;

    if (listing.hours_per_week && listing.hours_per_week > 20) {
      issues.push('Exceeds recommended 20 hours per week');
      score -= 20;
    }

    const prohibitedKeywords = ['hazardous', 'dangerous', 'alcohol', 'tobacco', 'heavy machinery'];
    const descLower = listing.description.toLowerCase();
    prohibitedKeywords.forEach((keyword) => {
      if (descLower.includes(keyword)) {
        issues.push(`Contains potentially inappropriate keyword: ${keyword}`);
        score -= 30;
      }
    });

    if (!listing.employer_verified) {
      issues.push('Employer not verified');
      score -= 10;
    }

    return { score: Math.max(0, score), issues };
  };

  const getAcademicInterferenceRisk = (listing: StudentJobListing): 'low' | 'medium' | 'high' => {
    if (!listing.hours_per_week) return 'low';
    if (listing.hours_per_week > 25) return 'high';
    if (listing.hours_per_week > 15) return 'medium';
    return 'low';
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
          <Typography color="text.primary">Career Counselor Workflow</Typography>
        </Breadcrumbs>

        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 2 }}>
          <Typography variant="h4" fontWeight={700}>
            Career Counselor Workflow
          </Typography>
          <Chip label="Pending Reviews" color="primary" />
        </Box>

        <Typography variant="body1" color="text.secondary">
          Review and approve student work permits, job listings, and employment verification
        </Typography>
      </Box>

      {error && (
        <Alert severity="error" sx={{ mb: 3 }} onClose={() => setError(null)}>
          {error}
        </Alert>
      )}

      <Grid container spacing={3} sx={{ mb: 4 }}>
        <Grid item xs={12} md={4}>
          <Card>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <Box>
                  <Typography variant="body2" color="text.secondary">
                    Pending Job Reviews
                  </Typography>
                  <Typography variant="h4" fontWeight={700}>
                    {jobListings.filter((j) => !j.employer_verified).length}
                  </Typography>
                </Box>
                <WorkIcon sx={{ fontSize: 48, color: 'warning.main', opacity: 0.3 }} />
              </Box>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} md={4}>
          <Card>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <Box>
                  <Typography variant="body2" color="text.secondary">
                    Pending Verifications
                  </Typography>
                  <Typography variant="h4" fontWeight={700}>
                    {employments.length}
                  </Typography>
                </Box>
                <VerifyIcon sx={{ fontSize: 48, color: 'info.main', opacity: 0.3 }} />
              </Box>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} md={4}>
          <Card>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <Box>
                  <Typography variant="body2" color="text.secondary">
                    Active Jobs
                  </Typography>
                  <Typography variant="h4" fontWeight={700}>
                    {jobListings.filter((j) => j.is_active && j.employer_verified).length}
                  </Typography>
                </Box>
                <SchoolIcon sx={{ fontSize: 48, color: 'success.main', opacity: 0.3 }} />
              </Box>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      <Card>
        <Box sx={{ borderBottom: 1, borderColor: 'divider' }}>
          <Tabs value={tabValue} onChange={(_, val) => setTabValue(val)}>
            <Tab label="Job Listing Reviews" />
            <Tab label="Employment Verification" />
            <Tab label="Work Hour Monitoring" />
          </Tabs>
        </Box>

        <TabPanel value={tabValue} index={0}>
          {jobListings.filter((j) => !j.employer_verified).length === 0 ? (
            <Box sx={{ textAlign: 'center', py: 6 }}>
              <WorkIcon sx={{ fontSize: 64, color: 'text.secondary', mb: 2 }} />
              <Typography variant="h6" gutterBottom>
                No pending job reviews
              </Typography>
              <Typography variant="body2" color="text.secondary">
                All job listings have been reviewed
              </Typography>
            </Box>
          ) : (
            <TableContainer>
              <Table>
                <TableHead>
                  <TableRow>
                    <TableCell>Job Title</TableCell>
                    <TableCell>Employer</TableCell>
                    <TableCell>Type</TableCell>
                    <TableCell>Hours/Week</TableCell>
                    <TableCell>Age Appropriate</TableCell>
                    <TableCell>Academic Risk</TableCell>
                    <TableCell>Actions</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {jobListings
                    .filter((j) => !j.employer_verified)
                    .map((listing) => {
                      const { score } = getAgeAppropriatenessScore(listing);
                      const academicRisk = getAcademicInterferenceRisk(listing);

                      return (
                        <TableRow key={listing.id}>
                          <TableCell>
                            <Typography variant="body2" fontWeight={600}>
                              {listing.job_title}
                            </Typography>
                          </TableCell>
                          <TableCell>{listing.employer_name}</TableCell>
                          <TableCell>
                            <Chip label={listing.job_type.replace('_', ' ')} size="small" />
                          </TableCell>
                          <TableCell>{listing.hours_per_week || 'N/A'}</TableCell>
                          <TableCell>
                            <Chip
                              label={`${score}%`}
                              color={score >= 80 ? 'success' : score >= 60 ? 'warning' : 'error'}
                              size="small"
                            />
                          </TableCell>
                          <TableCell>
                            <Chip
                              label={academicRisk.toUpperCase()}
                              color={academicRisk === 'low' ? 'success' : academicRisk === 'medium' ? 'warning' : 'error'}
                              size="small"
                            />
                          </TableCell>
                          <TableCell>
                            <Button
                              size="small"
                              variant="outlined"
                              onClick={() => handleReviewJobListing(listing)}
                              startIcon={<ViewIcon />}
                            >
                              Review
                            </Button>
                          </TableCell>
                        </TableRow>
                      );
                    })}
                </TableBody>
              </Table>
            </TableContainer>
          )}
        </TabPanel>

        <TabPanel value={tabValue} index={1}>
          {employments.length === 0 ? (
            <Box sx={{ textAlign: 'center', py: 6 }}>
              <AssignmentIcon sx={{ fontSize: 64, color: 'text.secondary', mb: 2 }} />
              <Typography variant="h6" gutterBottom>
                No pending verifications
              </Typography>
              <Typography variant="body2" color="text.secondary">
                All employment records have been verified
              </Typography>
            </Box>
          ) : (
            <Grid container spacing={3}>
              {employments.map((employment) => (
                <Grid item xs={12} key={employment.id}>
                  <Card variant="outlined">
                    <CardContent>
                      <Grid container spacing={2}>
                        <Grid item xs={12} md={8}>
                          <Typography variant="h6" fontWeight={600} gutterBottom>
                            {employment.job_title}
                          </Typography>
                          <Typography variant="body2" color="text.secondary" gutterBottom>
                            {employment.employer}
                          </Typography>

                          <Grid container spacing={2} sx={{ mt: 1 }}>
                            <Grid item xs={6} sm={3}>
                              <Typography variant="caption" color="text.secondary">
                                Start Date
                              </Typography>
                              <Typography variant="body2">
                                {new Date(employment.start_date).toLocaleDateString()}
                              </Typography>
                            </Grid>
                            <Grid item xs={6} sm={3}>
                              <Typography variant="caption" color="text.secondary">
                                Hours/Week
                              </Typography>
                              <Typography variant="body2">{employment.hours_per_week || 'N/A'}</Typography>
                            </Grid>
                            <Grid item xs={6} sm={3}>
                              <Typography variant="caption" color="text.secondary">
                                Total Hours
                              </Typography>
                              <Typography variant="body2">{employment.total_hours_worked || 0}</Typography>
                            </Grid>
                            <Grid item xs={6} sm={3}>
                              <Typography variant="caption" color="text.secondary">
                                Status
                              </Typography>
                              <Chip
                                label={employment.is_current ? 'Current' : 'Past'}
                                size="small"
                                color={employment.is_current ? 'success' : 'default'}
                              />
                            </Grid>
                          </Grid>

                          {employment.skills_gained && (
                            <Box sx={{ mt: 2 }}>
                              <Typography variant="caption" color="text.secondary">
                                Skills Gained
                              </Typography>
                              <Typography variant="body2">{employment.skills_gained}</Typography>
                            </Box>
                          )}
                        </Grid>

                        <Grid item xs={12} md={4}>
                          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1, height: '100%' }}>
                            <Button
                              fullWidth
                              variant="contained"
                              color="success"
                              startIcon={<ApproveIcon />}
                              onClick={() => handleVerifyEmployment(employment.id, true)}
                            >
                              Verify
                            </Button>
                            <Button
                              fullWidth
                              variant="outlined"
                              color="error"
                              startIcon={<DenyIcon />}
                              onClick={() => handleVerifyEmployment(employment.id, false)}
                            >
                              Reject
                            </Button>
                            <TextField
                              size="small"
                              multiline
                              rows={2}
                              placeholder="Verification notes..."
                              value={reviewNotes}
                              onChange={(e) => setReviewNotes(e.target.value)}
                            />
                          </Box>
                        </Grid>
                      </Grid>
                    </CardContent>
                  </Card>
                </Grid>
              ))}
            </Grid>
          )}
        </TabPanel>

        <TabPanel value={tabValue} index={2}>
          <Alert severity="info" sx={{ mb: 3 }}>
            Monitor students approaching maximum weekly work hours according to work permit regulations
          </Alert>

          <Box sx={{ textAlign: 'center', py: 6 }}>
            <WarningIcon sx={{ fontSize: 64, color: 'text.secondary', mb: 2 }} />
            <Typography variant="h6" gutterBottom>
              Work Hour Monitoring
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Students approaching or exceeding weekly hour limits will appear here
            </Typography>
          </Box>
        </TabPanel>
      </Card>

      <Dialog open={jobReviewDialogOpen} onClose={() => setJobReviewDialogOpen(false)} maxWidth="md" fullWidth>
        <DialogTitle>Review Job Listing</DialogTitle>
        <DialogContent>
          {selectedListing && (
            <Box sx={{ mt: 2 }}>
              <Typography variant="h6" gutterBottom>
                {selectedListing.job_title}
              </Typography>
              <Typography variant="body2" color="text.secondary" gutterBottom>
                {selectedListing.employer_name}
              </Typography>

              <Divider sx={{ my: 2 }} />

              <Grid container spacing={2} sx={{ mb: 3 }}>
                <Grid item xs={6}>
                  <Typography variant="body2" color="text.secondary">
                    Job Type
                  </Typography>
                  <Typography variant="body1">{selectedListing.job_type.replace('_', ' ')}</Typography>
                </Grid>
                <Grid item xs={6}>
                  <Typography variant="body2" color="text.secondary">
                    Hours per Week
                  </Typography>
                  <Typography variant="body1">{selectedListing.hours_per_week || 'Not specified'}</Typography>
                </Grid>
                <Grid item xs={6}>
                  <Typography variant="body2" color="text.secondary">
                    Hourly Pay
                  </Typography>
                  <Typography variant="body1">
                    {selectedListing.hourly_pay ? `$${selectedListing.hourly_pay}` : 'Not specified'}
                  </Typography>
                </Grid>
                <Grid item xs={6}>
                  <Typography variant="body2" color="text.secondary">
                    Location
                  </Typography>
                  <Typography variant="body1">{selectedListing.location || 'Not specified'}</Typography>
                </Grid>
              </Grid>

              <Typography variant="subtitle2" gutterBottom>
                Description
              </Typography>
              <Typography variant="body2" paragraph>
                {selectedListing.description}
              </Typography>

              {selectedListing.requirements && (
                <>
                  <Typography variant="subtitle2" gutterBottom>
                    Requirements
                  </Typography>
                  <Typography variant="body2" paragraph>
                    {selectedListing.requirements}
                  </Typography>
                </>
              )}

              <Alert
                severity={
                  getAgeAppropriatenessScore(selectedListing).score >= 80
                    ? 'success'
                    : getAgeAppropriatenessScore(selectedListing).score >= 60
                    ? 'warning'
                    : 'error'
                }
                sx={{ mb: 2 }}
              >
                <Typography variant="body2" fontWeight={600}>
                  Age Appropriateness: {getAgeAppropriatenessScore(selectedListing).score}%
                </Typography>
                {getAgeAppropriatenessScore(selectedListing).issues.length > 0 && (
                  <List dense>
                    {getAgeAppropriatenessScore(selectedListing).issues.map((issue, idx) => (
                      <ListItem key={idx} sx={{ py: 0 }}>
                        <Typography variant="body2">• {issue}</Typography>
                      </ListItem>
                    ))}
                  </List>
                )}
              </Alert>

              <Alert
                severity={
                  getAcademicInterferenceRisk(selectedListing) === 'low'
                    ? 'success'
                    : getAcademicInterferenceRisk(selectedListing) === 'medium'
                    ? 'warning'
                    : 'error'
                }
              >
                <Typography variant="body2">
                  Academic Interference Risk: {getAcademicInterferenceRisk(selectedListing).toUpperCase()}
                </Typography>
              </Alert>

              <TextField
                fullWidth
                multiline
                rows={3}
                label="Review Notes"
                value={reviewNotes}
                onChange={(e) => setReviewNotes(e.target.value)}
                sx={{ mt: 3 }}
                placeholder="Add notes about your decision..."
              />
            </Box>
          )}
        </DialogContent>
        <DialogActions sx={{ px: 3, py: 2 }}>
          <Button onClick={() => setJobReviewDialogOpen(false)}>Cancel</Button>
          <Button
            variant="outlined"
            color="error"
            startIcon={<DenyIcon />}
            onClick={() => {
              setReviewDecision('deny');
              handleSubmitJobReview();
            }}
          >
            Reject
          </Button>
          <Button
            variant="contained"
            color="success"
            startIcon={<ApproveIcon />}
            onClick={() => {
              setReviewDecision('approve');
              handleSubmitJobReview();
            }}
          >
            Approve
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
