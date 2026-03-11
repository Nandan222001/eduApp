import { useState } from 'react';
import {
  Box,
  Typography,
  Card,
  CardContent,
  Button,
  IconButton,
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
  Chip,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Grid,
  useTheme,
} from '@mui/material';
import {
  CreditCard as CreditCardIcon,
  Delete as DeleteIcon,
  Add as AddIcon,
  Star as StarIcon,
  StarBorder as StarBorderIcon,
} from '@mui/icons-material';
import subscriptionApi, { PaymentMethod } from '@/api/subscription';

interface PaymentMethodManagementProps {
  paymentMethods: PaymentMethod[];
  onUpdate: () => void;
}

export default function PaymentMethodManagement({
  paymentMethods,
  onUpdate,
}: PaymentMethodManagementProps) {
  const theme = useTheme();
  const [addDialogOpen, setAddDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [selectedMethod, setSelectedMethod] = useState<PaymentMethod | null>(null);
  const [processing, setProcessing] = useState(false);
  const [formData, setFormData] = useState({
    card_number: '',
    card_holder: '',
    expiry_month: '',
    expiry_year: '',
    cvv: '',
  });

  const handleAddPaymentMethod = async () => {
    try {
      setProcessing(true);
      await subscriptionApi.addPaymentMethod(formData);
      setAddDialogOpen(false);
      setFormData({
        card_number: '',
        card_holder: '',
        expiry_month: '',
        expiry_year: '',
        cvv: '',
      });
      onUpdate();
    } catch (err) {
      console.error('Error adding payment method:', err);
      alert('Failed to add payment method. Please try again.');
    } finally {
      setProcessing(false);
    }
  };

  const handleDeletePaymentMethod = async () => {
    if (!selectedMethod) return;

    try {
      setProcessing(true);
      await subscriptionApi.deletePaymentMethod(selectedMethod.id);
      setDeleteDialogOpen(false);
      setSelectedMethod(null);
      onUpdate();
    } catch (err) {
      console.error('Error deleting payment method:', err);
      alert('Failed to delete payment method. Please try again.');
    } finally {
      setProcessing(false);
    }
  };

  const handleSetDefault = async (methodId: number) => {
    try {
      await subscriptionApi.setDefaultPaymentMethod(methodId);
      onUpdate();
    } catch (err) {
      console.error('Error setting default payment method:', err);
      alert('Failed to set default payment method. Please try again.');
    }
  };

  const formatCardNumber = (number: string) => {
    return `**** **** **** ${number.slice(-4)}`;
  };

  return (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h6" fontWeight={600}>
          Payment Methods
        </Typography>
        <Button variant="contained" startIcon={<AddIcon />} onClick={() => setAddDialogOpen(true)}>
          Add Payment Method
        </Button>
      </Box>

      {paymentMethods.length === 0 ? (
        <Card
          elevation={0}
          sx={{
            border: `1px dashed ${theme.palette.divider}`,
            textAlign: 'center',
            py: 6,
          }}
        >
          <CardContent>
            <CreditCardIcon sx={{ fontSize: 64, color: theme.palette.text.disabled, mb: 2 }} />
            <Typography variant="h6" color="text.secondary" gutterBottom>
              No Payment Methods
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
              Add a payment method to enable automatic billing
            </Typography>
            <Button
              variant="contained"
              startIcon={<AddIcon />}
              onClick={() => setAddDialogOpen(true)}
            >
              Add Payment Method
            </Button>
          </CardContent>
        </Card>
      ) : (
        <List>
          {paymentMethods.map((method) => (
            <Card
              key={method.id}
              elevation={0}
              sx={{
                border: `1px solid ${theme.palette.divider}`,
                mb: 2,
              }}
            >
              <ListItem
                secondaryAction={
                  <Box sx={{ display: 'flex', gap: 1 }}>
                    <IconButton
                      edge="end"
                      aria-label="set default"
                      onClick={() => handleSetDefault(method.id)}
                    >
                      {method.is_default ? <StarIcon color="primary" /> : <StarBorderIcon />}
                    </IconButton>
                    <IconButton
                      edge="end"
                      aria-label="delete"
                      onClick={() => {
                        setSelectedMethod(method);
                        setDeleteDialogOpen(true);
                      }}
                      disabled={method.is_default && paymentMethods.length === 1}
                    >
                      <DeleteIcon />
                    </IconButton>
                  </Box>
                }
              >
                <ListItemIcon>
                  <CreditCardIcon color="primary" />
                </ListItemIcon>
                <ListItemText
                  primary={
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      <Typography variant="body1" fontWeight={600}>
                        {formatCardNumber(method.card_number)}
                      </Typography>
                      {method.is_default && <Chip label="Default" size="small" color="primary" />}
                    </Box>
                  }
                  secondary={
                    <Box>
                      <Typography variant="body2" component="span">
                        {method.card_holder}
                      </Typography>
                      <Typography variant="body2" component="span" sx={{ ml: 2 }}>
                        Expires: {method.expiry_month}/{method.expiry_year}
                      </Typography>
                    </Box>
                  }
                />
              </ListItem>
            </Card>
          ))}
        </List>
      )}

      <Dialog open={addDialogOpen} onClose={() => setAddDialogOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Add Payment Method</DialogTitle>
        <DialogContent>
          <Grid container spacing={2} sx={{ mt: 1 }}>
            <Grid item xs={12}>
              <TextField
                label="Card Number"
                fullWidth
                value={formData.card_number}
                onChange={(e) => setFormData({ ...formData, card_number: e.target.value })}
                placeholder="1234 5678 9012 3456"
              />
            </Grid>
            <Grid item xs={12}>
              <TextField
                label="Card Holder Name"
                fullWidth
                value={formData.card_holder}
                onChange={(e) => setFormData({ ...formData, card_holder: e.target.value })}
                placeholder="John Doe"
              />
            </Grid>
            <Grid item xs={4}>
              <TextField
                label="Month"
                fullWidth
                value={formData.expiry_month}
                onChange={(e) => setFormData({ ...formData, expiry_month: e.target.value })}
                placeholder="MM"
              />
            </Grid>
            <Grid item xs={4}>
              <TextField
                label="Year"
                fullWidth
                value={formData.expiry_year}
                onChange={(e) => setFormData({ ...formData, expiry_year: e.target.value })}
                placeholder="YYYY"
              />
            </Grid>
            <Grid item xs={4}>
              <TextField
                label="CVV"
                fullWidth
                type="password"
                value={formData.cvv}
                onChange={(e) => setFormData({ ...formData, cvv: e.target.value })}
                placeholder="123"
              />
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setAddDialogOpen(false)}>Cancel</Button>
          <Button onClick={handleAddPaymentMethod} variant="contained" disabled={processing}>
            {processing ? 'Adding...' : 'Add Card'}
          </Button>
        </DialogActions>
      </Dialog>

      <Dialog open={deleteDialogOpen} onClose={() => setDeleteDialogOpen(false)}>
        <DialogTitle>Delete Payment Method</DialogTitle>
        <DialogContent>
          <Typography>
            Are you sure you want to delete this payment method?
            {selectedMethod?.is_default && ' You will need to set another method as default.'}
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDeleteDialogOpen(false)}>Cancel</Button>
          <Button onClick={handleDeletePaymentMethod} color="error" disabled={processing}>
            {processing ? 'Deleting...' : 'Delete'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
