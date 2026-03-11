import React, { useState, useCallback } from 'react';
import {
  Box,
  Button,
  TextField,
  FormControl,
  FormControlLabel,
  InputLabel,
  Select,
  MenuItem,
  Switch,
  Grid,
  Paper,
  Typography,
  Chip,
} from '@mui/material';
import { DateTimePicker } from '@mui/x-date-pickers/DateTimePicker';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
import CloudUploadIcon from '@mui/icons-material/CloudUpload';
import AttachFileIcon from '@mui/icons-material/AttachFile';
import { Assignment, AssignmentCreateInput, AssignmentStatus } from '../../types/assignment';

interface AssignmentFormProps {
  assignment?: Assignment;
  onSubmit: (data: AssignmentCreateInput, files: File[]) => void;
  onCancel: () => void;
  loading?: boolean;
}

export const AssignmentForm: React.FC<AssignmentFormProps> = ({
  assignment,
  onSubmit,
  onCancel,
  loading = false,
}) => {
  const [formData, setFormData] = useState<AssignmentCreateInput>({
    institution_id: assignment?.institution_id || 1,
    teacher_id: assignment?.teacher_id || 1,
    grade_id: assignment?.grade_id || 1,
    section_id: assignment?.section_id,
    subject_id: assignment?.subject_id || 1,
    chapter_id: assignment?.chapter_id,
    title: assignment?.title || '',
    description: assignment?.description || '',
    content: assignment?.content || '',
    instructions: assignment?.instructions || '',
    due_date: assignment?.due_date,
    publish_date: assignment?.publish_date,
    close_date: assignment?.close_date,
    max_marks: assignment?.max_marks || 100,
    passing_marks: assignment?.passing_marks,
    allow_late_submission: assignment?.allow_late_submission || false,
    late_penalty_percentage: assignment?.late_penalty_percentage,
    max_file_size_mb: assignment?.max_file_size_mb || 10,
    allowed_file_types: assignment?.allowed_file_types || '',
    status: assignment?.status || AssignmentStatus.DRAFT,
  });

  const [files, setFiles] = useState<File[]>([]);
  const [dragActive, setDragActive] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const handleChange = (
    field: keyof AssignmentCreateInput,
    value: string | number | boolean | undefined
  ) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    if (errors[field]) {
      setErrors((prev) => {
        const newErrors = { ...prev };
        delete newErrors[field];
        return newErrors;
      });
    }
  };

  const handleDrag = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true);
    } else if (e.type === 'dragleave') {
      setDragActive(false);
    }
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);

    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      const newFiles = Array.from(e.dataTransfer.files);
      setFiles((prev) => [...prev, ...newFiles]);
    }
  }, []);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const newFiles = Array.from(e.target.files);
      setFiles((prev) => [...prev, ...newFiles]);
    }
  };

  const removeFile = (index: number) => {
    setFiles((prev) => prev.filter((_, i) => i !== index));
  };

  const validate = () => {
    const newErrors: Record<string, string> = {};

    if (!formData.title.trim()) {
      newErrors.title = 'Title is required';
    }

    if (formData.max_marks <= 0) {
      newErrors.max_marks = 'Max marks must be greater than 0';
    }

    if (formData.passing_marks && formData.passing_marks > formData.max_marks) {
      newErrors.passing_marks = 'Passing marks cannot exceed max marks';
    }

    if (
      formData.due_date &&
      formData.publish_date &&
      new Date(formData.due_date) <= new Date(formData.publish_date)
    ) {
      newErrors.due_date = 'Due date must be after publish date';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (validate()) {
      onSubmit(formData, files);
    }
  };

  return (
    <LocalizationProvider dateAdapter={AdapterDateFns}>
      <Box component="form" onSubmit={handleSubmit}>
        <Grid container spacing={3}>
          <Grid item xs={12}>
            <TextField
              fullWidth
              label="Assignment Title"
              value={formData.title}
              onChange={(e) => handleChange('title', e.target.value)}
              error={!!errors.title}
              helperText={errors.title}
              required
            />
          </Grid>

          <Grid item xs={12}>
            <TextField
              fullWidth
              label="Description"
              value={formData.description}
              onChange={(e) => handleChange('description', e.target.value)}
              multiline
              rows={3}
            />
          </Grid>

          <Grid item xs={12}>
            <Paper variant="outlined" sx={{ p: 2, minHeight: 300, bgcolor: 'background.default' }}>
              <Typography variant="subtitle2" gutterBottom>
                Content (Rich Text)
              </Typography>
              <TextField
                fullWidth
                value={formData.content}
                onChange={(e) => handleChange('content', e.target.value)}
                multiline
                rows={10}
                placeholder="Enter assignment content here..."
              />
            </Paper>
          </Grid>

          <Grid item xs={12}>
            <TextField
              fullWidth
              label="Instructions"
              value={formData.instructions}
              onChange={(e) => handleChange('instructions', e.target.value)}
              multiline
              rows={3}
            />
          </Grid>

          <Grid item xs={12} md={4}>
            <DateTimePicker
              label="Publish Date"
              value={formData.publish_date ? new Date(formData.publish_date) : null}
              onChange={(date) => handleChange('publish_date', date?.toISOString())}
              slotProps={{
                textField: { fullWidth: true },
              }}
            />
          </Grid>

          <Grid item xs={12} md={4}>
            <DateTimePicker
              label="Due Date"
              value={formData.due_date ? new Date(formData.due_date) : null}
              onChange={(date) => handleChange('due_date', date?.toISOString())}
              slotProps={{
                textField: {
                  fullWidth: true,
                  error: !!errors.due_date,
                  helperText: errors.due_date,
                },
              }}
            />
          </Grid>

          <Grid item xs={12} md={4}>
            <DateTimePicker
              label="Close Date"
              value={formData.close_date ? new Date(formData.close_date) : null}
              onChange={(date) => handleChange('close_date', date?.toISOString())}
              slotProps={{
                textField: { fullWidth: true },
              }}
            />
          </Grid>

          <Grid item xs={12} md={6}>
            <TextField
              fullWidth
              type="number"
              label="Max Marks"
              value={formData.max_marks}
              onChange={(e) => handleChange('max_marks', Number(e.target.value))}
              error={!!errors.max_marks}
              helperText={errors.max_marks}
              required
            />
          </Grid>

          <Grid item xs={12} md={6}>
            <TextField
              fullWidth
              type="number"
              label="Passing Marks"
              value={formData.passing_marks || ''}
              onChange={(e) =>
                handleChange('passing_marks', e.target.value ? Number(e.target.value) : undefined)
              }
              error={!!errors.passing_marks}
              helperText={errors.passing_marks}
            />
          </Grid>

          <Grid item xs={12}>
            <FormControlLabel
              control={
                <Switch
                  checked={formData.allow_late_submission}
                  onChange={(e) => handleChange('allow_late_submission', e.target.checked)}
                />
              }
              label="Allow Late Submission"
            />
          </Grid>

          {formData.allow_late_submission && (
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                type="number"
                label="Late Penalty Percentage"
                value={formData.late_penalty_percentage || ''}
                onChange={(e) =>
                  handleChange(
                    'late_penalty_percentage',
                    e.target.value ? Number(e.target.value) : undefined
                  )
                }
                inputProps={{ min: 0, max: 100 }}
              />
            </Grid>
          )}

          <Grid item xs={12} md={6}>
            <TextField
              fullWidth
              type="number"
              label="Max File Size (MB)"
              value={formData.max_file_size_mb}
              onChange={(e) => handleChange('max_file_size_mb', Number(e.target.value))}
              inputProps={{ min: 1, max: 100 }}
            />
          </Grid>

          <Grid item xs={12} md={6}>
            <TextField
              fullWidth
              label="Allowed File Types"
              value={formData.allowed_file_types}
              onChange={(e) => handleChange('allowed_file_types', e.target.value)}
              placeholder="e.g., .pdf,.doc,.docx"
            />
          </Grid>

          <Grid item xs={12} md={6}>
            <FormControl fullWidth>
              <InputLabel>Status</InputLabel>
              <Select
                value={formData.status}
                onChange={(e) => handleChange('status', e.target.value as AssignmentStatus)}
                label="Status"
              >
                <MenuItem value={AssignmentStatus.DRAFT}>Draft</MenuItem>
                <MenuItem value={AssignmentStatus.PUBLISHED}>Published</MenuItem>
                <MenuItem value={AssignmentStatus.CLOSED}>Closed</MenuItem>
                <MenuItem value={AssignmentStatus.ARCHIVED}>Archived</MenuItem>
              </Select>
            </FormControl>
          </Grid>

          <Grid item xs={12}>
            <Paper
              variant="outlined"
              sx={{
                p: 3,
                border: dragActive ? '2px dashed #1976d2' : '2px dashed #ccc',
                bgcolor: dragActive ? 'action.hover' : 'background.paper',
                textAlign: 'center',
                cursor: 'pointer',
              }}
              onDragEnter={handleDrag}
              onDragLeave={handleDrag}
              onDragOver={handleDrag}
              onDrop={handleDrop}
            >
              <input
                type="file"
                multiple
                onChange={handleFileChange}
                style={{ display: 'none' }}
                id="file-upload"
              />
              <label htmlFor="file-upload">
                <Box sx={{ cursor: 'pointer' }}>
                  <CloudUploadIcon sx={{ fontSize: 48, color: 'primary.main', mb: 2 }} />
                  <Typography variant="h6" gutterBottom>
                    Drag and drop files here
                  </Typography>
                  <Typography variant="body2" color="textSecondary">
                    or click to select files
                  </Typography>
                </Box>
              </label>
            </Paper>

            {files.length > 0 && (
              <Box sx={{ mt: 2 }}>
                <Typography variant="subtitle2" gutterBottom>
                  Selected Files:
                </Typography>
                {files.map((file, index) => (
                  <Chip
                    key={index}
                    icon={<AttachFileIcon />}
                    label={`${file.name} (${(file.size / 1024).toFixed(2)} KB)`}
                    onDelete={() => removeFile(index)}
                    sx={{ m: 0.5 }}
                  />
                ))}
              </Box>
            )}
          </Grid>

          <Grid item xs={12}>
            <Box sx={{ display: 'flex', gap: 2, justifyContent: 'flex-end' }}>
              <Button onClick={onCancel} disabled={loading}>
                Cancel
              </Button>
              <Button type="submit" variant="contained" disabled={loading}>
                {assignment ? 'Update Assignment' : 'Create Assignment'}
              </Button>
            </Box>
          </Grid>
        </Grid>
      </Box>
    </LocalizationProvider>
  );
};
