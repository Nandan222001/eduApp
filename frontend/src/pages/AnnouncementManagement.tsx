import React, { useState, useEffect } from 'react';
import {
  Box,
  Container,
  Typography,
  Paper,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Grid,
  IconButton,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Alert,
  Snackbar,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Chip,
  Card,
  CardContent,
  FormGroup,
  FormControlLabel,
  Checkbox,
  LinearProgress,
  Tabs,
  Tab,
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
} from '@mui/material';
import {
  Add as AddIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  Send as SendIcon,
  Schedule as ScheduleIcon,
  Email as EmailIcon,
  Sms as SmsIcon,
  Notifications as NotificationsIcon,
  Check as CheckIcon,
  Visibility as VisibilityIcon,
  Announcement as AnnouncementIcon,
} from '@mui/icons-material';
import { format } from 'date-fns';
import { communicationsApi } from '../api/communications';
import { academicApi } from '../api/academic';
import type {
  Announcement,
  AnnouncementCreate,
  AudienceType,
  NotificationChannel,
  NotificationPriority,
} from '../types/communications';
import type { Grade, Section } from '../types/academic';

interface TabPanelProps {
  children?: React.ReactNode;
  index: number;
  value: number;
}

const TabPanel: React.FC<TabPanelProps> = ({ children, value, index }) => {
  return (
    <div role="tabpanel" hidden={value !== index}>
      {value === index && <Box sx={{ py: 3 }}>{children}</Box>}
    </div>
  );
};

interface ReadReceipt {
  user_id: number;
  user_name: string;
  read_at: string;
}

