import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import {
  Box,
  Paper,
  Typography,
  Grid,
  Chip,
  Button,
  IconButton,
  Divider,
  CircularProgress,
  Alert,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
} from '@mui/material';
import {
  Download as DownloadIcon,
  Print as PrintIcon,
  ZoomIn as ZoomInIcon,
  ZoomOut as ZoomOutIcon,
  Tag as TagIcon,
} from '@mui/icons-material';
import { previousYearPapersAPI } from '@/api/previousYearPapers';
import { PreviousYearPaper } from '@/types/previousYearPapers';
import QuestionTaggingInterface from '@/components/papers/QuestionTaggingInterface';

const PaperViewerPage: React.FC = () => {
  const { paperId } = useParams<{ paperId: string }>();
  const [paper, setPaper] = useState<PreviousYearPaper | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [zoom, setZoom] = useState(100);
  const [showTaggingDialog, setShowTaggingDialog] = useState(false);

  useEffect(() => {
    loadPaper();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [paperId]);

  const loadPaper = async () => {
    if (!paperId) return;

    try {
      setLoading(true);
      const data = await previousYearPapersAPI.getPaperWithOCR(parseInt(paperId));
      setPaper(data);
      await previousYearPapersAPI.incrementViewCount(parseInt(paperId));
    } catch (err) {
      setError(
        (err as { response?: { data?: { detail?: string } } }).response?.data?.detail ||
          'Failed to load paper'
      );
    } finally {
      setLoading(false);
    }
  };

  const handleDownload = async () => {
    if (!paper || !paper.pdf_file_url) return;

    try {
      await previousYearPapersAPI.incrementDownloadCount(paper.id);
      window.open(paper.pdf_file_url, '_blank');
    } catch (err) {
      console.error('Failed to download paper:', err);
    }
  };

  const handlePrint = () => {
    if (!paper || !paper.pdf_file_url) return;
    window.print();
  };

  const handleZoomIn = () => {
    setZoom((prev) => Math.min(prev + 10, 200));
  };

  const handleZoomOut = () => {
    setZoom((prev) => Math.max(prev - 10, 50));
  };

  if (loading) {
    return (
      <Box
        sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '400px' }}
      >
        <CircularProgress />
      </Box>
    );
  }

  if (error || !paper) {
    return (
      <Box sx={{ p: 3 }}>
        <Alert severity="error">{error || 'Paper not found'}</Alert>
      </Box>
    );
  }

  return (
    <Box sx={{ p: 3 }}>
      <Paper sx={{ p: 3, mb: 3 }}>
        <Grid container spacing={2} alignItems="center">
          <Grid item xs={12} md={8}>
            <Typography variant="h4" gutterBottom>
              {paper.title}
            </Typography>
            <Typography variant="body1" color="text.secondary" paragraph>
              {paper.description}
            </Typography>
            <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap', mb: 2 }}>
              <Chip label={paper.board.toUpperCase()} color="primary" size="small" />
              <Chip label={`Year: ${paper.year}`} size="small" />
              {paper.exam_month && <Chip label={paper.exam_month} size="small" />}
              {paper.total_marks && <Chip label={`${paper.total_marks} Marks`} size="small" />}
              {paper.duration_minutes && (
                <Chip label={`${paper.duration_minutes} Minutes`} size="small" />
              )}
            </Box>
          </Grid>

          <Grid item xs={12} md={4} sx={{ textAlign: 'right' }}>
            <Box sx={{ display: 'flex', gap: 1, justifyContent: 'flex-end' }}>
              <IconButton onClick={handleZoomOut} title="Zoom Out">
                <ZoomOutIcon />
              </IconButton>
              <Typography sx={{ alignSelf: 'center', minWidth: '60px', textAlign: 'center' }}>
                {zoom}%
              </Typography>
              <IconButton onClick={handleZoomIn} title="Zoom In">
                <ZoomInIcon />
              </IconButton>
              <Button
                variant="outlined"
                startIcon={<TagIcon />}
                onClick={() => setShowTaggingDialog(true)}
              >
                Tag Questions
              </Button>
              <Button variant="outlined" startIcon={<DownloadIcon />} onClick={handleDownload}>
                Download
              </Button>
              <Button variant="outlined" startIcon={<PrintIcon />} onClick={handlePrint}>
                Print
              </Button>
            </Box>
          </Grid>
        </Grid>

        <Divider sx={{ my: 2 }} />

        <Box sx={{ display: 'flex', gap: 2 }}>
          <Typography variant="body2" color="text.secondary">
            Views: {paper.view_count}
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Downloads: {paper.download_count}
          </Typography>
        </Box>
      </Paper>

      {paper.pdf_file_url ? (
        <Paper sx={{ p: 2, minHeight: '600px' }}>
          <Box
            sx={{
              width: '100%',
              height: '800px',
              transform: `scale(${zoom / 100})`,
              transformOrigin: 'top center',
            }}
          >
            <iframe
              src={paper.pdf_file_url}
              style={{
                width: '100%',
                height: '100%',
                border: 'none',
              }}
              title={paper.title}
            />
          </Box>
        </Paper>
      ) : (
        <Alert severity="info">PDF file not available for this paper</Alert>
      )}

      <Dialog
        open={showTaggingDialog}
        onClose={() => setShowTaggingDialog(false)}
        maxWidth="lg"
        fullWidth
      >
        <DialogTitle>Tag Questions Chapter-wise</DialogTitle>
        <DialogContent>
          <QuestionTaggingInterface paperId={paper.id} />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setShowTaggingDialog(false)}>Close</Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default PaperViewerPage;
