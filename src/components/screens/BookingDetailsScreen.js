/* eslint-disable react-hooks/exhaustive-deps */
import { API_URL } from '@env';
import { useNavigation, useRoute } from '@react-navigation/native';
import axios from 'axios';
import React, { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Dimensions,
  Platform,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import MaterialIcons from 'react-native-vector-icons/MaterialIcons';
import { openFile } from '../utils/openFile';

/* ------------------ theme (white + navy) ------------------ */

const NAVY = {
  primary: '#0B1F45', // deep navy — headers, buttons, active states
  primaryLight: '#12295E',
  bg: '#FFFFFF',
  surface: '#FFFFFF',
  screenBg: '#F5F6F8',
  border: '#E6E8EC',
  textPrimary: '#111827',
  textSecondary: '#6B7280',
  textMuted: '#9CA3AF',
  onPrimary: '#FFFFFF',
};

const { height: SCREEN_HEIGHT } = Dimensions.get('window');
const IS_SHORT_SCREEN = SCREEN_HEIGHT < 700;

/* ------------------ helpers ------------------ */

const formatDateTime = d => (d ? new Date(d).toLocaleString() : 'N/A');

const STATUS_MAP = {
  pending: { bg: '#FEF3C7', text: '#92400E', icon: 'schedule', label: 'PENDING' },
  completed: { bg: '#DCFCE7', text: '#166534', icon: 'check-circle', label: 'COMPLETED' },
  cancelled: { bg: '#F3F4F6', text: '#374151', icon: 'cancel', label: 'CANCELLED' },
};

/* ------------------ reusable UI ------------------ */

const SectionCard = ({ title, icon, children }) => (
  <View style={styles.sectionCard}>
    <View style={styles.sectionHeader}>
      <MaterialIcons name={icon} size={16} color={NAVY.primary} />
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
  <TouchableOpacity onPress={() => openFile(file)} style={styles.fileRow} activeOpacity={0.7}>
    <MaterialIcons name="attach-file" size={16} color={NAVY.primary} />
    <Text numberOfLines={1} style={styles.fileText}>
      {typeof file === 'string' ? file : file?.name || 'View File'}
    </Text>
    <MaterialIcons name="open-in-new" size={14} color={NAVY.primary} />
  </TouchableOpacity>
);

/* ------------------ screen ------------------ */

export default function BookingDetailsScreen() {
  const route = useRoute();
  const navigation = useNavigation();
  const insets = useSafeAreaInsets();
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
      <View style={[styles.center, { paddingTop: insets.top, paddingBottom: insets.bottom }]}>
        <StatusBar barStyle="dark-content" backgroundColor={NAVY.screenBg} translucent={Platform.OS === 'android'} />
        <ActivityIndicator size="large" color={NAVY.primary} />
      </View>
    );
  }

  if (!booking) {
    return (
      <View style={[styles.center, { paddingTop: insets.top, paddingBottom: insets.bottom }]}>
        <StatusBar barStyle="dark-content" backgroundColor={NAVY.screenBg} translucent={Platform.OS === 'android'} />
        <MaterialIcons name="search-off" size={40} color={NAVY.textMuted} />
        <Text style={styles.notFoundText}>Booking not found</Text>
      </View>
    );
  }

  const statusUI = STATUS_MAP[booking.status] || STATUS_MAP.pending;

  return (
    <View style={[styles.root, { paddingBottom: insets.bottom }]}>
      <StatusBar barStyle="light-content" backgroundColor={NAVY.primary} translucent={Platform.OS === 'android'} />

      <ScrollView
        style={styles.container}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: 24 }}
      >
        {/* HEADER */}
        <View style={[styles.header, { paddingTop: (Platform.OS === 'android' ? insets.top : 0) + 16 }]}>
          <TouchableOpacity
            onPress={() => navigation.goBack()}
            style={styles.backBtn}
            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
          >
            <MaterialIcons name="arrow-back" size={20} color={NAVY.onPrimary} />
          </TouchableOpacity>

          <Text style={styles.headerTitle} numberOfLines={2}>
            {booking.expenseName}
          </Text>

          <View style={[styles.statusBadge, { backgroundColor: statusUI.bg }]}>
            <MaterialIcons name={statusUI.icon} size={13} color={statusUI.text} />
            <Text style={[styles.statusText, { color: statusUI.text }]}>{statusUI.label}</Text>
          </View>

          {booking.status === 'completed' && (
            <TouchableOpacity
              style={styles.createExpenseBtn}
              activeOpacity={0.85}
              onPress={() => navigation.navigate('AddExpense', { bookingId: booking._id })}
            >
              <MaterialIcons name="receipt-long" size={16} color={NAVY.primary} />
              <Text style={styles.createExpenseText}>Create Expense</Text>
            </TouchableOpacity>
          )}
        </View>

        {/* BOOKING INFO */}
        <SectionCard title="Booking Info" icon="info-outline">
          <InfoRow label="Employee" value={booking.employee?.name} />
          <InfoRow label="Purpose" value={booking.purpose} />
          <InfoRow
            label="Estimated Amount"
            value={`₹${Number(booking.estimatedAmount || 0).toFixed(2)}`}
          />
          {booking.ticketCost > 0 && (
            <InfoRow label="Ticket Cost" value={`₹${Number(booking.ticketCost).toFixed(2)}`} />
          )}
          <InfoRow label="Created At" value={formatDateTime(booking.createdAt)} />
        </SectionCard>

        {/* VIEW TICKET */}
        {booking.ticketFile && (
          <SectionCard title="Ticket" icon="confirmation-number">
            <TouchableOpacity
              style={styles.ticketBtn}
              activeOpacity={0.8}
              onPress={() => openFile(booking.ticketFile)}
            >
              <MaterialIcons name="download" size={18} color={NAVY.primary} />
              <Text style={styles.ticketText}>View Ticket</Text>
            </TouchableOpacity>
          </SectionCard>
        )}

        {/* TIMELINE */}
        <SectionCard title="Timeline" icon="timeline">
          <InfoRow label="Booking Created" value={formatDateTime(booking.createdAt)} />
          {booking.ticketUploadedAt && (
            <InfoRow label="Ticket Uploaded" value={formatDateTime(booking.ticketUploadedAt)} />
          )}
        </SectionCard>

        {/* DOCUMENTS */}
        <SectionCard title="Documents" icon="attach-file">
          <Text style={styles.subTitle}>Itinerary Documents</Text>
          {booking.itineraryDocs?.length ? (
            booking.itineraryDocs.map((file, i) => <FileRow key={`it-${i}`} file={file} />)
          ) : (
            <Text style={styles.emptyText}>No itinerary files</Text>
          )}

          <View style={{ height: 10 }} />

          <Text style={styles.subTitle}>Supporting Documents</Text>
          {booking.supportingDocs?.length ? (
            booking.supportingDocs.map((file, i) => <FileRow key={`sp-${i}`} file={file} />)
          ) : (
            <Text style={styles.emptyText}>No supporting files</Text>
          )}
        </SectionCard>
      </ScrollView>
    </View>
  );
}

