import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  ActivityIndicator,
  TouchableOpacity,
  RefreshControl,
} from 'react-native';
import { useAppDispatch, useAppSelector } from '@store/hooks';
import { fetchFeePayments } from '@store/slices/parentSlice';
import { RouteProp } from '@react-navigation/native';
import { MainTabParamList } from '../../types/navigation';
import { isDemoUser, demoDataApi } from '../../api/demoDataApi';
import { FeePayment } from '../../types/parent';

type FeeManagementScreenRouteProp = RouteProp<MainTabParamList, 'FeeManagement'>;

interface FeeManagementScreenProps {
  route: FeeManagementScreenRouteProp;
}

export const FeeManagementScreen: React.FC<FeeManagementScreenProps> = ({ route }) => {
  const { childId } = route.params;
  const dispatch = useAppDispatch();
  const { feePayments, children } = useAppSelector((state) => state.parent);

  const [isLoading, setIsLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [demoPayments, setDemoPayments] = useState<FeePayment[]>([]);

  const child = children.find((c) => c.id === childId);
  const isDemo = isDemoUser();
  const payments = isDemo ? demoPayments : (feePayments[childId] || []);

  useEffect(() => {
    loadFeeData();
  }, [childId]);

  const loadFeeData = async () => {
    setIsLoading(true);
    try {
      if (isDemoUser()) {
        const paymentsData = await demoDataApi.parent.getFeePayments(childId);
        setDemoPayments(paymentsData);
      } else {
        await dispatch(fetchFeePayments(childId));
      }
    } catch (error) {
      console.error('Failed to load fee data:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    await loadFeeData();
    setRefreshing(false);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'paid':
        return '#34C759';
      case 'pending':
        return '#FF9500';
      case 'overdue':
        return '#FF3B30';
      default:
        return '#8E8E93';
    }
  };

  const getStatusBgColor = (status: string) => {
    switch (status) {
      case 'paid':
        return '#E8F5E9';
      case 'pending':
        return '#FFF3E0';
      case 'overdue':
        return '#FFEBEE';
      default:
        return '#F2F2F7';
    }
  };

  const calculateTotals = () => {
    const totalAmount = payments.reduce((sum, payment) => sum + payment.amount, 0);
    const paidAmount = payments
      .filter((p) => p.status === 'paid')
      .reduce((sum, payment) => sum + payment.amount, 0);
    const pendingAmount = payments
      .filter((p) => p.status === 'pending' || p.status === 'overdue')
      .reduce((sum, payment) => sum + payment.amount, 0);

    return { totalAmount, paidAmount, pendingAmount };
  };

  const sortedPayments = [...payments].sort((a, b) => {
    if (a.status === 'pending' && b.status !== 'pending') return -1;
    if (a.status !== 'pending' && b.status === 'pending') return 1;
    return new Date(b.due_date).getTime() - new Date(a.due_date).getTime();
  });

  const pendingPayments = sortedPayments.filter((p) => p.status === 'pending' || p.status === 'overdue');
  const paidPayments = sortedPayments.filter((p) => p.status === 'paid');

  if (isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#5856D6" />
      </View>
    );
  }

  const { totalAmount, paidAmount, pendingAmount } = calculateTotals();

  return (
    <ScrollView
      style={styles.container}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={handleRefresh} />}
    >
      {child && (
        <View style={styles.header}>
          <Text style={styles.headerTitle}>
            {child.first_name} {child.last_name}
          </Text>
          <Text style={styles.headerSubtitle}>Fee Management</Text>
        </View>
      )}

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Payment Summary</Text>
        <View style={styles.summaryCard}>
          <View style={styles.summaryRow}>
            <View style={styles.summaryItem}>
              <Text style={styles.summaryLabel}>Total Fees</Text>
              <Text style={styles.summaryValue}>₹{totalAmount.toLocaleString()}</Text>
            </View>
            <View style={styles.summaryDivider} />
            <View style={styles.summaryItem}>
              <Text style={styles.summaryLabel}>Paid</Text>
              <Text style={[styles.summaryValue, { color: '#34C759' }]}>
                ₹{paidAmount.toLocaleString()}
              </Text>
            </View>
          </View>
          <View style={styles.summaryDivider} />
          <View style={styles.summaryRow}>
            <View style={styles.summaryItem}>
              <Text style={styles.summaryLabel}>Pending</Text>
              <Text style={[styles.summaryValue, { color: '#FF9500' }]}>
                ₹{pendingAmount.toLocaleString()}
              </Text>
            </View>
          </View>
        </View>
      </View>

      {pendingPayments.length > 0 && (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Pending Payments</Text>
          {pendingPayments.map((payment) => {
            const isOverdue = new Date(payment.due_date) < new Date() && payment.status === 'pending';
            const actualStatus = isOverdue ? 'overdue' : payment.status;

            return (
              <View key={payment.id} style={styles.paymentCard}>
                <View style={styles.paymentHeader}>
                  <Text style={styles.paymentType}>{payment.fee_type}</Text>
                  <View
                    style={[
                      styles.statusBadge,
                      { backgroundColor: getStatusBgColor(actualStatus) },
                    ]}
                  >
                    <Text style={[styles.statusText, { color: getStatusColor(actualStatus) }]}>
                      {actualStatus.toUpperCase()}
                    </Text>
                  </View>
                </View>

                <View style={styles.paymentDetails}>
                  <View style={styles.paymentRow}>
                    <Text style={styles.paymentLabel}>Amount:</Text>
                    <Text style={styles.paymentAmount}>₹{payment.amount.toLocaleString()}</Text>
                  </View>
                  <View style={styles.paymentRow}>
                    <Text style={styles.paymentLabel}>Due Date:</Text>
                    <Text
                      style={[
                        styles.paymentValue,
                        isOverdue && { color: '#FF3B30', fontWeight: '600' },
                      ]}
                    >
                      {new Date(payment.due_date).toLocaleDateString()}
                    </Text>
                  </View>
                </View>

                {isOverdue && (
                  <View style={styles.overdueNotice}>
                    <Text style={styles.overdueText}>⚠️ Payment is overdue</Text>
                  </View>
                )}

                <TouchableOpacity style={styles.payButton}>
                  <Text style={styles.payButtonText}>Pay Now</Text>
                </TouchableOpacity>
              </View>
            );
          })}
        </View>
      )}

      {paidPayments.length > 0 && (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Payment History</Text>
          {paidPayments.map((payment) => (
            <View key={payment.id} style={styles.paymentCard}>
              <View style={styles.paymentHeader}>
                <Text style={styles.paymentType}>{payment.fee_type}</Text>
                <View
                  style={[
                    styles.statusBadge,
                    { backgroundColor: getStatusBgColor(payment.status) },
                  ]}
                >
                  <Text style={[styles.statusText, { color: getStatusColor(payment.status) }]}>
                    {payment.status.toUpperCase()}
                  </Text>
                </View>
              </View>

              <View style={styles.paymentDetails}>
                <View style={styles.paymentRow}>
                  <Text style={styles.paymentLabel}>Amount:</Text>
                  <Text style={styles.paymentAmount}>₹{payment.amount.toLocaleString()}</Text>
                </View>
                <View style={styles.paymentRow}>
                  <Text style={styles.paymentLabel}>Due Date:</Text>
                  <Text style={styles.paymentValue}>
                    {new Date(payment.due_date).toLocaleDateString()}
                  </Text>
                </View>
                {payment.paid_date && (
                  <View style={styles.paymentRow}>
                    <Text style={styles.paymentLabel}>Paid Date:</Text>
                    <Text style={styles.paymentValue}>
                      {new Date(payment.paid_date).toLocaleDateString()}
                    </Text>
                  </View>
                )}
              </View>

              <View style={styles.paidIndicator}>
                <Text style={styles.paidText}>✓ Payment Completed</Text>
              </View>
            </View>
          ))}
        </View>
      )}

      {payments.length === 0 && (
        <View style={styles.emptyState}>
          <Text style={styles.emptyIcon}>💰</Text>
          <Text style={styles.emptyText}>No fee records available</Text>
        </View>
      )}
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F2F2F7',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#F2F2F7',
  },
  header: {
    backgroundColor: '#5856D6',
    padding: 24,
    paddingTop: 40,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#FFFFFF',
  },
  headerSubtitle: {
    fontSize: 16,
    color: '#FFFFFF',
    opacity: 0.9,
    marginTop: 4,
  },
  section: {
    padding: 16,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#1C1C1E',
    marginBottom: 16,
  },
  summaryCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
  },
  summaryItem: {
    flex: 1,
    alignItems: 'center',
  },
  summaryLabel: {
    fontSize: 14,
    color: '#8E8E93',
    marginBottom: 8,
  },
  summaryValue: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#1C1C1E',
  },
  summaryDivider: {
    width: 1,
    height: '100%',
    backgroundColor: '#E5E5EA',
    marginVertical: 12,
  },
  paymentCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  paymentHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  paymentType: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1C1C1E',
    flex: 1,
  },
  statusBadge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
  },
  statusText: {
    fontSize: 11,
    fontWeight: 'bold',
  },
  paymentDetails: {
    marginBottom: 12,
  },
  paymentRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  paymentLabel: {
    fontSize: 14,
    color: '#8E8E93',
  },
  paymentValue: {
    fontSize: 14,
    color: '#1C1C1E',
    fontWeight: '500',
  },
  paymentAmount: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#5856D6',
  },
  overdueNotice: {
    backgroundColor: '#FFEBEE',
    padding: 10,
    borderRadius: 8,
    marginBottom: 12,
  },
  overdueText: {
    fontSize: 13,
    color: '#FF3B30',
    fontWeight: '600',
    textAlign: 'center',
  },
  payButton: {
    backgroundColor: '#5856D6',
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: 'center',
  },
  payButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  paidIndicator: {
    backgroundColor: '#E8F5E9',
    padding: 10,
    borderRadius: 8,
  },
  paidText: {
    fontSize: 13,
    color: '#34C759',
    fontWeight: '600',
    textAlign: 'center',
  },
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 60,
  },
  emptyIcon: {
    fontSize: 64,
    marginBottom: 16,
  },
  emptyText: {
    fontSize: 16,
    color: '#8E8E93',
  },
});
