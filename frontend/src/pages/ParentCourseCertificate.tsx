import React from 'react';
import { useParams } from 'react-router-dom';
import { Container, Box, CircularProgress, Alert } from '@mui/material';
import { useQuery } from '@tanstack/react-query';
import { parentEducationApi } from '@/api/parentEducation';
import { CourseCertificate } from '@/components/parentEducation/CourseCertificate';

export const ParentCourseCertificatePage: React.FC = () => {
  const { enrollmentId } = useParams<{ enrollmentId: string }>();

  const {
    data: certificate,
    isLoading,
    error,
  } = useQuery({
    queryKey: ['certificate', enrollmentId],
    queryFn: () => parentEducationApi.getCertificate(Number(enrollmentId)),
    enabled: !!enrollmentId,
  });

  if (isLoading) {
    return (
      <Container maxWidth="lg">
        <Box sx={{ display: 'flex', justifyContent: 'center', py: 8 }}>
          <CircularProgress />
        </Box>
      </Container>
    );
  }

  if (error || !certificate) {
    return (
      <Container maxWidth="lg">
        <Alert severity="error" sx={{ mt: 3 }}>
          Certificate not found or not yet issued
        </Alert>
      </Container>
    );
  }

  return (
    <Container maxWidth="lg">
      <Box sx={{ py: 4 }}>
        <CourseCertificate certificate={certificate} />
      </Box>
    </Container>
  );
};

export default ParentCourseCertificatePage;
