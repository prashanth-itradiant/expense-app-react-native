import { VITE_API_URL } from '@env';
import { useNavigation } from '@react-navigation/native';
import { useQuery } from '@tanstack/react-query';
import axios from 'axios';
import React, { useState } from 'react';
import {
  ActivityIndicator,
  FlatList,
  RefreshControl,
  SafeAreaView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import MaterialIcons from 'react-native-vector-icons/MaterialIcons';
import {
  BORDER_RADIUS,
  COLORS,
  COMPONENT_STYLES,
  LAYOUT,
  SHADOWS,
  SPACING,
  TYPOGRAPHY,
} from '../theme/theme';

// Fetch organizational expenses
const fetchOrganizationalExpenses = async () => {
  const { data } = await axios.get(`${VITE_API_URL}/expenses/team-expenses`, {
    withCredentials: true,
  });

  return data.success
    ? data.data.map((expense, index) => ({
        id: expense._id || index + 1,
        title: expense.expenseName,
        employeeName: expense.employee?.name || 'Unknown Employee',
        employeeId: expense.employee?._id,
        status: expense.status || 'pending',
        managerApproval: expense.managerApproval?.approved || 'pending',
        financeApproval: expense.financeApproval?.approved || 'pending',
        managerName: expense.managerId?.name || 'Not Assigned',
        financeName: expense.financeId?.name || 'Not Assigned',
        totalAmount: expense.totalAmount || 0,
        createdAt: expense.createdAt,
        department: expense.employee?.department?.name || 'Unknown',
      }))
    : [];
};

// Convert to Proper Case
const toProperCase = text =>
  text
    ? text.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase())
    : 'Pending';

// Get status styling
const getStatusStyle = status => {
  switch (status?.toLowerCase()) {
    case 'finance_approved':
      return {
        backgroundColor: COLORS.success[500],
        color: COLORS.background.primary,
        icon: 'check-circle',
      };
    case 'approved':
      return {
        backgroundColor: COLORS.success[500],
        color: COLORS.background.primary,
        icon: 'check-circle',
      };

    case 'rejected':
      return {
        backgroundColor: COLORS.error[500],
        color: COLORS.background.primary,
        icon: 'cancel',
      };
    case 'partially_approved':
      return {
        backgroundColor: COLORS.warning[500],
        color: COLORS.background.primary,
        icon: 'partial-fulfillment',
      };
    case 'pending':
      return {
        backgroundColor: COLORS.info[500],
        color: COLORS.background.primary,
        icon: 'schedule',
      };
    case 'resubmission':
      return {
        backgroundColor: COLORS.warning[600],
        color: COLORS.background.primary,
        icon: 'refresh',
      };
    default:
      return {
        backgroundColor: COLORS.neutral[500],
        color: COLORS.background.primary,
        icon: 'help',
      };
  }
};

// Format date
const formatDate = dateString => {
  if (!dateString) return 'N/A';
  return new Date(dateString).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });
};

