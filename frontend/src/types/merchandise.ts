export interface MerchandiseProduct {
  id: string;
  name: string;
  description: string;
  category: 'apparel' | 'accessories' | 'stationery' | 'sports' | 'other';
  basePrice: number;
  images: string[];
  available: boolean;
  bestseller: boolean;
  sizes?: string[];
  colors?: string[];
  customizable: boolean;
  customizationOptions?: {
    allowName: boolean;
    allowYear: boolean;
    allowNumber: boolean;
    maxNameLength?: number;
    numberRange?: { min: number; max: number };
  };
  stock: {
    [key: string]: number;
  };
  createdAt: string;
  updatedAt: string;
}

export interface CartItem {
  productId: string;
  product: MerchandiseProduct;
  quantity: number;
  selectedSize?: string;
  selectedColor?: string;
  customization?: {
    studentName?: string;
    graduationYear?: string;
    jerseyNumber?: string;
  };
  price: number;
}

export interface MerchandiseOrder {
  id: string;
  orderNumber: string;
  items: CartItem[];
  subtotal: number;
  tax: number;
  shipping: number;
  total: number;
  status: 'pending' | 'processing' | 'production' | 'shipped' | 'delivered' | 'cancelled';
  paymentStatus: 'pending' | 'paid' | 'failed' | 'refunded';
  paymentIntentId?: string;
  shippingAddress: ShippingAddress;
  trackingNumber?: string;
  trackingCarrier?: string;
  estimatedDelivery?: string;
  productionStatus?: ProductionUpdate[];
  createdAt: string;
  updatedAt: string;
}

export interface ShippingAddress {
  fullName: string;
  addressLine1: string;
  addressLine2?: string;
  city: string;
  state: string;
  postalCode: string;
  country: string;
  phone: string;
}

export interface ProductionUpdate {
  id: string;
  status: string;
  description: string;
  timestamp: string;
}

export interface StoreSettings {
  id: string;
  institutionId: string;
  enabled: boolean;
  commissionRate: number;
  taxRate: number;
  shippingFee: number;
  freeShippingThreshold?: number;
  customMessage?: string;
  contactEmail?: string;
  returnPolicy?: string;
  createdAt: string;
  updatedAt: string;
}

export interface RevenueAnalytics {
  totalRevenue: number;
  totalOrders: number;
  averageOrderValue: number;
  commissionEarned: number;
  topSellingProducts: {
    productId: string;
    productName: string;
    unitsSold: number;
    revenue: number;
  }[];
  revenueByCategory: {
    category: string;
    revenue: number;
    orders: number;
  }[];
  revenueOverTime: {
    date: string;
    revenue: number;
    orders: number;
  }[];
}
