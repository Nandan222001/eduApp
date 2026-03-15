import { useState } from 'react';
import {
  Box,
  Container,
  Typography,
  Tabs,
  Tab,
  Paper,
  Grid,
  Card,
  CardContent,
  Button,
  Switch,
  FormControlLabel,
  TextField,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Chip,
  Alert,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Divider,
  InputAdornment,
} from '@mui/material';
import {
  Add as AddIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  Visibility as VisibilityIcon,
  VisibilityOff as VisibilityOffIcon,
  TrendingUp as TrendingUpIcon,
  ShoppingCart as ShoppingCartIcon,
  AttachMoney as MoneyIcon,
  Inventory as InventoryIcon,
  Save as SaveIcon,
  CloudUpload as UploadIcon,
} from '@mui/icons-material';
import { MerchandiseProduct, StoreSettings, RevenueAnalytics } from '@/types/merchandise';
import { Line, Doughnut } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  ArcElement,
  Title,
  Tooltip,
  Legend,
} from 'chart.js';

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  ArcElement,
  Title,
  Tooltip,
  Legend
);

interface TabPanelProps {
  children?: React.ReactNode;
  index: number;
  value: number;
}

function TabPanel(props: TabPanelProps) {
  const { children, value, index } = props;
  return (
    <div role="tabpanel" hidden={value !== index}>
      {value === index && <Box sx={{ py: 3 }}>{children}</Box>}
    </div>
  );
}

