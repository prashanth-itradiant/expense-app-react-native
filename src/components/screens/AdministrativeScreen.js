import React, { useCallback, useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import MaterialIcons from 'react-native-vector-icons/MaterialIcons';
import api from '../../services/api';
export default function AdministrativeScreen() {
  const [group, setGroup] = useState(null),
    [users, setUsers] = useState([]),
    [loading, setLoading] = useState(true);
  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [a, b] = await Promise.all([
        api.get('/admin/administrative-group'),
        api.get('/admin/administrative-candidates'),
      ]);
      setGroup(a.data.data);
      setUsers(b.data.data || []);
    } finally {
      setLoading(false);
    }
  }, []);
  useEffect(() => {
    load();
  }, [load]);
  const ids = new Set((group?.members || []).map(x => (x._id || x).toString()));
  const change = async (u, add) => {
    await api.post(
      add
        ? '/admin/administrative-group/add'
        : '/admin/administrative-group/remove',
      { userId: u._id },
    );
    load();
  };
  return (
    <ScrollView
      style={s.screen}
      contentContainerStyle={s.content}
      refreshControl={<RefreshControl refreshing={loading} onRefresh={load} />}
    >
      <Text style={s.title}>Administrative group</Text>
      <Text style={s.sub}>Members can manage administrative bookings</Text>
      {loading ? (
        <ActivityIndicator />
      ) : (
        users.map(u => {
          const active = ids.has(u._id);
          return (
            <View style={s.card} key={u._id}>
              <View style={{ flex: 1 }}>
                <Text style={s.name}>{u.name}</Text>
                <Text style={s.meta}>
                  {u.email} · {u.role}
                </Text>
              </View>
              <TouchableOpacity
                style={[s.button, active && s.remove]}
                onPress={() => change(u, !active)}
              >
                <Text style={[s.buttonText, active && { color: '#BE123C' }]}>
                  {active ? 'Remove' : 'Add'}
                </Text>
              </TouchableOpacity>
            </View>
          );
        })
      )}
    </ScrollView>
  );
}
const s = StyleSheet.create({
  screen: { flex: 1, backgroundColor: '#F7F8FB' },
  content: { padding: 14 },
  title: { fontSize: 20, fontWeight: '700', color: '#182033' },
  sub: { fontSize: 11, color: '#7B8498', marginTop: 2, marginBottom: 13 },
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFF',
    borderWidth: 1,
    borderColor: '#E5E8EF',
    borderRadius: 11,
    padding: 11,
    marginBottom: 8,
  },
  name: { fontSize: 12, fontWeight: '700', color: '#20293A' },
  meta: { fontSize: 10, color: '#7B8498', marginTop: 2 },
  button: {
    backgroundColor: '#EFF3FA',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 7,
  },
  remove: { backgroundColor: '#FFF1F2' },
  buttonText: { fontSize: 10, fontWeight: '700', color: '#243E78' },
});
