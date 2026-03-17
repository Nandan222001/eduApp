import {
  Card,
  CardContent,
  Typography,
  Box,
  Chip,
  Divider,
  Alert,
} from '@mui/material';
import {
  CheckCircle as ApprovedIcon,
  Cancel as DeniedIcon,
  HourglassEmpty as PendingIcon,
  Warning as WarningIcon,
} from '@mui/icons-material';
import { WorkPermit } from '@/types/employment';

interface WorkPermitCardProps {
  permit: WorkPermit;
}

export default function WorkPermitCard({ permit }: WorkPermitCardProps) {
  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'approved':
        return <ApprovedIcon sx={{ color: 'success.main' }} />;
      case 'denied':
        return <DeniedIcon sx={{ color: 'error.main' }} />;
      case 'expired':
        return <WarningIcon sx={{ color: 'warning.main' }} />;
      default:
        return <PendingIcon sx={{ color: 'info.main' }} />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'approved':
        return 'success';
      case 'denied':
        return 'error';
      case 'expired':
        return 'warning';
      default:
        return 'info';
    }
  };

  const getExpiryWarning = (expiryDate: string) => {
    const expiry = new Date(expiryDate);
    const today = new Date();
    const daysUntilExpiry = Math.ceil((expiry.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));

    if (daysUntilExpiry < 0) {
      return { severity: 'error' as const, message: 'Expired' };
    } else if (daysUntilExpiry <= 30) {
      return { severity: 'warning' as const, message: `Expires in ${daysUntilExpiry} days` };
    }
    return null;
  };

  const expiryWarning = getExpiryWarning(permit.expiry_date);

  return (
    <Card>
      <CardContent>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start', mb: 2 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            {getStatusIcon(permit.school_authorization_status)}
            <Chip
              label={permit.school_authorization_status.toUpperCase()}
              color={getStatusColor(permit.school_authorization_status) as any}
              size="small"
            />
          </Box>
          {permit.parent_consent && (
            <Chip label="Parent Consent ✓" color="success" size="small" variant="outlined" />
          )}
        </Box>

        <Typography variant="h6" fontWeight={600} gutterBottom>
          {permit.employer_name || 'General Work Permit'}
        </Typography>

        {permit.permit_number && (
          <Typography variant="body2" color="text.secondary" gutterBottom>
            Permit #: {permit.permit_number}
          </Typography>
        )}

        <Divider sx={{ my: 2 }} />

        <Box sx={{ mb: 2 }}>
          <Typography variant="body2" color="text.secondary">
            Max Hours per Week
          </Typography>
          <Typography variant="body1" fontWeight={600}>
            {permit.max_hours_per_week} hours
          </Typography>
        </Box>

        <Box sx={{ mb: 2 }}>
          <Typography variant="body2" color="text.secondary">
            Valid Period
          </Typography>
          <Typography variant="body2">
            {new Date(permit.issue_date).toLocaleDateString()} -{' '}
            {new Date(permit.expiry_date).toLocaleDateString()}
          </Typography>
        </Box>

        {expiryWarning && (
          <Alert severity={expiryWarning.severity} sx={{ mt: 2 }}>
            {expiryWarning.message}
          </Alert>
        )}

        {permit.restrictions && (
          <Box sx={{ mt: 2 }}>
            <Typography variant="body2" color="text.secondary">
              Restrictions
            </Typography>
            <Typography variant="body2">{permit.restrictions}</Typography>
          </Box>
        )}
      </CardContent>
    </Card>
  );
}
