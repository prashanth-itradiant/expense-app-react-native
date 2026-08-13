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
export default function NotificationsScreen() {
  const [items, setItems] = useState([]),
    [loading, setLoading] = useState(true);
  const load = useCallback(async () => {
    setLoading(true);
    try {
      const { data } = await api.get('/notifications');
      setItems(data.data || []);
    } finally {
      setLoading(false);
    }
  }, []);
  useEffect(() => {
    load();
  }, [load]);
  const read = async x => {
    if (!x.read) {
      await api.patch(`/notifications/${x._id}/read`);
      load();
    }
  };
  const all = async () => {
    await api.patch('/notifications/read-all');
    load();
  };
  const clear = () =>
    Alert.alert('Clear notifications', 'Remove all notifications?', [
      { text: 'Cancel' },
      {
        text: 'Clear',
        style: 'destructive',
        onPress: async () => {
          await api.delete('/notifications/clear');
          load();
        },
      },
    ]);
  return (
    <ScrollView
      style={s.screen}
      contentContainerStyle={s.content}
      refreshControl={<RefreshControl refreshing={loading} onRefresh={load} />}
    >
      <View style={s.head}>
        <View>
          <Text style={s.title}>Notifications</Text>
          <Text style={s.sub}>Updates from your expense workflow</Text>
        </View>
        <View style={s.actions}>
          <TouchableOpacity onPress={all}>
            <MaterialIcons name="done-all" size={19} color="#243E78" />
          </TouchableOpacity>
          <TouchableOpacity onPress={clear}>
            <MaterialIcons name="delete-outline" size={19} color="#BE123C" />
          </TouchableOpacity>
        </View>
      </View>
      {loading && !items.length ? (
        <ActivityIndicator />
      ) : (
        items.map(x => (
          <TouchableOpacity
            key={x._id}
            style={[s.card, !x.read && s.unread]}
            onPress={() => read(x)}
          >
            <View style={s.dot} />
            <View style={{ flex: 1 }}>
              <Text style={s.itemTitle}>{x.title}</Text>
              <Text style={s.message}>{x.message}</Text>
              <Text style={s.date}>
                {new Date(x.createdAt).toLocaleString()}
              </Text>
            </View>
          </TouchableOpacity>
        ))
      )}
      {!loading && !items.length ? (
        <Text style={s.empty}>You're all caught up.</Text>
      ) : null}
    </ScrollView>
  );
}
const s = StyleSheet.create({
  screen: { flex: 1, backgroundColor: '#F7F8FB' },
  content: { padding: 14 },
  head: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  title: { fontSize: 20, fontWeight: '700', color: '#182033' },
  sub: { fontSize: 11, color: '#7B8498', marginTop: 2 },
  actions: { flexDirection: 'row', gap: 14 },
  card: {
    flexDirection: 'row',
    gap: 9,
    backgroundColor: '#FFF',
    borderWidth: 1,
    borderColor: '#E6E9EF',
    borderRadius: 11,
    padding: 11,
    marginBottom: 8,
  },
  unread: { backgroundColor: '#F2F6FC', borderColor: '#C8D4E8' },
  dot: {
    width: 7,
    height: 7,
    borderRadius: 4,
    backgroundColor: '#EA7325',
    marginTop: 5,
  },
  itemTitle: { fontSize: 12, fontWeight: '700', color: '#20293A' },
  message: { fontSize: 11, color: '#657083', lineHeight: 16, marginTop: 2 },
  date: { fontSize: 9, color: '#9AA3B2', marginTop: 5 },
  empty: { fontSize: 12, color: '#8A94A6', textAlign: 'center', marginTop: 40 },
});
