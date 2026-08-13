import { API_URL } from '@env';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import axios from 'axios';
import { useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  FlatList,
  Modal,
  Platform,
  StatusBar,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import DatePicker from 'react-native-date-picker';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import MaterialIcons from 'react-native-vector-icons/MaterialIcons';
import { openFile } from '../utils/openFile';

/* ---------------- theme (white + navy) ---------------- */

const NAVY = {
  primary: '#0B1F45',
  primaryLight: '#12295E',
  bg: '#F5F6F8',
  surface: '#FFFFFF',
  border: '#E1E4EA',
  fieldBg: '#F0F2F5',
  accentBg: '#EEF1F8',
  textPrimary: '#111827',
  textSecondary: '#6B7280',
  inactive: '#9AA1AC',
  success: '#0F8A5F',
  successBg: '#DCFCE7',
  warning: '#B45309',
  warningBg: '#FEF3C7',
  error: '#DC2626',
  errorBg: '#FEE2E2',
  cancelled: '#6B7280',
  cancelledBg: '#F3F4F6',
};

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
  const insets = useSafeAreaInsets();

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
      <View
        style={[
          styles.loader,
          { paddingTop: insets.top, paddingBottom: insets.bottom },
        ]}
      >
        <StatusBar
          barStyle="dark-content"
          backgroundColor={NAVY.bg}
          translucent={Platform.OS === 'android'}
        />
        <ActivityIndicator size="large" color={NAVY.primary} />
      </View>
    );
  }

  return (
    <View
      style={[
        styles.root,
        { paddingTop: insets.top, paddingBottom: insets.bottom },
      ]}
    >
      <StatusBar
        barStyle="dark-content"
        backgroundColor={NAVY.surface}
        translucent={Platform.OS === 'android'}
      />

      {/* SEARCH + FILTER BAR */}
      <View style={styles.topBar}>
        <View style={styles.searchBox}>
          <MaterialIcons name="search" size={18} color={NAVY.inactive} />
          <TextInput
            placeholder="Search booking..."
            placeholderTextColor={NAVY.inactive}
            value={search}
            onChangeText={setSearch}
            style={styles.searchInput}
          />
        </View>

        <TouchableOpacity
          style={styles.filterBtn}
          activeOpacity={0.8}
          onPress={() => {
            setTempFilters(filters);
            setShowFilter(true);
          }}
        >
          <MaterialIcons name="tune" size={20} color={NAVY.primary} />
        </TouchableOpacity>
      </View>

      {/* LIST */}
      <FlatList
        data={filtered}
        keyExtractor={item => item._id}
        contentContainerStyle={{
          padding: 12,
          paddingTop: 4,
          paddingBottom: 20,
        }}
        showsVerticalScrollIndicator={false}
        ListEmptyComponent={
          <View style={styles.emptyWrap}>
            <MaterialIcons name="search-off" size={34} color={NAVY.inactive} />
            <Text style={styles.empty}>No bookings found</Text>
          </View>
        }
        renderItem={({ item }) => (
          <View style={styles.card}>
            <View style={styles.header}>
              <Text style={styles.title} numberOfLines={1}>
                {item.expenseName}
              </Text>
              <StatusBadge status={item.status} />
            </View>

            <Text style={styles.meta}>{item.type}</Text>

            {item.ticketFile && (
              <TouchableOpacity
                style={styles.ticketBtn}
                activeOpacity={0.7}
                onPress={() => openFile(item.ticketFile)}
              >
                <MaterialIcons name="download" size={16} color={NAVY.primary} />
                <Text style={styles.ticketText}>View Ticket</Text>
              </TouchableOpacity>
            )}

            <View style={styles.actions}>
              <ActionBtn
                icon="visibility"
                label="Details"
                color={NAVY.primary}
                bg={NAVY.accentBg}
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
                  color={NAVY.success}
                  bg={NAVY.successBg}
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
                  color={NAVY.error}
                  bg={NAVY.errorBg}
                  onPress={() => cancelBooking(item._id)}
                />
              )}
            </View>
          </View>
        )}
      />

      {/* FILTER MODAL */}
      <Modal visible={showFilter} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <View
            style={[
              styles.modal,
              { paddingBottom: Math.max(insets.bottom, 14) },
            ]}
          >
            <View style={styles.modalHandle} />
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
                activeOpacity={0.85}
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
            color: value === o ? '#fff' : NAVY.textSecondary,
            fontWeight: '600',
            fontSize: 12,
          }}
        >
          {o.toUpperCase()}
        </Text>
      </TouchableOpacity>
    ))}
  </View>
);

const STATUS_COLORS = {
  pending: { bg: NAVY.warningBg, text: NAVY.warning },
  completed: { bg: NAVY.successBg, text: NAVY.success },
  cancelled: { bg: NAVY.cancelledBg, text: NAVY.cancelled },
};

