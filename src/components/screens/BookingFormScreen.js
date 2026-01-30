import { pick, types } from '@react-native-documents/picker';
import { Picker } from '@react-native-picker/picker';
import { useNavigation } from '@react-navigation/native';
import axios from 'axios';
import React, { useCallback, useState } from 'react';
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import DatePicker from 'react-native-date-picker';
import { SafeAreaView } from 'react-native-safe-area-context';
import Toast from 'react-native-toast-message';
import MaterialIcons from 'react-native-vector-icons/MaterialIcons';

// Default Theme (Falling back if imports fail)
const THEME = {
  PRIMARY: '#4F46E5',
  SECONDARY: '#6366F1',
  SUCCESS: '#10B981',
  ERROR: '#EF4444',
  INACTIVE: '#9CA3AF',
  BG: '#F9FAFB',
  CARD_BG: '#FFFFFF',
  TEXT_MAIN: '#111827',
  TEXT_MUTED: '#6B7280',
  BORDER: '#E5E7EB',
  SHADOW: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 3,
  },
};

const { API_URL } = process.env;

const BOOKING_TYPES = [
  { label: 'Travel', value: 'Travel', icon: 'flight' },
  { label: 'Accommodation', value: 'Accommodation', icon: 'hotel' },
  { label: 'Other', value: 'Other', icon: 'more-horiz' },
];

const TRAVEL_TYPES = [
  { label: 'Flight', value: 'Flight' },
  { label: 'Train', value: 'Train' },
  { label: 'Bus', value: 'Bus' },
  { label: 'Cabs', value: 'Cabs' },
];

const formatDate = d =>
  d.toLocaleDateString('en-GB', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  });