export const AnnouncementManagement: React.FC = () => {
  const [tabValue, setTabValue] = useState(0);
  const [announcements, setAnnouncements] = useState<Announcement[]>([]);
  const [publishedAnnouncements, setPublishedAnnouncements] = useState<Announcement[]>([]);
  const [draftAnnouncements, setDraftAnnouncements] = useState<Announcement[]>([]);
  const [grades, setGrades] = useState<Grade[]>([]);
  const [_sections, _setSections] = useState<Section[]>([]);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingAnnouncement, setEditingAnnouncement] = useState<Announcement | null>(null);
  const [readReceiptsDialogOpen, setReadReceiptsDialogOpen] = useState(false);
  const [selectedAnnouncementReceipts, setSelectedAnnouncementReceipts] = useState<ReadReceipt[]>(
    []
  );
  const [loading, setLoading] = useState(false);
  const [snackbar, setSnackbar] = useState<{
    open: boolean;
    message: string;
    severity: 'success' | 'error';
  }>({ open: false, message: '', severity: 'success' });

  const [formData, setFormData] = useState<AnnouncementCreate>({
    title: '',
    content: '',
    audience_type: 'all',
    audience_filter: {},
    channels: ['in_app'],
    priority: 'medium',
    scheduled_at: undefined,
    expires_at: undefined,
  });

  useEffect(() => {
    loadAnnouncements();
    loadGrades();
  }, []);

  const loadAnnouncements = async () => {
    try {
      setLoading(true);
      const allData = await communicationsApi.getAnnouncements();
      setAnnouncements(allData);
      setPublishedAnnouncements(allData.filter((a) => a.is_published));
      setDraftAnnouncements(allData.filter((a) => !a.is_published));
    } catch (error) {
      showSnackbar('Failed to load announcements', 'error');
    } finally {
      setLoading(false);
    }
  };

  const loadGrades = async () => {
    try {
      const data = await academicApi.getGrades(true);
      setGrades(data);
    } catch (error) {
      showSnackbar('Failed to load grades', 'error');
    }
  };

  const _loadSections = async (gradeId: number) => {
    try {
      const data = await academicApi.getSections(gradeId, true);
      _setSections(data);
    } catch (error) {
      showSnackbar('Failed to load sections', 'error');
    }
  };

  const showSnackbar = (message: string, severity: 'success' | 'error') => {
    setSnackbar({ open: true, message, severity });
  };

  const handleOpenDialog = (announcement?: Announcement) => {
    if (announcement) {
      setEditingAnnouncement(announcement);
      setFormData({
        title: announcement.title,
        content: announcement.content,
        audience_type: announcement.audience_type,
        audience_filter: announcement.audience_filter || {},
        channels: announcement.channels,
        priority: announcement.priority,
        scheduled_at: announcement.scheduled_at,
        expires_at: announcement.expires_at,
      });
    } else {
      setEditingAnnouncement(null);
      setFormData({
        title: '',
        content: '',
        audience_type: 'all',
        audience_filter: {},
        channels: ['in_app'],
        priority: 'medium',
        scheduled_at: undefined,
        expires_at: undefined,
      });
    }
    setDialogOpen(true);
  };

  const handleSaveAnnouncement = async () => {
    try {
      setLoading(true);
      if (editingAnnouncement) {
        await communicationsApi.updateAnnouncement(editingAnnouncement.id, formData);
        showSnackbar('Announcement updated successfully', 'success');
      } else {
        await communicationsApi.createAnnouncement(formData);
        showSnackbar('Announcement created successfully', 'success');
      }
      setDialogOpen(false);
      loadAnnouncements();
    } catch (error) {
      showSnackbar('Failed to save announcement', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handlePublishAnnouncement = async (announcement: Announcement) => {
    try {
      setLoading(true);
      await communicationsApi.publishAnnouncement(announcement.id);
      showSnackbar('Announcement published successfully', 'success');
      loadAnnouncements();
    } catch (error) {
      showSnackbar('Failed to publish announcement', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteAnnouncement = async (announcement: Announcement) => {
    if (!window.confirm(`Are you sure you want to delete "${announcement.title}"?`)) {
      return;
    }

    try {
      setLoading(true);
      await communicationsApi.deleteAnnouncement(announcement.id);
      showSnackbar('Announcement deleted successfully', 'success');
      loadAnnouncements();
    } catch (error) {
      showSnackbar('Failed to delete announcement', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleViewReadReceipts = (_announcement: Announcement) => {
    setSelectedAnnouncementReceipts([]);
    setReadReceiptsDialogOpen(true);
  };

  const handleChannelToggle = (channel: NotificationChannel) => {
    const channels = formData.channels.includes(channel)
      ? formData.channels.filter((c) => c !== channel)
      : [...formData.channels, channel];
    setFormData({ ...formData, channels });
  };

  const handleAudienceTypeChange = (audienceType: AudienceType) => {
    setFormData({
      ...formData,
      audience_type: audienceType,
      audience_filter: {},
    });
  };

  const getPriorityColor = (priority: NotificationPriority) => {
    switch (priority) {
      case 'urgent':
        return 'error';
      case 'high':
        return 'warning';
      case 'medium':
        return 'info';
      case 'low':
        return 'default';
      default:
        return 'default';
    }
  };

  const getAudienceDescription = (announcement: Announcement) => {
    switch (announcement.audience_type) {
      case 'all':
        return 'All users';
      case 'grade':
        return `Grades: ${announcement.audience_filter?.grade_ids?.join(', ') || 'None'}`;
      case 'section':
        return `Sections: ${announcement.audience_filter?.section_ids?.join(', ') || 'None'}`;
      case 'role':
        return `Roles: ${announcement.audience_filter?.role_ids?.join(', ') || 'None'}`;
      default:
        return announcement.audience_type;
    }
  };

  return (
    <Container maxWidth="xl">
      <Box sx={{ py: 4 }}>
        <Typography variant="h4" gutterBottom>
          Announcement Management
        </Typography>

        <Grid container spacing={3} sx={{ mt: 2, mb: 3 }}>
          <Grid item xs={12} sm={6} md={4}>
            <Card>
              <CardContent>
                <Box
                  sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}
                >
                  <Box>
                    <Typography color="textSecondary" gutterBottom variant="body2">
                      Total Announcements
                    </Typography>
                    <Typography variant="h4">{announcements.length}</Typography>
                  </Box>
                  <AnnouncementIcon sx={{ fontSize: 40, color: 'primary.main' }} />
                </Box>
              </CardContent>
            </Card>
          </Grid>
          <Grid item xs={12} sm={6} md={4}>
            <Card>
              <CardContent>
                <Box
                  sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}
                >
                  <Box>
                    <Typography color="textSecondary" gutterBottom variant="body2">
                      Published
                    </Typography>
                    <Typography variant="h4">{publishedAnnouncements.length}</Typography>
                  </Box>
                  <SendIcon sx={{ fontSize: 40, color: 'success.main' }} />
                </Box>
              </CardContent>
            </Card>
          </Grid>
          <Grid item xs={12} sm={6} md={4}>
            <Card>
              <CardContent>
                <Box
                  sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}
                >
                  <Box>
                    <Typography color="textSecondary" gutterBottom variant="body2">
                      Drafts
                    </Typography>
                    <Typography variant="h4">{draftAnnouncements.length}</Typography>
                  </Box>
                  <EditIcon sx={{ fontSize: 40, color: 'warning.main' }} />
                </Box>
              </CardContent>
            </Card>
          </Grid>
        </Grid>

        <Paper sx={{ mt: 3 }}>
          <Box sx={{ borderBottom: 1, borderColor: 'divider', p: 2 }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <Tabs value={tabValue} onChange={(_, newValue) => setTabValue(newValue)}>
                <Tab label="All Announcements" />
                <Tab label="Published" />
                <Tab label="Drafts" />
              </Tabs>
              <Button
                variant="contained"
                startIcon={<AddIcon />}
                onClick={() => handleOpenDialog()}
              >
                Create Announcement
              </Button>
            </Box>
          </Box>

          <TabPanel value={tabValue} index={0}>
            <TableContainer>
              <Table>
                <TableHead>
                  <TableRow>
                    <TableCell>Title</TableCell>
                    <TableCell>Audience</TableCell>
                    <TableCell>Channels</TableCell>
                    <TableCell>Priority</TableCell>
                    <TableCell>Status</TableCell>
                    <TableCell>Scheduled</TableCell>
                    <TableCell>Actions</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {announcements.map((announcement) => (
                    <TableRow key={announcement.id}>
                      <TableCell>
                        <Typography variant="body2" fontWeight="medium">
                          {announcement.title}
                        </Typography>
                        <Typography variant="caption" color="text.secondary">
                          {announcement.content.substring(0, 50)}...
                        </Typography>
                      </TableCell>
                      <TableCell>
                        <Typography variant="body2">
                          {getAudienceDescription(announcement)}
                        </Typography>
                      </TableCell>
                      <TableCell>
                        <Box sx={{ display: 'flex', gap: 0.5 }}>
                          {announcement.channels.includes('in_app') && (
                            <Chip icon={<NotificationsIcon />} label="App" size="small" />
                          )}
                          {announcement.channels.includes('email') && (
                            <Chip icon={<EmailIcon />} label="Email" size="small" />
                          )}
                          {announcement.channels.includes('sms') && (
                            <Chip icon={<SmsIcon />} label="SMS" size="small" />
                          )}
                        </Box>
                      </TableCell>
                      <TableCell>
                        <Chip
                          label={announcement.priority}
                          size="small"
                          color={getPriorityColor(announcement.priority)}
                        />
                      </TableCell>
                      <TableCell>
                        <Chip
                          label={announcement.is_published ? 'Published' : 'Draft'}
                          size="small"
                          color={announcement.is_published ? 'success' : 'default'}
                        />
                      </TableCell>
                      <TableCell>
                        {announcement.scheduled_at ? (
                          <Box sx={{ display: 'flex', alignItems: 'center' }}>
                            <ScheduleIcon sx={{ mr: 0.5, fontSize: 16 }} />
                            <Typography variant="body2">
                              {format(new Date(announcement.scheduled_at), 'MMM dd, yyyy HH:mm')}
                            </Typography>
                          </Box>
                        ) : (
                          <Typography variant="body2" color="text.secondary">
                            Immediate
                          </Typography>
                        )}
                      </TableCell>
                      <TableCell>
                        {!announcement.is_published && (
                          <IconButton
                            size="small"
                            onClick={() => handlePublishAnnouncement(announcement)}
                            sx={{ mr: 1 }}
                            title="Publish"
                          >
                            <SendIcon fontSize="small" />
                          </IconButton>
                        )}
                        {announcement.is_published && (
                          <IconButton
                            size="small"
                            onClick={() => handleViewReadReceipts(announcement)}
                            sx={{ mr: 1 }}
                            title="View Read Receipts"
                          >
                            <VisibilityIcon fontSize="small" />
                          </IconButton>
                        )}
                        <IconButton
                          size="small"
                          onClick={() => handleOpenDialog(announcement)}
                          sx={{ mr: 1 }}
                        >
                          <EditIcon fontSize="small" />
                        </IconButton>
                        <IconButton
                          size="small"
                          onClick={() => handleDeleteAnnouncement(announcement)}
                        >
                          <DeleteIcon fontSize="small" />
                        </IconButton>
                      </TableCell>
                    </TableRow>
                  ))}
                  {announcements.length === 0 && (
                    <TableRow>
                      <TableCell colSpan={7} align="center">
                        <Typography variant="body2" color="text.secondary">
                          No announcements found. Click &apos;Create Announcement&apos; to get
                          started.
                        </Typography>
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </TableContainer>
          </TabPanel>

          <TabPanel value={tabValue} index={1}>
            <TableContainer>
              <Table>
                <TableHead>
                  <TableRow>
                    <TableCell>Title</TableCell>
                    <TableCell>Audience</TableCell>
                    <TableCell>Published At</TableCell>
                    <TableCell>Actions</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {publishedAnnouncements.map((announcement) => (
                    <TableRow key={announcement.id}>
                      <TableCell>{announcement.title}</TableCell>
                      <TableCell>{getAudienceDescription(announcement)}</TableCell>
                      <TableCell>
                        {announcement.published_at &&
                          format(new Date(announcement.published_at), 'MMM dd, yyyy HH:mm')}
                      </TableCell>
                      <TableCell>
                        <IconButton
                          size="small"
                          onClick={() => handleViewReadReceipts(announcement)}
                          sx={{ mr: 1 }}
                        >
                          <VisibilityIcon fontSize="small" />
                        </IconButton>
                        <IconButton
                          size="small"
                          onClick={() => handleDeleteAnnouncement(announcement)}
                        >
                          <DeleteIcon fontSize="small" />
                        </IconButton>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          </TabPanel>

          <TabPanel value={tabValue} index={2}>
            <TableContainer>
              <Table>
                <TableHead>
                  <TableRow>
                    <TableCell>Title</TableCell>
                    <TableCell>Audience</TableCell>
                    <TableCell>Created At</TableCell>
                    <TableCell>Actions</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {draftAnnouncements.map((announcement) => (
                    <TableRow key={announcement.id}>
                      <TableCell>{announcement.title}</TableCell>
                      <TableCell>{getAudienceDescription(announcement)}</TableCell>
                      <TableCell>
                        {format(new Date(announcement.created_at), 'MMM dd, yyyy HH:mm')}
                      </TableCell>
                      <TableCell>
                        <IconButton
                          size="small"
                          onClick={() => handlePublishAnnouncement(announcement)}
                          sx={{ mr: 1 }}
                        >
                          <SendIcon fontSize="small" />
                        </IconButton>
                        <IconButton
                          size="small"
                          onClick={() => handleOpenDialog(announcement)}
                          sx={{ mr: 1 }}
                        >
                          <EditIcon fontSize="small" />
                        </IconButton>
                        <IconButton
                          size="small"
                          onClick={() => handleDeleteAnnouncement(announcement)}
                        >
                          <DeleteIcon fontSize="small" />
                        </IconButton>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          </TabPanel>
        </Paper>

        <Dialog open={dialogOpen} onClose={() => setDialogOpen(false)} maxWidth="md" fullWidth>
          <DialogTitle>
            {editingAnnouncement ? 'Edit Announcement' : 'Create New Announcement'}
          </DialogTitle>
          <DialogContent>
            <Box sx={{ pt: 2 }}>
              <TextField
                fullWidth
                label="Title"
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                sx={{ mb: 2 }}
                required
              />
              <TextField
                fullWidth
                label="Content"
                value={formData.content}
                onChange={(e) => setFormData({ ...formData, content: e.target.value })}
                multiline
                rows={6}
                sx={{ mb: 2 }}
                required
              />

              <FormControl fullWidth sx={{ mb: 2 }}>
                <InputLabel>Audience</InputLabel>
                <Select
                  value={formData.audience_type}
                  onChange={(e) => handleAudienceTypeChange(e.target.value as AudienceType)}
                  label="Audience"
                >
                  <MenuItem value="all">All Users</MenuItem>
                  <MenuItem value="grade">Specific Grade(s)</MenuItem>
                  <MenuItem value="section">Specific Section(s)</MenuItem>
                  <MenuItem value="role">Specific Role(s)</MenuItem>
                </Select>
              </FormControl>

              {formData.audience_type === 'grade' && (
                <FormControl fullWidth sx={{ mb: 2 }}>
                  <InputLabel>Select Grades</InputLabel>
                  <Select
                    multiple
                    value={formData.audience_filter?.grade_ids || []}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        audience_filter: {
                          ...formData.audience_filter,
                          grade_ids: e.target.value as number[],
                        },
                      })
                    }
                    label="Select Grades"
                  >
                    {grades.map((grade) => (
                      <MenuItem key={grade.id} value={grade.id}>
                        {grade.name}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
              )}

              <FormControl fullWidth sx={{ mb: 2 }}>
                <InputLabel>Priority</InputLabel>
                <Select
                  value={formData.priority}
                  onChange={(e) =>
                    setFormData({ ...formData, priority: e.target.value as NotificationPriority })
                  }
                  label="Priority"
                >
                  <MenuItem value="low">Low</MenuItem>
                  <MenuItem value="medium">Medium</MenuItem>
                  <MenuItem value="high">High</MenuItem>
                  <MenuItem value="urgent">Urgent</MenuItem>
                </Select>
              </FormControl>

              <Typography variant="subtitle2" gutterBottom>
                Delivery Channels
              </Typography>
              <FormGroup row sx={{ mb: 2 }}>
                <FormControlLabel
                  control={
                    <Checkbox
                      checked={formData.channels.includes('in_app')}
                      onChange={() => handleChannelToggle('in_app')}
                    />
                  }
                  label="In-App"
                />
                <FormControlLabel
                  control={
                    <Checkbox
                      checked={formData.channels.includes('email')}
                      onChange={() => handleChannelToggle('email')}
                    />
                  }
                  label="Email"
                />
                <FormControlLabel
                  control={
                    <Checkbox
                      checked={formData.channels.includes('sms')}
                      onChange={() => handleChannelToggle('sms')}
                    />
                  }
                  label="SMS"
                />
                <FormControlLabel
                  control={
                    <Checkbox
                      checked={formData.channels.includes('push')}
                      onChange={() => handleChannelToggle('push')}
                    />
                  }
                  label="Push"
                />
              </FormGroup>

              <Grid container spacing={2}>
                <Grid item xs={12} sm={6}>
                  <TextField
                    fullWidth
                    label="Schedule For (Optional)"
                    type="datetime-local"
                    value={formData.scheduled_at || ''}
                    onChange={(e) => setFormData({ ...formData, scheduled_at: e.target.value })}
                    InputLabelProps={{ shrink: true }}
                  />
                </Grid>
                <Grid item xs={12} sm={6}>
                  <TextField
                    fullWidth
                    label="Expires At (Optional)"
                    type="datetime-local"
                    value={formData.expires_at || ''}
                    onChange={(e) => setFormData({ ...formData, expires_at: e.target.value })}
                    InputLabelProps={{ shrink: true }}
                  />
                </Grid>
              </Grid>
            </Box>
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setDialogOpen(false)}>Cancel</Button>
            <Button variant="contained" onClick={handleSaveAnnouncement} disabled={loading}>
              {editingAnnouncement ? 'Update' : 'Create'}
            </Button>
          </DialogActions>
        </Dialog>

        <Dialog
          open={readReceiptsDialogOpen}
          onClose={() => setReadReceiptsDialogOpen(false)}
          maxWidth="sm"
          fullWidth
        >
          <DialogTitle>Read Receipts</DialogTitle>
          <DialogContent>
            <Box sx={{ pt: 2 }}>
              <Typography variant="body2" color="text.secondary" gutterBottom>
                Total Recipients: {selectedAnnouncementReceipts.length}
              </Typography>
              <LinearProgress variant="determinate" value={0} sx={{ mb: 2 }} />
              <List>
                {selectedAnnouncementReceipts.map((receipt) => (
                  <ListItem key={receipt.user_id}>
                    <ListItemIcon>
                      <CheckIcon color="success" />
                    </ListItemIcon>
                    <ListItemText
                      primary={receipt.user_name}
                      secondary={`Read at: ${format(new Date(receipt.read_at), 'MMM dd, yyyy HH:mm')}`}
                    />
                  </ListItem>
                ))}
                {selectedAnnouncementReceipts.length === 0 && (
                  <ListItem>
                    <ListItemText
                      primary="No read receipts yet"
                      secondary="Recipients haven't read this announcement"
                    />
                  </ListItem>
                )}
              </List>
            </Box>
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setReadReceiptsDialogOpen(false)}>Close</Button>
          </DialogActions>
        </Dialog>

        <Snackbar
          open={snackbar.open}
          autoHideDuration={6000}
          onClose={() => setSnackbar({ ...snackbar, open: false })}
        >
          <Alert
            onClose={() => setSnackbar({ ...snackbar, open: false })}
            severity={snackbar.severity}
            sx={{ width: '100%' }}
          >
            {snackbar.message}
          </Alert>
        </Snackbar>
      </Box>
    </Container>
  );
};

export default AnnouncementManagement;
