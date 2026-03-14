import React, { useState } from 'react';
import { Container, Box, Tabs, Tab, Typography } from '@mui/material';
import { ParentCommunicationView } from '@/components/communications';
import { useQuery } from '@tanstack/react-query';
import { parentsApi } from '@/api/parents';
import { isDemoUser, demoDataApi } from '@/api/demoDataApi';

export const ParentCommunicationDashboard: React.FC = () => {
  const [selectedChildId, setSelectedChildId] = useState<number | undefined>(undefined);

  const { data: children } = useQuery({
    queryKey: ['parent-children'],
    queryFn: () => (isDemoUser() ? demoDataApi.parents.getChildren() : parentsApi.getChildren()),
  });

  return (
    <Container maxWidth="xl">
      <Box sx={{ py: 3 }}>
        <Typography variant="h4" gutterBottom>
          Communication Center
        </Typography>
        <Typography variant="body2" color="text.secondary" paragraph>
          Stay connected with your child&apos;s teachers and school
        </Typography>

        {children && children.length > 1 && (
          <Tabs
            value={selectedChildId || children[0]?.id}
            onChange={(_, value) => setSelectedChildId(value)}
            sx={{ mb: 3 }}
          >
            {children.map((child) => (
              <Tab
                key={child.id}
                value={child.id}
                label={`${child.first_name} ${child.last_name}`}
              />
            ))}
          </Tabs>
        )}

        <ParentCommunicationView />
      </Box>
    </Container>
  );
};

export default ParentCommunicationDashboard;
