import { useState } from 'react';
import {
  Box,
  Container,
  Typography,
  Grid,
  Card,
  CardMedia,
  CardContent,
  CardActions,
  Button,
  Chip,
  IconButton,
  Badge,
  Drawer,
  TextField,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Tabs,
  Tab,
  Divider,
  Alert,
  CircularProgress,
  Stack,
  Paper,
  InputAdornment,
} from '@mui/material';
import {
  ShoppingCart as CartIcon,
  Add as AddIcon,
  Remove as RemoveIcon,
  Close as CloseIcon,
  Search as SearchIcon,
  Star as StarIcon,
  LocalShipping as ShippingIcon,
  CheckCircle as CheckCircleIcon,
  Edit as EditIcon,
} from '@mui/icons-material';
import { MerchandiseProduct, CartItem, ShippingAddress } from '@/types/merchandise';

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
    images: ['/products/tshirt-1.jpg', '/products/tshirt-2.jpg'],
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
    description: 'Official school sports jersey with moisture-wicking fabric',
    category: 'apparel',
    basePrice: 39.99,
    images: ['/products/jersey-1.jpg'],
    available: true,
    bestseller: true,
    sizes: ['S', 'M', 'L', 'XL'],
    colors: ['Home Blue', 'Away White'],
    customizable: true,
    customizationOptions: {
      allowName: true,
      allowYear: false,
      allowNumber: true,
      maxNameLength: 15,
      numberRange: { min: 0, max: 99 },
    },
    stock: { 'Home Blue-M': 25, 'Home Blue-L': 20 },
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: '3',
    name: 'School Hoodie',
    description: 'Warm and comfortable hoodie with school branding',
    category: 'apparel',
    basePrice: 44.99,
    images: ['/products/hoodie-1.jpg'],
    available: true,
    bestseller: false,
    sizes: ['S', 'M', 'L', 'XL'],
    colors: ['Navy', 'Gray'],
    customizable: true,
    customizationOptions: {
      allowName: true,
      allowYear: true,
      allowNumber: false,
    },
    stock: { 'Navy-M': 30 },
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: '4',
    name: 'School Backpack',
    description: 'Durable backpack with padded laptop compartment',
    category: 'accessories',
    basePrice: 34.99,
    images: ['/products/backpack-1.jpg'],
    available: true,
    bestseller: true,
    colors: ['Navy', 'Black'],
    customizable: false,
    stock: { Navy: 45, Black: 50 },
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: '5',
    name: 'Notebook Set',
    description: 'Set of 5 branded notebooks with school crest',
    category: 'stationery',
    basePrice: 14.99,
    images: ['/products/notebooks-1.jpg'],
    available: true,
    bestseller: false,
    customizable: false,
    stock: { default: 100 },
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: '6',
    name: 'Water Bottle',
    description: 'Insulated stainless steel water bottle',
    category: 'accessories',
    basePrice: 19.99,
    images: ['/products/bottle-1.jpg'],
    available: true,
    bestseller: false,
    colors: ['Navy', 'Silver'],
    customizable: true,
    customizationOptions: {
      allowName: true,
      allowYear: false,
      allowNumber: false,
      maxNameLength: 15,
    },
    stock: { Navy: 60, Silver: 55 },
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
];

