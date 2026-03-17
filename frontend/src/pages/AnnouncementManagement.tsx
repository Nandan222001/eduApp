import { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Button,
  TextField,
  InputAdornment,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TablePagination,
  Chip,
  IconButton,
  Menu,
  MenuItem,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  CircularProgress,
  Alert,
  useTheme,
  FormControl,
  InputLabel,
  Select,
  Grid,
  Tabs,
  Tab,
  Card,
  CardContent,
  alpha,
  FormGroup,
  FormControlLabel,
  Checkbox,
  Badge,
  Divider,
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
  LinearProgress,
} from '@mui/material';
import {
  Add as AddIcon,
  Search as SearchIcon,
  MoreVert as MoreVertIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  Refresh as RefreshIcon,
  CheckCircle as CheckCircleIcon,
  Schedule as ScheduleIcon,
  Visibility as VisibilityIcon,
  AttachFile as AttachFileIcon,
  Send as SendIcon,
  Save as SaveIcon,
  Close as CloseIcon,
  MarkEmailRead as MarkEmailReadIcon,
  People as PeopleIcon,
  School as SchoolIcon,
  Class as ClassIcon,
  WorkOutline as WorkOutlineIcon,
} from '@mui/icons-material';
import { DateTimePicker } from '@mui/x-date-pickers/DateTimePicker';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
import { communicationsApi } from '@/api/communications';
import classesApi from '@/api/classes';
import type {
  Announcement,
  AnnouncementCreate,
  AudienceType,
  NotificationChannel,
  NotificationPriority,
} from '@/types/communications';
import { formatDistanceToNow } from 'date-fns';

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
      id={`announcement-tabpanel-${index}`}
      aria-labelledby={`announcement-tab-${index}`}
      {...other}
    >
      {value === index && <Box sx={{ pt: 3 }}>{children}</Box>}
    </div>
  );
}

interface RichTextEditorProps {
  value: string;
  onChange: (value: string) => void;
}

const SimpleRichTextEditor: React.FC<RichTextEditorProps> = ({ value, onChange }) => {
  const [focused, setFocused] = useState(false);

  const insertFormatting = (before: string, after: string) => {
    const textarea = document.querySelector(
      'textarea[name="announcement-content"]'
    ) as HTMLTextAreaElement;
    if (!textarea) return;

    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const selectedText = value.substring(start, end);
    const newText =
      value.substring(0, start) + before + selectedText + after + value.substring(end);

    onChange(newText);
    setTimeout(() => {
      textarea.focus();
      textarea.setSelectionRange(start + before.length, end + before.length);
    }, 0);
  };

  return (
    <Box sx={{ border: 1, borderColor: focused ? 'primary.main' : 'divider', borderRadius: 1 }}>
      <Box
        sx={{
          p: 1,
          display: 'flex',
          gap: 0.5,
          borderBottom: 1,
          borderColor: 'divider',
          bgcolor: 'background.default',
        }}
      >
        <Button size="small" onClick={() => insertFormatting('**', '**')} title="Bold">
          <strong>B</strong>
        </Button>
        <Button size="small" onClick={() => insertFormatting('*', '*')} title="Italic">
          <em>I</em>
        </Button>
        <Button size="small" onClick={() => insertFormatting('~~', '~~')} title="Strikethrough">
          <s>S</s>
        </Button>
        <Divider orientation="vertical" flexItem />
        <Button size="small" onClick={() => insertFormatting('\n# ', '')} title="Heading">
          H1
        </Button>
        <Button size="small" onClick={() => insertFormatting('\n- ', '')} title="Bullet List">
          •
        </Button>
        <Button size="small" onClick={() => insertFormatting('[', '](url)')} title="Link">
          Link
        </Button>
      </Box>
      <TextField
        name="announcement-content"
        fullWidth
        multiline
        rows={8}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        onFocus={() => setFocused(true)}
        onBlur={() => setFocused(false)}
        placeholder="Type your announcement here... (Supports Markdown formatting)"
        variant="standard"
        InputProps={{
          disableUnderline: true,
          sx: { p: 2 },
        }}
      />
    </Box>
  );
};

