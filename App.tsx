import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import React, { useEffect, useState } from 'react';
import { ActivityIndicator, StyleSheet, View } from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import Toast from 'react-native-toast-message';
import { Provider, useDispatch, useSelector } from 'react-redux';

import AppDrawer from './src/components/Drawer/AppDrawer';
import { fetchUser } from './src/components/redux/authSlice';
import store from './src/components/redux/store';
import LoginScreen from './src/features/auth/LoginScreen';

const Stack = createNativeStackNavigator();
const queryClient = new QueryClient();

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
});

// ✅ App navigator with persistent login
function AppNavigator() {
  const { data: user, loading } = useSelector((state: any) => state.auth);
  const dispatch = useDispatch<any>();
  const [userFetched, setUserFetched] = useState(false);

  useEffect(() => {
    const init = async () => {
      try {
        await dispatch(fetchUser()).unwrap(); // ✅ unwrap fixes TS type issue
      } catch (err) {
        console.error('Fetch user failed', err);
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
          <AppNavigator />
          <Toast />
        </SafeAreaProvider>
      </QueryClientProvider>
    </Provider>
  );
}
