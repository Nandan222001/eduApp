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
  Chip,
  Autocomplete,
  FormControlLabel,
  Checkbox,
  IconButton,
  Grid,
  Typography,
  Alert,
} from '@mui/material';
import { Close, Image as ImageIcon, Delete } from '@mui/icons-material';
import axios from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000';

interface DoubtComposerProps {
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

const DoubtComposer: React.FC<DoubtComposerProps> = ({ open, onClose, onSuccess }) => {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [subjectId, setSubjectId] = useState<number | ''>('');
  const [chapterId, setChapterId] = useState<number | ''>('');
  const [topic, setTopic] = useState('');
  const [tags, setTags] = useState<string[]>([]);
  const [isAnonymous, setIsAnonymous] = useState(false);
  const [images, setImages] = useState<File[]>([]);
  const [imagePreviews, setImagePreviews] = useState<string[]>([]);
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

  const handleImageSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(event.target.files || []);
    if (files.length + images.length > 5) {
      setError('Maximum 5 images allowed');
      return;
    }

    setImages([...images, ...files]);
    const newPreviews = files.map((file) => URL.createObjectURL(file));
    setImagePreviews([...imagePreviews, ...newPreviews]);
  };

  const handleRemoveImage = (index: number) => {
    const newImages = [...images];
    const newPreviews = [...imagePreviews];
    newImages.splice(index, 1);
    newPreviews.splice(index, 1);
    setImages(newImages);
    setImagePreviews(newPreviews);
  };

  const handleSubmit = async () => {
    if (!title.trim() || !description.trim()) {
      setError('Title and description are required');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const formData = new FormData();
      formData.append('title', title);
      formData.append('description', description);
      if (subjectId) formData.append('subject_id', String(subjectId));
      if (chapterId) formData.append('chapter_id', String(chapterId));
      if (topic) formData.append('topic_id', topic);
      if (tags.length > 0) formData.append('tags', JSON.stringify(tags));
      formData.append('is_anonymous', String(isAnonymous));

      images.forEach((image) => {
        formData.append('images', image);
      });

      await axios.post(`${API_BASE_URL}/api/v1/doubts`, formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });

      handleClose();
      onSuccess();
    } catch (err) {
      const error = err as { response?: { data?: { detail?: string } } };
      setError(error.response?.data?.detail || 'Failed to post doubt');
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    setTitle('');
    setDescription('');
    setSubjectId('');
    setChapterId('');
    setTopic('');
    setTags([]);
    setIsAnonymous(false);
    setImages([]);
    setImagePreviews([]);
    setError('');
    onClose();
  };

  return (
    <Dialog open={open} onClose={handleClose} maxWidth="md" fullWidth>
      <DialogTitle>
        <Box display="flex" justifyContent="space-between" alignItems="center">
          <Typography variant="h6">Post a Doubt</Typography>
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

        <TextField
          label="Title"
          fullWidth
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          margin="normal"
          required
          placeholder="Briefly describe your doubt..."
        />

        <TextField
          label="Description"
          fullWidth
          multiline
          rows={6}
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          margin="normal"
          required
          placeholder="Provide detailed description of your doubt..."
        />

        <Grid container spacing={2} sx={{ mt: 1 }}>
          <Grid item xs={12} sm={6}>
            <FormControl fullWidth>
              <InputLabel>Subject</InputLabel>
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
          </Grid>

          <Grid item xs={12} sm={6}>
            <FormControl fullWidth disabled={!subjectId}>
              <InputLabel>Chapter</InputLabel>
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
          </Grid>
        </Grid>

        <TextField
          label="Topic (Optional)"
          fullWidth
          value={topic}
          onChange={(e) => setTopic(e.target.value)}
          margin="normal"
          placeholder="Specific topic or concept..."
        />

        <Autocomplete
          multiple
          freeSolo
          options={[]}
          value={tags}
          onChange={(_, newValue) => setTags(newValue)}
          renderTags={(value, getTagProps) =>
            value.map((option, index) => (
              <Chip label={option} {...getTagProps({ index })} key={index} />
            ))
          }
          renderInput={(params) => (
            <TextField {...params} label="Tags" placeholder="Add tags..." margin="normal" />
          )}
        />

        <Box sx={{ mt: 2, mb: 1 }}>
          <Button variant="outlined" component="label" startIcon={<ImageIcon />}>
            Add Images (Max 5)
            <input type="file" hidden accept="image/*" multiple onChange={handleImageSelect} />
          </Button>
        </Box>

        {imagePreviews.length > 0 && (
          <Grid container spacing={1} sx={{ mt: 1 }}>
            {imagePreviews.map((preview, index) => (
              <Grid item xs={6} sm={4} md={3} key={index}>
                <Box sx={{ position: 'relative' }}>
                  <img
                    src={preview}
                    alt={`Preview ${index + 1}`}
                    style={{
                      width: '100%',
                      height: 100,
                      objectFit: 'cover',
                      borderRadius: 4,
                    }}
                  />
                  <IconButton
                    size="small"
                    sx={{
                      position: 'absolute',
                      top: 2,
                      right: 2,
                      bgcolor: 'background.paper',
                    }}
                    onClick={() => handleRemoveImage(index)}
                  >
                    <Delete fontSize="small" />
                  </IconButton>
                </Box>
              </Grid>
            ))}
          </Grid>
        )}

        <FormControlLabel
          control={
            <Checkbox checked={isAnonymous} onChange={(e) => setIsAnonymous(e.target.checked)} />
          }
          label="Post anonymously"
          sx={{ mt: 2 }}
        />
      </DialogContent>

      <DialogActions>
        <Button onClick={handleClose}>Cancel</Button>
        <Button onClick={handleSubmit} variant="contained" disabled={loading}>
          {loading ? 'Posting...' : 'Post Doubt'}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default DoubtComposer;
