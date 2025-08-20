import { VITE_API_URL, VITE_IMAGE_URL } from '@env';
import { useNavigation, useRoute } from '@react-navigation/native';
import { useQueryClient } from '@tanstack/react-query';
import axios from 'axios';
import { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Linking,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import Toast from 'react-native-toast-message';
import MaterialIcons from 'react-native-vector-icons/MaterialIcons';
import { useSelector } from 'react-redux';
import {
  BORDER_RADIUS,
  COLORS,
  COMPONENT_STYLES,
  LAYOUT,
  SPACING,
  TYPOGRAPHY,
} from '../theme/theme';

const TeamExpenseDetails = () => {
  const navigation = useNavigation();
  const route = useRoute();
  const queryClient = useQueryClient();
  const { id } = route.params;
  const [expense, setExpense] = useState(null);
  const [loading, setLoading] = useState(true);
  const [remark, setRemark] = useState('');
  const [selectedSubExpenses, setSelectedSubExpenses] = useState([]);
  const user = useSelector(state => state.auth.data);
  console.log('User:', user);

  useEffect(() => {
    fetchExpenseDetails();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  // Enhanced status styling with comprehensive status support
  const getStatusStyle = status => {
    const statusColors = {
      draft: {
        backgroundColor: COLORS.neutral[100],
        color: COLORS.neutral[600],
        borderColor: COLORS.neutral[300],
      },
      pending: {
        backgroundColor: COLORS.warning[50],
        color: COLORS.warning[800],
        borderColor: COLORS.warning[200],
      },
      resubmission: {
        backgroundColor: COLORS.warning[100],
        color: COLORS.warning[900],
        borderColor: COLORS.warning[300],
      },
      manager_approved: {
        backgroundColor: COLORS.info[50],
        color: COLORS.info[800],
        borderColor: COLORS.info[200],
      },
      finance_approved: {
        backgroundColor: COLORS.success[50],
        color: COLORS.success[800],
        borderColor: COLORS.success[200],
      },
      approved: {
        backgroundColor: COLORS.success[50],
        color: COLORS.success[800],
        borderColor: COLORS.success[200],
      },
      rejected: {
        backgroundColor: COLORS.error[50],
        color: COLORS.error[800],
        borderColor: COLORS.error[200],
      },
      manager_partially_approved: {
        backgroundColor: COLORS.primary[50],
        color: COLORS.primary[800],
        borderColor: COLORS.primary[200],
      },
      finance_partially_approved: {
        backgroundColor: COLORS.success[100],
        color: COLORS.success[900],
        borderColor: COLORS.success[300],
      },
      partially_approved: {
        backgroundColor: COLORS.primary[50],
        color: COLORS.primary[800],
        borderColor: COLORS.primary[200],
      },
      in_progress: {
        backgroundColor: COLORS.info[50],
        color: COLORS.info[800],
        borderColor: COLORS.info[200],
      },
    };
    return (
      statusColors[status] || {
        backgroundColor: COLORS.neutral[100],
        color: COLORS.neutral[600],
        borderColor: COLORS.neutral[300],
      }
    );
  };

  // Enhanced approval styling
  const getApprovalStyle = approvalStatus => {
    const approvalColors = {
      approved: {
        backgroundColor: COLORS.success[50],
        color: COLORS.success[800],
        borderColor: COLORS.success[200],
      },
      rejected: {
        backgroundColor: COLORS.error[50],
        color: COLORS.error[800],
        borderColor: COLORS.error[200],
      },
      resubmission: {
        backgroundColor: COLORS.warning[50],
        color: COLORS.warning[800],
        borderColor: COLORS.warning[200],
      },
      pending: {
        backgroundColor: COLORS.warning[50],
        color: COLORS.warning[800],
        borderColor: COLORS.warning[200],
      },
      partially_approved: {
        backgroundColor: COLORS.primary[50],
        color: COLORS.primary[800],
        borderColor: COLORS.primary[200],
      },
    };
    return (
      approvalColors[approvalStatus] || {
        backgroundColor: COLORS.neutral[100],
        color: COLORS.neutral[600],
        borderColor: COLORS.neutral[300],
      }
    );
  };

  // Format status text for display
  const formatStatusText = status => {
    if (!status) return 'Pending';
    return status.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase());
  };

  const fetchExpenseDetails = async () => {
    setLoading(true);
    try {
      const { data } = await axios.get(
        `${VITE_API_URL}/expenses/get-expense/${id}`,
        { withCredentials: true },
      );
      if (data.success) {
        setExpense(data.data);
        if (user._id === data.data.managerId?._id) {
          setRemark(data.data.managerApproval?.remark || '');
        } else if (user._id === data.data.financeId?._id) {
          setRemark(data.data.financeApproval?.remark || '');
        }
      } else {
        Toast.show({ type: 'error', text1: 'Failed to fetch expense details' });
      }
    } catch (error) {
      Toast.show({ type: 'error', text1: 'Error fetching expense details' });
    } finally {
      setLoading(false);
    }
  };

  const toggleSubExpenseSelection = subExpenseId => {
    setSelectedSubExpenses(prev =>
      prev.includes(subExpenseId)
        ? prev.filter(id => id !== subExpenseId)
        : [...prev, subExpenseId],
    );
  };

  const handleApproval = async approvalStatus => {
    try {
      const response = await axios.put(
        `${VITE_API_URL}/expenses/update-expense-status/${id}`,
        {
          status: approvalStatus,
          remark: remark,
          subExpenseIds: selectedSubExpenses,
        },
        { withCredentials: true },
      );
      queryClient.invalidateQueries({ queryKey: ['teamExpenses'] });
      Toast.show({
        type: response.data.success ? 'success' : 'error',
        text1:
          response.data.message || `Expense ${approvalStatus} successfully`,
      });

      setRemark('');
      setSelectedSubExpenses([]);
      fetchExpenseDetails();
    } catch (error) {
      Toast.show({
        type: 'error',
        text1:
          error.response?.data?.message || 'Error updating approval status',
      });
    }
  };

  // Enhanced loading state
  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={COLORS.primary[600]} />
        <Text style={styles.loadingText}>Loading expense details...</Text>
      </View>
    );
  }

  // Enhanced error state
  if (!expense) {
    return (
      <View style={styles.errorContainer}>
        <MaterialIcons
          name="error-outline"
          size={48}
          color={COLORS.error[500]}
        />
        <Text style={styles.errorText}>Expense not found</Text>
        <TouchableOpacity
          style={styles.retryButton}
          onPress={fetchExpenseDetails}
        >
          <Text style={styles.retryButtonText}>Retry</Text>
        </TouchableOpacity>
      </View>
    );
  }

  // Check if user can approve
  const canApprove =
    user &&
    ((user._id === expense.managerId?._id &&
      (expense.managerApproval?.approved === 'pending' ||
        expense.managerApproval?.approved === 'resubmission')) ||
      (user._id === expense.financeId?._id &&
        (expense.managerApproval?.approved === 'approved' ||
          expense.managerApproval?.approved === 'partially_approved') &&
        (expense.financeApproval?.approved === 'pending' ||
          expense.financeApproval?.approved === 'resubmission')));

  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
      {/* Enhanced Back Button */}
      <TouchableOpacity
        style={styles.backButton}
        onPress={() => navigation.goBack()}
        activeOpacity={0.7}
      >
        <MaterialIcons
          name="arrow-back"
          size={20}
          color={COLORS.primary[600]}
        />
        <Text style={styles.backButtonText}>Back to Expenses</Text>
      </TouchableOpacity>

      {/* Enhanced Expense Details Card */}
      <View style={styles.mainCard}>
        <View style={styles.cardHeader}>
          <Text style={styles.cardTitle}>Expense Details</Text>
          <View style={[styles.statusBadge, getStatusStyle(expense.status)]}>
            <Text
              style={[
                styles.statusText,
                { color: getStatusStyle(expense.status).color },
              ]}
            >
              {formatStatusText(expense.status)}
            </Text>
          </View>
        </View>

        <View style={styles.detailsGrid}>
          <DetailRow label="Expense Name" value={expense.expenseName} />
          <DetailRow label="Manager" value={expense.managerId?.name || 'N/A'} />
          <DetailRow label="Finance" value={expense.financeId?.name || 'N/A'} />
          <DetailRow label="Currency" value={expense.currency || 'N/A'} />
        </View>
      </View>

      {/* Enhanced Sub-Expenses Section */}
      <View style={styles.sectionHeader}>
        <Text style={styles.sectionTitle}>Sub-Expenses</Text>
        <Text style={styles.sectionSubtitle}>
          {expense.subExpenses.length} item
          {expense.subExpenses.length !== 1 ? 's' : ''}
        </Text>
      </View>

      {expense.subExpenses.map((sub, index) => (
        <SubExpenseCard
          key={sub._id}
          subExpense={sub}
          index={index}
          user={user}
          expense={expense}
          selectedSubExpenses={selectedSubExpenses}
          onToggleSelection={toggleSubExpenseSelection}
          getApprovalStyle={getApprovalStyle}
          formatStatusText={formatStatusText}
        />
      ))}

      {/* Enhanced Remark Section */}
      {canApprove && (
        <View style={styles.remarkCard}>
          <Text style={styles.remarkTitle}>Add Remark</Text>
          <Text style={styles.remarkSubtitle}>
            Provide additional comments or feedback for this expense
          </Text>
          <TextInput
            style={styles.remarkInput}
            placeholder="Enter your remark here..."
            placeholderTextColor={COLORS.text.tertiary}
            value={remark}
            onChangeText={setRemark}
            multiline
            numberOfLines={4}
          />
        </View>
      )}

      {/* Enhanced Action Buttons */}
      {canApprove && (
        <View style={styles.actionSection}>
          <Text style={styles.actionTitle}>
            Actions ({selectedSubExpenses.length} selected)
          </Text>
          <View style={styles.actionButtons}>
            <ActionButton
              title="Approve"
              count={selectedSubExpenses.length}
              onPress={() => handleApproval('approved')}
              style={styles.approveButton}
              textStyle={styles.approveButtonText}
              icon="check-circle"
            />
            <ActionButton
              title="Reject"
              count={selectedSubExpenses.length}
              onPress={() => handleApproval('rejected')}
              style={styles.rejectButton}
              textStyle={styles.rejectButtonText}
              icon="cancel"
            />
            <ActionButton
              title="Resubmit"
              count={selectedSubExpenses.length}
              onPress={() => handleApproval('resubmission')}
              style={styles.resubmitButton}
              textStyle={styles.resubmitButtonText}
              icon="refresh"
            />
          </View>
        </View>
      )}

      <Toast />
    </ScrollView>
  );
};

