import { useState } from 'react';
import {
  Box,
  Container,
  Typography,
  Card,
  CardContent,
  Grid,
  Stepper,
  Step,
  StepLabel,
  StepContent,
  Paper,
  Chip,
  TextField,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Alert,
  Link,
  Divider,
  Stack,
} from '@mui/material';
import {
  LocalShipping as ShippingIcon,
  CheckCircle as CheckCircleIcon,
  Schedule as ScheduleIcon,
  Assignment as AssignmentIcon,
  Inventory as InventoryIcon,
  OpenInNew as OpenInNewIcon,
} from '@mui/icons-material';
import { MerchandiseOrder } from '@/types/merchandise';

const MOCK_ORDERS: MerchandiseOrder[] = [
  {
    id: '1',
    orderNumber: 'ORD-2024-001',
    items: [
      {
        productId: '1',
        product: {
          id: '1',
          name: 'School Logo T-Shirt',
          description: 'Premium cotton t-shirt',
          category: 'apparel',
          basePrice: 24.99,
          images: [],
          available: true,
          bestseller: true,
          sizes: ['M'],
          colors: ['Navy'],
          customizable: true,
          stock: {},
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        },
        quantity: 2,
        selectedSize: 'M',
        selectedColor: 'Navy',
        customization: {
          studentName: 'John Smith',
          graduationYear: '2024',
        },
        price: 49.98,
      },
    ],
    subtotal: 49.98,
    tax: 4.0,
    shipping: 5.99,
    total: 59.97,
    status: 'shipped',
    paymentStatus: 'paid',
    paymentIntentId: 'pi_123456789',
    shippingAddress: {
      fullName: 'John Smith',
      addressLine1: '123 Main St',
      city: 'New York',
      state: 'NY',
      postalCode: '10001',
      country: 'USA',
      phone: '555-0123',
    },
    trackingNumber: '1Z999AA10123456784',
    trackingCarrier: 'UPS',
    estimatedDelivery: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000).toISOString(),
    productionStatus: [
      {
        id: '1',
        status: 'Order Received',
        description: 'Your order has been confirmed and payment received',
        timestamp: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(),
      },
      {
        id: '2',
        status: 'In Production',
        description: 'Your customized items are being printed',
        timestamp: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString(),
      },
      {
        id: '3',
        status: 'Quality Check',
        description: 'Items are being inspected for quality',
        timestamp: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString(),
      },
      {
        id: '4',
        status: 'Shipped',
        description: 'Package has been handed to carrier',
        timestamp: new Date(Date.now() - 12 * 60 * 60 * 1000).toISOString(),
      },
    ],
    createdAt: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: '2',
    orderNumber: 'ORD-2024-002',
    items: [
      {
        productId: '2',
        product: {
          id: '2',
          name: 'Sports Jersey',
          description: 'Official school sports jersey',
          category: 'apparel',
          basePrice: 39.99,
          images: [],
          available: true,
          bestseller: true,
          customizable: true,
          stock: {},
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        },
        quantity: 1,
        selectedSize: 'L',
        selectedColor: 'Home Blue',
        customization: {
          studentName: 'Jane Doe',
          jerseyNumber: '15',
        },
        price: 39.99,
      },
    ],
    subtotal: 39.99,
    tax: 3.2,
    shipping: 0,
    total: 43.19,
    status: 'production',
    paymentStatus: 'paid',
    shippingAddress: {
      fullName: 'Jane Doe',
      addressLine1: '456 Oak Ave',
      city: 'Los Angeles',
      state: 'CA',
      postalCode: '90001',
      country: 'USA',
      phone: '555-0456',
    },
    productionStatus: [
      {
        id: '1',
        status: 'Order Received',
        description: 'Your order has been confirmed and payment received',
        timestamp: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
      },
      {
        id: '2',
        status: 'In Production',
        description: 'Your customized jersey is being prepared',
        timestamp: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString(),
      },
    ],
    createdAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
    updatedAt: new Date().toISOString(),
  },
];

const getStatusColor = (
  status: MerchandiseOrder['status']
): 'default' | 'primary' | 'secondary' | 'error' | 'info' | 'success' | 'warning' => {
  switch (status) {
    case 'pending':
      return 'default';
    case 'processing':
      return 'info';
    case 'production':
      return 'warning';
    case 'shipped':
      return 'primary';
    case 'delivered':
      return 'success';
    case 'cancelled':
      return 'error';
    default:
      return 'default';
  }
};

const getActiveStep = (status: MerchandiseOrder['status']): number => {
  switch (status) {
    case 'pending':
      return 0;
    case 'processing':
      return 1;
    case 'production':
      return 2;
    case 'shipped':
      return 3;
    case 'delivered':
      return 4;
    default:
      return 0;
  }
};

