import React from 'react';
import {
  Box,
  Paper,
  Typography,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  CircularProgress,
  Chip,
} from '@mui/material';
import { useQuery } from '@tanstack/react-query';
import { analyticsApi } from '@/api/analytics';
import { format } from 'date-fns';

const RetentionTab: React.FC = () => {
  const { data: cohorts, isLoading } = useQuery({
    queryKey: ['retention-cohorts'],
    queryFn: () => analyticsApi.getRetentionCohorts(),
    refetchInterval: 300000,
  });

  const getRetentionColor = (rate: number) => {
    if (rate >= 70) return 'success';
    if (rate >= 40) return 'warning';
    return 'error';
  };

  if (isLoading) {
    return (
      <Box display="flex" justifyContent="center" p={4}>
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box>
      <Typography variant="h6" gutterBottom>
        User Retention Analysis
      </Typography>
      <Typography variant="body2" color="text.secondary" paragraph>
        Track user retention by cohort over time
      </Typography>

      <TableContainer component={Paper}>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>Cohort Date</TableCell>
              <TableCell align="right">Users</TableCell>
              <TableCell align="right">Day 1</TableCell>
              <TableCell align="right">Day 7</TableCell>
              <TableCell align="right">Day 14</TableCell>
              <TableCell align="right">Day 30</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {cohorts?.map((cohort) => (
              <TableRow key={cohort.cohort_date}>
                <TableCell>{format(new Date(cohort.cohort_date), 'MMM dd, yyyy')}</TableCell>
                <TableCell align="right">{cohort.users_count}</TableCell>
                <TableCell align="right">
                  <Chip
                    label={`${cohort.retention_day_1.toFixed(0)}%`}
                    color={getRetentionColor(cohort.retention_day_1)}
                    size="small"
                  />
                </TableCell>
                <TableCell align="right">
                  <Chip
                    label={`${cohort.retention_day_7.toFixed(0)}%`}
                    color={getRetentionColor(cohort.retention_day_7)}
                    size="small"
                  />
                </TableCell>
                <TableCell align="right">
                  <Chip
                    label={`${cohort.retention_day_14.toFixed(0)}%`}
                    color={getRetentionColor(cohort.retention_day_14)}
                    size="small"
                  />
                </TableCell>
                <TableCell align="right">
                  <Chip
                    label={`${cohort.retention_day_30.toFixed(0)}%`}
                    color={getRetentionColor(cohort.retention_day_30)}
                    size="small"
                  />
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>
    </Box>
  );
};

export default RetentionTab;