export default function OrganizationalExpensesScreen() {
  const navigation = useNavigation();
  const [refreshing, setRefreshing] = useState(false);

  const {
    data = [],
    isLoading,
    error,
    refetch,
  } = useQuery({
    queryKey: ['organizationalExpenses'],
    queryFn: fetchOrganizationalExpenses,
    staleTime: 5 * 60 * 1000,
    refetchOnWindowFocus: false,
  });

  const onRefresh = React.useCallback(async () => {
    setRefreshing(true);
    await refetch();
    setRefreshing(false);
  }, [refetch]);

  // Get statistics
  const getStatistics = () => {
    const total = data.length;
    const approved = data.filter(item => item.status === 'approved').length;
    const pending = data.filter(item => item.status === 'pending').length;
    const rejected = data.filter(item => item.status === 'rejected').length;
    const totalAmount = data.reduce(
      (sum, item) => sum + (item.totalAmount || 0),
      0,
    );

    return { total, approved, pending, rejected, totalAmount };
  };

  const stats = getStatistics();

  // Render expense item
  const renderExpenseItem = ({ item, index }) => {
    const statusStyle = getStatusStyle(item.status);
    const managerStatusStyle = getStatusStyle(item.managerApproval);
    const financeStatusStyle = getStatusStyle(item.financeApproval);

    return (
      <View
        style={[
          styles.expenseCard,
          { marginTop: index === 0 ? SPACING.md : 0 },
        ]}
      >
        {/* Header */}
        <View style={styles.cardHeader}>
          <View style={styles.headerLeft}>
            <Text style={styles.expenseTitle} numberOfLines={2}>
              {item.title}
            </Text>
            <Text style={styles.employeeName}>by {item.employeeName}</Text>
          </View>
          <View style={styles.headerRight}>
            <Text style={styles.amount}>{item.totalAmount}</Text>
            <Text style={styles.date}>{formatDate(item.createdAt)}</Text>
          </View>
        </View>

        {/* Status Section */}
        <View style={styles.statusSection}>
          <View style={styles.statusRow}>
            <Text style={styles.statusLabel}>Overall Status:</Text>
            <View
              style={[
                styles.statusBadge,
                { backgroundColor: statusStyle.backgroundColor },
              ]}
            >
              <MaterialIcons
                name={statusStyle.icon}
                size={12}
                color={statusStyle.color}
              />
              <Text style={[styles.statusText, { color: statusStyle.color }]}>
                {toProperCase(item.status)}
              </Text>
            </View>
          </View>

          <View style={styles.approvalRow}>
            <View style={styles.approvalItem}>
              <Text style={styles.approvalLabel}>Manager</Text>
              <View
                style={[
                  styles.miniStatusBadge,
                  { backgroundColor: managerStatusStyle.backgroundColor },
                ]}
              >
                <MaterialIcons
                  name={managerStatusStyle.icon}
                  size={10}
                  color={managerStatusStyle.color}
                />
                <Text
                  style={[
                    styles.miniStatusText,
                    { color: managerStatusStyle.color },
                  ]}
                >
                  {toProperCase(item.managerApproval)}
                </Text>
              </View>
            </View>

            <View style={styles.approvalItem}>
              <Text style={styles.approvalLabel}>Finance</Text>
              <View
                style={[
                  styles.miniStatusBadge,
                  { backgroundColor: financeStatusStyle.backgroundColor },
                ]}
              >
                <MaterialIcons
                  name={financeStatusStyle.icon}
                  size={10}
                  color={financeStatusStyle.color}
                />
                <Text
                  style={[
                    styles.miniStatusText,
                    { color: financeStatusStyle.color },
                  ]}
                >
                  {toProperCase(item.financeApproval)}
                </Text>
              </View>
            </View>
          </View>
        </View>

        {/* Action Buttons */}
        <View style={styles.actionContainer}>
          <TouchableOpacity
            style={[styles.actionButton, styles.viewButton]}
            activeOpacity={0.7}
            onPress={() =>
              navigation.navigate('TeamExpenseDetails', { id: item.id })
            }
          >
            <MaterialIcons
              name="visibility"
              size={16}
              color={COLORS.background.primary}
            />
            <Text style={styles.actionButtonText}>View Details</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.actionButton, styles.transferButton]}
            activeOpacity={0.7}
            onPress={() =>
              navigation.navigate('TransferExpense', { id: item.id })
            }
          >
            <MaterialIcons
              name="swap-horiz"
              size={16}
              color={COLORS.background.primary}
            />
            <Text style={styles.actionButtonText}>Transfer</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  };

  // Render header with statistics
  const renderHeader = () => (
    <View style={styles.header}>
      <View style={styles.headerContent}>
        <Text style={styles.title}>Organizational Expenses</Text>
        <Text style={styles.subtitle}>
          Manage and track all expense requests across your organization
        </Text>
      </View>
    </View>
  );

  // Render empty state
  const renderEmptyState = () => (
    <View style={styles.emptyContainer}>
      <View style={styles.emptyIconContainer}>
        <MaterialIcons
          name="receipt-long"
          size={64}
          color={COLORS.neutral[400]}
        />
      </View>
      <Text style={styles.emptyTitle}>No Expenses Found</Text>
      <Text style={styles.emptySubtitle}>
        There are currently no expense requests in your organization
      </Text>
    </View>
  );

  // Loading state
  if (isLoading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={COLORS.primary[600]} />
          <Text style={styles.loadingText}>
            Loading organizational expenses...
          </Text>
        </View>
      </SafeAreaView>
    );
  }

  // Error state
  if (error) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.errorContainer}>
          <MaterialIcons
            name="error-outline"
            size={64}
            color={COLORS.error[500]}
          />
          <Text style={styles.errorTitle}>Error Loading Expenses</Text>
          <Text style={styles.errorText}>{error.message}</Text>
          <TouchableOpacity
            style={styles.retryButton}
            onPress={() => refetch()}
          >
            <MaterialIcons
              name="refresh"
              size={20}
              color={COLORS.background.primary}
            />
            <Text style={styles.retryButtonText}>Try Again</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <FlatList
        data={data}
        keyExtractor={item => item.id.toString()}
        renderItem={renderExpenseItem}
        ListHeaderComponent={renderHeader}
        ListEmptyComponent={renderEmptyState}
        contentContainerStyle={[
          styles.listContainer,
          data.length === 0 && styles.emptyListContainer,
        ]}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            colors={[COLORS.primary[600]]}
            tintColor={COLORS.primary[600]}
          />
        }
      />
    </SafeAreaView>
  );
}

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
    padding: SPACING.xl,
  },
  loadingText: {
    marginTop: SPACING.md,
    fontSize: TYPOGRAPHY.fontSize.base,
    color: COLORS.text.secondary,
    fontWeight: TYPOGRAPHY.fontWeight.medium,
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: SPACING.xl,
  },
  errorTitle: {
    fontSize: TYPOGRAPHY.fontSize.xl,
    fontWeight: TYPOGRAPHY.fontWeight.bold,
    color: COLORS.text.primary,
    marginTop: SPACING.md,
    marginBottom: SPACING.sm,
  },
  errorText: {
    fontSize: TYPOGRAPHY.fontSize.base,
    color: COLORS.text.secondary,
    textAlign: 'center',
    marginBottom: SPACING.xl,
  },
  retryButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.primary[600],
    paddingHorizontal: SPACING.xl,
    paddingVertical: SPACING.md,
    borderRadius: BORDER_RADIUS.lg,
  },
  retryButtonText: {
    color: COLORS.background.primary,
    fontSize: TYPOGRAPHY.fontSize.base,
    fontWeight: TYPOGRAPHY.fontWeight.semibold,
    marginLeft: SPACING.sm,
  },

  // List Container
  listContainer: {
    paddingHorizontal: LAYOUT.screenPadding,
    paddingBottom: SPACING['6xl'],
  },
  emptyListContainer: {
    flexGrow: 1,
  },

  // Header
  header: {
    paddingVertical: SPACING.xl,
    marginBottom: SPACING.lg,
  },
  headerContent: {
    marginBottom: SPACING.xl,
  },
  title: {
    fontSize: TYPOGRAPHY.fontSize['3xl'],
    fontWeight: TYPOGRAPHY.fontWeight.bold,
    color: COLORS.text.primary,
    marginBottom: SPACING.xs,
  },
  subtitle: {
    fontSize: TYPOGRAPHY.fontSize.base,
    color: COLORS.text.secondary,
    fontWeight: TYPOGRAPHY.fontWeight.medium,
    lineHeight: TYPOGRAPHY.fontSize.base * TYPOGRAPHY.lineHeight.relaxed,
  },

  totalAmount: {
    fontSize: TYPOGRAPHY.fontSize['2xl'],
    fontWeight: TYPOGRAPHY.fontWeight.bold,
    color: COLORS.primary[800],
  },

  // Empty State
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: SPACING['2xl'],
  },
  emptyIconContainer: {
    marginBottom: SPACING.lg,
    padding: SPACING.xl,
    backgroundColor: COLORS.neutral[50],
    borderRadius: BORDER_RADIUS.full,
  },
  emptyTitle: {
    fontSize: TYPOGRAPHY.fontSize['2xl'],
    fontWeight: TYPOGRAPHY.fontWeight.bold,
    color: COLORS.text.primary,
    marginBottom: SPACING.sm,
    textAlign: 'center',
  },
  emptySubtitle: {
    fontSize: TYPOGRAPHY.fontSize.base,
    color: COLORS.text.secondary,
    textAlign: 'center',
    lineHeight: TYPOGRAPHY.fontSize.base * TYPOGRAPHY.lineHeight.relaxed,
  },

  // Expense Card
  expenseCard: {
    ...COMPONENT_STYLES.card.elevated,
    marginBottom: SPACING.lg,
    borderWidth: 1,
    borderColor: COLORS.border.light,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: SPACING.md,
  },
  headerLeft: {
    flex: 1,
    marginRight: SPACING.md,
  },
  headerRight: {
    alignItems: 'flex-end',
  },
  expenseTitle: {
    fontSize: TYPOGRAPHY.fontSize.lg,
    fontWeight: TYPOGRAPHY.fontWeight.semibold,
    color: COLORS.text.primary,
    marginBottom: SPACING.xs,
  },
  employeeName: {
    fontSize: TYPOGRAPHY.fontSize.sm,
    color: COLORS.text.secondary,
    fontWeight: TYPOGRAPHY.fontWeight.medium,
  },
  amount: {
    fontSize: TYPOGRAPHY.fontSize.lg,
    fontWeight: TYPOGRAPHY.fontWeight.bold,
    color: COLORS.primary[600],
    marginBottom: SPACING.xs,
  },
  date: {
    fontSize: TYPOGRAPHY.fontSize.xs,
    color: COLORS.text.tertiary,
    fontWeight: TYPOGRAPHY.fontWeight.medium,
  },

  // Status Section
  statusSection: {
    marginBottom: SPACING.md,
    paddingTop: SPACING.md,
    borderTopWidth: 1,
    borderTopColor: COLORS.border.light,
  },
  statusRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: SPACING.sm,
  },
  statusLabel: {
    fontSize: TYPOGRAPHY.fontSize.sm,
    fontWeight: TYPOGRAPHY.fontWeight.medium,
    color: COLORS.text.secondary,
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: SPACING.sm,
    paddingVertical: SPACING.xs,
    borderRadius: BORDER_RADIUS.full,
  },
  statusText: {
    fontSize: TYPOGRAPHY.fontSize.xs,
    fontWeight: TYPOGRAPHY.fontWeight.semibold,
    marginLeft: SPACING.xs,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  approvalRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  approvalItem: {
    flex: 1,
    alignItems: 'center',
  },
  approvalLabel: {
    fontSize: TYPOGRAPHY.fontSize.xs,
    color: COLORS.text.tertiary,
    fontWeight: TYPOGRAPHY.fontWeight.medium,
    marginBottom: SPACING.xs,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  miniStatusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: SPACING.sm,
    paddingVertical: SPACING.xs,
    borderRadius: BORDER_RADIUS.full,
  },
  miniStatusText: {
    fontSize: TYPOGRAPHY.fontSize.xs,
    fontWeight: TYPOGRAPHY.fontWeight.semibold,
    marginLeft: SPACING.xs,
  },

  // Action Container
  actionContainer: {
    flexDirection: 'row',
    gap: SPACING.sm,
    paddingTop: SPACING.md,
    borderTopWidth: 1,
    borderTopColor: COLORS.border.light,
  },
  actionButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: SPACING.md,
    paddingHorizontal: SPACING.lg,
    borderRadius: BORDER_RADIUS.lg,
    ...SHADOWS.sm,
  },
  viewButton: {
    backgroundColor: COLORS.primary[600],
  },
  transferButton: {
    backgroundColor: COLORS.info[600],
  },
  actionButtonText: {
    color: COLORS.background.primary,
    fontSize: TYPOGRAPHY.fontSize.sm,
    fontWeight: TYPOGRAPHY.fontWeight.semibold,
    marginLeft: SPACING.sm,
  },
});
