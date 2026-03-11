import { useState } from 'react';
import {
  Card,
  CardContent,
  Box,
  Typography,
  Grid,
  Chip,
  LinearProgress,
  Button,
  Avatar,
  useTheme,
  alpha,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  DialogContentText,
  Alert,
} from '@mui/material';
import {
  CheckCircle as CheckCircleIcon,
  Cancel as CancelIcon,
  AccessTime as AccessTimeIcon,
  TrendingUp as TrendingUpIcon,
  Info as InfoIcon,
} from '@mui/icons-material';
import subscriptionApi, { Subscription } from '@/api/subscription';

interface CurrentSubscriptionOverviewProps {
  subscription: Subscription;
  onRefresh: () => void;
}

export default function CurrentSubscriptionOverview({
  subscription,
  onRefresh,
}: CurrentSubscriptionOverviewProps) {
  const theme = useTheme();
  const [cancelDialogOpen, setCancelDialogOpen] = useState(false);
  const [canceling, setCanceling] = useState(false);

  const getDaysUntilRenewal = () => {
    if (!subscription.next_billing_date) return null;
    const now = new Date();
    const renewalDate = new Date(subscription.next_billing_date);
    const diffTime = renewalDate.getTime() - now.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays;
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'active':
        return <CheckCircleIcon />;
      case 'trialing':
        return <AccessTimeIcon />;
      case 'past_due':
      case 'expired':
      case 'canceled':
        return <CancelIcon />;
      default:
        return <InfoIcon />;
    }
  };

  const handleCancelSubscription = async () => {
    try {
      setCanceling(true);
      await subscriptionApi.cancelSubscription(subscription.id, false);
      setCancelDialogOpen(false);
      onRefresh();
    } catch (err) {
      console.error('Error canceling subscription:', err);
      alert('Failed to cancel subscription. Please try again.');
    } finally {
      setCanceling(false);
    }
  };

  const daysUntilRenewal = getDaysUntilRenewal();
  const renewalProgress = daysUntilRenewal ? Math.max(0, 100 - (daysUntilRenewal / 30) * 100) : 0;

  return (
    <>
      <Card elevation={0} sx={{ border: `1px solid ${theme.palette.divider}`, height: '100%' }}>
        <CardContent>
          <Box
            sx={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'flex-start',
              mb: 3,
            }}
          >
            <Box>
              <Typography variant="h6" fontWeight={600} gutterBottom>
                Current Subscription
              </Typography>
              <Typography variant="h4" fontWeight={700} color="primary" gutterBottom>
                {subscription.plan_name}
              </Typography>
              <Chip
                label={subscription.status}
                color={subscription.status === 'active' ? 'success' : 'default'}
                size="small"
                icon={getStatusIcon(subscription.status)}
                sx={{ textTransform: 'capitalize' }}
              />
            </Box>
            <Avatar
              sx={{
                bgcolor: alpha(theme.palette.primary.main, 0.1),
                color: theme.palette.primary.main,
                width: 56,
                height: 56,
              }}
            >
              <TrendingUpIcon />
            </Avatar>
          </Box>

          <Grid container spacing={3} sx={{ mb: 3 }}>
            <Grid item xs={12} sm={6}>
              <Box
                sx={{
                  p: 2,
                  border: `1px solid ${theme.palette.divider}`,
                  borderRadius: 1,
                }}
              >
                <Typography variant="body2" color="text.secondary" gutterBottom>
                  Billing Cycle
                </Typography>
                <Typography variant="h6" fontWeight={600}>
                  {subscription.billing_cycle}
                </Typography>
              </Box>
            </Grid>
            <Grid item xs={12} sm={6}>
              <Box
                sx={{
                  p: 2,
                  border: `1px solid ${theme.palette.divider}`,
                  borderRadius: 1,
                }}
              >
                <Typography variant="body2" color="text.secondary" gutterBottom>
                  Price
                </Typography>
                <Typography variant="h6" fontWeight={600}>
                  ₹{subscription.price.toLocaleString()}
                </Typography>
              </Box>
            </Grid>
            <Grid item xs={12} sm={6}>
              <Box
                sx={{
                  p: 2,
                  border: `1px solid ${theme.palette.divider}`,
                  borderRadius: 1,
                }}
              >
                <Typography variant="body2" color="text.secondary" gutterBottom>
                  Start Date
                </Typography>
                <Typography variant="body1" fontWeight={600}>
                  {new Date(subscription.start_date).toLocaleDateString()}
                </Typography>
              </Box>
            </Grid>
            <Grid item xs={12} sm={6}>
              <Box
                sx={{
                  p: 2,
                  border: `1px solid ${theme.palette.divider}`,
                  borderRadius: 1,
                }}
              >
                <Typography variant="body2" color="text.secondary" gutterBottom>
                  {subscription.end_date ? 'End Date' : 'Next Billing'}
                </Typography>
                <Typography variant="body1" fontWeight={600}>
                  {subscription.next_billing_date
                    ? new Date(subscription.next_billing_date).toLocaleDateString()
                    : subscription.end_date
                      ? new Date(subscription.end_date).toLocaleDateString()
                      : '-'}
                </Typography>
              </Box>
            </Grid>
          </Grid>

          {daysUntilRenewal !== null && subscription.status === 'active' && (
            <Box sx={{ mb: 3 }}>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                <Typography variant="body2" color="text.secondary">
                  Renewal Countdown
                </Typography>
                <Typography variant="body2" fontWeight={600}>
                  {daysUntilRenewal} days remaining
                </Typography>
              </Box>
              <LinearProgress
                variant="determinate"
                value={renewalProgress}
                sx={{ height: 8, borderRadius: 4 }}
              />
            </Box>
          )}

          {subscription.trial_end_date && subscription.status === 'trialing' && (
            <Alert severity="info" sx={{ mb: 3 }}>
              Your trial ends on {new Date(subscription.trial_end_date).toLocaleDateString()}
            </Alert>
          )}

          <Box sx={{ display: 'flex', gap: 2 }}>
            {subscription.status === 'active' && (
              <Button
                variant="outlined"
                color="error"
                onClick={() => setCancelDialogOpen(true)}
                fullWidth
              >
                Cancel Subscription
              </Button>
            )}
            {(subscription.status === 'expired' || subscription.status === 'canceled') && (
              <Button variant="contained" color="primary" fullWidth>
                Renew Subscription
              </Button>
            )}
          </Box>
        </CardContent>
      </Card>

      <Dialog open={cancelDialogOpen} onClose={() => setCancelDialogOpen(false)}>
        <DialogTitle>Cancel Subscription</DialogTitle>
        <DialogContent>
          <DialogContentText>
            Are you sure you want to cancel your subscription? You will continue to have access
            until{' '}
            {subscription.next_billing_date
              ? new Date(subscription.next_billing_date).toLocaleDateString()
              : 'the end of the current billing period'}
            .
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setCancelDialogOpen(false)}>Keep Subscription</Button>
          <Button onClick={handleCancelSubscription} color="error" disabled={canceling}>
            {canceling ? 'Canceling...' : 'Cancel Subscription'}
          </Button>
        </DialogActions>
      </Dialog>
    </>
  );
}
