import React, { useState } from 'react';
import {
  Box,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Grid,
  MenuItem,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Chip,
  IconButton,
  Typography,
  Paper,
} from '@mui/material';
import { Add as AddIcon, Receipt as ReceiptIcon, Print as PrintIcon } from '@mui/icons-material';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { feeApi } from '../../api/fees';
import { FeePayment, FeeReceiptData } from '../../types/fee';

const PAYMENT_METHODS = ['cash', 'cheque', 'card', 'online', 'upi', 'net_banking'];

const PaymentRecording: React.FC = () => {
  const [open, setOpen] = useState(false);
  const [receiptDialog, setReceiptDialog] = useState(false);
  const [selectedReceipt, setSelectedReceipt] = useState<FeeReceiptData | null>(null);
  const queryClient = useQueryClient();

  const { data: paymentsData } = useQuery({
    queryKey: ['feePayments'],
    queryFn: () => feeApi.listPayments(),
  });

  const recordMutation = useMutation({
    mutationFn: feeApi.recordPayment,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['feePayments'] });
      setOpen(false);
    },
  });

  const handleSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const formData = new FormData(event.currentTarget);
    const data = {
      institution_id: 1,
      student_id: parseInt(formData.get('student_id') as string),
      fee_structure_id: parseInt(formData.get('fee_structure_id') as string),
      payment_date: formData.get('payment_date'),
      amount_paid: parseFloat(formData.get('amount_paid') as string),
      late_fee: parseFloat(formData.get('late_fee') as string) || 0,
      discount_amount: parseFloat(formData.get('discount_amount') as string) || 0,
      payment_method: formData.get('payment_method'),
      transaction_id: formData.get('transaction_id'),
      remarks: formData.get('remarks'),
    };

    recordMutation.mutate(data);
  };

  const handleViewReceipt = async (receiptNumber: string) => {
    const receipt = await feeApi.getReceipt(receiptNumber);
    setSelectedReceipt(receipt);
    setReceiptDialog(true);
  };

  const handlePrintReceipt = () => {
    window.print();
  };

  return (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 3 }}>
        <Button variant="contained" startIcon={<AddIcon />} onClick={() => setOpen(true)}>
          Record Payment
        </Button>
      </Box>

      <TableContainer>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>Receipt No.</TableCell>
              <TableCell>Date</TableCell>
              <TableCell>Student ID</TableCell>
              <TableCell>Amount</TableCell>
              <TableCell>Method</TableCell>
              <TableCell>Status</TableCell>
              <TableCell>Actions</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {paymentsData?.items?.map((payment: FeePayment) => (
              <TableRow key={payment.id}>
                <TableCell>{payment.receipt_number}</TableCell>
                <TableCell>{new Date(payment.payment_date).toLocaleDateString()}</TableCell>
                <TableCell>{payment.student_id}</TableCell>
                <TableCell>₹{payment.total_amount}</TableCell>
                <TableCell>
                  <Chip label={payment.payment_method} size="small" />
                </TableCell>
                <TableCell>
                  <Chip
                    label={payment.payment_status}
                    color={payment.payment_status === 'paid' ? 'success' : 'warning'}
                    size="small"
                  />
                </TableCell>
                <TableCell>
                  <IconButton
                    onClick={() => handleViewReceipt(payment.receipt_number)}
                    size="small"
                  >
                    <ReceiptIcon />
                  </IconButton>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>

      <Dialog open={open} onClose={() => setOpen(false)} maxWidth="md" fullWidth>
        <form onSubmit={handleSubmit}>
          <DialogTitle>Record Payment</DialogTitle>
          <DialogContent>
            <Grid container spacing={2} sx={{ mt: 1 }}>
              <Grid item xs={12} sm={6}>
                <TextField fullWidth label="Student ID" name="student_id" type="number" required />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  label="Fee Structure ID"
                  name="fee_structure_id"
                  type="number"
                  required
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  label="Payment Date"
                  name="payment_date"
                  type="date"
                  InputLabelProps={{ shrink: true }}
                  required
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField fullWidth select label="Payment Method" name="payment_method" required>
                  {PAYMENT_METHODS.map((method) => (
                    <MenuItem key={method} value={method}>
                      {method.replace('_', ' ').toUpperCase()}
                    </MenuItem>
                  ))}
                </TextField>
              </Grid>
              <Grid item xs={12} sm={4}>
                <TextField
                  fullWidth
                  label="Amount Paid"
                  name="amount_paid"
                  type="number"
                  required
                />
              </Grid>
              <Grid item xs={12} sm={4}>
                <TextField
                  fullWidth
                  label="Late Fee"
                  name="late_fee"
                  type="number"
                  defaultValue={0}
                />
              </Grid>
              <Grid item xs={12} sm={4}>
                <TextField
                  fullWidth
                  label="Discount"
                  name="discount_amount"
                  type="number"
                  defaultValue={0}
                />
              </Grid>
              <Grid item xs={12}>
                <TextField fullWidth label="Transaction ID" name="transaction_id" />
              </Grid>
              <Grid item xs={12}>
                <TextField fullWidth label="Remarks" name="remarks" multiline rows={2} />
              </Grid>
            </Grid>
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setOpen(false)}>Cancel</Button>
            <Button type="submit" variant="contained">
              Record Payment
            </Button>
          </DialogActions>
        </form>
      </Dialog>

      <Dialog open={receiptDialog} onClose={() => setReceiptDialog(false)} maxWidth="sm" fullWidth>
        <DialogTitle>
          Fee Receipt
          <IconButton onClick={handlePrintReceipt} sx={{ position: 'absolute', right: 48, top: 8 }}>
            <PrintIcon />
          </IconButton>
        </DialogTitle>
        <DialogContent>
          {selectedReceipt && (
            <Paper sx={{ p: 3 }}>
              <Typography variant="h6" gutterBottom>
                Receipt #{selectedReceipt.receipt_number}
              </Typography>
              <Grid container spacing={2} sx={{ mt: 2 }}>
                <Grid item xs={6}>
                  <Typography variant="body2" color="text.secondary">
                    Student
                  </Typography>
                  <Typography variant="body1">{selectedReceipt.student_name}</Typography>
                </Grid>
                <Grid item xs={6}>
                  <Typography variant="body2" color="text.secondary">
                    Grade
                  </Typography>
                  <Typography variant="body1">{selectedReceipt.grade_name}</Typography>
                </Grid>
                <Grid item xs={6}>
                  <Typography variant="body2" color="text.secondary">
                    Date
                  </Typography>
                  <Typography variant="body1">
                    {new Date(selectedReceipt.payment_date).toLocaleDateString()}
                  </Typography>
                </Grid>
                <Grid item xs={6}>
                  <Typography variant="body2" color="text.secondary">
                    Method
                  </Typography>
                  <Typography variant="body1">{selectedReceipt.payment_method}</Typography>
                </Grid>
                <Grid item xs={12}>
                  <Typography variant="body2" color="text.secondary">
                    Fee Type
                  </Typography>
                  <Typography variant="body1">{selectedReceipt.fee_structure_name}</Typography>
                </Grid>
                <Grid item xs={6}>
                  <Typography variant="body2" color="text.secondary">
                    Amount Paid
                  </Typography>
                  <Typography variant="body1">₹{selectedReceipt.amount_paid}</Typography>
                </Grid>
                <Grid item xs={6}>
                  <Typography variant="body2" color="text.secondary">
                    Late Fee
                  </Typography>
                  <Typography variant="body1">₹{selectedReceipt.late_fee}</Typography>
                </Grid>
                <Grid item xs={6}>
                  <Typography variant="body2" color="text.secondary">
                    Discount
                  </Typography>
                  <Typography variant="body1">₹{selectedReceipt.discount_amount}</Typography>
                </Grid>
                <Grid item xs={6}>
                  <Typography variant="body2" color="text.secondary">
                    Total
                  </Typography>
                  <Typography variant="h6">₹{selectedReceipt.total_amount}</Typography>
                </Grid>
              </Grid>
            </Paper>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setReceiptDialog(false)}>Close</Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default PaymentRecording;
