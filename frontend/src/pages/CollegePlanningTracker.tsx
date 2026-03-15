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
  TextField,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Rating,
  Chip,
  Avatar,
  IconButton,
  ImageList,
  ImageListItem,
  ImageListItemBar,
  Divider,
  Alert,
  CircularProgress,
  useTheme,
  alpha,
} from '@mui/material';
import {
  Add as AddIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  PhotoCamera as PhotoCameraIcon,
  School as SchoolIcon,
  Event as EventIcon,
  Close as CloseIcon,
  CalendarToday as CalendarIcon,
  AccessTime as TimeIcon,
  Notes as NotesIcon,
  CheckCircle as CheckCircleIcon,
} from '@mui/icons-material';
import { useAuth } from '@/hooks/useAuth';
import collegeApi from '@/api/college';
import { CollegeVisit, CollegeVisitSchedule } from '@/types/college';

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
      id={`planning-tabpanel-${index}`}
      aria-labelledby={`planning-tab-${index}`}
      {...other}
    >
      {value === index && <Box sx={{ py: 3 }}>{children}</Box>}
    </div>
  );
}

export default function CollegePlanningTracker() {
  const theme = useTheme();
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState(0);
  const [visits, setVisits] = useState<CollegeVisit[]>([]);
  const [schedule, setSchedule] = useState<CollegeVisitSchedule[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [visitDialogOpen, setVisitDialogOpen] = useState(false);
  const [scheduleDialogOpen, setScheduleDialogOpen] = useState(false);
  const [photoGalleryOpen, setPhotoGalleryOpen] = useState(false);
  const [selectedVisit, setSelectedVisit] = useState<CollegeVisit | null>(null);
  const [selectedVisitForPhotos, setSelectedVisitForPhotos] = useState<CollegeVisit | null>(null);

  const [visitForm, setVisitForm] = useState<Partial<CollegeVisit>>({
    college_id: 0,
    visit_date: new Date().toISOString().split('T')[0],
    visit_type: 'in-person',
    rating: 0,
    campus_rating: 0,
    facilities_rating: 0,
    academics_rating: 0,
    atmosphere_rating: 0,
    notes: '',
    highlights: [],
    concerns: [],
    attended_info_session: false,
  });

  const [scheduleForm, setScheduleForm] = useState<Partial<CollegeVisitSchedule>>({
    college_id: 0,
    scheduled_date: new Date().toISOString().split('T')[0],
    scheduled_time: '10:00',
    visit_type: 'campus-tour',
    status: 'scheduled',
    notes: '',
  });

  const studentId = user?.id ? parseInt(user.id, 10) : 1;

  const loadData = useCallback(async () => {
    try {
      setLoading(true);
      const [visitsData, scheduleData] = await Promise.all([
        collegeApi.getVisits(studentId),
        collegeApi.getVisitSchedule(studentId),
      ]);
      setVisits(visitsData);
      setSchedule(scheduleData);
      setError(null);
    } catch (err) {
      setError('Failed to load college planning data');
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, [studentId]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const handleSaveVisit = async () => {
    try {
      if (selectedVisit) {
        await collegeApi.updateVisit(selectedVisit.id, visitForm);
      } else {
        await collegeApi.createVisit(studentId, visitForm);
      }
      await loadData();
      setVisitDialogOpen(false);
      resetVisitForm();
    } catch (err) {
      setError('Failed to save visit');
      console.error(err);
    }
  };

  const handleSaveSchedule = async () => {
    try {
      await collegeApi.createVisitSchedule(studentId, scheduleForm);
      await loadData();
      setScheduleDialogOpen(false);
      resetScheduleForm();
    } catch (err) {
      setError('Failed to save schedule');
      console.error(err);
    }
  };

  const handleDeleteVisit = async (visitId: number) => {
    try {
      await collegeApi.deleteVisit(visitId);
      await loadData();
    } catch (err) {
      setError('Failed to delete visit');
      console.error(err);
    }
  };

  const resetVisitForm = () => {
    setVisitForm({
      college_id: 0,
      visit_date: new Date().toISOString().split('T')[0],
      visit_type: 'in-person',
      rating: 0,
      campus_rating: 0,
      facilities_rating: 0,
      academics_rating: 0,
      atmosphere_rating: 0,
      notes: '',
      highlights: [],
      concerns: [],
      attended_info_session: false,
    });
    setSelectedVisit(null);
  };

  const resetScheduleForm = () => {
    setScheduleForm({
      college_id: 0,
      scheduled_date: new Date().toISOString().split('T')[0],
      scheduled_time: '10:00',
      visit_type: 'campus-tour',
      status: 'scheduled',
      notes: '',
    });
  };

  const openEditVisit = (visit: CollegeVisit) => {
    setSelectedVisit(visit);
    setVisitForm({
      college_id: visit.college_id,
      visit_date: visit.visit_date,
      visit_type: visit.visit_type,
      rating: visit.rating,
      campus_rating: visit.campus_rating,
      facilities_rating: visit.facilities_rating,
      academics_rating: visit.academics_rating,
      atmosphere_rating: visit.atmosphere_rating,
      notes: visit.notes,
      highlights: visit.highlights,
      concerns: visit.concerns,
      attended_info_session: visit.attended_info_session,
      tour_guide_name: visit.tour_guide_name,
      met_with_department: visit.met_with_department,
    });
    setVisitDialogOpen(true);
  };

  const getVisitTypeColor = (type: string) => {
    switch (type) {
      case 'in-person':
        return theme.palette.success.main;
      case 'virtual':
        return theme.palette.info.main;
      case 'self-guided':
        return theme.palette.warning.main;
      default:
        return theme.palette.grey[500];
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'confirmed':
        return theme.palette.success.main;
      case 'scheduled':
        return theme.palette.info.main;
      case 'completed':
        return theme.palette.primary.main;
      case 'cancelled':
        return theme.palette.error.main;
      default:
        return theme.palette.grey[500];
    }
  };

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
          College Planning Tracker
        </Typography>
        <Box sx={{ display: 'flex', gap: 2 }}>
          <Button
            variant="outlined"
            startIcon={<EventIcon />}
            onClick={() => setScheduleDialogOpen(true)}
          >
            Schedule Visit
          </Button>
          <Button
            variant="contained"
            startIcon={<AddIcon />}
            onClick={() => setVisitDialogOpen(true)}
          >
            Log Visit
          </Button>
        </Box>
      </Box>

      {error && (
        <Alert severity="error" sx={{ mb: 3 }} onClose={() => setError(null)}>
          {error}
        </Alert>
      )}

      <Tabs value={activeTab} onChange={(_, newValue) => setActiveTab(newValue)} sx={{ mb: 3 }}>
        <Tab label={`Visit Log (${visits.length})`} />
        <Tab label={`Scheduled Visits (${schedule.length})`} />
      </Tabs>

      <TabPanel value={activeTab} index={0}>
        {visits.length === 0 ? (
          <Card>
            <CardContent sx={{ textAlign: 'center', py: 8 }}>
              <SchoolIcon sx={{ fontSize: 64, color: 'text.secondary', mb: 2 }} />
              <Typography variant="h6" color="text.secondary" gutterBottom>
                No college visits logged yet
              </Typography>
              <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
                Start tracking your college visits to keep all your notes and impressions organized
              </Typography>
              <Button
                variant="contained"
                startIcon={<AddIcon />}
                onClick={() => setVisitDialogOpen(true)}
              >
                Log Your First Visit
              </Button>
            </CardContent>
          </Card>
        ) : (
          <Grid container spacing={3}>
            {visits.map((visit) => (
              <Grid item xs={12} md={6} lg={4} key={visit.id}>
                <Card
                  sx={{
                    height: '100%',
                    display: 'flex',
                    flexDirection: 'column',
                    '&:hover': {
                      boxShadow: theme.shadows[8],
                    },
                  }}
                >
                  <CardHeader
                    avatar={
                      <Avatar sx={{ bgcolor: theme.palette.primary.main }}>
                        <SchoolIcon />
                      </Avatar>
                    }
                    action={
                      <Box>
                        <IconButton size="small" onClick={() => openEditVisit(visit)}>
                          <EditIcon fontSize="small" />
                        </IconButton>
                        <IconButton
                          size="small"
                          onClick={() => handleDeleteVisit(visit.id)}
                          color="error"
                        >
                          <DeleteIcon fontSize="small" />
                        </IconButton>
                      </Box>
                    }
                    title={visit.college?.name || 'College Name'}
                    subheader={new Date(visit.visit_date).toLocaleDateString()}
                  />
                  <CardContent sx={{ flexGrow: 1 }}>
                    <Box sx={{ mb: 2 }}>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                        <Rating value={visit.rating} readOnly size="small" />
                        <Typography variant="body2" fontWeight={600}>
                          {visit.rating.toFixed(1)}
                        </Typography>
                      </Box>
                      <Chip
                        label={visit.visit_type}
                        size="small"
                        sx={{
                          bgcolor: alpha(getVisitTypeColor(visit.visit_type), 0.1),
                          color: getVisitTypeColor(visit.visit_type),
                        }}
                      />
                    </Box>

                    <Grid container spacing={1} sx={{ mb: 2 }}>
                      <Grid item xs={6}>
                        <Typography variant="caption" color="text.secondary" display="block">
                          Campus
                        </Typography>
                        <Rating value={visit.campus_rating || 0} readOnly size="small" />
                      </Grid>
                      <Grid item xs={6}>
                        <Typography variant="caption" color="text.secondary" display="block">
                          Facilities
                        </Typography>
                        <Rating value={visit.facilities_rating || 0} readOnly size="small" />
                      </Grid>
                      <Grid item xs={6}>
                        <Typography variant="caption" color="text.secondary" display="block">
                          Academics
                        </Typography>
                        <Rating value={visit.academics_rating || 0} readOnly size="small" />
                      </Grid>
                      <Grid item xs={6}>
                        <Typography variant="caption" color="text.secondary" display="block">
                          Atmosphere
                        </Typography>
                        <Rating value={visit.atmosphere_rating || 0} readOnly size="small" />
                      </Grid>
                    </Grid>

                    {visit.highlights.length > 0 && (
                      <Box sx={{ mb: 2 }}>
                        <Typography
                          variant="caption"
                          color="text.secondary"
                          display="block"
                          gutterBottom
                        >
                          Highlights
                        </Typography>
                        <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                          {visit.highlights.slice(0, 3).map((highlight, idx) => (
                            <Chip
                              key={idx}
                              label={highlight}
                              size="small"
                              color="success"
                              variant="outlined"
                            />
                          ))}
                        </Box>
                      </Box>
                    )}

                    {visit.notes && (
                      <Box>
                        <Typography
                          variant="caption"
                          color="text.secondary"
                          display="block"
                          gutterBottom
                        >
                          Notes
                        </Typography>
                        <Typography
                          variant="body2"
                          sx={{
                            display: '-webkit-box',
                            WebkitLineClamp: 3,
                            WebkitBoxOrient: 'vertical',
                            overflow: 'hidden',
                          }}
                        >
                          {visit.notes}
                        </Typography>
                      </Box>
                    )}

                    {visit.photos && visit.photos.length > 0 && (
                      <Box sx={{ mt: 2 }}>
                        <Button
                          size="small"
                          startIcon={<PhotoCameraIcon />}
                          onClick={() => {
                            setSelectedVisitForPhotos(visit);
                            setPhotoGalleryOpen(true);
                          }}
                        >
                          View Photos ({visit.photos.length})
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
        {schedule.length === 0 ? (
          <Card>
            <CardContent sx={{ textAlign: 'center', py: 8 }}>
              <EventIcon sx={{ fontSize: 64, color: 'text.secondary', mb: 2 }} />
              <Typography variant="h6" color="text.secondary" gutterBottom>
                No visits scheduled
              </Typography>
              <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
                Schedule your college visits and keep track of upcoming tours and interviews
              </Typography>
              <Button
                variant="contained"
                startIcon={<EventIcon />}
                onClick={() => setScheduleDialogOpen(true)}
              >
                Schedule Visit
              </Button>
            </CardContent>
          </Card>
        ) : (
          <Grid container spacing={3}>
            {schedule.map((item) => (
              <Grid item xs={12} md={6} key={item.id}>
                <Card>
                  <CardContent>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 2 }}>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                        <Avatar sx={{ bgcolor: theme.palette.primary.main }}>
                          <SchoolIcon />
                        </Avatar>
                        <Box>
                          <Typography variant="h6">{item.college?.name || 'College'}</Typography>
                          <Typography variant="caption" color="text.secondary">
                            {item.visit_type.replace('-', ' ').toUpperCase()}
                          </Typography>
                        </Box>
                      </Box>
                      <Chip
                        label={item.status}
                        size="small"
                        sx={{
                          bgcolor: alpha(getStatusColor(item.status), 0.1),
                          color: getStatusColor(item.status),
                        }}
                      />
                    </Box>

                    <Divider sx={{ my: 2 }} />

                    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <CalendarIcon fontSize="small" color="action" />
                        <Typography variant="body2">
                          {new Date(item.scheduled_date).toLocaleDateString()}
                        </Typography>
                      </Box>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <TimeIcon fontSize="small" color="action" />
                        <Typography variant="body2">{item.scheduled_time}</Typography>
                      </Box>
                      {item.notes && (
                        <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 1 }}>
                          <NotesIcon fontSize="small" color="action" />
                          <Typography variant="body2">{item.notes}</Typography>
                        </Box>
                      )}
                    </Box>

                    {item.reminder_sent && (
                      <Box sx={{ mt: 2 }}>
                        <Chip
                          icon={<CheckCircleIcon />}
                          label="Reminder Sent"
                          size="small"
                          color="success"
                          variant="outlined"
                        />
                      </Box>
                    )}
                  </CardContent>
                </Card>
              </Grid>
            ))}
          </Grid>
        )}
      </TabPanel>

      {/* Visit Dialog */}
      <Dialog
        open={visitDialogOpen}
        onClose={() => {
          setVisitDialogOpen(false);
          resetVisitForm();
        }}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle>{selectedVisit ? 'Edit Visit' : 'Log College Visit'}</DialogTitle>
        <DialogContent>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, mt: 2 }}>
            <TextField
              label="Visit Date"
              type="date"
              value={visitForm.visit_date}
              onChange={(e) => setVisitForm({ ...visitForm, visit_date: e.target.value })}
              InputLabelProps={{ shrink: true }}
              fullWidth
            />

            <TextField
              label="Visit Type"
              select
              value={visitForm.visit_type}
              onChange={(e) =>
                setVisitForm({
                  ...visitForm,
                  visit_type: e.target.value as 'in-person' | 'virtual' | 'self-guided',
                })
              }
              SelectProps={{ native: true }}
              fullWidth
            >
              <option value="in-person">In-Person</option>
              <option value="virtual">Virtual</option>
              <option value="self-guided">Self-Guided</option>
            </TextField>

            <Box>
              <Typography variant="body2" gutterBottom>
                Overall Rating
              </Typography>
              <Rating
                value={visitForm.rating}
                onChange={(_, value) => setVisitForm({ ...visitForm, rating: value || 0 })}
                size="large"
              />
            </Box>

            <Grid container spacing={2}>
              <Grid item xs={6}>
                <Typography variant="body2" gutterBottom>
                  Campus Rating
                </Typography>
                <Rating
                  value={visitForm.campus_rating}
                  onChange={(_, value) => setVisitForm({ ...visitForm, campus_rating: value || 0 })}
                />
              </Grid>
              <Grid item xs={6}>
                <Typography variant="body2" gutterBottom>
                  Facilities Rating
                </Typography>
                <Rating
                  value={visitForm.facilities_rating}
                  onChange={(_, value) =>
                    setVisitForm({ ...visitForm, facilities_rating: value || 0 })
                  }
                />
              </Grid>
              <Grid item xs={6}>
                <Typography variant="body2" gutterBottom>
                  Academics Rating
                </Typography>
                <Rating
                  value={visitForm.academics_rating}
                  onChange={(_, value) =>
                    setVisitForm({ ...visitForm, academics_rating: value || 0 })
                  }
                />
              </Grid>
              <Grid item xs={6}>
                <Typography variant="body2" gutterBottom>
                  Atmosphere Rating
                </Typography>
                <Rating
                  value={visitForm.atmosphere_rating}
                  onChange={(_, value) =>
                    setVisitForm({ ...visitForm, atmosphere_rating: value || 0 })
                  }
                />
              </Grid>
            </Grid>

            <TextField
              label="Tour Guide Name"
              value={visitForm.tour_guide_name || ''}
              onChange={(e) => setVisitForm({ ...visitForm, tour_guide_name: e.target.value })}
              fullWidth
            />

            <TextField
              label="Department Met With"
              value={visitForm.met_with_department || ''}
              onChange={(e) => setVisitForm({ ...visitForm, met_with_department: e.target.value })}
              fullWidth
            />

            <TextField
              label="Notes"
              value={visitForm.notes}
              onChange={(e) => setVisitForm({ ...visitForm, notes: e.target.value })}
              multiline
              rows={4}
              fullWidth
            />
          </Box>
        </DialogContent>
        <DialogActions>
          <Button
            onClick={() => {
              setVisitDialogOpen(false);
              resetVisitForm();
            }}
          >
            Cancel
          </Button>
          <Button onClick={handleSaveVisit} variant="contained">
            Save Visit
          </Button>
        </DialogActions>
      </Dialog>

      {/* Schedule Dialog */}
      <Dialog
        open={scheduleDialogOpen}
        onClose={() => {
          setScheduleDialogOpen(false);
          resetScheduleForm();
        }}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>Schedule College Visit</DialogTitle>
        <DialogContent>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, mt: 2 }}>
            <TextField
              label="Visit Date"
              type="date"
              value={scheduleForm.scheduled_date}
              onChange={(e) => setScheduleForm({ ...scheduleForm, scheduled_date: e.target.value })}
              InputLabelProps={{ shrink: true }}
              fullWidth
            />

            <TextField
              label="Visit Time"
              type="time"
              value={scheduleForm.scheduled_time}
              onChange={(e) => setScheduleForm({ ...scheduleForm, scheduled_time: e.target.value })}
              InputLabelProps={{ shrink: true }}
              fullWidth
            />

            <TextField
              label="Visit Type"
              select
              value={scheduleForm.visit_type}
              onChange={(e) =>
                setScheduleForm({
                  ...scheduleForm,
                  visit_type: e.target.value as
                    | 'campus-tour'
                    | 'info-session'
                    | 'interview'
                    | 'class-visit'
                    | 'meeting',
                })
              }
              SelectProps={{ native: true }}
              fullWidth
            >
              <option value="campus-tour">Campus Tour</option>
              <option value="info-session">Info Session</option>
              <option value="interview">Interview</option>
              <option value="class-visit">Class Visit</option>
              <option value="meeting">Meeting</option>
            </TextField>

            <TextField
              label="Notes"
              value={scheduleForm.notes || ''}
              onChange={(e) => setScheduleForm({ ...scheduleForm, notes: e.target.value })}
              multiline
              rows={3}
              fullWidth
            />
          </Box>
        </DialogContent>
        <DialogActions>
          <Button
            onClick={() => {
              setScheduleDialogOpen(false);
              resetScheduleForm();
            }}
          >
            Cancel
          </Button>
          <Button onClick={handleSaveSchedule} variant="contained">
            Schedule
          </Button>
        </DialogActions>
      </Dialog>

      {/* Photo Gallery Dialog */}
      <Dialog
        open={photoGalleryOpen}
        onClose={() => {
          setPhotoGalleryOpen(false);
          setSelectedVisitForPhotos(null);
        }}
        maxWidth="lg"
        fullWidth
      >
        <DialogTitle>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <Typography variant="h6">
              {selectedVisitForPhotos?.college?.name || 'College'} - Photo Gallery
            </Typography>
            <IconButton
              onClick={() => {
                setPhotoGalleryOpen(false);
                setSelectedVisitForPhotos(null);
              }}
            >
              <CloseIcon />
            </IconButton>
          </Box>
        </DialogTitle>
        <DialogContent>
          {selectedVisitForPhotos?.photos && selectedVisitForPhotos.photos.length > 0 ? (
            <ImageList cols={3} gap={8}>
              {selectedVisitForPhotos.photos.map((photo) => (
                <ImageListItem key={photo.id}>
                  <img
                    src={photo.url}
                    alt={photo.caption || 'Visit photo'}
                    loading="lazy"
                    style={{ height: 250, objectFit: 'cover' }}
                  />
                  {photo.caption && <ImageListItemBar title={photo.caption} />}
                </ImageListItem>
              ))}
            </ImageList>
          ) : (
            <Box sx={{ textAlign: 'center', py: 4 }}>
              <PhotoCameraIcon sx={{ fontSize: 64, color: 'text.secondary', mb: 2 }} />
              <Typography variant="body1" color="text.secondary">
                No photos uploaded yet
              </Typography>
            </Box>
          )}
        </DialogContent>
      </Dialog>
    </Box>
  );
}
