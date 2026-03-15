import axios from '@/lib/axios';
import {
  MerchandiseProduct,
  CartItem,
  MerchandiseOrder,
  StoreSettings,
  RevenueAnalytics,
  ShippingAddress,
} from '@/types/merchandise';

const merchandiseApi = {
  getProducts: async (): Promise<MerchandiseProduct[]> => {
    const response = await axios.get('/api/merchandise/products');
    return response.data;
  },

  getProduct: async (productId: string): Promise<MerchandiseProduct> => {
    const response = await axios.get(`/api/merchandise/products/${productId}`);
    return response.data;
  },

  createProduct: async (product: Partial<MerchandiseProduct>): Promise<MerchandiseProduct> => {
    const response = await axios.post('/api/merchandise/products', product);
    return response.data;
  },

  updateProduct: async (
    productId: string,
    product: Partial<MerchandiseProduct>
  ): Promise<MerchandiseProduct> => {
    const response = await axios.put(`/api/merchandise/products/${productId}`, product);
    return response.data;
  },

  deleteProduct: async (productId: string): Promise<void> => {
    await axios.delete(`/api/merchandise/products/${productId}`);
  },

  toggleProductAvailability: async (productId: string): Promise<MerchandiseProduct> => {
    const response = await axios.patch(
      `/api/merchandise/products/${productId}/toggle-availability`
    );
    return response.data;
  },

  getStoreSettings: async (): Promise<StoreSettings> => {
    const response = await axios.get('/api/merchandise/settings');
    return response.data;
  },

  updateStoreSettings: async (settings: Partial<StoreSettings>): Promise<StoreSettings> => {
    const response = await axios.put('/api/merchandise/settings', settings);
    return response.data;
  },

  createOrder: async (orderData: {
    items: CartItem[];
    shippingAddress: ShippingAddress;
  }): Promise<{ orderId: string; paymentIntentClientSecret: string }> => {
    const response = await axios.post('/api/merchandise/orders', orderData);
    return response.data;
  },

  getOrders: async (): Promise<MerchandiseOrder[]> => {
    const response = await axios.get('/api/merchandise/orders');
    return response.data;
  },

  getOrder: async (orderId: string): Promise<MerchandiseOrder> => {
    const response = await axios.get(`/api/merchandise/orders/${orderId}`);
    return response.data;
  },

  updateOrderStatus: async (
    orderId: string,
    status: MerchandiseOrder['status']
  ): Promise<MerchandiseOrder> => {
    const response = await axios.patch(`/api/merchandise/orders/${orderId}/status`, { status });
    return response.data;
  },

  addProductionUpdate: async (
    orderId: string,
    update: { status: string; description: string }
  ): Promise<MerchandiseOrder> => {
    const response = await axios.post(
      `/api/merchandise/orders/${orderId}/production-updates`,
      update
    );
    return response.data;
  },

  updateShippingInfo: async (
    orderId: string,
    shippingInfo: { trackingNumber: string; trackingCarrier: string; estimatedDelivery: string }
  ): Promise<MerchandiseOrder> => {
    const response = await axios.patch(`/api/merchandise/orders/${orderId}/shipping`, shippingInfo);
    return response.data;
  },

  getRevenueAnalytics: async (params?: {
    startDate?: string;
    endDate?: string;
  }): Promise<RevenueAnalytics> => {
    const response = await axios.get('/api/merchandise/analytics/revenue', { params });
    return response.data;
  },

  confirmPayment: async (orderId: string, paymentIntentId: string): Promise<MerchandiseOrder> => {
    const response = await axios.post(`/api/merchandise/orders/${orderId}/confirm-payment`, {
      paymentIntentId,
    });
    return response.data;
  },

  uploadProductImage: async (productId: string, imageFile: File): Promise<string> => {
    const formData = new FormData();
    formData.append('image', imageFile);
    const response = await axios.post(`/api/merchandise/products/${productId}/images`, formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    return response.data.imageUrl;
  },

  deleteProductImage: async (productId: string, imageUrl: string): Promise<void> => {
    await axios.delete(`/api/merchandise/products/${productId}/images`, {
      data: { imageUrl },
    });
  },
};

export default merchandiseApi;
