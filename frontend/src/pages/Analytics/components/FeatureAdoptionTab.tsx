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

const FeatureAdoptionTab: React.FC = () => {
  const { data: features, isLoading } = useQuery({
    queryKey: ['feature-adoption'],
    queryFn: () => analyticsApi.getFeatureAdoption(),
    refetchInterval: 60000,
  });

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
        Feature Adoption Metrics
      </Typography>
      <Typography variant="body2" color="text.secondary" paragraph>
        Track which features are being used and by how many users
      </Typography>

      <TableContainer component={Paper}>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>Feature Name</TableCell>
              <TableCell align="right">Total Users</TableCell>
              <TableCell align="right">Total Usage</TableCell>
              <TableCell align="right">Today</TableCell>
              <TableCell align="right">This Week</TableCell>
              <TableCell align="right">This Month</TableCell>
              <TableCell align="right">Adoption Rate</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {features?.map((feature) => (
              <TableRow key={feature.feature_name}>
                <TableCell component="th" scope="row">
                  {feature.feature_name}
                </TableCell>
                <TableCell align="right">{feature.total_users}</TableCell>
                <TableCell align="right">{feature.total_usage}</TableCell>
                <TableCell align="right">{feature.unique_users_today}</TableCell>
                <TableCell align="right">{feature.unique_users_week}</TableCell>
                <TableCell align="right">{feature.unique_users_month}</TableCell>
                <TableCell align="right">
                  <Chip
                    label={`${feature.adoption_rate.toFixed(1)}%`}
                    color={feature.adoption_rate > 50 ? 'success' : 'default'}
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

export default FeatureAdoptionTab;
