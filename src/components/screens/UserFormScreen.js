import { API_URL } from '@env';
import { Picker } from '@react-native-picker/picker';
import axios from 'axios';
import { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
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
  LAYOUT,
  SHADOWS,
  SPACING,
  TYPOGRAPHY,
} from '../theme/theme';

const UserFormScreen = ({ navigation }) => {
  const organization = useSelector(
    state => state.auth.data?.organization || '',
  );

  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    empId: '',
    contact: '',
    location: '',
    jobTitle: '',
    role: 'employee',
    organization: organization,
    department: '',
  });

  const [departments, setDepartments] = useState([]);
  const [loading, setLoading] = useState(false);
  const [departmentsLoading, setDepartmentsLoading] = useState(true);
  const [errors, setErrors] = useState({});

  useEffect(() => {
    setFormData(prev => ({ ...prev, organization }));
  }, [organization]);

  useEffect(() => {
    const fetchDepartments = async () => {
      setDepartmentsLoading(true);
      try {
        const response = await axios.get(
          `${API_URL}/departments/get-departments`,
          { withCredentials: true },
        );
        if (response.data.success) {
          setDepartments(response.data.data);
        }
      } catch (error) {
        console.error('Error fetching departments:', error);
      } finally {
        setDepartmentsLoading(false);
      }
    };
    fetchDepartments();
  }, []);

  const handleChange = (name, value) => {
    setFormData({ ...formData, [name]: value });
    // Clear error when user starts typing
    if (errors[name]) {
      setErrors({ ...errors, [name]: null });
    }
  };

  const validateForm = () => {
    const newErrors = {};

    if (!formData.name.trim()) newErrors.name = 'Name is required';
    if (!formData.email.trim()) newErrors.email = 'Email is required';
    else if (!/\S+@\S+\.\S+/.test(formData.email))
      newErrors.email = 'Email is invalid';
    if (!formData.password.trim()) newErrors.password = 'Password is required';
    else if (formData.password.length < 6)
      newErrors.password = 'Password must be at least 6 characters';
    if (!formData.empId.trim()) newErrors.empId = 'Employee ID is required';
    if (!formData.contact.trim()) newErrors.contact = 'Contact is required';
    if (!formData.location.trim()) newErrors.location = 'Location is required';
    if (!formData.jobTitle.trim()) newErrors.jobTitle = 'Job Title is required';
    if (!formData.department) newErrors.department = 'Department is required';

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async () => {
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

    setLoading(true);
    try {
      const response = await axios.post(`${API_URL}/users/register`, formData, {
        withCredentials: true,
      });

      // Reset form
      setFormData({
        name: '',
        email: '',
        password: '',
        empId: '',
        contact: '',
        location: '',
        jobTitle: '',
        role: 'employee',
        organization: organization,
        department: '',
      });

      // Show success message
      Toast.show({
        type: 'success',
        text1: 'Success',
        text2: response.data.message || 'User created successfully!',
        position: 'top',
        visibilityTime: 3000,
      });

      navigation.goBack();
    } catch (err) {
      // Show error message
      Toast.show({
        type: 'error',
        text1: 'Error',
        text2: err.response?.data?.message || 'Something went wrong',
        position: 'top',
        visibilityTime: 3000,
      });
    } finally {
      setLoading(false);
    }
  };

  // Get role styling
  const getRoleStyle = role => {
    switch (role) {
      case 'admin':
        return { color: COLORS.error[600], icon: 'admin-panel-settings' };
      case 'manager':
        return { color: COLORS.primary[600], icon: 'supervisor-account' };
      case 'finance':
        return { color: COLORS.success[600], icon: 'account-balance' };
      case 'employee':
        return { color: COLORS.info[600], icon: 'person' };
      default:
        return { color: COLORS.neutral[600], icon: 'person' };
    }
  };

  const renderFormField = ({
    label,
    value,
    onChangeText,
    placeholder,
    keyboardType,
    secureTextEntry,
    multiline,
    icon,
    error,
  }) => (
    <View style={styles.fieldContainer}>
      <Text style={styles.label}>
        {label} <Text style={styles.required}>*</Text>
      </Text>
      <View style={[styles.inputContainer, error && styles.inputError]}>
        {icon && (
          <MaterialIcons
            name={icon}
            size={20}
            color={COLORS.text.tertiary}
            style={styles.inputIcon}
          />
        )}
        <TextInput
          value={value}
          onChangeText={onChangeText}
          placeholder={placeholder}
          placeholderTextColor={COLORS.text.tertiary}
          keyboardType={keyboardType}
          secureTextEntry={secureTextEntry}
          multiline={multiline}
          style={[styles.input, icon && styles.inputWithIcon]}
        />
      </View>
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

  const renderPickerField = ({
    label,
    selectedValue,
    onValueChange,
    items,
    error,
    icon,
  }) => (
    <View style={styles.fieldContainer}>
      <Text style={styles.label}>
        {label} <Text style={styles.required}>*</Text>
      </Text>
      <View style={[styles.pickerContainer, error && styles.inputError]}>
        {icon && (
          <MaterialIcons
            name={icon}
            size={20}
            color={COLORS.text.tertiary}
            style={styles.pickerIcon}
          />
        )}
        <Picker
          selectedValue={selectedValue}
          onValueChange={onValueChange}
          style={[styles.picker, icon && styles.pickerWithIcon]}
        >
          {items.map((item, index) => (
            <Picker.Item key={index} label={item.label} value={item.value} />
          ))}
        </Picker>
      </View>
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

  return (
    <KeyboardAvoidingView
      style={styles.container}
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
              name="person-add"
              size={32}
              color={COLORS.primary[600]}
            />
          </View>
          <Text style={styles.title}>Add New User</Text>
          <Text style={styles.subtitle}>
            Create a new user account for your organization
          </Text>
        </View>

        {/* Form Fields */}
        <View style={styles.formContainer}>
          {/* Personal Information Section */}
          <View style={styles.sectionContainer}>
            <Text style={styles.sectionTitle}>Personal Information</Text>

            {renderFormField({
              label: 'Full Name',
              value: formData.name,
              onChangeText: text => handleChange('name', text),
              placeholder: 'Enter full name',
              icon: 'person',
              error: errors.name,
            })}

            {renderFormField({
              label: 'Email Address',
              value: formData.email,
              onChangeText: text => handleChange('email', text),
              placeholder: 'Enter email address',
              keyboardType: 'email-address',
              icon: 'email',
              error: errors.email,
            })}

            {renderFormField({
              label: 'Password',
              value: formData.password,
              onChangeText: text => handleChange('password', text),
              placeholder: 'Enter password (min 6 characters)',
              secureTextEntry: true,
              icon: 'lock',
              error: errors.password,
            })}

            {renderFormField({
              label: 'Contact Number',
              value: formData.contact,
              onChangeText: text => handleChange('contact', text),
              placeholder: 'Enter contact number',
              keyboardType: 'phone-pad',
              icon: 'phone',
              error: errors.contact,
            })}
          </View>

          {/* Work Information Section */}
          <View style={styles.sectionContainer}>
            <Text style={styles.sectionTitle}>Work Information</Text>

            {renderFormField({
              label: 'Employee ID',
              value: formData.empId,
              onChangeText: text => handleChange('empId', text),
              placeholder: 'Enter employee ID',
              icon: 'badge',
              error: errors.empId,
            })}

            {renderFormField({
              label: 'Job Title',
              value: formData.jobTitle,
              onChangeText: text => handleChange('jobTitle', text),
              placeholder: 'Enter job title',
              icon: 'work',
              error: errors.jobTitle,
            })}

            {renderFormField({
              label: 'Location',
              value: formData.location,
              onChangeText: text => handleChange('location', text),
              placeholder: 'Enter work location',
              icon: 'location-on',
              error: errors.location,
            })}

            {renderPickerField({
              label: 'Role',
              selectedValue: formData.role,
              onValueChange: value => handleChange('role', value),
              icon: getRoleStyle(formData.role).icon,
              items: [
                { label: 'Employee', value: 'employee' },
                { label: 'Manager', value: 'manager' },
                { label: 'Finance', value: 'finance' },
              ],
              error: errors.role,
            })}

            {departmentsLoading ? (
              <View style={styles.loadingContainer}>
                <ActivityIndicator size="small" color={COLORS.primary[600]} />
                <Text style={styles.loadingText}>Loading departments...</Text>
              </View>
            ) : (
              renderPickerField({
                label: 'Department',
                selectedValue: formData.department,
                onValueChange: value => handleChange('department', value),
                icon: 'business',
                items: [
                  { label: 'Select Department', value: '' },
                  ...departments.map(dept => ({
                    label: dept.name,
                    value: dept._id,
                  })),
                ],
                error: errors.department,
              })
            )}
          </View>
        </View>

        {/* Submit Button */}
        <TouchableOpacity
          style={[styles.submitButton, loading && styles.submitButtonDisabled]}
          onPress={handleSubmit}
          disabled={loading}
          activeOpacity={0.8}
        >
          {loading ? (
            <ActivityIndicator color={COLORS.background.primary} size="small" />
          ) : (
            <>
              <MaterialIcons
                name="person-add"
                size={20}
                color={COLORS.background.primary}
              />
              <Text style={styles.submitButtonText}>Create User</Text>
            </>
          )}
        </TouchableOpacity>
      </ScrollView>
    </KeyboardAvoidingView>
  );
};

export default UserFormScreen;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background.secondary,
  },
  scrollContainer: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: LAYOUT.screenPadding,
    paddingBottom: SPACING['6xl'],
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

  // Form Container
  formContainer: {
    gap: SPACING.xl,
  },
  sectionContainer: {
    backgroundColor: COLORS.background.primary,
    borderRadius: BORDER_RADIUS.xl,
    padding: SPACING.lg,
    ...SHADOWS.sm,
  },
  sectionTitle: {
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
  inputContainer: {
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
  input: {
    flex: 1,
    fontSize: TYPOGRAPHY.fontSize.base,
    color: COLORS.text.primary,
    paddingVertical: SPACING.md,
  },
  inputWithIcon: {
    paddingLeft: 0,
  },

  // Picker
  pickerContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.background.primary,
    borderWidth: 1,
    borderColor: COLORS.border.medium,
    borderRadius: BORDER_RADIUS.lg,
    paddingLeft: SPACING.md,
    minHeight: 48,
  },
  pickerIcon: {
    marginRight: SPACING.sm,
  },
  picker: {
    flex: 1,
    color: COLORS.text.primary,
  },
  pickerWithIcon: {
    marginLeft: -SPACING.sm,
  },

  // Error
  errorContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: SPACING.sm,
  },
  errorText: {
    fontSize: TYPOGRAPHY.fontSize.sm,
    color: COLORS.error[500],
    marginLeft: SPACING.xs,
    fontWeight: TYPOGRAPHY.fontWeight.medium,
  },

  // Loading
  loadingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: SPACING.lg,
  },
  loadingText: {
    marginLeft: SPACING.sm,
    fontSize: TYPOGRAPHY.fontSize.sm,
    color: COLORS.text.secondary,
    fontWeight: TYPOGRAPHY.fontWeight.medium,
  },

  // Submit Button
  submitButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: COLORS.primary[600],
    paddingVertical: SPACING.lg,
    paddingHorizontal: SPACING.xl,
    borderRadius: BORDER_RADIUS.xl,
    marginTop: SPACING.xl,
    ...SHADOWS.md,
  },
  submitButtonDisabled: {
    backgroundColor: COLORS.neutral[400],
  },
  submitButtonText: {
    color: COLORS.background.primary,
    fontSize: TYPOGRAPHY.fontSize.base,
    fontWeight: TYPOGRAPHY.fontWeight.semibold,
    marginLeft: SPACING.sm,
  },
});
