import { VITE_API_URL, VITE_IMAGE_URL } from '@env';
import { useRoute } from '@react-navigation/native';
import axios from 'axios';
import { useCallback, useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Image,
  Linking,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import LinearGradient from 'react-native-linear-gradient';
import Toast from 'react-native-toast-message';
import MaterialIcons from 'react-native-vector-icons/MaterialIcons';
import { PRIMARY_COLOR, STATUS_COLORS } from '../theme/theme';

export default function ExpenseDetailsScreen() {
  const route = useRoute();
  const { id } = route.params;

  const [expense, setExpense] = useState(null);
  const [loading, setLoading] = useState(true);

  const fetchExpenseDetails = useCallback(async () => {
    setLoading(true);
    try {
      const { data } = await axios.get(
        `${VITE_API_URL}/expenses/get-expense/${id}`,
        { withCredentials: true },
      );
      if (data.success) setExpense(data.data);
      else
        Toast.show({ type: 'error', text1: 'Failed to fetch expense details' });
    } catch {
      Toast.show({ type: 'error', text1: 'Error fetching expense details' });
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    fetchExpenseDetails();
  }, [fetchExpenseDetails]);

  const getApprovalStyle = status => ({
    backgroundColor: STATUS_COLORS[status] + '20',
    color: STATUS_COLORS[status],
  });

  const getStatusIcon = status => {
    switch (status) {
      case 'approved':
        return 'check-circle';
      case 'rejected':
        return 'cancel';
      case 'pending':
        return 'schedule';
      default:
        return 'help';
    }
  };

  const getStatusColor = status => {
    switch (status) {
      case 'approved':
        return '#10B981';
      case 'rejected':
        return '#EF4444';
      case 'pending':
        return '#F59E0B';
      default:
        return '#6B7280';
    }
  };

  if (loading)
    return (
      <View style={styles.centered}>
        <LinearGradient
          colors={['#667eea', '#764ba2']}
          style={styles.loadingContainer}
        >
          <ActivityIndicator size="large" color="#FFFFFF" />
          <Text style={styles.loadingText}>Loading expense details...</Text>
        </LinearGradient>
      </View>
    );

  if (!expense)
    return (
      <View style={styles.centered}>
        <MaterialIcons name="error" size={64} color="#EF4444" />
        <Text style={styles.errorText}>Expense not found</Text>
      </View>
    );

  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
      {/* Header Section */}
      <LinearGradient
        colors={['#667eea', '#764ba2']}
        style={styles.headerGradient}
      >
        <Text style={styles.headerTitle}>Expense Details</Text>
        <View style={styles.headerStatusContainer}>
          <MaterialIcons
            name={getStatusIcon(expense.status)}
            size={24}
            color="#FFFFFF"
          />
          <Text style={styles.headerStatus}>
            {expense.status
              .replace(/_/g, ' ')
              .replace(/\b\w/g, c => c.toUpperCase())}
          </Text>
        </View>
      </LinearGradient>

      {/* Main Info Card */}
      <View style={[styles.mainCard, styles.cardShadow]}>
        <View style={styles.cardHeader}>
          <MaterialIcons name="receipt" size={24} color={PRIMARY_COLOR} />
          <Text style={styles.cardTitle}>Expense Information</Text>
        </View>

        <View style={styles.infoRow}>
          <View style={styles.infoItem}>
            <MaterialIcons name="description" size={20} color="#6B7280" />
            <View style={styles.infoContent}>
              <Text style={styles.infoLabel}>Expense Name</Text>
              <Text style={styles.infoValue}>{expense.expenseName}</Text>
            </View>
          </View>
        </View>

        <View style={styles.infoRow}>
          <View style={styles.infoItem}>
            <MaterialIcons name="person" size={20} color="#6B7280" />
            <View style={styles.infoContent}>
              <Text style={styles.infoLabel}>Manager</Text>
              <Text style={styles.infoValue}>
                {expense.managerId?.name || 'N/A'}
              </Text>
            </View>
          </View>
          <View style={styles.infoItem}>
            <MaterialIcons name="account-balance" size={20} color="#6B7280" />
            <View style={styles.infoContent}>
              <Text style={styles.infoLabel}>Finance</Text>
              <Text style={styles.infoValue}>
                {expense.financeId?.name || 'N/A'}
              </Text>
            </View>
          </View>
        </View>

        <View style={styles.infoRow}>
          <View style={styles.infoItem}>
            <MaterialIcons name="attach-money" size={20} color="#6B7280" />
            <View style={styles.infoContent}>
              <Text style={styles.infoLabel}>Currency</Text>
              <Text style={styles.infoValue}>{expense.currency || 'N/A'}</Text>
            </View>
          </View>
        </View>
      </View>

      {/* Sub-Expenses Section */}
      <View style={styles.sectionHeader}>
        <MaterialIcons name="list" size={24} color={PRIMARY_COLOR} />
        <Text style={styles.sectionTitle}>Sub-Expenses</Text>
      </View>

      {expense.subExpenses.map((sub, index) => (
        <View key={sub._id} style={[styles.subExpenseCard, styles.cardShadow]}>
          <View style={styles.subExpenseHeader}>
            <View style={styles.subExpenseNumber}>
              <Text style={styles.subExpenseNumberText}>{index + 1}</Text>
            </View>
            <View style={styles.subExpenseHeaderContent}>
              <Text style={styles.subExpenseName}>{sub.expenseName}</Text>
              <Text style={styles.subExpenseType}>{sub.expenseType}</Text>
            </View>
            <View style={styles.amountContainer}>
              <Text style={styles.amountText}>{sub.amount}</Text>
            </View>
          </View>

          <View style={styles.approvalSection}>
            <View style={styles.approvalItem}>
              <MaterialIcons
                name={getStatusIcon(sub.managerApproval)}
                size={20}
                color={getStatusColor(sub.managerApproval)}
              />
              <View style={styles.approvalContent}>
                <Text style={styles.approvalLabel}>Manager</Text>
                <Text
                  style={[
                    styles.approvalStatus,
                    { color: getStatusColor(sub.managerApproval) },
                  ]}
                >
                  {sub.managerApproval || 'Pending'}
                </Text>
              </View>
            </View>

            <View style={styles.approvalItem}>
              <MaterialIcons
                name={getStatusIcon(sub.financeApproval)}
                size={20}
                color={getStatusColor(sub.financeApproval)}
              />
              <View style={styles.approvalContent}>
                <Text style={styles.approvalLabel}>Finance</Text>
                <Text
                  style={[
                    styles.approvalStatus,
                    { color: getStatusColor(sub.financeApproval) },
                  ]}
                >
                  {sub.financeApproval || 'Pending'}
                </Text>
              </View>
            </View>
          </View>

          {sub.files.length > 0 && (
            <View style={styles.attachmentsSection}>
              <View style={styles.attachmentsHeader}>
                <MaterialIcons name="attach-file" size={20} color="#6B7280" />
                <Text style={styles.attachmentsTitle}>
                  Attachments ({sub.files.length})
                </Text>
              </View>
              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                style={styles.attachmentsScroll}
              >
                {sub.files.map((file, i) => {
                  const fileExt = file.split('.').pop().toLowerCase();
                  const isImage = ['jpg', 'jpeg', 'png'].includes(fileExt);
                  const fileUrl = `${VITE_IMAGE_URL}/expenses/${file}`;

                  return (
                    <TouchableOpacity
                      key={i}
                      style={styles.attachmentItem}
                      onPress={() => Linking.openURL(fileUrl)}
                    >
                      {isImage ? (
                        <View style={styles.imageContainer}>
                          <Image
                            source={{ uri: fileUrl }}
                            style={styles.attachmentImage}
                          />
                          <View style={styles.imageOverlay}>
                            <MaterialIcons
                              name="zoom-in"
                              size={20}
                              color="#FFFFFF"
                            />
                          </View>
                        </View>
                      ) : (
                        <View style={styles.pdfContainer}>
                          <MaterialIcons
                            name="picture-as-pdf"
                            size={32}
                            color="#EF4444"
                          />
                          <Text style={styles.pdfText}>PDF</Text>
                        </View>
                      )}
                      <Text style={styles.fileName} numberOfLines={2}>
                        {file}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </ScrollView>
            </View>
          )}
        </View>
      ))}

      {/* Approval Status Section */}
      <View style={styles.sectionHeader}>
        <MaterialIcons name="approval" size={24} color={PRIMARY_COLOR} />
        <Text style={styles.sectionTitle}>Approval Status</Text>
      </View>

      <View style={[styles.approvalCard, styles.cardShadow]}>
        {/* Manager Approval */}
        <View style={styles.approvalBlock}>
          <View style={styles.approvalBlockHeader}>
            <MaterialIcons name="person" size={24} color="#6B7280" />
            <Text style={styles.approvalBlockTitle}>Manager Approval</Text>
            <View
              style={[
                styles.statusBadge,
                {
                  backgroundColor:
                    getStatusColor(expense.managerApproval?.approved) + '20',
                },
              ]}
            >
              <MaterialIcons
                name={getStatusIcon(expense.managerApproval?.approved)}
                size={16}
                color={getStatusColor(expense.managerApproval?.approved)}
              />
              <Text
                style={[
                  styles.statusBadgeText,
                  { color: getStatusColor(expense.managerApproval?.approved) },
                ]}
              >
                {expense.managerApproval?.approved
                  ?.replace(/_/g, ' ')
                  .replace(/\b\w/g, char => char.toUpperCase()) || 'Pending'}
              </Text>
            </View>
          </View>

          <View style={styles.approvalDetails}>
            <View style={styles.approvalDetailRow}>
              <Text style={styles.approvalDetailLabel}>Reviewed By:</Text>
              <Text style={styles.approvalDetailValue}>
                {expense.managerApproval?.reviewedBy?.name || 'N/A'}
              </Text>
            </View>
            <View style={styles.approvalDetailRow}>
              <Text style={styles.approvalDetailLabel}>Remark:</Text>
              <Text style={styles.approvalDetailValue}>
                {expense.managerApproval?.remark || 'No remarks'}
              </Text>
            </View>
          </View>
        </View>

        <View style={styles.divider} />

        {/* Finance Approval */}
        <View style={styles.approvalBlock}>
          <View style={styles.approvalBlockHeader}>
            <MaterialIcons name="account-balance" size={24} color="#6B7280" />
            <Text style={styles.approvalBlockTitle}>Finance Approval</Text>
            <View
              style={[
                styles.statusBadge,
                {
                  backgroundColor:
                    getStatusColor(expense.financeApproval?.approved) + '20',
                },
              ]}
            >
              <MaterialIcons
                name={getStatusIcon(expense.financeApproval?.approved)}
                size={16}
                color={getStatusColor(expense.financeApproval?.approved)}
              />
              <Text
                style={[
                  styles.statusBadgeText,
                  { color: getStatusColor(expense.financeApproval?.approved) },
                ]}
              >
                {expense.financeApproval?.approved
                  ?.replace(/_/g, ' ')
                  .replace(/\b\w/g, char => char.toUpperCase()) || 'Pending'}
              </Text>
            </View>
          </View>

          <View style={styles.approvalDetails}>
            <View style={styles.approvalDetailRow}>
              <Text style={styles.approvalDetailLabel}>Reviewed By:</Text>
              <Text style={styles.approvalDetailValue}>
                {expense.financeApproval?.reviewedBy?.name || 'N/A'}
              </Text>
            </View>
            <View style={styles.approvalDetailRow}>
              <Text style={styles.approvalDetailLabel}>Remark:</Text>
              <Text style={styles.approvalDetailValue}>
                {expense.financeApproval?.remark || 'No remarks'}
              </Text>
            </View>
          </View>
        </View>
      </View>

      <View style={styles.bottomSpacing} />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8FAFC',
  },
  centered: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#F8FAFC',
  },
  loadingContainer: {
    padding: 32,
    borderRadius: 16,
    alignItems: 'center',
    margin: 20,
  },
  loadingText: {
    marginTop: 16,
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
  errorText: {
    marginTop: 16,
    color: '#EF4444',
    fontSize: 18,
    fontWeight: '600',
  },
  headerGradient: {
    padding: 24,
    paddingTop: 40,
    borderBottomLeftRadius: 24,
    borderBottomRightRadius: 24,
    marginBottom: 16,
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: '700',
    color: '#FFFFFF',
    textAlign: 'center',
    marginBottom: 12,
  },
  headerStatusContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    alignSelf: 'center',
  },
  headerStatus: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
    marginLeft: 8,
  },
  cardShadow: {
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  mainCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 20,
    marginHorizontal: 16,
    marginBottom: 20,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 20,
  },
  cardTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#1F2937',
    marginLeft: 12,
  },
  infoRow: {
    flexDirection: 'row',
    marginBottom: 16,
  },
  infoItem: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginRight: 16,
  },
  infoContent: {
    marginLeft: 12,
    flex: 1,
  },
  infoLabel: {
    fontSize: 12,
    color: '#6B7280',
    fontWeight: '500',
    marginBottom: 4,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  infoValue: {
    fontSize: 16,
    color: '#1F2937',
    fontWeight: '600',
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginHorizontal: 16,
    marginBottom: 12,
    marginTop: 8,
  },
  sectionTitle: {
    fontSize: 22,
    fontWeight: '700',
    color: '#1F2937',
    marginLeft: 12,
  },
  subExpenseCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 20,
    marginHorizontal: 16,
    marginBottom: 16,
  },
  subExpenseHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  subExpenseNumber: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: PRIMARY_COLOR,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  subExpenseNumberText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '700',
  },
  subExpenseHeaderContent: {
    flex: 1,
  },
  subExpenseName: {
    fontSize: 18,
    fontWeight: '700',
    color: '#1F2937',
    marginBottom: 4,
  },
  subExpenseType: {
    fontSize: 14,
    color: '#6B7280',
    fontWeight: '500',
    textTransform: 'capitalize',
  },
  amountContainer: {
    backgroundColor: '#F0FDF4',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#BBF7D0',
  },
  amountText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#15803D',
  },
  approvalSection: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  approvalItem: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F8FAFC',
    padding: 12,
    borderRadius: 12,
    marginHorizontal: 4,
  },
  approvalContent: {
    marginLeft: 8,
  },
  approvalLabel: {
    fontSize: 12,
    color: '#6B7280',
    fontWeight: '500',
    marginBottom: 2,
  },
  approvalStatus: {
    fontSize: 14,
    fontWeight: '600',
    textTransform: 'capitalize',
  },
  attachmentsSection: {
    marginTop: 16,
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: '#E5E7EB',
  },
  attachmentsHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  attachmentsTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#374151',
    marginLeft: 8,
  },
  attachmentsScroll: {
    marginTop: 8,
  },
  attachmentItem: {
    marginRight: 12,
    alignItems: 'center',
    width: 100,
  },
  imageContainer: {
    position: 'relative',
  },
  attachmentImage: {
    width: 80,
    height: 80,
    borderRadius: 12,
    backgroundColor: '#F3F4F6',
  },
  imageOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.3)',
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  pdfContainer: {
    width: 80,
    height: 80,
    backgroundColor: '#FEF2F2',
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#FECACA',
  },
  pdfText: {
    fontSize: 10,
    color: '#EF4444',
    fontWeight: '600',
    marginTop: 4,
  },
  fileName: {
    fontSize: 12,
    color: '#6B7280',
    textAlign: 'center',
    marginTop: 8,
    lineHeight: 16,
  },
  approvalCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 20,
    marginHorizontal: 16,
    marginBottom: 20,
  },
  approvalBlock: {
    marginBottom: 8,
  },
  approvalBlockHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  approvalBlockTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#1F2937',
    marginLeft: 12,
    flex: 1,
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
  },
  statusBadgeText: {
    fontSize: 14,
    fontWeight: '600',
    marginLeft: 4,
    textTransform: 'capitalize',
  },
  approvalDetails: {
    marginLeft: 36,
  },
  approvalDetailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  approvalDetailLabel: {
    fontSize: 14,
    color: '#6B7280',
    fontWeight: '500',
    flex: 1,
  },
  approvalDetailValue: {
    fontSize: 14,
    color: '#1F2937',
    fontWeight: '600',
    flex: 2,
    textAlign: 'right',
  },
  divider: {
    height: 1,
    backgroundColor: '#E5E7EB',
    marginVertical: 20,
  },
  bottomSpacing: {
    height: 20,
  },
});
