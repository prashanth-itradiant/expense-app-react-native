import { API_URL } from '@env';
import { useNavigation, useRoute } from '@react-navigation/native';
import axios from 'axios';
import React, { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Platform,
  SafeAreaView,
  ScrollView,
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

// Custom Picker Component
const CustomPicker = ({
  label,
  value,
  onValueChange,
  options,
  placeholder,
  icon,
  error,
  disabled,
}) => {
  const [isOpen, setIsOpen] = useState(false);

  const handleSelect = selectedValue => {
    onValueChange(selectedValue);
    setIsOpen(false); // Close dropdown after selection
  };

  return (
    <View style={styles.fieldContainer}>
      <Text style={styles.label}>
        {label} <Text style={styles.required}>*</Text>
      </Text>
      <TouchableOpacity
        style={[styles.pickerContainer, error && styles.inputError]}
        onPress={() => !disabled && setIsOpen(!isOpen)}
        activeOpacity={0.8}
      >
        {icon && (
          <MaterialIcons
            name={icon}
            size={20}
            color={COLORS.text.tertiary}
            style={styles.inputIcon}
          />
        )}
        <View style={styles.pickerWrapper}>
          <Text style={[styles.pickerText, !value && styles.placeholderText]}>
            {value
              ? options.find(opt => opt.value === value)?.label
              : placeholder}
          </Text>
          <MaterialIcons
            name={isOpen ? 'keyboard-arrow-up' : 'keyboard-arrow-down'}
            size={24}
            color={COLORS.text.tertiary}
          />
        </View>
      </TouchableOpacity>

      {isOpen && options.length > 0 && (
        <View style={styles.optionsContainer}>
          {options.map(option => (
            <TouchableOpacity
              key={option.value}
              style={[
                styles.option,
                value === option.value && styles.selectedOption,
              ]}
              onPress={() => handleSelect(option.value)}
              disabled={disabled}
            >
              <Text
                style={[
                  styles.optionText,
                  value === option.value && styles.selectedOptionText,
                ]}
              >
                {option.label}
              </Text>
              {value === option.value && (
                <MaterialIcons
                  name="check"
                  size={20}
                  color={COLORS.primary[600]}
                />
              )}
            </TouchableOpacity>
          ))}
        </View>
      )}

      {error && (
        <View style={styles.errorContainer}>
          <MaterialIcons
            name="error-outline"
            size={16}
            color={COLORS.error[500]}
          />
          <Text style={styles.errorText}>{error}</Text>
        </View>
      )}
    </View>
  );
};

const TransferExpenseScreen = () => {
  const navigation = useNavigation();
  const route = useRoute();
  const { id } = route.params; // Expense ID from navigation params

  const [loading, setLoading] = useState(true);
  const [transferring, setTransferring] = useState(false);
  const [expenseDetails, setExpenseDetails] = useState(null);
  const [managers, setManagers] = useState([]);
  const [financeUsers, setFinanceUsers] = useState([]);
  const [roleToTransfer, setRoleToTransfer] = useState('');
  const [selectedUser, setSelectedUser] = useState('');
  const [transferReason, setTransferReason] = useState('');
  const [errors, setErrors] = useState({});

  useEffect(() => {
    fetchData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  console.log(managers, financeUsers, ' managers, financeUsers');

  const fetchData = async () => {
    setLoading(true);
    try {
      // Fetch expense details and organization users in parallel
      const [expenseResponse, usersResponse] = await Promise.all([
        axios.get(`${API_URL}/expenses/get-expense/${id}`, {
          withCredentials: true,
        }),
        axios.get(`${API_URL}/users/get-organization-users`, {
          withCredentials: true,
        }),
      ]);

      if (expenseResponse.data.success) {
        setExpenseDetails(expenseResponse.data.data);
      } else {
        throw new Error('Failed to fetch expense details');
      }

      if (usersResponse.data.success) {
        setManagers(usersResponse.data.data.managers || []);
        setFinanceUsers(usersResponse.data.data.financeUsers || []);
      } else {
        throw new Error('Failed to fetch organization users');
      }
    } catch (error) {
      console.error('Error fetching data:', error);

      navigation.goBack();
    } finally {
      setLoading(false);
    }
  };

  const validateForm = () => {
    const newErrors = {};

    if (!roleToTransfer)
      newErrors.roleToTransfer = 'Please select a role to transfer';
    if (!selectedUser) newErrors.selectedUser = 'Please select a user';
    if (!transferReason.trim())
      newErrors.transferReason = 'Please provide a transfer reason';
    else if (transferReason.trim().length < 10)
      newErrors.transferReason = 'Reason must be at least 10 characters';

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleTransfer = async () => {
    if (!validateForm()) {
      Toast.show({
        type: 'error',
        text1: 'Validation Error',
        text2: 'Please fill in all required fields correctly',
        position: 'top',
        visibilityTime: 3000,
      });
      return;
    }

    Alert.alert(
      'Confirm Transfer',
      `Are you sure you want to transfer this expense to the selected ${roleToTransfer}?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Transfer',
          style: 'default',
          onPress: performTransfer,
        },
      ],
    );
  };

  const performTransfer = async () => {
    setTransferring(true);
    try {
      const response = await axios.post(
        `${API_URL}/expenses/transfer-expense`,
        {
          expenseId: id,
          newEmployeeId: selectedUser,
          roleTransferred: roleToTransfer,
          reason: transferReason.trim(),
        },
        { withCredentials: true },
      );

      if (response.data.success) {
        Toast.show({
          type: 'success',
          text1: 'Success',
          text2: 'Expense transferred successfully',
          position: 'top',
          visibilityTime: 3000,
        });
        navigation.goBack();
      }
    } catch (error) {
      console.error('Error transferring expense:', error);
      Toast.show({
        type: 'error',
        text1: 'Error',
        text2: error.response?.data?.message || 'Failed to transfer expense',
        position: 'top',
        visibilityTime: 3000,
      });
    } finally {
      setTransferring(false);
    }
  };

  const handleFieldChange = (field, value) => {
    switch (field) {
      case 'roleToTransfer':
        setRoleToTransfer(value);
        setSelectedUser(''); // Reset selected user when role changes
        break;
      case 'selectedUser':
        setSelectedUser(value);
        break;
      case 'transferReason':
        setTransferReason(value);
        break;
    }

    // Clear error when user starts typing/selecting
    if (errors[field]) {
      setErrors({ ...errors, [field]: null });
    }
  };

  const getRoleOptions = () => [
    { label: 'Select Role', value: '' },
    { label: 'Manager', value: 'manager' },
    { label: 'Finance', value: 'finance' },
  ];

  const getUserOptions = () => {
    if (!roleToTransfer) return [];

    const users = roleToTransfer === 'manager' ? managers : financeUsers;
    const currentUserId =
      roleToTransfer === 'manager'
        ? expenseDetails?.managerId?._id
        : expenseDetails?.financeId?._id;

    // Filter out the current user in that role
    const availableUsers = users.filter(user => user._id !== currentUserId);

    return [
      {
        label: `Select ${roleToTransfer === 'manager' ? 'Manager' : 'Finance'}`,
        value: '',
      },
      ...availableUsers.map(user => ({
        label: user.name,
        value: user._id,
      })),
    ];
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={COLORS.primary[600]} />
          <Text style={styles.loadingText}>Loading expense details...</Text>
        </View>
      </SafeAreaView>
    );
  }

  if (!expenseDetails) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.errorContainer}>
          <MaterialIcons
            name="error-outline"
            size={64}
            color={COLORS.error[500]}
          />
          <Text style={styles.errorTitle}>Expense Not Found</Text>
          <Text style={styles.errorText}>
            The requested expense could not be found.
          </Text>
          <TouchableOpacity
            style={styles.backButton}
            onPress={() => navigation.goBack()}
          >
            <MaterialIcons
              name="arrow-back"
              size={20}
              color={COLORS.background.primary}
            />
            <Text style={styles.backButtonText}>Go Back</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView
        style={styles.keyboardContainer}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        <ScrollView
          style={styles.scrollContainer}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          {/* Header */}
          <View style={styles.header}>
            <View style={styles.headerIconContainer}>
              <MaterialIcons
                name="swap-horiz"
                size={32}
                color={COLORS.primary[600]}
              />
            </View>
            <Text style={styles.title}>Transfer Expense</Text>
            <Text style={styles.subtitle}>
              Reassign expense approval responsibility to another team member
            </Text>
          </View>

          {/* Expense Details Card */}
          <View style={styles.expenseDetailsCard}>
            <View style={styles.cardHeader}>
              <MaterialIcons
                name="receipt-long"
                size={24}
                color={COLORS.primary[600]}
              />
              <Text style={styles.cardTitle}>Expense Details</Text>
            </View>

            <View style={styles.detailsContent}>
              <View style={styles.detailRow}>
                <Text style={styles.detailLabel}>Expense Name:</Text>
                <Text style={styles.detailValue}>
                  {expenseDetails.expenseName}
                </Text>
              </View>

              <View style={styles.detailRow}>
                <Text style={styles.detailLabel}>Applied By:</Text>
                <Text style={styles.detailValue}>
                  {expenseDetails.employee?.name || 'Unknown'}
                </Text>
              </View>

              <View style={styles.detailRow}>
                <Text style={styles.detailLabel}>Current Manager:</Text>
                <Text style={styles.detailValue}>
                  {expenseDetails.managerId?.name || 'Not Assigned'}
                </Text>
              </View>

              <View style={styles.detailRow}>
                <Text style={styles.detailLabel}>Current Finance:</Text>
                <Text style={styles.detailValue}>
                  {expenseDetails.financeId?.name || 'Not Assigned'}
                </Text>
              </View>
            </View>

            {/* View Details Link */}
            <TouchableOpacity
              style={styles.viewDetailsButton}
              onPress={() =>
                navigation.navigate('TeamExpenseDetails', {
                  id: expenseDetails._id,
                })
              }
            >
              <MaterialIcons
                name="visibility"
                size={20}
                color={COLORS.primary[600]}
              />
              <Text style={styles.viewDetailsText}>View Detailed Expense</Text>
              <MaterialIcons
                name="arrow-forward"
                size={20}
                color={COLORS.primary[600]}
              />
            </TouchableOpacity>
          </View>

          {/* Transfer Form */}
          <View style={styles.formContainer}>
            <Text style={styles.formTitle}>Transfer Information</Text>

            {/* Role Selection */}
            <CustomPicker
              label="Select Role to Transfer"
              value={roleToTransfer}
              onValueChange={value =>
                handleFieldChange('roleToTransfer', value)
              }
              options={getRoleOptions()}
              placeholder="Choose role"
              icon="admin-panel-settings"
              error={errors.roleToTransfer}
            />

            {/* User Selection */}
            {roleToTransfer && (
              <CustomPicker
                label={`Select New ${
                  roleToTransfer === 'manager' ? 'Manager' : 'Finance'
                }`}
                value={selectedUser}
                onValueChange={value =>
                  handleFieldChange('selectedUser', value)
                }
                options={getUserOptions()}
                placeholder={`Choose ${roleToTransfer}`}
                icon={
                  roleToTransfer === 'manager'
                    ? 'supervisor-account'
                    : 'account-balance'
                }
                error={errors.selectedUser}
                disabled={loading}
              />
            )}

            {/* Transfer Reason */}
            <View style={styles.fieldContainer}>
              <Text style={styles.label}>
                Transfer Reason <Text style={styles.required}>*</Text>
              </Text>
              <View
                style={[
                  styles.textAreaContainer,
                  errors.transferReason && styles.inputError,
                ]}
              >
                <MaterialIcons
                  name="description"
                  size={20}
                  color={COLORS.text.tertiary}
                  style={styles.textAreaIcon}
                />
                <TextInput
                  style={styles.textArea}
                  value={transferReason}
                  onChangeText={text =>
                    handleFieldChange('transferReason', text)
                  }
                  placeholder="Provide a detailed reason for the transfer..."
                  placeholderTextColor={COLORS.text.tertiary}
                  multiline
                  numberOfLines={4}
                  textAlignVertical="top"
                  maxLength={500}
                />
              </View>
              <View style={styles.characterCount}>
                <Text style={styles.characterCountText}>
                  {transferReason.length}/500 characters
                </Text>
              </View>
              {errors.transferReason && (
                <View style={styles.errorContainer}>
                  <MaterialIcons
                    name="error-outline"
                    size={16}
                    color={COLORS.error[500]}
                  />
                  <Text style={styles.errorText}>{errors.transferReason}</Text>
                </View>
              )}
            </View>
          </View>

          {/* Action Buttons */}
          <View style={styles.actionContainer}>
            <TouchableOpacity
              style={styles.cancelButton}
              onPress={() => navigation.goBack()}
              activeOpacity={0.8}
            >
              <Text style={styles.cancelButtonText}>Cancel</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[
                styles.transferButton,
                transferring && styles.transferButtonDisabled,
              ]}
              onPress={handleTransfer}
              disabled={transferring}
              activeOpacity={0.8}
            >
              {transferring ? (
                <ActivityIndicator
                  size="small"
                  color={COLORS.background.primary}
                />
              ) : (
                <>
                  <MaterialIcons
                    name="swap-horiz"
                    size={20}
                    color={COLORS.background.primary}
                  />
                  <Text style={styles.transferButtonText}>
                    Transfer Expense
                  </Text>
                </>
              )}
            </TouchableOpacity>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

export default TransferExpenseScreen;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background.secondary,
  },
  keyboardContainer: {
    flex: 1,
  },
  scrollContainer: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: LAYOUT.screenPadding,
    paddingBottom: SPACING['6xl'],
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
  backButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.primary[600],
    paddingHorizontal: SPACING.xl,
    paddingVertical: SPACING.md,
    borderRadius: BORDER_RADIUS.lg,
  },
  backButtonText: {
    color: COLORS.background.primary,
    fontSize: TYPOGRAPHY.fontSize.base,
    fontWeight: TYPOGRAPHY.fontWeight.semibold,
    marginLeft: SPACING.sm,
  },

  // Header
  header: {
    alignItems: 'center',
    paddingVertical: SPACING['2xl'],
    marginBottom: SPACING.lg,
  },
  headerIconContainer: {
    width: 64,
    height: 48,
    borderRadius: 18,
    backgroundColor: COLORS.primary[50],
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: SPACING.md,
  },
  title: {
    fontSize: TYPOGRAPHY.fontSize['3xl'],
    fontWeight: TYPOGRAPHY.fontWeight.bold,
    color: COLORS.text.primary,
    marginBottom: SPACING.sm,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: TYPOGRAPHY.fontSize.base,
    color: COLORS.text.secondary,
    textAlign: 'center',
    lineHeight: TYPOGRAPHY.fontSize.base * TYPOGRAPHY.lineHeight.relaxed,
  },

  // Expense Details Card
  expenseDetailsCard: {
    ...COMPONENT_STYLES.card.elevated,
    marginBottom: SPACING.xl,
    borderWidth: 1,
    borderColor: COLORS.border.light,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: SPACING.lg,
    paddingBottom: SPACING.md,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border.light,
  },
  cardTitle: {
    fontSize: TYPOGRAPHY.fontSize.lg,
    fontWeight: TYPOGRAPHY.fontWeight.semibold,
    color: COLORS.text.primary,
    marginLeft: SPACING.sm,
  },
  detailsContent: {
    gap: SPACING.md,
    marginBottom: SPACING.lg,
  },
  detailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  detailLabel: {
    fontSize: TYPOGRAPHY.fontSize.sm,
    fontWeight: TYPOGRAPHY.fontWeight.medium,
    color: COLORS.text.secondary,
    flex: 1,
  },
  detailValue: {
    fontSize: TYPOGRAPHY.fontSize.sm,
    fontWeight: TYPOGRAPHY.fontWeight.semibold,
    color: COLORS.text.primary,
    flex: 1,
    textAlign: 'right',
  },
  amountText: {
    color: COLORS.primary[600],
    fontSize: TYPOGRAPHY.fontSize.base,
  },
  viewDetailsButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: SPACING.md,
    paddingHorizontal: SPACING.lg,
    borderRadius: BORDER_RADIUS.lg,
    borderWidth: 1,
    borderColor: COLORS.primary[200],
    backgroundColor: COLORS.primary[50],
  },
  viewDetailsText: {
    color: COLORS.primary[600],
    fontSize: TYPOGRAPHY.fontSize.sm,
    fontWeight: TYPOGRAPHY.fontWeight.semibold,
    marginHorizontal: SPACING.sm,
  },

  // Form Container
  formContainer: {
    backgroundColor: COLORS.background.primary,
    borderRadius: BORDER_RADIUS.xl,
    padding: SPACING.lg,
    marginBottom: SPACING.xl,
    ...SHADOWS.sm,
  },
  formTitle: {
    fontSize: TYPOGRAPHY.fontSize.lg,
    fontWeight: TYPOGRAPHY.fontWeight.semibold,
    color: COLORS.text.primary,
    marginBottom: SPACING.lg,
    paddingBottom: SPACING.sm,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border.light,
  },

  // Form Fields
  fieldContainer: {
    marginBottom: SPACING.lg,
  },
  label: {
    fontSize: TYPOGRAPHY.fontSize.sm,
    fontWeight: TYPOGRAPHY.fontWeight.semibold,
    color: COLORS.text.primary,
    marginBottom: SPACING.sm,
  },
  required: {
    color: COLORS.error[500],
  },

  // Custom Picker
  pickerContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.background.primary,
    borderWidth: 1,
    borderColor: COLORS.border.medium,
    borderRadius: BORDER_RADIUS.lg,
    paddingHorizontal: SPACING.md,
    minHeight: 48,
  },
  inputError: {
    borderColor: COLORS.error[500],
    backgroundColor: COLORS.error[50],
  },
  inputIcon: {
    marginRight: SPACING.sm,
  },
  pickerWrapper: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: SPACING.md,
  },
  pickerText: {
    fontSize: TYPOGRAPHY.fontSize.base,
    color: COLORS.text.primary,
  },
  placeholderText: {
    color: COLORS.text.tertiary,
  },
  optionsContainer: {
    marginTop: SPACING.sm,
    borderRadius: BORDER_RADIUS.lg,
    borderWidth: 1,
    borderColor: COLORS.border.light,
    backgroundColor: COLORS.background.primary,
    ...SHADOWS.sm,
  },
  option: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.md,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border.light,
  },
  selectedOption: {
    backgroundColor: COLORS.primary[50],
  },
  optionText: {
    fontSize: TYPOGRAPHY.fontSize.base,
    color: COLORS.text.primary,
    flex: 1,
  },
  selectedOptionText: {
    color: COLORS.primary[600],
    fontWeight: TYPOGRAPHY.fontWeight.semibold,
  },

  // Text Area
  textAreaContainer: {
    flexDirection: 'row',
    backgroundColor: COLORS.background.primary,
    borderWidth: 1,
    borderColor: COLORS.border.medium,
    borderRadius: BORDER_RADIUS.lg,
    padding: SPACING.md,
    minHeight: 100,
  },
  textAreaIcon: {
    marginRight: SPACING.sm,
    marginTop: SPACING.xs,
  },
  textArea: {
    flex: 1,
    fontSize: TYPOGRAPHY.fontSize.base,
    color: COLORS.text.primary,
    textAlignVertical: 'top',
  },
  characterCount: {
    alignItems: 'flex-end',
    marginTop: SPACING.sm,
  },
  characterCountText: {
    fontSize: TYPOGRAPHY.fontSize.xs,
    color: COLORS.text.tertiary,
    fontWeight: TYPOGRAPHY.fontWeight.medium,
  },

  actionContainer: {
    flexDirection: 'row',
    gap: SPACING.md,
  },
  cancelButton: {
    flex: 1,
    paddingVertical: SPACING.lg,
    paddingHorizontal: SPACING.xl,
    borderRadius: BORDER_RADIUS.xl,
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
  transferButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: COLORS.success[600],
    paddingVertical: SPACING.lg,
    paddingHorizontal: SPACING.xl,
    borderRadius: BORDER_RADIUS.xl,
    ...SHADOWS.md,
  },
  transferButtonDisabled: {
    backgroundColor: COLORS.neutral[400],
  },
  transferButtonText: {
    color: COLORS.background.primary,
    fontSize: TYPOGRAPHY.fontSize.base,
    fontWeight: TYPOGRAPHY.fontWeight.semibold,
    marginLeft: SPACING.sm,
  },
});
