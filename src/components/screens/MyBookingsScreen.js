import { API_URL } from '@env';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import axios from 'axios';
import { useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  FlatList,
  Modal,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import DatePicker from 'react-native-date-picker';
import MaterialIcons from 'react-native-vector-icons/MaterialIcons';
import { openFile } from '../utils/openFile';

/* ---------------- API ---------------- */

const fetchMyBookings = async () => {
  const { data } = await axios.get(`${API_URL}/bookings/my`, {
    withCredentials: true,
  });
  return data?.success ? data.data : [];
};

/* ---------------- SCREEN ---------------- */

export default function MyBookingsScreen({ navigation }) {
  const queryClient = useQueryClient();

  const { data = [], isLoading } = useQuery({
    queryKey: ['bookings', 'my'],
    queryFn: fetchMyBookings,
  });

  /* ---------------- FILTER STATE ---------------- */
  const [search, setSearch] = useState('');

  const [filters, setFilters] = useState({
    status: 'all',
    type: 'all',
    fromDate: null,
    toDate: null,
  });

  const [tempFilters, setTempFilters] = useState(filters);
  const [showFilter, setShowFilter] = useState(false);

  const [openFrom, setOpenFrom] = useState(false);
  const [openTo, setOpenTo] = useState(false);

  /* ---------------- FILTER LOGIC ---------------- */
  const filtered = useMemo(() => {
    return data.filter(b => {
      if (filters.status !== 'all' && b.status !== filters.status) return false;
      if (filters.type !== 'all' && b.type !== filters.type) return false;

      if (search) {
        const t = search.toLowerCase();
        if (
          !b.expenseName?.toLowerCase().includes(t) &&
          !b.purpose?.toLowerCase().includes(t)
        )
          return false;
      }

      if (filters.fromDate && new Date(b.createdAt) < filters.fromDate)
        return false;

      if (filters.toDate) {
        const end = new Date(filters.toDate);
        end.setHours(23, 59, 59, 999);
        if (new Date(b.createdAt) > end) return false;
      }

      return true;
    });
  }, [data, filters, search]);

  /* ---------------- ACTIONS ---------------- */

  const cancelBooking = id => {
    Alert.alert('Cancel Booking', 'Are you sure?', [
      { text: 'No' },
      {
        text: 'Yes',
        style: 'destructive',
        onPress: async () => {
          await axios.put(
            `${API_URL}/bookings/${id}/cancel`,
            {},
            { withCredentials: true },
          );
          queryClient.invalidateQueries(['bookings', 'my']);
        },
      },
    ]);
  };

  /* ---------------- UI ---------------- */

  if (isLoading) {
    return (
      <View style={styles.loader}>
        <ActivityIndicator size="large" color="#2563eb" />
      </View>
    );
  }

  return (
    <View style={{ flex: 1 }}>
      {/* SEARCH + FILTER BAR */}
      <View style={styles.topBar}>
        <View style={styles.searchBox}>
          <MaterialIcons name="search" size={20} color="#6b7280" />
          <TextInput
            placeholder="Search booking..."
            value={search}
            onChangeText={setSearch}
            style={styles.searchInput}
          />
        </View>

        <TouchableOpacity
          style={styles.filterBtn}
          onPress={() => {
            setTempFilters(filters);
            setShowFilter(true);
          }}
        >
          <MaterialIcons name="tune" size={22} color="#2563eb" />
        </TouchableOpacity>
      </View>

      {/* LIST */}
      <FlatList
        data={filtered}
        keyExtractor={item => item._id}
        contentContainerStyle={{ padding: 12 }}
        ListEmptyComponent={<Text style={styles.empty}>No bookings found</Text>}
        renderItem={({ item }) => (
          <View style={styles.card}>
            <View style={styles.header}>
              <Text style={styles.title}>{item.expenseName}</Text>
              <StatusBadge status={item.status} />
            </View>

            <Text style={styles.meta}>{item.type}</Text>

            {item.ticketFile && (
              <TouchableOpacity
                style={styles.ticketBtn}
                onPress={() => openFile(item.ticketFile)}
              >
                <MaterialIcons name="download" size={18} color="#2563eb" />
                <Text style={styles.ticketText}>View Ticket</Text>
              </TouchableOpacity>
            )}

            <View style={styles.actions}>
              <ActionBtn
                icon="visibility"
                label="Details"
                onPress={() =>
                  navigation.navigate('BookingDetails', {
                    id: item._id,
                  })
                }
              />

              {item.status === 'completed' && (
                <ActionBtn
                  icon="receipt-long"
                  label="Create Expense"
                  color="#059669"
                  bg="#d1fae5"
                  onPress={() =>
                    navigation.navigate('Expenses', {
                      screen: 'AddExpense',
                      params: {
                        bookingId: item._id,
                      },
                    })
                  }
                />
              )}

              {item.status === 'pending' && (
                <ActionBtn
                  icon="close"
                  label="Cancel"
                  color="#dc2626"
                  bg="#fee2e2"
                  onPress={() => cancelBooking(item._id)}
                />
              )}
            </View>
          </View>
        )}
      />

      {/* FILTER MODAL (LinkedIn Style) */}
      <Modal visible={showFilter} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <View style={styles.modal}>
            <Text style={styles.modalTitle}>Filters</Text>

            <Text style={styles.modalLabel}>Status</Text>
            <ChipRow
              options={['all', 'pending', 'completed', 'cancelled']}
              value={tempFilters.status}
              onChange={v => setTempFilters({ ...tempFilters, status: v })}
            />

            <Text style={styles.modalLabel}>Type</Text>
            <ChipRow
              options={['all', 'Travel', 'Accommodation', 'Other']}
              value={tempFilters.type}
              onChange={v => setTempFilters({ ...tempFilters, type: v })}
            />

            <View style={styles.dateRow}>
              <DateBtn
                label="From"
                value={tempFilters.fromDate}
                onPress={() => setOpenFrom(true)}
              />
              <DateBtn
                label="To"
                value={tempFilters.toDate}
                onPress={() => setOpenTo(true)}
              />
            </View>

            <View style={styles.modalActions}>
              <TouchableOpacity
                onPress={() =>
                  setTempFilters({
                    status: 'all',
                    type: 'all',
                    fromDate: null,
                    toDate: null,
                  })
                }
              >
                <Text style={styles.clear}>Clear</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.applyBtn}
                onPress={() => {
                  setFilters(tempFilters);
                  setShowFilter(false);
                }}
              >
                <Text style={styles.applyText}>Show results</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* DATE PICKERS */}
      <DatePicker
        modal
        open={openFrom}
        date={tempFilters.fromDate || new Date()}
        mode="date"
        onConfirm={d => {
          setOpenFrom(false);
          setTempFilters({ ...tempFilters, fromDate: d });
        }}
        onCancel={() => setOpenFrom(false)}
      />

      <DatePicker
        modal
        open={openTo}
        date={tempFilters.toDate || new Date()}
        mode="date"
        onConfirm={d => {
          setOpenTo(false);
          setTempFilters({ ...tempFilters, toDate: d });
        }}
        onCancel={() => setOpenTo(false)}
      />
    </View>
  );
}

