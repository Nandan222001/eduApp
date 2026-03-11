import React, { useState } from 'react';
import {
  Box,
  Paper,
  Typography,
  TextField,
  Button,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  Grid,
  Alert,
  CircularProgress,
} from '@mui/material';
import { Upload as UploadIcon, Save as SaveIcon } from '@mui/icons-material';
import { previousYearPapersAPI } from '@/api/previousYearPapers';
import { Board, PreviousYearPaperCreate } from '@/types/previousYearPapers';

const PaperUploadPage: React.FC = () => {
  const [formData, setFormData] = useState<PreviousYearPaperCreate>({
    institution_id: 1,
    title: '',
    description: '',
    board: Board.CBSE,
    year: new Date().getFullYear(),
    exam_month: '',
    grade_id: 0,
    subject_id: 0,
    total_marks: 0,
    duration_minutes: 0,
    tags: '',
  });

  const [pdfFile, setPdfFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const handleInputChange = (
    field: keyof PreviousYearPaperCreate,
    value: string | number | Board
  ) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file && file.type === 'application/pdf') {
      setPdfFile(file);
      setError(null);
    } else {
      setError('Please select a valid PDF file');
      setPdfFile(null);
    }
  };

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setLoading(true);
    setError(null);
    setSuccess(null);

    try {
      const paper = await previousYearPapersAPI.createPaper(formData);

      if (pdfFile) {
        await previousYearPapersAPI.uploadPDF(paper.id, pdfFile);
      }

      setSuccess('Paper uploaded successfully!');
      setFormData({
        institution_id: 1,
        title: '',
        description: '',
        board: Board.CBSE,
        year: new Date().getFullYear(),
        exam_month: '',
        grade_id: 0,
        subject_id: 0,
        total_marks: 0,
        duration_minutes: 0,
        tags: '',
      });
      setPdfFile(null);
    } catch (err) {
      setError(
        (err as { response?: { data?: { detail?: string } } }).response?.data?.detail ||
          'Failed to upload paper'
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <Box sx={{ p: 3 }}>
      <Typography variant="h4" gutterBottom>
        Upload Previous Year Paper
      </Typography>

      <Paper sx={{ p: 3, mt: 3 }}>
        <form onSubmit={handleSubmit}>
          <Grid container spacing={3}>
            <Grid item xs={12}>
              <TextField
                fullWidth
                required
                label="Paper Title"
                value={formData.title}
                onChange={(e) => handleInputChange('title', e.target.value)}
              />
            </Grid>

            <Grid item xs={12}>
              <TextField
                fullWidth
                multiline
                rows={3}
                label="Description"
                value={formData.description}
                onChange={(e) => handleInputChange('description', e.target.value)}
              />
            </Grid>

            <Grid item xs={12} md={6}>
              <FormControl fullWidth required>
                <InputLabel>Board</InputLabel>
                <Select
                  value={formData.board}
                  onChange={(e) => handleInputChange('board', e.target.value)}
                  label="Board"
                >
                  <MenuItem value={Board.CBSE}>CBSE</MenuItem>
                  <MenuItem value={Board.ICSE}>ICSE</MenuItem>
                  <MenuItem value={Board.STATE_BOARD}>State Board</MenuItem>
                  <MenuItem value={Board.IB}>IB</MenuItem>
                  <MenuItem value={Board.CAMBRIDGE}>Cambridge</MenuItem>
                  <MenuItem value={Board.OTHER}>Other</MenuItem>
                </Select>
              </FormControl>
            </Grid>

            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                required
                type="number"
                label="Year"
                value={formData.year}
                onChange={(e) => handleInputChange('year', parseInt(e.target.value))}
                inputProps={{ min: 1900, max: 2100 }}
              />
            </Grid>

            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label="Exam Month"
                value={formData.exam_month}
                onChange={(e) => handleInputChange('exam_month', e.target.value)}
                placeholder="e.g., March, October"
              />
            </Grid>

            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                required
                type="number"
                label="Grade ID"
                value={formData.grade_id || ''}
                onChange={(e) => handleInputChange('grade_id', parseInt(e.target.value))}
              />
            </Grid>

            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                required
                type="number"
                label="Subject ID"
                value={formData.subject_id || ''}
                onChange={(e) => handleInputChange('subject_id', parseInt(e.target.value))}
              />
            </Grid>

            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                type="number"
                label="Total Marks"
                value={formData.total_marks || ''}
                onChange={(e) => handleInputChange('total_marks', parseInt(e.target.value))}
              />
            </Grid>

            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                type="number"
                label="Duration (Minutes)"
                value={formData.duration_minutes || ''}
                onChange={(e) => handleInputChange('duration_minutes', parseInt(e.target.value))}
              />
            </Grid>

            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Tags (comma separated)"
                value={formData.tags}
                onChange={(e) => handleInputChange('tags', e.target.value)}
                placeholder="e.g., algebra, geometry, calculus"
              />
            </Grid>

            <Grid item xs={12}>
              <Button variant="outlined" component="label" startIcon={<UploadIcon />} fullWidth>
                {pdfFile ? pdfFile.name : 'Upload PDF File'}
                <input type="file" hidden accept="application/pdf" onChange={handleFileChange} />
              </Button>
            </Grid>

            {error && (
              <Grid item xs={12}>
                <Alert severity="error">{error}</Alert>
              </Grid>
            )}

            {success && (
              <Grid item xs={12}>
                <Alert severity="success">{success}</Alert>
              </Grid>
            )}

            <Grid item xs={12}>
              <Button
                type="submit"
                variant="contained"
                color="primary"
                size="large"
                fullWidth
                disabled={loading}
                startIcon={loading ? <CircularProgress size={20} /> : <SaveIcon />}
              >
                {loading ? 'Uploading...' : 'Upload Paper'}
              </Button>
            </Grid>
          </Grid>
        </form>
      </Paper>
    </Box>
  );
};

export default PaperUploadPage;
