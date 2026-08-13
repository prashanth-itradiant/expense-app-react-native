import React, { useState } from 'react';
import {
  ActivityIndicator,
  Dimensions,
  Image,
  KeyboardAvoidingView,
  Linking,
  Platform,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import MaterialIcons from 'react-native-vector-icons/MaterialIcons';
import { useDispatch, useSelector } from 'react-redux';
import { loginUser } from '../../components/redux/authSlice';
import api from '../../services/api';
import Toast from 'react-native-toast-message';
import { API_URL } from '@env';

// ---------------------------------------------------------------------------
// Theme — white + dark gray, matches the Expense Portal logo mark
// ---------------------------------------------------------------------------
const COLORS = {
  bg: '#FFFFFF',
  surface: '#FFFFFF',
  fieldBg: '#F7F7F8',
  border: '#E4E5E7',
  dark: '#25272B', // primary dark gray (buttons, headings)
  navyblue: '#14254d',
  darkPressed: '#17181B',
  textPrimary: '#1F2124',
  textSecondary: '#6B6E76',
  placeholder: '#9AA0A6',
  error: '#D64545',
  errorBg: '#FDECEC',
  accent: '#C1502E', // pulled from the logo's terracotta swirl
  white: '#FFFFFF',
};

// Scale down spacing/sizes a touch on short screens (SE, mini, etc.)
// so nothing gets pushed under the notch or the home indicator.
const { height: SCREEN_HEIGHT } = Dimensions.get('window');
const IS_SHORT_SCREEN = SCREEN_HEIGHT < 700;

const LoginScreen = ({ navigation }) => {
  const dispatch = useDispatch();
  const { loading } = useSelector(state => state.auth);
  const insets = useSafeAreaInsets();

  const [formData, setFormData] = useState({ email: '', password: '' });
  const [showPassword, setShowPassword] = useState(false);
  const [errors, setErrors] = useState({});
  const [microsoftLoading, setMicrosoftLoading] = useState(false);

  const handleChange = (key, value) => {
    setFormData(prev => ({ ...prev, [key]: value }));
    if (errors[key]) {
      setErrors(prev => ({ ...prev, [key]: '' }));
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
    if (!validateForm()) return;

    try {
      await dispatch(loginUser(formData)).unwrap();
      navigation.getParent()?.reset({
        index: 0,
        routes: [{ name: 'MainApp' }],
      });
    } catch (err) {
      Toast.show({
        type: 'error',
        text1: 'Sign in failed',
        text2: String(err || 'Invalid email or password'),
        visibilityTime: 2600,
      });
    }
  };

  const handleMicrosoftLogin = async () => {
    if (microsoftLoading) return;
    setMicrosoftLoading(true);
    try {
      await api.get('/health', { timeout: 5000 });
      const url = `${API_URL}/auth/azure/login?client=mobile`;
      await Linking.openURL(url);
    } catch (error) {
      const message = error.response?.data?.message || error.message;
      Toast.show({
        type: 'error',
        text1: 'Microsoft sign-in unavailable',
        text2:
          message ||
          'Could not reach the backend. Check the app connection and try again.',
        visibilityTime: 4000,
      });
    } finally {
      setMicrosoftLoading(false);
    }
  };

  const togglePasswordVisibility = () => setShowPassword(prev => !prev);

  return (
    <View
      style={[
        styles.root,
        {
          // Push content clear of the camera / notch / status bar up top
          // and clear of the home-indicator / gesture bar down below,
          // on every device (iOS notch, Android cutout, no-notch phones).
          paddingTop: insets.top,
          paddingBottom: insets.bottom,
        },
      ]}
    >
      <StatusBar
        barStyle="dark-content"
        backgroundColor={COLORS.bg}
        translucent={Platform.OS === 'android'}
      />
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        style={styles.flex}
      >
        <ScrollView
          contentContainerStyle={[styles.scrollContent, { minHeight: '100%' }]}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
          bounces={false}
          overScrollMode="never"
        >
          {/* Logo + brand */}
          <View style={styles.brand}>
            <View style={styles.logoWrap}>
              <Image
                source={require('../../assets/favicon.png')}
                style={styles.logoImg}
                resizeMode="contain"
              />
            </View>
            <Text style={styles.appName}>Expense Portal</Text>
            <Text style={styles.tagline}>Track. Manage. Simplify.</Text>
          </View>

          {/* Form Card */}
          <View style={styles.card}>
            <Text style={styles.welcome}>Welcome back</Text>
            <Text style={styles.welcomeSub}>Sign in to continue</Text>

            {/* Email */}
            <View style={styles.inputContainer}>
              <Text style={styles.inputLabel}>Email Address</Text>
              <View
                style={[
                  styles.inputWrapper,
                  errors.email && styles.inputErrorBorder,
                ]}
              >
                <MaterialIcons
                  name="mail-outline"
                  size={19}
                  color={COLORS.placeholder}
                />
                <TextInput
                  style={styles.input}
                  placeholder="you@example.com"
                  keyboardType="email-address"
                  placeholderTextColor={COLORS.placeholder}
                  autoCapitalize="none"
                  autoCorrect={false}
                  value={formData.email}
                  onChangeText={text => handleChange('email', text)}
                  autoComplete="email"
                  textContentType="emailAddress"
                  returnKeyType="next"
                />
              </View>
              {errors.email ? (
                <Text style={styles.fieldError}>{errors.email}</Text>
              ) : null}
            </View>

            {/* Password */}
            <View style={styles.inputContainer}>
              <Text style={styles.inputLabel}>Password</Text>
              <View
                style={[
                  styles.inputWrapper,
                  errors.password && styles.inputErrorBorder,
                ]}
              >
                <MaterialIcons
                  name="lock-outline"
                  size={19}
                  color={COLORS.placeholder}
                />
                <TextInput
                  style={styles.input}
                  placeholder="Enter your password"
                  placeholderTextColor={COLORS.placeholder}
                  secureTextEntry={!showPassword}
                  value={formData.password}
                  onChangeText={text => handleChange('password', text)}
                  autoComplete="password"
                  textContentType="password"
                  returnKeyType="done"
                  onSubmitEditing={handleSubmit}
                />
                <TouchableOpacity
                  onPress={togglePasswordVisibility}
                  style={styles.eyeButton}
                  hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                >
                  <MaterialIcons
                    name={showPassword ? 'visibility-off' : 'visibility'}
                    size={19}
                    color={COLORS.placeholder}
                  />
                </TouchableOpacity>
              </View>
              {errors.password ? (
                <Text style={styles.fieldError}>{errors.password}</Text>
              ) : null}
            </View>

            {/* Forgot Password */}
            <TouchableOpacity
              style={styles.forgotPassword}
              hitSlop={{ top: 6, bottom: 6, left: 6, right: 6 }}
            >
              {/* <Text style={styles.forgotPasswordText}>Forgot Password?</Text> */}
            </TouchableOpacity>

            {/* Sign In Button */}
            <TouchableOpacity
              style={[styles.button, loading && styles.buttonDisabled]}
              onPress={handleSubmit}
              disabled={loading}
              activeOpacity={0.85}
            >
              {loading ? (
                <View style={styles.buttonContent}>
                  <ActivityIndicator color={COLORS.white} size="small" />
                  <Text style={styles.buttonText}>Signing in...</Text>
                </View>
              ) : (
                <View style={styles.buttonContent}>
                  <Text style={styles.buttonText}>Sign In</Text>
                  <MaterialIcons
                    name="arrow-forward"
                    size={18}
                    color={COLORS.white}
                  />
                </View>
              )}
            </TouchableOpacity>

            {/* Divider */}
            <View style={styles.dividerRow}>
              <View style={styles.divider} />
              <Text style={styles.dividerText}>or continue with</Text>
              <View style={styles.divider} />
            </View>

            {/* Microsoft SSO */}
            <TouchableOpacity
              style={styles.microsoftButton}
              activeOpacity={0.85}
              onPress={handleMicrosoftLogin}
              disabled={microsoftLoading}
            >
              <View style={styles.microsoftMark}>
                <View
                  style={[styles.microsoftTile, { backgroundColor: '#F25022' }]}
                />
                <View
                  style={[styles.microsoftTile, { backgroundColor: '#7FBA00' }]}
                />
                <View
                  style={[styles.microsoftTile, { backgroundColor: '#00A4EF' }]}
                />
                <View
                  style={[styles.microsoftTile, { backgroundColor: '#FFB900' }]}
                />
              </View>
              <Text style={styles.microsoftText}>
                {microsoftLoading
                  ? 'Opening Microsoft...'
                  : 'Sign in with Microsoft'}
              </Text>
            </TouchableOpacity>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </View>
  );
};

export default LoginScreen;

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: COLORS.bg,
  },
  flex: { flex: 1 },
  scrollContent: {
    flexGrow: 1,
    justifyContent: 'center',
    paddingHorizontal: 20,
    paddingVertical: IS_SHORT_SCREEN ? 12 : 24,
  },

  // Brand / logo
  brand: {
    alignItems: 'center',
    marginBottom: IS_SHORT_SCREEN ? 14 : 22,
  },
  logoWrap: {
    width: IS_SHORT_SCREEN ? 68 : 84,
    height: IS_SHORT_SCREEN ? 68 : 84,
    borderRadius: 999,
    backgroundColor: COLORS.fieldBg,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 10,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  logoImg: {
    width: IS_SHORT_SCREEN ? 44 : 56,
    height: IS_SHORT_SCREEN ? 44 : 56,
  },
  appName: {
    fontSize: IS_SHORT_SCREEN ? 20 : 22,
    fontWeight: '700',
    color: COLORS.dark,
    letterSpacing: 0.2,
  },
  tagline: {
    fontSize: 13,
    color: COLORS.textSecondary,
    marginTop: 4,
  },

  // Card
  card: {
    backgroundColor: COLORS.surface,
    borderRadius: 18,
    padding: IS_SHORT_SCREEN ? 16 : 20,
    width: '100%',
    maxWidth: 420,
    alignSelf: 'center',
    borderWidth: 1,
    borderColor: COLORS.border,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.05,
    shadowRadius: 12,
    elevation: 2,
  },
  welcome: {
    fontSize: 18,
    fontWeight: '700',
    color: COLORS.textPrimary,
    marginBottom: 2,
  },
  welcomeSub: {
    fontSize: 13,
    color: COLORS.textSecondary,
    marginBottom: IS_SHORT_SCREEN ? 12 : 16,
  },

  errorContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.errorBg,
    borderWidth: 1,
    borderColor: COLORS.error,
    borderRadius: 10,
    padding: 10,
    marginBottom: 14,
  },
  errorText: {
    color: COLORS.error,
    fontSize: 13,
    marginLeft: 8,
    flex: 1,
  },

  inputContainer: {
    marginBottom: IS_SHORT_SCREEN ? 10 : 14,
  },
  inputLabel: {
    fontSize: 13,
    fontWeight: '600',
    color: COLORS.textPrimary,
    marginBottom: 6,
  },
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.fieldBg,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: 12,
    paddingHorizontal: 12,
    height: 48,
  },
  inputErrorBorder: {
    borderColor: COLORS.error,
    backgroundColor: COLORS.errorBg,
  },
  input: {
    flex: 1,
    fontSize: 15,
    color: COLORS.textPrimary,
    paddingHorizontal: 10,
    height: '100%',
  },
  eyeButton: {
    padding: 4,
  },
  fieldError: {
    color: COLORS.error,
    fontSize: 12,
    marginTop: 4,
    marginLeft: 2,
  },

  forgotPassword: {
    alignSelf: 'flex-end',
    marginBottom: IS_SHORT_SCREEN ? 12 : 16,
  },
  forgotPasswordText: {
    color: COLORS.dark,
    fontSize: 13,
    fontWeight: '600',
  },

  button: {
    backgroundColor: COLORS.navyblue,
    borderRadius: 12,
    height: 50,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: IS_SHORT_SCREEN ? 12 : 16,
  },
  buttonDisabled: {
    backgroundColor: COLORS.placeholder,
  },
  buttonContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  buttonText: {
    color: COLORS.white,
    fontSize: 15,
    fontWeight: '600',
  },

  dividerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: IS_SHORT_SCREEN ? 12 : 16,
  },
  divider: { flex: 1, height: 1, backgroundColor: COLORS.border },
  dividerText: {
    marginHorizontal: 10,
    color: COLORS.textSecondary,
    fontSize: 12,
  },

  microsoftButton: {
    height: 48,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 4,
    backgroundColor: COLORS.white,
  },
  microsoftText: {
    marginLeft: 10,
    color: COLORS.textPrimary,
    fontSize: 14,
    fontWeight: '600',
  },
  microsoftMark: {
    width: 18,
    height: 18,
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 2,
  },
  microsoftTile: { width: 8, height: 8 },

  footer: {
    alignItems: 'center',
    paddingTop: IS_SHORT_SCREEN ? 12 : 16,
    marginTop: 4,
    borderTopWidth: 1,
    borderTopColor: COLORS.border,
  },
  footerText: {
    fontSize: 13,
    color: COLORS.textSecondary,
    textAlign: 'center',
  },
  link: {
    color: COLORS.dark,
    fontWeight: '700',
  },
});
