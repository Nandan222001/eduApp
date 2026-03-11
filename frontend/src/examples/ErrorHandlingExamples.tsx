import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Box, Container, Typography, Button, Grid, Paper, Divider } from '@mui/material';
import {
  SkeletonLoader,
  ErrorDisplay,
  EmptyState,
  LoadingOverlay,
  ValidatedTextField,
  LoadingButton,
  ProgressBar,
  RetryableQuery,
  TableSkeleton,
  CardGridSkeleton,
  StatCardSkeleton,
} from '../components/common';
import { useToast } from '../hooks/useToast';

const fetchData = async () => {
  await new Promise((resolve) => setTimeout(resolve, 2000));
  return { items: [1, 2, 3, 4, 5] };
};

export const ErrorHandlingExamples = () => {
  const [loading, setLoading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [formError, setFormError] = useState('');
  const { showSuccess, showError, showWarning, showInfo } = useToast();

  const query = useQuery({
    queryKey: ['example-data'],
    queryFn: fetchData,
    enabled: false,
  });

  const handleLoadingDemo = () => {
    setLoading(true);
    setProgress(0);

    const interval = setInterval(() => {
      setProgress((prev) => {
        if (prev >= 100) {
          clearInterval(interval);
          setLoading(false);
          return 100;
        }
        return prev + 10;
      });
    }, 300);
  };

  const handleFormSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setFormError('Please enter a valid email address');
  };

  return (
    <Container maxWidth="lg" sx={{ py: 4 }}>
      <Typography variant="h4" gutterBottom>
        Error Handling & Loading States Examples
      </Typography>
      <Typography variant="body1" color="text.secondary" paragraph>
        This page demonstrates all error handling and loading state components.
      </Typography>

      <Grid container spacing={4}>
        <Grid item xs={12}>
          <Paper sx={{ p: 3 }}>
            <Typography variant="h6" gutterBottom>
              Toast Notifications
            </Typography>
            <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap' }}>
              <Button
                variant="contained"
                color="success"
                onClick={() => showSuccess('Success message!')}
              >
                Show Success
              </Button>
              <Button variant="contained" color="error" onClick={() => showError('Error message!')}>
                Show Error
              </Button>
              <Button
                variant="contained"
                color="warning"
                onClick={() => showWarning('Warning message!')}
              >
                Show Warning
              </Button>
              <Button variant="contained" color="info" onClick={() => showInfo('Info message!')}>
                Show Info
              </Button>
            </Box>
          </Paper>
        </Grid>

        <Grid item xs={12}>
          <Paper sx={{ p: 3 }}>
            <Typography variant="h6" gutterBottom>
              Loading Overlay with Progress
            </Typography>
            <Button variant="contained" onClick={handleLoadingDemo}>
              Start Loading
            </Button>
            <Box sx={{ mt: 2 }}>
              <ProgressBar value={progress} label="Upload Progress" />
            </Box>
            <LoadingOverlay
              open={loading}
              message="Processing..."
              progress={progress}
              showProgress
            />
          </Paper>
        </Grid>

        <Grid item xs={12}>
          <Paper sx={{ p: 3 }}>
            <Typography variant="h6" gutterBottom>
              Form Validation
            </Typography>
            <Box component="form" onSubmit={handleFormSubmit}>
              <ValidatedTextField
                fullWidth
                label="Email"
                type="email"
                fieldError={formError}
                touched={true}
                sx={{ mb: 2 }}
              />
              <LoadingButton variant="contained" type="submit" loading={false}>
                Submit
              </LoadingButton>
            </Box>
          </Paper>
        </Grid>

        <Grid item xs={12}>
          <Paper sx={{ p: 3 }}>
            <Typography variant="h6" gutterBottom>
              Skeleton Loaders
            </Typography>
            <Divider sx={{ my: 2 }} />
            <Typography variant="subtitle2" gutterBottom>
              Card Skeleton
            </Typography>
            <SkeletonLoader variant="card" count={2} />

            <Divider sx={{ my: 3 }} />
            <Typography variant="subtitle2" gutterBottom>
              Table Skeleton
            </Typography>
            <TableSkeleton rows={3} columns={4} />

            <Divider sx={{ my: 3 }} />
            <Typography variant="subtitle2" gutterBottom>
              Stat Cards Skeleton
            </Typography>
            <StatCardSkeleton count={4} />

            <Divider sx={{ my: 3 }} />
            <Typography variant="subtitle2" gutterBottom>
              Card Grid Skeleton
            </Typography>
            <CardGridSkeleton count={3} />
          </Paper>
        </Grid>

        <Grid item xs={12}>
          <Paper sx={{ p: 3 }}>
            <Typography variant="h6" gutterBottom>
              Error Display
            </Typography>
            <ErrorDisplay
              title="Failed to Load"
              message="Unable to fetch data from the server."
              onRetry={() => alert('Retry clicked')}
            />
          </Paper>
        </Grid>

        <Grid item xs={12}>
          <Paper sx={{ p: 3 }}>
            <Typography variant="h6" gutterBottom>
              Empty State
            </Typography>
            <EmptyState
              title="No Items Found"
              message="You haven't created any items yet."
              iconType="inbox"
              actionLabel="Create New Item"
              onAction={() => alert('Create clicked')}
              variant="card"
            />
          </Paper>
        </Grid>

        <Grid item xs={12}>
          <Paper sx={{ p: 3 }}>
            <Typography variant="h6" gutterBottom>
              Data Fetch Wrapper (RetryableQuery)
            </Typography>
            <Button variant="contained" onClick={() => query.refetch()} sx={{ mb: 2 }}>
              Load Data
            </Button>

            <RetryableQuery query={query} skeletonVariant="list" skeletonCount={3}>
              {(data) => (
                <Box>
                  <Typography>Data loaded successfully!</Typography>
                  <Typography variant="body2">Items: {JSON.stringify(data.items)}</Typography>
                </Box>
              )}
            </RetryableQuery>
          </Paper>
        </Grid>
      </Grid>
    </Container>
  );
};

export default ErrorHandlingExamples;
