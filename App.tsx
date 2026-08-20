import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import React, { useEffect, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Linking,
  StatusBar,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import MaterialIcons from 'react-native-vector-icons/MaterialIcons';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import Toast from 'react-native-toast-message';
import { Provider, useDispatch, useSelector } from 'react-redux';

import AppDrawer from './src/components/Drawer/AppDrawer';
import {
  completeMicrosoftLogin,
  fetchUser,
} from './src/components/redux/authSlice';
import './src/services/api';
import store from './src/components/redux/store';
import LoginScreen from './src/features/auth/LoginScreen';

const Stack = createNativeStackNavigator();
const queryClient = new QueryClient();

function AppToast({ type, text1, text2, hide }: any) {
  const isError = type === 'error';
  const color = isError ? '#B42318' : '#087443';
  const backgroundColor = isError ? '#FFF1F0' : '#ECFDF3';
  const icon = isError ? 'error-outline' : 'check-circle-outline';

  return (
    <View style={[styles.appToast, { borderLeftColor: color }]}>
      <View style={[styles.appToastIcon, { backgroundColor }]}>
        <MaterialIcons name={icon} size={22} color={color} />
      </View>
      <View style={styles.appToastContent}>
        <Text style={styles.appToastTitle} numberOfLines={2}>
          {text1}
        </Text>
        {!!text2 && (
          <Text style={styles.appToastMessage} numberOfLines={3}>
            {text2}
          </Text>
        )}
      </View>
      <TouchableOpacity
        accessibilityLabel="Close notification"
        hitSlop={10}
        onPress={hide}
        style={styles.appToastClose}
      >
        <MaterialIcons name="close" size={20} color="#64748B" />
      </TouchableOpacity>
    </View>
  );
}

const toastConfig = {
  success: props => <AppToast {...props} type="success" />,
  error: props => <AppToast {...props} type="error" />,
  info: props => <AppToast {...props} type="info" />,
  logoutConfirm: ({ props }: any) => (
    <View style={styles.logoutToast}>
      <View style={styles.logoutToastIcon}>
        <Text style={styles.logoutToastIconText}>?</Text>
      </View>
      <View style={styles.logoutToastContent}>
        <Text style={styles.logoutToastTitle}>Confirm logout</Text>
        <Text style={styles.logoutToastMessage}>
          Are you sure you want to sign out?
        </Text>
        <View style={styles.logoutToastActions}>
          <TouchableOpacity
            style={styles.stayButton}
            onPress={() => Toast.hide()}
          >
            <Text style={styles.stayButtonText}>Stay</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.confirmLogoutButton}
            onPress={props.onConfirm}
          >
            <Text style={styles.confirmLogoutText}>Logout</Text>
          </TouchableOpacity>
        </View>
      </View>
    </View>
  ),
};

// ✅ Simple mobile loader
function Loader() {
  return (
    <View style={styles.loaderContainer}>
      <ActivityIndicator size="large" color="#007bff" />
    </View>
  );
}

const styles = StyleSheet.create({
  loaderContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  logoutToast: {
    width: '92%',
    flexDirection: 'row',
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 14,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    shadowColor: '#0F172A',
    shadowOffset: { width: 0, height: 5 },
    shadowOpacity: 0.18,
    shadowRadius: 12,
    elevation: 8,
  },
  appToast: {
    width: '92%',
    minHeight: 68,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    borderLeftWidth: 4,
    paddingVertical: 12,
    paddingHorizontal: 12,
    shadowColor: '#0F172A',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.16,
    shadowRadius: 10,
    elevation: 7,
  },
  appToastIcon: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 10,
  },
  appToastContent: { flex: 1, paddingRight: 8 },
  appToastTitle: { color: '#172033', fontSize: 15, fontWeight: '700' },
  appToastMessage: { color: '#64748B', fontSize: 12, marginTop: 3 },
  appToastClose: { padding: 4 },
  logoutToastIcon: {
    width: 38,
    height: 38,
    borderRadius: 19,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FFF1F2',
    marginRight: 12,
  },
  logoutToastIconText: { color: '#BE123C', fontSize: 20, fontWeight: '800' },
  logoutToastContent: { flex: 1 },
  logoutToastTitle: { color: '#172033', fontSize: 15, fontWeight: '700' },
  logoutToastMessage: { color: '#64748B', fontSize: 12, marginTop: 3 },
  logoutToastActions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    marginTop: 12,
    gap: 8,
  },
  stayButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 9,
    backgroundColor: '#F1F5F9',
  },
  stayButtonText: { color: '#475569', fontSize: 12, fontWeight: '700' },
  confirmLogoutButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 9,
    backgroundColor: '#BE123C',
  },
  confirmLogoutText: { color: '#FFFFFF', fontSize: 12, fontWeight: '700' },
});

