import { useState } from 'react';
import {
  Box,
  Typography,
  Grid,
  Card,
  CardContent,
  Switch,
  FormControlLabel,
  Chip,
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  useTheme,
  alpha,
} from '@mui/material';
import { Check as CheckIcon } from '@mui/icons-material';
import subscriptionApi, { AddOn } from '@/api/subscription';

interface AddOnModulesProps {
  addOns: AddOn[];
  activeAddOns: number[];
  onUpdate: () => void;
}

export default function AddOnModules({ addOns, activeAddOns, onUpdate }: AddOnModulesProps) {
  const theme = useTheme();
  const [selectedAddOn, setSelectedAddOn] = useState<AddOn | null>(null);
  const [confirmDialogOpen, setConfirmDialogOpen] = useState(false);
  const [action, setAction] = useState<'enable' | 'disable'>('enable');
  const [processing, setProcessing] = useState(false);

  const isAddOnActive = (addOnId: number) => {
    return activeAddOns.includes(addOnId);
  };

  const handleToggleAddOn = (addOn: AddOn, enabled: boolean) => {
    setSelectedAddOn(addOn);
    setAction(enabled ? 'enable' : 'disable');
    setConfirmDialogOpen(true);
  };

  const handleConfirmToggle = async () => {
    if (!selectedAddOn) return;

    try {
      setProcessing(true);
      if (action === 'enable') {
        await subscriptionApi.enableAddOn(selectedAddOn.id);
      } else {
        await subscriptionApi.disableAddOn(selectedAddOn.id);
      }
      setConfirmDialogOpen(false);
      setSelectedAddOn(null);
      onUpdate();
    } catch (err) {
      console.error('Error toggling add-on:', err);
      alert('Failed to update add-on. Please try again.');
    } finally {
      setProcessing(false);
    }
  };

  return (
    <Box>
      <Typography variant="h6" fontWeight={600} sx={{ mb: 3 }}>
        Add-on Modules
      </Typography>
      <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
        Enhance your subscription with additional features and capabilities
      </Typography>

      <Grid container spacing={3}>
        {addOns.map((addOn) => {
          const isActive = isAddOnActive(addOn.id);

          return (
            <Grid item xs={12} md={6} key={addOn.id}>
              <Card
                elevation={0}
                sx={{
                  border: `2px solid ${isActive ? theme.palette.primary.main : theme.palette.divider}`,
                  height: '100%',
                  transition: 'all 0.3s ease',
                  bgcolor: isActive ? alpha(theme.palette.primary.main, 0.02) : 'background.paper',
                }}
              >
                <CardContent>
                  <Box
                    sx={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'flex-start',
                      mb: 2,
                    }}
                  >
                    <Box sx={{ flexGrow: 1 }}>
                      <Typography variant="h6" fontWeight={600} gutterBottom>
                        {addOn.name}
                      </Typography>
                      <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                        {addOn.description}
                      </Typography>
                    </Box>
                    <FormControlLabel
                      control={
                        <Switch
                          checked={isActive}
                          onChange={(e) => handleToggleAddOn(addOn, e.target.checked)}
                          color="primary"
                        />
                      }
                      label=""
                      sx={{ ml: 1 }}
                    />
                  </Box>

                  <Box sx={{ mb: 2 }}>
                    <Typography variant="h5" fontWeight={700} color="primary" component="span">
                      ₹{addOn.monthly_price.toLocaleString()}
                    </Typography>
                    <Typography variant="body2" color="text.secondary" component="span">
                      /month
                    </Typography>
                    {addOn.yearly_price && (
                      <Chip
                        label={`₹${addOn.yearly_price.toLocaleString()}/year (Save 15%)`}
                        size="small"
                        color="success"
                        sx={{ ml: 2 }}
                      />
                    )}
                  </Box>

                  <List dense>
                    {addOn.features.map((feature, index) => (
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
                  </List>

                  {isActive && <Chip label="Active" size="small" color="primary" sx={{ mt: 1 }} />}
                </CardContent>
              </Card>
            </Grid>
          );
        })}
      </Grid>

      {addOns.length === 0 && (
        <Card
          elevation={0}
          sx={{
            border: `1px dashed ${theme.palette.divider}`,
            textAlign: 'center',
            py: 6,
          }}
        >
          <CardContent>
            <Typography variant="h6" color="text.secondary" gutterBottom>
              No Add-ons Available
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Add-on modules will be available soon
            </Typography>
          </CardContent>
        </Card>
      )}

      <Dialog open={confirmDialogOpen} onClose={() => setConfirmDialogOpen(false)}>
        <DialogTitle>{action === 'enable' ? 'Enable' : 'Disable'} Add-on</DialogTitle>
        <DialogContent>
          {selectedAddOn && (
            <Box>
              <Typography variant="body1" gutterBottom>
                {action === 'enable'
                  ? `You are about to enable the ${selectedAddOn.name} add-on.`
                  : `You are about to disable the ${selectedAddOn.name} add-on.`}
              </Typography>
              {action === 'enable' && (
                <Box
                  sx={{
                    mt: 2,
                    p: 2,
                    bgcolor: alpha(theme.palette.primary.main, 0.1),
                    borderRadius: 1,
                  }}
                >
                  <Typography variant="body2">
                    Additional charge: ₹{selectedAddOn.monthly_price.toLocaleString()}/month
                  </Typography>
                  <Typography variant="caption" color="text.secondary">
                    This will be added to your next invoice
                  </Typography>
                </Box>
              )}
              {action === 'disable' && (
                <Typography variant="body2" color="text.secondary" sx={{ mt: 2 }}>
                  The add-on will be disabled at the end of the current billing cycle.
                </Typography>
              )}
            </Box>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setConfirmDialogOpen(false)}>Cancel</Button>
          <Button onClick={handleConfirmToggle} variant="contained" disabled={processing}>
            {processing ? 'Processing...' : 'Confirm'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
