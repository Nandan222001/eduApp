import {
  Card,
  CardContent,
  Typography,
  Box,
  Chip,
  Divider,
  Grid,
  Alert,
  Button,
} from '@mui/material';
import {
  CheckCircle as VerifiedIcon,
} from '@mui/icons-material';
import { StudentEmployment } from '@/types/employment';

interface EmploymentCardProps {
  employment: StudentEmployment;
  onRequestReference?: (employment: StudentEmployment) => void;
}

export default function EmploymentCard({ employment, onRequestReference }: EmploymentCardProps) {
  const getJobTypeColor = (type: string) => {
    switch (type) {
      case 'part_time':
        return 'primary';
      case 'seasonal':
        return 'secondary';
      case 'internship':
        return 'success';
      case 'volunteer':
        return 'info';
      default:
        return 'default';
    }
  };

  return (
    <Card variant="outlined">
      <CardContent>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start', mb: 2 }}>
          <Box>
            <Typography variant="h6" fontWeight={600}>
              {employment.job_title}
            </Typography>
            <Typography variant="body2" color="text.secondary">
              {employment.employer}
            </Typography>
          </Box>
          <Chip
            label={employment.job_type.replace('_', ' ').toUpperCase()}
            color={getJobTypeColor(employment.job_type) as any}
            size="small"
          />
        </Box>

        <Divider sx={{ my: 2 }} />

        <Grid container spacing={2}>
          {employment.hours_per_week && (
            <Grid item xs={6}>
              <Typography variant="body2" color="text.secondary">
                Hours/Week
              </Typography>
              <Typography variant="body1" fontWeight={600}>
                {employment.hours_per_week}
              </Typography>
            </Grid>
          )}
          {employment.hourly_pay && (
            <Grid item xs={6}>
              <Typography variant="body2" color="text.secondary">
                Hourly Pay
              </Typography>
              <Typography variant="body1" fontWeight={600}>
                ${employment.hourly_pay}
              </Typography>
            </Grid>
          )}
          <Grid item xs={6}>
            <Typography variant="body2" color="text.secondary">
              Start Date
            </Typography>
            <Typography variant="body2">
              {new Date(employment.start_date).toLocaleDateString()}
            </Typography>
          </Grid>
          {employment.total_hours_worked && (
            <Grid item xs={6}>
              <Typography variant="body2" color="text.secondary">
                Total Hours
              </Typography>
              <Typography variant="body2">{employment.total_hours_worked}</Typography>
            </Grid>
          )}
        </Grid>

        {employment.supervisor_name && (
          <Box sx={{ mt: 2 }}>
            <Typography variant="body2" color="text.secondary">
              Supervisor
            </Typography>
            <Typography variant="body2">{employment.supervisor_name}</Typography>
          </Box>
        )}

        {employment.verified_for_graduation && (
          <Alert severity="success" sx={{ mt: 2 }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <VerifiedIcon fontSize="small" />
              Verified for Graduation
            </Box>
          </Alert>
        )}

        {onRequestReference && (
          <Box sx={{ mt: 2, display: 'flex', gap: 1 }}>
            <Button size="small" variant="outlined" fullWidth onClick={() => onRequestReference(employment)}>
              Request Reference
            </Button>
          </Box>
        )}
      </CardContent>
    </Card>
  );
}
