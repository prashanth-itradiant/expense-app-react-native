import React, { useCallback, useEffect, useState } from 'react';
import {
  ActivityIndicator,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import MaterialIcons from 'react-native-vector-icons/MaterialIcons';
import api from '../../services/api';
export function LogsHomeScreen({ navigation }) {
  return (
    <ScrollView style={s.screen} contentContainerStyle={s.content}>
      <Text style={s.title}>System logs</Text>
      <Text style={s.sub}>
        Monitor organization activity and sign-in security
      </Text>
      {[
        ['Audit Logs', 'API requests and user actions', 'fact-check'],
        ['Security Logs', 'Authentication and security events', 'security'],
      ].map(([x, d, i]) => (
        <TouchableOpacity
          style={s.homeCard}
          key={x}
          onPress={() => navigation.navigate(x)}
        >
          <View style={s.icon}>
            <MaterialIcons name={i} size={19} color="#243E78" />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={s.name}>{x}</Text>
            <Text style={s.meta}>{d}</Text>
          </View>
          <MaterialIcons name="chevron-right" size={20} color="#929BAC" />
        </TouchableOpacity>
      ))}
    </ScrollView>
  );
}
export default function LogsScreen({ route }) {
  const audit = route.name === 'Audit Logs';
  const [items, setItems] = useState([]),
    [loading, setLoading] = useState(true);
  const load = useCallback(async () => {
    setLoading(true);
    try {
      const { data } = await api.get(audit ? '/logs/audit' : '/logs/security', {
        params: { limit: 30 },
      });
      setItems(data.data || []);
    } finally {
      setLoading(false);
    }
  }, [audit]);
  useEffect(() => {
    load();
  }, [load]);
  return (
    <ScrollView
      style={s.screen}
      contentContainerStyle={s.content}
      refreshControl={<RefreshControl refreshing={loading} onRefresh={load} />}
    >
      <Text style={s.title}>{route.name}</Text>
      <Text style={s.sub}>
        {audit
          ? 'API requests and organization actions'
          : 'Authentication and account events'}
      </Text>
      {loading && !items.length ? (
        <ActivityIndicator />
      ) : (
        items.map(x => (
          <View style={s.card} key={x._id}>
            <View
              style={[
                s.badge,
                {
                  backgroundColor: audit
                    ? x.success
                      ? '#DCFCE7'
                      : '#FFE4E6'
                    : x.severity === 'high'
                    ? '#FFE4E6'
                    : '#FEF3C7',
                },
              ]}
            >
              <Text style={s.badgeText}>
                {audit
                  ? x.success
                    ? 'SUCCESS'
                    : 'FAILED'
                  : (x.severity || 'low').toUpperCase()}
              </Text>
            </View>
            <Text style={s.name}>{x.activity}</Text>
            <Text style={s.meta}>
              {x.userEmail || 'Unknown'} ·{' '}
              {audit ? `${x.method} ${x.path}` : x.description}
            </Text>
            <Text style={s.date}>{new Date(x.createdAt).toLocaleString()}</Text>
          </View>
        ))
      )}
    </ScrollView>
  );
}
const s = StyleSheet.create({
  screen: { flex: 1, backgroundColor: '#F7F8FB' },
  content: { padding: 14 },
  title: { fontSize: 20, fontWeight: '700', color: '#182033' },
  sub: { fontSize: 11, color: '#7B8498', marginTop: 2, marginBottom: 13 },
  homeCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    backgroundColor: '#FFF',
    borderWidth: 1,
    borderColor: '#E5E8EF',
    borderRadius: 12,
    padding: 12,
    marginBottom: 9,
  },
  icon: {
    width: 34,
    height: 34,
    borderRadius: 10,
    backgroundColor: '#EFF3FA',
    alignItems: 'center',
    justifyContent: 'center',
  },
  card: {
    backgroundColor: '#FFF',
    borderWidth: 1,
    borderColor: '#E5E8EF',
    borderRadius: 11,
    padding: 11,
    marginBottom: 8,
  },
  badge: {
    alignSelf: 'flex-start',
    paddingHorizontal: 7,
    paddingVertical: 3,
    borderRadius: 7,
    marginBottom: 7,
  },
  badgeText: { fontSize: 8, fontWeight: '800', color: '#475569' },
  name: { fontSize: 12, fontWeight: '700', color: '#20293A' },
  meta: { fontSize: 10, color: '#687386', marginTop: 3 },
  date: { fontSize: 9, color: '#9AA3B2', marginTop: 6 },
});