// Enhanced Detail Row Component
const DetailRow = ({ label, value }) => (
  <View style={styles.detailRow}>
    <Text style={styles.detailLabel}>{label}</Text>
    <Text style={styles.detailValue}>{value}</Text>
  </View>
);

// Enhanced Sub-Expense Card Component
const SubExpenseCard = ({
  subExpense,
  index,
  user,
  expense,
  selectedSubExpenses,
  onToggleSelection,
  getApprovalStyle,
  formatStatusText,
}) => {
  const canSelect =
    user &&
    ((user._id === expense.managerId?._id &&
      subExpense.managerApproval !== 'approved' &&
      subExpense.managerApproval !== 'rejected') ||
      (user._id === expense.financeId?._id &&
        ['approved', 'partially_approved'].includes(
          expense.managerApproval?.approved,
        ) &&
        subExpense.financeApproval !== 'approved' &&
        subExpense.financeApproval !== 'rejected'));

  const isSelected = selectedSubExpenses.includes(subExpense._id);

  return (
    <View style={[styles.subExpenseCard, isSelected && styles.selectedCard]}>
      <View style={styles.subExpenseHeader}>
        {canSelect && (
          <TouchableOpacity
            style={[styles.checkbox, isSelected && styles.checkboxSelected]}
            onPress={() => onToggleSelection(subExpense._id)}
            activeOpacity={0.7}
          >
            {isSelected && (
              <MaterialIcons
                name="check"
                size={16}
                color={COLORS.background.primary}
              />
            )}
          </TouchableOpacity>
        )}
        <View style={styles.subExpenseInfo}>
          <Text style={styles.subExpenseName}>{subExpense.expenseName}</Text>
          <Text style={styles.subExpenseType}>{subExpense.expenseType}</Text>
        </View>
        <Text style={styles.subExpenseAmount}>${subExpense.amount}</Text>
      </View>

      <View style={styles.approvalSection}>
        <ApprovalStatus
          label="Manager Approval"
          status={subExpense.managerApproval}
          getApprovalStyle={getApprovalStyle}
          formatStatusText={formatStatusText}
        />
        <ApprovalStatus
          label="Finance Approval"
          status={subExpense.financeApproval}
          getApprovalStyle={getApprovalStyle}
          formatStatusText={formatStatusText}
        />
      </View>

      {subExpense.files.length > 0 && (
        <View style={styles.attachmentsSection}>
          <Text style={styles.attachmentsLabel}>Attachments</Text>
          <View style={styles.attachmentsList}>
            {subExpense.files.map((file, i) => (
              <TouchableOpacity
                key={i}
                style={styles.attachmentItem}
                onPress={() =>
                  Linking.openURL(`${VITE_IMAGE_URL}/expenses/${file}`)
                }
                activeOpacity={0.7}
              >
                <MaterialIcons
                  name="attachment"
                  size={16}
                  color={COLORS.primary[600]}
                />
                <Text style={styles.attachmentText}>{file}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>
      )}
    </View>
  );
};

// Enhanced Approval Status Component
const ApprovalStatus = ({
  label,
  status,
  getApprovalStyle,
  formatStatusText,
}) => {
  const statusStyle = getApprovalStyle(status);

  return (
    <View style={styles.approvalRow}>
      <Text style={styles.approvalLabel}>{label}</Text>
      <View
        style={[
          styles.approvalBadge,
          {
            backgroundColor: statusStyle.backgroundColor,
            borderColor: statusStyle.borderColor,
            borderWidth: 1,
          },
        ]}
      >
        <Text style={[styles.approvalText, { color: statusStyle.color }]}>
          {formatStatusText(status)}
        </Text>
      </View>
    </View>
  );
};

// Enhanced Action Button Component
const ActionButton = ({ title, count, onPress, style, textStyle, icon }) => (
  <TouchableOpacity
    style={[styles.actionButton, style]}
    onPress={onPress}
    activeOpacity={0.8}
  >
    <MaterialIcons name={icon} size={18} color={COLORS.background.primary} />
    <Text style={[styles.actionButtonText, textStyle]}>
      {title} ({count})
    </Text>
  </TouchableOpacity>
);

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background.secondary,
  },

  // Loading & Error States
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: COLORS.background.secondary,
    padding: SPACING.xl,
  },
  loadingText: {
    fontSize: TYPOGRAPHY.fontSize.base,
    color: COLORS.text.secondary,
    marginTop: SPACING.md,
    fontWeight: TYPOGRAPHY.fontWeight.medium,
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: COLORS.background.secondary,
    padding: SPACING.xl,
  },
  errorText: {
    fontSize: TYPOGRAPHY.fontSize.lg,
    color: COLORS.text.primary,
    marginTop: SPACING.md,
    marginBottom: SPACING.xl,
    textAlign: 'center',
    fontWeight: TYPOGRAPHY.fontWeight.semibold,
  },
  retryButton: {
    ...COMPONENT_STYLES.button.primary,
    paddingHorizontal: SPACING['2xl'],
  },
  retryButtonText: {
    color: COLORS.background.primary,
    fontSize: TYPOGRAPHY.fontSize.base,
    fontWeight: TYPOGRAPHY.fontWeight.semibold,
    textAlign: 'center',
  },

  // Back Button
  backButton: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: SPACING.lg,
    paddingVertical: SPACING.sm,
    margin: LAYOUT.screenPadding,
  },
  backButtonText: {
    marginLeft: SPACING.sm,
    color: COLORS.primary[600],
    fontSize: TYPOGRAPHY.fontSize.base,
    fontWeight: TYPOGRAPHY.fontWeight.medium,
  },

  // Main Card
  mainCard: {
    ...COMPONENT_STYLES.card.elevated,
    marginHorizontal: LAYOUT.screenPadding,
    marginBottom: SPACING.lg,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: SPACING.lg,
  },
  cardTitle: {
    fontSize: TYPOGRAPHY.fontSize['2xl'],
    fontWeight: TYPOGRAPHY.fontWeight.bold,
    color: COLORS.text.primary,
    flex: 1,
  },
  statusBadge: {
    alignSelf: 'flex-start',
    paddingHorizontal: SPACING.lg,
    paddingVertical: SPACING.sm,
    borderRadius: BORDER_RADIUS.full,
    marginTop: SPACING.sm,
    marginLeft: SPACING.md,
    borderWidth: 1,
  },
  statusText: {
    fontSize: TYPOGRAPHY.fontSize.sm,
    fontWeight: TYPOGRAPHY.fontWeight.semibold,
    textTransform: 'capitalize',
  },

  // Details Grid
  detailsGrid: {
    gap: SPACING.md,
  },
  detailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: SPACING.xs,
  },
  detailLabel: {
    fontSize: TYPOGRAPHY.fontSize.base,
    fontWeight: TYPOGRAPHY.fontWeight.semibold,
    color: COLORS.text.secondary,
    flex: 1,
  },
  detailValue: {
    fontSize: TYPOGRAPHY.fontSize.base,
    color: COLORS.text.primary,
    flex: 1,
    textAlign: 'right',
    fontWeight: TYPOGRAPHY.fontWeight.medium,
  },

  // Section Header
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginHorizontal: LAYOUT.screenPadding,
    marginBottom: SPACING.lg,
    marginTop: SPACING.md,
  },
  sectionTitle: {
    fontSize: TYPOGRAPHY.fontSize.xl,
    fontWeight: TYPOGRAPHY.fontWeight.bold,
    color: COLORS.text.primary,
  },
  sectionSubtitle: {
    fontSize: TYPOGRAPHY.fontSize.sm,
    color: COLORS.text.tertiary,
    fontWeight: TYPOGRAPHY.fontWeight.medium,
  },

  // Sub-Expense Card
  subExpenseCard: {
    ...COMPONENT_STYLES.card.default,
    marginHorizontal: LAYOUT.screenPadding,
    marginBottom: SPACING.md,
  },
  selectedCard: {
    borderWidth: 2,
    borderColor: COLORS.primary[300],
    backgroundColor: COLORS.primary[50],
  },
  subExpenseHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: SPACING.md,
  },
  checkbox: {
    width: 24,
    height: 24,
    borderWidth: 2,
    borderColor: COLORS.primary[600],
    borderRadius: BORDER_RADIUS.sm,
    marginRight: SPACING.md,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: SPACING.xs,
  },
  checkboxSelected: {
    backgroundColor: COLORS.primary[600],
  },
  subExpenseInfo: {
    flex: 1,
  },
  subExpenseName: {
    fontSize: TYPOGRAPHY.fontSize.lg,
    fontWeight: TYPOGRAPHY.fontWeight.semibold,
    color: COLORS.text.primary,
    marginBottom: SPACING.xs,
  },
  subExpenseType: {
    fontSize: TYPOGRAPHY.fontSize.sm,
    color: COLORS.text.tertiary,
    fontWeight: TYPOGRAPHY.fontWeight.medium,
  },
  subExpenseAmount: {
    fontSize: TYPOGRAPHY.fontSize.lg,
    fontWeight: TYPOGRAPHY.fontWeight.bold,
    color: COLORS.primary[600],
    marginLeft: SPACING.md,
  },

  // Approval Section
  approvalSection: {
    gap: SPACING.sm,
    marginBottom: SPACING.md,
  },
  approvalRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  approvalLabel: {
    fontSize: TYPOGRAPHY.fontSize.sm,
    fontWeight: TYPOGRAPHY.fontWeight.medium,
    color: COLORS.text.secondary,
    flex: 1,
  },
  approvalBadge: {
    alignSelf: 'flex-start',
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.xs,
    borderRadius: BORDER_RADIUS.full,
    marginVertical: SPACING.xs,
  },
  approvalText: {
    fontSize: TYPOGRAPHY.fontSize.xs,
    fontWeight: TYPOGRAPHY.fontWeight.semibold,
    textTransform: 'capitalize',
  },

  // Attachments
  attachmentsSection: {
    borderTopWidth: 1,
    borderTopColor: COLORS.border.light,
    paddingTop: SPACING.md,
  },
  attachmentsLabel: {
    fontSize: TYPOGRAPHY.fontSize.sm,
    fontWeight: TYPOGRAPHY.fontWeight.semibold,
    color: COLORS.text.secondary,
    marginBottom: SPACING.sm,
  },
  attachmentsList: {
    gap: SPACING.xs,
  },
  attachmentItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: SPACING.xs,
  },
  attachmentText: {
    fontSize: TYPOGRAPHY.fontSize.sm,
    color: COLORS.primary[600],
    marginLeft: SPACING.sm,
    textDecorationLine: 'underline',
    fontWeight: TYPOGRAPHY.fontWeight.medium,
  },

  // Remark Section
  remarkCard: {
    ...COMPONENT_STYLES.card.default,
    marginHorizontal: LAYOUT.screenPadding,
    marginBottom: SPACING.lg,
  },
  remarkTitle: {
    fontSize: TYPOGRAPHY.fontSize.lg,
    fontWeight: TYPOGRAPHY.fontWeight.semibold,
    color: COLORS.text.primary,
    marginBottom: SPACING.xs,
  },
  remarkSubtitle: {
    fontSize: TYPOGRAPHY.fontSize.sm,
    color: COLORS.text.tertiary,
    marginBottom: SPACING.lg,
    lineHeight: TYPOGRAPHY.fontSize.sm * TYPOGRAPHY.lineHeight.relaxed,
  },
  remarkInput: {
    backgroundColor: COLORS.background.primary,
    borderColor: COLORS.border.medium,
    borderWidth: 1,
    borderRadius: BORDER_RADIUS.lg,
    padding: SPACING.lg,
    minHeight: 80,
    textAlignVertical: 'top',
    fontSize: TYPOGRAPHY.fontSize.base,
    color: COLORS.text.primary,
  },

  // Action Section
  actionSection: {
    marginHorizontal: LAYOUT.screenPadding,
    marginBottom: SPACING['6xl'],
  },
  actionTitle: {
    fontSize: TYPOGRAPHY.fontSize.lg,
    fontWeight: TYPOGRAPHY.fontWeight.semibold,
    color: COLORS.text.primary,
    marginBottom: SPACING.lg,
    textAlign: 'center',
  },
  actionButtons: {
    gap: SPACING.md,
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: SPACING.lg,
    paddingHorizontal: SPACING.xl,
    borderRadius: BORDER_RADIUS.xl,
    gap: SPACING.sm,
  },
  actionButtonText: {
    fontSize: TYPOGRAPHY.fontSize.base,
    fontWeight: TYPOGRAPHY.fontWeight.semibold,
  },
  approveButton: {
    backgroundColor: COLORS.success[600],
  },
  approveButtonText: {
    color: COLORS.background.primary,
  },
  rejectButton: {
    backgroundColor: COLORS.error[500],
  },
  rejectButtonText: {
    color: COLORS.background.primary,
  },
  resubmitButton: {
    backgroundColor: COLORS.warning[500],
  },
  resubmitButtonText: {
    color: COLORS.background.primary,
  },
});

export default TeamExpenseDetails;
