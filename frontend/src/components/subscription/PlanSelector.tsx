import { useState } from 'react';
import {
  Box,
  Typography,
  Grid,
  Card,
  CardContent,
  Button,
  Chip,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  ToggleButtonGroup,
  ToggleButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  useTheme,
  alpha,
} from '@mui/material';
import {
  Check as CheckIcon,
  Close as CloseIcon,
  TrendingUp as TrendingUpIcon,
  TrendingDown as TrendingDownIcon,
} from '@mui/icons-material';
import subscriptionApi, { Subscription, Plan } from '@/api/subscription';

interface PlanSelectorProps {
  currentPlan: Subscription;
  availablePlans: Plan[];
  onPlanChange: () => void;
}

export default function PlanSelector({
  currentPlan,
  availablePlans,
  onPlanChange,
}: PlanSelectorProps) {
  const theme = useTheme();
  const [billingCycle, setBillingCycle] = useState<'monthly' | 'quarterly' | 'yearly'>('monthly');
  const [selectedPlan, setSelectedPlan] = useState<Plan | null>(null);
  const [confirmDialogOpen, setConfirmDialogOpen] = useState(false);
  const [comparisonOpen, setComparisonOpen] = useState(false);
  const [upgrading, setUpgrading] = useState(false);

  const handleBillingCycleChange = (
    _: React.MouseEvent<HTMLElement>,
    newCycle: 'monthly' | 'quarterly' | 'yearly'
  ) => {
    if (newCycle !== null) {
      setBillingCycle(newCycle);
    }
  };

  const getPlanPrice = (plan: Plan) => {
    switch (billingCycle) {
      case 'monthly':
        return plan.monthly_price;
      case 'quarterly':
        return plan.quarterly_price;
      case 'yearly':
        return plan.yearly_price;
      default:
        return plan.monthly_price;
    }
  };

  const handleSelectPlan = (plan: Plan) => {
    setSelectedPlan(plan);
    setConfirmDialogOpen(true);
  };

  const handleConfirmPlanChange = async () => {
    if (!selectedPlan) return;

    try {
      setUpgrading(true);
      const isUpgrade = getPlanPrice(selectedPlan) > currentPlan.price;

      if (isUpgrade) {
        await subscriptionApi.upgradeSubscription(currentPlan.id, {
          new_plan_name: selectedPlan.name,
          billing_cycle: billingCycle,
        });
      } else {
        await subscriptionApi.downgradeSubscription(currentPlan.id, {
          new_plan_name: selectedPlan.name,
          billing_cycle: billingCycle,
        });
      }

      setConfirmDialogOpen(false);
      setSelectedPlan(null);
      onPlanChange();
    } catch (err) {
      console.error('Error changing plan:', err);
      alert('Failed to change plan. Please try again.');
    } finally {
      setUpgrading(false);
    }
  };

  const isPlanCurrent = (plan: Plan) => {
    return plan.name === currentPlan.plan_name;
  };

  const getPlanChangeType = (plan: Plan) => {
    const currentPrice = currentPlan.price;
    const newPrice = getPlanPrice(plan);

    if (newPrice > currentPrice) return 'upgrade';
    if (newPrice < currentPrice) return 'downgrade';
    return 'current';
  };

  return (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h6" fontWeight={600}>
          Choose Your Plan
        </Typography>
        <Button variant="outlined" size="small" onClick={() => setComparisonOpen(true)}>
          Compare Features
        </Button>
      </Box>

      <Box sx={{ display: 'flex', justifyContent: 'center', mb: 4 }}>
        <ToggleButtonGroup
          value={billingCycle}
          exclusive
          onChange={handleBillingCycleChange}
          aria-label="billing cycle"
        >
          <ToggleButton value="monthly" aria-label="monthly">
            Monthly
          </ToggleButton>
          <ToggleButton value="quarterly" aria-label="quarterly">
            Quarterly
            <Chip label="Save 10%" size="small" color="success" sx={{ ml: 1 }} />
          </ToggleButton>
          <ToggleButton value="yearly" aria-label="yearly">
            Yearly
            <Chip label="Save 20%" size="small" color="success" sx={{ ml: 1 }} />
          </ToggleButton>
        </ToggleButtonGroup>
      </Box>

      <Grid container spacing={3}>
        {availablePlans.map((plan) => {
          const planChangeType = getPlanChangeType(plan);
          const isCurrentPlan = isPlanCurrent(plan);
          const price = getPlanPrice(plan);

          return (
            <Grid item xs={12} md={4} key={plan.name}>
              <Card
                elevation={isCurrentPlan ? 4 : 0}
                sx={{
                  border: `2px solid ${isCurrentPlan ? theme.palette.primary.main : theme.palette.divider}`,
                  height: '100%',
                  display: 'flex',
                  flexDirection: 'column',
                  position: 'relative',
                  transition: 'all 0.3s ease',
                  '&:hover': {
                    transform: isCurrentPlan ? 'none' : 'translateY(-4px)',
                    boxShadow: isCurrentPlan ? 4 : 8,
                  },
                }}
              >
                {isCurrentPlan && (
                  <Chip
                    label="Current Plan"
                    color="primary"
                    size="small"
                    sx={{
                      position: 'absolute',
                      top: 16,
                      right: 16,
                    }}
                  />
                )}
                <CardContent sx={{ flexGrow: 1, display: 'flex', flexDirection: 'column' }}>
                  <Typography variant="h6" fontWeight={600} gutterBottom>
                    {plan.display_name}
                  </Typography>
                  <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                    {plan.description}
                  </Typography>
                  <Box sx={{ mb: 3 }}>
                    <Typography variant="h3" fontWeight={700} component="span">
                      ₹{price.toLocaleString()}
                    </Typography>
                    <Typography variant="body2" color="text.secondary" component="span">
                      /
                      {billingCycle === 'monthly'
                        ? 'mo'
                        : billingCycle === 'quarterly'
                          ? 'qtr'
                          : 'yr'}
                    </Typography>
                  </Box>

                  <List dense sx={{ mb: 2, flexGrow: 1 }}>
                    {plan.features.slice(0, 5).map((feature, index) => (
                      <ListItem key={index} sx={{ px: 0 }}>
                        <ListItemIcon sx={{ minWidth: 32 }}>
                          <CheckIcon color="success" fontSize="small" />
                        </ListItemIcon>
                        <ListItemText
                          primary={feature}
                          primaryTypographyProps={{ variant: 'body2' }}
                        />
                      </ListItem>
                    ))}
                    {plan.max_users && (
                      <ListItem sx={{ px: 0 }}>
                        <ListItemIcon sx={{ minWidth: 32 }}>
                          <CheckIcon color="success" fontSize="small" />
                        </ListItemIcon>
                        <ListItemText
                          primary={`Up to ${plan.max_users} users`}
                          primaryTypographyProps={{ variant: 'body2' }}
                        />
                      </ListItem>
                    )}
                    {plan.max_storage_gb && (
                      <ListItem sx={{ px: 0 }}>
                        <ListItemIcon sx={{ minWidth: 32 }}>
                          <CheckIcon color="success" fontSize="small" />
                        </ListItemIcon>
                        <ListItemText
                          primary={`${plan.max_storage_gb} GB storage`}
                          primaryTypographyProps={{ variant: 'body2' }}
                        />
                      </ListItem>
                    )}
                  </List>

                  {!isCurrentPlan && (
                    <Button
                      variant={planChangeType === 'upgrade' ? 'contained' : 'outlined'}
                      fullWidth
                      onClick={() => handleSelectPlan(plan)}
                      startIcon={
                        planChangeType === 'upgrade' ? <TrendingUpIcon /> : <TrendingDownIcon />
                      }
                    >
                      {planChangeType === 'upgrade' ? 'Upgrade' : 'Downgrade'}
                    </Button>
                  )}
                </CardContent>
              </Card>
            </Grid>
          );
        })}
      </Grid>

      <Dialog
        open={confirmDialogOpen}
        onClose={() => setConfirmDialogOpen(false)}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>
          {selectedPlan && getPlanChangeType(selectedPlan) === 'upgrade' ? 'Upgrade' : 'Downgrade'}{' '}
          Plan
        </DialogTitle>
        <DialogContent>
          {selectedPlan && (
            <Box>
              <Typography variant="body1" gutterBottom>
                You are about to{' '}
                {getPlanChangeType(selectedPlan) === 'upgrade' ? 'upgrade' : 'downgrade'} to the{' '}
                <strong>{selectedPlan.display_name}</strong> plan.
              </Typography>
              <Box
                sx={{
                  my: 2,
                  p: 2,
                  bgcolor: alpha(theme.palette.primary.main, 0.1),
                  borderRadius: 1,
                }}
              >
                <Typography variant="h6" fontWeight={600}>
                  New price: ₹{getPlanPrice(selectedPlan).toLocaleString()}/{billingCycle}
                </Typography>
              </Box>
              {getPlanChangeType(selectedPlan) === 'upgrade' && (
                <Typography variant="body2" color="text.secondary">
                  You will be charged a prorated amount for the remainder of your current billing
                  cycle.
                </Typography>
              )}
              {getPlanChangeType(selectedPlan) === 'downgrade' && (
                <Typography variant="body2" color="text.secondary">
                  The change will take effect at the end of your current billing cycle.
                </Typography>
              )}
            </Box>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setConfirmDialogOpen(false)}>Cancel</Button>
          <Button onClick={handleConfirmPlanChange} variant="contained" disabled={upgrading}>
            {upgrading ? 'Processing...' : 'Confirm'}
          </Button>
        </DialogActions>
      </Dialog>

      <Dialog
        open={comparisonOpen}
        onClose={() => setComparisonOpen(false)}
        maxWidth="lg"
        fullWidth
      >
        <DialogTitle>Feature Comparison</DialogTitle>
        <DialogContent>
          <TableContainer>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell>Feature</TableCell>
                  {availablePlans.map((plan) => (
                    <TableCell key={plan.name} align="center">
                      {plan.display_name}
                    </TableCell>
                  ))}
                </TableRow>
              </TableHead>
              <TableBody>
                <TableRow>
                  <TableCell>Max Users</TableCell>
                  {availablePlans.map((plan) => (
                    <TableCell key={plan.name} align="center">
                      {plan.max_users || 'Unlimited'}
                    </TableCell>
                  ))}
                </TableRow>
                <TableRow>
                  <TableCell>Storage</TableCell>
                  {availablePlans.map((plan) => (
                    <TableCell key={plan.name} align="center">
                      {plan.max_storage_gb ? `${plan.max_storage_gb} GB` : 'Unlimited'}
                    </TableCell>
                  ))}
                </TableRow>
                {availablePlans[0].features.map((_, featureIndex) => (
                  <TableRow key={featureIndex}>
                    <TableCell>
                      {availablePlans.find((p) => p.features[featureIndex])?.features[featureIndex]}
                    </TableCell>
                    {availablePlans.map((plan) => (
                      <TableCell key={plan.name} align="center">
                        {plan.features[featureIndex] ? (
                          <CheckIcon color="success" />
                        ) : (
                          <CloseIcon color="error" />
                        )}
                      </TableCell>
                    ))}
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setComparisonOpen(false)}>Close</Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
