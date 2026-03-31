import React, { useState } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  FormControl,
  FormLabel,
  RadioGroup,
  FormControlLabel,
  Radio,
  TextField,
  Checkbox,
  Alert,
  Chip,
  Grid,
} from '@mui/material';
import { Check as CheckIcon } from '@mui/icons-material';
import { plagiarismApi } from '../../api/plagiarismApi';
import { SideBySideComparison } from './SideBySideComparison';

interface TeacherReviewInterfaceProps {
  resultId: number;
  result: Record<string, unknown>;
  onReviewComplete?: () => void;
}

export const TeacherReviewInterface: React.FC<TeacherReviewInterfaceProps> = ({
  resultId,
  result,
  onReviewComplete,
}) => {
  const [open, setOpen] = useState(false);
  const [decision, setDecision] = useState<string>('NEEDS_INVESTIGATION');
  const [notes, setNotes] = useState('');
  const [isFalsePositive, setIsFalsePositive] = useState(false);
  const [falsePositiveReason, setFalsePositiveReason] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleOpen = () => setOpen(true);
  const handleClose = () => {
    setOpen(false);
    setError(null);
  };

  const handleSubmitReview = async () => {
    setLoading(true);
    setError(null);

    try {
      await plagiarismApi.reviewResult(resultId, {
        review_decision: decision as
          | 'CONFIRMED_PLAGIARISM'
          | 'FALSE_POSITIVE'
          | 'LEGITIMATE_CITATION'
          | 'NEEDS_INVESTIGATION'
          | 'DISMISSED',
        review_notes: notes,
        is_false_positive: isFalsePositive,
        false_positive_reason: isFalsePositive ? falsePositiveReason : undefined,
      });

      if (onReviewComplete) {
        onReviewComplete();
      }

      handleClose();
    } catch (err) {
      const error = err as { response?: { data?: { detail?: string } } };
      setError(error.response?.data?.detail || 'Failed to submit review');
    } finally {
      setLoading(false);
    }
  };

  const getSimilarityColor = (score: number) => {
    if (score >= 0.8) return 'error';
    if (score >= 0.5) return 'warning';
    return 'success';
  };

  const similarityScore = typeof result.similarity_score === 'number' ? result.similarity_score : 0;

  return (
    <Box>
      <Card sx={{ mb: 3 }}>
        <CardContent>
          <Grid container spacing={2} alignItems="center">
            <Grid item xs={12} md={6}>
              <Typography variant="h6" gutterBottom>
                Review Plagiarism Result
              </Typography>
              <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
                <Chip
                  label={`${(similarityScore * 100).toFixed(1)}% Similar`}
                  color={getSimilarityColor(similarityScore)}
                />
                <Chip
                  label={`${String(result.matched_segments_count ?? 0)} Segments`}
                  color="info"
                />
                {Boolean(result.has_citations) && <Chip label="Has Citations" color="primary" />}
                {Boolean(result.is_false_positive) && (
                  <Chip label="Marked as False Positive" color="success" />
                )}
              </Box>
            </Grid>
            <Grid item xs={12} md={6} sx={{ textAlign: 'right' }}>
              <Button
                variant="contained"
                color="primary"
                onClick={handleOpen}
                disabled={result.review_status === 'reviewed'}
              >
                {result.review_status === 'reviewed' ? 'Already Reviewed' : 'Review Result'}
              </Button>
            </Grid>
          </Grid>

          {result.review_status === 'reviewed' && (
            <Alert severity="info" sx={{ mt: 2 }}>
              <Typography variant="body2">
                <strong>Decision:</strong> {String(result.review_decision ?? '')}
              </Typography>
              {Boolean(result.review_notes) && (
                <Typography variant="body2">
                  <strong>Notes:</strong> {String(result.review_notes)}
                </Typography>
              )}
              <Typography variant="caption" color="text.secondary">
                Reviewed on {new Date(String(result.reviewed_at ?? '')).toLocaleString()}
              </Typography>
            </Alert>
          )}
        </CardContent>
      </Card>

      <SideBySideComparison resultId={resultId} />

      <Dialog open={open} onClose={handleClose} maxWidth="md" fullWidth>
        <DialogTitle>Review Plagiarism Detection Result</DialogTitle>
        <DialogContent>
          {error && (
            <Alert severity="error" sx={{ mb: 2 }}>
              {error}
            </Alert>
          )}

          <Box sx={{ mb: 2 }}>
            <Typography variant="body2" color="text.secondary" gutterBottom>
              Submission ID: {String(result.submission_id ?? '')} vs{' '}
              {String(result.matched_submission_id ?? 'External Source')}
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Similarity Score: {(similarityScore * 100).toFixed(1)}%
            </Typography>
          </Box>

          <FormControl component="fieldset" fullWidth sx={{ mb: 3 }}>
            <FormLabel component="legend">Review Decision</FormLabel>
            <RadioGroup value={decision} onChange={(e) => setDecision(e.target.value)}>
              <FormControlLabel
                value="CONFIRMED_PLAGIARISM"
                control={<Radio />}
                label="Confirmed Plagiarism - Action Required"
              />
              <FormControlLabel
                value="FALSE_POSITIVE"
                control={<Radio />}
                label="False Positive - Not Plagiarism"
              />
              <FormControlLabel
                value="LEGITIMATE_CITATION"
                control={<Radio />}
                label="Legitimate Citation - Properly Referenced"
              />
              <FormControlLabel
                value="NEEDS_INVESTIGATION"
                control={<Radio />}
                label="Needs Further Investigation"
              />
              <FormControlLabel
                value="DISMISSED"
                control={<Radio />}
                label="Dismissed - No Concern"
              />
            </RadioGroup>
          </FormControl>

          <FormControlLabel
            control={
              <Checkbox
                checked={isFalsePositive}
                onChange={(e) => setIsFalsePositive(e.target.checked)}
              />
            }
            label="Mark as False Positive"
            sx={{ mb: 2 }}
          />

          {isFalsePositive && (
            <TextField
              fullWidth
              multiline
              rows={2}
              label="False Positive Reason"
              value={falsePositiveReason}
              onChange={(e) => setFalsePositiveReason(e.target.value)}
              sx={{ mb: 2 }}
              placeholder="Why is this a false positive? (e.g., common assignment instructions, template code, etc.)"
            />
          )}

          <TextField
            fullWidth
            multiline
            rows={4}
            label="Review Notes"
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="Add any additional notes about this review..."
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={handleClose} disabled={loading}>
            Cancel
          </Button>
          <Button
            onClick={handleSubmitReview}
            variant="contained"
            disabled={loading}
            startIcon={<CheckIcon />}
          >
            Submit Review
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};
