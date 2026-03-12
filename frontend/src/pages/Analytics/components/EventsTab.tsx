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

const EventsTab: React.FC = () => {
  const { data: events, isLoading } = useQuery({
    queryKey: ['top-events'],
    queryFn: () => analyticsApi.getTopEvents(),
    refetchInterval: 60000,
  });

  const getEventTypeColor = (type: string) => {
    switch (type) {
      case 'page_view':
        return 'primary';
      case 'click':
        return 'info';
      case 'conversion':
        return 'success';
      case 'feature_usage':
        return 'secondary';
      default:
        return 'default';
    }
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
        Top Events
      </Typography>
      <Typography variant="body2" color="text.secondary" paragraph>
        Most frequently tracked events and user interactions
      </Typography>

      <TableContainer component={Paper}>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>Event Name</TableCell>
              <TableCell>Type</TableCell>
              <TableCell align="right">Total Count</TableCell>
              <TableCell align="right">Unique Users</TableCell>
              <TableCell align="right">Avg. per User</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {events?.map((event) => (
              <TableRow key={event.event_name}>
                <TableCell component="th" scope="row">
                  {event.event_name}
                </TableCell>
                <TableCell>
                  <Chip
                    label={event.event_type}
                    color={getEventTypeColor(event.event_type)}
                    size="small"
                  />
                </TableCell>
                <TableCell align="right">{event.count.toLocaleString()}</TableCell>
                <TableCell align="right">{event.unique_users.toLocaleString()}</TableCell>
                <TableCell align="right">
                  {(event.count / Math.max(event.unique_users, 1)).toFixed(1)}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>
    </Box>
  );
};

export default EventsTab;
