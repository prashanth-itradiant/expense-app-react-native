import { VITE_API_URL } from '@env';
import { useNavigation } from '@react-navigation/native';
import { useQuery } from '@tanstack/react-query';
import axios from 'axios';
import {
  ActivityIndicator,
  FlatList,
  RefreshControl,
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
  STATUS_COLORS,
  TYPOGRAPHY,
} from '../theme/theme';

// API call
const fetchExpenses = async () => {
  const { data } = await axios.get(`${VITE_API_URL}/expenses/user-expenses`, {
    withCredentials: true,
  });

  return data.success
    ? data.data.map((expense, index) => ({
        id: expense._id || index + 1,
        title: expense.expenseName,
        managerApproval: expense.managerApproval?.approved || 'pending',
        financeApproval: expense.financeApproval?.approved || 'pending',
        status: expense.status || 'pending',
        isDraft: expense.isDraft,
        createdAt: expense.createdAt,
        totalAmount: expense.totalAmount,
      }))
    : [];
};

// Enhanced status styling functions
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

// Get status icon
const getStatusIcon = status => {
  switch (status) {
    case 'approved':
      return 'check-circle';
    case 'rejected':
      return 'cancel';
    case 'partially_approved':
      return 'warning';
    case 'resubmission':
      return 'refresh';
    case 'draft':
      return 'edit';
    default:
      return 'schedule';
  }
};

export default function ExpensesListScreen() {
  const navigation = useNavigation();

  const {
    data = [],
    isLoading,
    error,
    refetch,
  } = useQuery({
    queryKey: ['expenses'],
    queryFn: fetchExpenses,
    staleTime: 5 * 60 * 1000,
    refetchOnWindowFocus: false,
  });

  const getColor = value => STATUS_COLORS[value] || STATUS_COLORS.pending;

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
        Start by creating your first expense report to track your business
        expenses
      </Text>
      <TouchableOpacity
        style={styles.emptyButton}
        onPress={() => navigation.navigate('AddExpense')}
        activeOpacity={0.8}
      >
        <MaterialIcons name="add" size={20} color={COLORS.background.primary} />
        <Text style={styles.emptyButtonText}>Create First Expense</Text>
      </TouchableOpacity>
    </View>
  );

  const renderItem = ({ item }) => (
    <TouchableOpacity
      style={styles.card}
      onPress={() =>
        navigation.navigate(item.isDraft ? 'AddExpense' : 'ExpenseDetails', {
          id: item.id,
        })
      }
      activeOpacity={0.95}
    >
      <View style={styles.cardHeader}>
        <View style={styles.titleContainer}>
          <Text style={styles.title} numberOfLines={2}>
            {item.title}
          </Text>
          {item.isDraft && (
            <View style={styles.draftBadge}>
              <MaterialIcons
                name="edit"
                size={12}
                color={COLORS.background.primary}
              />
              <Text style={styles.draftText}>DRAFT</Text>
            </View>
          )}
        </View>
        {item.totalAmount && (
          <View style={styles.amountContainer}>
            <Text style={styles.amountLabel}>Total</Text>
            <Text style={styles.amount}>${item.totalAmount}</Text>
          </View>
        )}
      </View>

      <View style={styles.statusContainer}>
        <StatusRow
          icon={getStatusIcon(item.managerApproval)}
          label="Manager"
          status={item.managerApproval}
          style={getApprovalStyle(item.managerApproval)}
        />
        <StatusRow
          icon={getStatusIcon(item.financeApproval)}
          label="Finance"
          status={item.financeApproval}
          style={getApprovalStyle(item.financeApproval)}
        />
      </View>

      <View style={styles.cardFooter}>
        <View style={[styles.statusBadge, getStatusStyle(item.status)]}>
          <MaterialIcons
            name={getStatusIcon(item.status)}
            size={14}
            color={getStatusStyle(item.status).color}
          />
          <Text
            style={[
              styles.statusText,
              { color: getStatusStyle(item.status).color },
            ]}
            numberOfLines={1}
            ellipsizeMode="tail"
          >
            {formatStatusText(item.status)}
          </Text>
        </View>

        <View style={styles.actionContainer}>
          <TouchableOpacity
            style={[styles.actionButton, styles.viewButton]}
            activeOpacity={0.7}
            onPress={() =>
              navigation.navigate(
                item.isDraft ? 'AddExpense' : 'ExpenseDetails',
                { id: item.id },
              )
            }
          >
            <MaterialIcons
              name="visibility"
              size={16}
              color={COLORS.background.primary}
            />
            <Text style={styles.buttonText}>View</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.actionButton, styles.editButton]}
            activeOpacity={0.7}
            onPress={() => navigation.navigate('EditExpense', { id: item.id })}
          >
            <MaterialIcons
              name="edit"
              size={16}
              color={COLORS.background.primary}
            />
            <Text style={styles.buttonText}>Edit</Text>
          </TouchableOpacity>
        </View>
      </View>
    </TouchableOpacity>
  );

  const renderHeader = () => (
    <View style={styles.header}>
      <View style={styles.headerContent}>
        <Text style={styles.headerTitle}>My Expenses</Text>
        <Text style={styles.headerSubtitle}>
          {data.length} {data.length === 1 ? 'expense' : 'expenses'} found
        </Text>
      </View>

      <TouchableOpacity
        style={styles.addButton}
        activeOpacity={0.8}
        onPress={() => navigation.navigate('AddExpense')}
      >
        <MaterialIcons name="add" size={20} color={COLORS.background.primary} />
        <Text style={styles.addButtonText}>Add Expense</Text>
      </TouchableOpacity>
    </View>
  );

  // Enhanced loading state
  if (isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={COLORS.primary[600]} />
        <Text style={styles.loadingText}>Loading your expenses...</Text>
      </View>
    );
  }

  // Enhanced error state
  if (error) {
    return (
      <View style={styles.errorContainer}>
        <View style={styles.errorIconContainer}>
          <MaterialIcons
            name="error-outline"
            size={48}
            color={COLORS.error[500]}
          />
        </View>
        <Text style={styles.errorTitle}>Something went wrong</Text>
        <Text style={styles.errorMessage}>
          {error.message || 'Unable to load expenses. Please try again.'}
        </Text>
        <TouchableOpacity
          style={styles.retryButton}
          onPress={refetch}
          activeOpacity={0.8}
        >
          <MaterialIcons
            name="refresh"
            size={20}
            color={COLORS.background.primary}
          />
          <Text style={styles.retryButtonText}>Try Again</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <FlatList
        data={data}
        keyExtractor={item => item.id.toString()}
        renderItem={renderItem}
        ListHeaderComponent={renderHeader}
        ListEmptyComponent={renderEmptyState}
        contentContainerStyle={[
          styles.listContainer,
          data.length === 0 && styles.emptyListContainer,
        ]}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={isLoading}
            onRefresh={refetch}
            colors={[COLORS.primary[600]]}
            tintColor={COLORS.primary[600]}
          />
        }
      />
    </View>
  );
}