const StatusBadge = ({ status }) => {
  const c = STATUS_COLORS[status] || STATUS_COLORS.cancelled;
  return (
    <View style={[styles.badge, { backgroundColor: c.bg }]}>
      <Text style={[styles.badgeText, { color: c.text }]}>
        {status?.toUpperCase()}
      </Text>
    </View>
  );
};

const ActionBtn = ({
  icon,
  label,
  onPress,
  color = NAVY.primary,
  bg = NAVY.accentBg,
}) => (
  <TouchableOpacity
    onPress={onPress}
    activeOpacity={0.75}
    style={[styles.actionBtn, { backgroundColor: bg }]}
  >
    <MaterialIcons name={icon} size={16} color={color} />
    <Text style={[styles.actionText, { color }]}>{label}</Text>
  </TouchableOpacity>
);

const DateBtn = ({ label, value, onPress }) => (
  <TouchableOpacity
    onPress={onPress}
    style={styles.dateBtn}
    activeOpacity={0.8}
  >
    <MaterialIcons name="calendar-today" size={14} color={NAVY.primary} />
    <Text style={styles.dateText}>{value ? value.toDateString() : label}</Text>
  </TouchableOpacity>
);

/* ---------------- STYLES ---------------- */

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: NAVY.bg },
  loader: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: NAVY.bg,
  },

  topBar: {
    flexDirection: 'row',
    padding: 12,
    paddingBottom: 8,
    gap: 8,
    backgroundColor: NAVY.surface,
    borderBottomWidth: 1,
    borderBottomColor: NAVY.border,
  },

  searchBox: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: NAVY.fieldBg,
    borderRadius: 10,
    paddingHorizontal: 12,
    borderWidth: 1,
    borderColor: NAVY.border,
  },
  searchInput: {
    flex: 1,
    paddingVertical: 9,
    marginLeft: 6,
    fontSize: 14,
    color: NAVY.textPrimary,
  },

  filterBtn: {
    width: 42,
    borderRadius: 10,
    backgroundColor: NAVY.accentBg,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: NAVY.border,
  },

  card: {
    backgroundColor: NAVY.surface,
    padding: 12,
    borderRadius: 12,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: NAVY.border,
  },

  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: 8,
  },
  title: { fontSize: 14, fontWeight: '700', color: NAVY.textPrimary, flex: 1 },
  meta: { color: NAVY.textSecondary, fontSize: 12.5, marginVertical: 4 },

  badge: { paddingHorizontal: 9, paddingVertical: 3, borderRadius: 12 },
  badgeText: { fontSize: 11, fontWeight: '700' },

  ticketBtn: {
    flexDirection: 'row',
    gap: 5,
    marginTop: 4,
    alignItems: 'center',
  },
  ticketText: { color: NAVY.primary, fontWeight: '600', fontSize: 12.5 },

  actions: { flexDirection: 'row', gap: 8, marginTop: 8, flexWrap: 'wrap' },

  actionBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingVertical: 7,
    paddingHorizontal: 9,
    borderRadius: 9,
  },
  actionText: { fontWeight: '600', fontSize: 12.5 },

  emptyWrap: { alignItems: 'center', marginTop: 60, gap: 8 },
  empty: { color: NAVY.inactive, fontSize: 13 },

  /* MODAL */
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(11,31,69,0.45)',
    justifyContent: 'flex-end',
  },
  modal: {
    backgroundColor: NAVY.surface,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    padding: 16,
  },
  modalHandle: {
    width: 36,
    height: 4,
    borderRadius: 2,
    backgroundColor: NAVY.border,
    alignSelf: 'center',
    marginBottom: 10,
  },
  modalTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: NAVY.textPrimary,
    marginBottom: 8,
  },
  modalLabel: {
    fontSize: 12.5,
    fontWeight: '700',
    color: NAVY.textSecondary,
    marginTop: 10,
  },

  chipRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 7, marginTop: 6 },
  chip: {
    paddingHorizontal: 11,
    paddingVertical: 6,
    borderRadius: 12,
    backgroundColor: NAVY.fieldBg,
    borderWidth: 1,
    borderColor: NAVY.border,
  },
  chipActive: { backgroundColor: NAVY.primary, borderColor: NAVY.primary },

  dateRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 12,
    gap: 8,
  },
  dateBtn: {
    flex: 1,
    flexDirection: 'row',
    gap: 5,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 9,
    borderRadius: 9,
    backgroundColor: NAVY.accentBg,
    borderWidth: 1,
    borderColor: NAVY.border,
  },
  dateText: { color: NAVY.primary, fontWeight: '600', fontSize: 12.5 },

  modalActions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 16,
    alignItems: 'center',
  },
  clear: { color: NAVY.error, fontWeight: '700', fontSize: 13.5 },
  applyBtn: {
    backgroundColor: NAVY.primary,
    paddingHorizontal: 16,
    paddingVertical: 11,
    borderRadius: 10,
  },
  applyText: { color: '#fff', fontWeight: '700', fontSize: 13.5 },
});
