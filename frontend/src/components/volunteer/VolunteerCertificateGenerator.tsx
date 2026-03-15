import React, { useRef } from 'react';
import {
  Box,
  Typography,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Divider,
  Stack,
} from '@mui/material';
import type { VolunteerCertificate } from '@/types/volunteer';

interface VolunteerCertificateGeneratorProps {
  certificate: VolunteerCertificate;
}

export const VolunteerCertificateGenerator: React.FC<VolunteerCertificateGeneratorProps> = ({
  certificate,
}) => {
  const certificateRef = useRef<HTMLDivElement>(null);

  return (
    <Paper
      ref={certificateRef}
      elevation={0}
      sx={{
        p: 6,
        bgcolor: 'white',
        border: '8px double',
        borderColor: 'primary.main',
        position: 'relative',
        minHeight: '800px',
      }}
    >
      <Box
        sx={{
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          opacity: 0.05,
          backgroundImage: certificate.school_logo ? `url(${certificate.school_logo})` : 'none',
          backgroundRepeat: 'no-repeat',
          backgroundPosition: 'center',
          backgroundSize: '400px',
          pointerEvents: 'none',
        }}
      />

      <Box sx={{ position: 'relative', zIndex: 1 }}>
        {certificate.school_logo && (
          <Box sx={{ textAlign: 'center', mb: 3 }}>
            <img
              src={certificate.school_logo}
              alt="School Logo"
              style={{ height: '80px', objectFit: 'contain' }}
            />
          </Box>
        )}

        <Typography
          variant="h3"
          align="center"
          fontWeight={700}
          color="primary"
          gutterBottom
          sx={{ fontFamily: 'serif' }}
        >
          Certificate of Appreciation
        </Typography>

        <Typography variant="h6" align="center" color="text.secondary" gutterBottom sx={{ mb: 4 }}>
          Volunteer Service Recognition
        </Typography>

        <Divider sx={{ mb: 4 }} />

        <Typography variant="body1" align="center" sx={{ mb: 2 }}>
          This certificate is proudly presented to
        </Typography>

        <Typography
          variant="h4"
          align="center"
          fontWeight={700}
          sx={{ mb: 4, fontFamily: 'serif', textDecoration: 'underline' }}
        >
          {certificate.parent_name}
        </Typography>

        <Typography variant="body1" align="center" sx={{ mb: 4, lineHeight: 1.8 }}>
          In recognition of outstanding volunteer service and dedication to our school community.
          Your generous contribution of time and effort has made a significant positive impact on
          our students and school programs.
        </Typography>

        <Box sx={{ my: 4, p: 3, bgcolor: 'grey.50', borderRadius: 2 }}>
          <Typography variant="h5" align="center" fontWeight={600} color="primary" gutterBottom>
            Total Volunteer Hours: {certificate.total_hours}
          </Typography>
          <Typography variant="body2" align="center" color="text.secondary">
            Academic Year {certificate.academic_year}
          </Typography>
        </Box>

        {certificate.activities_breakdown && certificate.activities_breakdown.length > 0 && (
          <Box sx={{ mb: 4 }}>
            <Typography variant="h6" gutterBottom fontWeight={600} align="center" sx={{ mb: 2 }}>
              Activities Breakdown
            </Typography>
            <TableContainer>
              <Table size="small">
                <TableHead>
                  <TableRow>
                    <TableCell>
                      <strong>Activity Type</strong>
                    </TableCell>
                    <TableCell align="right">
                      <strong>Hours</strong>
                    </TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {certificate.activities_breakdown.map((activity, index) => (
                    <TableRow key={index}>
                      <TableCell>{activity.activity_type}</TableCell>
                      <TableCell align="right">{activity.hours}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          </Box>
        )}

        <Divider sx={{ my: 4 }} />

        <Stack direction="row" justifyContent="space-between" alignItems="flex-end" sx={{ mt: 6 }}>
          <Box sx={{ textAlign: 'center', minWidth: 200 }}>
            <Typography variant="body2" color="text.secondary" gutterBottom>
              Issue Date
            </Typography>
            <Typography variant="body1" fontWeight={600}>
              {new Date(certificate.issue_date).toLocaleDateString('en-US', {
                year: 'numeric',
                month: 'long',
                day: 'numeric',
              })}
            </Typography>
          </Box>

          <Box sx={{ textAlign: 'center', minWidth: 250 }}>
            {certificate.principal_signature && (
              <Box sx={{ mb: 1 }}>
                <img
                  src={certificate.principal_signature}
                  alt="Principal Signature"
                  style={{ height: '50px', objectFit: 'contain' }}
                />
              </Box>
            )}
            <Divider sx={{ mb: 1 }} />
            <Typography variant="body1" fontWeight={600}>
              {certificate.principal_name}
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Principal
            </Typography>
          </Box>
        </Stack>

        <Box sx={{ mt: 4, textAlign: 'center' }}>
          <Typography variant="caption" color="text.secondary">
            Certificate ID: {certificate.certificate_id}
          </Typography>
        </Box>
      </Box>
    </Paper>
  );
};

export default VolunteerCertificateGenerator;