export default function AnnouncementManagement() {
  const theme = useTheme();
  const [tabValue, setTabValue] = useState(0);
  const [announcements, setAnnouncements] = useState<Announcement[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [total, setTotal] = useState(0);
  const [search, setSearch] = useState('');
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const [selectedAnnouncement, setSelectedAnnouncement] = useState<Announcement | null>(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [formDialogOpen, setFormDialogOpen] = useState(false);
  const [formMode, setFormMode] = useState<'create' | 'edit'>('create');
  const [submitting, setSubmitting] = useState(false);
  const [grades, setGrades] = useState<Array<{ id: number; name: string }>>([]);
  const [sections, setSections] = useState<Array<{ id: number; name: string; grade_id: number }>>(
    []
  );
  const [readReceiptsDialogOpen, setReadReceiptsDialogOpen] = useState(false);
  const [attachments, setAttachments] = useState<File[]>([]);

  const [formData, setFormData] = useState<
    AnnouncementCreate & { scheduled_at?: Date | null; expires_at?: Date | null }
  >({
    title: '',
    content: '',
    audience_type: 'all',
    audience_filter: {},
    priority: 'medium',
    channels: ['in_app'],
    scheduled_at: null,
    expires_at: null,
    attachments: [],
  });

  const fetchAnnouncements = async () => {
    try {
      setLoading(true);
      const isPublished = tabValue === 0 ? true : tabValue === 1 ? false : undefined;
      const data = await communicationsApi.getAnnouncements(
        isPublished,
        page * rowsPerPage,
        rowsPerPage
      );
      setAnnouncements(data);
      setTotal(data.length);
      setError(null);
    } catch (err: unknown) {
      const error = err as { response?: { data?: { detail?: string } } };
      setError(error.response?.data?.detail || 'Failed to load announcements');
    } finally {
      setLoading(false);
    }
  };

  const fetchGradesAndSections = async () => {
    try {
      const response = await classesApi.listClasses({ limit: 100 });
      const uniqueGrades = Array.from(
        new Map(
          response.items.map((item) => [
            item.grade_id,
            { id: item.grade_id, name: `Grade ${item.grade_id}` },
          ])
        ).values()
      );
      setGrades(uniqueGrades);
      setSections(
        response.items.map((item) => ({
          id: item.id,
          name: item.section || 'A',
          grade_id: item.grade_id,
        }))
      );
    } catch (err) {
      console.error('Failed to load grades and sections:', err);
    }
  };

  useEffect(() => {
    fetchAnnouncements();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [page, rowsPerPage, search, tabValue]);

  useEffect(() => {
    fetchGradesAndSections();
  }, []);

  const handleMenuOpen = (event: React.MouseEvent<HTMLElement>, announcement: Announcement) => {
    setAnchorEl(event.currentTarget);
    setSelectedAnnouncement(announcement);
  };

  const handleMenuClose = () => {
    setAnchorEl(null);
  };

  const handleCreate = () => {
    setFormMode('create');
    setFormData({
      title: '',
      content: '',
      audience_type: 'all',
      audience_filter: {},
      priority: 'medium',
      channels: ['in_app'],
      scheduled_at: null,
      expires_at: null,
      attachments: [],
    });
    setAttachments([]);
    setFormDialogOpen(true);
  };

  const handleEdit = () => {
    if (selectedAnnouncement) {
      setFormMode('edit');
      setFormData({
        title: selectedAnnouncement.title,
        content: selectedAnnouncement.content,
        audience_type: selectedAnnouncement.audience_type,
        audience_filter: selectedAnnouncement.audience_filter || {},
        priority: selectedAnnouncement.priority,
        channels: selectedAnnouncement.channels,
        scheduled_at: selectedAnnouncement.scheduled_at
          ? new Date(selectedAnnouncement.scheduled_at)
          : null,
        expires_at: selectedAnnouncement.expires_at
          ? new Date(selectedAnnouncement.expires_at)
          : null,
        attachments: selectedAnnouncement.attachments || [],
      });
      setFormDialogOpen(true);
    }
    handleMenuClose();
  };

  const handleDeleteClick = () => {
    setDeleteDialogOpen(true);
    handleMenuClose();
  };

  const handleDeleteConfirm = async () => {
    if (!selectedAnnouncement) return;

    try {
      await communicationsApi.deleteAnnouncement(selectedAnnouncement.id);
      setDeleteDialogOpen(false);
      setSelectedAnnouncement(null);
      fetchAnnouncements();
    } catch (err: unknown) {
      const error = err as { response?: { data?: { detail?: string } } };
      setError(error.response?.data?.detail || 'Failed to delete announcement');
    }
  };

  const handleFormSubmit = async (publish = false) => {
    try {
      setSubmitting(true);
      const submitData: AnnouncementCreate = {
        ...formData,
        scheduled_at: formData.scheduled_at ? formData.scheduled_at.toISOString() : undefined,
        expires_at: formData.expires_at ? formData.expires_at.toISOString() : undefined,
        attachments: formData.attachments,
      };

      if (formMode === 'create') {
        const created = await communicationsApi.createAnnouncement(submitData);
        if (publish) {
          await communicationsApi.publishAnnouncement(created.id);
        }
      } else if (selectedAnnouncement) {
        await communicationsApi.updateAnnouncement(selectedAnnouncement.id, submitData);
        if (publish && !selectedAnnouncement.is_published) {
          await communicationsApi.publishAnnouncement(selectedAnnouncement.id);
        }
      }
      setFormDialogOpen(false);
      fetchAnnouncements();
    } catch (err: unknown) {
      const error = err as { response?: { data?: { detail?: string } } };
      setError(error.response?.data?.detail || 'Failed to save announcement');
    } finally {
      setSubmitting(false);
    }
  };

  const handlePublish = async (announcement: Announcement) => {
    try {
      await communicationsApi.publishAnnouncement(announcement.id);
      fetchAnnouncements();
      handleMenuClose();
    } catch (err: unknown) {
      const error = err as { response?: { data?: { detail?: string } } };
      setError(error.response?.data?.detail || 'Failed to publish announcement');
    }
  };

  const handleViewReadReceipts = (announcement: Announcement) => {
    setSelectedAnnouncement(announcement);
    setReadReceiptsDialogOpen(true);
    handleMenuClose();
  };

  const handleChannelToggle = (channel: NotificationChannel) => {
    setFormData((prev) => ({
      ...prev,
      channels: prev.channels.includes(channel)
        ? prev.channels.filter((c) => c !== channel)
        : [...prev.channels, channel],
    }));
  };

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(event.target.files || []);
    setAttachments((prev) => [...prev, ...files]);
    setFormData((prev) => ({
      ...prev,
      attachments: [
        ...(prev.attachments || []),
        ...files.map((file) => ({
          name: file.name,
          url: URL.createObjectURL(file),
          size: file.size,
          type: file.type,
        })),
      ],
    }));
  };

  const handleRemoveAttachment = (index: number) => {
    setAttachments((prev) => prev.filter((_, i) => i !== index));
    setFormData((prev) => ({
      ...prev,
      attachments: (prev.attachments || []).filter((_, i) => i !== index),
    }));
  };

  const handleChangePage = (_event: unknown, newPage: number) => {
    setPage(newPage);
  };

  const handleChangeRowsPerPage = (event: React.ChangeEvent<HTMLInputElement>) => {
    setRowsPerPage(parseInt(event.target.value, 10));
    setPage(0);
  };

  const getPriorityColor = (priority: NotificationPriority) => {
    switch (priority) {
      case 'urgent':
        return 'error';
      case 'high':
        return 'warning';
      case 'medium':
        return 'info';
      default:
        return 'default';
    }
  };

  const getAudienceIcon = (audienceType: AudienceType) => {
    switch (audienceType) {
      case 'all':
        return <PeopleIcon />;
      case 'grade':
        return <SchoolIcon />;
      case 'class':
      case 'section':
        return <ClassIcon />;
      case 'role':
        return <WorkOutlineIcon />;
      default:
        return <PeopleIcon />;
    }
  };

  const formatDate = (dateString?: string) => {
    if (!dateString) return '-';
    return new Date(dateString).toLocaleDateString();
  };

  return (
    <Box>
      <Box sx={{ mb: 4, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <Box>
          <Typography variant="h4" fontWeight={700} gutterBottom>
            Announcement Management
          </Typography>
          <Typography variant="body1" color="text.secondary">
            Create, schedule, and manage announcements across your institution
          </Typography>
        </Box>
        <Button variant="contained" startIcon={<AddIcon />} onClick={handleCreate}>
          Create Announcement
        </Button>
      </Box>

      {error && (
        <Alert severity="error" sx={{ mb: 3 }} onClose={() => setError(null)}>
          {error}
        </Alert>
      )}

      <Paper elevation={0} sx={{ border: `1px solid ${theme.palette.divider}` }}>
        <Tabs
          value={tabValue}
          onChange={(_e, newValue) => setTabValue(newValue)}
          sx={{ borderBottom: `1px solid ${theme.palette.divider}`, px: 2 }}
        >
          <Tab label="Published" icon={<CheckCircleIcon />} iconPosition="start" />
          <Tab label="Drafts" icon={<SaveIcon />} iconPosition="start" />
          <Tab label="Scheduled" icon={<ScheduleIcon />} iconPosition="start" />
        </Tabs>

        <TabPanel value={tabValue} index={0}>
          <Box sx={{ p: 2, display: 'flex', gap: 2, alignItems: 'center' }}>
            <TextField
              placeholder="Search announcements..."
              size="small"
              value={search}
              onChange={(e) => {
                setSearch(e.target.value);
                setPage(0);
              }}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <SearchIcon />
                  </InputAdornment>
                ),
              }}
              sx={{ flexGrow: 1, maxWidth: 400 }}
            />
            <IconButton onClick={fetchAnnouncements}>
              <RefreshIcon />
            </IconButton>
          </Box>

          {loading ? (
            <Box sx={{ display: 'flex', justifyContent: 'center', p: 4 }}>
              <CircularProgress />
            </Box>
          ) : (
            <>
              <TableContainer>
                <Table>
                  <TableHead>
                    <TableRow>
                      <TableCell>Title</TableCell>
                      <TableCell>Audience</TableCell>
                      <TableCell>Priority</TableCell>
                      <TableCell>Channels</TableCell>
                      <TableCell>Published</TableCell>
                      <TableCell>Expires</TableCell>
                      <TableCell align="right">Actions</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {announcements.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={7} align="center">
                          <Typography variant="body2" color="text.secondary" py={4}>
                            No announcements found
                          </Typography>
                        </TableCell>
                      </TableRow>
                    ) : (
                      announcements.map((announcement) => (
                        <TableRow key={announcement.id} hover>
                          <TableCell>
                            <Box>
                              <Typography variant="body2" fontWeight={600}>
                                {announcement.title}
                              </Typography>
                              <Typography variant="caption" color="text.secondary">
                                {announcement.content.substring(0, 60)}
                                {announcement.content.length > 60 ? '...' : ''}
                              </Typography>
                            </Box>
                          </TableCell>
                          <TableCell>
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                              {getAudienceIcon(announcement.audience_type)}
                              <Typography variant="body2" textTransform="capitalize">
                                {announcement.audience_type}
                              </Typography>
                            </Box>
                          </TableCell>
                          <TableCell>
                            <Chip
                              label={announcement.priority}
                              color={getPriorityColor(announcement.priority)}
                              size="small"
                              sx={{ textTransform: 'capitalize' }}
                            />
                          </TableCell>
                          <TableCell>
                            <Box sx={{ display: 'flex', gap: 0.5, flexWrap: 'wrap' }}>
                              {announcement.channels.map((channel) => (
                                <Chip
                                  key={channel}
                                  label={channel}
                                  size="small"
                                  variant="outlined"
                                />
                              ))}
                            </Box>
                          </TableCell>
                          <TableCell>
                            <Typography variant="body2">
                              {announcement.published_at
                                ? formatDistanceToNow(new Date(announcement.published_at), {
                                    addSuffix: true,
                                  })
                                : '-'}
                            </Typography>
                          </TableCell>
                          <TableCell>
                            <Typography variant="body2">
                              {formatDate(announcement.expires_at)}
                            </Typography>
                          </TableCell>
                          <TableCell align="right">
                            <IconButton
                              onClick={(e) => {
                                e.stopPropagation();
                                handleMenuOpen(e, announcement);
                              }}
                            >
                              <MoreVertIcon />
                            </IconButton>
                          </TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              </TableContainer>
              <TablePagination
                rowsPerPageOptions={[5, 10, 25, 50]}
                component="div"
                count={total}
                rowsPerPage={rowsPerPage}
                page={page}
                onPageChange={handleChangePage}
                onRowsPerPageChange={handleChangeRowsPerPage}
              />
            </>
          )}
        </TabPanel>

        <TabPanel value={tabValue} index={1}>
          <Box sx={{ p: 2 }}>
            {loading ? (
              <Box sx={{ display: 'flex', justifyContent: 'center', p: 4 }}>
                <CircularProgress />
              </Box>
            ) : announcements.length === 0 ? (
              <Typography variant="body2" color="text.secondary" align="center" py={4}>
                No draft announcements
              </Typography>
            ) : (
              <Grid container spacing={2}>
                {announcements.map((announcement) => (
                  <Grid item xs={12} md={6} key={announcement.id}>
                    <Card variant="outlined">
                      <CardContent>
                        <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                          <Typography variant="h6">{announcement.title}</Typography>
                          <IconButton size="small" onClick={(e) => handleMenuOpen(e, announcement)}>
                            <MoreVertIcon />
                          </IconButton>
                        </Box>
                        <Typography variant="body2" color="text.secondary" paragraph>
                          {announcement.content.substring(0, 100)}
                          {announcement.content.length > 100 ? '...' : ''}
                        </Typography>
                        <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
                          <Chip label="Draft" size="small" />
                          <Chip
                            label={announcement.priority}
                            color={getPriorityColor(announcement.priority)}
                            size="small"
                          />
                        </Box>
                      </CardContent>
                    </Card>
                  </Grid>
                ))}
              </Grid>
            )}
          </Box>
        </TabPanel>

        <TabPanel value={tabValue} index={2}>
          <Box sx={{ p: 2 }}>
            {loading ? (
              <Box sx={{ display: 'flex', justifyContent: 'center', p: 4 }}>
                <CircularProgress />
              </Box>
            ) : announcements.filter((a) => a.scheduled_at && !a.is_published).length === 0 ? (
              <Typography variant="body2" color="text.secondary" align="center" py={4}>
                No scheduled announcements
              </Typography>
            ) : (
              <Grid container spacing={2}>
                {announcements
                  .filter((a) => a.scheduled_at && !a.is_published)
                  .map((announcement) => (
                    <Grid item xs={12} md={6} key={announcement.id}>
                      <Card variant="outlined">
                        <CardContent>
                          <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                            <Typography variant="h6">{announcement.title}</Typography>
                            <IconButton
                              size="small"
                              onClick={(e) => handleMenuOpen(e, announcement)}
                            >
                              <MoreVertIcon />
                            </IconButton>
                          </Box>
                          <Typography variant="body2" color="text.secondary" paragraph>
                            {announcement.content.substring(0, 100)}
                            {announcement.content.length > 100 ? '...' : ''}
                          </Typography>
                          <Box sx={{ display: 'flex', gap: 1, alignItems: 'center' }}>
                            <ScheduleIcon fontSize="small" color="action" />
                            <Typography variant="caption">
                              Scheduled for {formatDate(announcement.scheduled_at)}
                            </Typography>
                          </Box>
                        </CardContent>
                      </Card>
                    </Grid>
                  ))}
              </Grid>
            )}
          </Box>
        </TabPanel>
      </Paper>

      <Menu anchorEl={anchorEl} open={Boolean(anchorEl)} onClose={handleMenuClose}>
        {selectedAnnouncement && !selectedAnnouncement.is_published && (
          <MenuItem
            onClick={() => {
              if (selectedAnnouncement) handlePublish(selectedAnnouncement);
            }}
          >
            <SendIcon sx={{ mr: 1 }} fontSize="small" />
            Publish Now
          </MenuItem>
        )}
        <MenuItem onClick={handleEdit}>
          <EditIcon sx={{ mr: 1 }} fontSize="small" />
          Edit
        </MenuItem>
        <MenuItem
          onClick={() => {
            if (selectedAnnouncement) handleViewReadReceipts(selectedAnnouncement);
          }}
        >
          <MarkEmailReadIcon sx={{ mr: 1 }} fontSize="small" />
          View Read Receipts
        </MenuItem>
        <MenuItem onClick={handleDeleteClick} sx={{ color: 'error.main' }}>
          <DeleteIcon sx={{ mr: 1 }} fontSize="small" />
          Delete
        </MenuItem>
      </Menu>

      <Dialog open={deleteDialogOpen} onClose={() => setDeleteDialogOpen(false)}>
        <Box sx={{ p: 3 }}>
          <Typography variant="h6" gutterBottom>
            Delete Announcement
          </Typography>
          <Typography variant="body2" color="text.secondary" paragraph>
            Are you sure you want to delete &quot;{selectedAnnouncement?.title}&quot;? This action
            cannot be undone.
          </Typography>
          <Box sx={{ display: 'flex', gap: 2, justifyContent: 'flex-end', mt: 3 }}>
            <Button onClick={() => setDeleteDialogOpen(false)}>Cancel</Button>
            <Button variant="contained" color="error" onClick={handleDeleteConfirm}>
              Delete
            </Button>
          </Box>
        </Box>
      </Dialog>

      <Dialog
        open={formDialogOpen}
        onClose={() => setFormDialogOpen(false)}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle>
          <Box display="flex" justifyContent="space-between" alignItems="center">
            <Typography variant="h6">
              {formMode === 'create' ? 'Create Announcement' : 'Edit Announcement'}
            </Typography>
            <IconButton onClick={() => setFormDialogOpen(false)} size="small">
              <CloseIcon />
            </IconButton>
          </Box>
        </DialogTitle>
        <DialogContent dividers>
          <LocalizationProvider dateAdapter={AdapterDateFns}>
            <Grid container spacing={3}>
              <Grid item xs={12}>
                <TextField
                  fullWidth
                  label="Title"
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  required
                />
              </Grid>

              <Grid item xs={12}>
                <Typography variant="body2" gutterBottom fontWeight={600}>
                  Content *
                </Typography>
                <SimpleRichTextEditor
                  value={formData.content}
                  onChange={(content) => setFormData({ ...formData, content })}
                />
              </Grid>

              <Grid item xs={12} sm={6}>
                <FormControl fullWidth>
                  <InputLabel>Audience Type</InputLabel>
                  <Select
                    value={formData.audience_type}
                    label="Audience Type"
                    onChange={(e) =>
                      setFormData({ ...formData, audience_type: e.target.value as AudienceType })
                    }
                  >
                    <MenuItem value="all">All Users</MenuItem>
                    <MenuItem value="grade">Specific Grades</MenuItem>
                    <MenuItem value="class">Specific Classes</MenuItem>
                    <MenuItem value="role">Specific Roles</MenuItem>
                  </Select>
                </FormControl>
              </Grid>

              {formData.audience_type === 'grade' && (
                <Grid item xs={12} sm={6}>
                  <FormControl fullWidth>
                    <InputLabel>Select Grades</InputLabel>
                    <Select
                      multiple
                      value={formData.audience_filter?.grade_ids || []}
                      label="Select Grades"
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          audience_filter: {
                            ...formData.audience_filter,
                            grade_ids: e.target.value as number[],
                          },
                        })
                      }
                      renderValue={(selected) => (
                        <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                          {(selected as number[]).map((id) => {
                            const grade = grades.find((g) => g.id === id);
                            return <Chip key={id} label={grade?.name || id} size="small" />;
                          })}
                        </Box>
                      )}
                    >
                      {grades.map((grade) => (
                        <MenuItem key={grade.id} value={grade.id}>
                          {grade.name}
                        </MenuItem>
                      ))}
                    </Select>
                  </FormControl>
                </Grid>
              )}

              {formData.audience_type === 'class' && (
                <Grid item xs={12} sm={6}>
                  <FormControl fullWidth>
                    <InputLabel>Select Classes</InputLabel>
                    <Select
                      multiple
                      value={formData.audience_filter?.section_ids || []}
                      label="Select Classes"
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          audience_filter: {
                            ...formData.audience_filter,
                            section_ids: e.target.value as number[],
                          },
                        })
                      }
                      renderValue={(selected) => (
                        <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                          {(selected as number[]).map((id) => {
                            const section = sections.find((s) => s.id === id);
                            return <Chip key={id} label={section?.name || id} size="small" />;
                          })}
                        </Box>
                      )}
                    >
                      {sections.map((section) => (
                        <MenuItem key={section.id} value={section.id}>
                          Grade {section.grade_id} - {section.name}
                        </MenuItem>
                      ))}
                    </Select>
                  </FormControl>
                </Grid>
              )}

              {formData.audience_type === 'role' && (
                <Grid item xs={12} sm={6}>
                  <FormControl fullWidth>
                    <InputLabel>Select Roles</InputLabel>
                    <Select
                      multiple
                      value={formData.audience_filter?.role_ids || []}
                      label="Select Roles"
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          audience_filter: {
                            ...formData.audience_filter,
                            role_ids: e.target.value as number[],
                          },
                        })
                      }
                      renderValue={(selected) => (
                        <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                          {(selected as number[]).map((id) => (
                            <Chip
                              key={id}
                              label={['Student', 'Teacher', 'Parent', 'Admin'][id - 1] || id}
                              size="small"
                            />
                          ))}
                        </Box>
                      )}
                    >
                      <MenuItem value={1}>Student</MenuItem>
                      <MenuItem value={2}>Teacher</MenuItem>
                      <MenuItem value={3}>Parent</MenuItem>
                      <MenuItem value={4}>Admin</MenuItem>
                    </Select>
                  </FormControl>
                </Grid>
              )}

              <Grid item xs={12} sm={6}>
                <FormControl fullWidth>
                  <InputLabel>Priority</InputLabel>
                  <Select
                    value={formData.priority}
                    label="Priority"
                    onChange={(e) =>
                      setFormData({ ...formData, priority: e.target.value as NotificationPriority })
                    }
                  >
                    <MenuItem value="low">Low</MenuItem>
                    <MenuItem value="medium">Medium</MenuItem>
                    <MenuItem value="high">High</MenuItem>
                    <MenuItem value="urgent">Urgent</MenuItem>
                  </Select>
                </FormControl>
              </Grid>

              <Grid item xs={12}>
                <Typography variant="body2" gutterBottom fontWeight={600}>
                  Notification Channels *
                </Typography>
                <FormGroup row>
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
                    label="Push Notification"
                  />
                </FormGroup>
              </Grid>

              <Grid item xs={12} sm={6}>
                <DateTimePicker
                  label="Schedule For (Optional)"
                  value={formData.scheduled_at}
                  onChange={(date) => setFormData({ ...formData, scheduled_at: date })}
                  slotProps={{
                    textField: {
                      fullWidth: true,
                      helperText: 'Leave empty to publish immediately',
                    },
                  }}
                />
              </Grid>

              <Grid item xs={12} sm={6}>
                <DateTimePicker
                  label="Expires At (Optional)"
                  value={formData.expires_at}
                  onChange={(date) => setFormData({ ...formData, expires_at: date })}
                  slotProps={{
                    textField: {
                      fullWidth: true,
                      helperText: 'Leave empty for no expiration',
                    },
                  }}
                />
              </Grid>

              <Grid item xs={12}>
                <Typography variant="body2" gutterBottom fontWeight={600}>
                  Attachments
                </Typography>
                <Button variant="outlined" component="label" startIcon={<AttachFileIcon />}>
                  Add Attachment
                  <input type="file" hidden multiple onChange={handleFileUpload} />
                </Button>
                {attachments.length > 0 && (
                  <Box sx={{ mt: 2 }}>
                    {attachments.map((file, index) => (
                      <Chip
                        key={index}
                        label={`${file.name} (${(file.size / 1024).toFixed(1)} KB)`}
                        onDelete={() => handleRemoveAttachment(index)}
                        sx={{ mr: 1, mb: 1 }}
                      />
                    ))}
                  </Box>
                )}
              </Grid>
            </Grid>
          </LocalizationProvider>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setFormDialogOpen(false)} disabled={submitting}>
            Cancel
          </Button>
          <Button onClick={() => handleFormSubmit(false)} disabled={submitting}>
            {submitting ? <CircularProgress size={20} /> : 'Save as Draft'}
          </Button>
          <Button
            variant="contained"
            onClick={() => handleFormSubmit(true)}
            disabled={submitting}
            startIcon={<SendIcon />}
          >
            {submitting ? (
              <CircularProgress size={20} />
            ) : formData.scheduled_at ? (
              'Schedule'
            ) : (
              'Publish Now'
            )}
          </Button>
        </DialogActions>
      </Dialog>

      <Dialog
        open={readReceiptsDialogOpen}
        onClose={() => setReadReceiptsDialogOpen(false)}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>
          <Box display="flex" justifyContent="space-between" alignItems="center">
            <Typography variant="h6">Read Receipts</Typography>
            <IconButton onClick={() => setReadReceiptsDialogOpen(false)} size="small">
              <CloseIcon />
            </IconButton>
          </Box>
        </DialogTitle>
        <DialogContent dividers>
          {selectedAnnouncement && (
            <Box>
              <Card sx={{ mb: 2, bgcolor: alpha(theme.palette.primary.main, 0.05) }}>
                <CardContent>
                  <Typography variant="h6" gutterBottom>
                    {selectedAnnouncement.title}
                  </Typography>
                  <Grid container spacing={2}>
                    <Grid item xs={6}>
                      <Typography variant="body2" color="text.secondary">
                        Total Recipients
                      </Typography>
                      <Typography variant="h4" fontWeight={700}>
                        243
                      </Typography>
                    </Grid>
                    <Grid item xs={6}>
                      <Typography variant="body2" color="text.secondary">
                        Read
                      </Typography>
                      <Typography variant="h4" fontWeight={700} color="success.main">
                        187
                      </Typography>
                    </Grid>
                  </Grid>
                  <Box sx={{ mt: 2 }}>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                      <Typography variant="body2">Read Rate</Typography>
                      <Typography variant="body2" fontWeight={600}>
                        76.9%
                      </Typography>
                    </Box>
                    <LinearProgress
                      variant="determinate"
                      value={76.9}
                      sx={{ height: 8, borderRadius: 1 }}
                    />
                  </Box>
                </CardContent>
              </Card>

              <Typography variant="subtitle2" gutterBottom>
                Recent Reads
              </Typography>
              <List>
                {[
                  { name: 'John Smith', role: 'Parent', time: '2 minutes ago' },
                  { name: 'Sarah Johnson', role: 'Teacher', time: '5 minutes ago' },
                  { name: 'Mike Davis', role: 'Student', time: '10 minutes ago' },
                  { name: 'Emily Brown', role: 'Parent', time: '15 minutes ago' },
                ].map((item, index) => (
                  <ListItem key={index} divider>
                    <ListItemIcon>
                      <Badge color="success" variant="dot">
                        <VisibilityIcon color="action" />
                      </Badge>
                    </ListItemIcon>
                    <ListItemText primary={item.name} secondary={`${item.role} • ${item.time}`} />
                  </ListItem>
                ))}
              </List>
            </Box>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setReadReceiptsDialogOpen(false)}>Close</Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
