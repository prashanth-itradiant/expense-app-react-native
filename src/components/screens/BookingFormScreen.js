import { pick, types } from '@react-native-documents/picker';
import { Picker } from '@react-native-picker/picker';
import { useNavigation } from '@react-navigation/native';
import axios from 'axios';
import React, { useState } from 'react';
import {
  ActivityIndicator,
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

import {
  CARD_SHADOW,
  ERROR_COLOR,
  INACTIVE_COLOR,
  LIGHT_BG,
  PRIMARY_COLOR,
} from '../theme/theme';

const { VITE_API_URL } = process.env;

const BOOKING_TYPES = [
  { label: 'Travel', value: 'Travel' },
  { label: 'Accommodation', value: 'Accommodation' },
  { label: 'Other', value: 'Other' },
];

const TRAVEL_TYPES = [
  { label: 'Flight', value: 'Flight' },
  { label: 'Train', value: 'Train' },
  { label: 'Bus', value: 'Bus' },
  { label: 'Cabs', value: 'Cabs' },
];

const formatDate = d => d.toISOString().split('T')[0];

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

  const update = (k, v) => setForm(p => ({ ...p, [k]: v }));

  /* ---------- FILE PICKER ---------- */
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

  /* ---------- SUBMIT ---------- */
  const submit = async () => {
    if (!form.expenseName) {
      Toast.show({ type: 'error', text1: 'Booking name required' });
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

      if (bookingType === 'Travel') {
        [
          'travelType',
          'fromLocation',
          'toLocation',
          'departureDate',
          'departureTime',
          'travellers',
          'travelClass',
        ].forEach(k => fd.append(k, form[k] || ''));
      }

      if (bookingType === 'Accommodation') {
        [
          'destination',
          'checkinDate',
          'checkoutDate',
          'rooms',
          'guests',
        ].forEach(k => fd.append(k, form[k] || ''));
      }

      if (bookingType === 'Other') {
        fd.append('description', form.description || '');
      }

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

      const res = await axios.post(`${VITE_API_URL}/bookings`, fd, {
        withCredentials: true,
        headers: { 'Content-Type': 'multipart/form-data' },
      });

      if (res.data?.success) {
        Toast.show({ type: 'success', text1: 'Booking submitted' });
        navigation.goBack();
      } else {
        throw new Error(res.data?.message);
      }
    } catch (err) {
      Toast.show({
        type: 'error',
        text1: err.response?.data?.message || 'Submit failed',
      });
    } finally {
      setSubmitLoading(false);
    }
  };

  const StyledPicker = ({ value, onChange, placeholder, items, disabled }) => {
    const showPlaceholder = !value;

    return (
      <View
        style={[
          styles.pickerContainer,
          disabled && { backgroundColor: '#F3F4F6' },
        ]}
      >
        {showPlaceholder && (
          <Text
            style={{
              position: 'absolute',
              left: 14,
              color: INACTIVE_COLOR,
              fontSize: 16,
              zIndex: 1,
            }}
          >
            {placeholder}
          </Text>
        )}

        <Picker
          selectedValue={value}
          onValueChange={onChange}
          style={[styles.picker, { color: value ? '#111827' : 'transparent' }]}
          enabled={!disabled}
          dropdownIconColor={PRIMARY_COLOR}
        >
          <Picker.Item label={placeholder} value="" />
          {items.map(item => (
            <Picker.Item
              key={item.value}
              label={item.label}
              value={item.value}
            />
          ))}
        </Picker>
      </View>
    );
  };

  /* ---------- UI ---------- */
  return (
    <SafeAreaView style={{ flex: 1 }}>
      <ScrollView style={styles.container}>
        <Text style={styles.title}>New Booking</Text>

        <Input
          label="Booking Name *"
          value={form.expenseName}
          onChange={v => update('expenseName', v)}
        />
        <Input
          label="Purpose"
          value={form.purpose}
          onChange={v => update('purpose', v)}
        />
        <Input
          label="Estimated Amount"
          keyboard="numeric"
          value={form.estimatedAmount}
          onChange={v => update('estimatedAmount', v)}
        />

        <View style={styles.inputContainer}>
          <Text style={styles.inputLabel}>Booking Type *</Text>

          <StyledPicker
            value={bookingType}
            onChange={setBookingType}
            placeholder="Select Booking Type"
            items={[
              { label: 'Travel', value: 'Travel' },
              { label: 'Accommodation', value: 'Accommodation' },
              { label: 'Other', value: 'Other' },
            ]}
          />
        </View>

        {bookingType === 'Travel' && (
          <>
            <View style={styles.inputContainer}>
              <Text style={styles.inputLabel}>Travel Type *</Text>

              <StyledPicker
                value={form.travelType}
                onChange={val => update('travelType', val)}
                placeholder="Select Travel Type"
                items={[
                  { label: 'Flight', value: 'Flight' },
                  { label: 'Train', value: 'Train' },
                  { label: 'Bus', value: 'Bus' },
                  { label: 'Cabs', value: 'Cabs' },
                ]}
              />
            </View>

            <Input
              label="From Location"
              value={form.fromLocation}
              onChange={v => update('fromLocation', v)}
            />
            <Input
              label="To Location"
              value={form.toLocation}
              onChange={v => update('toLocation', v)}
            />
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
              value={form.travellers}
              onChange={v => update('travellers', v)}
            />
          </>
        )}

        {bookingType === 'Accommodation' && (
          <>
            <Input
              label="Destination"
              value={form.destination}
              onChange={v => update('destination', v)}
            />
            <DateField
              label="Check-in Date"
              value={form.checkinDate}
              onPress={() => {
                setActiveDateField('checkinDate');
                setOpenDatePicker(true);
              }}
            />
            <DateField
              label="Check-out Date"
              value={form.checkoutDate}
              onPress={() => {
                setActiveDateField('checkoutDate');
                setOpenDatePicker(true);
              }}
            />
          </>
        )}

        {bookingType === 'Other' && (
          <Input
            label="Description"
            multiline
            value={form.description}
            onChange={v => update('description', v)}
          />
        )}

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
          style={styles.submit}
          onPress={submit}
          disabled={submitLoading}
        >
          {submitLoading ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <Text style={styles.submitText}>Submit Booking</Text>
          )}
        </TouchableOpacity>
      </ScrollView>

      <DatePicker
        modal
        open={openDatePicker}
        date={tempDate}
        mode="date"
        onConfirm={d => {
          update(activeDateField, formatDate(d));
          setOpenDatePicker(false);
        }}
        onCancel={() => setOpenDatePicker(false)}
      />

      <Toast />
    </SafeAreaView>
  );
}

