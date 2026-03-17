import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  Box,
  Typography,
  Grid,
  Card,
  CardContent,
  Button,
  Alert,
  CircularProgress,
  Chip,
  Divider,
  Breadcrumbs,
  Link,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Tooltip,
} from '@mui/material';
import {
  Business as BusinessIcon,
  AttachMoney as MoneyIcon,
  Schedule as ScheduleIcon,
  LocationOn as LocationIcon,
  CheckCircle as VerifiedIcon,
  OpenInNew as ExternalLinkIcon,
  ArrowBack as BackIcon,
  Check as CheckIcon,
} from '@mui/icons-material';
import employmentApi from '@/api/employment';
import { StudentJobListing, JobApplicationCreate } from '@/types/employment';
import { useAuth } from '@/hooks/useAuth';

export default function JobDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [job, setJob] = useState<StudentJobListing | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [applyDialogOpen, setApplyDialogOpen] = useState(false);
  const [coverLetter, setCoverLetter] = useState('');

  useEffect(() => {
    if (id) {
      fetchJobDetails();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  const fetchJobDetails = async () => {
    if (!id) return;

    try {
      setLoading(true);
      const data = await employmentApi.getJobListing(parseInt(id));
      setJob(data);
      setError(null);
    } catch (err) {
      setError('Failed to load job details');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleApply = async () => {
    if (!job || !user) return;

    try {
      const application: JobApplicationCreate = {
        institution_id: user.institution_id || 0,
        student_id: parseInt(user.id || '0'),
        job_listing_id: job.id,
        cover_letter: coverLetter,
      };

      await employmentApi.createJobApplication(application);
      setApplyDialogOpen(false);
      setCoverLetter('');
      setError(null);
      alert('Application submitted successfully!');
      navigate('/student-job-board');
    } catch (err) {
      setError('Failed to submit application');
      console.error(err);
    }
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

  const getJobTypeLabel = (type: string) => {
    return type.split('_').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ');
  };

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '60vh' }}>
        <CircularProgress />
      </Box>
    );
  }

  if (!job) {
    return (
      <Box sx={{ textAlign: 'center', py: 6 }}>
        <Typography variant="h6">Job not found</Typography>
        <Button onClick={() => navigate('/student-job-board')} sx={{ mt: 2 }}>
          Back to Job Board
        </Button>
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
          <Link color="inherit" href="/student-job-board" underline="hover">
            Job Board
          </Link>
          <Typography color="text.primary">{job.job_title}</Typography>
        </Breadcrumbs>

        <Button startIcon={<BackIcon />} onClick={() => navigate('/student-job-board')} sx={{ mb: 2 }}>
          Back to Job Board
        </Button>
      </Box>

      {error && (
        <Alert severity="error" sx={{ mb: 3 }} onClose={() => setError(null)}>
          {error}
        </Alert>
      )}

      <Grid container spacing={3}>
        <Grid item xs={12} md={8}>
          <Card>
            <CardContent>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start', mb: 3 }}>
                <Box>
                  <Typography variant="h4" fontWeight={700} gutterBottom>
                    {job.job_title}
                  </Typography>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
                    <BusinessIcon color="action" />
                    <Typography variant="h6" color="text.secondary">
                      {job.employer_name}
                    </Typography>
                    {job.employer_verified && (
                      <Tooltip title="Verified Employer">
                        <VerifiedIcon sx={{ fontSize: 20, color: 'success.main' }} />
                      </Tooltip>
                    )}
                  </Box>
                </Box>
                <Chip
                  label={getJobTypeLabel(job.job_type)}
                  color={getJobTypeColor(job.job_type) as 'default' | 'primary' | 'secondary' | 'error' | 'info' | 'success' | 'warning'}
                  size="large"
                />
              </Box>

              <Divider sx={{ mb: 3 }} />

              <Typography variant="h6" fontWeight={600} gutterBottom>
                Job Description
              </Typography>
              <Typography variant="body1" paragraph sx={{ whiteSpace: 'pre-line' }}>
                {job.description}
              </Typography>

              {job.requirements && (
                <>
                  <Typography variant="h6" fontWeight={600} gutterBottom sx={{ mt: 4 }}>
                    Requirements
                  </Typography>
                  <Typography variant="body1" paragraph sx={{ whiteSpace: 'pre-line' }}>
                    {job.requirements}
                  </Typography>
                </>
              )}

              <Typography variant="h6" fontWeight={600} gutterBottom sx={{ mt: 4 }}>
                What We Offer
              </Typography>
              <List>
                <ListItem>
                  <ListItemIcon>
                    <CheckIcon color="success" />
                  </ListItemIcon>
                  <ListItemText primary="Flexible scheduling around school hours" />
                </ListItem>
                <ListItem>
                  <ListItemIcon>
                    <CheckIcon color="success" />
                  </ListItemIcon>
                  <ListItemText primary="Professional work experience for college applications" />
                </ListItem>
                <ListItem>
                  <ListItemIcon>
                    <CheckIcon color="success" />
                  </ListItemIcon>
                  <ListItemText primary="Skill development and career exploration" />
                </ListItem>
                <ListItem>
                  <ListItemIcon>
                    <CheckIcon color="success" />
                  </ListItemIcon>
                  <ListItemText primary="Supervisor references for future opportunities" />
                </ListItem>
              </List>

              {job.application_link && (
                <Alert severity="info" sx={{ mt: 3 }}>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <Typography variant="body2">
                      This position requires an external application
                    </Typography>
                    <Button
                      size="small"
                      endIcon={<ExternalLinkIcon />}
                      onClick={() => window.open(job.application_link!, '_blank')}
                    >
                      Apply Externally
                    </Button>
                  </Box>
                </Alert>
              )}
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} md={4}>
          <Card sx={{ position: 'sticky', top: 16 }}>
            <CardContent>
              <Typography variant="h6" fontWeight={600} gutterBottom>
                Job Details
              </Typography>

              <Divider sx={{ my: 2 }} />

              {job.hourly_pay && (
                <Box sx={{ mb: 3 }}>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                    <MoneyIcon color="action" />
                    <Typography variant="body2" color="text.secondary">
                      Hourly Pay
                    </Typography>
                  </Box>
                  <Typography variant="h5" fontWeight={600}>
                    ${job.hourly_pay}/hr
                  </Typography>
                </Box>
              )}

              {job.hours_per_week && (
                <Box sx={{ mb: 3 }}>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                    <ScheduleIcon color="action" />
                    <Typography variant="body2" color="text.secondary">
                      Hours per Week
                    </Typography>
                  </Box>
                  <Typography variant="h6" fontWeight={600}>
                    {job.hours_per_week} hours
                  </Typography>
                </Box>
              )}

              {job.location && (
                <Box sx={{ mb: 3 }}>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                    <LocationIcon color="action" />
                    <Typography variant="body2" color="text.secondary">
                      Location
                    </Typography>
                  </Box>
                  <Typography variant="body1" fontWeight={600}>
                    {job.location}
                  </Typography>
                </Box>
              )}

              <Divider sx={{ my: 2 }} />

              <Box sx={{ mb: 2 }}>
                <Typography variant="body2" color="text.secondary">
                  Posted
                </Typography>
                <Typography variant="body2">
                  {new Date(job.posting_date).toLocaleDateString()}
                </Typography>
              </Box>

              {job.expiry_date && (
                <Box sx={{ mb: 2 }}>
                  <Typography variant="body2" color="text.secondary">
                    Application Deadline
                  </Typography>
                  <Typography variant="body2">
                    {new Date(job.expiry_date).toLocaleDateString()}
                  </Typography>
                </Box>
              )}

              <Box sx={{ mb: 2 }}>
                <Typography variant="body2" color="text.secondary">
                  Applications
                </Typography>
                <Typography variant="body2">{job.application_count} received</Typography>
              </Box>

              <Button
                fullWidth
                variant="contained"
                size="large"
                onClick={() => setApplyDialogOpen(true)}
                sx={{ mt: 3 }}
              >
                Apply Now
              </Button>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      <Dialog open={applyDialogOpen} onClose={() => setApplyDialogOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Apply for {job.job_title}</DialogTitle>
        <DialogContent>
          <Alert severity="info" sx={{ mb: 2 }}>
            Make sure you have an active work permit before applying for this position.
          </Alert>
          <TextField
            fullWidth
            multiline
            rows={8}
            label="Cover Letter (Optional)"
            value={coverLetter}
            onChange={(e) => setCoverLetter(e.target.value)}
            placeholder="Tell the employer why you're a great fit for this position..."
            sx={{ mt: 2 }}
          />
        </DialogContent>
        <DialogActions sx={{ px: 3, py: 2 }}>
          <Button onClick={() => setApplyDialogOpen(false)}>Cancel</Button>
          <Button variant="contained" onClick={handleApply}>
            Submit Application
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
