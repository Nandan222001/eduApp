import { useState, useCallback } from 'react';
import {
  Box,
  Typography,
  Container,
  Grid,
  Paper,
  Button,
  Card,
  CardContent,
  CardMedia,
  TextField,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  Chip,
  Stack,
  IconButton,
  LinearProgress,
  Alert,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  useTheme,
  alpha,
} from '@mui/material';
import {
  CloudUpload as UploadIcon,
  Delete as DeleteIcon,
  CheckCircle as CheckIcon,
  Cancel as CancelIcon,
  Pending as PendingIcon,
  Image as ImageIcon,
  Close as CloseIcon,
} from '@mui/icons-material';
import { PhotoSubmission } from '@/types/yearbook';

const mockSubmissions: PhotoSubmission[] = [
  {
    id: 1,
    studentId: 1,
    studentName: 'John Doe',
    photoUrl: 'https://via.placeholder.com/400x400/1976d2/ffffff?text=Photo+1',
    caption: 'Senior Class 2024 - Best year ever!',
    category: 'class',
    uploadDate: '2024-03-15',
    status: 'approved',
    tags: ['senior', 'class'],
    event: 'Senior Photos',
  },
  {
    id: 2,
    studentId: 1,
    studentName: 'John Doe',
    photoUrl: 'https://via.placeholder.com/400x400/2e7d32/ffffff?text=Photo+2',
    caption: 'Basketball Championship Victory',
    category: 'sports',
    uploadDate: '2024-03-10',
    status: 'pending',
    tags: ['basketball', 'championship'],
    event: 'State Finals',
  },
];