/* ---------------- REUSABLE UI ---------------- */

const ChipRow = ({ options, value, onChange }) => (
  <View style={styles.chipRow}>
    {options.map(o => (
      <TouchableOpacity
        key={o}
        onPress={() => onChange(o)}
        style={[styles.chip, value === o && styles.chipActive]}
      >
        <Text
          style={{
            color: value === o ? '#fff' : '#374151',
            fontWeight: '600',
          }}
        >
          {o.toUpperCase()}
        </Text>
      </TouchableOpacity>
    ))}
  </View>
);

const StatusBadge = ({ status }) => {
  const map = {
    pending: '#f59e0b',
    completed: '#16a34a',
    cancelled: '#6b7280',
  };
  return (
    <View style={[styles.badge, { backgroundColor: map[status] }]}>
      <Text style={styles.badgeText}>{status?.toUpperCase()}</Text>
    </View>
  );
};

const ActionBtn = ({
  icon,
  label,
  onPress,
  color = '#2563eb',
  bg = '#dbeafe',
}) => (
  <TouchableOpacity
    onPress={onPress}
    style={[styles.actionBtn, { backgroundColor: bg }]}
  >
    <MaterialIcons name={icon} size={18} color={color} />
    <Text style={[styles.actionText, { color }]}>{label}</Text>
  </TouchableOpacity>
);

const DateBtn = ({ label, value, onPress }) => (
  <TouchableOpacity onPress={onPress} style={styles.dateBtn}>
    <MaterialIcons name="calendar-today" size={16} color="#2563eb" />
    <Text style={styles.dateText}>{value ? value.toDateString() : label}</Text>
  </TouchableOpacity>
);

/* ---------------- STYLES ---------------- */

const styles = StyleSheet.create({
  loader: { flex: 1, justifyContent: 'center', alignItems: 'center' },

  topBar: {
    flexDirection: 'row',
    padding: 12,
    gap: 8,
  },

  searchBox: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f1f5f9',
    borderRadius: 12,
    paddingHorizontal: 12,
  },
  searchInput: { flex: 1, padding: 8 },

  filterBtn: {
    width: 44,
    borderRadius: 12,
    backgroundColor: '#e0f2fe',
    alignItems: 'center',
    justifyContent: 'center',
  },

  card: {
    backgroundColor: '#fff',
    padding: 14,
    borderRadius: 14,
    marginBottom: 10,
    elevation: 2,
  },

  header: { flexDirection: 'row', justifyContent: 'space-between' },
  title: { fontSize: 15, fontWeight: '700' },
  meta: { color: '#6b7280', marginVertical: 4 },

  badge: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 20 },
  badgeText: { color: '#fff', fontSize: 12, fontWeight: '700' },

  ticketBtn: { flexDirection: 'row', gap: 6, marginTop: 6 },
  ticketText: { color: '#2563eb', fontWeight: '600' },

  actions: { flexDirection: 'row', gap: 10, marginTop: 10, flexWrap: 'wrap' },

  actionBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    padding: 8,
    borderRadius: 10,
  },
  actionText: { fontWeight: '600' },

  empty: { textAlign: 'center', marginTop: 40, color: '#9ca3af' },

  /* MODAL */
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.4)',
    justifyContent: 'flex-end',
  },
  modal: {
    backgroundColor: '#fff',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    padding: 16,
  },
  modalTitle: { fontSize: 18, fontWeight: '700', marginBottom: 10 },
  modalLabel: { fontSize: 13, fontWeight: '700', marginTop: 10 },

  chipRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginTop: 6 },
  chip: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    backgroundColor: '#e5e7eb',
  },
  chipActive: { backgroundColor: '#2563eb' },

  dateRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 12,
  },
  dateBtn: {
    flexDirection: 'row',
    gap: 6,
    alignItems: 'center',
    padding: 10,
    borderRadius: 10,
    backgroundColor: '#e0f2fe',
  },
  dateText: { color: '#2563eb', fontWeight: '600' },

  modalActions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 20,
    alignItems: 'center',
  },
  clear: { color: '#dc2626', fontWeight: '700' },
  applyBtn: {
    backgroundColor: '#2563eb',
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 10,
  },
  applyText: { color: '#fff', fontWeight: '700' },
});
