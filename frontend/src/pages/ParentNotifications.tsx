import React from 'react';
import { Container, Typography, Box } from '@mui/material';

export const ParentNotifications: React.FC = () => {
  return (
    <Container maxWidth="xl">
      <Box sx={{ py: 3 }}>
        <Typography variant="h4" gutterBottom>
          Notifications - Coming Soon
        </Typography>
      </Box>
    </Container>
  );
};

export default ParentNotifications;
