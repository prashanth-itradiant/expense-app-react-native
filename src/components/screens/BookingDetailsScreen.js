/* eslint-disable react-hooks/exhaustive-deps */
import { VITE_API_URL } from '@env';
import { useRoute } from '@react-navigation/native';
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
import { COLORS } from '../theme/theme';
import { openFile } from '../utils/openFile';

/* ------------------ helpers ------------------ */
const formatDate = d => (d ? new Date(d).toLocaleDateString() : 'N/A');
const formatDateTime = d => (d ? new Date(d).toLocaleString() : 'N/A');

/* ------------------ UI components ------------------ */
const SectionCard = ({ title, icon, children }) => (
  <View style={styles.sectionCard}>
    {title && (
      <View style={styles.sectionHeader}>
        {icon && (
          <MaterialIcons name={icon} size={18} color={COLORS.primary[600]} />
        )}
        <Text style={styles.sectionTitle}>{title}</Text>
      </View>
    )}
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

const FileRow = ({ file, onPress }) => (
  <TouchableOpacity onPress={onPress} style={styles.fileRow}>
    <MaterialIcons name="attach-file" size={18} color={COLORS.primary[600]} />
    <Text numberOfLines={1} style={styles.fileText}>
      {typeof file === 'string' ? file : file?.name || 'View File'}
    </Text>
  </TouchableOpacity>
);

/* ------------------ screen ------------------ */
export default function BookingDetailsScreen() {
  const route = useRoute();
  const bookingId = route?.params?.id;

  const [booking, setBooking] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (bookingId) fetchBooking();
  }, [bookingId]);

  const fetchBooking = async () => {
    try {
      const res = await axios.get(`${VITE_API_URL}/bookings/${bookingId}`, {
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

  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
      {/* HEADER */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>{booking.expenseName}</Text>
        <View style={styles.statusBadge}>
          <Text style={styles.statusText}>{booking.status}</Text>
        </View>
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

      {/* TRAVEL */}
      {booking.type === 'Travel' && (
        <SectionCard title="Travel Details" icon="flight">
          <InfoRow label="Travel Type" value={booking.travelType} />
          <InfoRow label="Class" value={booking.travelClass} />
          <InfoRow label="From" value={booking.fromLocation} />
          <InfoRow label="To" value={booking.toLocation} />
          <InfoRow
            label="Departure Date"
            value={formatDate(booking.departureDate)}
          />
          <InfoRow label="Departure Time" value={booking.departureTime} />
          <InfoRow label="Travellers" value={booking.travellers} />
        </SectionCard>
      )}

      {/* ACCOMMODATION */}
      {booking.type === 'Accommodation' && (
        <SectionCard title="Accommodation Details" icon="hotel">
          <InfoRow label="Destination" value={booking.destination} />
          <InfoRow label="Rooms" value={booking.rooms} />
          <InfoRow label="Guests" value={booking.guests} />
          <InfoRow
            label="Check-in Date"
            value={formatDate(booking.checkinDate)}
          />
          <InfoRow
            label="Check-out Date"
            value={formatDate(booking.checkoutDate)}
          />
        </SectionCard>
      )}

      {/* OTHER */}
      {booking.type === 'Other' && (
        <SectionCard title="Other Details" icon="description">
          <InfoRow label="Description" value={booking.description} />
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
        <InfoRow label="Itinerary Comment" value={booking.itineraryComment} />
        {booking.itineraryDocs?.length ? (
          booking.itineraryDocs.map((file, i) => (
            <FileRow
              key={`it-${i}`}
              file={file}
              onPress={() => openFile(file)}
            />
          ))
        ) : (
          <Text style={styles.emptyText}>No itinerary files</Text>
        )}

        <View style={{ height: 10 }} />

        <InfoRow label="Supporting Comment" value={booking.supportingComment} />
        {booking.supportingDocs?.length ? (
          booking.supportingDocs.map((file, i) => (
            <FileRow
              key={`sp-${i}`}
              file={file}
              onPress={() => openFile(file)}
            />
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
    backgroundColor: COLORS.primary[600],
    borderBottomLeftRadius: 16,
    borderBottomRightRadius: 16,
  },
  headerTitle: { fontSize: 20, fontWeight: '700', color: '#fff' },
  statusBadge: {
    marginTop: 8,
    alignSelf: 'flex-start',
    backgroundColor: 'rgba(255,255,255,0.2)',
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 20,
  },
  statusText: { color: '#fff', fontWeight: '600', fontSize: 12 },

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
    marginBottom: 12,
  },
  sectionTitle: { marginLeft: 8, fontSize: 16, fontWeight: '700' },

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

  fileRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
  },
  fileText: {
    marginLeft: 6,
    color: COLORS.primary[600],
    fontWeight: '600',
    flex: 1,
  },

  emptyText: {
    color: '#9ca3af',
    fontSize: 13,
    marginTop: 6,
  },
});
