import axios from '@/lib/axios';

export interface Subscription {
  id: number;
  institution_id: number;
  plan_name: string;
  status: string;
  billing_cycle: string;
  price: number;
  currency: string;
  max_users: number | null;
  max_storage_gb: number | null;
  features: string | null;
  start_date: string;
  end_date: string | null;
  trial_end_date: string | null;
  grace_period_end: string | null;
  canceled_at: string | null;
  next_billing_date: string | null;
  auto_renew: boolean;
  external_subscription_id: string | null;
  razorpay_subscription_id: string | null;
  razorpay_customer_id: string | null;
  metadata: string | null;
  created_at: string;
  updated_at: string;
}

export interface Plan {
  name: string;
  display_name: string;
  description: string;
  monthly_price: number;
  quarterly_price: number;
  yearly_price: number;
  max_users: number | null;
  max_storage_gb: number | null;
  features: string[];
}

export interface Invoice {
  id: number;
  subscription_id: number;
  institution_id: number;
  invoice_number: string;
  status: string;
  amount: number;
  tax_amount: number;
  total_amount: number;
  currency: string;
  billing_period_start: string;
  billing_period_end: string;
  due_date: string;
  paid_at: string | null;
  invoice_url: string | null;
  metadata: string | null;
  created_at: string;
  updated_at: string;
}

export interface PaymentMethod {
  id: number;
  card_number: string;
  card_holder: string;
  expiry_month: string;
  expiry_year: string;
  is_default: boolean;
}

export interface AddOn {
  id: number;
  name: string;
  description: string;
  monthly_price: number;
  yearly_price: number | null;
  features: string[];
}

export interface UsageData {
  students_used: number;
  teachers_used: number;
  storage_used_gb: number;
}

export interface LimitsData {
  max_users: number | null;
  max_storage_gb: number | null;
}

export interface HistoryItem {
  id: number;
  type: 'created' | 'upgraded' | 'downgraded' | 'renewed' | 'canceled' | 'payment';
  title: string;
  description: string;
  date: string;
  amount?: number;
}

export interface SubscriptionData {
  subscription: Subscription;
  availablePlans: Plan[];
  invoices: Invoice[];
  paymentMethods: PaymentMethod[];
  addOns: AddOn[];
  activeAddOns: number[];
  usage: UsageData;
  limits: LimitsData;
  history: HistoryItem[];
}

const subscriptionApi = {
  async getInstitutionSubscription(): Promise<SubscriptionData> {
    const response = await axios.get('/api/v1/institution-admin/subscription');
    return response.data;
  },

  async getPlans(): Promise<Plan[]> {
    const response = await axios.get('/api/v1/subscriptions/plans');
    return response.data;
  },

  async upgradeSubscription(
    subscriptionId: number,
    data: { new_plan_name: string; billing_cycle: string }
  ): Promise<{ subscription: Subscription; prorated_amount: number; immediate_charge: boolean }> {
    const response = await axios.post(`/api/v1/subscriptions/${subscriptionId}/upgrade`, data);
    return response.data;
  },

  async downgradeSubscription(
    subscriptionId: number,
    data: { new_plan_name: string; billing_cycle: string }
  ): Promise<Subscription> {
    const response = await axios.post(`/api/v1/subscriptions/${subscriptionId}/downgrade`, data);
    return response.data;
  },

  async cancelSubscription(subscriptionId: number, immediate: boolean): Promise<Subscription> {
    const response = await axios.post(`/api/v1/subscriptions/${subscriptionId}/cancel`, {
      immediate,
    });
    return response.data;
  },

  async renewSubscription(subscriptionId: number): Promise<Subscription> {
    const response = await axios.post(`/api/v1/subscriptions/${subscriptionId}/renew`);
    return response.data;
  },

  async updateSubscription(
    subscriptionId: number,
    data: { auto_renew?: boolean; reminder_days?: number }
  ): Promise<Subscription> {
    const response = await axios.patch(`/api/v1/subscriptions/${subscriptionId}`, data);
    return response.data;
  },

  async getInvoices(subscriptionId?: number): Promise<Invoice[]> {
    const params = subscriptionId ? { subscription_id: subscriptionId } : {};
    const response = await axios.get('/api/v1/subscriptions/invoices/', { params });
    return response.data.invoices;
  },

  async downloadInvoice(invoiceId: number): Promise<Blob> {
    const response = await axios.get(`/api/v1/subscriptions/invoices/${invoiceId}/download`, {
      responseType: 'blob',
    });
    return response.data;
  },

  async addPaymentMethod(data: {
    card_number: string;
    card_holder: string;
    expiry_month: string;
    expiry_year: string;
    cvv: string;
  }): Promise<PaymentMethod> {
    const response = await axios.post('/api/v1/institution-admin/payment-methods', data);
    return response.data;
  },

  async deletePaymentMethod(methodId: number): Promise<void> {
    await axios.delete(`/api/v1/institution-admin/payment-methods/${methodId}`);
  },

  async setDefaultPaymentMethod(methodId: number): Promise<void> {
    await axios.post(`/api/v1/institution-admin/payment-methods/${methodId}/set-default`);
  },

  async enableAddOn(addOnId: number): Promise<void> {
    await axios.post(`/api/v1/institution-admin/add-ons/${addOnId}/enable`);
  },

  async disableAddOn(addOnId: number): Promise<void> {
    await axios.post(`/api/v1/institution-admin/add-ons/${addOnId}/disable`);
  },
};

export default subscriptionApi;
