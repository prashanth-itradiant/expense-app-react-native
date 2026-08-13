import React from 'react';
import {
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import MaterialIcons from 'react-native-vector-icons/MaterialIcons';
const tiles = [
  ['Clients', 'people-outline', 'Clients'],
  ['Categories', 'sell', 'Categories'],
  ['Departments', 'account-tree', 'Department Management'],
  ['Cost Centers', 'account-balance-wallet', 'Cost Centers'],
  ['Administrative', 'verified-user', 'Administrative'],
];
export default function ManageScreen({ navigation }) {
  return (
    <ScrollView style={s.screen} contentContainerStyle={s.content}>
      <Text style={s.title}>Manage</Text>
      <Text style={s.sub}>Organization master data and access groups</Text>
      <View style={s.grid}>
        {tiles.map(([label, icon, target]) => (
          <TouchableOpacity
            key={label}
            style={s.tile}
            onPress={() => navigation.navigate(target)}
          >
            <View style={s.icon}>
              <MaterialIcons name={icon} size={19} color="#243E78" />
            </View>
            <Text style={s.label}>{label}</Text>
            <Text style={s.hint}>View and manage</Text>
          </TouchableOpacity>
        ))}
      </View>
    </ScrollView>
  );
}
const s = StyleSheet.create({
  screen: { flex: 1, backgroundColor: '#F7F8FB' },
  content: { padding: 14 },
  title: { fontSize: 20, fontWeight: '700', color: '#182033' },
  sub: { fontSize: 11, color: '#7B8498', marginTop: 2, marginBottom: 14 },
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  tile: {
    width: '48%',
    backgroundColor: '#FFF',
    borderWidth: 1,
    borderColor: '#E5E8EF',
    borderRadius: 12,
    padding: 14,
  },
  icon: {
    height: 34,
    width: 34,
    borderRadius: 10,
    backgroundColor: '#EFF3FA',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 10,
  },
  label: { fontSize: 13, fontWeight: '700', color: '#20293A' },
  hint: { fontSize: 10, color: '#8A94A6', marginTop: 3 },
});
