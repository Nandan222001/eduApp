import React, { useState } from 'react';
import {
  Box,
  Grid,
  Paper,
  Typography,
  TextField,
  Button,
  Card,
  CardContent,
  CardActions,
  Avatar,
  Chip,
  IconButton,
  Slider,
  FormControlLabel,
  Switch,
  Collapse,
  Alert,
  Rating,
  List,
  ListItem,
  ListItemText,
  Divider,
} from '@mui/material';
import {
  FilterList,
  LocationOn,
  Schedule,
  People,
  ExpandMore,
  ExpandLess,
  Verified,
  DirectionsCar,
  EmojiEvents,
} from '@mui/icons-material';
import { CarpoolMatch, CarpoolSearchFilters } from '@/types/carpool';

const mockMatches: CarpoolMatch[] = [
  {
    id: 1,
    parent_id: 101,
    parent_name: 'Sarah Johnson',
    parent_photo_url: undefined,
    home_location: {
      address: '123 Oak Street',
      latitude: 40.7128,
      longitude: -74.006,
    },
    school_route: [],
    compatibility_score: 95,
    schedule_alignment: 92,
    available_seats: 2,
    distance_from_you: 0.5,
    estimated_time_savings: 15,
    shared_route_percentage: 88,
    children: [
      { id: 201, name: 'Emma Johnson', grade: 'Grade 3' },
      { id: 202, name: 'Liam Johnson', grade: 'Grade 5' },
    ],
    preferred_times: {
      morning_pickup: '07:30 AM',
      afternoon_dropoff: '03:30 PM',
    },
    vehicle_info: {
      make: 'Toyota',
      model: 'Highlander',
      year: 2022,
      color: 'Silver',
      license_plate: 'ABC-1234',
    },
    verified_driver: true,
    rating: 4.8,
    total_rides: 156,
  },
  {
    id: 2,
    parent_id: 102,
    parent_name: 'Michael Chen',
    home_location: {
      address: '456 Maple Avenue',
      latitude: 40.7138,
      longitude: -74.007,
    },
    school_route: [],
    compatibility_score: 87,
    schedule_alignment: 85,
    available_seats: 3,
    distance_from_you: 0.8,
    estimated_time_savings: 12,
    shared_route_percentage: 75,
    children: [{ id: 203, name: 'Sophie Chen', grade: 'Grade 4' }],
    preferred_times: {
      morning_pickup: '07:45 AM',
      afternoon_dropoff: '03:45 PM',
    },
    verified_driver: true,
    rating: 4.9,
    total_rides: 203,
  },
];

