import { API_URL, VITE_IMAGE_URL } from '@env';
import {
  DrawerContentScrollView,
  DrawerItemList,
} from '@react-navigation/drawer';
import { useQueryClient } from '@tanstack/react-query';
import axios from 'axios';
import React, { useState } from 'react';
import {
  ActivityIndicator,
  Image,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import MaterialIcons from 'react-native-vector-icons/MaterialIcons';
import Toast from 'react-native-toast-message';
import { useDispatch, useSelector } from 'react-redux';
import { logout } from '../redux/authSlice';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
const brandLogo = require('../../assets/favicon.png');
export default function CustomDrawerContent(props) {
  const insets = useSafeAreaInsets();
  const user = useSelector(s => s.auth.data),
    role = useSelector(s => s.auth.role);
  const dispatch = useDispatch(),
    queryClient = useQueryClient();
  const [loggingOut, setLoggingOut] = useState(false);
  const quick = !['admin', 'superadmin'].includes(role);
  const go = (screen, params) => {
    props.navigation.navigate(screen, params);
    props.navigation.closeDrawer();
  };
  const handleLogout = async () => {
    if (loggingOut) return;
    setLoggingOut(true);
    try {
      await axios.post(
        `${API_URL}/users/logout`,
        {},
        { withCredentials: true },
      );
    } catch {
      // Always clear the local session if the server is unavailable.
    } finally {
      queryClient.clear();
      dispatch(logout());
      Toast.show({
        type: 'success',
        text1: 'Logged out',
        text2: 'You have been signed out successfully.',
        visibilityTime: 2200,
      });
    }
  };
  const requestLogout = () => {
    if (loggingOut) return;
    Toast.show({
      type: 'logoutConfirm',
      position: 'top',
      autoHide: false,
      topOffset: insets.top + 12,
      props: {
        onConfirm: () => {
          Toast.hide();
          handleLogout();
        },
      },
    });
  };
  return (
    <View
      style={[s.root, { paddingTop: insets.top, paddingBottom: insets.bottom }]}
    >
      <View style={s.brand}>
        <Image source={brandLogo} style={s.logo} resizeMode="contain" />
        <View>
          <Text style={s.brandTitle}>Expense Portal</Text>
          <Text style={s.brandSub}>Mobile workspace</Text>
        </View>
      </View>
      <View style={s.user}>
        {user?.profilePic ? (
          <Image
            source={{ uri: `${VITE_IMAGE_URL}/profilePics/${user.profilePic}` }}
            style={s.avatar}
          />
        ) : (
          <View style={s.avatarFallback}>
            <Text style={s.initial}>{user?.name?.[0] || 'U'}</Text>
          </View>
        )}
        <View style={s.userDetails}>
          <Text style={s.name} numberOfLines={1}>
            {user?.name || 'User'}
          </Text>
          <Text style={s.role}>{role}</Text>
        </View>
      </View>
      <DrawerContentScrollView {...props} contentContainerStyle={s.scroll}>
        <DrawerItemList {...props} />
        {quick && (
          <View style={s.quick}>
            <Text style={s.quickTitle}>QUICK ACTIONS</Text>
            <TouchableOpacity style={s.quickRow} onPress={() => go('Home')}>
              <MaterialIcons name="note-add" size={17} color="#536078" />
              <Text style={s.quickText}>Create Expense</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={s.quickRow}
              onPress={() => go('Bookings', { screen: 'AddBooking' })}
            >
              <MaterialIcons name="flight-takeoff" size={17} color="#536078" />
              <Text style={s.quickText}>New Booking</Text>
            </TouchableOpacity>
          </View>
        )}
      </DrawerContentScrollView>
      <View style={s.footer}>
        <TouchableOpacity style={s.profile} onPress={() => go('Profile')}>
          <MaterialIcons name="person-outline" size={18} color="#536078" />
          <Text style={s.footerText}>Account</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[s.logout, loggingOut && s.logoutDisabled]}
          onPress={requestLogout}
          disabled={loggingOut}
        >
          {loggingOut ? (
            <ActivityIndicator size="small" color="#BE123C" />
          ) : (
            <MaterialIcons name="logout" size={18} color="#BE123C" />
          )}
          <Text style={s.logoutText}>
            {loggingOut ? 'Logging out...' : 'Logout'}
          </Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}
const s = StyleSheet.create({
  root: { flex: 1, backgroundColor: '#FFF' },
  brand: {
    height: 58,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 9,
    paddingHorizontal: 13,
    borderBottomWidth: 1,
    borderBottomColor: '#E9ECF1',
  },
  logo: { width: 30, height: 30, borderRadius: 8 },
  brandTitle: { fontSize: 13, fontWeight: '700', color: '#182033' },
  brandSub: { fontSize: 9, color: '#919AAA' },
  user: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 9,
    padding: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#EEF0F4',
  },
  userDetails: { flex: 1 },
  avatar: { width: 36, height: 36, borderRadius: 11 },
  avatarFallback: {
    width: 36,
    height: 36,
    borderRadius: 11,
    backgroundColor: '#E8EEF8',
    alignItems: 'center',
    justifyContent: 'center',
  },
  initial: { fontSize: 14, fontWeight: '700', color: '#243E78' },
  name: { fontSize: 12, fontWeight: '700', color: '#20293A' },
  role: {
    fontSize: 9,
    color: '#8A94A6',
    textTransform: 'capitalize',
    marginTop: 2,
  },
  scroll: { paddingTop: 6 },
  quick: { marginTop: 10, paddingHorizontal: 12 },
  quickTitle: {
    fontSize: 8,
    color: '#9AA3B2',
    letterSpacing: 0.8,
    marginBottom: 3,
  },
  quickRow: {
    height: 32,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 8,
    borderRadius: 8,
  },
  quickText: { fontSize: 12, color: '#536078' },
  footer: { borderTopWidth: 1, borderTopColor: '#E9ECF1', padding: 9 },
  profile: {
    height: 38,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingHorizontal: 9,
  },
  logout: {
    height: 38,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingHorizontal: 9,
  },
  footerText: { fontSize: 11, color: '#536078' },
  logoutText: { fontSize: 11, color: '#BE123C', fontWeight: '600' },
  logoutDisabled: { opacity: 0.65 },
});
