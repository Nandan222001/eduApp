import React, { useEffect, useState } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Chip,
  IconButton,
  LinearProgress,
  Alert,
  Tooltip,
} from '@mui/material';
import {
  Visibility as VisibilityIcon,
  Warning as WarningIcon,
  CheckCircle as CheckCircleIcon,
  Error as ErrorIcon,
} from '@mui/icons-material';
import { plagiarismApi } from '../../api/plagiarismApi';

interface PlagiarismResultsListProps {
  checkId: number;
  onViewDetails?: (resultId: number) => void;
}

export const PlagiarismResultsList: React.FC<PlagiarismResultsListProps> = ({
  checkId,
  onViewDetails,
}) => {
  const [results, setResults] = useState<Array<Record<string, unknown>>>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadResults = React.useCallback(async () => {
    try {
      setLoading(true);
      const data = await plagiarismApi.getCheckResults(checkId, 0.5);
      setResults(data);
    } catch (err) {
      const error = err as { response?: { data?: { detail?: string } } };
      setError(error.response?.data?.detail || 'Failed to load results');
    } finally {
      setLoading(false);
    }
  }, [checkId]);

  useEffect(() => {
    loadResults();
  }, [loadResults]);

  const getSimilarityColor = (score: number): 'error' | 'warning' | 'success' => {
    if (score >= 0.8) return 'error';
    if (score >= 0.5) return 'warning';
    return 'success';
  };

  const getSimilarityIcon = (score: number) => {
    if (score >= 0.8) return <ErrorIcon />;
    if (score >= 0.5) return <WarningIcon />;
    return <CheckCircleIcon />;
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

  if (results.length === 0) {
    return (
      <Alert severity="info">No plagiarism matches found above the similarity threshold.</Alert>
    );
  }

  return (
    <Card>
      <CardContent>
        <Typography variant="h6" gutterBottom>
          Plagiarism Detection Results ({results.length} matches)
        </Typography>

        <TableContainer>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>Submission ID</TableCell>
                <TableCell>Matched With</TableCell>
                <TableCell>Similarity Score</TableCell>
                <TableCell>Matched Segments</TableCell>
                <TableCell>Citations</TableCell>
                <TableCell>Status</TableCell>
                <TableCell>Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {results.map((result) => {
                const similarityScore =
                  typeof result.similarity_score === 'number' ? result.similarity_score : 0;
                const resultId = typeof result.id === 'number' ? result.id : 0;
                return (
                  <TableRow key={String(result.id)}>
                    <TableCell>{String(result.submission_id ?? '')}</TableCell>
                    <TableCell>
                      {String(result.matched_submission_id ?? 'External Source')}
                    </TableCell>
                    <TableCell>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        {getSimilarityIcon(similarityScore)}
                        <Chip
                          label={`${(similarityScore * 100).toFixed(1)}%`}
                          color={getSimilarityColor(similarityScore)}
                          size="small"
                        />
                      </Box>
                    </TableCell>
                    <TableCell>{String(result.matched_segments_count ?? 0)}</TableCell>
                    <TableCell>
                      {result.has_citations ? (
                        <Chip label="Has Citations" color="info" size="small" />
                      ) : (
                        <Chip label="No Citations" color="default" size="small" />
                      )}
                    </TableCell>
                    <TableCell>
                      {result.is_false_positive ? (
                        <Chip label="False Positive" color="success" size="small" />
                      ) : result.review_status === 'reviewed' ? (
                        <Chip label="Reviewed" color="primary" size="small" />
                      ) : (
                        <Chip label="Pending Review" color="warning" size="small" />
                      )}
                    </TableCell>
                    <TableCell>
                      <Tooltip title="View Details">
                        <IconButton
                          size="small"
                          onClick={() => onViewDetails && onViewDetails(resultId)}
                        >
                          <VisibilityIcon />
                        </IconButton>
                      </Tooltip>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </TableContainer>
      </CardContent>
    </Card>
  );
};