/* ---------- SMALL COMPONENTS ---------- */

const Input = ({ label, value, onChange, keyboard, multiline }) => (
  <View style={styles.inputWrap}>
    <Text style={styles.label}>{label}</Text>
    <TextInput
      style={[styles.input, multiline && { height: 80 }]}
      value={value}
      onChangeText={onChange}
      keyboardType={keyboard}
      multiline={multiline}
    />
  </View>
);

const PickerBlock = ({ label, value, onChange, items }) => (
  <View style={styles.inputWrap}>
    <Text style={styles.label}>{label}</Text>
    <Picker selectedValue={value} onValueChange={onChange}>
      {items.map(i => (
        <Picker.Item key={i.value} label={i.label} value={i.value} />
      ))}
    </Picker>
  </View>
);

const DateField = ({ label, value, onPress }) => (
  <View style={styles.inputWrap}>
    <Text style={styles.label}>{label}</Text>
    <TouchableOpacity style={styles.input} onPress={onPress}>
      <Text style={{ color: value ? '#111' : INACTIVE_COLOR }}>
        {value || 'Select Date'}
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
  <View style={styles.fileSection}>
    <Text style={styles.sectionTitle}>{title}</Text>
    <TouchableOpacity style={styles.fileButton} onPress={onAdd}>
      <MaterialIcons name="attach-file" size={18} color="#fff" />
      <Text style={{ color: '#fff', marginLeft: 6 }}>Add Files</Text>
    </TouchableOpacity>

    {files.map((f, i) => (
      <View key={i} style={styles.fileItem}>
        <Text numberOfLines={1} style={{ flex: 1 }}>
          {f.name}
        </Text>
        <TouchableOpacity onPress={() => onRemove(i)}>
          <MaterialIcons name="close" color={ERROR_COLOR} size={16} />
        </TouchableOpacity>
      </View>
    ))}

    <TextInput
      style={styles.textarea}
      placeholder="Comment (optional)"
      value={comment}
      onChangeText={setComment}
      multiline
    />
  </View>
);

/* ---------- STYLES ---------- */

const styles = StyleSheet.create({
  container: { backgroundColor: LIGHT_BG, padding: 16 },
  title: {
    fontSize: 26,
    fontWeight: '700',
    color: PRIMARY_COLOR,
    marginBottom: 12,
  },
  inputWrap: { marginBottom: 12 },
  label: { fontWeight: '600', marginBottom: 4 },
  input: {
    borderWidth: 1,
    borderColor: '#D1D5DB',
    borderRadius: 10,
    padding: 12,
    backgroundColor: '#fff',
    ...CARD_SHADOW,
  },
  textarea: {
    borderWidth: 1,
    borderColor: '#D1D5DB',
    borderRadius: 10,
    padding: 12,
    marginTop: 8,
    minHeight: 70,
    backgroundColor: '#fff',
  },
  fileSection: { marginTop: 16 },
  sectionTitle: { fontSize: 16, fontWeight: '600', marginBottom: 8 },
  fileButton: {
    flexDirection: 'row',
    backgroundColor: PRIMARY_COLOR,
    padding: 10,
    borderRadius: 10,
    alignItems: 'center',
  },
  fileItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F9FAFB',
    padding: 8,
    borderRadius: 8,
    marginTop: 8,
  },
  submit: {
    backgroundColor: PRIMARY_COLOR,
    padding: 16,
    borderRadius: 14,
    alignItems: 'center',
    marginTop: 24,
  },
  submitText: { color: '#fff', fontSize: 16, fontWeight: '700' },
});
