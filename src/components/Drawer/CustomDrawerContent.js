import { API_URL, VITE_IMAGE_URL } from '@env';
import {
  DrawerContentScrollView,
  DrawerItemList,
} from '@react-navigation/drawer';
import { useQueryClient } from '@tanstack/react-query';
import axios from 'axios';
import { Image, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useDispatch, useSelector } from 'react-redux';
import { logout } from '../redux/authSlice';
import { PRIMARY_COLOR } from '../theme/theme';

export default function CustomDrawerContent(props) {
  const { data: user } = useSelector(state => state.auth);
  const dispatch = useDispatch();
  const queryClient = useQueryClient();

  const handleLogout = async () => {
    try {
      await axios.post(
        `${API_URL}/users/logout`,
        {},
        { withCredentials: true },
      );

      queryClient.clear();
      // Clear redux
      dispatch(logout());

      // Navigate to Login
      props.navigation.closeDrawer();
      setTimeout(() => {
        props.navigation.getParent()?.reset({
          index: 0,
          routes: [{ name: 'Login' }],
        });
      }, 200);
    } catch (error) {
      console.error('Logout failed', error);
    }
  };

  return (
    <View style={{ flex: 1 }}>
      {/* Top section with user info */}
      <View style={styles.header}>
        {user?.profilePic ? (
          <Image
            source={{ uri: `${VITE_IMAGE_URL}/profilePics/${user.profilePic}` }}
            style={styles.profileImage}
          />
        ) : (
          <View style={styles.placeholder}>
            <Text style={styles.placeholderText}>
              {user?.name ? user.name[0] : 'G'}
            </Text>
          </View>
        )}

        <Text style={styles.name}>{user?.name || 'Guest User'}</Text>
        <Text style={styles.email}>{user?.email || 'guest@example.com'}</Text>
      </View>

      {/* Drawer Items */}
      <DrawerContentScrollView {...props}>
        <DrawerItemList {...props} />
      </DrawerContentScrollView>

      {/* Logout Button */}
      <View style={styles.footer}>
        <TouchableOpacity style={styles.logoutBtn} onPress={handleLogout}>
          <Text style={styles.logoutText}>Logout</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  header: {
    backgroundColor: PRIMARY_COLOR,
    paddingVertical: 30,
    paddingHorizontal: 15,
    alignItems: 'center',
  },
  profileImage: {
    width: 60,
    height: 60,
    borderRadius: 30,
    borderWidth: 2,
    borderColor: '#fff',
  },
  placeholder: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: '#ddd',
    alignItems: 'center',
    justifyContent: 'center',
  },
  placeholderText: {
    color: '#555',
    fontSize: 24,
    fontWeight: 'bold',
  },
  name: {
    color: '#fff',
    fontSize: 18,
    fontWeight: '600',
    marginTop: 8,
  },
  email: {
    color: '#e2e8f0',
    fontSize: 14,
  },
  footer: {
    borderTopWidth: 1,
    borderTopColor: '#e2e8f0',
    padding: 15,
  },
  logoutBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: PRIMARY_COLOR,
    padding: 10,
    borderRadius: 6,
    justifyContent: 'center',
  },
  logoutText: {
    color: '#fff',
    marginLeft: 8,
    fontSize: 16,
  },
});