/* ------------------ styles ------------------ */

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: NAVY.primary },
  container: { flex: 1, backgroundColor: NAVY.screenBg },
  center: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: NAVY.screenBg,
    gap: 8,
  },
  notFoundText: { color: NAVY.textSecondary, fontSize: 14, fontWeight: '600' },

  header: {
    backgroundColor: NAVY.primary,
    paddingHorizontal: 16,
    paddingBottom: IS_SHORT_SCREEN ? 14 : 18,
    borderBottomLeftRadius: 20,
    borderBottomRightRadius: 20,
  },
  backBtn: {
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: 'rgba(255,255,255,0.12)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 10,
  },
  headerTitle: {
    fontSize: IS_SHORT_SCREEN ? 17 : 19,
    fontWeight: '700',
    color: NAVY.onPrimary,
    marginBottom: 8,
  },

  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
    alignSelf: 'flex-start',
  },
  statusText: { fontWeight: '700', fontSize: 11 },

  createExpenseBtn: {
    marginTop: 12,
    flexDirection: 'row',
    gap: 6,
    alignItems: 'center',
    backgroundColor: NAVY.onPrimary,
    paddingVertical: 9,
    paddingHorizontal: 14,
    borderRadius: 10,
    alignSelf: 'flex-start',
  },
  createExpenseText: {
    color: NAVY.primary,
    fontWeight: '700',
    fontSize: 13,
  },

  sectionCard: {
    backgroundColor: NAVY.surface,
    marginHorizontal: 14,
    marginTop: 12,
    padding: 12,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: NAVY.border,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 7,
    marginBottom: 10,
  },
  sectionTitle: { fontSize: 14, fontWeight: '700', color: NAVY.textPrimary },

  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 9,
  },
  infoLabel: { color: NAVY.textSecondary, fontSize: 12.5 },
  infoValue: {
    fontSize: 13,
    fontWeight: '600',
    color: NAVY.textPrimary,
    maxWidth: '60%',
    textAlign: 'right',
  },

  ticketBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingVertical: 8,
  },
  ticketText: {
    color: NAVY.primary,
    fontWeight: '700',
    fontSize: 14,
  },

  fileRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 7,
    gap: 6,
  },
  fileText: {
    color: NAVY.primary,
    fontWeight: '600',
    fontSize: 13,
    flex: 1,
  },

  subTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: NAVY.textPrimary,
    marginBottom: 6,
  },

  emptyText: {
    color: NAVY.textMuted,
    fontSize: 12.5,
    marginTop: 2,
  },
});