// Enhanced Status Row Component
const StatusRow = ({ icon, label, status, style }) => (
  <View style={styles.statusRow}>
    <View style={styles.statusIconContainer}>
      <MaterialIcons name={icon} size={16} color={style.color} />
    </View>
    <Text style={styles.statusLabel}>{label}:</Text>
    <View style={[styles.statusBadgeSmall, style]}>
      <Text style={[styles.statusLabelText, { color: style.color }]}>
        {formatStatusText(status)}
      </Text>
    </View>
  </View>
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
    marginTop: SPACING.md,
    fontSize: TYPOGRAPHY.fontSize.base,
    color: COLORS.text.secondary,
    fontWeight: TYPOGRAPHY.fontWeight.medium,
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: COLORS.background.secondary,
    padding: SPACING.xl,
  },
  errorIconContainer: {
    marginBottom: SPACING.md,
  },
  errorTitle: {
    fontSize: TYPOGRAPHY.fontSize.xl,
    fontWeight: TYPOGRAPHY.fontWeight.bold,
    color: COLORS.text.primary,
    marginBottom: SPACING.sm,
    textAlign: 'center',
  },
  errorMessage: {
    fontSize: TYPOGRAPHY.fontSize.base,
    color: COLORS.text.secondary,
    textAlign: 'center',
    marginBottom: SPACING['2xl'],
    lineHeight: TYPOGRAPHY.fontSize.base * TYPOGRAPHY.lineHeight.relaxed,
  },
  retryButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.error[500],
    paddingHorizontal: SPACING.xl,
    paddingVertical: SPACING.md,
    borderRadius: BORDER_RADIUS.lg,
    ...SHADOWS.md,
  },
  retryButtonText: {
    color: COLORS.background.primary,
    fontSize: TYPOGRAPHY.fontSize.base,
    fontWeight: TYPOGRAPHY.fontWeight.semibold,
    marginLeft: SPACING.sm,
  },

  // List Container
  listContainer: {
    padding: LAYOUT.screenPadding,
    paddingBottom: SPACING['6xl'],
  },
  emptyListContainer: {
    flexGrow: 1,
  },

  // Header
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: SPACING.xl,
    paddingBottom: SPACING.lg,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border.light,
  },
  headerContent: {
    flex: 1,
  },
  headerTitle: {
    fontSize: TYPOGRAPHY.fontSize['3xl'],
    fontWeight: TYPOGRAPHY.fontWeight.bold,
    color: COLORS.text.primary,
    marginBottom: SPACING.xs,
  },
  headerSubtitle: {
    fontSize: TYPOGRAPHY.fontSize.base,
    color: COLORS.text.secondary,
    fontWeight: TYPOGRAPHY.fontWeight.medium,
  },
  addButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.primary[600],
    paddingHorizontal: SPACING.lg,
    paddingVertical: SPACING.md,
    borderRadius: BORDER_RADIUS.xl,
    ...SHADOWS.md,
  },
  addButtonText: {
    color: COLORS.background.primary,
    fontWeight: TYPOGRAPHY.fontWeight.semibold,
    fontSize: TYPOGRAPHY.fontSize.base,
    marginLeft: SPACING.sm,
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
    marginBottom: SPACING['3xl'],
    lineHeight: TYPOGRAPHY.fontSize.base * TYPOGRAPHY.lineHeight.relaxed,
  },
  emptyButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.primary[600],
    paddingHorizontal: SPACING['2xl'],
    paddingVertical: SPACING.lg,
    borderRadius: BORDER_RADIUS.xl,
    ...SHADOWS.lg,
  },
  emptyButtonText: {
    color: COLORS.background.primary,
    fontSize: TYPOGRAPHY.fontSize.base,
    fontWeight: TYPOGRAPHY.fontWeight.semibold,
    marginLeft: SPACING.sm,
  },

  // Card
  card: {
    ...COMPONENT_STYLES.card.elevated,
    marginBottom: SPACING.lg,
    borderWidth: 1,
    borderColor: COLORS.border.light,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: SPACING.lg,
  },
  titleContainer: {
    flex: 1,
    marginRight: SPACING.md,
  },
  title: {
    fontSize: TYPOGRAPHY.fontSize.lg,
    fontWeight: TYPOGRAPHY.fontWeight.semibold,
    color: COLORS.text.primary,
    marginBottom: SPACING.sm,
    lineHeight: TYPOGRAPHY.fontSize.lg * TYPOGRAPHY.lineHeight.normal,
  },
  draftBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.warning[500],
    paddingHorizontal: SPACING.sm,
    paddingVertical: SPACING.xs,
    borderRadius: BORDER_RADIUS.sm,
    alignSelf: 'flex-start',
  },
  draftText: {
    color: COLORS.background.primary,
    fontSize: TYPOGRAPHY.fontSize.xs,
    fontWeight: TYPOGRAPHY.fontWeight.bold,
    letterSpacing: 0.5,
    marginLeft: SPACING.xs,
  },
  amountContainer: {
    alignItems: 'flex-end',
  },
  amountLabel: {
    fontSize: TYPOGRAPHY.fontSize.sm,
    color: COLORS.text.tertiary,
    fontWeight: TYPOGRAPHY.fontWeight.medium,
    marginBottom: SPACING.xs,
  },
  amount: {
    fontSize: TYPOGRAPHY.fontSize.xl,
    fontWeight: TYPOGRAPHY.fontWeight.bold,
    color: COLORS.primary[600],
  },

  // Status Container
  statusContainer: {
    marginBottom: SPACING.lg,
    gap: SPACING.sm,
  },
  statusRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.sm,
  },
  statusIconContainer: {
    width: 20,
    alignItems: 'center',
  },
  statusLabel: {
    fontSize: TYPOGRAPHY.fontSize.sm,
    fontWeight: TYPOGRAPHY.fontWeight.medium,
    color: COLORS.text.secondary,
    minWidth: 60,
  },
  statusBadgeSmall: {
    flex: 1,
    paddingHorizontal: SPACING.sm,
    paddingVertical: SPACING.xs,
    borderRadius: BORDER_RADIUS.md,
    borderWidth: 1,
  },
  statusLabelText: {
    fontSize: TYPOGRAPHY.fontSize.sm,
    fontWeight: TYPOGRAPHY.fontWeight.medium,
    textTransform: 'capitalize',
  },

  // Card Footer
  cardFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: SPACING.lg,
    borderTopWidth: 1,
    borderTopColor: COLORS.border.light,
    gap: SPACING.md, // Add gap between status badge and action container
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.sm,
    borderRadius: BORDER_RADIUS.full,
    borderWidth: 1,
    flexShrink: 1, // Allow the badge to shrink if needed
  },
  statusText: {
    fontSize: TYPOGRAPHY.fontSize.xs,
    fontWeight: TYPOGRAPHY.fontWeight.semibold,
    marginLeft: SPACING.xs,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    flexShrink: 1, // Allow text to shrink and enable ellipsizeMode
  },
  actionContainer: {
    flexDirection: 'row',
    gap: SPACING.sm,
    alignItems: 'center',
    flexGrow: 0, // Prevent the container from growing
    flexShrink: 0, // Prevent the container from shrinking
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: SPACING.sm,
    paddingHorizontal: SPACING.md,
    borderRadius: BORDER_RADIUS.lg,
    ...SHADOWS.sm,
  },
  viewButton: {
    backgroundColor: COLORS.primary[600],
  },
  editButton: {
    backgroundColor: COLORS.neutral[500],
  },
  buttonText: {
    color: COLORS.background.primary,
    fontSize: TYPOGRAPHY.fontSize.sm,
    fontWeight: TYPOGRAPHY.fontWeight.semibold,
    marginLeft: SPACING.xs,
  },
});