const CarpoolFinder: React.FC = () => {
  const [showFilters, setShowFilters] = useState(false);
  const [homeAddress, setHomeAddress] = useState('');
  const [filters, setFilters] = useState<CarpoolSearchFilters>({
    max_distance: 5,
    min_compatibility_score: 70,
    verified_drivers_only: true,
    similar_schedule: true,
  });
  const [matches, setMatches] = useState<CarpoolMatch[]>([]);
  const [expandedCards, setExpandedCards] = useState<Set<number>>(new Set());

  const handleSearch = () => {
    setMatches(mockMatches);
  };

  const toggleCardExpanded = (matchId: number) => {
    const newExpanded = new Set(expandedCards);
    if (newExpanded.has(matchId)) {
      newExpanded.delete(matchId);
    } else {
      newExpanded.add(matchId);
    }
    setExpandedCards(newExpanded);
  };

  const getCompatibilityColor = (score: number): string => {
    if (score >= 90) return 'success';
    if (score >= 75) return 'info';
    if (score >= 60) return 'warning';
    return 'error';
  };

  return (
    <Box>
      <Paper sx={{ p: 3, mb: 3 }}>
        <Typography variant="h6" gutterBottom>
          Find Your Perfect Carpool Match
        </Typography>

        <Grid container spacing={2} alignItems="center">
          <Grid item xs={12} md={8}>
            <TextField
              fullWidth
              label="Your Home Address"
              placeholder="Enter your address to find nearby carpools"
              value={homeAddress}
              onChange={(e) => setHomeAddress(e.target.value)}
              InputProps={{
                startAdornment: <LocationOn color="action" sx={{ mr: 1 }} />,
              }}
            />
          </Grid>
          <Grid item xs={12} md={4}>
            <Box sx={{ display: 'flex', gap: 1 }}>
              <Button variant="contained" fullWidth onClick={handleSearch} disabled={!homeAddress}>
                Search Carpools
              </Button>
              <IconButton onClick={() => setShowFilters(!showFilters)} color="primary">
                <FilterList />
              </IconButton>
            </Box>
          </Grid>
        </Grid>

        <Collapse in={showFilters}>
          <Box sx={{ mt: 3, p: 2, bgcolor: 'grey.50', borderRadius: 1 }}>
            <Typography variant="subtitle2" gutterBottom>
              Search Filters
            </Typography>

            <Grid container spacing={3}>
              <Grid item xs={12} md={6}>
                <Typography variant="body2" gutterBottom>
                  Maximum Distance: {filters.max_distance} miles
                </Typography>
                <Slider
                  value={filters.max_distance}
                  onChange={(_, value) => setFilters({ ...filters, max_distance: value as number })}
                  min={1}
                  max={20}
                  marks
                  valueLabelDisplay="auto"
                />
              </Grid>

              <Grid item xs={12} md={6}>
                <Typography variant="body2" gutterBottom>
                  Minimum Compatibility: {filters.min_compatibility_score}%
                </Typography>
                <Slider
                  value={filters.min_compatibility_score}
                  onChange={(_, value) =>
                    setFilters({ ...filters, min_compatibility_score: value as number })
                  }
                  min={50}
                  max={100}
                  marks
                  valueLabelDisplay="auto"
                />
              </Grid>

              <Grid item xs={12} md={6}>
                <FormControlLabel
                  control={
                    <Switch
                      checked={filters.verified_drivers_only}
                      onChange={(e) =>
                        setFilters({ ...filters, verified_drivers_only: e.target.checked })
                      }
                    />
                  }
                  label="Verified Drivers Only"
                />
              </Grid>

              <Grid item xs={12} md={6}>
                <FormControlLabel
                  control={
                    <Switch
                      checked={filters.similar_schedule}
                      onChange={(e) =>
                        setFilters({ ...filters, similar_schedule: e.target.checked })
                      }
                    />
                  }
                  label="Similar Schedule"
                />
              </Grid>
            </Grid>
          </Box>
        </Collapse>
      </Paper>

      {matches.length === 0 ? (
        <Alert severity="info">
          Enter your home address and click &quot;Search Carpools&quot; to find matches
        </Alert>
      ) : (
        <Grid container spacing={2}>
          {matches.map((match) => (
            <Grid item xs={12} key={match.id}>
              <Card>
                <CardContent>
                  <Box sx={{ display: 'flex', gap: 2, mb: 2 }}>
                    <Avatar sx={{ width: 56, height: 56 }}>{match.parent_name.charAt(0)}</Avatar>
                    <Box sx={{ flex: 1 }}>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 0.5 }}>
                        <Typography variant="h6">{match.parent_name}</Typography>
                        {match.verified_driver && <Verified color="primary" fontSize="small" />}
                      </Box>
                      <Typography variant="body2" color="text.secondary" gutterBottom>
                        {match.home_location.address} • {match.distance_from_you} miles away
                      </Typography>
                      <Box sx={{ display: 'flex', gap: 1, alignItems: 'center' }}>
                        <Rating value={match.rating} precision={0.1} size="small" readOnly />
                        <Typography variant="caption" color="text.secondary">
                          ({match.total_rides} rides)
                        </Typography>
                      </Box>
                    </Box>
                    <Box sx={{ textAlign: 'right' }}>
                      <Chip
                        label={`${match.compatibility_score}% Match`}
                        color={
                          getCompatibilityColor(match.compatibility_score) as
                            | 'success'
                            | 'info'
                            | 'warning'
                            | 'error'
                        }
                        icon={<EmojiEvents />}
                        sx={{ fontWeight: 'bold' }}
                      />
                    </Box>
                  </Box>

                  <Grid container spacing={2}>
                    <Grid item xs={12} sm={4}>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <Schedule color="action" fontSize="small" />
                        <Box>
                          <Typography variant="caption" color="text.secondary" display="block">
                            Schedule Alignment
                          </Typography>
                          <Typography variant="body2" fontWeight="medium">
                            {match.schedule_alignment}%
                          </Typography>
                        </Box>
                      </Box>
                    </Grid>

                    <Grid item xs={12} sm={4}>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <People color="action" fontSize="small" />
                        <Box>
                          <Typography variant="caption" color="text.secondary" display="block">
                            Available Seats
                          </Typography>
                          <Typography variant="body2" fontWeight="medium">
                            {match.available_seats} seats
                          </Typography>
                        </Box>
                      </Box>
                    </Grid>

                    <Grid item xs={12} sm={4}>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <DirectionsCar color="action" fontSize="small" />
                        <Box>
                          <Typography variant="caption" color="text.secondary" display="block">
                            Route Match
                          </Typography>
                          <Typography variant="body2" fontWeight="medium">
                            {match.shared_route_percentage}%
                          </Typography>
                        </Box>
                      </Box>
                    </Grid>
                  </Grid>

                  <Box sx={{ mt: 2 }}>
                    <Typography variant="caption" color="text.secondary" display="block">
                      Children
                    </Typography>
                    <Box sx={{ display: 'flex', gap: 1, mt: 0.5, flexWrap: 'wrap' }}>
                      {match.children.map((child) => (
                        <Chip
                          key={child.id}
                          label={`${child.name} (${child.grade})`}
                          size="small"
                          variant="outlined"
                        />
                      ))}
                    </Box>
                  </Box>

                  <Collapse in={expandedCards.has(match.id)}>
                    <Box sx={{ mt: 2, pt: 2, borderTop: 1, borderColor: 'divider' }}>
                      <Grid container spacing={2}>
                        <Grid item xs={12} md={6}>
                          <Typography variant="subtitle2" gutterBottom>
                            Preferred Times
                          </Typography>
                          <List dense>
                            <ListItem>
                              <ListItemText
                                primary="Morning Pickup"
                                secondary={match.preferred_times.morning_pickup}
                              />
                            </ListItem>
                            <ListItem>
                              <ListItemText
                                primary="Afternoon Dropoff"
                                secondary={match.preferred_times.afternoon_dropoff}
                              />
                            </ListItem>
                          </List>
                        </Grid>

                        {match.vehicle_info && (
                          <Grid item xs={12} md={6}>
                            <Typography variant="subtitle2" gutterBottom>
                              Vehicle Information
                            </Typography>
                            <List dense>
                              <ListItem>
                                <ListItemText
                                  primary="Vehicle"
                                  secondary={`${match.vehicle_info.year} ${match.vehicle_info.make} ${match.vehicle_info.model}`}
                                />
                              </ListItem>
                              <ListItem>
                                <ListItemText
                                  primary="Color"
                                  secondary={match.vehicle_info.color}
                                />
                              </ListItem>
                            </List>
                          </Grid>
                        )}
                      </Grid>

                      <Alert severity="success" sx={{ mt: 2 }}>
                        Estimated time savings: {match.estimated_time_savings} minutes per day
                      </Alert>
                    </Box>
                  </Collapse>
                </CardContent>

                <Divider />

                <CardActions sx={{ justifyContent: 'space-between', px: 2 }}>
                  <Button
                    size="small"
                    onClick={() => toggleCardExpanded(match.id)}
                    endIcon={expandedCards.has(match.id) ? <ExpandLess /> : <ExpandMore />}
                  >
                    {expandedCards.has(match.id) ? 'Less Details' : 'More Details'}
                  </Button>
                  <Button variant="contained" size="small">
                    Connect
                  </Button>
                </CardActions>
              </Card>
            </Grid>
          ))}
        </Grid>
      )}
    </Box>
  );
};

export default CarpoolFinder;