const MOCK_PRODUCTS: MerchandiseProduct[] = [
  {
    id: '1',
    name: 'School Logo T-Shirt',
    description: 'Premium cotton t-shirt with embroidered school logo',
    category: 'apparel',
    basePrice: 24.99,
    images: [],
    available: true,
    bestseller: true,
    sizes: ['XS', 'S', 'M', 'L', 'XL', 'XXL'],
    colors: ['Navy', 'White', 'Gray'],
    customizable: true,
    customizationOptions: {
      allowName: true,
      allowYear: true,
      allowNumber: false,
      maxNameLength: 20,
    },
    stock: { 'Navy-M': 50, 'Navy-L': 30, 'White-M': 40 },
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: '2',
    name: 'Sports Jersey',
    description: 'Official school sports jersey',
    category: 'apparel',
    basePrice: 39.99,
    images: [],
    available: true,
    bestseller: true,
    customizable: true,
    stock: { 'Home Blue-M': 25, 'Home Blue-L': 20 },
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
];

const MOCK_REVENUE: RevenueAnalytics = {
  totalRevenue: 15847.5,
  totalOrders: 127,
  averageOrderValue: 124.8,
  commissionEarned: 1584.75,
  topSellingProducts: [
    { productId: '1', productName: 'School Logo T-Shirt', unitsSold: 85, revenue: 2124.15 },
    { productId: '2', productName: 'Sports Jersey', unitsSold: 62, revenue: 2479.38 },
    { productId: '4', productName: 'School Backpack', unitsSold: 45, revenue: 1574.55 },
  ],
  revenueByCategory: [
    { category: 'Apparel', revenue: 9500, orders: 75 },
    { category: 'Accessories', revenue: 4200, orders: 35 },
    { category: 'Stationery', revenue: 2147.5, orders: 17 },
  ],
  revenueOverTime: [
    { date: '2024-01', revenue: 2500, orders: 20 },
    { date: '2024-02', revenue: 3200, orders: 25 },
    { date: '2024-03', revenue: 4100, orders: 32 },
    { date: '2024-04', revenue: 6047.5, orders: 50 },
  ],
};

export default function AdminMerchandiseManager() {
  const [tabValue, setTabValue] = useState(0);
  const [products, setProducts] = useState<MerchandiseProduct[]>(MOCK_PRODUCTS);
  const [storeSettings, setStoreSettings] = useState<StoreSettings>({
    id: '1',
    institutionId: '1',
    enabled: true,
    commissionRate: 10,
    taxRate: 8,
    shippingFee: 5.99,
    freeShippingThreshold: 50,
    customMessage: 'Support your school!',
    contactEmail: 'store@school.edu',
    returnPolicy: '30-day return policy',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  });
  const [productDialogOpen, setProductDialogOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<MerchandiseProduct | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    category: 'apparel' as MerchandiseProduct['category'],
    basePrice: 0,
    available: true,
    bestseller: false,
    customizable: false,
  });

  const handleSaveSettings = () => {
    console.log('Saving settings:', storeSettings);
  };

  const handleAddProduct = () => {
    setEditingProduct(null);
    setFormData({
      name: '',
      description: '',
      category: 'apparel',
      basePrice: 0,
      available: true,
      bestseller: false,
      customizable: false,
    });
    setProductDialogOpen(true);
  };

  const handleEditProduct = (product: MerchandiseProduct) => {
    setEditingProduct(product);
    setFormData({
      name: product.name,
      description: product.description,
      category: product.category,
      basePrice: product.basePrice,
      available: product.available,
      bestseller: product.bestseller,
      customizable: product.customizable,
    });
    setProductDialogOpen(true);
  };

  const handleSaveProduct = () => {
    if (editingProduct) {
      setProducts(
        products.map((p) =>
          p.id === editingProduct.id
            ? {
                ...p,
                ...formData,
                updatedAt: new Date().toISOString(),
              }
            : p
        )
      );
    } else {
      const newProduct: MerchandiseProduct = {
        id: String(Date.now()),
        ...formData,
        images: [],
        stock: {},
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };
      setProducts([...products, newProduct]);
    }
    setProductDialogOpen(false);
  };

  const handleDeleteProduct = (productId: string) => {
    setProducts(products.filter((p) => p.id !== productId));
  };

  const handleToggleAvailability = (productId: string) => {
    setProducts(
      products.map((p) =>
        p.id === productId
          ? { ...p, available: !p.available, updatedAt: new Date().toISOString() }
          : p
      )
    );
  };

  const revenueChartData = {
    labels: MOCK_REVENUE.revenueOverTime.map((d) => d.date),
    datasets: [
      {
        label: 'Revenue',
        data: MOCK_REVENUE.revenueOverTime.map((d) => d.revenue),
        borderColor: 'rgb(75, 192, 192)',
        backgroundColor: 'rgba(75, 192, 192, 0.2)',
        tension: 0.4,
      },
    ],
  };

  const categoryChartData = {
    labels: MOCK_REVENUE.revenueByCategory.map((c) => c.category),
    datasets: [
      {
        data: MOCK_REVENUE.revenueByCategory.map((c) => c.revenue),
        backgroundColor: [
          'rgba(54, 162, 235, 0.6)',
          'rgba(255, 206, 86, 0.6)',
          'rgba(75, 192, 192, 0.6)',
        ],
        borderColor: ['rgba(54, 162, 235, 1)', 'rgba(255, 206, 86, 1)', 'rgba(75, 192, 192, 1)'],
        borderWidth: 1,
      },
    ],
  };

  return (
    <Container maxWidth="xl" sx={{ py: 4 }}>
      <Box sx={{ mb: 4 }}>
        <Typography variant="h4" fontWeight={700} gutterBottom>
          Merchandise Store Manager
        </Typography>
        <Typography variant="body2" color="text.secondary">
          Manage your school merchandise store, products, and analytics
        </Typography>
      </Box>

      <Paper sx={{ mb: 3 }}>
        <Tabs value={tabValue} onChange={(_, v) => setTabValue(v)} variant="scrollable">
          <Tab label="Store Settings" />
          <Tab label="Product Catalog" />
          <Tab label="Order Fulfillment" />
          <Tab label="Revenue Analytics" />
        </Tabs>
      </Paper>

      <TabPanel value={tabValue} index={0}>
        <Card>
          <CardContent>
            <Typography variant="h6" gutterBottom>
              Store Configuration
            </Typography>
            <Divider sx={{ my: 2 }} />
            <Grid container spacing={3}>
              <Grid item xs={12}>
                <FormControlLabel
                  control={
                    <Switch
                      checked={storeSettings.enabled}
                      onChange={(e) =>
                        setStoreSettings({ ...storeSettings, enabled: e.target.checked })
                      }
                    />
                  }
                  label="Enable Merchandise Store"
                />
                {storeSettings.enabled ? (
                  <Alert severity="success" sx={{ mt: 1 }}>
                    Store is active and visible to students/parents
                  </Alert>
                ) : (
                  <Alert severity="warning" sx={{ mt: 1 }}>
                    Store is disabled and not accessible
                  </Alert>
                )}
              </Grid>

              <Grid item xs={12} md={6}>
                <TextField
                  fullWidth
                  label="Commission Rate (%)"
                  type="number"
                  value={storeSettings.commissionRate}
                  onChange={(e) =>
                    setStoreSettings({ ...storeSettings, commissionRate: Number(e.target.value) })
                  }
                  helperText="Percentage of each sale going to the school"
                />
              </Grid>

              <Grid item xs={12} md={6}>
                <TextField
                  fullWidth
                  label="Tax Rate (%)"
                  type="number"
                  value={storeSettings.taxRate}
                  onChange={(e) =>
                    setStoreSettings({ ...storeSettings, taxRate: Number(e.target.value) })
                  }
                  helperText="Sales tax percentage"
                />
              </Grid>

              <Grid item xs={12} md={6}>
                <TextField
                  fullWidth
                  label="Shipping Fee"
                  type="number"
                  value={storeSettings.shippingFee}
                  onChange={(e) =>
                    setStoreSettings({ ...storeSettings, shippingFee: Number(e.target.value) })
                  }
                  InputProps={{
                    startAdornment: <InputAdornment position="start">$</InputAdornment>,
                  }}
                />
              </Grid>

              <Grid item xs={12} md={6}>
                <TextField
                  fullWidth
                  label="Free Shipping Threshold"
                  type="number"
                  value={storeSettings.freeShippingThreshold}
                  onChange={(e) =>
                    setStoreSettings({
                      ...storeSettings,
                      freeShippingThreshold: Number(e.target.value),
                    })
                  }
                  InputProps={{
                    startAdornment: <InputAdornment position="start">$</InputAdornment>,
                  }}
                  helperText="Orders above this amount get free shipping"
                />
              </Grid>

              <Grid item xs={12}>
                <TextField
                  fullWidth
                  label="Store Message"
                  value={storeSettings.customMessage}
                  onChange={(e) =>
                    setStoreSettings({ ...storeSettings, customMessage: e.target.value })
                  }
                  helperText="Displayed at the top of the store"
                />
              </Grid>

              <Grid item xs={12} md={6}>
                <TextField
                  fullWidth
                  label="Contact Email"
                  type="email"
                  value={storeSettings.contactEmail}
                  onChange={(e) =>
                    setStoreSettings({ ...storeSettings, contactEmail: e.target.value })
                  }
                />
              </Grid>

              <Grid item xs={12}>
                <TextField
                  fullWidth
                  multiline
                  rows={3}
                  label="Return Policy"
                  value={storeSettings.returnPolicy}
                  onChange={(e) =>
                    setStoreSettings({ ...storeSettings, returnPolicy: e.target.value })
                  }
                />
              </Grid>

              <Grid item xs={12}>
                <Button variant="contained" startIcon={<SaveIcon />} onClick={handleSaveSettings}>
                  Save Settings
                </Button>
              </Grid>
            </Grid>
          </CardContent>
        </Card>
      </TabPanel>

      <TabPanel value={tabValue} index={1}>
        <Box sx={{ mb: 3, display: 'flex', justifyContent: 'space-between' }}>
          <Typography variant="h6">Products ({products.length})</Typography>
          <Button variant="contained" startIcon={<AddIcon />} onClick={handleAddProduct}>
            Add Product
          </Button>
        </Box>

        <TableContainer component={Paper}>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>Product</TableCell>
                <TableCell>Category</TableCell>
                <TableCell>Price</TableCell>
                <TableCell>Status</TableCell>
                <TableCell>Bestseller</TableCell>
                <TableCell>Customizable</TableCell>
                <TableCell align="right">Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {products.map((product) => (
                <TableRow key={product.id}>
                  <TableCell>
                    <Typography variant="body2" fontWeight={600}>
                      {product.name}
                    </Typography>
                    <Typography variant="caption" color="text.secondary">
                      {product.description}
                    </Typography>
                  </TableCell>
                  <TableCell>
                    <Chip label={product.category} size="small" />
                  </TableCell>
                  <TableCell>${product.basePrice.toFixed(2)}</TableCell>
                  <TableCell>
                    <Chip
                      label={product.available ? 'Available' : 'Unavailable'}
                      color={product.available ? 'success' : 'default'}
                      size="small"
                    />
                  </TableCell>
                  <TableCell>
                    {product.bestseller ? <Chip label="Yes" color="warning" size="small" /> : '-'}
                  </TableCell>
                  <TableCell>
                    {product.customizable ? <Chip label="Yes" color="primary" size="small" /> : '-'}
                  </TableCell>
                  <TableCell align="right">
                    <IconButton size="small" onClick={() => handleToggleAvailability(product.id)}>
                      {product.available ? <VisibilityIcon /> : <VisibilityOffIcon />}
                    </IconButton>
                    <IconButton size="small" onClick={() => handleEditProduct(product)}>
                      <EditIcon />
                    </IconButton>
                    <IconButton size="small" onClick={() => handleDeleteProduct(product.id)}>
                      <DeleteIcon />
                    </IconButton>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      </TabPanel>

      <TabPanel value={tabValue} index={2}>
        <Grid container spacing={3}>
          <Grid item xs={12} md={4}>
            <Card>
              <CardContent>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 2 }}>
                  <InventoryIcon color="primary" fontSize="large" />
                  <Box>
                    <Typography variant="h4" fontWeight={700}>
                      12
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      Pending Orders
                    </Typography>
                  </Box>
                </Box>
              </CardContent>
            </Card>
          </Grid>

          <Grid item xs={12} md={4}>
            <Card>
              <CardContent>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 2 }}>
                  <ShoppingCartIcon color="warning" fontSize="large" />
                  <Box>
                    <Typography variant="h4" fontWeight={700}>
                      8
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      In Production
                    </Typography>
                  </Box>
                </Box>
              </CardContent>
            </Card>
          </Grid>

          <Grid item xs={12} md={4}>
            <Card>
              <CardContent>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 2 }}>
                  <TrendingUpIcon color="success" fontSize="large" />
                  <Box>
                    <Typography variant="h4" fontWeight={700}>
                      35
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      Shipped This Week
                    </Typography>
                  </Box>
                </Box>
              </CardContent>
            </Card>
          </Grid>

          <Grid item xs={12}>
            <Card>
              <CardContent>
                <Typography variant="h6" gutterBottom>
                  Recent Orders
                </Typography>
                <Alert severity="info">
                  Order fulfillment tracking will be integrated with your production system
                </Alert>
              </CardContent>
            </Card>
          </Grid>
        </Grid>
      </TabPanel>

      <TabPanel value={tabValue} index={3}>
        <Grid container spacing={3}>
          <Grid item xs={12} md={3}>
            <Card>
              <CardContent>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                  <MoneyIcon color="success" fontSize="large" />
                  <Box>
                    <Typography variant="h5" fontWeight={700}>
                      ${MOCK_REVENUE.totalRevenue.toLocaleString()}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      Total Revenue
                    </Typography>
                  </Box>
                </Box>
              </CardContent>
            </Card>
          </Grid>

          <Grid item xs={12} md={3}>
            <Card>
              <CardContent>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                  <ShoppingCartIcon color="primary" fontSize="large" />
                  <Box>
                    <Typography variant="h5" fontWeight={700}>
                      {MOCK_REVENUE.totalOrders}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      Total Orders
                    </Typography>
                  </Box>
                </Box>
              </CardContent>
            </Card>
          </Grid>

          <Grid item xs={12} md={3}>
            <Card>
              <CardContent>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                  <TrendingUpIcon color="warning" fontSize="large" />
                  <Box>
                    <Typography variant="h5" fontWeight={700}>
                      ${MOCK_REVENUE.averageOrderValue.toFixed(2)}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      Avg Order Value
                    </Typography>
                  </Box>
                </Box>
              </CardContent>
            </Card>
          </Grid>

          <Grid item xs={12} md={3}>
            <Card>
              <CardContent>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                  <MoneyIcon color="info" fontSize="large" />
                  <Box>
                    <Typography variant="h5" fontWeight={700}>
                      ${MOCK_REVENUE.commissionEarned.toLocaleString()}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      Commission Earned
                    </Typography>
                  </Box>
                </Box>
              </CardContent>
            </Card>
          </Grid>

          <Grid item xs={12} md={8}>
            <Card>
              <CardContent>
                <Typography variant="h6" gutterBottom>
                  Revenue Over Time
                </Typography>
                <Box sx={{ height: 300 }}>
                  <Line data={revenueChartData} options={{ maintainAspectRatio: false }} />
                </Box>
              </CardContent>
            </Card>
          </Grid>

          <Grid item xs={12} md={4}>
            <Card>
              <CardContent>
                <Typography variant="h6" gutterBottom>
                  Revenue by Category
                </Typography>
                <Box sx={{ height: 300 }}>
                  <Doughnut data={categoryChartData} options={{ maintainAspectRatio: false }} />
                </Box>
              </CardContent>
            </Card>
          </Grid>

          <Grid item xs={12}>
            <Card>
              <CardContent>
                <Typography variant="h6" gutterBottom>
                  Top Selling Products
                </Typography>
                <TableContainer>
                  <Table>
                    <TableHead>
                      <TableRow>
                        <TableCell>Product</TableCell>
                        <TableCell align="right">Units Sold</TableCell>
                        <TableCell align="right">Revenue</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {MOCK_REVENUE.topSellingProducts.map((product) => (
                        <TableRow key={product.productId}>
                          <TableCell>{product.productName}</TableCell>
                          <TableCell align="right">{product.unitsSold}</TableCell>
                          <TableCell align="right">${product.revenue.toFixed(2)}</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </TableContainer>
              </CardContent>
            </Card>
          </Grid>
        </Grid>
      </TabPanel>

      <Dialog
        open={productDialogOpen}
        onClose={() => setProductDialogOpen(false)}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle>{editingProduct ? 'Edit Product' : 'Add New Product'}</DialogTitle>
        <DialogContent>
          <Grid container spacing={2} sx={{ mt: 1 }}>
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Product Name"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              />
            </Grid>
            <Grid item xs={12}>
              <TextField
                fullWidth
                multiline
                rows={3}
                label="Description"
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <FormControl fullWidth>
                <InputLabel>Category</InputLabel>
                <Select
                  value={formData.category}
                  label="Category"
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      category: e.target.value as MerchandiseProduct['category'],
                    })
                  }
                >
                  <MenuItem value="apparel">Apparel</MenuItem>
                  <MenuItem value="accessories">Accessories</MenuItem>
                  <MenuItem value="stationery">Stationery</MenuItem>
                  <MenuItem value="sports">Sports Equipment</MenuItem>
                  <MenuItem value="other">Other</MenuItem>
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Base Price"
                type="number"
                value={formData.basePrice}
                onChange={(e) => setFormData({ ...formData, basePrice: Number(e.target.value) })}
                InputProps={{
                  startAdornment: <InputAdornment position="start">$</InputAdornment>,
                }}
              />
            </Grid>
            <Grid item xs={12} sm={4}>
              <FormControlLabel
                control={
                  <Switch
                    checked={formData.available}
                    onChange={(e) => setFormData({ ...formData, available: e.target.checked })}
                  />
                }
                label="Available"
              />
            </Grid>
            <Grid item xs={12} sm={4}>
              <FormControlLabel
                control={
                  <Switch
                    checked={formData.bestseller}
                    onChange={(e) => setFormData({ ...formData, bestseller: e.target.checked })}
                  />
                }
                label="Bestseller"
              />
            </Grid>
            <Grid item xs={12} sm={4}>
              <FormControlLabel
                control={
                  <Switch
                    checked={formData.customizable}
                    onChange={(e) => setFormData({ ...formData, customizable: e.target.checked })}
                  />
                }
                label="Customizable"
              />
            </Grid>
            <Grid item xs={12}>
              <Button variant="outlined" startIcon={<UploadIcon />} fullWidth>
                Upload Product Images
              </Button>
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setProductDialogOpen(false)}>Cancel</Button>
          <Button variant="contained" onClick={handleSaveProduct}>
            {editingProduct ? 'Save Changes' : 'Add Product'}
          </Button>
        </DialogActions>
      </Dialog>
    </Container>
  );
}