export default function YearbookPhotoSubmission() {
  const theme = useTheme();
  const [submissions, setSubmissions] = useState<PhotoSubmission[]>(mockSubmissions);
  const [uploadDialogOpen, setUploadDialogOpen] = useState(false);
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [formData, setFormData] = useState({
    caption: '',
    category: 'class' as PhotoSubmission['category'],
    tags: '',
    event: '',
  });
  const [previewUrls, setPreviewUrls] = useState<string[]>([]);

  const handleFileSelect = useCallback((event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (!files) return;

    const fileArray = Array.from(files);
    setSelectedFiles(fileArray);

    const urls = fileArray.map((f) => URL.createObjectURL(f));
    setPreviewUrls(urls);
  }, []);

  const handleDrop = useCallback((event: React.DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    const files = event.dataTransfer.files;
    if (!files) return;

    const fileArray = Array.from(files).filter((file) => file.type.startsWith('image/'));
    setSelectedFiles(fileArray);

    const urls = fileArray.map((file) => URL.createObjectURL(file));
    setPreviewUrls(urls);
  }, []);

  const handleDragOver = (event: React.DragEvent<HTMLDivElement>) => {
    event.preventDefault();
  };

  const handleSubmit = async () => {
    setUploadProgress(0);

    const interval = setInterval(() => {
      setUploadProgress((prev) => {
        if (prev >= 100) {
          clearInterval(interval);
          return 100;
        }
        return prev + 10;
      });
    }, 200);

    setTimeout(() => {
      const newSubmissions = selectedFiles.map((_file, index) => ({
        id: submissions.length + index + 1,
        studentId: 1,
        studentName: 'Current User',
        photoUrl: previewUrls[index],
        caption: formData.caption,
        category: formData.category,
        uploadDate: new Date().toISOString().split('T')[0],
        status: 'pending' as const,
        tags: formData.tags.split(',').map((t) => t.trim()),
        event: formData.event,
      }));

      setSubmissions([...newSubmissions, ...submissions]);
      setUploadDialogOpen(false);
      resetForm();
    }, 2000);
  };

  const resetForm = () => {
    setSelectedFiles([]);
    setPreviewUrls([]);
    setFormData({
      caption: '',
      category: 'class',
      tags: '',
      event: '',
    });
    setUploadProgress(0);
  };

  const removeFile = (index: number) => {
    setSelectedFiles(selectedFiles.filter((_, i) => i !== index));
    setPreviewUrls(previewUrls.filter((_, i) => i !== index));
  };

  const getStatusIcon = (status: PhotoSubmission['status']) => {
    switch (status) {
      case 'approved':
        return <CheckIcon color="success" />;
      case 'rejected':
        return <CancelIcon color="error" />;
      default:
        return <PendingIcon color="warning" />;
    }
  };

  const getStatusColor = (status: PhotoSubmission['status']) => {
    switch (status) {
      case 'approved':
        return 'success';
      case 'rejected':
        return 'error';
      default:
        return 'warning';
    }
  };

  const pendingCount = submissions.filter((s) => s.status === 'pending').length;
  const approvedCount = submissions.filter((s) => s.status === 'approved').length;
  const rejectedCount = submissions.filter((s) => s.status === 'rejected').length;

  return (
    <Container maxWidth="xl" sx={{ py: 4 }}>
      <Box sx={{ mb: 4, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <Box>
          <Typography variant="h4" gutterBottom fontWeight={700}>
            Photo Submissions
          </Typography>
          <Typography variant="body1" color="text.secondary">
            Upload your favorite class photos and memories for the yearbook
          </Typography>
        </Box>
        <Button
          variant="contained"
          size="large"
          startIcon={<UploadIcon />}
          onClick={() => setUploadDialogOpen(true)}
        >
          Upload Photos
        </Button>
      </Box>

      <Grid container spacing={3} sx={{ mb: 4 }}>
        <Grid item xs={12} sm={4}>
          <Card elevation={0} sx={{ border: `1px solid ${theme.palette.divider}` }}>
            <CardContent>
              <Stack direction="row" spacing={2} alignItems="center">
                <Box
                  sx={{
                    width: 48,
                    height: 48,
                    borderRadius: 2,
                    bgcolor: alpha(theme.palette.warning.main, 0.1),
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                >
                  <PendingIcon sx={{ color: theme.palette.warning.main, fontSize: 28 }} />
                </Box>
                <Box>
                  <Typography variant="h4" fontWeight={700}>
                    {pendingCount}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Pending Review
                  </Typography>
                </Box>
              </Stack>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={4}>
          <Card elevation={0} sx={{ border: `1px solid ${theme.palette.divider}` }}>
            <CardContent>
              <Stack direction="row" spacing={2} alignItems="center">
                <Box
                  sx={{
                    width: 48,
                    height: 48,
                    borderRadius: 2,
                    bgcolor: alpha(theme.palette.success.main, 0.1),
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                >
                  <CheckIcon sx={{ color: theme.palette.success.main, fontSize: 28 }} />
                </Box>
                <Box>
                  <Typography variant="h4" fontWeight={700}>
                    {approvedCount}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Approved
                  </Typography>
                </Box>
              </Stack>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={4}>
          <Card elevation={0} sx={{ border: `1px solid ${theme.palette.divider}` }}>
            <CardContent>
              <Stack direction="row" spacing={2} alignItems="center">
                <Box
                  sx={{
                    width: 48,
                    height: 48,
                    borderRadius: 2,
                    bgcolor: alpha(theme.palette.error.main, 0.1),
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                >
                  <CancelIcon sx={{ color: theme.palette.error.main, fontSize: 28 }} />
                </Box>
                <Box>
                  <Typography variant="h4" fontWeight={700}>
                    {rejectedCount}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Rejected
                  </Typography>
                </Box>
              </Stack>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      <Alert severity="info" sx={{ mb: 3 }}>
        <Typography variant="body2">
          <strong>Guidelines:</strong> Submit high-quality photos (min 1920x1080px). All photos will
          be reviewed by the yearbook committee before publishing.
        </Typography>
      </Alert>

      <Grid container spacing={3}>
        {submissions.map((submission) => (
          <Grid item xs={12} sm={6} md={4} lg={3} key={submission.id}>
            <Card
              elevation={0}
              sx={{ border: `1px solid ${theme.palette.divider}`, height: '100%' }}
            >
              <CardMedia
                component="img"
                height="250"
                image={submission.photoUrl}
                alt={submission.caption}
              />
              <CardContent>
                <Box
                  sx={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'start',
                    mb: 1,
                  }}
                >
                  <Typography variant="body2" fontWeight={600} sx={{ flex: 1 }}>
                    {submission.caption}
                  </Typography>
                  <Chip
                    icon={getStatusIcon(submission.status)}
                    label={submission.status}
                    size="small"
                    color={getStatusColor(submission.status)}
                  />
                </Box>

                <Typography variant="caption" color="text.secondary" display="block" gutterBottom>
                  {submission.event && `${submission.event} • `}
                  {new Date(submission.uploadDate).toLocaleDateString()}
                </Typography>

                <Box sx={{ display: 'flex', gap: 0.5, flexWrap: 'wrap', mt: 1 }}>
                  <Chip label={submission.category} size="small" variant="outlined" />
                  {submission.tags.slice(0, 2).map((tag) => (
                    <Chip key={tag} label={tag} size="small" variant="outlined" />
                  ))}
                </Box>
              </CardContent>
            </Card>
          </Grid>
        ))}
      </Grid>

      {submissions.length === 0 && (
        <Paper
          elevation={0}
          sx={{
            border: `1px solid ${theme.palette.divider}`,
            p: 8,
            textAlign: 'center',
          }}
        >
          <ImageIcon sx={{ fontSize: 64, color: 'text.secondary', mb: 2 }} />
          <Typography variant="h6" gutterBottom>
            No photos submitted yet
          </Typography>
          <Typography variant="body2" color="text.secondary" paragraph>
            Start uploading your favorite memories for the yearbook!
          </Typography>
          <Button
            variant="contained"
            startIcon={<UploadIcon />}
            onClick={() => setUploadDialogOpen(true)}
          >
            Upload Your First Photo
          </Button>
        </Paper>
      )}

      <Dialog
        open={uploadDialogOpen}
        onClose={() => setUploadDialogOpen(false)}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle>
          Upload Photos
          <IconButton
            onClick={() => setUploadDialogOpen(false)}
            sx={{ position: 'absolute', right: 8, top: 8 }}
          >
            <CloseIcon />
          </IconButton>
        </DialogTitle>
        <DialogContent>
          <Stack spacing={3}>
            <Paper
              elevation={0}
              onDrop={handleDrop}
              onDragOver={handleDragOver}
              sx={{
                border: `2px dashed ${theme.palette.divider}`,
                borderRadius: 2,
                p: 4,
                textAlign: 'center',
                cursor: 'pointer',
                bgcolor: alpha(theme.palette.primary.main, 0.02),
                '&:hover': {
                  bgcolor: alpha(theme.palette.primary.main, 0.05),
                  borderColor: theme.palette.primary.main,
                },
              }}
            >
              <input
                type="file"
                accept="image/*"
                multiple
                onChange={handleFileSelect}
                style={{ display: 'none' }}
                id="file-upload"
              />
              <label htmlFor="file-upload">
                <UploadIcon sx={{ fontSize: 48, color: 'text.secondary', mb: 2 }} />
                <Typography variant="h6" gutterBottom>
                  Drop photos here or click to browse
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Supports: JPG, PNG, GIF (max 10MB per file)
                </Typography>
              </label>
            </Paper>

            {previewUrls.length > 0 && (
              <Box>
                <Typography variant="subtitle2" gutterBottom>
                  Selected Photos ({selectedFiles.length})
                </Typography>
                <Grid container spacing={2}>
                  {previewUrls.map((url, index) => (
                    <Grid item xs={4} key={index}>
                      <Box sx={{ position: 'relative' }}>
                        <Box
                          component="img"
                          src={url}
                          alt={`Preview ${index + 1}`}
                          sx={{
                            width: '100%',
                            height: 150,
                            objectFit: 'cover',
                            borderRadius: 1,
                          }}
                        />
                        <IconButton
                          size="small"
                          onClick={() => removeFile(index)}
                          sx={{
                            position: 'absolute',
                            top: 4,
                            right: 4,
                            bgcolor: 'background.paper',
                            '&:hover': { bgcolor: 'background.paper' },
                          }}
                        >
                          <DeleteIcon fontSize="small" />
                        </IconButton>
                      </Box>
                    </Grid>
                  ))}
                </Grid>
              </Box>
            )}

            <TextField
              label="Caption"
              multiline
              rows={2}
              value={formData.caption}
              onChange={(e) => setFormData({ ...formData, caption: e.target.value })}
              placeholder="Describe your photo..."
              fullWidth
            />

            <FormControl fullWidth>
              <InputLabel>Category</InputLabel>
              <Select
                value={formData.category}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    category: e.target.value as PhotoSubmission['category'],
                  })
                }
                label="Category"
              >
                <MenuItem value="class">Class Photos</MenuItem>
                <MenuItem value="clubs">Clubs & Activities</MenuItem>
                <MenuItem value="sports">Sports</MenuItem>
                <MenuItem value="events">School Events</MenuItem>
                <MenuItem value="candid">Candid Moments</MenuItem>
                <MenuItem value="senior">Senior Photos</MenuItem>
              </Select>
            </FormControl>

            <TextField
              label="Event Name (Optional)"
              value={formData.event}
              onChange={(e) => setFormData({ ...formData, event: e.target.value })}
              placeholder="e.g., Homecoming 2024"
              fullWidth
            />

            <TextField
              label="Tags"
              value={formData.tags}
              onChange={(e) => setFormData({ ...formData, tags: e.target.value })}
              placeholder="Add tags separated by commas (e.g., graduation, friends, sports)"
              fullWidth
              helperText="Tags help organize photos in the yearbook"
            />

            {uploadProgress > 0 && (
              <Box>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                  <Typography variant="body2">Uploading...</Typography>
                  <Typography variant="body2">{uploadProgress}%</Typography>
                </Box>
                <LinearProgress variant="determinate" value={uploadProgress} />
              </Box>
            )}
          </Stack>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setUploadDialogOpen(false)}>Cancel</Button>
          <Button
            variant="contained"
            onClick={handleSubmit}
            disabled={selectedFiles.length === 0 || !formData.caption}
            startIcon={<UploadIcon />}
          >
            Submit Photos
          </Button>
        </DialogActions>
      </Dialog>
    </Container>
  );
}
