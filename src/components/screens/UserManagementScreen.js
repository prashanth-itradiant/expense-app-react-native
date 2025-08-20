import { VITE_API_URL } from '@env';
import { useNavigation } from '@react-navigation/native';
import axios from 'axios';
import { useCallback, useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
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

export default function UserManagementScreen() {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const navigation = useNavigation();

  const fetchUsers = useCallback(async (isRefresh = false) => {
    if (isRefresh) {
      setRefreshing(true);
    } else {
      setLoading(true);
    }

    try {
      const { data } = await axios.get(`${VITE_API_URL}/users/userlist`, {
        withCredentials: true,
      });
      if (data.success && Array.isArray(data.data)) {
        setUsers(data.data);
      } else {
        setUsers([]);
      }
    } catch (error) {
      console.error('Error fetching users:', error);
      setUsers([]);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    fetchUsers();
  }, [fetchUsers]);

  const onRefresh = useCallback(() => {
    fetchUsers(true);
  }, [fetchUsers]);

  // Get role styling
  const getRoleStyle = role => {
    switch (role?.toLowerCase()) {
      case 'admin':
        return {
          backgroundColor: COLORS.error[500],
          color: COLORS.background.primary,
          icon: 'admin-panel-settings',
        };
      case 'manager':
        return {
          backgroundColor: COLORS.primary[600],
          color: COLORS.background.primary,
          icon: 'supervisor-account',
        };
      case 'finance':
        return {
          backgroundColor: COLORS.success[500],
          color: COLORS.background.primary,
          icon: 'account-balance',
        };
      case 'employee':
        return {
          backgroundColor: COLORS.info[500],
          color: COLORS.background.primary,
          icon: 'person',
        };
      default:
        return {
          backgroundColor: COLORS.neutral[500],
          color: COLORS.background.primary,
          icon: 'person',
        };
    }
  };

  // Format role text
  const formatRole = role => {
    return role ? role.charAt(0).toUpperCase() + role.slice(1) : 'User';
  };

  const renderEmptyState = () => (
    <View style={styles.emptyContainer}>
      <View style={styles.emptyIconContainer}>
        <MaterialIcons
          name="people-outline"
          size={64}
          color={COLORS.neutral[400]}
        />
      </View>
      <Text style={styles.emptyTitle}>No Users Found</Text>
      <Text style={styles.emptySubtitle}>
        Start by adding your first team member to manage users and permissions
      </Text>
      <TouchableOpacity
        style={styles.emptyButton}
        onPress={() =>
          navigation.navigate('AddUserForm', { onGoBack: fetchUsers })
        }
        activeOpacity={0.8}
      >
        <MaterialIcons
          name="person-add"
          size={20}
          color={COLORS.background.primary}
        />
        <Text style={styles.emptyButtonText}>Add First User</Text>
      </TouchableOpacity>
    </View>
  );

  const renderItem = ({ item, index }) => {
    const roleStyle = getRoleStyle(item.role);

    return (
      <View style={[styles.card, { marginTop: index === 0 ? SPACING.md : 0 }]}>
        <View style={styles.cardContent}>
          {/* User Avatar */}
          <View style={styles.avatarContainer}>
            <View
              style={[
                styles.avatar,
                { backgroundColor: roleStyle.backgroundColor },
              ]}
            >
              <Text style={styles.avatarText}>
                {item.name ? item.name.charAt(0).toUpperCase() : 'U'}
              </Text>
            </View>
            <View
              style={[
                styles.roleIndicator,
                { backgroundColor: roleStyle.backgroundColor },
              ]}
            >
              <MaterialIcons
                name={roleStyle.icon}
                size={12}
                color={roleStyle.color}
              />
            </View>
          </View>

          {/* User Information */}
          <View style={styles.userInfo}>
            <Text style={styles.userName} numberOfLines={1}>
              {item.name}
            </Text>
            <Text style={styles.userEmail} numberOfLines={1}>
              {item.email}
            </Text>
            {item.empId && <Text style={styles.empId}>ID: {item.empId}</Text>}
          </View>

          {/* User Meta */}
          <View style={styles.userMeta}>
            <View
              style={[
                styles.roleBadge,
                { backgroundColor: roleStyle.backgroundColor },
              ]}
            >
              <MaterialIcons
                name={roleStyle.icon}
                size={14}
                color={roleStyle.color}
              />
              <Text style={[styles.roleText, { color: roleStyle.color }]}>
                {formatRole(item.role)}
              </Text>
            </View>

            {item.contact && (
              <View style={styles.contactContainer}>
                <MaterialIcons
                  name="phone"
                  size={14}
                  color={COLORS.text.tertiary}
                />
                <Text style={styles.contactText} numberOfLines={1}>
                  {item.contact}
                </Text>
              </View>
            )}
          </View>
        </View>

        {/* Action Buttons */}
        <View style={styles.actionContainer}>
          <TouchableOpacity
            style={[styles.actionButton, styles.editButton]}
            activeOpacity={0.7}
            onPress={() => {
              // Navigate to edit user (you can implement this)
              Alert.alert('Edit User', `Edit ${item.name}'s profile`);
            }}
          >
            <MaterialIcons name="edit" size={16} color={COLORS.primary[600]} />
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.actionButton, styles.deleteButton]}
            activeOpacity={0.7}
            onPress={() => {
              Alert.alert(
                'Delete User',
                `Are you sure you want to delete ${item.name}?`,
                [
                  { text: 'Cancel', style: 'cancel' },
                  {
                    text: 'Delete',
                    style: 'destructive',
                    onPress: () => {
                      // Implement delete functionality
                      console.log('Delete user:', item._id);
                    },
                  },
                ],
              );
            }}
          >
            <MaterialIcons name="delete" size={16} color={COLORS.error[500]} />
          </TouchableOpacity>
        </View>
      </View>
    );
  };

  const renderHeader = () => (
    <View style={styles.header}>
      <View style={styles.headerContent}>
        <Text style={styles.title}>User Management</Text>
        <Text style={styles.subtitle}>
          {users.length} {users.length === 1 ? 'user' : 'users'} in your
          organization
        </Text>
      </View>
    </View>
  );

  // Enhanced loading state
  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={COLORS.primary[600]} />
          <Text style={styles.loadingText}>Loading users...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <FlatList
        data={users}
        keyExtractor={item => item._id || item.email}
        renderItem={renderItem}
        ListHeaderComponent={renderHeader}
        ListEmptyComponent={renderEmptyState}
        contentContainerStyle={[
          styles.listContainer,
          users.length === 0 && styles.emptyListContainer,
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

      {/* Enhanced Floating Action Button */}
      <TouchableOpacity
        style={styles.fab}
        onPress={() =>
          navigation.navigate('AddUserForm', { onGoBack: fetchUsers })
        }
        activeOpacity={0.8}
      >
        <MaterialIcons
          name="person-add"
          size={24}
          color={COLORS.background.primary}
        />
      </TouchableOpacity>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background.secondary,
  },

  // Loading State
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
    marginBottom: SPACING.lg,
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
  cardContent: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: SPACING.md,
  },

  // Avatar
  avatarContainer: {
    position: 'relative',
    marginRight: SPACING.md,
  },
  avatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: {
    color: COLORS.background.primary,
    fontSize: TYPOGRAPHY.fontSize.lg,
    fontWeight: TYPOGRAPHY.fontWeight.bold,
  },
  roleIndicator: {
    position: 'absolute',
    bottom: -2,
    right: -2,
    width: 20,
    height: 20,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: COLORS.background.primary,
  },

  // User Info
  userInfo: {
    flex: 1,
    marginRight: SPACING.md,
  },
  userName: {
    fontSize: TYPOGRAPHY.fontSize.lg,
    fontWeight: TYPOGRAPHY.fontWeight.semibold,
    color: COLORS.text.primary,
    marginBottom: SPACING.xs,
  },
  userEmail: {
    fontSize: TYPOGRAPHY.fontSize.sm,
    color: COLORS.text.secondary,
    marginBottom: SPACING.xs,
  },
  empId: {
    fontSize: TYPOGRAPHY.fontSize.xs,
    color: COLORS.text.tertiary,
    fontWeight: TYPOGRAPHY.fontWeight.medium,
  },

  // User Meta
  userMeta: {
    alignItems: 'flex-end',
  },
  roleBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: SPACING.sm,
    paddingVertical: SPACING.xs,
    borderRadius: BORDER_RADIUS.full,
    marginBottom: SPACING.sm,
  },
  roleText: {
    fontSize: TYPOGRAPHY.fontSize.xs,
    fontWeight: TYPOGRAPHY.fontWeight.semibold,
    marginLeft: SPACING.xs,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  contactContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  contactText: {
    fontSize: TYPOGRAPHY.fontSize.xs,
    color: COLORS.text.tertiary,
    marginLeft: SPACING.xs,
    fontWeight: TYPOGRAPHY.fontWeight.medium,
  },

  // Action Container
  actionContainer: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: SPACING.sm,
    paddingTop: SPACING.md,
    borderTopWidth: 1,
    borderTopColor: COLORS.border.light,
  },
  actionButton: {
    width: 36,
    height: 36,
    borderRadius: BORDER_RADIUS.lg,
    alignItems: 'center',
    justifyContent: 'center',
    ...SHADOWS.sm,
  },
  editButton: {
    backgroundColor: COLORS.neutral[50],
  },
  deleteButton: {
    backgroundColor: COLORS.neutral[100],
  },

  // Floating Action Button
  fab: {
    position: 'absolute',
    bottom: SPACING['2xl'],
    right: SPACING['2xl'],
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: COLORS.primary[600],
    justifyContent: 'center',
    alignItems: 'center',
    ...SHADOWS.lg,
  },
});