export default function BookingFormScreen() {
  const navigation = useNavigation();

  const [submitLoading, setSubmitLoading] = useState(false);
  const [openDatePicker, setOpenDatePicker] = useState(false);
  const [activeDateField, setActiveDateField] = useState(null);
  const [tempDate, setTempDate] = useState(new Date());

  const [bookingType, setBookingType] = useState('Travel');
  const [form, setForm] = useState({
    expenseName: '',
    purpose: '',
    estimatedAmount: '',
    travelType: 'Flight',
    fromLocation: '',
    toLocation: '',
    departureDate: '',
    departureTime: '',
    travellers: '1',
    travelClass: 'Economy',
    destination: '',
    checkinDate: '',
    checkoutDate: '',
    rooms: '1',
    guests: '1',
    description: '',
  });

  const [itineraryDocs, setItineraryDocs] = useState([]);
  const [supportingDocs, setSupportingDocs] = useState([]);
  const [itineraryComment, setItineraryComment] = useState('');
  const [supportingComment, setSupportingComment] = useState('');

  const update = useCallback((k, v) => setForm(p => ({ ...p, [k]: v })), []);

  const pickFiles = async setter => {
    try {
      const res = await pick({
        type: [types.allFiles],
        allowMultiSelection: true,
      });
      setter(prev => [
        ...prev,
        ...res.map(f => ({
          uri: f.uri,
          type: f.type,
          name: f.name || f.fileName || `file-${Date.now()}`,
        })),
      ]);
    } catch (err) {
      if (err?.code !== 'CANCELLED') {
        Toast.show({ type: 'error', text1: 'File pick error' });
      }
    }
  };

  const removeFile = (setter, index) =>
    setter(prev => prev.filter((_, i) => i !== index));

  const submit = async () => {
    if (!form.expenseName) {
      Toast.show({ type: 'error', text1: 'Booking name is required' });
      return;
    }

    setSubmitLoading(true);
    try {
      const fd = new FormData();
      fd.append('type', bookingType);
      fd.append('expenseName', form.expenseName);
      fd.append('purpose', form.purpose);
      fd.append('estimatedAmount', form.estimatedAmount);
      fd.append('itineraryComment', itineraryComment);
      fd.append('supportingComment', supportingComment);

      // Dynamic field appending based on type
      const fields = {
        Travel: [
          'travelType',
          'fromLocation',
          'toLocation',
          'departureDate',
          'departureTime',
          'travellers',
          'travelClass',
        ],
        Accommodation: [
          'destination',
          'checkinDate',
          'checkoutDate',
          'rooms',
          'guests',
        ],
        Other: ['description'],
      };

      fields[bookingType]?.forEach(k => fd.append(k, form[k] || ''));

      const appendFiles = (key, files) => {
        files.forEach(file => {
          let name = file.name;
          if (!name.includes('.')) {
            if (file.type === 'application/pdf') name += '.pdf';
            else if (file.type?.startsWith('image/')) name += '.jpg';
          }
          fd.append(key, {
            uri:
              Platform.OS === 'android'
                ? file.uri
                : file.uri.replace('file://', ''),
            type: file.type,
            name,
          });
        });
      };

      appendFiles('itineraryDocs', itineraryDocs);
      appendFiles('supportingDocs', supportingDocs);

      const res = await axios.post(`${API_URL}/bookings`, fd, {
        withCredentials: true,
        headers: { 'Content-Type': 'multipart/form-data' },
      });

      if (res.data?.success) {
        Toast.show({
          type: 'success',
          text1: 'Booking successfully submitted',
        });
        navigation.goBack();
      } else {
        throw new Error(res.data?.message || 'Something went wrong');
      }
    } catch (err) {
      Toast.show({
        type: 'error',
        text1: err.response?.data?.message || 'Submission failed',
      });
    } finally {
      setSubmitLoading(false);
    }
  };

  /* ---------- UI COMPONENTS ---------- */

  const SectionHeader = ({ title, icon }) => (
    <View style={styles.sectionHeader}>
      <MaterialIcons name={icon} size={20} color={THEME.PRIMARY} />
      <Text style={styles.sectionTitle}>{title}</Text>
    </View>
  );

  const FormCard = ({ children }) => (
    <View style={styles.card}>{children}</View>
  );

  return (
    <SafeAreaView style={styles.safeArea}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={{ flex: 1 }}
      >
        <ScrollView
          style={styles.container}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          <View style={styles.header}>
            <Text style={styles.title}>New Booking</Text>
            <Text style={styles.subtitle}>
              Fill in the details to submit your request
            </Text>
          </View>

          {/* Basic Information Section */}
          <SectionHeader title="Basic Information" icon="info-outline" />
          <FormCard>
            <Input
              label="Booking Name"
              placeholder="e.g. Annual Tech Conference"
              value={form.expenseName}
              onChange={v => update('expenseName', v)}
              required
            />
            <Input
              label="Purpose"
              placeholder="Reason for booking"
              value={form.purpose}
              onChange={v => update('purpose', v)}
            />
            <Input
              label="Estimated Amount"
              placeholder="0.00"
              keyboard="numeric"
              icon="attach-money"
              value={form.estimatedAmount}
              onChange={v => update('estimatedAmount', v)}
            />
          </FormCard>

          {/* Booking Type Selector */}
          <SectionHeader title="Booking Type" icon="category" />
          <View style={styles.typeSelectorContainer}>
            {BOOKING_TYPES.map(type => (
              <TouchableOpacity
                key={type.value}
                style={[
                  styles.typeTab,
                  bookingType === type.value && styles.typeTabActive,
                ]}
                onPress={() => setBookingType(type.value)}
              >
                <MaterialIcons
                  name={type.icon}
                  size={22}
                  color={bookingType === type.value ? '#fff' : THEME.INACTIVE}
                />
                <Text
                  style={[
                    styles.typeTabText,
                    bookingType === type.value && styles.typeTabTextActive,
                  ]}
                >
                  {type.label}
                </Text>
              </TouchableOpacity>
            ))}
          </View>

          {/* Dynamic Details Section */}
          <SectionHeader title={`${bookingType} Details`} icon="assignment" />
          <FormCard>
            {bookingType === 'Travel' && (
              <>
                <View style={styles.inputWrap}>
                  <Text style={styles.label}>Travel Type</Text>
                  <View style={styles.pickerWrapper}>
                    <Picker
                      selectedValue={form.travelType}
                      onValueChange={val => update('travelType', val)}
                      style={styles.picker}
                    >
                      {TRAVEL_TYPES.map(t => (
                        <Picker.Item
                          key={t.value}
                          label={t.label}
                          value={t.value}
                        />
                      ))}
                    </Picker>
                  </View>
                </View>
                <View style={styles.row}>
                  <View style={{ flex: 1, marginRight: 8 }}>
                    <Input
                      label="From"
                      placeholder="Origin"
                      value={form.fromLocation}
                      onChange={v => update('fromLocation', v)}
                    />
                  </View>
                  <View style={{ flex: 1, marginLeft: 8 }}>
                    <Input
                      label="To"
                      placeholder="Destination"
                      value={form.toLocation}
                      onChange={v => update('toLocation', v)}
                    />
                  </View>
                </View>
                <DateField
                  label="Departure Date"
                  value={form.departureDate}
                  onPress={() => {
                    setActiveDateField('departureDate');
                    setOpenDatePicker(true);
                  }}
                />
                <Input
                  label="Travellers"
                  keyboard="numeric"
                  icon="people"
                  value={form.travellers}
                  onChange={v => update('travellers', v)}
                />
              </>
            )}

            {bookingType === 'Accommodation' && (
              <>
                <Input
                  label="Destination"
                  placeholder="City or Hotel"
                  value={form.destination}
                  onChange={v => update('destination', v)}
                />
                <View style={styles.row}>
                  <View style={{ flex: 1, marginRight: 8 }}>
                    <DateField
                      label="Check-in"
                      value={form.checkinDate}
                      onPress={() => {
                        setActiveDateField('checkinDate');
                        setOpenDatePicker(true);
                      }}
                    />
                  </View>
                  <View style={{ flex: 1, marginLeft: 8 }}>
                    <DateField
                      label="Check-out"
                      value={form.checkoutDate}
                      onPress={() => {
                        setActiveDateField('checkoutDate');
                        setOpenDatePicker(true);
                      }}
                    />
                  </View>
                </View>
              </>
            )}

            {bookingType === 'Other' && (
              <Input
                label="Description"
                placeholder="Detailed description of the requirement"
                multiline
                value={form.description}
                onChange={v => update('description', v)}
              />
            )}
          </FormCard>

          {/* Documents Section */}
          <SectionHeader title="Attachments" icon="attach-file" />
          <FileSection
            title="Itinerary Documents"
            files={itineraryDocs}
            onAdd={() => pickFiles(setItineraryDocs)}
            onRemove={i => removeFile(setItineraryDocs, i)}
            comment={itineraryComment}
            setComment={setItineraryComment}
          />
          <FileSection
            title="Supporting Documents"
            files={supportingDocs}
            onAdd={() => pickFiles(setSupportingDocs)}
            onRemove={i => removeFile(setSupportingDocs, i)}
            comment={supportingComment}
            setComment={setSupportingComment}
          />

          <TouchableOpacity
            style={[
              styles.submitButton,
              submitLoading && styles.submitButtonDisabled,
            ]}
            onPress={submit}
            disabled={submitLoading}
          >
            {submitLoading ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <>
                <Text style={styles.submitButtonText}>Submit Request</Text>
                <MaterialIcons
                  name="arrow-forward"
                  size={20}
                  color="#fff"
                  style={{ marginLeft: 8 }}
                />
              </>
            )}
          </TouchableOpacity>

          <View style={{ height: 40 }} />
        </ScrollView>

        <DatePicker
          modal
          open={openDatePicker}
          date={tempDate}
          mode="date"
          onConfirm={d => {
            update(activeDateField, d.toISOString().split('T')[0]);
            setOpenDatePicker(false);
          }}
          onCancel={() => setOpenDatePicker(false)}
        />
        <Toast />
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

/* ---------- UI ATOMS ---------- */

const Input = ({
  label,
  value,
  onChange,
  placeholder,
  keyboard,
  multiline,
  icon,
  required,
}) => (
  <View style={styles.inputWrap}>
    <View style={styles.labelRow}>
      <Text style={styles.label}>{label}</Text>
      {required && <Text style={{ color: THEME.ERROR, marginLeft: 4 }}>*</Text>}
    </View>
    <View
      style={[
        styles.inputContainer,
        multiline && { height: 100, alignItems: 'flex-start' },
      ]}
    >
      {icon && (
        <MaterialIcons
          name={icon}
          size={20}
          color={THEME.INACTIVE}
          style={{ marginRight: 8, marginTop: multiline ? 12 : 0 }}
        />
      )}
      <TextInput
        style={[
          styles.input,
          { textAlignVertical: multiline ? 'top' : 'center' },
        ]}
        value={value}
        onChangeText={onChange}
        placeholder={placeholder}
        placeholderTextColor={THEME.INACTIVE}
        keyboardType={keyboard}
        multiline={multiline}
      />
    </View>
  </View>
);

const DateField = ({ label, value, onPress }) => (
  <View style={styles.inputWrap}>
    <Text style={styles.label}>{label}</Text>
    <TouchableOpacity style={styles.inputContainer} onPress={onPress}>
      <MaterialIcons
        name="calendar-today"
        size={20}
        color={THEME.PRIMARY}
        style={{ marginRight: 10 }}
      />
      <Text
        style={{ color: value ? THEME.TEXT_MAIN : THEME.INACTIVE, flex: 1 }}
      >
        {value ? value : 'Select Date'}
      </Text>
    </TouchableOpacity>
  </View>
);

const FileSection = ({
  title,
  files,
  onAdd,
  onRemove,
  comment,
  setComment,
}) => (
  <View style={styles.fileSectionCard}>
    <View style={styles.fileSectionHeader}>
      <Text style={styles.fileSectionTitle}>{title}</Text>
      <TouchableOpacity style={styles.addButton} onPress={onAdd}>
        <MaterialIcons name="add" size={20} color={THEME.PRIMARY} />
        <Text style={styles.addButtonText}>Add</Text>
      </TouchableOpacity>
    </View>

    {files.length > 0 && (
      <View style={styles.fileList}>
        {files.map((f, i) => (
          <View key={i} style={styles.fileItem}>
            <MaterialIcons
              name="insert-drive-file"
              size={20}
              color={THEME.INACTIVE}
            />
            <Text numberOfLines={1} style={styles.fileName}>
              {f.name}
            </Text>
            <TouchableOpacity
              onPress={() => onRemove(i)}
              style={styles.removeFileBtn}
            >
              <MaterialIcons name="cancel" color={THEME.ERROR} size={20} />
            </TouchableOpacity>
          </View>
        ))}
      </View>
    )}

    <TextInput
      style={styles.fileComment}
      placeholder="Add a comment about these files..."
      placeholderTextColor={THEME.INACTIVE}
      value={comment}
      onChangeText={setComment}
      multiline
    />
  </View>
);

/* ---------- STYLES ---------- */

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: THEME.BG },
  container: { flex: 1 },
  scrollContent: { padding: 20 },
  header: { marginBottom: 24 },
  title: {
    fontSize: 28,
    fontWeight: '800',
    color: THEME.TEXT_MAIN,
    letterSpacing: -0.5,
  },
  subtitle: { fontSize: 15, color: THEME.TEXT_MUTED, marginTop: 4 },

  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 16,
    marginBottom: 12,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: THEME.TEXT_MAIN,
    marginLeft: 8,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },

  card: {
    backgroundColor: THEME.CARD_BG,
    borderRadius: 16,
    padding: 16,
    marginBottom: 20,
    ...THEME.SHADOW,
  },

  row: { flexDirection: 'row', alignItems: 'center' },

  inputWrap: { marginBottom: 16 },
  labelRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 6 },
  label: { fontSize: 14, fontWeight: '600', color: THEME.TEXT_MAIN },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F3F4F6',
    borderRadius: 12,
    paddingHorizontal: 12,
    height: 52,
    borderWidth: 1,
    borderColor: 'transparent',
  },
  input: { flex: 1, color: THEME.TEXT_MAIN, fontSize: 15, height: '100%' },

  pickerWrapper: {
    backgroundColor: '#F3F4F6',
    borderRadius: 12,
    height: 52,
    justifyContent: 'center',
  },
  picker: { width: '100%', color: THEME.TEXT_MAIN },

  typeSelectorContainer: {
    flexDirection: 'row',
    backgroundColor: '#F3F4F6',
    borderRadius: 14,
    padding: 4,
    marginBottom: 24,
  },
  typeTab: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 10,
    borderRadius: 10,
  },
  typeTabActive: {
    backgroundColor: THEME.PRIMARY,
    ...THEME.SHADOW,
  },
  typeTabText: {
    fontSize: 13,
    fontWeight: '600',
    color: THEME.INACTIVE,
    marginLeft: 6,
  },
  typeTabTextActive: { color: '#fff' },

  fileSectionCard: {
    backgroundColor: THEME.CARD_BG,
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
    ...THEME.SHADOW,
  },
  fileSectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  fileSectionTitle: { fontSize: 15, fontWeight: '600', color: THEME.TEXT_MAIN },
  addButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#EEF2FF',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
  },
  addButtonText: {
    color: THEME.PRIMARY,
    fontWeight: '700',
    fontSize: 13,
    marginLeft: 4,
  },

  fileList: { marginBottom: 12 },
  fileItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F9FAFB',
    padding: 10,
    borderRadius: 10,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: THEME.BORDER,
  },
  fileName: { flex: 1, fontSize: 13, color: THEME.TEXT_MAIN, marginLeft: 8 },
  removeFileBtn: { padding: 2 },

  fileComment: {
    backgroundColor: '#F9FAFB',
    borderRadius: 10,
    padding: 12,
    minHeight: 60,
    fontSize: 14,
    color: THEME.TEXT_MAIN,
    borderWidth: 1,
    borderColor: THEME.BORDER,
  },

  submitButton: {
    backgroundColor: THEME.PRIMARY,
    height: 58,
    borderRadius: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 10,
    ...THEME.SHADOW,
    shadowColor: THEME.PRIMARY,
    shadowOpacity: 0.3,
  },
  submitButtonDisabled: { backgroundColor: THEME.INACTIVE },
  submitButtonText: { color: '#fff', fontSize: 18, fontWeight: '700' },
});
