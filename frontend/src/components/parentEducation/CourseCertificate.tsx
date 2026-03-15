import React, { useRef } from 'react';
import { Box, Paper, Typography, Button, Divider, alpha, useTheme } from '@mui/material';
import {
  Download as DownloadIcon,
  Print as PrintIcon,
  VerifiedUser as VerifiedIcon,
} from '@mui/icons-material';
import { Certificate } from '@/types/parentEducation';

interface CourseCertificateProps {
  certificate: Certificate;
  institutionName?: string;
  institutionLogo?: string;
}

export const CourseCertificate: React.FC<CourseCertificateProps> = ({
  certificate,
  institutionName = 'Learning Institute',
  institutionLogo,
}) => {
  const theme = useTheme();
  const certificateRef = useRef<HTMLDivElement>(null);

  const handlePrint = () => {
    window.print();
  };

  const handleDownload = async () => {
    if (certificate.certificate_url) {
      window.open(certificate.certificate_url, '_blank');
    }
  };

  return (
    <Box>
      {/* Actions */}
      <Box sx={{ display: 'flex', gap: 2, mb: 3, justifyContent: 'center' }}>
        <Button variant="outlined" startIcon={<PrintIcon />} onClick={handlePrint}>
          Print
        </Button>
        <Button variant="contained" startIcon={<DownloadIcon />} onClick={handleDownload}>
          Download PDF
        </Button>
      </Box>

      {/* Certificate */}
      <Paper
        ref={certificateRef}
        elevation={3}
        sx={{
          p: 6,
          maxWidth: 900,
          mx: 'auto',
          background: `linear-gradient(135deg, ${alpha(theme.palette.primary.main, 0.05)} 0%, ${alpha(theme.palette.secondary.main, 0.05)} 100%)`,
          border: `8px solid ${theme.palette.primary.main}`,
          borderRadius: 2,
          position: 'relative',
          overflow: 'hidden',
          '@media print': {
            border: `4px solid ${theme.palette.primary.main}`,
            p: 4,
          },
        }}
      >
        {/* Decorative Corners */}
        <Box
          sx={{
            position: 'absolute',
            top: 0,
            left: 0,
            width: 100,
            height: 100,
            borderTop: `4px solid ${theme.palette.secondary.main}`,
            borderLeft: `4px solid ${theme.palette.secondary.main}`,
          }}
        />
        <Box
          sx={{
            position: 'absolute',
            top: 0,
            right: 0,
            width: 100,
            height: 100,
            borderTop: `4px solid ${theme.palette.secondary.main}`,
            borderRight: `4px solid ${theme.palette.secondary.main}`,
          }}
        />
        <Box
          sx={{
            position: 'absolute',
            bottom: 0,
            left: 0,
            width: 100,
            height: 100,
            borderBottom: `4px solid ${theme.palette.secondary.main}`,
            borderLeft: `4px solid ${theme.palette.secondary.main}`,
          }}
        />
        <Box
          sx={{
            position: 'absolute',
            bottom: 0,
            right: 0,
            width: 100,
            height: 100,
            borderBottom: `4px solid ${theme.palette.secondary.main}`,
            borderRight: `4px solid ${theme.palette.secondary.main}`,
          }}
        />

        {/* Content */}
        <Box sx={{ textAlign: 'center', position: 'relative', zIndex: 1 }}>
          {/* Logo */}
          {institutionLogo && (
            <Box
              component="img"
              src={institutionLogo}
              alt={institutionName}
              sx={{ height: 60, mb: 2 }}
            />
          )}

          {/* Institution Name */}
          <Typography
            variant="h5"
            fontWeight={700}
            color="primary"
            gutterBottom
            sx={{ textTransform: 'uppercase', letterSpacing: 2 }}
          >
            {institutionName}
          </Typography>

          <Divider sx={{ my: 3, maxWidth: 400, mx: 'auto' }} />

          {/* Certificate Title */}
          <Typography
            variant="h3"
            fontWeight={800}
            gutterBottom
            sx={{
              fontFamily: 'Georgia, serif',
              color: theme.palette.primary.main,
              mb: 3,
            }}
          >
            Certificate of Completion
          </Typography>

          {/* Presented Text */}
          <Typography variant="h6" color="text.secondary" gutterBottom sx={{ fontStyle: 'italic' }}>
            This is to certify that
          </Typography>

          {/* Parent Name */}
          <Typography
            variant="h4"
            fontWeight={700}
            gutterBottom
            sx={{
              my: 3,
              py: 2,
              borderBottom: `2px solid ${theme.palette.divider}`,
              borderTop: `2px solid ${theme.palette.divider}`,
              fontFamily: 'Georgia, serif',
            }}
          >
            {certificate.parent_name}
          </Typography>

          {/* Completion Text */}
          <Typography variant="h6" color="text.secondary" gutterBottom>
            has successfully completed the course
          </Typography>

          {/* Course Title */}
          <Typography variant="h5" fontWeight={700} color="primary" gutterBottom sx={{ my: 3 }}>
            {certificate.course_title}
          </Typography>

          {/* Completion Date */}
          <Typography variant="body1" color="text.secondary" gutterBottom sx={{ mb: 4 }}>
            on{' '}
            {new Date(certificate.completion_date).toLocaleDateString('en-US', {
              year: 'numeric',
              month: 'long',
              day: 'numeric',
            })}
          </Typography>

          <Divider sx={{ my: 4, maxWidth: 600, mx: 'auto' }} />

          {/* Verification */}
          <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: 1 }}>
            <VerifiedIcon color="primary" />
            <Typography variant="caption" color="text.secondary">
              Verification Code: {certificate.verification_code}
            </Typography>
          </Box>

          {/* Issue Date */}
          <Typography variant="caption" color="text.secondary" sx={{ mt: 2, display: 'block' }}>
            Issued on: {new Date(certificate.issued_at).toLocaleDateString()}
          </Typography>
        </Box>
      </Paper>
    </Box>
  );
};

export default CourseCertificate;
