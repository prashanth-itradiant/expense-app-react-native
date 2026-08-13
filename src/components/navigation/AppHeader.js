import React from 'react';
import { Image, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import MaterialIcons from 'react-native-vector-icons/MaterialIcons';
import { useNavigation } from '@react-navigation/native';
import { useSelector } from 'react-redux';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
const logo = require('../../assets/favicon.png');
export default function AppHeader({ title, showBack = false }) {
  const navigation = useNavigation();
  const user = useSelector(s => s.auth.data);
  const insets = useSafeAreaInsets();
  const unread = 0;
  return (
    <View style={[s.bar, { height: 52 + insets.top, paddingTop: insets.top }]}>
      <TouchableOpacity
        style={s.navButton}
        onPress={() =>
          showBack ? navigation.goBack() : navigation.toggleDrawer()
        }
      >
        <MaterialIcons
          name={showBack ? 'arrow-back' : 'menu'}
          size={20}
          color="#243E78"
        />
      </TouchableOpacity>
      <Image source={logo} style={s.logo} resizeMode="contain" />
      <View style={s.titleWrap}>
        <Text style={s.product}>Expense Portal</Text>
        <Text style={s.title} numberOfLines={1}>
          {title}
        </Text>
      </View>
      <TouchableOpacity
        style={s.action}
        onPress={() => navigation.getParent()?.navigate('Notifications')}
      >
        <MaterialIcons name="notifications-none" size={20} color="#536078" />
        {unread > 0 && <View style={s.badge} />}
      </TouchableOpacity>
      <TouchableOpacity
        style={s.avatar}
        onPress={() => navigation.getParent()?.navigate('Profile')}
      >
        <Text style={s.initial}>{user?.name?.[0]?.toUpperCase() || 'U'}</Text>
      </TouchableOpacity>
    </View>
  );
}
const s = StyleSheet.create({
  bar: {
    height: 52,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E5E8EF',
    paddingHorizontal: 8,
  },
  navButton: {
    width: 36,
    height: 36,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 10,
  },
  logo: { width: 28, height: 28, borderRadius: 7, marginLeft: 1 },
  titleWrap: { flex: 1, marginLeft: 8 },
  product: { fontSize: 9, color: '#929BAC', lineHeight: 11 },
  title: { fontSize: 13, fontWeight: '700', color: '#182033', lineHeight: 17 },
  action: {
    width: 34,
    height: 34,
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
  },
  badge: {
    position: 'absolute',
    right: 6,
    top: 5,
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#E11D48',
  },
  avatar: {
    width: 29,
    height: 29,
    borderRadius: 10,
    backgroundColor: '#182B59',
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: 2,
  },
  initial: { fontSize: 10, fontWeight: '800', color: '#FFF' },
});
