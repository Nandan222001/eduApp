import { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Grid,
  Card,
  CardContent,
  CardActions,
  Button,
  TextField,
  Chip,
  InputAdornment,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Drawer,
  IconButton,
  Divider,
  Alert,
  CircularProgress,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Slider,
  Paper,
  useTheme,
  Breadcrumbs,
  Link,
} from '@mui/material';
import {
  Search as SearchIcon,
  FilterList as FilterListIcon,
  Work as WorkIcon,
  LocationOn as LocationIcon,
  AttachMoney as MoneyIcon,
  Schedule as ScheduleIcon,
  Close as CloseIcon,
  CheckCircle as VerifiedIcon,
  OpenInNew as ExternalLinkIcon,
  Bookmark as BookmarkIcon,
  BookmarkBorder as BookmarkBorderIcon,
  Business as BusinessIcon,
} from '@mui/icons-material';
import employmentApi from '@/api/employment';
import { StudentJobListing, JobApplicationCreate } from '@/types/employment';
import { useAuth } from '@/hooks/useAuth';

interface JobFilters {
  jobType: string;
  payRange: [number, number];
  location: string;
  hoursCommitment: string;
  verifiedOnly: boolean;
}

export default function StudentJobBoard() {
  const theme = useTheme();
  const { user } = useAuth();
  const [jobs, setJobs] = useState<StudentJobListing[]>([]);
  const [filteredJobs, setFilteredJobs] = useState<StudentJobListing[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterDrawerOpen, setFilterDrawerOpen] = useState(false);
  const [selectedJob, setSelectedJob] = useState<StudentJobListing | null>(null);
  const [detailDialogOpen, setDetailDialogOpen] = useState(false);
  const [applyDialogOpen, setApplyDialogOpen] = useState(false);
  const [coverLetter, setCoverLetter] = useState('');
  const [bookmarkedJobs, setBookmarkedJobs] = useState<Set<number>>(new Set());

  const [filters, setFilters] = useState<JobFilters>({
    jobType: 'all',
    payRange: [0, 50],
    location: 'all',
    hoursCommitment: 'all',
    verifiedOnly: false,
  });

  useEffect(() => {
    fetchJobs();
  }, []);

  useEffect(() => {
    applyFilters();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [jobs, filters, searchQuery]);

  const fetchJobs = async () => {
    try {
      setLoading(true);
      const data = await employmentApi.listJobListings({ is_active: true });
      setJobs(data);
      setError(null);
    } catch (err) {
      setError('Failed to load job listings');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const applyFilters = () => {
    let filtered = [...jobs];

    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(
        (job) =>
          job.job_title.toLowerCase().includes(query) ||
          job.employer_name.toLowerCase().includes(query) ||
          job.description.toLowerCase().includes(query)
      );
    }

    if (filters.jobType !== 'all') {
      filtered = filtered.filter((job) => job.job_type === filters.jobType);
    }

    if (filters.location !== 'all') {
      filtered = filtered.filter((job) => job.location?.toLowerCase().includes(filters.location.toLowerCase()));
    }

    if (filters.hoursCommitment !== 'all') {
      const [min, max] = filters.hoursCommitment.split('-').map(Number);
      filtered = filtered.filter((job) => {
        if (!job.hours_per_week) return false;
        return job.hours_per_week >= min && (max ? job.hours_per_week <= max : true);
      });
    }

    filtered = filtered.filter((job) => {
      if (!job.hourly_pay) return true;
      return job.hourly_pay >= filters.payRange[0] && job.hourly_pay <= filters.payRange[1];
    });

    if (filters.verifiedOnly) {
      filtered = filtered.filter((job) => job.employer_verified);
    }

    setFilteredJobs(filtered);
  };

  const handleJobClick = (job: StudentJobListing) => {
    setSelectedJob(job);
    setDetailDialogOpen(true);
  };

  const handleApplyClick = () => {
    setDetailDialogOpen(false);
    setApplyDialogOpen(true);
  };

  const handleSubmitApplication = async () => {
    if (!selectedJob || !user) return;

    try {
      const application: JobApplicationCreate = {
        institution_id: user.institution_id || 0,
        student_id: parseInt(user.id || '0'),
        job_listing_id: selectedJob.id,
        cover_letter: coverLetter,
      };

      await employmentApi.createJobApplication(application);
      setApplyDialogOpen(false);
      setCoverLetter('');
      setError(null);
      alert('Application submitted successfully!');
    } catch (err) {
      setError('Failed to submit application');
      console.error(err);
    }
  };

  const toggleBookmark = (jobId: number) => {
    setBookmarkedJobs((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(jobId)) {
        newSet.delete(jobId);
      } else {
        newSet.add(jobId);
      }
      return newSet;
    });
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

  return (
    <Box>
      <Box sx={{ mb: 4 }}>
        <Breadcrumbs sx={{ mb: 2 }}>
          <Link color="inherit" href="/" underline="hover">
            Home
          </Link>
          <Typography color="text.primary">Student Job Board</Typography>
        </Breadcrumbs>
        
        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 2 }}>
          <Typography variant="h4" fontWeight={700}>
            Student Job Board
          </Typography>
          <Chip
            label={`${filteredJobs.length} opportunities`}
            color="primary"
            variant="outlined"
          />
        </Box>
        
        <Typography variant="body1" color="text.secondary">
          Browse age-appropriate job opportunities for students
        </Typography>
      </Box>

      {error && (
        <Alert severity="error" sx={{ mb: 3 }} onClose={() => setError(null)}>
          {error}
        </Alert>
      )}

      <Box sx={{ display: 'flex', gap: 2, mb: 3 }}>
        <TextField
          fullWidth
          placeholder="Search jobs, employers, or keywords..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          InputProps={{
            startAdornment: (
              <InputAdornment position="start">
                <SearchIcon />
              </InputAdornment>
            ),
          }}
        />
        <Button
          variant="outlined"
          startIcon={<FilterListIcon />}
          onClick={() => setFilterDrawerOpen(true)}
          sx={{ minWidth: 120 }}
        >
          Filters
        </Button>
      </Box>

      <Grid container spacing={3}>
        {filteredJobs.length === 0 ? (
          <Grid item xs={12}>
            <Paper sx={{ p: 6, textAlign: 'center' }}>
              <WorkIcon sx={{ fontSize: 64, color: 'text.secondary', mb: 2 }} />
              <Typography variant="h6" gutterBottom>
                No jobs found
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Try adjusting your filters or search criteria
              </Typography>
            </Paper>
          </Grid>
        ) : (
          filteredJobs.map((job) => (
            <Grid item xs={12} md={6} lg={4} key={job.id}>
              <Card
                sx={{
                  height: '100%',
                  display: 'flex',
                  flexDirection: 'column',
                  cursor: 'pointer',
                  transition: 'all 0.2s',
                  '&:hover': {
                    transform: 'translateY(-4px)',
                    boxShadow: theme.shadows[4],
                  },
                }}
                onClick={() => handleJobClick(job)}
              >
                <CardContent sx={{ flexGrow: 1 }}>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start', mb: 2 }}>
                    <Chip
                      label={getJobTypeLabel(job.job_type)}
                      color={getJobTypeColor(job.job_type) as 'default' | 'primary' | 'secondary' | 'error' | 'info' | 'success' | 'warning'}
                      size="small"
                    />
                    <IconButton
                      size="small"
                      onClick={(e) => {
                        e.stopPropagation();
                        toggleBookmark(job.id);
                      }}
                    >
                      {bookmarkedJobs.has(job.id) ? <BookmarkIcon color="primary" /> : <BookmarkBorderIcon />}
                    </IconButton>
                  </Box>

                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                    <BusinessIcon sx={{ fontSize: 20, color: 'text.secondary' }} />
                    <Typography variant="body2" color="text.secondary">
                      {job.employer_name}
                    </Typography>
                    {job.employer_verified && (
                      <VerifiedIcon sx={{ fontSize: 16, color: 'success.main' }} />
                    )}
                  </Box>

                  <Typography variant="h6" fontWeight={600} gutterBottom>
                    {job.job_title}
                  </Typography>

                  <Typography
                    variant="body2"
                    color="text.secondary"
                    sx={{
                      display: '-webkit-box',
                      WebkitLineClamp: 3,
                      WebkitBoxOrient: 'vertical',
                      overflow: 'hidden',
                      mb: 2,
                    }}
                  >
                    {job.description}
                  </Typography>

                  <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1, mt: 2 }}>
                    {job.hourly_pay && (
                      <Chip
                        icon={<MoneyIcon />}
                        label={`$${job.hourly_pay}/hr`}
                        size="small"
                        variant="outlined"
                      />
                    )}
                    {job.hours_per_week && (
                      <Chip
                        icon={<ScheduleIcon />}
                        label={`${job.hours_per_week}hrs/week`}
                        size="small"
                        variant="outlined"
                      />
                    )}
                    {job.location && (
                      <Chip
                        icon={<LocationIcon />}
                        label={job.location}
                        size="small"
                        variant="outlined"
                      />
                    )}
                  </Box>
                </CardContent>

                <CardActions sx={{ px: 2, pb: 2 }}>
                  <Button
                    fullWidth
                    variant="contained"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleJobClick(job);
                    }}
                  >
                    View Details
                  </Button>
                </CardActions>
              </Card>
            </Grid>
          ))
        )}
      </Grid>

      <Drawer
        anchor="right"
        open={filterDrawerOpen}
        onClose={() => setFilterDrawerOpen(false)}
      >
        <Box sx={{ width: 320, p: 3 }}>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
            <Typography variant="h6" fontWeight={600}>
              Filters
            </Typography>
            <IconButton onClick={() => setFilterDrawerOpen(false)}>
              <CloseIcon />
            </IconButton>
          </Box>

          <Divider sx={{ mb: 3 }} />

          <FormControl fullWidth sx={{ mb: 3 }}>
            <InputLabel>Job Type</InputLabel>
            <Select
              value={filters.jobType}
              label="Job Type"
              onChange={(e) => setFilters({ ...filters, jobType: e.target.value })}
            >
              <MenuItem value="all">All Types</MenuItem>
              <MenuItem value="part_time">Part Time</MenuItem>
              <MenuItem value="seasonal">Seasonal</MenuItem>
              <MenuItem value="internship">Internship</MenuItem>
              <MenuItem value="volunteer">Volunteer</MenuItem>
            </Select>
          </FormControl>

          <FormControl fullWidth sx={{ mb: 3 }}>
            <InputLabel>Location</InputLabel>
            <Select
              value={filters.location}
              label="Location"
              onChange={(e) => setFilters({ ...filters, location: e.target.value })}
            >
              <MenuItem value="all">All Locations</MenuItem>
              <MenuItem value="remote">Remote</MenuItem>
              <MenuItem value="on-site">On-site</MenuItem>
            </Select>
          </FormControl>

          <FormControl fullWidth sx={{ mb: 3 }}>
            <InputLabel>Hours per Week</InputLabel>
            <Select
              value={filters.hoursCommitment}
              label="Hours per Week"
              onChange={(e) => setFilters({ ...filters, hoursCommitment: e.target.value })}
            >
              <MenuItem value="all">Any Hours</MenuItem>
              <MenuItem value="0-10">Less than 10 hours</MenuItem>
              <MenuItem value="10-20">10-20 hours</MenuItem>
              <MenuItem value="20-30">20-30 hours</MenuItem>
              <MenuItem value="30-40">30-40 hours</MenuItem>
            </Select>
          </FormControl>

          <Box sx={{ mb: 3 }}>
            <Typography gutterBottom>Hourly Pay Range</Typography>
            <Slider
              value={filters.payRange}
              onChange={(_, value) => setFilters({ ...filters, payRange: value as [number, number] })}
              valueLabelDisplay="auto"
              min={0}
              max={50}
              step={5}
              marks={[
                { value: 0, label: '$0' },
                { value: 25, label: '$25' },
                { value: 50, label: '$50' },
              ]}
            />
          </Box>

          <Box sx={{ mb: 3 }}>
            <Button
              fullWidth
              variant="outlined"
              onClick={() => setFilters({ ...filters, verifiedOnly: !filters.verifiedOnly })}
              color={filters.verifiedOnly ? 'primary' : 'inherit'}
            >
              {filters.verifiedOnly ? '✓ ' : ''}Verified Employers Only
            </Button>
          </Box>

          <Button
            fullWidth
            variant="outlined"
            onClick={() => setFilters({
              jobType: 'all',
              payRange: [0, 50],
              location: 'all',
              hoursCommitment: 'all',
              verifiedOnly: false,
            })}
          >
            Reset Filters
          </Button>
        </Box>
      </Drawer>

      <Dialog
        open={detailDialogOpen}
        onClose={() => setDetailDialogOpen(false)}
        maxWidth="md"
        fullWidth
      >
        {selectedJob && (
          <>
            <DialogTitle>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start' }}>
                <Box>
                  <Typography variant="h5" fontWeight={600}>
                    {selectedJob.job_title}
                  </Typography>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mt: 1 }}>
                    <Typography variant="body1" color="text.secondary">
                      {selectedJob.employer_name}
                    </Typography>
                    {selectedJob.employer_verified && (
                      <VerifiedIcon sx={{ fontSize: 20, color: 'success.main' }} />
                    )}
                  </Box>
                </Box>
                <Chip
                  label={getJobTypeLabel(selectedJob.job_type)}
                  color={getJobTypeColor(selectedJob.job_type) as 'default' | 'primary' | 'secondary' | 'error' | 'info' | 'success' | 'warning'}
                />
              </Box>
            </DialogTitle>

            <DialogContent dividers>
              <Grid container spacing={2} sx={{ mb: 3 }}>
                {selectedJob.hourly_pay && (
                  <Grid item xs={6}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      <MoneyIcon color="action" />
                      <Box>
                        <Typography variant="caption" color="text.secondary">
                          Hourly Pay
                        </Typography>
                        <Typography variant="body1" fontWeight={600}>
                          ${selectedJob.hourly_pay}/hr
                        </Typography>
                      </Box>
                    </Box>
                  </Grid>
                )}
                {selectedJob.hours_per_week && (
                  <Grid item xs={6}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      <ScheduleIcon color="action" />
                      <Box>
                        <Typography variant="caption" color="text.secondary">
                          Hours per Week
                        </Typography>
                        <Typography variant="body1" fontWeight={600}>
                          {selectedJob.hours_per_week} hours
                        </Typography>
                      </Box>
                    </Box>
                  </Grid>
                )}
                {selectedJob.location && (
                  <Grid item xs={12}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      <LocationIcon color="action" />
                      <Box>
                        <Typography variant="caption" color="text.secondary">
                          Location
                        </Typography>
                        <Typography variant="body1" fontWeight={600}>
                          {selectedJob.location}
                        </Typography>
                      </Box>
                    </Box>
                  </Grid>
                )}
              </Grid>

              <Divider sx={{ my: 2 }} />

              <Typography variant="h6" gutterBottom fontWeight={600}>
                Job Description
              </Typography>
              <Typography variant="body1" paragraph sx={{ whiteSpace: 'pre-line' }}>
                {selectedJob.description}
              </Typography>

              {selectedJob.requirements && (
                <>
                  <Typography variant="h6" gutterBottom fontWeight={600} sx={{ mt: 3 }}>
                    Requirements
                  </Typography>
                  <Typography variant="body1" paragraph sx={{ whiteSpace: 'pre-line' }}>
                    {selectedJob.requirements}
                  </Typography>
                </>
              )}

              {selectedJob.application_link && (
                <Alert severity="info" sx={{ mt: 3 }}>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <Typography variant="body2">
                      External application required
                    </Typography>
                    <Button
                      size="small"
                      endIcon={<ExternalLinkIcon />}
                      onClick={() => window.open(selectedJob.application_link!, '_blank')}
                    >
                      Apply Externally
                    </Button>
                  </Box>
                </Alert>
              )}
            </DialogContent>

            <DialogActions sx={{ px: 3, py: 2 }}>
              <Button onClick={() => setDetailDialogOpen(false)}>
                Close
              </Button>
              <Button
                variant="contained"
                onClick={handleApplyClick}
              >
                Apply Now
              </Button>
            </DialogActions>
          </>
        )}
      </Dialog>

      <Dialog
        open={applyDialogOpen}
        onClose={() => setApplyDialogOpen(false)}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>Apply for {selectedJob?.job_title}</DialogTitle>
        <DialogContent>
          <TextField
            fullWidth
            multiline
            rows={6}
            label="Cover Letter (Optional)"
            value={coverLetter}
            onChange={(e) => setCoverLetter(e.target.value)}
            placeholder="Tell the employer why you're a great fit for this position..."
            sx={{ mt: 2 }}
          />
        </DialogContent>
        <DialogActions sx={{ px: 3, py: 2 }}>
          <Button onClick={() => setApplyDialogOpen(false)}>
            Cancel
          </Button>
          <Button
            variant="contained"
            onClick={handleSubmitApplication}
          >
            Submit Application
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
