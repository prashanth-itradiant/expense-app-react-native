import { VITE_API_URL } from '@env';
import { useNavigation } from '@react-navigation/native';
import { useQuery } from '@tanstack/react-query';
import axios from 'axios';
import React from 'react';
import {
  ActivityIndicator,
  FlatList,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';

// Import improved theme constants
import {
  BORDER_RADIUS,
  COLORS,
  COMPONENT_STYLES,
  SPACING,
  TYPOGRAPHY,
  getStatusColor,
} from '../theme/theme';

// ✅ Fetch team expenses
const fetchTeamExpenses = async () => {
  const { data } = await axios.get(`${VITE_API_URL}/expenses/team-expenses`, {
    withCredentials: true,
  });

  return data.success
    ? data.data.map((expense, index) => ({
        id: expense._id || index + 1,
        title: expense.expenseName,
        status: expense.status || 'pending',
        managerApproval: expense.managerApproval?.approved || 'pending',
        financeApproval: expense.financeApproval?.approved || 'pending',
      }))
    : [];
};

// ✅ Convert to Proper Case
const toProperCase = text =>
  text
    ? text.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase())
    : 'Pending';

export default function TeamExpensesListScreen() {
  const navigation = useNavigation();

  const {
    data = [],
    isLoading,
    error,
  } = useQuery({
    queryKey: ['teamExpenses'],
    queryFn: fetchTeamExpenses,
    staleTime: 5 * 60 * 1000,
    refetchOnWindowFocus: false,
  });

  // ✅ Render each team expense with improved styling
  const renderItem = ({ item }) => (
    <TouchableOpacity
      style={styles.card}
      activeOpacity={0.8}
      onPress={() =>
        item.id
          ? navigation.navigate('OrganizationTeamExpenseDetails', {
              id: item.id,
            })
          : null
      }
    >
      <Text style={styles.title}>{item.title}</Text>

      <View style={styles.statusContainer}>
        <View style={styles.statusRow}>
          <Text style={styles.statusLabel}>Manager:</Text>
          <Text
            style={[
              styles.statusValue,
              { color: getStatusColor(item.managerApproval) },
            ]}
          >
            {toProperCase(item.managerApproval)}
          </Text>
        </View>

        <View style={styles.statusRow}>
          <Text style={styles.statusLabel}>Finance:</Text>
          <Text
            style={[
              styles.statusValue,
              { color: getStatusColor(item.financeApproval) },
            ]}
          >
            {toProperCase(item.financeApproval)}
          </Text>
        </View>

        <View style={styles.statusRow}>
          <Text style={styles.statusLabel}>Status:</Text>
          <View
            style={[
              styles.statusBadge,
              { backgroundColor: getStatusColor(item.status) + '20' },
            ]}
          >
            <Text
              style={[
                styles.statusBadgeText,
                { color: getStatusColor(item.status) },
              ]}
            >
              {toProperCase(item.status)}
            </Text>
          </View>
        </View>
      </View>
    </TouchableOpacity>
  );

  // Loading state
  if (isLoading) {
    return (
      <View style={styles.centerContainer}>
        <ActivityIndicator size="large" color={COLORS.primary[600]} />
        <Text style={styles.loadingText}>Loading expenses...</Text>
      </View>
    );
  }

  // Error state
  if (error) {
    return (
      <View style={styles.centerContainer}>
        <Text style={styles.errorText}>Error: {error.message}</Text>
      </View>
    );
  }

  // Empty state
  if (data.length === 0) {
    return (
      <View style={styles.centerContainer}>
        <Text style={styles.emptyText}>No team expenses found</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <FlatList
        data={data}
        keyExtractor={item => item.id.toString()}
        renderItem={renderItem}
        contentContainerStyle={styles.listContainer}
        showsVerticalScrollIndicator={false}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background.secondary,
  },

  listContainer: {
    padding: SPACING.lg,
    paddingBottom: SPACING['6xl'],
  },

  card: {
    ...COMPONENT_STYLES.card.default,
    marginBottom: SPACING.lg,
  },

  title: {
    fontSize: TYPOGRAPHY.fontSize.lg,
    fontWeight: TYPOGRAPHY.fontWeight.semibold,
    color: COLORS.text.primary,
    marginBottom: SPACING.md,
    lineHeight: TYPOGRAPHY.fontSize.lg * TYPOGRAPHY.lineHeight.tight,
  },

  statusContainer: {
    gap: SPACING.sm,
  },

  statusRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },

  statusLabel: {
    fontSize: TYPOGRAPHY.fontSize.sm,
    fontWeight: TYPOGRAPHY.fontWeight.medium,
    color: COLORS.text.secondary,
    flex: 1,
  },

  statusValue: {
    fontSize: TYPOGRAPHY.fontSize.sm,
    fontWeight: TYPOGRAPHY.fontWeight.semibold,
    flex: 1,
    textAlign: 'right',
  },

  statusBadge: {
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.xs,
    borderRadius: BORDER_RADIUS.full,
    alignSelf: 'flex-end',
  },

  statusBadgeText: {
    fontSize: TYPOGRAPHY.fontSize.xs,
    fontWeight: TYPOGRAPHY.fontWeight.semibold,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },

  centerContainer: {
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
  },

  errorText: {
    fontSize: TYPOGRAPHY.fontSize.base,
    color: COLORS.error[500],
    textAlign: 'center',
    lineHeight: TYPOGRAPHY.fontSize.base * TYPOGRAPHY.lineHeight.relaxed,
  },

  emptyText: {
    fontSize: TYPOGRAPHY.fontSize.lg,
    color: COLORS.text.tertiary,
    textAlign: 'center',
  },
});
