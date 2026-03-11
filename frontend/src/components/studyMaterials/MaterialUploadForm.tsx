import React, { useState, useCallback } from 'react';
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
  Box,
  Typography,
  Chip,
  Alert,
  LinearProgress,
  Paper,
  IconButton,
  Autocomplete,
  FormControlLabel,
  Switch,
} from '@mui/material';
import { CloudUpload, Close, AttachFile } from '@mui/icons-material';
import { useDropzone } from 'react-dropzone';
import studyMaterialsApi from '../../api/studyMaterials';

interface MaterialUploadFormProps {
  open: boolean;
  onClose: () => void;
  onSuccess: () => void;
  subjects?: Array<{ id: number; name: string }>;
  chapters?: Array<{ id: number; name: string }>;
  topics?: Array<{ id: number; name: string }>;
  grades?: Array<{ id: number; name: string }>;
  availableTags?: string[];
}

const MaterialUploadForm: React.FC<MaterialUploadFormProps> = ({
  open,
  onClose,
  onSuccess,
  subjects = [],
  chapters = [],
  topics = [],
  grades = [],
  availableTags = [],
}) => {
  const [file, setFile] = useState<File | null>(null);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [subjectId, setSubjectId] = useState<number | null>(null);
  const [chapterId, setChapterId] = useState<number | null>(null);
  const [topicId, setTopicId] = useState<number | null>(null);
  const [gradeId, setGradeId] = useState<number | null>(null);
  const [tags, setTags] = useState<string[]>([]);
  const [isPublic, setIsPublic] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const onDrop = useCallback(
    (acceptedFiles: File[]) => {
      if (acceptedFiles.length > 0) {
        const selectedFile = acceptedFiles[0];
        setFile(selectedFile);
        if (!title) {
          setTitle(selectedFile.name.replace(/\.[^/.]+$/, ''));
        }
      }
    },
    [title]
  );

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    multiple: false,
    maxSize: 100 * 1024 * 1024,
  });

  const handleSubmit = async () => {
    if (!file) {
      setError('Please select a file to upload');
      return;
    }

    if (!title.trim()) {
      setError('Please provide a title');
      return;
    }

    setUploading(true);
    setError(null);

    try {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('title', title);

      if (description) formData.append('description', description);
      if (subjectId) formData.append('subject_id', String(subjectId));
      if (chapterId) formData.append('chapter_id', String(chapterId));
      if (topicId) formData.append('topic_id', String(topicId));
      if (gradeId) formData.append('grade_id', String(gradeId));
      if (tags.length > 0) formData.append('tags', JSON.stringify(tags));
      formData.append('is_public', String(isPublic));

      await studyMaterialsApi.uploadMaterial(formData);

      handleClose();
      onSuccess();
    } catch (err) {
      const error = err as { response?: { data?: { detail?: string } } };
      setError(error.response?.data?.detail || 'Failed to upload material');
    } finally {
      setUploading(false);
    }
  };

  const handleClose = () => {
    setFile(null);
    setTitle('');
    setDescription('');
    setSubjectId(null);
    setChapterId(null);
    setTopicId(null);
    setGradeId(null);
    setTags([]);
    setIsPublic(false);
    setError(null);
    onClose();
  };

  return (
    <Dialog open={open} onClose={handleClose} maxWidth="md" fullWidth>
      <DialogTitle>
        Upload Study Material
        <IconButton onClick={handleClose} sx={{ position: 'absolute', right: 8, top: 8 }}>
          <Close />
        </IconButton>
      </DialogTitle>

      <DialogContent dividers>
        {error && (
          <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError(null)}>
            {error}
          </Alert>
        )}

        <Paper
          {...getRootProps()}
          sx={{
            p: 3,
            mb: 3,
            border: '2px dashed',
            borderColor: isDragActive ? 'primary.main' : 'grey.300',
            bgcolor: isDragActive ? 'action.hover' : 'background.paper',
            cursor: 'pointer',
            textAlign: 'center',
          }}
        >
          <input {...getInputProps()} />
          <CloudUpload sx={{ fontSize: 48, color: 'text.secondary', mb: 1 }} />
          <Typography variant="h6" gutterBottom>
            {file ? file.name : 'Drag & drop file here'}
          </Typography>
          <Typography variant="body2" color="text.secondary">
            or click to browse
          </Typography>
          {file && (
            <Box sx={{ mt: 2 }}>
              <Chip
                icon={<AttachFile />}
                label={`${(file.size / (1024 * 1024)).toFixed(2)} MB`}
                onDelete={() => setFile(null)}
              />
            </Box>
          )}
        </Paper>

        <TextField
          fullWidth
          label="Title"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          required
          sx={{ mb: 2 }}
        />

        <TextField
          fullWidth
          label="Description"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          multiline
          rows={3}
          sx={{ mb: 2 }}
        />

        <FormControl fullWidth sx={{ mb: 2 }}>
          <InputLabel>Grade</InputLabel>
          <Select
            value={gradeId || ''}
            onChange={(e) => setGradeId(e.target.value as number)}
            label="Grade"
          >
            <MenuItem value="">
              <em>None</em>
            </MenuItem>
            {grades.map((grade) => (
              <MenuItem key={grade.id} value={grade.id}>
                {grade.name}
              </MenuItem>
            ))}
          </Select>
        </FormControl>

        <FormControl fullWidth sx={{ mb: 2 }}>
          <InputLabel>Subject</InputLabel>
          <Select
            value={subjectId || ''}
            onChange={(e) => setSubjectId(e.target.value as number)}
            label="Subject"
          >
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

        <FormControl fullWidth sx={{ mb: 2 }}>
          <InputLabel>Chapter</InputLabel>
          <Select
            value={chapterId || ''}
            onChange={(e) => setChapterId(e.target.value as number)}
            label="Chapter"
            disabled={!subjectId}
          >
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

        <FormControl fullWidth sx={{ mb: 2 }}>
          <InputLabel>Topic</InputLabel>
          <Select
            value={topicId || ''}
            onChange={(e) => setTopicId(e.target.value as number)}
            label="Topic"
            disabled={!chapterId}
          >
            <MenuItem value="">
              <em>None</em>
            </MenuItem>
            {topics.map((topic) => (
              <MenuItem key={topic.id} value={topic.id}>
                {topic.name}
              </MenuItem>
            ))}
          </Select>
        </FormControl>

        <Autocomplete
          multiple
          freeSolo
          options={availableTags}
          value={tags}
          onChange={(_, newValue) => setTags(newValue)}
          renderInput={(params) => <TextField {...params} label="Tags" placeholder="Add tags" />}
          sx={{ mb: 2 }}
        />

        <FormControlLabel
          control={<Switch checked={isPublic} onChange={(e) => setIsPublic(e.target.checked)} />}
          label="Make this material public"
        />

        {uploading && <LinearProgress sx={{ mt: 2 }} />}
      </DialogContent>

      <DialogActions>
        <Button onClick={handleClose} disabled={uploading}>
          Cancel
        </Button>
        <Button
          onClick={handleSubmit}
          variant="contained"
          disabled={uploading || !file}
          startIcon={<CloudUpload />}
        >
          {uploading ? 'Uploading...' : 'Upload'}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default MaterialUploadForm;
