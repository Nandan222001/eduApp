import { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Grid,
  Card,
  CardContent,
  CardHeader,
  CardActions,
  Button,
  TextField,
  Chip,
  Avatar,
  IconButton,
  Paper,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  Slider,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Checkbox,
  FormControlLabel,
  FormGroup,
  Alert,
  CircularProgress,
  useTheme,
  Divider,
  InputAdornment,
} from '@mui/material';
import {
  Search as SearchIcon,
  School as SchoolIcon,
  LocationOn as LocationIcon,
  ExpandMore as ExpandMoreIcon,
  FilterList as FilterListIcon,
  Clear as ClearIcon,
  Bookmark as BookmarkIcon,
  BookmarkBorder as BookmarkBorderIcon,
  Info as InfoIcon,
  Add as AddIcon,
} from '@mui/icons-material';
import { useAuth } from '@/hooks/useAuth';
import collegeApi from '@/api/college';
import { College, CollegeSearchFilters } from '@/types/college';

export default function CollegeSearch() {
  const theme = useTheme();
  useAuth();
  const [colleges, setColleges] = useState<College[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [savedColleges, setSavedColleges] = useState<Set<number>>(new Set());

  useEffect(() => {
    searchColleges();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const [filters, setFilters] = useState<CollegeSearchFilters>({
    query: '',
    majors: [],
    location: {
      states: [],
      cities: [],
      setting: [],
    },
    size: [],
    type: [],
    acceptance_rate: {
      min: 0,
      max: 100,
    },
    tuition: {
      min: 0,
      max: 80000,
    },
    sat_score: {
      min: 400,
      max: 1600,
    },
  });

  const majorOptions = [
    'Computer Science',
    'Engineering',
    'Business',
    'Biology',
    'Psychology',
    'Economics',
    'Mathematics',
    'English',
    'History',
    'Political Science',
    'Pre-Med',
    'Nursing',
    'Education',
    'Fine Arts',
    'Communications',
  ];

  const stateOptions = [
    'California',
    'New York',
    'Texas',
    'Massachusetts',
    'Illinois',
    'Pennsylvania',
    'Florida',
    'Ohio',
    'Michigan',
    'North Carolina',
  ];

  const searchColleges = async () => {
    try {
      setLoading(true);
      const results = await collegeApi.searchColleges(filters);
      setColleges(results);
      setError(null);
    } catch (err) {
      setError('Failed to search colleges');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = () => {
    searchColleges();
  };

  const handleClearFilters = () => {
    setFilters({
      query: '',
      majors: [],
      location: {
        states: [],
        cities: [],
        setting: [],
      },
      size: [],
      type: [],
      acceptance_rate: {
        min: 0,
        max: 100,
      },
      tuition: {
        min: 0,
        max: 80000,
      },
      sat_score: {
        min: 400,
        max: 1600,
      },
    });
  };

  const toggleSaveCollege = (collegeId: number) => {
    const newSaved = new Set(savedColleges);
    if (newSaved.has(collegeId)) {
      newSaved.delete(collegeId);
    } else {
      newSaved.add(collegeId);
    }
    setSavedColleges(newSaved);
  };

  return (
    <Box>
      <Box sx={{ mb: 3 }}>
        <Typography variant="h4" fontWeight={700} gutterBottom>
          College Search
        </Typography>
        <Typography variant="body2" color="text.secondary">
          Search and filter colleges to find your perfect match
        </Typography>
      </Box>

      {error && (
        <Alert severity="error" sx={{ mb: 3 }} onClose={() => setError(null)}>
          {error}
        </Alert>
      )}

      <Grid container spacing={3}>
        <Grid item xs={12} md={3}>
          <Paper sx={{ p: 2, position: 'sticky', top: 80 }}>
            <Box
              sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}
            >
              <Typography variant="h6" fontWeight={700}>
                <FilterListIcon sx={{ mr: 1, verticalAlign: 'middle' }} />
                Filters
              </Typography>
              <Button size="small" startIcon={<ClearIcon />} onClick={handleClearFilters}>
                Clear
              </Button>
            </Box>

            <Divider sx={{ mb: 2 }} />

            <Box sx={{ mb: 3 }}>
              <TextField
                fullWidth
                placeholder="Search colleges..."
                value={filters.query}
                onChange={(e) => setFilters({ ...filters, query: e.target.value })}
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <SearchIcon />
                    </InputAdornment>
                  ),
                }}
              />
            </Box>

            <Accordion defaultExpanded>
              <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                <Typography variant="subtitle2" fontWeight={600}>
                  Majors
                </Typography>
              </AccordionSummary>
              <AccordionDetails>
                <FormGroup>
                  {majorOptions.slice(0, 8).map((major) => (
                    <FormControlLabel
                      key={major}
                      control={
                        <Checkbox
                          checked={filters.majors?.includes(major) || false}
                          onChange={(e) => {
                            const newMajors = e.target.checked
                              ? [...(filters.majors || []), major]
                              : (filters.majors || []).filter((m) => m !== major);
                            setFilters({ ...filters, majors: newMajors });
                          }}
                        />
                      }
                      label={<Typography variant="body2">{major}</Typography>}
                    />
                  ))}
                </FormGroup>
              </AccordionDetails>
            </Accordion>

            <Accordion>
              <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                <Typography variant="subtitle2" fontWeight={600}>
                  Location
                </Typography>
              </AccordionSummary>
              <AccordionDetails>
                <FormControl fullWidth size="small" sx={{ mb: 2 }}>
                  <InputLabel>States</InputLabel>
                  <Select
                    multiple
                    value={filters.location?.states || []}
                    onChange={(e) =>
                      setFilters({
                        ...filters,
                        location: { ...filters.location, states: e.target.value as string[] },
                      })
                    }
                    renderValue={(selected) => (
                      <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                        {selected.map((value) => (
                          <Chip key={value} label={value} size="small" />
                        ))}
                      </Box>
                    )}
                  >
                    {stateOptions.map((state) => (
                      <MenuItem key={state} value={state}>
                        {state}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>

                <Typography variant="caption" color="text.secondary" display="block" gutterBottom>
                  Campus Setting
                </Typography>
                <FormGroup>
                  {['urban', 'suburban', 'rural'].map((setting) => (
                    <FormControlLabel
                      key={setting}
                      control={
                        <Checkbox
                          checked={
                            filters.location?.setting?.includes(
                              setting as 'urban' | 'suburban' | 'rural'
                            ) || false
                          }
                          onChange={(e) => {
                            const newSettings = e.target.checked
                              ? [
                                  ...(filters.location?.setting || []),
                                  setting as 'urban' | 'suburban' | 'rural',
                                ]
                              : (filters.location?.setting || []).filter((s) => s !== setting);
                            setFilters({
                              ...filters,
                              location: { ...filters.location, setting: newSettings },
                            });
                          }}
                        />
                      }
                      label={<Typography variant="body2">{setting}</Typography>}
                    />
                  ))}
                </FormGroup>
              </AccordionDetails>
            </Accordion>

            <Accordion>
              <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                <Typography variant="subtitle2" fontWeight={600}>
                  School Size
                </Typography>
              </AccordionSummary>
              <AccordionDetails>
                <FormGroup>
                  {['small', 'medium', 'large'].map((size) => (
                    <FormControlLabel
                      key={size}
                      control={
                        <Checkbox
                          checked={
                            filters.size?.includes(size as 'small' | 'medium' | 'large') || false
                          }
                          onChange={(e) => {
                            const newSizes = e.target.checked
                              ? [...(filters.size || []), size as 'small' | 'medium' | 'large']
                              : (filters.size || []).filter((s) => s !== size);
                            setFilters({ ...filters, size: newSizes });
                          }}
                        />
                      }
                      label={<Typography variant="body2">{size}</Typography>}
                    />
                  ))}
                </FormGroup>
              </AccordionDetails>
            </Accordion>

            <Accordion>
              <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                <Typography variant="subtitle2" fontWeight={600}>
                  School Type
                </Typography>
              </AccordionSummary>
              <AccordionDetails>
                <FormGroup>
                  {['public', 'private', 'community'].map((type) => (
                    <FormControlLabel
                      key={type}
                      control={
                        <Checkbox
                          checked={
                            filters.type?.includes(type as 'public' | 'private' | 'community') ||
                            false
                          }
                          onChange={(e) => {
                            const newTypes = e.target.checked
                              ? [
                                  ...(filters.type || []),
                                  type as 'public' | 'private' | 'community',
                                ]
                              : (filters.type || []).filter((t) => t !== type);
                            setFilters({ ...filters, type: newTypes });
                          }}
                        />
                      }
                      label={<Typography variant="body2">{type}</Typography>}
                    />
                  ))}
                </FormGroup>
              </AccordionDetails>
            </Accordion>

            <Accordion>
              <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                <Typography variant="subtitle2" fontWeight={600}>
                  Acceptance Rate
                </Typography>
              </AccordionSummary>
              <AccordionDetails>
                <Typography variant="caption" color="text.secondary">
                  {filters.acceptance_rate?.min}% - {filters.acceptance_rate?.max}%
                </Typography>
                <Slider
                  value={[filters.acceptance_rate?.min || 0, filters.acceptance_rate?.max || 100]}
                  onChange={(_, newValue) =>
                    setFilters({
                      ...filters,
                      acceptance_rate: {
                        min: (newValue as number[])[0],
                        max: (newValue as number[])[1],
                      },
                    })
                  }
                  min={0}
                  max={100}
                  valueLabelDisplay="auto"
                />
              </AccordionDetails>
            </Accordion>

            <Accordion>
              <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                <Typography variant="subtitle2" fontWeight={600}>
                  Tuition Range
                </Typography>
              </AccordionSummary>
              <AccordionDetails>
                <Typography variant="caption" color="text.secondary">
                  ${filters.tuition?.min?.toLocaleString()} - $
                  {filters.tuition?.max?.toLocaleString()}
                </Typography>
                <Slider
                  value={[filters.tuition?.min || 0, filters.tuition?.max || 80000]}
                  onChange={(_, newValue) =>
                    setFilters({
                      ...filters,
                      tuition: {
                        min: (newValue as number[])[0],
                        max: (newValue as number[])[1],
                      },
                    })
                  }
                  min={0}
                  max={80000}
                  step={1000}
                  valueLabelDisplay="auto"
                />
              </AccordionDetails>
            </Accordion>

            <Accordion>
              <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                <Typography variant="subtitle2" fontWeight={600}>
                  SAT Score Range
                </Typography>
              </AccordionSummary>
              <AccordionDetails>
                <Typography variant="caption" color="text.secondary">
                  {filters.sat_score?.min} - {filters.sat_score?.max}
                </Typography>
                <Slider
                  value={[filters.sat_score?.min || 400, filters.sat_score?.max || 1600]}
                  onChange={(_, newValue) =>
                    setFilters({
                      ...filters,
                      sat_score: {
                        min: (newValue as number[])[0],
                        max: (newValue as number[])[1],
                      },
                    })
                  }
                  min={400}
                  max={1600}
                  step={10}
                  valueLabelDisplay="auto"
                />
              </AccordionDetails>
            </Accordion>

            <Button
              fullWidth
              variant="contained"
              startIcon={<SearchIcon />}
              onClick={handleSearch}
              sx={{ mt: 2 }}
            >
              Search
            </Button>
          </Paper>
        </Grid>

        <Grid item xs={12} md={9}>
          <Box
            sx={{ mb: 2, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}
          >
            <Typography variant="body2" color="text.secondary">
              {colleges.length} colleges found
            </Typography>
          </Box>

          {loading ? (
            <Box sx={{ display: 'flex', justifyContent: 'center', py: 8 }}>
              <CircularProgress />
            </Box>
          ) : colleges.length === 0 ? (
            <Card>
              <CardContent sx={{ textAlign: 'center', py: 8 }}>
                <SchoolIcon sx={{ fontSize: 64, color: 'text.secondary', mb: 2 }} />
                <Typography variant="h6" color="text.secondary" gutterBottom>
                  No colleges found
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Try adjusting your filters to see more results
                </Typography>
              </CardContent>
            </Card>
          ) : (
            <Grid container spacing={3}>
              {colleges.map((college) => (
                <Grid item xs={12} key={college.id}>
                  <Card>
                    <CardHeader
                      avatar={
                        <Avatar
                          src={college.logo_url}
                          sx={{ width: 56, height: 56, bgcolor: theme.palette.primary.main }}
                        >
                          <SchoolIcon />
                        </Avatar>
                      }
                      action={
                        <IconButton onClick={() => toggleSaveCollege(college.id)}>
                          {savedColleges.has(college.id) ? (
                            <BookmarkIcon color="primary" />
                          ) : (
                            <BookmarkBorderIcon />
                          )}
                        </IconButton>
                      }
                      title={college.name}
                      subheader={
                        <Box sx={{ display: 'flex', gap: 1, mt: 0.5 }}>
                          <Chip
                            icon={<LocationIcon />}
                            label={`${college.city}, ${college.state}`}
                            size="small"
                          />
                          <Chip label={college.type} size="small" variant="outlined" />
                        </Box>
                      }
                    />
                    <CardContent>
                      <Grid container spacing={2}>
                        <Grid item xs={12} sm={3}>
                          <Typography variant="caption" color="text.secondary" display="block">
                            Acceptance Rate
                          </Typography>
                          <Typography variant="h6" fontWeight={700}>
                            {college.acceptance_rate}%
                          </Typography>
                        </Grid>
                        <Grid item xs={12} sm={3}>
                          <Typography variant="caption" color="text.secondary" display="block">
                            Tuition
                          </Typography>
                          <Typography variant="h6" fontWeight={700}>
                            ${college.tuition_in_state?.toLocaleString() || 'N/A'}
                          </Typography>
                        </Grid>
                        <Grid item xs={12} sm={3}>
                          <Typography variant="caption" color="text.secondary" display="block">
                            Avg SAT
                          </Typography>
                          <Typography variant="h6" fontWeight={700}>
                            {college.sat_avg || 'N/A'}
                          </Typography>
                        </Grid>
                        <Grid item xs={12} sm={3}>
                          <Typography variant="caption" color="text.secondary" display="block">
                            Ranking
                          </Typography>
                          <Typography variant="h6" fontWeight={700}>
                            {college.ranking_national ? `#${college.ranking_national}` : 'N/A'}
                          </Typography>
                        </Grid>
                      </Grid>

                      {college.notable_programs && college.notable_programs.length > 0 && (
                        <Box sx={{ mt: 2 }}>
                          <Typography
                            variant="caption"
                            color="text.secondary"
                            display="block"
                            gutterBottom
                          >
                            Notable Programs
                          </Typography>
                          <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                            {college.notable_programs.slice(0, 5).map((program, idx) => (
                              <Chip key={idx} label={program} size="small" />
                            ))}
                          </Box>
                        </Box>
                      )}
                    </CardContent>
                    <CardActions>
                      <Button size="small" startIcon={<InfoIcon />}>
                        More Info
                      </Button>
                      <Button size="small" startIcon={<AddIcon />} variant="outlined">
                        Add to List
                      </Button>
                    </CardActions>
                  </Card>
                </Grid>
              ))}
            </Grid>
          )}
        </Grid>
      </Grid>
    </Box>
  );
}