// ✅ App navigator with persistent login
function AppNavigator() {
  const { data: user, loading } = useSelector((state: any) => state.auth);
  const dispatch = useDispatch<any>();
  const [userFetched, setUserFetched] = useState(false);
  const handledMicrosoftCodes = useRef(new Set<string>());

  useEffect(() => {
    const handleUrl = async ({ url }: { url: string }) => {
      const query = url.split('?')[1] || '';
      const params = new URLSearchParams(query);
      const code = params.get('code');
      const error = params.get('error');
      if (error) {
        const messages: Record<string, string> = {
          invalid_state: 'Microsoft session expired. Please try again.',
          azure_denied: 'Microsoft sign-in was cancelled or denied.',
          token_exchange_failed:
            'Azure token exchange failed. Check the registered redirect URI.',
          graph_profile_failed: 'Could not read your Microsoft profile.',
          no_organization:
            'Your email domain is not linked to an ExpenseDesk organization.',
          account_deactivated: 'Your ExpenseDesk account is deactivated.',
          not_configured: 'Microsoft login is not configured on the backend.',
          unexpected_error: 'Microsoft login failed unexpectedly.',
          connection_test:
            'Deep link is working. Please try Microsoft login again.',
        };
        Toast.show({
          type: error === 'connection_test' ? 'success' : 'error',
          text1:
            error === 'connection_test'
              ? 'Connection ready'
              : 'Microsoft sign-in failed',
          text2: messages[error] || error,
        });
        return;
      }
      if (code) {
        if (handledMicrosoftCodes.current.has(code)) return;
        handledMicrosoftCodes.current.add(code);
        const result = await dispatch(completeMicrosoftLogin(code as any));
        if (completeMicrosoftLogin.rejected.match(result)) {
          handledMicrosoftCodes.current.delete(code);
          Toast.show({
            type: 'error',
            text1: 'Microsoft sign-in failed',
            text2: String(result.payload),
          });
        } else {
          Toast.show({
            type: 'success',
            text1: 'Signed in with Microsoft',
          });
        }
      }
    };
    const subscription = Linking.addEventListener('url', handleUrl);
    Linking.getInitialURL().then(url => {
      if (url) handleUrl({ url });
    });
    return () => subscription.remove();
  }, [dispatch]);
  useEffect(() => {
    const init = async () => {
      try {
        await dispatch(fetchUser()).unwrap(); // ✅ unwrap fixes TS type issue
      } catch (err) {
        console.error('Fetch user failed', err);
        if (err === 'OFFLINE') {
          Toast.show({
            type: 'error',
            text1: 'You are offline',
            text2: 'Unable to get data. Check your internet connection.',
          });
        }
      } finally {
        setUserFetched(true);
      }
    };
    init();
  }, [dispatch]);

  if (loading || !userFetched) return <Loader />;

  return (
    <NavigationContainer>
      <Stack.Navigator screenOptions={{ headerShown: false }}>
        {user ? (
          <Stack.Screen name="MainApp" component={AppDrawer} />
        ) : (
          <Stack.Screen name="Login" component={LoginScreen} />
        )}
      </Stack.Navigator>
    </NavigationContainer>
  );
}

export default function App() {
  return (
    <Provider store={store}>
      <QueryClientProvider client={queryClient}>
        <SafeAreaProvider>
          <StatusBar barStyle="light-content" backgroundColor="#18264A" />
          <AppNavigator />
          <Toast config={toastConfig} visibilityTime={3000} />
        </SafeAreaProvider>
      </QueryClientProvider>
    </Provider>
  );
}
