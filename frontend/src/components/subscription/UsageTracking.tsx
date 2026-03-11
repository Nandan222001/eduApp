import {
  Card,
  CardContent,
  Box,
  Typography,
  LinearProgress,
  useTheme,
  Tooltip,
  IconButton,
  alpha,
} from '@mui/material';
import { Info as InfoIcon } from '@mui/icons-material';

interface UsageData {
  students_used: number;
  teachers_used: number;
  storage_used_gb: number;
}

interface LimitsData {
  max_users: number | null;
  max_storage_gb: number | null;
}

interface UsageTrackingProps {
  usage: UsageData;
  limits: LimitsData;
}

export default function UsageTracking({ usage, limits }: UsageTrackingProps) {
  const theme = useTheme();

  const getUsageColor = (percentage: number) => {
    if (percentage >= 90) return theme.palette.error.main;
    if (percentage >= 75) return theme.palette.warning.main;
    return theme.palette.success.main;
  };

  const studentsPercentage = limits.max_users ? (usage.students_used / limits.max_users) * 100 : 0;

  const totalUsers = usage.students_used + usage.teachers_used;
  const usersPercentage = limits.max_users ? (totalUsers / limits.max_users) * 100 : 0;

  const storagePercentage = limits.max_storage_gb
    ? (usage.storage_used_gb / limits.max_storage_gb) * 100
    : 0;

  return (
    <Card elevation={0} sx={{ border: `1px solid ${theme.palette.divider}`, height: '100%' }}>
      <CardContent>
        <Typography variant="h6" fontWeight={600} gutterBottom>
          Usage Tracking
        </Typography>
        <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
          Monitor your current usage against plan limits
        </Typography>

        <Box sx={{ mb: 3 }}>
          <Box
            sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}
          >
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
              <Typography variant="body2" color="text.secondary">
                Students
              </Typography>
              <Tooltip title="Number of active students enrolled">
                <IconButton size="small" sx={{ p: 0 }}>
                  <InfoIcon fontSize="small" />
                </IconButton>
              </Tooltip>
            </Box>
            <Typography variant="body2" fontWeight={600}>
              {usage.students_used}
              {limits.max_users ? ` / ${limits.max_users}` : ' (Unlimited)'}
            </Typography>
          </Box>
          {limits.max_users && (
            <>
              <LinearProgress
                variant="determinate"
                value={Math.min(studentsPercentage, 100)}
                sx={{
                  height: 8,
                  borderRadius: 4,
                  backgroundColor: theme.palette.grey[200],
                  '& .MuiLinearProgress-bar': {
                    backgroundColor: getUsageColor(studentsPercentage),
                  },
                }}
              />
              <Typography variant="caption" color="text.secondary">
                {studentsPercentage.toFixed(1)}% used
              </Typography>
            </>
          )}
        </Box>

        <Box sx={{ mb: 3 }}>
          <Box
            sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}
          >
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
              <Typography variant="body2" color="text.secondary">
                Total Users
              </Typography>
              <Tooltip title="Total active students and teachers">
                <IconButton size="small" sx={{ p: 0 }}>
                  <InfoIcon fontSize="small" />
                </IconButton>
              </Tooltip>
            </Box>
            <Typography variant="body2" fontWeight={600}>
              {totalUsers}
              {limits.max_users ? ` / ${limits.max_users}` : ' (Unlimited)'}
            </Typography>
          </Box>
          {limits.max_users && (
            <>
              <LinearProgress
                variant="determinate"
                value={Math.min(usersPercentage, 100)}
                sx={{
                  height: 8,
                  borderRadius: 4,
                  backgroundColor: theme.palette.grey[200],
                  '& .MuiLinearProgress-bar': {
                    backgroundColor: getUsageColor(usersPercentage),
                  },
                }}
              />
              <Typography variant="caption" color="text.secondary">
                {usersPercentage.toFixed(1)}% used
              </Typography>
            </>
          )}
        </Box>

        <Box>
          <Box
            sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}
          >
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
              <Typography variant="body2" color="text.secondary">
                Storage
              </Typography>
              <Tooltip title="Total storage used for documents, materials, etc.">
                <IconButton size="small" sx={{ p: 0 }}>
                  <InfoIcon fontSize="small" />
                </IconButton>
              </Tooltip>
            </Box>
            <Typography variant="body2" fontWeight={600}>
              {usage.storage_used_gb.toFixed(2)} GB
              {limits.max_storage_gb ? ` / ${limits.max_storage_gb} GB` : ' (Unlimited)'}
            </Typography>
          </Box>
          {limits.max_storage_gb && (
            <>
              <LinearProgress
                variant="determinate"
                value={Math.min(storagePercentage, 100)}
                sx={{
                  height: 8,
                  borderRadius: 4,
                  backgroundColor: theme.palette.grey[200],
                  '& .MuiLinearProgress-bar': {
                    backgroundColor: getUsageColor(storagePercentage),
                  },
                }}
              />
              <Typography variant="caption" color="text.secondary">
                {storagePercentage.toFixed(1)}% used
              </Typography>
            </>
          )}
        </Box>

        {(usersPercentage >= 90 || storagePercentage >= 90) && (
          <Box
            sx={{
              mt: 3,
              p: 2,
              bgcolor: alpha(theme.palette.warning.main, 0.1),
              borderRadius: 1,
            }}
          >
            <Typography variant="caption" color="warning.main" fontWeight={600}>
              ⚠️ Approaching plan limits. Consider upgrading your plan.
            </Typography>
          </Box>
        )}
      </CardContent>
    </Card>
  );
}
