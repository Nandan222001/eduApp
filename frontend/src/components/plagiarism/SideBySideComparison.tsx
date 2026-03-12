import React, { useEffect, useState } from 'react';
import { Box, Paper, Typography, Grid, Chip, Alert, LinearProgress, Divider } from '@mui/material';
import { plagiarismApi } from '../../api/plagiarismApi';

interface SideBySideComparisonProps {
  resultId: number;
}

interface HighlightedSegment {
  type: 'normal' | 'highlighted';
  text: string;
  start: number;
  end: number;
}

export const SideBySideComparison: React.FC<SideBySideComparisonProps> = ({ resultId }) => {
  const [visualization, setVisualization] = useState<Record<string, unknown> | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadVisualization = React.useCallback(async () => {
    try {
      setLoading(true);
      const data = await plagiarismApi.getVisualization(resultId);
      setVisualization(data);
    } catch (err) {
      const error = err as { response?: { data?: { detail?: string } } };
      setError(error.response?.data?.detail || 'Failed to load visualization');
    } finally {
      setLoading(false);
    }
  }, [resultId]);

  useEffect(() => {
    loadVisualization();
  }, [loadVisualization]);

  const renderHighlightedText = (segments: HighlightedSegment[]) => {
    return segments.map((segment, index) => (
      <span
        key={index}
        style={{
          backgroundColor: segment.type === 'highlighted' ? '#ffeb3b' : 'transparent',
          padding: segment.type === 'highlighted' ? '2px 4px' : 0,
          borderRadius: '3px',
          fontWeight: segment.type === 'highlighted' ? 600 : 400,
        }}
      >
        {segment.text}
      </span>
    ));
  };

  if (loading) {
    return (
      <Box sx={{ width: '100%', p: 3 }}>
        <LinearProgress />
      </Box>
    );
  }

  if (error) {
    return <Alert severity="error">{error}</Alert>;
  }

  if (!visualization) {
    return <Alert severity="info">No visualization data available</Alert>;
  }

  return (
    <Box>
      <Box sx={{ mb: 3, display: 'flex', gap: 2, alignItems: 'center' }}>
        <Typography variant="h6">Side-by-Side Comparison</Typography>
        <Chip
          label={`${(visualization.similarity_score * 100).toFixed(1)}% Similar`}
          color={visualization.similarity_score >= 0.8 ? 'error' : 'warning'}
        />
        <Chip label={`${visualization.total_segments} Matching Segments`} color="info" />
      </Box>

      <Grid container spacing={2}>
        <Grid item xs={12} md={6}>
          <Paper sx={{ p: 2, height: '600px', overflow: 'auto' }}>
            <Typography variant="subtitle1" gutterBottom fontWeight="bold">
              Original Submission
            </Typography>
            <Divider sx={{ mb: 2 }} />
            <Box sx={{ fontSize: '14px', lineHeight: 1.6 }}>
              {visualization.content_comparison.source.highlighted ? (
                renderHighlightedText(visualization.content_comparison.source.highlighted)
              ) : (
                <Typography variant="body2">
                  {visualization.content_comparison.source.text}
                </Typography>
              )}
            </Box>
            <Box sx={{ mt: 2 }}>
              <Chip
                label={`${visualization.content_comparison.source.matched_percentage.toFixed(1)}% Matched`}
                size="small"
                color="warning"
              />
            </Box>
          </Paper>
        </Grid>

        <Grid item xs={12} md={6}>
          <Paper sx={{ p: 2, height: '600px', overflow: 'auto' }}>
            <Typography variant="subtitle1" gutterBottom fontWeight="bold">
              Matched Submission
            </Typography>
            <Divider sx={{ mb: 2 }} />
            <Box sx={{ fontSize: '14px', lineHeight: 1.6 }}>
              {visualization.content_comparison.target.highlighted ? (
                renderHighlightedText(visualization.content_comparison.target.highlighted)
              ) : (
                <Typography variant="body2">
                  {visualization.content_comparison.target.text}
                </Typography>
              )}
            </Box>
            <Box sx={{ mt: 2 }}>
              <Chip
                label={`${visualization.content_comparison.target.matched_percentage.toFixed(1)}% Matched`}
                size="small"
                color="warning"
              />
            </Box>
          </Paper>
        </Grid>
      </Grid>

      <Paper sx={{ p: 2, mt: 2 }}>
        <Typography variant="subtitle2" gutterBottom>
          Matched Segments Details
        </Typography>
        <Box sx={{ maxHeight: '300px', overflow: 'auto' }}>
          {(visualization.matched_segments as Array<Record<string, unknown>>).map(
            (segment, index: number) => (
              <Box
                key={segment.id}
                sx={{
                  p: 2,
                  mb: 1,
                  backgroundColor: '#f5f5f5',
                  borderRadius: 1,
                  borderLeft: segment.is_citation ? '4px solid #2196f3' : '4px solid #ff9800',
                }}
              >
                <Box sx={{ display: 'flex', gap: 1, mb: 1 }}>
                  <Chip label={`Segment ${index + 1}`} size="small" variant="outlined" />
                  <Chip
                    label={`${(segment.segment_similarity * 100).toFixed(1)}% Similar`}
                    size="small"
                    color={segment.segment_similarity >= 0.8 ? 'error' : 'warning'}
                  />
                  {segment.is_citation && <Chip label="Has Citation" size="small" color="info" />}
                  {segment.is_code_segment && <Chip label="Code" size="small" color="secondary" />}
                </Box>
                <Typography variant="caption" color="text.secondary">
                  Length: {segment.segment_length} characters
                </Typography>
              </Box>
            )
          )}
        </Box>
      </Paper>
    </Box>
  );
};
