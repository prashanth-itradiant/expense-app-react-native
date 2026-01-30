import { API_URL } from '@env';
import axios from 'axios';
import React, { useCallback, useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  FlatList,
  Modal,
  RefreshControl,
  SafeAreaView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import Toast from 'react-native-toast-message';
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

const DepartmentListScreen = () => {
  const [departments, setDepartments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [modalVisible, setModalVisible] = useState(false);
  const [departmentName, setDepartmentName] = useState('');
  const [addingDepartment, setAddingDepartment] = useState(false);
  const [error, setError] = useState('');

  const fetchDepartments = useCallback(async (isRefresh = false) => {
    if (isRefresh) {
      setRefreshing(true);
    } else {
      setLoading(true);
    }

    try {
      const response = await axios.get(
        `${API_URL}/departments/get-departments`,
        { withCredentials: true },
      );

      if (response.data.success) {
        setDepartments(response.data.data || []);
      } else {
        setDepartments([]);
      }
    } catch (error) {
      console.error('Error fetching departments:', error);
      setDepartments([]);
      if (!isRefresh) {
      }
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    fetchDepartments();
  }, [fetchDepartments]);

  const onRefresh = useCallback(() => {
    fetchDepartments(true);
  }, [fetchDepartments]);

  const handleOpenModal = () => {
    setModalVisible(true);
    setDepartmentName('');
    setError('');
  };

  const handleCloseModal = () => {
    setModalVisible(false);
    setDepartmentName('');
    setError('');
  };

  const validateDepartmentName = name => {
    if (!name.trim()) {
      return 'Department name is required';
    }
    if (name.trim().length < 2) {
      return 'Department name must be at least 2 characters';
    }
    if (
      departments.some(
        dept => dept.name.toLowerCase() === name.trim().toLowerCase(),
      )
    ) {
      return 'Department name already exists';
    }
    return '';
  };

  const handleAddDepartment = async () => {
    const validationError = validateDepartmentName(departmentName);
    if (validationError) {
      setError(validationError);
      return;
    }

    setAddingDepartment(true);
    try {
      const response = await axios.post(
        `${API_URL}/departments/add-department`,
        { name: departmentName.trim() },
        { withCredentials: true },
      );

      Toast.show({
        type: 'success',
        text1: 'Success',
        text2: response.data.message || 'Department added successfully',
        position: 'top',
        visibilityTime: 3000,
      });

      handleCloseModal();
      fetchDepartments();
    } catch (error) {
      console.error('Error adding department:', error);

      const errorMessage =
        error.response?.data?.message || 'Failed to add department';
      setError(errorMessage);

      Toast.show({
        type: 'error',
        text1: 'Error',
        text2: errorMessage,
        position: 'top',
        visibilityTime: 3000,
      });
    } finally {
      setAddingDepartment(false);
    }
  };

  const handleDeleteDepartment = department => {
    Alert.alert(
      'Delete Department',
      `Are you sure you want to delete "${department.name}"?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              await axios.delete(`${API_URL}/departments/${department._id}`, {
                withCredentials: true,
              });

              Toast.show({
                type: 'success',
                text1: 'Success',
                text2: 'Department deleted successfully',
                position: 'top',
                visibilityTime: 3000,
              });

              fetchDepartments();
            } catch (error) {
              console.error('Error deleting department:', error);
              Toast.show({
                type: 'error',
                text1: 'Error',
                text2:
                  error.response?.data?.message ||
                  'Failed to delete department',
                position: 'top',
                visibilityTime: 3000,
              });
            }
          },
        },
      ],
    );
  };

  const renderEmptyState = () => (
    <View style={styles.emptyContainer}>
      <View style={styles.emptyIconContainer}>
        <MaterialIcons name="business" size={64} color={COLORS.neutral[400]} />
      </View>
      <Text style={styles.emptyTitle}>No Departments Found</Text>
      <Text style={styles.emptySubtitle}>
        Start by creating your first department to organize your team structure
      </Text>
      <TouchableOpacity
        style={styles.emptyButton}
        onPress={handleOpenModal}
        activeOpacity={0.8}
      >
        <MaterialIcons name="add" size={20} color={COLORS.background.primary} />
        <Text style={styles.emptyButtonText}>Add First Department</Text>
      </TouchableOpacity>
    </View>
  );

  const renderDepartmentItem = ({ item, index }) => (
    <View
      style={[
        styles.departmentCard,
        { marginTop: index === 0 ? SPACING.md : 0 },
      ]}
    >
      <View style={styles.departmentContent}>
        {/* Department Icon */}
        <View style={styles.departmentIconContainer}>
          <MaterialIcons
            name="business"
            size={24}
            color={COLORS.primary[600]}
          />
        </View>

        {/* Department Info */}
        <View style={styles.departmentInfo}>
          <Text style={styles.departmentName} numberOfLines={2}>
            {item.name}
          </Text>
          <Text style={styles.departmentId}>
            ID: {item._id?.slice(-8) || 'N/A'}
          </Text>
        </View>

        {/* Actions */}
        <View style={styles.actionContainer}>
          <TouchableOpacity
            style={[styles.actionButton, styles.editButton]}
            activeOpacity={0.7}
            onPress={() => {
              // Navigate to edit department (you can implement this)
              Alert.alert('Edit Department', `Edit "${item.name}" department`);
            }}
          >
            <MaterialIcons name="edit" size={16} color={COLORS.primary[600]} />
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.actionButton, styles.deleteButton]}
            activeOpacity={0.7}
            onPress={() => handleDeleteDepartment(item)}
          >
            <MaterialIcons name="delete" size={16} color={COLORS.error[500]} />
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );

  const renderHeader = () => (
    <View style={styles.header}>
      <View style={styles.headerContent}>
        <Text style={styles.title}>Department Management</Text>
        <Text style={styles.subtitle}>
          {departments.length}{' '}
          {departments.length === 1 ? 'department' : 'departments'} in your
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
          <Text style={styles.loadingText}>Loading departments...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <FlatList
        data={departments}
        keyExtractor={item => item._id || item.name}
        renderItem={renderDepartmentItem}
        ListHeaderComponent={renderHeader}
        ListEmptyComponent={renderEmptyState}
        contentContainerStyle={[
          styles.listContainer,
          departments.length === 0 && styles.emptyListContainer,
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
        onPress={handleOpenModal}
        activeOpacity={0.8}
      >
        <MaterialIcons name="add" size={24} color={COLORS.background.primary} />
      </TouchableOpacity>

      {/* Add Department Modal */}
      <Modal
        animationType="slide"
        transparent={true}
        visible={modalVisible}
        onRequestClose={handleCloseModal}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContainer}>
            {/* Modal Header */}
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Add New Department</Text>
              <TouchableOpacity
                style={styles.closeButton}
                onPress={handleCloseModal}
                activeOpacity={0.7}
              >
                <MaterialIcons
                  name="close"
                  size={24}
                  color={COLORS.text.secondary}
                />
              </TouchableOpacity>
            </View>

            {/* Modal Content */}
            <View style={styles.modalContent}>
              <Text style={styles.inputLabel}>
                Department Name <Text style={styles.required}>*</Text>
              </Text>
              <View style={[styles.inputContainer, error && styles.inputError]}>
                <MaterialIcons
                  name="business"
                  size={20}
                  color={COLORS.text.tertiary}
                  style={styles.inputIcon}
                />
                <TextInput
                  style={styles.textInput}
                  value={departmentName}
                  onChangeText={text => {
                    setDepartmentName(text);
                    if (error) setError('');
                  }}
                  placeholder="Enter department name"
                  placeholderTextColor={COLORS.text.tertiary}
                  maxLength={50}
                />
              </View>

              {error ? (
                <View style={styles.errorContainer}>
                  <MaterialIcons
                    name="error-outline"
                    size={16}
                    color={COLORS.error[500]}
                  />
                  <Text style={styles.errorText}>{error}</Text>
                </View>
              ) : null}

              <Text style={styles.helperText}>
                Choose a clear, descriptive name for the department
              </Text>
            </View>

            {/* Modal Actions */}
            <View style={styles.modalActions}>
              <TouchableOpacity
                style={styles.cancelButton}
                onPress={handleCloseModal}
                activeOpacity={0.8}
              >
                <Text style={styles.cancelButtonText}>Cancel</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[
                  styles.saveButton,
                  addingDepartment && styles.saveButtonDisabled,
                ]}
                onPress={handleAddDepartment}
                disabled={addingDepartment}
                activeOpacity={0.8}
              >
                {addingDepartment ? (
                  <ActivityIndicator
                    size="small"
                    color={COLORS.background.primary}
                  />
                ) : (
                  <>
                    <MaterialIcons
                      name="save"
                      size={20}
                      color={COLORS.background.primary}
                    />
                    <Text style={styles.saveButtonText}>Save Department</Text>
                  </>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
};

export default DepartmentListScreen;

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

  // Department Card
  departmentCard: {
    ...COMPONENT_STYLES.card.elevated,
    marginBottom: SPACING.lg,
    borderWidth: 1,
    borderColor: COLORS.border.light,
  },
  departmentContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  departmentIconContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: COLORS.primary[50],
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: SPACING.md,
  },
  departmentInfo: {
    flex: 1,
    marginRight: SPACING.md,
  },
  departmentName: {
    fontSize: TYPOGRAPHY.fontSize.lg,
    fontWeight: TYPOGRAPHY.fontWeight.semibold,
    color: COLORS.text.primary,
    marginBottom: SPACING.xs,
  },
  departmentId: {
    fontSize: TYPOGRAPHY.fontSize.xs,
    color: COLORS.text.tertiary,
    fontWeight: TYPOGRAPHY.fontWeight.medium,
  },

  // Action Container
  actionContainer: {
    flexDirection: 'row',
    gap: SPACING.sm,
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
    backgroundColor: COLORS.neutral[50],
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

  // Modal Styles
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: SPACING.lg,
  },
  modalContainer: {
    backgroundColor: COLORS.background.primary,
    borderRadius: BORDER_RADIUS.xl,
    width: '100%',
    maxWidth: 400,
    ...SHADOWS.xl,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: SPACING.lg,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border.light,
  },
  modalTitle: {
    fontSize: TYPOGRAPHY.fontSize.xl,
    fontWeight: TYPOGRAPHY.fontWeight.semibold,
    color: COLORS.text.primary,
  },
  closeButton: {
    padding: SPACING.sm,
  },
  modalContent: {
    padding: SPACING.lg,
  },
  inputLabel: {
    fontSize: TYPOGRAPHY.fontSize.sm,
    fontWeight: TYPOGRAPHY.fontWeight.semibold,
    color: COLORS.text.primary,
    marginBottom: SPACING.sm,
  },
  required: {
    color: COLORS.error[500],
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.background.primary,
    borderWidth: 1,
    borderColor: COLORS.border.medium,
    borderRadius: BORDER_RADIUS.lg,
    paddingHorizontal: SPACING.md,
    minHeight: 48,
    marginBottom: SPACING.sm,
  },
  inputError: {
    borderColor: COLORS.error[500],
    backgroundColor: COLORS.error[50],
  },
  inputIcon: {
    marginRight: SPACING.sm,
  },
  textInput: {
    flex: 1,
    fontSize: TYPOGRAPHY.fontSize.base,
    color: COLORS.text.primary,
    paddingVertical: SPACING.md,
  },
  errorContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: SPACING.sm,
  },
  errorText: {
    fontSize: TYPOGRAPHY.fontSize.sm,
    color: COLORS.error[500],
    marginLeft: SPACING.xs,
    fontWeight: TYPOGRAPHY.fontWeight.medium,
  },
  helperText: {
    fontSize: TYPOGRAPHY.fontSize.sm,
    color: COLORS.text.tertiary,
    fontWeight: TYPOGRAPHY.fontWeight.medium,
  },
  modalActions: {
    flexDirection: 'row',
    padding: SPACING.lg,
    gap: SPACING.md,
    borderTopWidth: 1,
    borderTopColor: COLORS.border.light,
  },
  cancelButton: {
    flex: 1,
    paddingVertical: SPACING.md,
    paddingHorizontal: SPACING.lg,
    borderRadius: BORDER_RADIUS.lg,
    borderWidth: 1,
    borderColor: COLORS.border.medium,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cancelButtonText: {
    fontSize: TYPOGRAPHY.fontSize.base,
    fontWeight: TYPOGRAPHY.fontWeight.semibold,
    color: COLORS.text.secondary,
  },
  saveButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: COLORS.primary[600],
    paddingVertical: SPACING.md,
    paddingHorizontal: SPACING.lg,
    borderRadius: BORDER_RADIUS.lg,
    ...SHADOWS.sm,
  },
  saveButtonDisabled: {
    backgroundColor: COLORS.neutral[400],
  },
  saveButtonText: {
    color: COLORS.background.primary,
    fontSize: TYPOGRAPHY.fontSize.base,
    fontWeight: TYPOGRAPHY.fontWeight.semibold,
    marginLeft: SPACING.sm,
  },
});
