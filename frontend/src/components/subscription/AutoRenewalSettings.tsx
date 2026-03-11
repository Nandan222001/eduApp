import { useState } from 'react';
import {
  Box,
  Typography,
  Card,
  CardContent,
  Switch,
  FormControlLabel,
  FormControl,
  FormLabel,
  RadioGroup,
  Radio,
  Button,
  Divider,
  Alert,
  useTheme,
} from '@mui/material';
import { Save as SaveIcon } from '@mui/icons-material';
import subscriptionApi, { Subscription } from '@/api/subscription';

interface AutoRenewalSettingsProps {
  subscription: Subscription;
  onUpdate: () => void;
}

export default function AutoRenewalSettings({ subscription, onUpdate }: AutoRenewalSettingsProps) {
  const theme = useTheme();
  const [autoRenew, setAutoRenew] = useState(subscription.auto_renew);
  const [reminderDays, setReminderDays] = useState(7);
  const [saving, setSaving] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);

  const handleSave = async () => {
    try {
      setSaving(true);
      await subscriptionApi.updateSubscription(subscription.id, {
        auto_renew: autoRenew,
        reminder_days: reminderDays,
      });
      setShowSuccess(true);
      setTimeout(() => setShowSuccess(false), 3000);
      onUpdate();
    } catch (err) {
      console.error('Error updating settings:', err);
      alert('Failed to update settings. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <Box>
      <Typography variant="h6" fontWeight={600} sx={{ mb: 3 }}>
        Auto-Renewal & Payment Reminders
      </Typography>

      <Card elevation={0} sx={{ border: `1px solid ${theme.palette.divider}`, mb: 3 }}>
        <CardContent>
          <Box sx={{ mb: 3 }}>
            <FormControlLabel
              control={
                <Switch
                  checked={autoRenew}
                  onChange={(e) => setAutoRenew(e.target.checked)}
                  color="primary"
                />
              }
              label={
                <Box>
                  <Typography variant="body1" fontWeight={600}>
                    Enable Auto-Renewal
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Automatically renew your subscription at the end of each billing cycle
                  </Typography>
                </Box>
              }
            />
          </Box>

          {autoRenew && (
            <Alert severity="info" sx={{ mb: 2 }}>
              Your subscription will automatically renew on{' '}
              {subscription.next_billing_date
                ? new Date(subscription.next_billing_date).toLocaleDateString()
                : 'the next billing date'}
              . You will be charged ₹{subscription.price.toLocaleString()} to your default payment
              method.
            </Alert>
          )}

          {!autoRenew && (
            <Alert severity="warning">
              Your subscription will not renew automatically. You will need to manually renew before{' '}
              {subscription.end_date
                ? new Date(subscription.end_date).toLocaleDateString()
                : 'the end date'}{' '}
              to avoid service interruption.
            </Alert>
          )}
        </CardContent>
      </Card>

      <Card elevation={0} sx={{ border: `1px solid ${theme.palette.divider}`, mb: 3 }}>
        <CardContent>
          <FormControl component="fieldset">
            <FormLabel component="legend" sx={{ mb: 2 }}>
              <Typography variant="body1" fontWeight={600}>
                Payment Reminder
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Receive a reminder email before your next billing date
              </Typography>
            </FormLabel>
            <RadioGroup
              value={reminderDays}
              onChange={(e) => setReminderDays(Number(e.target.value))}
            >
              <FormControlLabel value={3} control={<Radio />} label="3 days before" />
              <FormControlLabel value={7} control={<Radio />} label="7 days before" />
              <FormControlLabel value={14} control={<Radio />} label="14 days before" />
              <FormControlLabel value={30} control={<Radio />} label="30 days before" />
              <FormControlLabel value={0} control={<Radio />} label="No reminder" />
            </RadioGroup>
          </FormControl>
        </CardContent>
      </Card>

      <Card elevation={0} sx={{ border: `1px solid ${theme.palette.divider}` }}>
        <CardContent>
          <Typography variant="body1" fontWeight={600} gutterBottom>
            Subscription Details
          </Typography>
          <Divider sx={{ my: 2 }} />
          <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
            <Typography variant="body2" color="text.secondary">
              Current Plan
            </Typography>
            <Typography variant="body2" fontWeight={600}>
              {subscription.plan_name}
            </Typography>
          </Box>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
            <Typography variant="body2" color="text.secondary">
              Billing Cycle
            </Typography>
            <Typography variant="body2" fontWeight={600}>
              {subscription.billing_cycle}
            </Typography>
          </Box>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
            <Typography variant="body2" color="text.secondary">
              Price
            </Typography>
            <Typography variant="body2" fontWeight={600}>
              ₹{subscription.price.toLocaleString()}
            </Typography>
          </Box>
          {subscription.next_billing_date && (
            <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
              <Typography variant="body2" color="text.secondary">
                Next Billing Date
              </Typography>
              <Typography variant="body2" fontWeight={600}>
                {new Date(subscription.next_billing_date).toLocaleDateString()}
              </Typography>
            </Box>
          )}
        </CardContent>
      </Card>

      <Box sx={{ mt: 3, display: 'flex', gap: 2, alignItems: 'center' }}>
        <Button variant="contained" startIcon={<SaveIcon />} onClick={handleSave} disabled={saving}>
          {saving ? 'Saving...' : 'Save Settings'}
        </Button>
        {showSuccess && (
          <Alert severity="success" sx={{ py: 0 }}>
            Settings saved successfully
          </Alert>
        )}
      </Box>
    </Box>
  );
}
