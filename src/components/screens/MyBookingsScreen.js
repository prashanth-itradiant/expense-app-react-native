import { useQuery } from '@tanstack/react-query';
import axios from 'axios';
import React, { useMemo, useState } from 'react';
import {
  ActivityIndicator,
  FlatList,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import MaterialIcons from 'react-native-vector-icons/MaterialIcons';

const fetchMyBookings = async () => {
  const { data } = await axios.get(`${process.env.VITE_API_URL}/bookings/my`, {
    withCredentials: true,
  });
  return data?.success ? data.data : [];
};

export default function MyBookingsScreen({ navigation }) {
  const { data = [], isLoading } = useQuery({
    queryKey: ['bookings', 'my'],
    queryFn: fetchMyBookings,
  });

  const [statusFilter, setStatusFilter] = useState('all');
  const [typeFilter, setTypeFilter] = useState('all');

  /* ---------- FILTER ---------- */
  const filtered = useMemo(() => {
    return data.filter(b => {
      if (statusFilter !== 'all' && b.status !== statusFilter) return false;
      if (typeFilter !== 'all' && b.type !== typeFilter) return false;
      return true;
    });
  }, [data, statusFilter, typeFilter]);

  const statusColor = s => {
    switch (s) {
      case 'pending':
        return '#f59e0b';
      case 'completed':
        return '#16a34a';
      case 'cancelled':
        return '#6b7280';
      default:
        return '#6b7280';
    }
  };

  if (isLoading) {
    return (
      <View style={styles.loader}>
        <ActivityIndicator size="large" color="#2563eb" />
      </View>
    );
  }

  return (
    <View style={{ flex: 1 }}>
      {/* FILTERS */}
      <View style={styles.filters}>
        {['all', 'pending', 'completed', 'cancelled'].map(s => (
          <TouchableOpacity
            key={s}
            onPress={() => setStatusFilter(s)}
            style={[styles.chip, statusFilter === s && styles.chipActive]}
          >
            <Text
              style={{
                color: statusFilter === s ? '#fff' : '#374151',
                fontWeight: '600',
              }}
            >
              {s.toUpperCase()}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      <View style={styles.filters}>
        {['all', 'Travel', 'Accommodation', 'Other'].map(t => (
          <TouchableOpacity
            key={t}
            onPress={() => setTypeFilter(t)}
            style={[styles.chip, typeFilter === t && styles.chipActive]}
          >
            <Text
              style={{
                color: typeFilter === t ? '#fff' : '#374151',
              }}
            >
              {t}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      <FlatList
        contentContainerStyle={{ padding: 16 }}
        data={filtered}
        keyExtractor={item => item._id}
        ListEmptyComponent={<Text style={styles.empty}>No bookings found</Text>}
        renderItem={({ item }) => (
          <View style={styles.card}>
            <View style={styles.header}>
              <Text style={styles.title}>{item.expenseName}</Text>
              <View
                style={[
                  styles.statusBadge,
                  { backgroundColor: statusColor(item.status) },
                ]}
              >
                <Text style={styles.statusText}>
                  {item.status?.toUpperCase()}
                </Text>
              </View>
            </View>

            <Text style={styles.meta}>{item.type}</Text>

            <View style={styles.row}>
              <Text style={styles.label}>Estimated</Text>
              <Text style={styles.value}>₹ {item.estimatedAmount}</Text>
            </View>

            <View style={styles.row}>
              <Text style={styles.label}>Ticket Cost</Text>
              <Text style={styles.value}>
                {item.ticketCost ? `₹ ${item.ticketCost}` : '-'}
              </Text>
            </View>

            <View style={styles.actions}>
              <TouchableOpacity
                onPress={() =>
                  navigation.navigate('BookingDetails', { id: item._id })
                }
                style={styles.actionBtn}
              >
                <MaterialIcons name="visibility" size={18} color="#2563eb" />
                <Text style={styles.actionText}>Details</Text>
              </TouchableOpacity>

              {item.status === 'pending' && (
                <TouchableOpacity
                  onPress={() =>
                    axios.put(
                      `${process.env.VITE_API_URL}/bookings/${item._id}/cancel`,
                      {},
                      { withCredentials: true },
                    )
                  }
                  style={[styles.actionBtn, styles.cancelBtn]}
                >
                  <MaterialIcons name="close" size={18} color="#dc2626" />
                  <Text style={[styles.actionText, { color: '#dc2626' }]}>
                    Cancel
                  </Text>
                </TouchableOpacity>
              )}
            </View>
          </View>
        )}
      />

      {/* ➕ Add Booking FAB */}
      <TouchableOpacity
        style={styles.fab}
        onPress={() => navigation.navigate('AddBooking')}
      >
        <MaterialIcons name="add" size={30} color="#fff" />
      </TouchableOpacity>
    </View>
  );
}

/* ---------- STYLES ---------- */

const styles = StyleSheet.create({
  loader: { flex: 1, justifyContent: 'center', alignItems: 'center' },

  filters: {
    flexDirection: 'row',
    gap: 6,
    paddingHorizontal: 16,
    marginTop: 10,
    flexWrap: 'wrap',
  },

  chip: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    backgroundColor: '#e5e7eb',
  },
  chipActive: { backgroundColor: '#2563eb' },

  card: {
    backgroundColor: '#fff',
    padding: 16,
    borderRadius: 14,
    marginBottom: 12,
    elevation: 2,
  },

  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },

  title: { fontSize: 16, fontWeight: '700' },

  statusBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 20,
  },
  statusText: { color: '#fff', fontSize: 12, fontWeight: '700' },

  meta: { color: '#6b7280', marginVertical: 4 },

  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 6,
  },
  label: { color: '#6b7280' },
  value: { fontWeight: '600' },

  actions: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 12,
  },

  actionBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    padding: 8,
    borderRadius: 10,
    backgroundColor: '#dbeafe',
  },
  cancelBtn: { backgroundColor: '#fee2e2' },

  actionText: { color: '#2563eb', fontWeight: '600' },

  empty: {
    textAlign: 'center',
    marginTop: 40,
    color: '#9ca3af',
  },

  fab: {
    position: 'absolute',
    bottom: 30,
    right: 20,
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: '#2563eb',
    alignItems: 'center',
    justifyContent: 'center',
    elevation: 6,
  },
});