export default function MerchandiseOrderTracking() {
  const [orders] = useState<MerchandiseOrder[]>(MOCK_ORDERS);
  const [selectedOrder, setSelectedOrder] = useState<MerchandiseOrder | null>(MOCK_ORDERS[0]);
  const [trackingSearch, setTrackingSearch] = useState('');

  const steps = [
    { label: 'Order Placed', icon: <CheckCircleIcon /> },
    { label: 'Processing', icon: <AssignmentIcon /> },
    { label: 'In Production', icon: <InventoryIcon /> },
    { label: 'Shipped', icon: <ShippingIcon /> },
    { label: 'Delivered', icon: <CheckCircleIcon /> },
  ];

  return (
    <Container maxWidth="xl" sx={{ py: 4 }}>
      <Box sx={{ mb: 4 }}>
        <Typography variant="h4" fontWeight={700} gutterBottom>
          Order Tracking
        </Typography>
        <Typography variant="body2" color="text.secondary">
          Track your merchandise orders and view production status
        </Typography>
      </Box>

      <Grid container spacing={3}>
        <Grid item xs={12} md={4}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Your Orders
              </Typography>
              <TextField
                fullWidth
                size="small"
                placeholder="Search by order number..."
                value={trackingSearch}
                onChange={(e) => setTrackingSearch(e.target.value)}
                sx={{ mb: 2 }}
              />
              <Stack spacing={1}>
                {orders.map((order) => (
                  <Paper
                    key={order.id}
                    sx={{
                      p: 2,
                      cursor: 'pointer',
                      border: selectedOrder?.id === order.id ? 2 : 1,
                      borderColor: selectedOrder?.id === order.id ? 'primary.main' : 'divider',
                    }}
                    onClick={() => setSelectedOrder(order)}
                  >
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                      <Typography variant="subtitle2">{order.orderNumber}</Typography>
                      <Chip
                        label={order.status}
                        color={getStatusColor(order.status)}
                        size="small"
                      />
                    </Box>
                    <Typography variant="caption" color="text.secondary" display="block">
                      {new Date(order.createdAt).toLocaleDateString()}
                    </Typography>
                    <Typography variant="body2" fontWeight={600}>
                      ${order.total.toFixed(2)}
                    </Typography>
                  </Paper>
                ))}
              </Stack>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} md={8}>
          {selectedOrder ? (
            <Stack spacing={3}>
              <Card>
                <CardContent>
                  <Box
                    sx={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      mb: 2,
                    }}
                  >
                    <Typography variant="h6">Order {selectedOrder.orderNumber}</Typography>
                    <Chip
                      label={selectedOrder.status}
                      color={getStatusColor(selectedOrder.status)}
                    />
                  </Box>
                  <Typography variant="body2" color="text.secondary" gutterBottom>
                    Placed on {new Date(selectedOrder.createdAt).toLocaleDateString()}
                  </Typography>

                  <Divider sx={{ my: 2 }} />

                  <Stepper activeStep={getActiveStep(selectedOrder.status)} orientation="vertical">
                    {steps.map((step, index) => (
                      <Step key={step.label}>
                        <StepLabel icon={step.icon}>{step.label}</StepLabel>
                        <StepContent>
                          <Typography variant="body2" color="text.secondary">
                            {index < getActiveStep(selectedOrder.status)
                              ? 'Completed'
                              : 'In progress'}
                          </Typography>
                        </StepContent>
                      </Step>
                    ))}
                  </Stepper>
                </CardContent>
              </Card>

              {selectedOrder.productionStatus && selectedOrder.productionStatus.length > 0 && (
                <Card>
                  <CardContent>
                    <Typography variant="h6" gutterBottom>
                      Production Status
                    </Typography>
                    <Stack spacing={2}>
                      {selectedOrder.productionStatus.map((update) => (
                        <Paper key={update.id} sx={{ p: 2, bgcolor: 'grey.50' }}>
                          <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                            <Typography variant="subtitle2">{update.status}</Typography>
                            <Typography variant="caption" color="text.secondary">
                              {new Date(update.timestamp).toLocaleString()}
                            </Typography>
                          </Box>
                          <Typography variant="body2" color="text.secondary">
                            {update.description}
                          </Typography>
                        </Paper>
                      ))}
                    </Stack>
                  </CardContent>
                </Card>
              )}

              {selectedOrder.trackingNumber && (
                <Card>
                  <CardContent>
                    <Typography variant="h6" gutterBottom>
                      Shipping Information
                    </Typography>
                    <Grid container spacing={2}>
                      <Grid item xs={12} sm={6}>
                        <Typography variant="body2" color="text.secondary" gutterBottom>
                          Carrier
                        </Typography>
                        <Typography variant="body1">{selectedOrder.trackingCarrier}</Typography>
                      </Grid>
                      <Grid item xs={12} sm={6}>
                        <Typography variant="body2" color="text.secondary" gutterBottom>
                          Tracking Number
                        </Typography>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                          <Typography variant="body1">{selectedOrder.trackingNumber}</Typography>
                          <Link
                            href={`https://www.ups.com/track?tracknum=${selectedOrder.trackingNumber}`}
                            target="_blank"
                            rel="noopener"
                          >
                            <OpenInNewIcon fontSize="small" />
                          </Link>
                        </Box>
                      </Grid>
                      {selectedOrder.estimatedDelivery && (
                        <Grid item xs={12}>
                          <Alert severity="info" icon={<ScheduleIcon />}>
                            Estimated delivery:{' '}
                            {new Date(selectedOrder.estimatedDelivery).toLocaleDateString()}
                          </Alert>
                        </Grid>
                      )}
                    </Grid>
                  </CardContent>
                </Card>
              )}

              <Card>
                <CardContent>
                  <Typography variant="h6" gutterBottom>
                    Order Items
                  </Typography>
                  <TableContainer>
                    <Table>
                      <TableHead>
                        <TableRow>
                          <TableCell>Item</TableCell>
                          <TableCell>Details</TableCell>
                          <TableCell align="right">Quantity</TableCell>
                          <TableCell align="right">Price</TableCell>
                        </TableRow>
                      </TableHead>
                      <TableBody>
                        {selectedOrder.items.map((item, index) => (
                          <TableRow key={index}>
                            <TableCell>{item.product.name}</TableCell>
                            <TableCell>
                              <Stack spacing={0.5}>
                                {item.selectedSize && (
                                  <Typography variant="caption">
                                    Size: {item.selectedSize}
                                  </Typography>
                                )}
                                {item.selectedColor && (
                                  <Typography variant="caption">
                                    Color: {item.selectedColor}
                                  </Typography>
                                )}
                                {item.customization?.studentName && (
                                  <Typography variant="caption">
                                    Name: {item.customization.studentName}
                                  </Typography>
                                )}
                                {item.customization?.graduationYear && (
                                  <Typography variant="caption">
                                    Year: {item.customization.graduationYear}
                                  </Typography>
                                )}
                                {item.customization?.jerseyNumber && (
                                  <Typography variant="caption">
                                    Number: {item.customization.jerseyNumber}
                                  </Typography>
                                )}
                              </Stack>
                            </TableCell>
                            <TableCell align="right">{item.quantity}</TableCell>
                            <TableCell align="right">${item.price.toFixed(2)}</TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </TableContainer>

                  <Divider sx={{ my: 2 }} />

                  <Stack spacing={1}>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                      <Typography>Subtotal:</Typography>
                      <Typography>${selectedOrder.subtotal.toFixed(2)}</Typography>
                    </Box>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                      <Typography>Tax:</Typography>
                      <Typography>${selectedOrder.tax.toFixed(2)}</Typography>
                    </Box>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                      <Typography>Shipping:</Typography>
                      <Typography>
                        {selectedOrder.shipping === 0
                          ? 'FREE'
                          : `$${selectedOrder.shipping.toFixed(2)}`}
                      </Typography>
                    </Box>
                    <Divider />
                    <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                      <Typography variant="h6">Total:</Typography>
                      <Typography variant="h6">${selectedOrder.total.toFixed(2)}</Typography>
                    </Box>
                  </Stack>
                </CardContent>
              </Card>

              <Card>
                <CardContent>
                  <Typography variant="h6" gutterBottom>
                    Shipping Address
                  </Typography>
                  <Typography variant="body2">{selectedOrder.shippingAddress.fullName}</Typography>
                  <Typography variant="body2">
                    {selectedOrder.shippingAddress.addressLine1}
                  </Typography>
                  {selectedOrder.shippingAddress.addressLine2 && (
                    <Typography variant="body2">
                      {selectedOrder.shippingAddress.addressLine2}
                    </Typography>
                  )}
                  <Typography variant="body2">
                    {selectedOrder.shippingAddress.city}, {selectedOrder.shippingAddress.state}{' '}
                    {selectedOrder.shippingAddress.postalCode}
                  </Typography>
                  <Typography variant="body2">{selectedOrder.shippingAddress.country}</Typography>
                  <Typography variant="body2" sx={{ mt: 1 }}>
                    Phone: {selectedOrder.shippingAddress.phone}
                  </Typography>
                </CardContent>
              </Card>
            </Stack>
          ) : (
            <Alert severity="info">Select an order to view tracking details</Alert>
          )}
        </Grid>
      </Grid>
    </Container>
  );
}
