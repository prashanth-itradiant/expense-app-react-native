/* eslint-disable react-hooks/exhaustive-deps */
import { API_URL } from '@env';
import { useNavigation, useRoute } from '@react-navigation/native';
import axios from 'axios';
import React, { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import MaterialIcons from 'react-native-vector-icons/MaterialIcons';
import { COLORS, TYPOGRAPHY } from '../theme/theme';
import { openFile } from '../utils/openFile';

/* ------------------ helpers ------------------ */

const formatDate = d => (d ? new Date(d).toLocaleDateString() : 'N/A');
const formatDateTime = d => (d ? new Date(d).toLocaleString() : 'N/A');

const STATUS_MAP = {
  pending: {
    bg: '#FEF3C7',
    text: '#92400E',
    icon: 'schedule',
    label: 'PENDING',
  },
  completed: {
    bg: '#DCFCE7',
    text: '#166534',
    icon: 'check-circle',
    label: 'COMPLETED',
  },
  cancelled: {
    bg: '#F3F4F6',
    text: '#374151',
    icon: 'cancel',
    label: 'CANCELLED',
  },
};

/* ------------------ reusable UI ------------------ */

const SectionCard = ({ title, icon, children }) => (
  <View style={styles.sectionCard}>
    <View style={styles.sectionHeader}>
      <MaterialIcons name={icon} size={18} color={COLORS.primary[600]} />
      <Text style={styles.sectionTitle}>{title}</Text>
    </View>
    {children}
  </View>
);

const InfoRow = ({ label, value }) => (
  <View style={styles.infoRow}>
    <Text style={styles.infoLabel}>{label}</Text>
    <Text style={styles.infoValue} numberOfLines={2}>
      {value || 'N/A'}
    </Text>
  </View>
);

const FileRow = ({ file }) => (
  <TouchableOpacity onPress={() => openFile(file)} style={styles.fileRow}>
    <MaterialIcons name="attach-file" size={18} color={COLORS.primary[600]} />
    <Text numberOfLines={1} style={styles.fileText}>
      {typeof file === 'string' ? file : file?.name || 'View File'}
    </Text>
    <MaterialIcons name="open-in-new" size={16} color={COLORS.primary[600]} />
  </TouchableOpacity>
);

/* ------------------ screen ------------------ */

export default function BookingDetailsScreen() {
  const route = useRoute();
  const navigation = useNavigation();
  const bookingId = route?.params?.id;

  const [booking, setBooking] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (bookingId) fetchBooking();
  }, [bookingId]);

  const fetchBooking = async () => {
    try {
      const res = await axios.get(`${API_URL}/bookings/${bookingId}`, {
        withCredentials: true,
      });
      if (res.data?.success) setBooking(res.data.data);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color={COLORS.primary[600]} />
      </View>
    );
  }

  if (!booking) {
    return (
      <View style={styles.center}>
        <Text>Booking not found</Text>
      </View>
    );
  }

  const statusUI = STATUS_MAP[booking.status] || STATUS_MAP.pending;

  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
      {/* HEADER */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>{booking.expenseName}</Text>

        <View style={[styles.statusBadge, { backgroundColor: statusUI.bg }]}>
          <MaterialIcons name={statusUI.icon} size={14} color={statusUI.text} />
          <Text style={[styles.statusText, { color: statusUI.text }]}>
            {statusUI.label}
          </Text>
        </View>

        {/* CREATE EXPENSE */}
        {booking.status === 'completed' && (
          <TouchableOpacity
            style={styles.createExpenseBtn}
            onPress={() =>
              navigation.navigate('AddExpense', { bookingId: booking._id })
            }
          >
            <MaterialIcons name="receipt-long" size={18} color="#fff" />
            <Text style={styles.createExpenseText}>Create Expense</Text>
          </TouchableOpacity>
        )}
      </View>

      {/* BOOKING INFO */}
      <SectionCard title="Booking Info" icon="info">
        <InfoRow label="Employee" value={booking.employee?.name} />
        <InfoRow label="Purpose" value={booking.purpose} />
        <InfoRow
          label="Estimated Amount"
          value={`₹${Number(booking.estimatedAmount || 0).toFixed(2)}`}
        />
        {booking.ticketCost > 0 && (
          <InfoRow
            label="Ticket Cost"
            value={`₹${Number(booking.ticketCost).toFixed(2)}`}
          />
        )}
        <InfoRow label="Created At" value={formatDateTime(booking.createdAt)} />
      </SectionCard>

      {/* VIEW TICKET */}
      {booking.ticketFile && (
        <SectionCard title="Ticket" icon="confirmation-number">
          <TouchableOpacity
            style={styles.ticketBtn}
            onPress={() => openFile(booking.ticketFile)}
          >
            <MaterialIcons name="download" size={20} color="#2563eb" />
            <Text style={styles.ticketText}>View Ticket</Text>
          </TouchableOpacity>
        </SectionCard>
      )}

      {/* TIMELINE */}
      <SectionCard title="Timeline" icon="timeline">
        <InfoRow
          label="Booking Created"
          value={formatDateTime(booking.createdAt)}
        />
        {booking.ticketUploadedAt && (
          <InfoRow
            label="Ticket Uploaded"
            value={formatDateTime(booking.ticketUploadedAt)}
          />
        )}
      </SectionCard>

      {/* DOCUMENTS */}
      <SectionCard title="Documents" icon="attach-file">
        <Text style={styles.subTitle}>Itinerary Documents</Text>
        {booking.itineraryDocs?.length ? (
          booking.itineraryDocs.map((file, i) => (
            <FileRow key={`it-${i}`} file={file} />
          ))
        ) : (
          <Text style={styles.emptyText}>No itinerary files</Text>
        )}

        <View style={{ height: 12 }} />

        <Text style={styles.subTitle}>Supporting Documents</Text>
        {booking.supportingDocs?.length ? (
          booking.supportingDocs.map((file, i) => (
            <FileRow key={`sp-${i}`} file={file} />
          ))
        ) : (
          <Text style={styles.emptyText}>No supporting files</Text>
        )}
      </SectionCard>

      <View style={{ height: 30 }} />
    </ScrollView>
  );
}

