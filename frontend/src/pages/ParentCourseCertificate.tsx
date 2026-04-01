import React from 'react';
import { useParams } from 'react-router-dom';
import { Container, Box, CircularProgress, Alert } from '@mui/material';
import { useQuery } from '@tanstack/react-query';
import { parentEducationApi } from '@/api/parentEducation';
import { CourseCertificate } from '@/components/parentEducation/CourseCertificate';
import { Certificate } from '@/types/parentEducation';
import { useAuthStore } from '@/store/useAuthStore';

export const ParentCourseCertificatePage: React.FC = () => {
  const { enrollmentId } = useParams<{ enrollmentId: string }>();
  const { user } = useAuthStore();

  const {
    data: enrollment,
    isLoading,
    error,
  } = useQuery({
    queryKey: ['enrollment', enrollmentId],
    queryFn: () => parentEducationApi.getEnrollment(Number(enrollmentId)),
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

  if (error) {
    return (
      <Container maxWidth="lg">
        <Alert severity="error" sx={{ mt: 3 }}>
          Failed to load certificate
        </Alert>
      </Container>
    );
  }

  if (!enrollment) {
    return (
      <Container maxWidth="lg">
        <Alert severity="error" sx={{ mt: 3 }}>
          Enrollment not found
        </Alert>
      </Container>
    );
  }

  // Check if course is completed and certificate is earned
  if (enrollment.status !== 'completed' || !enrollment.certificate_url) {
    return (
      <Container maxWidth="lg">
        <Alert severity="warning" sx={{ mt: 3 }}>
          Certificate not yet issued. Please complete the course to earn your certificate.
        </Alert>
      </Container>
    );
  }

  // Construct the Certificate object from enrollment data
  const certificate: Certificate = {
    id: enrollment.id,
    enrollment_id: enrollment.id,
    parent_name:
      user?.fullName || `${user?.firstName || ''} ${user?.lastName || ''}`.trim() || 'Parent',
    course_title: enrollment.course?.title || 'Course',
    completion_date: enrollment.completed_at || new Date().toISOString(),
    certificate_url: enrollment.certificate_url,
    verification_code: `CERT-${enrollment.id}-${enrollment.course_id}`,
    issued_at: enrollment.completed_at || new Date().toISOString(),
  };

  return (
    <Container maxWidth="lg">
      <Box sx={{ py: 4 }}>
        <CourseCertificate certificate={certificate} />
      </Box>
    </Container>
  );
};

export default ParentCourseCertificatePage;
