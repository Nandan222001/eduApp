import React, { useState } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Chip,
  Box,
  Typography,
  IconButton,
  FormGroup,
  FormControlLabel,
  Checkbox,
  Alert,
  CircularProgress,
} from '@mui/material';
import { Close as CloseIcon } from '@mui/icons-material';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import type {
  AnnouncementCreate,
  AudienceType,
  NotificationChannel,
  NotificationPriority,
} from '@/types/communications';
import { communicationsApi } from '@/api/communications';

interface RichTextEditorProps {
  value: string;
  onChange: (value: string) => void;
}

const SimpleRichTextEditor: React.FC<RichTextEditorProps> = ({ value, onChange }) => {
  return (
    <TextField
      fullWidth
      multiline
      rows={6}
      value={value}
      onChange={(e) => onChange(e.target.value)}
      placeholder="Type your announcement here..."
      variant="outlined"
    />
  );
};

interface AnnouncementComposerProps {
  open: boolean;
  onClose: () => void;
  grades?: Array<{ id: number; name: string }>;
  sections?: Array<{ id: number; name: string; grade_id: number }>;
}

export const AnnouncementComposer: React.FC<AnnouncementComposerProps> = ({
  open,
  onClose,
  grades = [],
  sections = [],
}) => {
  const queryClient = useQueryClient();
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [audienceType, setAudienceType] = useState<AudienceType>('all');
  const [selectedGrades, setSelectedGrades] = useState<number[]>([]);
  const [selectedSections, setSections] = useState<number[]>([]);
  const [priority, setPriority] = useState<NotificationPriority>('medium');
  const [channels, setChannels] = useState<NotificationChannel[]>(['in_app']);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const createMutation = useMutation({
    mutationFn: (data: AnnouncementCreate) => communicationsApi.createAnnouncement(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['announcements'] });
      handleClose();
    },
  });

  const publishMutation = useMutation({
    mutationFn: async (data: AnnouncementCreate) => {
      const announcement = await communicationsApi.createAnnouncement(data);
      return communicationsApi.publishAnnouncement(announcement.id);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['announcements'] });
      handleClose();
    },
  });

  const handleClose = () => {
    setTitle('');
    setContent('');
    setAudienceType('all');
    setSelectedGrades([]);
    setSections([]);
    setPriority('medium');
    setChannels(['in_app']);
    setErrors({});
    onClose();
  };

  const validate = () => {
    const newErrors: Record<string, string> = {};
    if (!title.trim()) newErrors.title = 'Title is required';
    if (!content.trim()) newErrors.content = 'Content is required';
    if (channels.length === 0) newErrors.channels = 'At least one channel is required';
    if (audienceType === 'grade' && selectedGrades.length === 0) {
      newErrors.audience = 'Select at least one grade';
    }
    if (audienceType === 'section' && selectedSections.length === 0) {
      newErrors.audience = 'Select at least one section';
    }
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (publish = false) => {
    if (!validate()) return;

    const data: AnnouncementCreate = {
      title,
      content,
      audience_type: audienceType,
      priority,
      channels,
    };

    if (audienceType === 'grade' && selectedGrades.length > 0) {
      data.audience_filter = { grade_ids: selectedGrades };
    } else if (audienceType === 'section' && selectedSections.length > 0) {
      data.audience_filter = { section_ids: selectedSections };
    }

    if (publish) {
      publishMutation.mutate(data);
    } else {
      createMutation.mutate(data);
    }
  };

  const handleChannelToggle = (channel: NotificationChannel) => {
    setChannels((prev) =>
      prev.includes(channel) ? prev.filter((c) => c !== channel) : [...prev, channel]
    );
  };

  return (
    <Dialog open={open} onClose={handleClose} maxWidth="md" fullWidth>
      <DialogTitle>
        <Box display="flex" justifyContent="space-between" alignItems="center">
          <Typography variant="h6">Create Announcement</Typography>
          <IconButton onClick={handleClose} size="small">
            <CloseIcon />
          </IconButton>
        </Box>
      </DialogTitle>
      <DialogContent dividers>
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
          {(createMutation.isError || publishMutation.isError) && (
            <Alert severity="error">Failed to create announcement. Please try again.</Alert>
          )}

          <TextField
            label="Title"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            error={!!errors.title}
            helperText={errors.title}
            fullWidth
            required
          />

          <Box>
            <Typography variant="body2" gutterBottom>
              Content *
            </Typography>
            <SimpleRichTextEditor value={content} onChange={setContent} />
            {errors.content && (
              <Typography variant="caption" color="error">
                {errors.content}
              </Typography>
            )}
          </Box>

          <FormControl fullWidth>
            <InputLabel>Audience</InputLabel>
            <Select
              value={audienceType}
              onChange={(e) => setAudienceType(e.target.value as AudienceType)}
              label="Audience"
            >
              <MenuItem value="all">All Users</MenuItem>
              <MenuItem value="grade">Specific Grades</MenuItem>
              <MenuItem value="section">Specific Sections</MenuItem>
              <MenuItem value="role">Specific Roles</MenuItem>
            </Select>
          </FormControl>

          {audienceType === 'grade' && (
            <FormControl fullWidth error={!!errors.audience}>
              <InputLabel>Select Grades</InputLabel>
              <Select
                multiple
                value={selectedGrades}
                onChange={(e) => setSelectedGrades(e.target.value as number[])}
                label="Select Grades"
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
              {errors.audience && (
                <Typography variant="caption" color="error">
                  {errors.audience}
                </Typography>
              )}
            </FormControl>
          )}

          {audienceType === 'section' && (
            <FormControl fullWidth error={!!errors.audience}>
              <InputLabel>Select Sections</InputLabel>
              <Select
                multiple
                value={selectedSections}
                onChange={(e) => setSections(e.target.value as number[])}
                label="Select Sections"
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
                    {section.name}
                  </MenuItem>
                ))}
              </Select>
              {errors.audience && (
                <Typography variant="caption" color="error">
                  {errors.audience}
                </Typography>
              )}
            </FormControl>
          )}

          <FormControl fullWidth>
            <InputLabel>Priority</InputLabel>
            <Select
              value={priority}
              onChange={(e) => setPriority(e.target.value as NotificationPriority)}
              label="Priority"
            >
              <MenuItem value="low">Low</MenuItem>
              <MenuItem value="medium">Medium</MenuItem>
              <MenuItem value="high">High</MenuItem>
              <MenuItem value="urgent">Urgent</MenuItem>
            </Select>
          </FormControl>

          <Box>
            <Typography variant="body2" gutterBottom>
              Notification Channels *
            </Typography>
            <FormGroup row>
              <FormControlLabel
                control={
                  <Checkbox
                    checked={channels.includes('in_app')}
                    onChange={() => handleChannelToggle('in_app')}
                  />
                }
                label="In-App"
              />
              <FormControlLabel
                control={
                  <Checkbox
                    checked={channels.includes('email')}
                    onChange={() => handleChannelToggle('email')}
                  />
                }
                label="Email"
              />
              <FormControlLabel
                control={
                  <Checkbox
                    checked={channels.includes('sms')}
                    onChange={() => handleChannelToggle('sms')}
                  />
                }
                label="SMS"
              />
              <FormControlLabel
                control={
                  <Checkbox
                    checked={channels.includes('push')}
                    onChange={() => handleChannelToggle('push')}
                  />
                }
                label="Push"
              />
            </FormGroup>
            {errors.channels && (
              <Typography variant="caption" color="error">
                {errors.channels}
              </Typography>
            )}
          </Box>
        </Box>
      </DialogContent>
      <DialogActions>
        <Button
          onClick={handleClose}
          disabled={createMutation.isPending || publishMutation.isPending}
        >
          Cancel
        </Button>
        <Button
          onClick={() => handleSubmit(false)}
          disabled={createMutation.isPending || publishMutation.isPending}
        >
          {createMutation.isPending ? <CircularProgress size={20} /> : 'Save as Draft'}
        </Button>
        <Button
          variant="contained"
          onClick={() => handleSubmit(true)}
          disabled={createMutation.isPending || publishMutation.isPending}
        >
          {publishMutation.isPending ? <CircularProgress size={20} /> : 'Publish Now'}
        </Button>
      </DialogActions>
    </Dialog>
  );
};
