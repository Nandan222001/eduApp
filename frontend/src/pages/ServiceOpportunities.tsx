import { useState, useEffect } from 'react';
import {
  Box,
  Container,
  Typography,
  Grid,
  Card,
  CardContent,
  CardHeader,
  CardActions,
  Button,
  Chip,
  TextField,
  MenuItem,
  FormControl,
  InputLabel,
  Select,
  Stack,
  Avatar,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  Divider,
  IconButton,
  Alert,
  Paper,
  CircularProgress,
} from '@mui/material';
import {
  Search as SearchIcon,
  LocationOn as LocationIcon,
  People as PeopleIcon,
  CheckCircle as CheckCircleIcon,
  Close as CloseIcon,
  Favorite as FavoriteIcon,
  FavoriteBorder as FavoriteBorderIcon,
  AccessTime as TimeIcon,
  Assignment as AssignmentIcon,
  EmojiEvents as BenefitsIcon,
  Phone as PhoneIcon,
  Email as EmailIcon,
  WorkOutline as RemoteIcon,
} from '@mui/icons-material';
import communityServiceApi from '@/api/communityService';
import { ServiceOpportunity, ServiceCategory } from '@/types/communityService';

export default function ServiceOpportunities() {
  const [opportunities, setOpportunities] = useState<ServiceOpportunity[]>([]);
  const [filteredOpportunities, setFilteredOpportunities] = useState<ServiceOpportunity[]>([]);
  const [selectedOpportunity, setSelectedOpportunity] = useState<ServiceOpportunity | null>(null);
  const [detailsOpen, setDetailsOpen] = useState(false);
  const [applyDialogOpen, setApplyDialogOpen] = useState(false);
  const [coverLetter, setCoverLetter] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [savedOpportunities, setSavedOpportunities] = useState<Set<number>>(new Set());

  // Filters
  const [searchQuery, setSearchQuery] = useState('');
  const [categoryFilter, setCategoryFilter] = useState<string>('');
  const [interestFilter, setInterestFilter] = useState<string>('');
  const [timeCommitmentFilter, setTimeCommitmentFilter] = useState<string>('');
  const [remoteFilter, setRemoteFilter] = useState<string>('');
  const [ageFilter, setAgeFilter] = useState<string>('');

  useEffect(() => {
    fetchOpportunities();
  }, []);

  useEffect(() => {
    applyFilters();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [
    opportunities,
    searchQuery,
    categoryFilter,
    interestFilter,
    timeCommitmentFilter,
    remoteFilter,
    ageFilter,
  ]);

  const fetchOpportunities = async () => {
    try {
      setLoading(true);
      const data = await communityServiceApi.getServiceOpportunities();
      setOpportunities(data.filter((opp) => opp.status === 'active'));
      setError(null);
    } catch (err) {
      console.error('Failed to fetch opportunities:', err);
      setError('Failed to load service opportunities');
    } finally {
      setLoading(false);
    }
  };

  const applyFilters = () => {
    let filtered = [...opportunities];

    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(
        (opp) =>
          opp.title.toLowerCase().includes(query) ||
          opp.organization_name.toLowerCase().includes(query) ||
          opp.description.toLowerCase().includes(query)
      );
    }

    if (categoryFilter) {
      filtered = filtered.filter((opp) => opp.category === categoryFilter);
    }

    if (interestFilter) {
      filtered = filtered.filter((opp) =>
        opp.interest_areas.some((area) => area.toLowerCase().includes(interestFilter.toLowerCase()))
      );
    }

    if (timeCommitmentFilter) {
      filtered = filtered.filter((opp) =>
        opp.time_commitment.toLowerCase().includes(timeCommitmentFilter.toLowerCase())
      );
    }

    if (remoteFilter) {
      filtered = filtered.filter((opp) =>
        remoteFilter === 'remote' ? opp.remote_option : !opp.remote_option
      );
    }

    if (ageFilter) {
      const age = parseInt(ageFilter);
      filtered = filtered.filter(
        (opp) =>
          age >= opp.age_requirements.min_age &&
          (!opp.age_requirements.max_age || age <= opp.age_requirements.max_age)
      );
    }

    setFilteredOpportunities(filtered);
  };

  const handleViewDetails = (opportunity: ServiceOpportunity) => {
    setSelectedOpportunity(opportunity);
    setDetailsOpen(true);
  };

  const handleApply = (opportunity: ServiceOpportunity) => {
    setSelectedOpportunity(opportunity);
    setCoverLetter('');
    setApplyDialogOpen(true);
  };

  const handleSubmitApplication = async () => {
    if (!selectedOpportunity) return;

    try {
      await communityServiceApi.applyToOpportunity(selectedOpportunity.id, coverLetter);
      setApplyDialogOpen(false);
      alert('Application submitted successfully!');
    } catch (err) {
      console.error('Failed to submit application:', err);
      alert('Failed to submit application');
    }
  };

  const handleToggleSave = (opportunityId: number) => {
    setSavedOpportunities((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(opportunityId)) {
        newSet.delete(opportunityId);
      } else {
        newSet.add(opportunityId);
      }
      return newSet;
    });
  };

  const getCategoryLabel = (category: ServiceCategory) => {
    return category
      .split('_')
      .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
      .join(' ');
  };

  const getSpotsAvailable = (opportunity: ServiceOpportunity) => {
    if (!opportunity.spots_available) return null;
    return opportunity.spots_available - opportunity.spots_filled;
  };

  if (loading) {
    return (
      <Box
        sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '60vh' }}
      >
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Container maxWidth="xl" sx={{ py: 4 }}>
      <Typography variant="h4" fontWeight={700} gutterBottom>
        Service Opportunities
      </Typography>
      <Typography variant="body1" color="text.secondary" sx={{ mb: 4 }}>
        Find volunteer opportunities in your community
      </Typography>

      {error && (
        <Alert severity="error" sx={{ mb: 3 }} onClose={() => setError(null)}>
          {error}
        </Alert>
      )}

      {/* Filters */}
      <Paper sx={{ p: 3, mb: 4 }}>
        <Grid container spacing={2}>
          <Grid item xs={12} md={4}>
            <TextField
              fullWidth
              placeholder="Search opportunities..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              InputProps={{
                startAdornment: <SearchIcon sx={{ mr: 1, color: 'text.secondary' }} />,
              }}
            />
          </Grid>
          <Grid item xs={12} sm={6} md={2}>
            <FormControl fullWidth>
              <InputLabel>Category</InputLabel>
              <Select
                value={categoryFilter}
                label="Category"
                onChange={(e) => setCategoryFilter(e.target.value)}
              >
                <MenuItem value="">All Categories</MenuItem>
                {Object.values(ServiceCategory).map((category) => (
                  <MenuItem key={category} value={category}>
                    {getCategoryLabel(category)}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          </Grid>
          <Grid item xs={12} sm={6} md={2}>
            <TextField
              fullWidth
              label="Interest Area"
              value={interestFilter}
              onChange={(e) => setInterestFilter(e.target.value)}
            />
          </Grid>
          <Grid item xs={12} sm={6} md={2}>
            <FormControl fullWidth>
              <InputLabel>Time Commitment</InputLabel>
              <Select
                value={timeCommitmentFilter}
                label="Time Commitment"
                onChange={(e) => setTimeCommitmentFilter(e.target.value)}
              >
                <MenuItem value="">All</MenuItem>
                <MenuItem value="one-time">One-time</MenuItem>
                <MenuItem value="weekly">Weekly</MenuItem>
                <MenuItem value="monthly">Monthly</MenuItem>
                <MenuItem value="ongoing">Ongoing</MenuItem>
              </Select>
            </FormControl>
          </Grid>
          <Grid item xs={12} sm={6} md={1}>
            <TextField
              fullWidth
              label="Your Age"
              type="number"
              value={ageFilter}
              onChange={(e) => setAgeFilter(e.target.value)}
            />
          </Grid>
          <Grid item xs={12} sm={6} md={1}>
            <FormControl fullWidth>
              <InputLabel>Location</InputLabel>
              <Select
                value={remoteFilter}
                label="Location"
                onChange={(e) => setRemoteFilter(e.target.value)}
              >
                <MenuItem value="">All</MenuItem>
                <MenuItem value="remote">Remote</MenuItem>
                <MenuItem value="in-person">In-person</MenuItem>
              </Select>
            </FormControl>
          </Grid>
        </Grid>
      </Paper>

      {/* Opportunities Grid */}
      <Typography variant="h6" gutterBottom>
        {filteredOpportunities.length} Opportunities Available
      </Typography>

      <Grid container spacing={3}>
        {filteredOpportunities.map((opportunity) => {
          const spotsLeft = getSpotsAvailable(opportunity);
          const isFull = spotsLeft !== null && spotsLeft <= 0;

          return (
            <Grid item xs={12} md={6} lg={4} key={opportunity.id}>
              <Card sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
                <CardHeader
                  avatar={
                    <Avatar src={opportunity.organization_logo} sx={{ bgcolor: 'primary.main' }}>
                      {opportunity.organization_name.charAt(0)}
                    </Avatar>
                  }
                  action={
                    <IconButton onClick={() => handleToggleSave(opportunity.id)}>
                      {savedOpportunities.has(opportunity.id) ? (
                        <FavoriteIcon color="error" />
                      ) : (
                        <FavoriteBorderIcon />
                      )}
                    </IconButton>
                  }
                  title={opportunity.title}
                  subheader={opportunity.organization_name}
                />
                <CardContent sx={{ flexGrow: 1 }}>
                  <Stack spacing={2}>
                    <Stack direction="row" flexWrap="wrap" gap={1}>
                      <Chip
                        size="small"
                        label={getCategoryLabel(opportunity.category)}
                        color="primary"
                      />
                      {opportunity.remote_option && (
                        <Chip size="small" label="Remote Option" icon={<RemoteIcon />} />
                      )}
                      {isFull && <Chip size="small" label="Full" color="error" />}
                    </Stack>

                    <Typography
                      variant="body2"
                      color="text.secondary"
                      sx={{
                        display: '-webkit-box',
                        WebkitLineClamp: 3,
                        WebkitBoxOrient: 'vertical',
                        overflow: 'hidden',
                      }}
                    >
                      {opportunity.description}
                    </Typography>

                    <Stack spacing={1}>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <LocationIcon fontSize="small" color="action" />
                        <Typography variant="caption" color="text.secondary">
                          {opportunity.location}
                        </Typography>
                      </Box>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <TimeIcon fontSize="small" color="action" />
                        <Typography variant="caption" color="text.secondary">
                          {opportunity.time_commitment}
                        </Typography>
                      </Box>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <PeopleIcon fontSize="small" color="action" />
                        <Typography variant="caption" color="text.secondary">
                          Ages {opportunity.age_requirements.min_age}
                          {opportunity.age_requirements.max_age &&
                            `-${opportunity.age_requirements.max_age}`}
                        </Typography>
                      </Box>
                      {spotsLeft !== null && (
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                          <AssignmentIcon fontSize="small" color="action" />
                          <Typography variant="caption" color="text.secondary">
                            {spotsLeft} spot{spotsLeft !== 1 ? 's' : ''} available
                          </Typography>
                        </Box>
                      )}
                    </Stack>

                    <Stack direction="row" flexWrap="wrap" gap={0.5}>
                      {opportunity.interest_areas.slice(0, 3).map((area, index) => (
                        <Chip key={index} size="small" label={area} variant="outlined" />
                      ))}
                      {opportunity.interest_areas.length > 3 && (
                        <Chip
                          size="small"
                          label={`+${opportunity.interest_areas.length - 3} more`}
                          variant="outlined"
                        />
                      )}
                    </Stack>
                  </Stack>
                </CardContent>
                <CardActions>
                  <Button size="small" onClick={() => handleViewDetails(opportunity)}>
                    View Details
                  </Button>
                  <Button
                    size="small"
                    variant="contained"
                    disabled={isFull}
                    onClick={() => handleApply(opportunity)}
                  >
                    {isFull ? 'Full' : 'Apply'}
                  </Button>
                </CardActions>
              </Card>
            </Grid>
          );
        })}
      </Grid>

      {filteredOpportunities.length === 0 && (
        <Box sx={{ textAlign: 'center', py: 8 }}>
          <SearchIcon sx={{ fontSize: 64, color: 'text.secondary', mb: 2 }} />
          <Typography variant="h6" color="text.secondary">
            No opportunities found
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Try adjusting your filters
          </Typography>
        </Box>
      )}

      {/* Details Dialog */}
      <Dialog open={detailsOpen} onClose={() => setDetailsOpen(false)} maxWidth="md" fullWidth>
        {selectedOpportunity && (
          <>
            <DialogTitle>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                  <Avatar
                    src={selectedOpportunity.organization_logo}
                    sx={{ width: 56, height: 56 }}
                  >
                    {selectedOpportunity.organization_name.charAt(0)}
                  </Avatar>
                  <Box>
                    <Typography variant="h6">{selectedOpportunity.title}</Typography>
                    <Typography variant="body2" color="text.secondary">
                      {selectedOpportunity.organization_name}
                    </Typography>
                  </Box>
                </Box>
                <IconButton onClick={() => setDetailsOpen(false)}>
                  <CloseIcon />
                </IconButton>
              </Box>
            </DialogTitle>
            <DialogContent>
              <Stack spacing={3}>
                <Box>
                  <Typography variant="subtitle2" gutterBottom>
                    Description
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    {selectedOpportunity.description}
                  </Typography>
                </Box>

                <Divider />

                <Grid container spacing={2}>
                  <Grid item xs={6}>
                    <Typography variant="subtitle2" gutterBottom>
                      Category
                    </Typography>
                    <Chip label={getCategoryLabel(selectedOpportunity.category)} />
                  </Grid>
                  <Grid item xs={6}>
                    <Typography variant="subtitle2" gutterBottom>
                      Time Commitment
                    </Typography>
                    <Typography variant="body2">{selectedOpportunity.time_commitment}</Typography>
                  </Grid>
                  <Grid item xs={6}>
                    <Typography variant="subtitle2" gutterBottom>
                      Location
                    </Typography>
                    <Typography variant="body2">{selectedOpportunity.location}</Typography>
                  </Grid>
                  <Grid item xs={6}>
                    <Typography variant="subtitle2" gutterBottom>
                      Age Requirements
                    </Typography>
                    <Typography variant="body2">
                      {selectedOpportunity.age_requirements.min_age}
                      {selectedOpportunity.age_requirements.max_age &&
                        `-${selectedOpportunity.age_requirements.max_age}`}{' '}
                      years
                    </Typography>
                  </Grid>
                </Grid>

                <Divider />

                <Box>
                  <Typography variant="subtitle2" gutterBottom>
                    Interest Areas
                  </Typography>
                  <Stack direction="row" flexWrap="wrap" gap={1}>
                    {selectedOpportunity.interest_areas.map((area, index) => (
                      <Chip key={index} label={area} size="small" />
                    ))}
                  </Stack>
                </Box>

                {selectedOpportunity.requirements.length > 0 && (
                  <Box>
                    <Typography variant="subtitle2" gutterBottom>
                      Requirements
                    </Typography>
                    <List dense>
                      {selectedOpportunity.requirements.map((req, index) => (
                        <ListItem key={index}>
                          <ListItemIcon>
                            <CheckCircleIcon color="primary" fontSize="small" />
                          </ListItemIcon>
                          <ListItemText primary={req} />
                        </ListItem>
                      ))}
                    </List>
                  </Box>
                )}

                {selectedOpportunity.benefits.length > 0 && (
                  <Box>
                    <Typography variant="subtitle2" gutterBottom>
                      Benefits
                    </Typography>
                    <List dense>
                      {selectedOpportunity.benefits.map((benefit, index) => (
                        <ListItem key={index}>
                          <ListItemIcon>
                            <BenefitsIcon color="success" fontSize="small" />
                          </ListItemIcon>
                          <ListItemText primary={benefit} />
                        </ListItem>
                      ))}
                    </List>
                  </Box>
                )}

                {selectedOpportunity.schedule && (
                  <Box>
                    <Typography variant="subtitle2" gutterBottom>
                      Schedule
                    </Typography>
                    <Typography variant="body2">{selectedOpportunity.schedule}</Typography>
                  </Box>
                )}

                <Divider />

                <Box>
                  <Typography variant="subtitle2" gutterBottom>
                    Contact Information
                  </Typography>
                  <Stack spacing={1}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      <PeopleIcon fontSize="small" color="action" />
                      <Typography variant="body2">{selectedOpportunity.contact_name}</Typography>
                    </Box>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      <EmailIcon fontSize="small" color="action" />
                      <Typography variant="body2">{selectedOpportunity.contact_email}</Typography>
                    </Box>
                    {selectedOpportunity.contact_phone && (
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <PhoneIcon fontSize="small" color="action" />
                        <Typography variant="body2">{selectedOpportunity.contact_phone}</Typography>
                      </Box>
                    )}
                  </Stack>
                </Box>
              </Stack>
            </DialogContent>
            <DialogActions>
              <Button onClick={() => setDetailsOpen(false)}>Close</Button>
              <Button
                variant="contained"
                onClick={() => {
                  setDetailsOpen(false);
                  handleApply(selectedOpportunity);
                }}
              >
                Apply
              </Button>
            </DialogActions>
          </>
        )}
      </Dialog>

      {/* Apply Dialog */}
      <Dialog
        open={applyDialogOpen}
        onClose={() => setApplyDialogOpen(false)}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>Apply for Opportunity</DialogTitle>
        <DialogContent>
          {selectedOpportunity && (
            <Stack spacing={2} sx={{ mt: 1 }}>
              <Typography variant="body2" color="text.secondary">
                Applying for: <strong>{selectedOpportunity.title}</strong>
              </Typography>
              <TextField
                fullWidth
                multiline
                rows={6}
                label="Cover Letter (Optional)"
                placeholder="Tell us why you're interested in this opportunity..."
                value={coverLetter}
                onChange={(e) => setCoverLetter(e.target.value)}
              />
            </Stack>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setApplyDialogOpen(false)}>Cancel</Button>
          <Button variant="contained" onClick={handleSubmitApplication}>
            Submit Application
          </Button>
        </DialogActions>
      </Dialog>
    </Container>
  );
}
