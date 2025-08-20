import React, { useState } from 'react';
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import MaterialIcons from 'react-native-vector-icons/MaterialIcons';
import { useDispatch, useSelector } from 'react-redux';
import { fetchUser, loginUser } from '../../components/redux/authSlice';
import {
  CARD_SHADOW,
  ERROR_COLOR,
  INACTIVE_COLOR,
  LIGHT_BG,
  PRIMARY_COLOR,
} from '../../components/theme/theme';

const LoginScreen = ({ navigation }) => {
  const dispatch = useDispatch();
  const { loading, data: user, role } = useSelector(state => state.auth);

  const [formData, setFormData] = useState({
    email: '',
    password: '',
  });
  const [showPassword, setShowPassword] = useState(false);
  const [errors, setErrors] = useState({});

  const handleChange = (key, value) => {
    setFormData({ ...formData, [key]: value });
    // Clear error when user starts typing
    if (errors[key]) {
      setErrors({ ...errors, [key]: '' });
    }
  };

  const validateForm = () => {
    const newErrors = {};

    if (!formData.email.trim()) {
      newErrors.email = 'Email is required';
    } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
      newErrors.email = 'Please enter a valid email';
    }

    if (!formData.password.trim()) {
      newErrors.password = 'Password is required';
    } else if (formData.password.length < 6) {
      newErrors.password = 'Password must be at least 6 characters';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async () => {
    if (!validateForm()) {
      return;
    }

    try {
      // 1️⃣ Login the user
      const response = await dispatch(loginUser(formData)).unwrap();

      // 2️⃣ Fetch the authenticated user immediately
      await dispatch(fetchUser()).unwrap();

      // 3️⃣ Navigate to the main app
      navigation.getParent()?.reset({
        index: 0,
        routes: [{ name: 'MainApp' }],
      });
    } catch (err) {
      setErrors({ general: 'Invalid email or password. Please try again.' });
    }
  };

  const togglePasswordVisibility = () => {
    setShowPassword(!showPassword);
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      style={styles.container}
    >
      <View style={styles.content}>
        {/* Header Section */}
        <View style={styles.header}>
          <View style={styles.logoContainer}>
            <MaterialIcons name="account-circle" size={64} color="#fff" />
          </View>
          <Text style={styles.title}>Welcome Back</Text>
          <Text style={styles.subtitle}>Sign in to your account</Text>
        </View>

        {/* Form Card */}
        <View style={styles.card}>
          {/* General Error Message */}
          {errors.general && (
            <View style={styles.errorContainer}>
              <MaterialIcons
                name="error-outline"
                size={20}
                color={ERROR_COLOR}
              />
              <Text style={styles.errorText}>{errors.general}</Text>
            </View>
          )}

          {/* Email Input */}
          <View style={styles.inputContainer}>
            <Text style={styles.inputLabel}>Email Address</Text>
            <View
              style={[styles.inputWrapper, errors.email && styles.inputError]}
            >
              <MaterialIcons name="email" size={20} color={INACTIVE_COLOR} />
              <TextInput
                style={styles.input}
                placeholder="Enter your email"
                keyboardType="email-address"
                placeholderTextColor={INACTIVE_COLOR}
                autoCapitalize="none"
                value={formData.email}
                onChangeText={text => handleChange('email', text)}
                autoComplete="email"
                textContentType="emailAddress"
              />
            </View>
            {errors.email && (
              <Text style={styles.fieldError}>{errors.email}</Text>
            )}
          </View>

          {/* Password Input */}
          <View style={styles.inputContainer}>
            <Text style={styles.inputLabel}>Password</Text>
            <View
              style={[
                styles.inputWrapper,
                errors.password && styles.inputError,
              ]}
            >
              <MaterialIcons name="lock" size={20} color={INACTIVE_COLOR} />
              <TextInput
                style={styles.input}
                placeholder="Enter your password"
                placeholderTextColor={INACTIVE_COLOR}
                secureTextEntry={!showPassword}
                value={formData.password}
                onChangeText={text => handleChange('password', text)}
                autoComplete="password"
                textContentType="password"
              />
              <TouchableOpacity
                onPress={togglePasswordVisibility}
                style={styles.eyeButton}
                hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
              >
                <MaterialIcons
                  name={showPassword ? 'visibility-off' : 'visibility'}
                  size={20}
                  color={INACTIVE_COLOR}
                />
              </TouchableOpacity>
            </View>
            {errors.password && (
              <Text style={styles.fieldError}>{errors.password}</Text>
            )}
          </View>

          {/* Forgot Password Link */}
          <TouchableOpacity style={styles.forgotPassword}>
            <Text style={styles.forgotPasswordText}>Forgot Password?</Text>
          </TouchableOpacity>

          {/* Login Button */}
          <TouchableOpacity
            style={[styles.button, loading && styles.buttonDisabled]}
            onPress={handleSubmit}
            disabled={loading}
            activeOpacity={0.8}
          >
            {loading ? (
              <View style={styles.buttonContent}>
                <ActivityIndicator color="#fff" size="small" />
                <Text style={styles.buttonText}>Signing in...</Text>
              </View>
            ) : (
              <View style={styles.buttonContent}>
                <MaterialIcons name="login" size={20} color="#fff" />
                <Text style={styles.buttonText}>Sign In</Text>
              </View>
            )}
          </TouchableOpacity>

          {/* Footer */}
          <View style={styles.footer}>
            <Text style={styles.footerText}>
              Don't have an account?{' '}
              <Text
                style={styles.link}
                onPress={() => navigation.navigate('Signup')}
              >
                Sign Up
              </Text>
            </Text>
          </View>
        </View>
      </View>
    </KeyboardAvoidingView>
  );
};

export default LoginScreen;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: PRIMARY_COLOR,
  },
  content: {
    flex: 1,
    justifyContent: 'center',
    paddingHorizontal: 20,
  },
  header: {
    alignItems: 'center',
    marginBottom: 40,
  },
  logoContainer: {
    marginBottom: 20,
  },
  title: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    color: 'rgba(255, 255, 255, 0.8)',
    textAlign: 'center',
  },
  card: {
    backgroundColor: '#fff',
    borderRadius: 20,
    padding: 24,
    width: '100%',
    maxWidth: 400,
    alignSelf: 'center',
    ...CARD_SHADOW,
  },
  errorContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FEF2F2',
    borderWidth: 1,
    borderColor: ERROR_COLOR,
    borderRadius: 8,
    padding: 12,
    marginBottom: 20,
  },
  errorText: {
    color: ERROR_COLOR,
    fontSize: 14,
    marginLeft: 8,
    flex: 1,
  },
  inputContainer: {
    marginBottom: 20,
  },
  inputLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#374151',
    marginBottom: 8,
  },
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: LIGHT_BG,
    borderWidth: 1.5,
    borderColor: '#D1D5DB',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 4,
    ...CARD_SHADOW,
  },
  inputError: {
    borderColor: ERROR_COLOR,
    backgroundColor: '#FEF2F2',
  },
  input: {
    flex: 1,
    fontSize: 16,
    color: '#1F2937',
    paddingVertical: 12,
    paddingHorizontal: 12,
  },
  eyeButton: {
    padding: 4,
  },
  fieldError: {
    color: ERROR_COLOR,
    fontSize: 12,
    marginTop: 4,
    marginLeft: 4,
  },
  forgotPassword: {
    alignSelf: 'flex-end',
    marginBottom: 24,
  },
  forgotPasswordText: {
    color: PRIMARY_COLOR,
    fontSize: 14,
    fontWeight: '500',
  },
  button: {
    backgroundColor: PRIMARY_COLOR,
    borderRadius: 12,
    paddingVertical: 16,
    paddingHorizontal: 24,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 20,
    ...CARD_SHADOW,
  },
  buttonDisabled: {
    backgroundColor: INACTIVE_COLOR,
  },
  buttonContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  buttonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
    marginLeft: 8,
  },
  footer: {
    alignItems: 'center',
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: '#F3F4F6',
  },
  footerText: {
    fontSize: 14,
    color: '#6B7280',
    textAlign: 'center',
  },
  link: {
    color: PRIMARY_COLOR,
    fontWeight: '600',
  },
});
