import {
  Box,
  Typography,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Chip,
  IconButton,
  Tooltip,
  useTheme,
  Card,
  CardContent,
} from '@mui/material';
import {
  Download as DownloadIcon,
  Receipt as ReceiptIcon,
  Visibility as VisibilityIcon,
} from '@mui/icons-material';
import subscriptionApi, { Invoice } from '@/api/subscription';

interface InvoiceListProps {
  invoices: Invoice[];
}

export default function InvoiceList({ invoices }: InvoiceListProps) {
  const theme = useTheme();

  const getStatusColor = (status: string): 'success' | 'warning' | 'error' | 'default' | 'info' => {
    switch (status) {
      case 'paid':
        return 'success';
      case 'open':
        return 'info';
      case 'overdue':
        return 'error';
      case 'draft':
        return 'default';
      default:
        return 'default';
    }
  };

  const handleDownloadInvoice = async (invoiceId: number) => {
    try {
      const blob = await subscriptionApi.downloadInvoice(invoiceId);
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `invoice-${invoiceId}.pdf`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } catch (err) {
      console.error('Error downloading invoice:', err);
      alert('Failed to download invoice. Please try again.');
    }
  };

  const handleViewInvoice = (invoice: Invoice) => {
    if (invoice.invoice_url) {
      window.open(invoice.invoice_url, '_blank');
    }
  };

  return (
    <Box>
      <Typography variant="h6" fontWeight={600} sx={{ mb: 3 }}>
        Invoices
      </Typography>

      {invoices.length === 0 ? (
        <Card
          elevation={0}
          sx={{
            border: `1px dashed ${theme.palette.divider}`,
            textAlign: 'center',
            py: 6,
          }}
        >
          <CardContent>
            <ReceiptIcon sx={{ fontSize: 64, color: theme.palette.text.disabled, mb: 2 }} />
            <Typography variant="h6" color="text.secondary" gutterBottom>
              No Invoices
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Your invoices will appear here once generated
            </Typography>
          </CardContent>
        </Card>
      ) : (
        <TableContainer>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>Invoice Number</TableCell>
                <TableCell>Billing Period</TableCell>
                <TableCell align="right">Amount</TableCell>
                <TableCell>Status</TableCell>
                <TableCell>Due Date</TableCell>
                <TableCell align="center">Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {invoices.map((invoice) => (
                <TableRow key={invoice.id} hover>
                  <TableCell>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      <ReceiptIcon fontSize="small" color="action" />
                      <Typography variant="body2" fontWeight={600}>
                        {invoice.invoice_number}
                      </Typography>
                    </Box>
                  </TableCell>
                  <TableCell>
                    <Typography variant="body2">
                      {new Date(invoice.billing_period_start).toLocaleDateString()} -{' '}
                      {new Date(invoice.billing_period_end).toLocaleDateString()}
                    </Typography>
                  </TableCell>
                  <TableCell align="right">
                    <Box>
                      <Typography variant="body2" fontWeight={600}>
                        ₹{invoice.total_amount.toLocaleString()}
                      </Typography>
                      {invoice.tax_amount > 0 && (
                        <Typography variant="caption" color="text.secondary">
                          (Tax: ₹{invoice.tax_amount})
                        </Typography>
                      )}
                    </Box>
                  </TableCell>
                  <TableCell>
                    <Chip
                      label={invoice.status}
                      size="small"
                      color={getStatusColor(invoice.status)}
                      sx={{ textTransform: 'capitalize' }}
                    />
                  </TableCell>
                  <TableCell>
                    <Typography
                      variant="body2"
                      color={invoice.status === 'overdue' ? 'error.main' : 'text.primary'}
                    >
                      {new Date(invoice.due_date).toLocaleDateString()}
                    </Typography>
                    {invoice.paid_at && (
                      <Typography variant="caption" color="success.main" display="block">
                        Paid: {new Date(invoice.paid_at).toLocaleDateString()}
                      </Typography>
                    )}
                  </TableCell>
                  <TableCell align="center">
                    <Box sx={{ display: 'flex', gap: 0.5, justifyContent: 'center' }}>
                      {invoice.invoice_url && (
                        <Tooltip title="View Invoice">
                          <IconButton size="small" onClick={() => handleViewInvoice(invoice)}>
                            <VisibilityIcon fontSize="small" />
                          </IconButton>
                        </Tooltip>
                      )}
                      <Tooltip title="Download PDF">
                        <IconButton size="small" onClick={() => handleDownloadInvoice(invoice.id)}>
                          <DownloadIcon fontSize="small" />
                        </IconButton>
                      </Tooltip>
                    </Box>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      )}
    </Box>
  );
}