/* ------------------ styles ------------------ */

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background.secondary },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },

  header: {
    padding: 20,
    backgroundColor: COLORS.primary,
    borderBottomLeftRadius: 16,
    borderBottomRightRadius: 16,
  },
  headerTitle: {
    fontSize: TYPOGRAPHY.fontSize.xl,
    fontWeight: TYPOGRAPHY.fontWeight.bold,
    color: COLORS.text.primary,
  },

  statusBadge: {
    marginTop: 10,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 20,
    alignSelf: 'flex-start',
  },
  statusText: { fontWeight: '700', fontSize: 12 },

  createExpenseBtn: {
    marginTop: 14,
    flexDirection: 'row',
    gap: 8,
    alignItems: 'center',
    backgroundColor: '#059669',
    paddingVertical: 10,
    paddingHorizontal: 14,
    borderRadius: 10,
    alignSelf: 'flex-start',
  },
  createExpenseText: {
    color: '#fff',
    fontWeight: '700',
  },

  sectionCard: {
    backgroundColor: '#fff',
    marginHorizontal: 14,
    marginTop: 14,
    padding: 16,
    borderRadius: 14,
    elevation: 2,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 12,
  },
  sectionTitle: { fontSize: 16, fontWeight: '700' },

  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 10,
  },
  infoLabel: { color: '#6b7280', fontSize: 13 },
  infoValue: {
    fontSize: 14,
    fontWeight: '600',
    color: '#111827',
    maxWidth: '60%',
    textAlign: 'right',
  },

  ticketBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingVertical: 10,
  },
  ticketText: {
    color: '#2563eb',
    fontWeight: '700',
    fontSize: 15,
  },

  fileRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
    gap: 6,
  },
  fileText: {
    color: COLORS.primary[600],
    fontWeight: '600',
    flex: 1,
  },

  subTitle: {
    fontSize: 14,
    fontWeight: '700',
    marginBottom: 6,
  },

  emptyText: {
    color: '#9ca3af',
    fontSize: 13,
    marginTop: 4,
  },
});
