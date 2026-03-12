import React from 'react';
import {
  Box,
  Paper,
  Typography,
  List,
  ListItem,
  ListItemText,
  LinearProgress,
  CircularProgress,
} from '@mui/material';
import { useQuery } from '@tanstack/react-query';
import { analyticsApi } from '@/api/analytics';

const UserFlowTab: React.FC = () => {
  const { data: userFlow, isLoading } = useQuery({
    queryKey: ['user-flow'],
    queryFn: () => analyticsApi.getUserFlow(),
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
        User Flow Analysis
      </Typography>
      <Typography variant="body2" color="text.secondary" paragraph>
        Top landing pages and user navigation patterns
      </Typography>

      <Paper sx={{ p: 3 }}>
        <Typography variant="subtitle1" gutterBottom>
          Total Sessions: {userFlow?.total_sessions || 0}
        </Typography>
        <List>
          {userFlow?.nodes.map((node, index) => (
            <ListItem key={index}>
              <ListItemText
                primary={node.page}
                secondary={
                  <Box sx={{ mt: 1 }}>
                    <Typography variant="body2" color="text.secondary">
                      {node.count} sessions (
                      {((node.count / (userFlow.total_sessions || 1)) * 100).toFixed(1)}%)
                    </Typography>
                    <Box sx={{ display: 'flex', alignItems: 'center', mt: 1 }}>
                      <Box sx={{ width: '100%', mr: 1 }}>
                        <LinearProgress
                          variant="determinate"
                          value={(node.count / (userFlow.total_sessions || 1)) * 100}
                        />
                      </Box>
                    </Box>
                    <Typography variant="caption" color="text.secondary">
                      Drop-off rate: {node.drop_off_rate.toFixed(1)}%
                    </Typography>
                  </Box>
                }
              />
            </ListItem>
          ))}
        </List>
      </Paper>
    </Box>
  );
};

export default UserFlowTab;
