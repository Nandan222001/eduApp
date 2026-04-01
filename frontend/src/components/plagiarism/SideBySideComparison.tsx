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

  const similarityScore =
    typeof visualization.similarity_score === 'number' ? visualization.similarity_score : 0;
  const totalSegments =
    typeof visualization.total_segments === 'number' ? visualization.total_segments : 0;
  const contentComparison = visualization.content_comparison as Record<string, unknown> | undefined;
  const sourceData = contentComparison?.source as Record<string, unknown> | undefined;
  const targetData = contentComparison?.target as Record<string, unknown> | undefined;

  return (
    <Box>
      <Box sx={{ mb: 3, display: 'flex', gap: 2, alignItems: 'center' }}>
        <Typography variant="h6">Side-by-Side Comparison</Typography>
        <Chip
          label={`${(similarityScore * 100).toFixed(1)}% Similar`}
          color={similarityScore >= 0.8 ? 'error' : 'warning'}
        />
        <Chip label={`${totalSegments} Matching Segments`} color="info" />
      </Box>

      <Grid container spacing={2}>
        <Grid item xs={12} md={6}>
          <Paper sx={{ p: 2, height: '600px', overflow: 'auto' }}>
            <Typography variant="subtitle1" gutterBottom fontWeight="bold">
              Original Submission
            </Typography>
            <Divider sx={{ mb: 2 }} />
            <Box sx={{ fontSize: '14px', lineHeight: 1.6 }}>
              {sourceData?.highlighted && Array.isArray(sourceData.highlighted) ? (
                renderHighlightedText(sourceData.highlighted as HighlightedSegment[])
              ) : (
                <Typography variant="body2">{String(sourceData?.text ?? '')}</Typography>
              )}
            </Box>
            <Box sx={{ mt: 2 }}>
              <Chip
                label={`${(typeof sourceData?.matched_percentage === 'number' ? sourceData.matched_percentage : 0).toFixed(1)}% Matched`}
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
              {targetData?.highlighted && Array.isArray(targetData.highlighted) ? (
                renderHighlightedText(targetData.highlighted as HighlightedSegment[])
              ) : (
                <Typography variant="body2">{String(targetData?.text ?? '')}</Typography>
              )}
            </Box>
            <Box sx={{ mt: 2 }}>
              <Chip
                label={`${(typeof targetData?.matched_percentage === 'number' ? targetData.matched_percentage : 0).toFixed(1)}% Matched`}
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
          {(Array.isArray(visualization.matched_segments)
            ? visualization.matched_segments
            : []
          ).map((segment, index: number) => {
            const segmentData = segment as Record<string, unknown>;
            const segmentSimilarity =
              typeof segmentData.segment_similarity === 'number'
                ? segmentData.segment_similarity
                : 0;
            return (
              <Box
                key={String(segmentData.id ?? index)}
                sx={{
                  p: 2,
                  mb: 1,
                  backgroundColor: '#f5f5f5',
                  borderRadius: 1,
                  borderLeft: segmentData.is_citation ? '4px solid #2196f3' : '4px solid #ff9800',
                }}
              >
                <Box sx={{ display: 'flex', gap: 1, mb: 1 }}>
                  <Chip label={`Segment ${index + 1}`} size="small" variant="outlined" />
                  <Chip
                    label={`${(segmentSimilarity * 100).toFixed(1)}% Similar`}
                    size="small"
                    color={segmentSimilarity >= 0.8 ? 'error' : 'warning'}
                  />
                  {Boolean(segmentData.is_citation) && (
                    <Chip label="Has Citation" size="small" color="info" />
                  )}
                  {Boolean(segmentData.is_code_segment) && (
                    <Chip label="Code" size="small" color="secondary" />
                  )}
                </Box>
                <Typography variant="caption" color="text.secondary">
                  Length: {String(segmentData.segment_length ?? 0)} characters
                </Typography>
              </Box>
            );
          })}
        </Box>
      </Paper>
    </Box>
  );
};
