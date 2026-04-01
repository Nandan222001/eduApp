import React, { useState } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  TextField,
  Typography,
  Box,
  Alert,
  CircularProgress,
  Stepper,
  Step,
  StepLabel,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Grid,
  Divider,
  Card,
  CardContent,
} from '@mui/material';
import {
  CreditCard as CreditCardIcon,
  Payment as PaymentIcon,
  CheckCircle as CheckCircleIcon,
} from '@mui/icons-material';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { eventsApi } from '@/api/events';
import { LiveEvent } from '@/types/event';

interface TicketPurchaseDialogProps {
  open: boolean;
  onClose: () => void;
  event: LiveEvent;
}

const steps = ['Event Details', 'Payment Information', 'Confirmation'];

export const TicketPurchaseDialog: React.FC<TicketPurchaseDialogProps> = ({
  open,
  onClose,
  event,
}) => {
  const queryClient = useQueryClient();
  const [activeStep, setActiveStep] = useState(0);
  const [ticketNumber, setTicketNumber] = useState('');

  const [paymentData, setPaymentData] = useState({
    cardNumber: '',
    cardName: '',
    expiryMonth: '',
    expiryYear: '',
    cvv: '',
    billingEmail: '',
  });

  const purchaseTicketMutation = useMutation({
    mutationFn: () =>
      eventsApi.purchaseTicket(event.id, {
        ticketTypeId: 1,
        quantity: 1,
        paymentMethod: 'credit_card',
        paymentDetails: {
          cardNumber: paymentData.cardNumber,
          cardName: paymentData.cardName,
          expiryMonth: paymentData.expiryMonth,
          expiryYear: paymentData.expiryYear,
          cvv: paymentData.cvv,
          billingEmail: paymentData.billingEmail,
        },
      }),
    onSuccess: (data) => {
      setTicketNumber(data.ticket_number);
      setActiveStep(2);
      queryClient.invalidateQueries({ queryKey: ['liveEvent', event.id] });
      queryClient.invalidateQueries({ queryKey: ['myTickets'] });
    },
  });

  const handleNext = () => {
    if (activeStep === 1) {
      purchaseTicketMutation.mutate();
    } else {
      setActiveStep((prev) => prev + 1);
    }
  };

  const handleBack = () => {
    setActiveStep((prev) => prev - 1);
  };

  const handleClose = () => {
    setActiveStep(0);
    setPaymentData({
      cardNumber: '',
      cardName: '',
      expiryMonth: '',
      expiryYear: '',
      cvv: '',
      billingEmail: '',
    });
    onClose();
  };

  const isStepValid = () => {
    if (activeStep === 0) return true;
    if (activeStep === 1) {
      return (
        paymentData.cardNumber.length === 16 &&
        paymentData.cardName.trim() !== '' &&
        paymentData.expiryMonth !== '' &&
        paymentData.expiryYear !== '' &&
        paymentData.cvv.length === 3 &&
        paymentData.billingEmail.includes('@')
      );
    }
    return true;
  };

  return (
    <Dialog open={open} onClose={handleClose} maxWidth="md" fullWidth>
      <DialogTitle>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
          <PaymentIcon />
          Purchase Event Ticket
        </Box>
      </DialogTitle>
      <DialogContent>
        <Stepper activeStep={activeStep} sx={{ mb: 4, mt: 2 }}>
          {steps.map((label) => (
            <Step key={label}>
              <StepLabel>{label}</StepLabel>
            </Step>
          ))}
        </Stepper>

        {activeStep === 0 && (
          <Box>
            <Card variant="outlined" sx={{ mb: 3 }}>
              <CardContent>
                <Typography variant="h6" gutterBottom>
                  {event.title}
                </Typography>
                <Typography variant="body2" color="text.secondary" gutterBottom>
                  {event.description}
                </Typography>
                <Box sx={{ mt: 2 }}>
                  <Typography variant="body2">
                    <strong>Date:</strong> {new Date(event.start_date).toLocaleDateString()}
                  </Typography>
                  <Typography variant="body2">
                    <strong>Time:</strong> {new Date(event.start_date).toLocaleTimeString()}
                  </Typography>
                  {event.location && (
                    <Typography variant="body2">
                      <strong>Location:</strong> {event.location}
                    </Typography>
                  )}
                </Box>
              </CardContent>
            </Card>

            <Box
              sx={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                p: 2,
                bgcolor: 'primary.light',
                borderRadius: 1,
              }}
            >
              <Typography variant="h6">Total Amount:</Typography>
              <Typography variant="h5" fontWeight="bold">
                ${event.ticket_price?.toFixed(2)}
              </Typography>
            </Box>

            <Alert severity="info" sx={{ mt: 2 }}>
              Purchasing this ticket grants you access to the live stream and any recorded content.
            </Alert>
          </Box>
        )}

        {activeStep === 1 && (
          <Box>
            <Typography variant="h6" gutterBottom sx={{ mb: 3 }}>
              Payment Information
            </Typography>

            {purchaseTicketMutation.isError && (
              <Alert severity="error" sx={{ mb: 3 }}>
                Payment failed. Please check your information and try again.
              </Alert>
            )}

            <Grid container spacing={3}>
              <Grid item xs={12}>
                <TextField
                  fullWidth
                  label="Email Address"
                  type="email"
                  value={paymentData.billingEmail}
                  onChange={(e) => setPaymentData({ ...paymentData, billingEmail: e.target.value })}
                  required
                />
              </Grid>

              <Grid item xs={12}>
                <TextField
                  fullWidth
                  label="Cardholder Name"
                  value={paymentData.cardName}
                  onChange={(e) => setPaymentData({ ...paymentData, cardName: e.target.value })}
                  required
                />
              </Grid>

              <Grid item xs={12}>
                <TextField
                  fullWidth
                  label="Card Number"
                  value={paymentData.cardNumber}
                  onChange={(e) => {
                    const value = e.target.value.replace(/\D/g, '').slice(0, 16);
                    setPaymentData({ ...paymentData, cardNumber: value });
                  }}
                  placeholder="1234 5678 9012 3456"
                  InputProps={{
                    startAdornment: <CreditCardIcon sx={{ mr: 1, color: 'action.active' }} />,
                  }}
                  required
                />
              </Grid>

              <Grid item xs={4}>
                <FormControl fullWidth required>
                  <InputLabel>Month</InputLabel>
                  <Select
                    value={paymentData.expiryMonth}
                    label="Month"
                    onChange={(e) =>
                      setPaymentData({ ...paymentData, expiryMonth: e.target.value })
                    }
                  >
                    {Array.from({ length: 12 }, (_, i) => i + 1).map((month) => (
                      <MenuItem key={month} value={month.toString().padStart(2, '0')}>
                        {month.toString().padStart(2, '0')}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Grid>

              <Grid item xs={4}>
                <FormControl fullWidth required>
                  <InputLabel>Year</InputLabel>
                  <Select
                    value={paymentData.expiryYear}
                    label="Year"
                    onChange={(e) => setPaymentData({ ...paymentData, expiryYear: e.target.value })}
                  >
                    {Array.from({ length: 10 }, (_, i) => new Date().getFullYear() + i).map(
                      (year) => (
                        <MenuItem key={year} value={year.toString()}>
                          {year}
                        </MenuItem>
                      )
                    )}
                  </Select>
                </FormControl>
              </Grid>

              <Grid item xs={4}>
                <TextField
                  fullWidth
                  label="CVV"
                  value={paymentData.cvv}
                  onChange={(e) => {
                    const value = e.target.value.replace(/\D/g, '').slice(0, 3);
                    setPaymentData({ ...paymentData, cvv: value });
                  }}
                  placeholder="123"
                  required
                />
              </Grid>
            </Grid>

            <Alert severity="info" sx={{ mt: 3 }}>
              Your payment is secure and encrypted. We never store your card details.
            </Alert>
          </Box>
        )}

        {activeStep === 2 && (
          <Box sx={{ textAlign: 'center', py: 4 }}>
            <CheckCircleIcon sx={{ fontSize: 80, color: 'success.main', mb: 2 }} />
            <Typography variant="h5" gutterBottom>
              Purchase Successful!
            </Typography>
            <Typography variant="body1" color="text.secondary" gutterBottom>
              Your ticket has been confirmed
            </Typography>

            <Card variant="outlined" sx={{ mt: 3, p: 3, bgcolor: 'grey.50' }}>
              <Typography variant="caption" color="text.secondary">
                Ticket Number
              </Typography>
              <Typography variant="h6" fontWeight="bold" sx={{ mb: 2 }}>
                {ticketNumber}
              </Typography>
              <Divider sx={{ my: 2 }} />
              <Typography variant="body2" color="text.secondary">
                A confirmation email has been sent to {paymentData.billingEmail}
              </Typography>
            </Card>

            <Alert severity="success" sx={{ mt: 3 }}>
              You can now access this event and all its content. The stream will be available at the
              scheduled time.
            </Alert>
          </Box>
        )}
      </DialogContent>
      <DialogActions sx={{ px: 3, pb: 2 }}>
        {activeStep === 2 ? (
          <Button onClick={handleClose} variant="contained" fullWidth>
            Close
          </Button>
        ) : (
          <>
            <Button onClick={handleClose} disabled={purchaseTicketMutation.isPending}>
              Cancel
            </Button>
            {activeStep > 0 && (
              <Button onClick={handleBack} disabled={purchaseTicketMutation.isPending}>
                Back
              </Button>
            )}
            <Button
              variant="contained"
              onClick={handleNext}
              disabled={!isStepValid() || purchaseTicketMutation.isPending}
            >
              {purchaseTicketMutation.isPending ? (
                <CircularProgress size={24} />
              ) : activeStep === steps.length - 2 ? (
                'Purchase'
              ) : (
                'Next'
              )}
            </Button>
          </>
        )}
      </DialogActions>
    </Dialog>
  );
};

export default TicketPurchaseDialog;
