import React from 'react';
import {
  Box,
  Typography,
  Card,
  CardContent,
  CardActionArea,
  Grid,
  Chip,
  Alert,
} from '@mui/material';
import { Warning, Error, Schedule } from '@mui/icons-material';
import { ExpiryReminder } from '@/types/documentVault';
import { format } from 'date-fns';

interface ExpiryRemindersProps {
  reminders: ExpiryReminder[];
  onDocumentClick: (documentId: number) => void;
}

const getUrgencyColor = (daysUntilExpiry: number): 'error' | 'warning' | 'info' | 'default' => {
  if (daysUntilExpiry < 0) return 'error';
  if (daysUntilExpiry <= 7) return 'error';
  if (daysUntilExpiry <= 14) return 'warning';
  if (daysUntilExpiry <= 30) return 'info';
  return 'default';
};

const getUrgencyIcon = (daysUntilExpiry: number) => {
  if (daysUntilExpiry < 0) return <Error />;
  if (daysUntilExpiry <= 7) return <Error />;
  if (daysUntilExpiry <= 14) return <Warning />;
  return <Schedule />;
};

const getUrgencyLabel = (daysUntilExpiry: number) => {
  if (daysUntilExpiry < 0) return 'EXPIRED';
  if (daysUntilExpiry === 0) return 'EXPIRES TODAY';
  if (daysUntilExpiry === 1) return 'EXPIRES TOMORROW';
  if (daysUntilExpiry <= 7) return 'URGENT';
  if (daysUntilExpiry <= 14) return 'ACTION NEEDED';
  return 'UPCOMING';
};

export const ExpiryReminders: React.FC<ExpiryRemindersProps> = ({ reminders, onDocumentClick }) => {
  const sortedReminders = [...reminders].sort((a, b) => a.days_until_expiry - b.days_until_expiry);

  const expiredCount = reminders.filter((r) => r.days_until_expiry < 0).length;
  const urgentCount = reminders.filter(
    (r) => r.days_until_expiry >= 0 && r.days_until_expiry <= 7
  ).length;

  return (
    <Box>
      <Box sx={{ mb: 3, display: 'flex', gap: 2 }}>
        {expiredCount > 0 && (
          <Alert severity="error" sx={{ flex: 1 }}>
            <Typography variant="body2" fontWeight={600}>
              {expiredCount} document{expiredCount !== 1 ? 's' : ''} expired
            </Typography>
          </Alert>
        )}
        {urgentCount > 0 && (
          <Alert severity="warning" sx={{ flex: 1 }}>
            <Typography variant="body2" fontWeight={600}>
              {urgentCount} document{urgentCount !== 1 ? 's' : ''} expiring within 7 days
            </Typography>
          </Alert>
        )}
      </Box>

      <Grid container spacing={2}>
        {sortedReminders.map((reminder) => {
          const urgencyColor = getUrgencyColor(reminder.days_until_expiry);
          const urgencyIcon = getUrgencyIcon(reminder.days_until_expiry);
          const urgencyLabel = getUrgencyLabel(reminder.days_until_expiry);

          return (
            <Grid item xs={12} md={6} lg={4} key={reminder.id}>
              <Card
                sx={{
                  height: '100%',
                  border: urgencyColor === 'error' ? '2px solid' : '1px solid',
                  borderColor: urgencyColor === 'error' ? 'error.main' : 'divider',
                }}
              >
                <CardActionArea onClick={() => onDocumentClick(reminder.document_id)}>
                  <CardContent>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
                      <Chip
                        icon={urgencyIcon}
                        label={urgencyLabel}
                        color={
                          urgencyColor as
                            | 'default'
                            | 'primary'
                            | 'secondary'
                            | 'error'
                            | 'info'
                            | 'success'
                            | 'warning'
                        }
                        size="small"
                      />
                    </Box>

                    <Typography variant="h6" gutterBottom>
                      {reminder.document_title}
                    </Typography>

                    <Typography variant="body2" color="text.secondary" gutterBottom>
                      {reminder.child_name}
                    </Typography>

                    <Chip
                      label={reminder.document_type.replace(/_/g, ' ')}
                      size="small"
                      variant="outlined"
                      sx={{ mb: 2 }}
                    />

                    <Box
                      sx={{
                        bgcolor: 'grey.100',
                        p: 2,
                        borderRadius: 1,
                        textAlign: 'center',
                      }}
                    >
                      <Typography variant="h4" color={`${urgencyColor}.main`} fontWeight={700}>
                        {reminder.days_until_expiry < 0
                          ? Math.abs(reminder.days_until_expiry)
                          : reminder.days_until_expiry}
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        {reminder.days_until_expiry < 0
                          ? 'days overdue'
                          : reminder.days_until_expiry === 0
                            ? 'expires today'
                            : reminder.days_until_expiry === 1
                              ? 'day remaining'
                              : 'days remaining'}
                      </Typography>
                    </Box>

                    <Typography
                      variant="caption"
                      color="text.secondary"
                      display="block"
                      sx={{ mt: 2 }}
                    >
                      Expiry Date: {format(new Date(reminder.expiry_date), 'PPPP')}
                    </Typography>
                  </CardContent>
                </CardActionArea>
              </Card>
            </Grid>
          );
        })}
      </Grid>
    </Box>
  );
};