export default function SchoolMerchandiseStore() {
  const [products] = useState<MerchandiseProduct[]>(MOCK_PRODUCTS);
  const [cart, setCart] = useState<CartItem[]>([]);
  const [cartOpen, setCartOpen] = useState(false);
  const [customizeDialogOpen, setCustomizeDialogOpen] = useState(false);
  const [checkoutDialogOpen, setCheckoutDialogOpen] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState<MerchandiseProduct | null>(null);
  const [selectedSize, setSelectedSize] = useState('');
  const [selectedColor, setSelectedColor] = useState('');
  const [customization, setCustomization] = useState({
    studentName: '',
    graduationYear: '',
    jerseyNumber: '',
  });
  const [quantity, setQuantity] = useState(1);
  const [searchQuery, setSearchQuery] = useState('');
  const [categoryFilter, setCategoryFilter] = useState<string>('all');
  const [tabValue, setTabValue] = useState(0);
  const [shippingAddress, setShippingAddress] = useState<ShippingAddress>({
    fullName: '',
    addressLine1: '',
    addressLine2: '',
    city: '',
    state: '',
    postalCode: '',
    country: 'USA',
    phone: '',
  });
  const [processing, setProcessing] = useState(false);
  const [orderSuccess, setOrderSuccess] = useState(false);

  const filteredProducts = products.filter((product) => {
    const matchesSearch = product.name.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory = categoryFilter === 'all' || product.category === categoryFilter;
    return matchesSearch && matchesCategory;
  });

  const bestsellers = products.filter((p) => p.bestseller);

  const handleOpenCustomize = (product: MerchandiseProduct) => {
    setSelectedProduct(product);
    setSelectedSize(product.sizes?.[0] || '');
    setSelectedColor(product.colors?.[0] || '');
    setQuantity(1);
    setCustomization({ studentName: '', graduationYear: '', jerseyNumber: '' });
    setCustomizeDialogOpen(true);
  };

  const handleAddToCart = () => {
    if (!selectedProduct) return;

    const cartItem: CartItem = {
      productId: selectedProduct.id,
      product: selectedProduct,
      quantity,
      selectedSize,
      selectedColor,
      customization: selectedProduct.customizable ? customization : undefined,
      price: selectedProduct.basePrice * quantity,
    };

    setCart([...cart, cartItem]);
    setCustomizeDialogOpen(false);
    setCartOpen(true);
  };

  const handleRemoveFromCart = (index: number) => {
    setCart(cart.filter((_, i) => i !== index));
  };

  const handleUpdateQuantity = (index: number, newQuantity: number) => {
    if (newQuantity < 1) return;
    const updatedCart = [...cart];
    updatedCart[index].quantity = newQuantity;
    updatedCart[index].price = updatedCart[index].product.basePrice * newQuantity;
    setCart(updatedCart);
  };

  const calculateSubtotal = () => {
    return cart.reduce((sum, item) => sum + item.price, 0);
  };

  const calculateTax = () => {
    return calculateSubtotal() * 0.08;
  };

  const calculateShipping = () => {
    const subtotal = calculateSubtotal();
    return subtotal > 50 ? 0 : 5.99;
  };

  const calculateTotal = () => {
    return calculateSubtotal() + calculateTax() + calculateShipping();
  };

  const handleCheckout = async () => {
    setProcessing(true);
    try {
      await new Promise((resolve) => setTimeout(resolve, 2000));
      setOrderSuccess(true);
      setCart([]);
      setTimeout(() => {
        setCheckoutDialogOpen(false);
        setOrderSuccess(false);
      }, 3000);
    } catch (error) {
      console.error('Checkout failed:', error);
    } finally {
      setProcessing(false);
    }
  };

  return (
    <Container maxWidth="xl" sx={{ py: 4 }}>
      <Box sx={{ mb: 4, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <Box>
          <Typography variant="h4" fontWeight={700} gutterBottom>
            School Merchandise Store
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Official school apparel and accessories
          </Typography>
        </Box>
        <IconButton onClick={() => setCartOpen(true)} color="primary">
          <Badge badgeContent={cart.length} color="error">
            <CartIcon fontSize="large" />
          </Badge>
        </IconButton>
      </Box>

      <Paper sx={{ mb: 3, p: 2 }}>
        <Grid container spacing={2} alignItems="center">
          <Grid item xs={12} md={6}>
            <TextField
              fullWidth
              placeholder="Search products..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <SearchIcon />
                  </InputAdornment>
                ),
              }}
            />
          </Grid>
          <Grid item xs={12} md={3}>
            <FormControl fullWidth>
              <InputLabel>Category</InputLabel>
              <Select
                value={categoryFilter}
                label="Category"
                onChange={(e) => setCategoryFilter(e.target.value)}
              >
                <MenuItem value="all">All Categories</MenuItem>
                <MenuItem value="apparel">Apparel</MenuItem>
                <MenuItem value="accessories">Accessories</MenuItem>
                <MenuItem value="stationery">Stationery</MenuItem>
                <MenuItem value="sports">Sports Equipment</MenuItem>
              </Select>
            </FormControl>
          </Grid>
        </Grid>
      </Paper>

      <Tabs value={tabValue} onChange={(_, v) => setTabValue(v)} sx={{ mb: 3 }}>
        <Tab label="All Products" />
        <Tab
          label={`Bestsellers (${bestsellers.length})`}
          icon={<StarIcon />}
          iconPosition="start"
        />
      </Tabs>

      <TabPanel value={tabValue} index={0}>
        <Grid container spacing={3}>
          {filteredProducts.map((product) => (
            <Grid item xs={12} sm={6} md={4} lg={3} key={product.id}>
              <Card
                sx={{
                  height: '100%',
                  display: 'flex',
                  flexDirection: 'column',
                  position: 'relative',
                }}
              >
                {product.bestseller && (
                  <Chip
                    label="Bestseller"
                    color="warning"
                    size="small"
                    icon={<StarIcon />}
                    sx={{ position: 'absolute', top: 8, right: 8, zIndex: 1 }}
                  />
                )}
                <CardMedia
                  component="div"
                  sx={{
                    height: 240,
                    bgcolor: 'grey.200',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                >
                  <Typography variant="caption" color="text.secondary">
                    {product.name}
                  </Typography>
                </CardMedia>
                <CardContent sx={{ flexGrow: 1 }}>
                  <Typography variant="h6" gutterBottom>
                    {product.name}
                  </Typography>
                  <Typography variant="body2" color="text.secondary" gutterBottom>
                    {product.description}
                  </Typography>
                  <Box sx={{ mt: 2, display: 'flex', gap: 0.5, flexWrap: 'wrap' }}>
                    {product.sizes && (
                      <Chip
                        label={`Sizes: ${product.sizes.join(', ')}`}
                        size="small"
                        variant="outlined"
                      />
                    )}
                    {product.colors && (
                      <Chip
                        label={`${product.colors.length} colors`}
                        size="small"
                        variant="outlined"
                      />
                    )}
                    {product.customizable && (
                      <Chip label="Customizable" size="small" color="primary" />
                    )}
                  </Box>
                </CardContent>
                <CardActions sx={{ p: 2, pt: 0 }}>
                  <Typography variant="h6" sx={{ flexGrow: 1 }}>
                    ${product.basePrice.toFixed(2)}
                  </Typography>
                  <Button
                    variant="contained"
                    onClick={() => handleOpenCustomize(product)}
                    disabled={!product.available}
                  >
                    Add to Cart
                  </Button>
                </CardActions>
              </Card>
            </Grid>
          ))}
        </Grid>
      </TabPanel>

      <TabPanel value={tabValue} index={1}>
        <Grid container spacing={3}>
          {bestsellers.map((product) => (
            <Grid item xs={12} sm={6} md={4} lg={3} key={product.id}>
              <Card sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
                <CardMedia
                  component="div"
                  sx={{
                    height: 240,
                    bgcolor: 'grey.200',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                >
                  <Typography variant="caption" color="text.secondary">
                    {product.name}
                  </Typography>
                </CardMedia>
                <CardContent sx={{ flexGrow: 1 }}>
                  <Typography variant="h6" gutterBottom>
                    {product.name}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    {product.description}
                  </Typography>
                </CardContent>
                <CardActions sx={{ p: 2, pt: 0 }}>
                  <Typography variant="h6" sx={{ flexGrow: 1 }}>
                    ${product.basePrice.toFixed(2)}
                  </Typography>
                  <Button variant="contained" onClick={() => handleOpenCustomize(product)}>
                    Add to Cart
                  </Button>
                </CardActions>
              </Card>
            </Grid>
          ))}
        </Grid>
      </TabPanel>

      <Drawer anchor="right" open={cartOpen} onClose={() => setCartOpen(false)}>
        <Box sx={{ width: 400, p: 3 }}>
          <Box
            sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}
          >
            <Typography variant="h6">Shopping Cart ({cart.length})</Typography>
            <IconButton onClick={() => setCartOpen(false)}>
              <CloseIcon />
            </IconButton>
          </Box>

          {cart.length === 0 ? (
            <Alert severity="info">Your cart is empty</Alert>
          ) : (
            <>
              <Stack spacing={2} sx={{ mb: 3 }}>
                {cart.map((item, index) => (
                  <Card key={index} variant="outlined">
                    <CardContent>
                      <Typography variant="subtitle2" gutterBottom>
                        {item.product.name}
                      </Typography>
                      {item.selectedSize && (
                        <Typography variant="caption" display="block">
                          Size: {item.selectedSize}
                        </Typography>
                      )}
                      {item.selectedColor && (
                        <Typography variant="caption" display="block">
                          Color: {item.selectedColor}
                        </Typography>
                      )}
                      {item.customization?.studentName && (
                        <Typography variant="caption" display="block">
                          Name: {item.customization.studentName}
                        </Typography>
                      )}
                      {item.customization?.graduationYear && (
                        <Typography variant="caption" display="block">
                          Year: {item.customization.graduationYear}
                        </Typography>
                      )}
                      {item.customization?.jerseyNumber && (
                        <Typography variant="caption" display="block">
                          Number: {item.customization.jerseyNumber}
                        </Typography>
                      )}
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mt: 2 }}>
                        <IconButton
                          size="small"
                          onClick={() => handleUpdateQuantity(index, item.quantity - 1)}
                        >
                          <RemoveIcon />
                        </IconButton>
                        <Typography>{item.quantity}</Typography>
                        <IconButton
                          size="small"
                          onClick={() => handleUpdateQuantity(index, item.quantity + 1)}
                        >
                          <AddIcon />
                        </IconButton>
                        <Typography sx={{ ml: 'auto' }}>${item.price.toFixed(2)}</Typography>
                        <IconButton size="small" onClick={() => handleRemoveFromCart(index)}>
                          <CloseIcon />
                        </IconButton>
                      </Box>
                    </CardContent>
                  </Card>
                ))}
              </Stack>

              <Divider sx={{ my: 2 }} />

              <Stack spacing={1} sx={{ mb: 3 }}>
                <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                  <Typography>Subtotal:</Typography>
                  <Typography>${calculateSubtotal().toFixed(2)}</Typography>
                </Box>
                <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                  <Typography>Tax:</Typography>
                  <Typography>${calculateTax().toFixed(2)}</Typography>
                </Box>
                <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                  <Typography>Shipping:</Typography>
                  <Typography>
                    {calculateShipping() === 0 ? 'FREE' : `$${calculateShipping().toFixed(2)}`}
                  </Typography>
                </Box>
                {calculateSubtotal() < 50 && (
                  <Alert severity="info" sx={{ mt: 1 }}>
                    Add ${(50 - calculateSubtotal()).toFixed(2)} more for free shipping!
                  </Alert>
                )}
                <Divider sx={{ my: 1 }} />
                <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                  <Typography variant="h6">Total:</Typography>
                  <Typography variant="h6">${calculateTotal().toFixed(2)}</Typography>
                </Box>
              </Stack>

              <Button
                variant="contained"
                fullWidth
                size="large"
                onClick={() => {
                  setCartOpen(false);
                  setCheckoutDialogOpen(true);
                }}
              >
                Proceed to Checkout
              </Button>
            </>
          )}
        </Box>
      </Drawer>

      <Dialog
        open={customizeDialogOpen}
        onClose={() => setCustomizeDialogOpen(false)}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle>
          Customize Product
          <Typography variant="body2" color="text.secondary">
            {selectedProduct?.name}
          </Typography>
        </DialogTitle>
        <DialogContent>
          <Stack spacing={3} sx={{ mt: 2 }}>
            {selectedProduct?.sizes && (
              <FormControl fullWidth>
                <InputLabel>Size</InputLabel>
                <Select
                  value={selectedSize}
                  label="Size"
                  onChange={(e) => setSelectedSize(e.target.value)}
                >
                  {selectedProduct.sizes.map((size) => (
                    <MenuItem key={size} value={size}>
                      {size}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            )}

            {selectedProduct?.colors && (
              <FormControl fullWidth>
                <InputLabel>Color</InputLabel>
                <Select
                  value={selectedColor}
                  label="Color"
                  onChange={(e) => setSelectedColor(e.target.value)}
                >
                  {selectedProduct.colors.map((color) => (
                    <MenuItem key={color} value={color}>
                      {color}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            )}

            {selectedProduct?.customizable && (
              <>
                <Alert severity="info" icon={<EditIcon />}>
                  Live Preview: Your customization will appear on the product
                </Alert>

                {selectedProduct.customizationOptions?.allowName && (
                  <TextField
                    label="Student Name"
                    value={customization.studentName}
                    onChange={(e) =>
                      setCustomization({ ...customization, studentName: e.target.value })
                    }
                    helperText={`Max ${selectedProduct.customizationOptions.maxNameLength} characters`}
                    inputProps={{ maxLength: selectedProduct.customizationOptions.maxNameLength }}
                  />
                )}

                {selectedProduct.customizationOptions?.allowYear && (
                  <TextField
                    label="Graduation Year"
                    value={customization.graduationYear}
                    onChange={(e) =>
                      setCustomization({ ...customization, graduationYear: e.target.value })
                    }
                    placeholder="2024"
                  />
                )}

                {selectedProduct.customizationOptions?.allowNumber && (
                  <TextField
                    label="Jersey Number"
                    type="number"
                    value={customization.jerseyNumber}
                    onChange={(e) =>
                      setCustomization({ ...customization, jerseyNumber: e.target.value })
                    }
                    inputProps={{
                      min: selectedProduct.customizationOptions.numberRange?.min,
                      max: selectedProduct.customizationOptions.numberRange?.max,
                    }}
                  />
                )}

                <Paper
                  sx={{
                    p: 3,
                    bgcolor: 'grey.100',
                    textAlign: 'center',
                    minHeight: 200,
                    display: 'flex',
                    flexDirection: 'column',
                    justifyContent: 'center',
                  }}
                >
                  <Typography variant="h6" gutterBottom>
                    Live Preview
                  </Typography>
                  <Typography variant="h4" color="primary">
                    {customization.studentName || 'YOUR NAME'}
                  </Typography>
                  {customization.graduationYear && (
                    <Typography variant="h6">{customization.graduationYear}</Typography>
                  )}
                  {customization.jerseyNumber && (
                    <Typography variant="h3" fontWeight={700}>
                      #{customization.jerseyNumber}
                    </Typography>
                  )}
                </Paper>
              </>
            )}

            <FormControl fullWidth>
              <InputLabel>Quantity</InputLabel>
              <Select
                value={quantity}
                label="Quantity"
                onChange={(e) => setQuantity(Number(e.target.value))}
              >
                {[1, 2, 3, 4, 5].map((q) => (
                  <MenuItem key={q} value={q}>
                    {q}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>

            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <Typography variant="h6">Total:</Typography>
              <Typography variant="h5" color="primary">
                ${((selectedProduct?.basePrice || 0) * quantity).toFixed(2)}
              </Typography>
            </Box>
          </Stack>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setCustomizeDialogOpen(false)}>Cancel</Button>
          <Button variant="contained" onClick={handleAddToCart}>
            Add to Cart
          </Button>
        </DialogActions>
      </Dialog>

      <Dialog
        open={checkoutDialogOpen}
        onClose={() => setCheckoutDialogOpen(false)}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle>Checkout</DialogTitle>
        <DialogContent>
          {orderSuccess ? (
            <Box sx={{ textAlign: 'center', py: 4 }}>
              <CheckCircleIcon color="success" sx={{ fontSize: 80, mb: 2 }} />
              <Typography variant="h5" gutterBottom>
                Order Placed Successfully!
              </Typography>
              <Typography variant="body2" color="text.secondary">
                You will receive an email confirmation shortly.
              </Typography>
            </Box>
          ) : (
            <Stack spacing={3} sx={{ mt: 2 }}>
              <Typography variant="h6">Shipping Address</Typography>
              <Grid container spacing={2}>
                <Grid item xs={12}>
                  <TextField
                    fullWidth
                    label="Full Name"
                    value={shippingAddress.fullName}
                    onChange={(e) =>
                      setShippingAddress({ ...shippingAddress, fullName: e.target.value })
                    }
                  />
                </Grid>
                <Grid item xs={12}>
                  <TextField
                    fullWidth
                    label="Address Line 1"
                    value={shippingAddress.addressLine1}
                    onChange={(e) =>
                      setShippingAddress({ ...shippingAddress, addressLine1: e.target.value })
                    }
                  />
                </Grid>
                <Grid item xs={12}>
                  <TextField
                    fullWidth
                    label="Address Line 2 (Optional)"
                    value={shippingAddress.addressLine2}
                    onChange={(e) =>
                      setShippingAddress({ ...shippingAddress, addressLine2: e.target.value })
                    }
                  />
                </Grid>
                <Grid item xs={12} sm={6}>
                  <TextField
                    fullWidth
                    label="City"
                    value={shippingAddress.city}
                    onChange={(e) =>
                      setShippingAddress({ ...shippingAddress, city: e.target.value })
                    }
                  />
                </Grid>
                <Grid item xs={12} sm={6}>
                  <TextField
                    fullWidth
                    label="State"
                    value={shippingAddress.state}
                    onChange={(e) =>
                      setShippingAddress({ ...shippingAddress, state: e.target.value })
                    }
                  />
                </Grid>
                <Grid item xs={12} sm={6}>
                  <TextField
                    fullWidth
                    label="Postal Code"
                    value={shippingAddress.postalCode}
                    onChange={(e) =>
                      setShippingAddress({ ...shippingAddress, postalCode: e.target.value })
                    }
                  />
                </Grid>
                <Grid item xs={12} sm={6}>
                  <TextField
                    fullWidth
                    label="Phone"
                    value={shippingAddress.phone}
                    onChange={(e) =>
                      setShippingAddress({ ...shippingAddress, phone: e.target.value })
                    }
                  />
                </Grid>
              </Grid>

              <Divider />

              <Typography variant="h6">Payment Method</Typography>
              <Alert severity="info" icon={<ShippingIcon />}>
                Secure payment powered by Stripe
              </Alert>
              <Paper sx={{ p: 2, bgcolor: 'grey.50' }}>
                <Typography variant="body2" color="text.secondary">
                  Payment integration will be processed securely through Stripe
                </Typography>
              </Paper>

              <Divider />

              <Typography variant="h6">Order Summary</Typography>
              <Stack spacing={1}>
                <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                  <Typography>Subtotal:</Typography>
                  <Typography>${calculateSubtotal().toFixed(2)}</Typography>
                </Box>
                <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                  <Typography>Tax:</Typography>
                  <Typography>${calculateTax().toFixed(2)}</Typography>
                </Box>
                <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                  <Typography>Shipping:</Typography>
                  <Typography>
                    {calculateShipping() === 0 ? 'FREE' : `$${calculateShipping().toFixed(2)}`}
                  </Typography>
                </Box>
                <Divider />
                <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                  <Typography variant="h6">Total:</Typography>
                  <Typography variant="h6">${calculateTotal().toFixed(2)}</Typography>
                </Box>
              </Stack>
            </Stack>
          )}
        </DialogContent>
        {!orderSuccess && (
          <DialogActions>
            <Button onClick={() => setCheckoutDialogOpen(false)} disabled={processing}>
              Cancel
            </Button>
            <Button variant="contained" onClick={handleCheckout} disabled={processing}>
              {processing ? <CircularProgress size={24} /> : 'Place Order'}
            </Button>
          </DialogActions>
        )}
      </Dialog>
    </Container>
  );
}
