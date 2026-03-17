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
  IconButton,
  Breadcrumbs,
  Link,
  Tabs,
  Tab,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
} from '@mui/material';
import {
  Add as AddIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  VerifiedUser as VerifiedIcon,
  People as PeopleIcon,
  Work as WorkIcon,
} from '@mui/icons-material';
import employmentApi from '@/api/employment';
import {
  StudentJobListing,
  StudentJobListingCreate,
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

export default function EmployerPortal() {
  const { user } = useAuth();
  const [tabValue, setTabValue] = useState(0);
  const [jobListings, setJobListings] = useState<StudentJobListing[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [selectedListing, setSelectedListing] = useState<StudentJobListing | null>(null);

  const [jobForm, setJobForm] = useState<Partial<StudentJobListingCreate>>({
    employer_name: '',
    job_title: '',
    job_type: 'part_time',
    description: '',
    requirements: '',
    hourly_pay: 0,
    hours_per_week: 0,
    location: '',
    application_link: '',
    expiry_date: '',
  });

  useEffect(() => {
    if (user?.institution_id) {
      fetchData();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user]);

  const fetchData = async () => {
    if (!user?.institution_id) return;

    try {
      setLoading(true);
      const jobs = await employmentApi.listJobListings({});
      setJobListings(jobs);
      setError(null);
    } catch (err) {
      setError('Failed to load data');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateJob = async () => {
    if (!user?.institution_id) return;

    try {
      const jobData: StudentJobListingCreate = {
        institution_id: user.institution_id,
        employer_name: jobForm.employer_name!,
        job_title: jobForm.job_title!,
        job_type: jobForm.job_type!,
        description: jobForm.description!,
        requirements: jobForm.requirements,
        hourly_pay: jobForm.hourly_pay,
        hours_per_week: jobForm.hours_per_week,
        location: jobForm.location,
        application_link: jobForm.application_link,
        expiry_date: jobForm.expiry_date,
        employer_verified: false,
      };

      await employmentApi.createJobListing(jobData);
      setCreateDialogOpen(false);
      resetForm();
      fetchData();
      setError(null);
    } catch (err) {
      setError('Failed to create job listing');
      console.error(err);
    }
  };

  const handleUpdateJob = async () => {
    if (!selectedListing) return;

    try {
      const updateData: StudentJobListingUpdate = {
        employer_name: jobForm.employer_name,
        job_title: jobForm.job_title,
        job_type: jobForm.job_type,
        description: jobForm.description,
        requirements: jobForm.requirements,
        hourly_pay: jobForm.hourly_pay,
        hours_per_week: jobForm.hours_per_week,
        location: jobForm.location,
        application_link: jobForm.application_link,
        expiry_date: jobForm.expiry_date,
      };

      await employmentApi.updateJobListing(selectedListing.id, updateData);
      setEditDialogOpen(false);
      resetForm();
      fetchData();
      setError(null);
    } catch (err) {
      setError('Failed to update job listing');
      console.error(err);
    }
  };

  const handleDeleteJob = async (id: number) => {
    if (!confirm('Are you sure you want to delete this job listing?')) return;

    try {
      await employmentApi.deleteJobListing(id);
      fetchData();
      setError(null);
    } catch (err) {
      setError('Failed to delete job listing');
      console.error(err);
    }
  };

  const handleEditClick = (listing: StudentJobListing) => {
    setSelectedListing(listing);
    setJobForm({
      employer_name: listing.employer_name,
      job_title: listing.job_title,
      job_type: listing.job_type,
      description: listing.description,
      requirements: listing.requirements,
      hourly_pay: listing.hourly_pay,
      hours_per_week: listing.hours_per_week,
      location: listing.location,
      application_link: listing.application_link,
      expiry_date: listing.expiry_date,
    });
    setEditDialogOpen(true);
  };

  const resetForm = () => {
    setJobForm({
      employer_name: '',
      job_title: '',
      job_type: 'part_time',
      description: '',
      requirements: '',
      hourly_pay: 0,
      hours_per_week: 0,
      location: '',
      application_link: '',
      expiry_date: '',
    });
    setSelectedListing(null);
  };

  const getStatusChip = (listing: StudentJobListing) => {
    if (!listing.employer_verified) {
      return <Chip label="Pending Verification" color="warning" size="small" />;
    }
    if (!listing.is_active) {
      return <Chip label="Inactive" color="default" size="small" />;
    }
    return <Chip label="Active" color="success" size="small" />;
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
          <Typography color="text.primary">Employer Portal</Typography>
        </Breadcrumbs>

        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 2 }}>
          <Typography variant="h4" fontWeight={700}>
            Employer Portal
          </Typography>
          <Button variant="contained" startIcon={<AddIcon />} onClick={() => setCreateDialogOpen(true)}>
            Post New Job
          </Button>
        </Box>

        <Typography variant="body1" color="text.secondary">
          Manage job postings for student employment opportunities
        </Typography>
      </Box>

      {error && (
        <Alert severity="error" sx={{ mb: 3 }} onClose={() => setError(null)}>
          {error}
        </Alert>
      )}

      <Card>
        <Box sx={{ borderBottom: 1, borderColor: 'divider' }}>
          <Tabs value={tabValue} onChange={(_, val) => setTabValue(val)}>
            <Tab label="My Job Postings" />
            <Tab label="Applications Received" />
            <Tab label="Employer Profile" />
          </Tabs>
        </Box>

        <TabPanel value={tabValue} index={0}>
          {jobListings.length === 0 ? (
            <Box sx={{ textAlign: 'center', py: 6 }}>
              <WorkIcon sx={{ fontSize: 64, color: 'text.secondary', mb: 2 }} />
              <Typography variant="h6" gutterBottom>
                No job postings yet
              </Typography>
              <Typography variant="body2" color="text.secondary" paragraph>
                Create your first job posting to attract student talent
              </Typography>
              <Button variant="contained" startIcon={<AddIcon />} onClick={() => setCreateDialogOpen(true)}>
                Post Your First Job
              </Button>
            </Box>
          ) : (
            <Grid container spacing={3}>
              {jobListings.map((listing) => (
                <Grid item xs={12} key={listing.id}>
                  <Card variant="outlined">
                    <CardContent>
                      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start' }}>
                        <Box sx={{ flex: 1 }}>
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 1 }}>
                            <Typography variant="h6" fontWeight={600}>
                              {listing.job_title}
                            </Typography>
                            {getStatusChip(listing)}
                            {listing.employer_verified && (
                              <Chip icon={<VerifiedIcon />} label="Verified" color="success" size="small" />
                            )}
                          </Box>

                          <Typography variant="body2" color="text.secondary" gutterBottom>
                            {listing.employer_name}
                          </Typography>

                          <Grid container spacing={2} sx={{ mt: 1 }}>
                            <Grid item>
                              <Typography variant="body2">
                                <strong>Type:</strong> {listing.job_type.replace('_', ' ').toUpperCase()}
                              </Typography>
                            </Grid>
                            {listing.hourly_pay && (
                              <Grid item>
                                <Typography variant="body2">
                                  <strong>Pay:</strong> ${listing.hourly_pay}/hr
                                </Typography>
                              </Grid>
                            )}
                            {listing.hours_per_week && (
                              <Grid item>
                                <Typography variant="body2">
                                  <strong>Hours:</strong> {listing.hours_per_week}/week
                                </Typography>
                              </Grid>
                            )}
                            <Grid item>
                              <Typography variant="body2">
                                <strong>Applications:</strong> {listing.application_count}
                              </Typography>
                            </Grid>
                          </Grid>

                          <Typography variant="body2" color="text.secondary" sx={{ mt: 2 }}>
                            Posted: {new Date(listing.posting_date).toLocaleDateString()}
                            {listing.expiry_date && ` • Expires: ${new Date(listing.expiry_date).toLocaleDateString()}`}
                          </Typography>
                        </Box>

                        <Box sx={{ display: 'flex', gap: 1 }}>
                          <IconButton onClick={() => handleEditClick(listing)} color="primary">
                            <EditIcon />
                          </IconButton>
                          <IconButton onClick={() => handleDeleteJob(listing.id)} color="error">
                            <DeleteIcon />
                          </IconButton>
                        </Box>
                      </Box>
                    </CardContent>
                  </Card>
                </Grid>
              ))}
            </Grid>
          )}
        </TabPanel>

        <TabPanel value={tabValue} index={1}>
          <Box sx={{ textAlign: 'center', py: 6 }}>
            <PeopleIcon sx={{ fontSize: 64, color: 'text.secondary', mb: 2 }} />
            <Typography variant="h6" gutterBottom>
              Applications will appear here
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Student applications to your job postings will be displayed in this section
            </Typography>
          </Box>
        </TabPanel>

        <TabPanel value={tabValue} index={2}>
          <Paper variant="outlined" sx={{ p: 3 }}>
            <Typography variant="h6" fontWeight={600} gutterBottom>
              Employer Verification Status
            </Typography>
            <Alert severity="info" sx={{ mb: 3 }}>
              Verified employers appear more prominently and are trusted by students and counselors. Complete the
              verification process to enhance your credibility.
            </Alert>

            <Typography variant="body2" color="text.secondary" paragraph>
              To become a verified employer, please contact the career counselor or school administration to begin the
              verification process.
            </Typography>

            <Button variant="outlined" startIcon={<VerifiedIcon />}>
              Request Verification
            </Button>
          </Paper>
        </TabPanel>
      </Card>

      <Dialog open={createDialogOpen} onClose={() => setCreateDialogOpen(false)} maxWidth="md" fullWidth>
        <DialogTitle>Post New Job Opportunity</DialogTitle>
        <DialogContent>
          <Grid container spacing={2} sx={{ mt: 1 }}>
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Employer Name"
                value={jobForm.employer_name}
                onChange={(e) => setJobForm({ ...jobForm, employer_name: e.target.value })}
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
              <FormControl fullWidth>
                <InputLabel>Job Type</InputLabel>
                <Select
                  value={jobForm.job_type}
                  label="Job Type"
                  onChange={(e) => setJobForm({ ...jobForm, job_type: e.target.value })}
                >
                  <MenuItem value="part_time">Part Time</MenuItem>
                  <MenuItem value="seasonal">Seasonal</MenuItem>
                  <MenuItem value="internship">Internship</MenuItem>
                  <MenuItem value="volunteer">Volunteer</MenuItem>
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Location"
                value={jobForm.location}
                onChange={(e) => setJobForm({ ...jobForm, location: e.target.value })}
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Hourly Pay"
                type="number"
                value={jobForm.hourly_pay}
                onChange={(e) => setJobForm({ ...jobForm, hourly_pay: parseFloat(e.target.value) })}
                inputProps={{ step: 0.01, min: 0 }}
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Hours per Week"
                type="number"
                value={jobForm.hours_per_week}
                onChange={(e) => setJobForm({ ...jobForm, hours_per_week: parseInt(e.target.value) })}
                inputProps={{ min: 0, max: 40 }}
              />
            </Grid>
            <Grid item xs={12}>
              <TextField
                fullWidth
                multiline
                rows={4}
                label="Job Description"
                value={jobForm.description}
                onChange={(e) => setJobForm({ ...jobForm, description: e.target.value })}
                required
              />
            </Grid>
            <Grid item xs={12}>
              <TextField
                fullWidth
                multiline
                rows={3}
                label="Requirements"
                value={jobForm.requirements}
                onChange={(e) => setJobForm({ ...jobForm, requirements: e.target.value })}
                placeholder="Education, skills, age requirements, etc."
              />
            </Grid>
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="External Application Link (Optional)"
                value={jobForm.application_link}
                onChange={(e) => setJobForm({ ...jobForm, application_link: e.target.value })}
                placeholder="https://..."
              />
            </Grid>
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Posting Expiry Date"
                type="date"
                value={jobForm.expiry_date}
                onChange={(e) => setJobForm({ ...jobForm, expiry_date: e.target.value })}
                InputLabelProps={{ shrink: true }}
              />
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions sx={{ px: 3, py: 2 }}>
          <Button onClick={() => setCreateDialogOpen(false)}>Cancel</Button>
          <Button variant="contained" onClick={handleCreateJob}>
            Post Job
          </Button>
        </DialogActions>
      </Dialog>

      <Dialog open={editDialogOpen} onClose={() => setEditDialogOpen(false)} maxWidth="md" fullWidth>
        <DialogTitle>Edit Job Posting</DialogTitle>
        <DialogContent>
          <Grid container spacing={2} sx={{ mt: 1 }}>
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Employer Name"
                value={jobForm.employer_name}
                onChange={(e) => setJobForm({ ...jobForm, employer_name: e.target.value })}
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
              <FormControl fullWidth>
                <InputLabel>Job Type</InputLabel>
                <Select
                  value={jobForm.job_type}
                  label="Job Type"
                  onChange={(e) => setJobForm({ ...jobForm, job_type: e.target.value })}
                >
                  <MenuItem value="part_time">Part Time</MenuItem>
                  <MenuItem value="seasonal">Seasonal</MenuItem>
                  <MenuItem value="internship">Internship</MenuItem>
                  <MenuItem value="volunteer">Volunteer</MenuItem>
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Location"
                value={jobForm.location}
                onChange={(e) => setJobForm({ ...jobForm, location: e.target.value })}
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Hourly Pay"
                type="number"
                value={jobForm.hourly_pay}
                onChange={(e) => setJobForm({ ...jobForm, hourly_pay: parseFloat(e.target.value) })}
                inputProps={{ step: 0.01, min: 0 }}
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Hours per Week"
                type="number"
                value={jobForm.hours_per_week}
                onChange={(e) => setJobForm({ ...jobForm, hours_per_week: parseInt(e.target.value) })}
                inputProps={{ min: 0, max: 40 }}
              />
            </Grid>
            <Grid item xs={12}>
              <TextField
                fullWidth
                multiline
                rows={4}
                label="Job Description"
                value={jobForm.description}
                onChange={(e) => setJobForm({ ...jobForm, description: e.target.value })}
                required
              />
            </Grid>
            <Grid item xs={12}>
              <TextField
                fullWidth
                multiline
                rows={3}
                label="Requirements"
                value={jobForm.requirements}
                onChange={(e) => setJobForm({ ...jobForm, requirements: e.target.value })}
              />
            </Grid>
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="External Application Link (Optional)"
                value={jobForm.application_link}
                onChange={(e) => setJobForm({ ...jobForm, application_link: e.target.value })}
              />
            </Grid>
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Posting Expiry Date"
                type="date"
                value={jobForm.expiry_date}
                onChange={(e) => setJobForm({ ...jobForm, expiry_date: e.target.value })}
                InputLabelProps={{ shrink: true }}
              />
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions sx={{ px: 3, py: 2 }}>
          <Button onClick={() => setEditDialogOpen(false)}>Cancel</Button>
          <Button variant="contained" onClick={handleUpdateJob}>
            Update Job
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
