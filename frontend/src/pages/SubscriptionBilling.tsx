import { useState, useEffect } from 'react';
import { Box, Typography, Grid, Card, Tab, Tabs, CircularProgress, Alert } from '@mui/material';
import CurrentSubscriptionOverview from '@/components/subscription/CurrentSubscriptionOverview';
import SubscriptionHistory from '@/components/subscription/SubscriptionHistory';
import PlanSelector from '@/components/subscription/PlanSelector';
import PaymentMethodManagement from '@/components/subscription/PaymentMethodManagement';
import InvoiceList from '@/components/subscription/InvoiceList';
import UsageTracking from '@/components/subscription/UsageTracking';
import AddOnModules from '@/components/subscription/AddOnModules';
import AutoRenewalSettings from '@/components/subscription/AutoRenewalSettings';
import subscriptionApi, { SubscriptionData } from '@/api/subscription';

interface TabPanelProps {
  children?: React.ReactNode;
  index: number;
  value: number;
}

function TabPanel(props: TabPanelProps) {
  const { children, value, index, ...other } = props;

  return (
    <div
      role="tabpanel"
      hidden={value !== index}
      id={`subscription-tabpanel-${index}`}
      aria-labelledby={`subscription-tab-${index}`}
      {...other}
    >
      {value === index && <Box sx={{ py: 3 }}>{children}</Box>}
    </div>
  );
}

export default function SubscriptionBilling() {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [subscriptionData, setSubscriptionData] = useState<SubscriptionData | null>(null);
  const [tabValue, setTabValue] = useState(0);

  useEffect(() => {
    fetchSubscriptionData();
  }, []);

  const fetchSubscriptionData = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await subscriptionApi.getInstitutionSubscription();
      setSubscriptionData(data);
    } catch (err: unknown) {
      const error = err as { response?: { data?: { detail?: string } } };
      setError(error.response?.data?.detail || 'Failed to load subscription data');
    } finally {
      setLoading(false);
    }
  };

  const handleTabChange = (_event: React.SyntheticEvent, newValue: number) => {
    setTabValue(newValue);
  };

  const handleRefresh = () => {
    fetchSubscriptionData();
  };

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '60vh' }}>
        <CircularProgress />
      </Box>
    );
  }

  if (error) {
    return (
      <Box sx={{ p: 3 }}>
        <Alert severity="error">{error}</Alert>
      </Box>
    );
  }

  if (!subscriptionData) {
    return (
      <Box sx={{ p: 3 }}>
        <Alert severity="info">No subscription data available</Alert>
      </Box>
    );
  }

  return (
    <Box>
      <Box sx={{ mb: 4 }}>
        <Typography variant="h4" fontWeight={700} gutterBottom>
          Subscription & Billing
        </Typography>
        <Typography variant="body1" color="text.secondary">
          Manage your subscription, billing, and payments
        </Typography>
      </Box>

      <Grid container spacing={3} sx={{ mb: 4 }}>
        <Grid item xs={12} lg={8}>
          <CurrentSubscriptionOverview
            subscription={subscriptionData.subscription}
            onRefresh={handleRefresh}
          />
        </Grid>
        <Grid item xs={12} lg={4}>
          <UsageTracking usage={subscriptionData.usage} limits={subscriptionData.limits} />
        </Grid>
      </Grid>

      <Card elevation={0} sx={{ border: (theme) => `1px solid ${theme.palette.divider}` }}>
        <Box sx={{ borderBottom: 1, borderColor: 'divider' }}>
          <Tabs value={tabValue} onChange={handleTabChange} aria-label="subscription tabs">
            <Tab label="Change Plan" />
            <Tab label="Payment Methods" />
            <Tab label="Invoices" />
            <Tab label="Add-ons" />
            <Tab label="Settings" />
            <Tab label="History" />
          </Tabs>
        </Box>

        <TabPanel value={tabValue} index={0}>
          <PlanSelector
            currentPlan={subscriptionData.subscription}
            availablePlans={subscriptionData.availablePlans}
            onPlanChange={handleRefresh}
          />
        </TabPanel>

        <TabPanel value={tabValue} index={1}>
          <PaymentMethodManagement
            paymentMethods={subscriptionData.paymentMethods}
            onUpdate={handleRefresh}
          />
        </TabPanel>

        <TabPanel value={tabValue} index={2}>
          <InvoiceList invoices={subscriptionData.invoices} />
        </TabPanel>

        <TabPanel value={tabValue} index={3}>
          <AddOnModules
            addOns={subscriptionData.addOns}
            activeAddOns={subscriptionData.activeAddOns}
            onUpdate={handleRefresh}
          />
        </TabPanel>

        <TabPanel value={tabValue} index={4}>
          <AutoRenewalSettings
            subscription={subscriptionData.subscription}
            onUpdate={handleRefresh}
          />
        </TabPanel>

        <TabPanel value={tabValue} index={5}>
          <SubscriptionHistory history={subscriptionData.history} />
        </TabPanel>
      </Card>
    </Box>
  );
}
