import React, { useEffect, useState } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Grid,
  Paper,
  Alert,
  LinearProgress,
  Chip,
  List,
  ListItem,
  ListItemText,
} from '@mui/material';
import { PieChart, Pie, Cell, ResponsiveContainer, Legend, Tooltip } from 'recharts';
import { plagiarismApi } from '../../api/plagiarismApi';

interface PlagiarismReportProps {
  assignmentId: number;
}

export const PlagiarismReport: React.FC<PlagiarismReportProps> = ({ assignmentId }) => {
  const [report, setReport] = useState<Record<string, unknown> | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadReport = React.useCallback(async () => {
    try {
      setLoading(true);
      const data = await plagiarismApi.getReport(assignmentId);
      setReport(data);
    } catch (err) {
      const error = err as { response?: { data?: { detail?: string } } };
      setError(error.response?.data?.detail || 'Failed to load report');
    } finally {
      setLoading(false);
    }
  }, [assignmentId]);

  useEffect(() => {
    loadReport();
  }, [loadReport]);

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

  if (!report) {
    return <Alert severity="info">No report data available</Alert>;
  }

  const averageSimilarity =
    typeof report.average_similarity === 'number' ? report.average_similarity : 0;
  const maxSimilarity = typeof report.max_similarity === 'number' ? report.max_similarity : 0;
  const flaggedPairs = Array.isArray(report.flagged_pairs) ? report.flagged_pairs : [];
  const processingTime =
    typeof report.processing_time_seconds === 'number' ? report.processing_time_seconds : 0;

  const distributionData = [
    { name: 'High Similarity (≥80%)', value: report.high_similarity_count, color: '#f44336' },
    { name: 'Medium Similarity (50-80%)', value: report.medium_similarity_count, color: '#ff9800' },
    { name: 'Low Similarity (<50%)', value: report.low_similarity_count, color: '#4caf50' },
  ];

  const COLORS = ['#f44336', '#ff9800', '#4caf50'];

  return (
    <Box>
      <Typography variant="h5" gutterBottom>
        Plagiarism Detection Report
      </Typography>
      <Typography variant="subtitle2" color="text.secondary" gutterBottom>
        {String(report.assignment_title ?? '')}
      </Typography>

      <Grid container spacing={3} sx={{ mt: 2 }}>
        <Grid item xs={12} md={3}>
          <Card>
            <CardContent>
              <Typography color="text.secondary" gutterBottom>
                Total Submissions
              </Typography>
              <Typography variant="h4">{String(report.total_submissions ?? 0)}</Typography>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} md={3}>
          <Card>
            <CardContent>
              <Typography color="text.secondary" gutterBottom>
                Submissions Checked
              </Typography>
              <Typography variant="h4">{String(report.submissions_checked ?? 0)}</Typography>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} md={3}>
          <Card>
            <CardContent>
              <Typography color="text.secondary" gutterBottom>
                Average Similarity
              </Typography>
              <Typography variant="h4">{(averageSimilarity * 100).toFixed(1)}%</Typography>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} md={3}>
          <Card>
            <CardContent>
              <Typography color="text.secondary" gutterBottom>
                Max Similarity
              </Typography>
              <Typography variant="h4" color="error">
                {(maxSimilarity * 100).toFixed(1)}%
              </Typography>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} md={6}>
          <Paper sx={{ p: 3 }}>
            <Typography variant="h6" gutterBottom>
              Similarity Distribution
            </Typography>
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={distributionData}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ name, value }) => `${name}: ${value}`}
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="value"
                >
                  {distributionData.map((_entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          </Paper>
        </Grid>

        <Grid item xs={12} md={6}>
          <Paper sx={{ p: 3 }}>
            <Typography variant="h6" gutterBottom>
              Flagged Pairs (High Similarity)
            </Typography>
            <Box sx={{ maxHeight: 300, overflow: 'auto' }}>
              {flaggedPairs.length === 0 ? (
                <Alert severity="success">No high similarity pairs detected</Alert>
              ) : (
                <List>
                  {(flaggedPairs as Array<Record<string, unknown>>).map((pair, index: number) => {
                    const similarityScore =
                      typeof pair.similarity_score === 'number' ? pair.similarity_score : 0;
                    return (
                      <ListItem key={index}>
                        <ListItemText
                          primary={
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                              <Typography variant="body2">
                                Submission {String(pair.submission_id_1 ?? '')} ↔{' '}
                                {String(pair.submission_id_2 ?? '')}
                              </Typography>
                              <Chip
                                label={`${(similarityScore * 100).toFixed(1)}%`}
                                color="error"
                                size="small"
                              />
                            </Box>
                          }
                          secondary={`${String(pair.matched_segments ?? 0)} matching segments`}
                        />
                      </ListItem>
                    );
                  })}
                </List>
              )}
            </Box>
          </Paper>
        </Grid>

        <Grid item xs={12}>
          <Paper sx={{ p: 3 }}>
            <Typography variant="h6" gutterBottom>
              Summary Statistics
            </Typography>
            <Grid container spacing={2}>
              <Grid item xs={12} sm={6} md={3}>
                <Box sx={{ textAlign: 'center', p: 2 }}>
                  <Typography variant="h3" color="error">
                    {String(report.high_similarity_count ?? 0)}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    High Similarity Cases
                  </Typography>
                </Box>
              </Grid>
              <Grid item xs={12} sm={6} md={3}>
                <Box sx={{ textAlign: 'center', p: 2 }}>
                  <Typography variant="h3" color="warning.main">
                    {String(report.medium_similarity_count ?? 0)}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Medium Similarity Cases
                  </Typography>
                </Box>
              </Grid>
              <Grid item xs={12} sm={6} md={3}>
                <Box sx={{ textAlign: 'center', p: 2 }}>
                  <Typography variant="h3" color="success.main">
                    {String(report.low_similarity_count ?? 0)}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Low Similarity Cases
                  </Typography>
                </Box>
              </Grid>
              <Grid item xs={12} sm={6} md={3}>
                <Box sx={{ textAlign: 'center', p: 2 }}>
                  <Typography variant="h3" color="text.secondary">
                    {processingTime.toFixed(2)}s
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Processing Time
                  </Typography>
                </Box>
              </Grid>
            </Grid>
          </Paper>
        </Grid>
      </Grid>
    </Box>
  );
};
