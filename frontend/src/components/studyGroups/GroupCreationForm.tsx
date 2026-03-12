import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Button,
  Box,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  FormControlLabel,
  Checkbox,
  Typography,
  Alert,
  Avatar,
  IconButton,
} from '@mui/material';
import { Close, CloudUpload } from '@mui/icons-material';
import axios from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000';

interface GroupCreationFormProps {
  open: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

interface Subject {
  id: number;
  name: string;
}

interface Chapter {
  id: number;
  name: string;
}

const GroupCreationForm: React.FC<GroupCreationFormProps> = ({ open, onClose, onSuccess }) => {
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [subjectId, setSubjectId] = useState<number | ''>('');
  const [chapterId, setChapterId] = useState<number | ''>('');
  const [isPublic, setIsPublic] = useState(true);
  const [maxMembers, setMaxMembers] = useState<number | ''>('');
  const [avatar, setAvatar] = useState<File | null>(null);
  const [avatarPreview, setAvatarPreview] = useState('');
  const [coverImage, setCoverImage] = useState<File | null>(null);
  const [coverPreview, setCoverPreview] = useState('');
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [chapters, setChapters] = useState<Chapter[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (open) {
      loadSubjects();
    }
  }, [open]);

  useEffect(() => {
    if (subjectId) {
      loadChapters(subjectId as number);
    } else {
      setChapters([]);
      setChapterId('');
    }
  }, [subjectId]);

  const loadSubjects = async () => {
    try {
      const response = await axios.get(`${API_BASE_URL}/api/v1/academic/subjects`);
      setSubjects(response.data);
    } catch (err) {
      console.error('Failed to load subjects:', err);
    }
  };

  const loadChapters = async (subjectId: number) => {
    try {
      const response = await axios.get(
        `${API_BASE_URL}/api/v1/academic/subjects/${subjectId}/chapters`
      );
      setChapters(response.data);
    } catch (err) {
      console.error('Failed to load chapters:', err);
    }
  };

  const handleAvatarSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      setAvatar(file);
      setAvatarPreview(URL.createObjectURL(file));
    }
  };

  const handleCoverSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      setCoverImage(file);
      setCoverPreview(URL.createObjectURL(file));
    }
  };

  const handleSubmit = async () => {
    if (!name.trim()) {
      setError('Group name is required');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const formData = new FormData();
      formData.append('name', name);
      if (description) formData.append('description', description);
      if (subjectId) formData.append('subject_id', String(subjectId));
      if (chapterId) formData.append('chapter_id', String(chapterId));
      formData.append('is_public', String(isPublic));
      if (maxMembers) formData.append('max_members', String(maxMembers));
      if (avatar) formData.append('avatar', avatar);
      if (coverImage) formData.append('cover_image', coverImage);

      await axios.post(`${API_BASE_URL}/api/v1/study-groups`, formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });

      handleClose();
      onSuccess();
    } catch (err) {
      const error = err as { response?: { data?: { detail?: string } } };
      setError(error.response?.data?.detail || 'Failed to create group');
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    setName('');
    setDescription('');
    setSubjectId('');
    setChapterId('');
    setIsPublic(true);
    setMaxMembers('');
    setAvatar(null);
    setAvatarPreview('');
    setCoverImage(null);
    setCoverPreview('');
    setError('');
    onClose();
  };

  return (
    <Dialog open={open} onClose={handleClose} maxWidth="md" fullWidth>
      <DialogTitle>
        <Box display="flex" justifyContent="space-between" alignItems="center">
          <Typography variant="h6">Create Study Group</Typography>
          <IconButton onClick={handleClose} size="small">
            <Close />
          </IconButton>
        </Box>
      </DialogTitle>

      <DialogContent dividers>
        {error && (
          <Alert severity="error" sx={{ mb: 2 }}>
            {error}
          </Alert>
        )}

        <Box display="flex" gap={2} mb={2}>
          <Box textAlign="center">
            <Typography variant="caption" display="block" mb={1}>
              Group Avatar
            </Typography>
            <Avatar src={avatarPreview} sx={{ width: 80, height: 80, mb: 1 }}>
              {name[0] || 'G'}
            </Avatar>
            <Button size="small" variant="outlined" component="label">
              Upload
              <input type="file" hidden accept="image/*" onChange={handleAvatarSelect} />
            </Button>
          </Box>

          <Box flex={1}>
            <Typography variant="caption" display="block" mb={1}>
              Cover Image (Optional)
            </Typography>
            {coverPreview ? (
              <Box position="relative">
                <img
                  src={coverPreview}
                  alt="Cover preview"
                  style={{ width: '100%', height: 120, objectFit: 'cover', borderRadius: 8 }}
                />
                <Button size="small" variant="contained" component="label" sx={{ mt: 1 }}>
                  Change
                  <input type="file" hidden accept="image/*" onChange={handleCoverSelect} />
                </Button>
              </Box>
            ) : (
              <Button
                variant="outlined"
                component="label"
                startIcon={<CloudUpload />}
                sx={{ height: 120, width: '100%' }}
              >
                Upload Cover Image
                <input type="file" hidden accept="image/*" onChange={handleCoverSelect} />
              </Button>
            )}
          </Box>
        </Box>

        <TextField
          label="Group Name"
          fullWidth
          value={name}
          onChange={(e) => setName(e.target.value)}
          margin="normal"
          required
          placeholder="e.g., Physics Class 12 Study Group"
        />

        <TextField
          label="Description"
          fullWidth
          multiline
          rows={4}
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          margin="normal"
          placeholder="Describe the purpose of this study group..."
        />

        <Box display="flex" gap={2} mt={2}>
          <FormControl fullWidth>
            <InputLabel>Subject (Optional)</InputLabel>
            <Select value={subjectId} onChange={(e) => setSubjectId(e.target.value as number)}>
              <MenuItem value="">
                <em>None</em>
              </MenuItem>
              {subjects.map((subject) => (
                <MenuItem key={subject.id} value={subject.id}>
                  {subject.name}
                </MenuItem>
              ))}
            </Select>
          </FormControl>

          <FormControl fullWidth disabled={!subjectId}>
            <InputLabel>Chapter (Optional)</InputLabel>
            <Select value={chapterId} onChange={(e) => setChapterId(e.target.value as number)}>
              <MenuItem value="">
                <em>None</em>
              </MenuItem>
              {chapters.map((chapter) => (
                <MenuItem key={chapter.id} value={chapter.id}>
                  {chapter.name}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
        </Box>

        <TextField
          label="Maximum Members (Optional)"
          type="number"
          fullWidth
          value={maxMembers}
          onChange={(e) => setMaxMembers(e.target.value ? Number(e.target.value) : '')}
          margin="normal"
          placeholder="Leave empty for unlimited"
          inputProps={{ min: 2 }}
        />

        <FormControlLabel
          control={<Checkbox checked={isPublic} onChange={(e) => setIsPublic(e.target.checked)} />}
          label="Public Group (Anyone can join)"
          sx={{ mt: 2 }}
        />
      </DialogContent>

      <DialogActions>
        <Button onClick={handleClose}>Cancel</Button>
        <Button onClick={handleSubmit} variant="contained" disabled={loading}>
          {loading ? 'Creating...' : 'Create Group'}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default GroupCreationForm;
