import { pick, types } from '@react-native-documents/picker';
import { useNavigation } from '@react-navigation/native';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import axios from 'axios';
import React, { useMemo, useState } from 'react';
import {
  ActivityIndicator,
  FlatList,
  Platform,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import Toast from 'react-native-toast-message';
import MaterialIcons from 'react-native-vector-icons/MaterialIcons';

const fetchFinanceBookings = async () => {
  const { data } = await axios.get(
    `${process.env.VITE_API_URL}/bookings/finance/pending`,
    { withCredentials: true },
  );
  return data?.success ? data.data : [];
};

export default function FinanceBookingsScreen() {
  const navigation = useNavigation();
  const qc = useQueryClient();

  const { data = [], isLoading } = useQuery({
    queryKey: ['bookings', 'finance', 'pending'],
    queryFn: fetchFinanceBookings,
  });

  const [expandedId, setExpandedId] = useState(null);
  const [ticketCostById, setTicketCostById] = useState({});
  const [ticketFileById, setTicketFileById] = useState({});
  const [statusFilter, setStatusFilter] = useState('all');
  const [typeFilter, setTypeFilter] = useState('all');
  const [search, setSearch] = useState('');

  /* ---------------- FILTER ---------------- */

  const filtered = useMemo(() => {
    let list = [...data];

    if (statusFilter !== 'all') {
      list = list.filter(b => b.status === statusFilter);
    }

    if (typeFilter !== 'all') {
      list = list.filter(b => b.type === typeFilter);
    }

    if (search.trim()) {
      const t = search.toLowerCase();
      list = list.filter(
        b =>
          b.employee?.name?.toLowerCase().includes(t) ||
          b.expenseName?.toLowerCase().includes(t),
      );
    }

    return list;
  }, [data, statusFilter, typeFilter, search]);

  /* ---------------- FILE PICKER ---------------- */

  const pickTicketFile = async bookingId => {
    try {
      const res = await pick({ type: [types.allFiles] });
      const file = res[0];

      setTicketFileById(p => ({
        ...p,
        [bookingId]: {
          uri: file.uri,
          type: file.type || 'application/pdf',
          name: file.name || file.fileName || `ticket-${Date.now()}.pdf`,
        },
      }));
    } catch (e) {
      if (e?.code !== 'CANCELLED') {
        Toast.show({ type: 'error', text1: 'File selection failed' });
      }
    }
  };

  /* ---------------- UPLOAD TICKET ---------------- */

  const uploadMutation = useMutation({
    mutationFn: async ({ bookingId }) => {
      const file = ticketFileById[bookingId];

      const fd = new FormData();
      fd.append('ticketCost', ticketCostById[bookingId]);

      fd.append('ticketFile', {
        uri:
          Platform.OS === 'android'
            ? file.uri
            : file.uri.replace('file://', ''),
        type: file.type,
        name: file.name,
      });

      return axios.put(
        `${process.env.VITE_API_URL}/bookings/${bookingId}/upload-ticket`,
        fd,
        {
          withCredentials: true,
          headers: { 'Content-Type': 'multipart/form-data' },
        },
      );
    },
    onSuccess: () => {
      Toast.show({ type: 'success', text1: 'Ticket uploaded successfully' });
      setExpandedId(null);
      qc.invalidateQueries(['bookings', 'finance', 'pending']);
    },
    onError: err => {
      Toast.show({
        type: 'error',
        text1: err?.response?.data?.message || 'Upload failed',
      });
    },
  });

  const submitTicket = id => {
    if (!ticketCostById[id]) {
      Toast.show({ type: 'error', text1: 'Ticket cost is required' });
      return;
    }
    if (!ticketFileById[id]) {
      Toast.show({ type: 'error', text1: 'Ticket file is required' });
      return;
    }
    uploadMutation.mutate({ bookingId: id });
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
    <FlatList
      data={filtered}
      keyExtractor={item => item._id}
      contentContainerStyle={{ padding: 16 }}
      ListHeaderComponent={
        <>
          <Text style={styles.title}>Finance – Booking Approvals</Text>

          {/* Status Tabs */}
          <View style={styles.tabs}>
            {['all', 'pending', 'completed', 'cancelled'].map(s => (
              <TouchableOpacity
                key={s}
                onPress={() => setStatusFilter(s)}
                style={[styles.tab, statusFilter === s && styles.tabActive]}
              >
                <Text
                  style={{ color: statusFilter === s ? '#fff' : '#374151' }}
                >
                  {s.toUpperCase()}
                </Text>
              </TouchableOpacity>
            ))}
          </View>

          {/* Search */}
          <TextInput
            placeholder="Search employee or booking name"
            value={search}
            onChangeText={setSearch}
            style={styles.search}
          />

          {/* Type Filter */}
          <View style={styles.filterRow}>
            {['all', 'Travel', 'Accommodation', 'Other'].map(t => (
              <TouchableOpacity
                key={t}
                onPress={() => setTypeFilter(t)}
                style={[
                  styles.filterChip,
                  typeFilter === t && styles.filterChipActive,
                ]}
              >
                <Text style={{ color: typeFilter === t ? '#fff' : '#374151' }}>
                  {t}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </>
      }
      renderItem={({ item }) => {
        const open = expandedId === item._id;
        const pending = item.status === 'pending';

        return (
          <View style={styles.card}>
            <Text style={styles.cardTitle}>{item.expenseName}</Text>
            <Text style={styles.meta}>
              {item.employee?.name} • ₹{item.estimatedAmount}
            </Text>

            <View style={styles.actions}>
              <TouchableOpacity
                onPress={() =>
                  navigation.navigate('BookingDetails', { id: item._id })
                }
                style={styles.viewBtn}
              >
                <MaterialIcons name="visibility" size={18} color="#2563eb" />
                <Text style={styles.viewText}>View</Text>
              </TouchableOpacity>

              {pending && (
                <TouchableOpacity
                  onPress={() => setExpandedId(open ? null : item._id)}
                  style={styles.reviewBtn}
                >
                  <Text style={{ color: '#fff' }}>
                    {open ? 'Close Review' : 'Review'}
                  </Text>
                </TouchableOpacity>
              )}
            </View>

            {/* REVIEW SECTION */}
            {open && pending && (
              <View style={styles.reviewBox}>
                <Text style={styles.reviewTitle}>Complete Booking</Text>

                <Text style={styles.inputLabel}>Total Ticket Cost (₹)</Text>

                <TextInput
                  placeholder="e.g. 12500"
                  keyboardType="numeric"
                  value={ticketCostById[item._id] || ''}
                  onChangeText={v =>
                    setTicketCostById(p => ({ ...p, [item._id]: v }))
                  }
                  style={styles.input}
                />

                <TouchableOpacity
                  style={styles.fileBtn}
                  onPress={() => pickTicketFile(item._id)}
                >
                  <MaterialIcons name="attach-file" size={18} color="#fff" />
                  <Text style={styles.fileBtnText}>
                    {ticketFileById[item._id]
                      ? 'Change Ticket File'
                      : 'Select Ticket File'}
                  </Text>
                </TouchableOpacity>

                <Text style={styles.helperText}>
                  Upload invoice / ticket provided by vendor
                </Text>

                {ticketFileById[item._id] && (
                  <Text style={styles.fileName}>
                    📎 {ticketFileById[item._id].name}
                  </Text>
                )}

                <TouchableOpacity
                  onPress={() => submitTicket(item._id)}
                  style={styles.uploadBtn}
                  disabled={uploadMutation.isPending}
                >
                  <Text style={{ color: '#fff', fontWeight: '700' }}>
                    {uploadMutation.isPending
                      ? 'Uploading...'
                      : 'Upload & Complete'}
                  </Text>
                </TouchableOpacity>
              </View>
            )}
          </View>
        );
      }}
    />
  );
}

/* ---------------- STYLES ---------------- */

const styles = StyleSheet.create({
  loader: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  title: { fontSize: 22, fontWeight: '700', marginBottom: 12 },

  tabs: { flexDirection: 'row', gap: 6, marginBottom: 10 },
  tab: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    backgroundColor: '#e5e7eb',
  },
  tabActive: { backgroundColor: '#2563eb' },

  search: {
    borderWidth: 1,
    borderColor: '#d1d5db',
    borderRadius: 10,
    padding: 10,
    marginBottom: 10,
  },

  filterRow: { flexDirection: 'row', gap: 6, marginBottom: 16 },
  filterChip: {
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 14,
    backgroundColor: '#e5e7eb',
  },
  filterChipActive: { backgroundColor: '#2563eb' },

  card: {
    backgroundColor: '#fff',
    padding: 16,
    borderRadius: 14,
    marginBottom: 12,
  },
  cardTitle: { fontSize: 16, fontWeight: '700' },
  meta: { color: '#6b7280', marginVertical: 4 },

  actions: { flexDirection: 'row', gap: 8, marginTop: 6 },

  viewBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    padding: 8,
    borderRadius: 10,
    backgroundColor: '#dbeafe',
  },
  viewText: { color: '#2563eb', fontWeight: '600' },

  reviewBtn: {
    backgroundColor: '#2563eb',
    padding: 8,
    borderRadius: 10,
  },

  reviewBox: {
    marginTop: 14,
    padding: 14,
    backgroundColor: '#f9fafb',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#e5e7eb',
  },

  reviewTitle: {
    fontWeight: '700',
    marginBottom: 8,
    color: '#111827',
  },

  input: {
    borderWidth: 1,
    borderColor: '#d1d5db',
    borderRadius: 8,
    padding: 10,
    marginBottom: 8,
  },

  fileBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#7c3aed',
    padding: 10,
    borderRadius: 10,
    marginTop: 4,
  },
  fileBtnText: { color: '#fff', marginLeft: 6, fontWeight: '600' },

  helperText: {
    fontSize: 12,
    color: '#6b7280',
    marginTop: 6,
  },

  fileName: {
    fontSize: 12,
    marginTop: 6,
    color: '#374151',
  },

  uploadBtn: {
    marginTop: 12,
    backgroundColor: '#16a34a',
    padding: 12,
    borderRadius: 10,
    alignItems: 'center',
  },
});
