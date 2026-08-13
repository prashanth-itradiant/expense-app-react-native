import { pick, types } from '@react-native-documents/picker';
import { useNavigation, useRoute } from '@react-navigation/native';
import { useQueryClient } from '@tanstack/react-query';
import axios from 'axios';
import React, { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  FlatList,
  Modal,
  Platform,
  Pressable,
  ScrollView,
  StatusBar,
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
import { openFile } from '../utils/openFile';

import { API_URL } from '@env';
import { CURRENCIES } from '../utils/constant';

/* ------------------ theme (white + navy) ------------------ */

const NAVY = {
  primary: '#0B1F45',
  primaryLight: '#12295E',
  bg: '#FFFFFF',
  screenBg: '#F5F6F8',
  surface: '#FFFFFF',
  border: '#E1E4EA',
  textPrimary: '#111827',
  textSecondary: '#374151',
  inactive: '#9AA1AC',
  error: '#DC2626',
  errorBg: '#FEF2F2',
  onPrimary: '#FFFFFF',
};

const CARD_SHADOW = {
  shadowColor: '#0B1F45',
  shadowOffset: { width: 0, height: 2 },
  shadowOpacity: 0.06,
  shadowRadius: 6,
  elevation: 1,
};

const formatDate = date => date.toISOString().split('T')[0];

const StyledPicker = ({ value, onChange, placeholder, items, disabled }) => {
  const [visible, setVisible] = useState(false);
  const [search, setSearch] = useState('');
  const selected = items.find(item => item.value === value);
  const filteredItems = items.filter(item =>
    item.label.toLowerCase().includes(search.trim().toLowerCase()),
  );

  const close = () => {
    setVisible(false);
    setSearch('');
  };

  const select = itemValue => {
    onChange(itemValue);
    close();
  };

  return (
    <>
      <TouchableOpacity
        style={[
          styles.pickerContainer,
          value && styles.pickerSelected,
          disabled && styles.pickerDisabled,
        ]}
        activeOpacity={0.75}
        disabled={disabled}
        onPress={() => setVisible(true)}
      >
        <View style={styles.pickerValueRow}>
          <MaterialIcons
            name={value ? 'check-circle' : 'tune'}
            size={18}
            color={value ? NAVY.primary : NAVY.inactive}
          />
          <Text
            style={[styles.pickerValue, !value && styles.pickerPlaceholder]}
            numberOfLines={1}
          >
            {selected?.label || placeholder}
          </Text>
        </View>
        <MaterialIcons name="keyboard-arrow-down" size={23} color={NAVY.primary} />
      </TouchableOpacity>

      <Modal
        visible={visible}
        transparent
        animationType="slide"
        statusBarTranslucent
        onRequestClose={close}
      >
        <Pressable style={styles.selectorBackdrop} onPress={close}>
          <Pressable style={styles.selectorSheet} onPress={() => {}}>
            <View style={styles.selectorHandle} />
            <View style={styles.selectorHeader}>
              <View style={styles.selectorHeading}>
                <Text style={styles.selectorTitle}>{placeholder}</Text>
                <Text style={styles.selectorCount}>
                  {items.length} {items.length === 1 ? 'option' : 'options'}
                </Text>
              </View>
              <TouchableOpacity style={styles.selectorClose} onPress={close}>
                <MaterialIcons name="close" size={21} color={NAVY.textSecondary} />
              </TouchableOpacity>
            </View>

            {items.length > 7 && (
              <View style={styles.selectorSearch}>
                <MaterialIcons name="search" size={20} color={NAVY.inactive} />
                <TextInput
                  style={styles.selectorSearchInput}
                  value={search}
                  onChangeText={setSearch}
                  placeholder="Search options"
                  placeholderTextColor={NAVY.inactive}
                  autoFocus={false}
                />
                {!!search && (
                  <TouchableOpacity onPress={() => setSearch('')}>
                    <MaterialIcons name="cancel" size={18} color={NAVY.inactive} />
                  </TouchableOpacity>
                )}
              </View>
            )}

            <FlatList
              data={filteredItems}
              keyExtractor={item => String(item.value)}
              style={styles.selectorList}
              keyboardShouldPersistTaps="handled"
              showsVerticalScrollIndicator={false}
              renderItem={({ item }) => {
                const isSelected = item.value === value;
                return (
                  <TouchableOpacity
                    style={[
                      styles.selectorOption,
                      isSelected && styles.selectorOptionSelected,
                    ]}
                    onPress={() => select(item.value)}
                  >
                    <View style={styles.selectorOptionIcon}>
                      <Text style={styles.selectorOptionInitial}>
                        {item.label.charAt(0).toUpperCase()}
                      </Text>
                    </View>
                    <Text
                      style={[
                        styles.selectorOptionText,
                        isSelected && styles.selectorOptionTextSelected,
                      ]}
                      numberOfLines={2}
                    >
                      {item.label}
                    </Text>
                    {isSelected && (
                      <MaterialIcons name="check-circle" size={22} color={NAVY.primary} />
                    )}
                  </TouchableOpacity>
                );
              }}
              ListEmptyComponent={
                <View style={styles.selectorEmpty}>
                  <MaterialIcons name="search-off" size={30} color={NAVY.inactive} />
                  <Text style={styles.selectorEmptyText}>No matching options</Text>
                </View>
              }
            />
          </Pressable>
        </Pressable>
      </Modal>
    </>
  );
};

const ExpenseFormScreen = () => {
  const navigation = useNavigation();
  const route = useRoute();
  const queryClient = useQueryClient();
  const [openDatePicker, setOpenDatePicker] = useState(false);
  const [activeDateIndex, setActiveDateIndex] = useState(null);
  const [activeDateField, setActiveDateField] = useState(null);
  const [tempDate, setTempDate] = useState(new Date());

  const [loading, setLoading] = useState(true);
  const [submitLoading, setSubmitLoading] = useState(false);

  const [managers, setManagers] = useState([]);
  const [financeUsers, setFinanceUsers] = useState([]);
  const [categories, setCategories] = useState([]);
  const [clients, setClients] = useState([]);

  const [totalReimbursement, setTotalReimbursement] = useState('0.00');

  const [formData, setFormData] = useState({
    bookingId: '',
    expenseName: '',
    periodFrom: '',
    periodTo: '',
    client: '',
    reference: '',
    managerId: '',
    financeId: '',
    currency: '',
    isAdvance: false,
    advanceAmount: '',
    subExpenses: [
      {
        documentDate: '',
        expenseCategory: '',
        expenseType: '',
        vendor: '',
        amount: '',
        description: '',
        files: [],
      },
    ],
  });

  const [linkedDocuments, setLinkedDocuments] = useState([]);

  useEffect(() => {
    const fetchAll = async () => {
      try {
        const usersReq = axios.get(`${API_URL}/users/get-organization-users`, {
          withCredentials: true,
        });
        const catReq = axios.get(`${API_URL}/admin/get-all-categories`, {
          withCredentials: true,
        });
        const clientsReq = axios.get(`${API_URL}/admin/get-all-clients`, {
          withCredentials: true,
        });

        const [usersRes, catRes, clientsRes] = await Promise.all([
          usersReq,
          catReq,
          clientsReq,
        ]);

        if (usersRes.data?.success) {
          setManagers(usersRes.data.data.managers || []);
          setFinanceUsers(usersRes.data.data.financeUsers || []);
        }

        setCategories(Array.isArray(catRes.data?.data) ? catRes.data.data : []);
        setClients(
          Array.isArray(clientsRes.data?.data) ? clientsRes.data.data : [],
        );
      } catch (err) {
        console.error('Failed to fetch init data', err);
        Toast.show({ type: 'error', text1: 'Failed to load initial data' });
      } finally {
        setLoading(false);
      }
    };

    fetchAll();
  }, []);

  useEffect(() => {
    const bookingId = route?.params?.bookingId || route?.params?.id;
    if (!bookingId) return;

    const prefillFromBooking = async () => {
      try {
        const res = await axios.get(`${API_URL}/bookings/${bookingId}`, {
          withCredentials: true,
        });

        if (!res.data?.success || !res.data?.data) {
          Toast.show({
            type: 'error',
            text1: 'Booking prefill failed (no data)',
          });
          return;
        }

        const b = res.data.data;

        const asDateInput = d =>
          d ? new Date(d).toISOString().slice(0, 10) : '';

        const from = b.departureDate || b.checkinDate || b.createdAt || '';
        const to = b.checkoutDate || b.departureDate || b.createdAt || '';
        const documentDate =
          b.departureDate || b.checkinDate || b.createdAt || '';

        const docs = [];
        if (b.ticketFile?.url || b.ticketFile?.name) {
          docs.push({
            name: b.ticketFile.name || 'Ticket',
            url: b.ticketFile.url || b.ticketFile,
            type: b.ticketFile.type,
            size: b.ticketFile.size,
          });
        }

        setLinkedDocuments(docs);

        setFormData(prev => {
          const sub = [...prev.subExpenses];

          if (sub.length === 0) {
            sub.push({
              documentDate: asDateInput(documentDate),
              expenseCategory: '',
              expenseType: '',
              vendor: '',
              amount: b.ticketCost ? String(b.ticketCost) : '',
              description: b.expenseName || '',
              files: [],
            });
          } else {
            sub[0] = {
              ...sub[0],
              documentDate: asDateInput(documentDate) || sub[0].documentDate,
              amount: b.ticketCost ? String(b.ticketCost) : sub[0].amount,
              description:
                b.expenseName && !sub[0].description
                  ? b.expenseName
                  : sub[0].description,
            };
          }

          return {
            ...prev,
            bookingId,
            expenseName: b.expenseName
              ? `${b.expenseName} (Booking)`
              : prev.expenseName,
            periodFrom: asDateInput(from),
            periodTo: asDateInput(to),
            subExpenses: sub,
          };
        });
      } catch (err) {
        console.error('Prefill booking failed', err);
        Toast.show({
          type: 'error',
          text1: err.response?.data?.message || 'Booking prefill failed',
        });
      }
    };

    prefillFromBooking();
  }, [route?.params?.bookingId, route?.params?.id]);

  useEffect(() => {
    let total = 0;
    formData.subExpenses.forEach(s => {
      const n = parseFloat(s.amount);
      if (!isNaN(n)) total += n;
    });
    setTotalReimbursement(total.toFixed(2));
  }, [formData.subExpenses]);

  const handleChange = (name, value, index = null) => {
    if (index !== null) {
      const updated = [...formData.subExpenses];
      if (name === 'expenseCategory') {
        updated[index].expenseCategory = value;
        updated[index].expenseType = '';
        updated[index].vendor = '';
      } else if (name === 'expenseType') {
        updated[index].expenseType = value;
        updated[index].vendor = '';
      } else {
        updated[index][name] = value;
      }
      setFormData(p => ({ ...p, subExpenses: updated }));
    } else {
      if (name === 'isAdvance') {
        setFormData(p => ({
          ...p,
          isAdvance: !!value,
          advanceAmount: value ? p.advanceAmount : '',
        }));
      } else {
        setFormData(p => ({ ...p, [name]: value }));
      }
    }
  };

  const addSubExpense = () => {
    setFormData(p => ({
      ...p,
      subExpenses: [
        ...p.subExpenses,
        {
          documentDate: '',
          expenseCategory: '',
          expenseType: '',
          vendor: '',
          amount: '',
          description: '',
          files: [],
        },
      ],
    }));
  };

  const removeSubExpense = idx => {
    const updated = formData.subExpenses.filter((_, i) => i !== idx);
    setFormData(p => ({ ...p, subExpenses: updated }));
  };

  const pickFiles = async index => {
    try {
      const results = await pick({
        type: [types.allFiles],
        allowMultiSelection: true,
      });
      const updated = [...formData.subExpenses];
      updated[index].files = [
        ...updated[index].files,
        ...results.map(f => ({
          uri: f.uri,
          type: f.type,
          name: f.name || f.fileName || `file-${Date.now()}`,
          size: f.size,
          fileCopyUri: f.fileCopyUri,
        })),
      ];
      setFormData(p => ({ ...p, subExpenses: updated }));
    } catch (err) {
      if (err?.code === 'CANCELLED') {
        // user canceled, ignore
      } else {
        console.error('pickFiles error', err);
        Toast.show({ type: 'error', text1: 'Error picking files' });
      }
    }
  };

  const handleDeleteFile = (subIdx, fileIdx) => {
    const updated = [...formData.subExpenses];
    updated[subIdx].files.splice(fileIdx, 1);
    setFormData(p => ({ ...p, subExpenses: updated }));
  };

  const validateBeforeSubmit = () => {
    for (let i = 0; i < formData.subExpenses.length; i++) {
      const s = formData.subExpenses[i];
      if (!s.files || s.files.length === 0) {
        Toast.show({
          type: 'error',
          text1: `Attach at least one file for item ${i + 1}`,
        });
        return false;
      }
    }
    return true;
  };

  const handleSubmit = async isDraft => {
    if (!validateBeforeSubmit()) return;

    setSubmitLoading(true);
    try {
      const payload = new FormData();
      payload.append('expenseName', formData.expenseName || '');
      payload.append('periodFrom', formData.periodFrom || '');
      payload.append('periodTo', formData.periodTo || '');
      payload.append('client', formData.client || '');
      payload.append('reference', formData.reference || '');
      payload.append('managerId', formData.managerId || '');
      payload.append('financeId', formData.financeId || '');
      payload.append('currency', formData.currency || '');
      payload.append('isAdvance', formData.isAdvance ? 'true' : 'false');
      payload.append('advanceAmount', formData.advanceAmount || '');
      payload.append('totalReimbursement', totalReimbursement || '0.00');
      payload.append('isDraft', isDraft ? 'true' : 'false');

      if (formData.bookingId) payload.append('bookingId', formData.bookingId);
      if (linkedDocuments && linkedDocuments.length) {
        payload.append('linkedDocuments', JSON.stringify(linkedDocuments));
      }

      formData.subExpenses.forEach((sub, i) => {
        payload.append(`documentDate-${i}`, sub.documentDate || '');
        payload.append(`expenseCategory-${i}`, sub.expenseCategory || '');
        payload.append(`expenseType-${i}`, sub.expenseType || '');
        payload.append(`gl_account-${i}`, sub.expenseType || '');
        payload.append(`vendor-${i}`, sub.vendor || '');
        payload.append(`amount-${i}`, sub.amount || '');
        payload.append(`description-${i}`, sub.description || '');

        sub.files.forEach(file => {
          let name = file.name || `file-${Date.now()}`;
          if (!name.includes('.')) {
            if (file.type === 'application/pdf') name = name + '.pdf';
            else if (file.type?.startsWith('image/')) name = name + '.jpg';
          }

          payload.append(`files-${i}`, {
            uri:
              Platform.OS === 'android'
                ? file.uri
                : file.uri.replace('file://', ''),
            type:
              file.type ||
              (name.endsWith('.pdf') ? 'application/pdf' : 'image/jpeg'),
            name,
          });
        });
      });

      const res = await axios.post(`${API_URL}/expenses/`, payload, {
        withCredentials: true,
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      console.log('submit response', res);

      if (res?.data?.success) {
        Toast.show({
          type: 'success',
          text1: res.data.message || 'Expense submitted successfully!',
        });
        queryClient.invalidateQueries({ queryKey: ['expenses'] });
        navigation.navigate('ExpensesList');
      } else {
        Toast.show({
          type: 'error',
          text1: res?.data?.message || 'Failed to submit expense',
        });
      }
    } catch (err) {
      console.error('submit error', err);
      Toast.show({
        type: 'error',
        text1: err.response?.data?.message || 'Error submitting expense',
      });
    } finally {
      setSubmitLoading(false);
    }
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <StatusBar barStyle="dark-content" backgroundColor={NAVY.screenBg} />
        <ActivityIndicator size="large" color={NAVY.primary} />
        <Text style={styles.loadingText}>Loading...</Text>
      </View>
    );
  }

  return (
    <SafeAreaView
      style={{ flex: 1, backgroundColor: NAVY.screenBg }}
      edges={['top', 'bottom']}
    >
      <StatusBar barStyle="dark-content" backgroundColor={NAVY.bg} />
      <ScrollView
        style={styles.container}
        contentContainerStyle={{ paddingBottom: 20 }}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.header}>
          <Text style={styles.title}>Create Expense</Text>
          <Text style={styles.subtitle}>Fill in the details below</Text>
          {formData.bookingId ? (
            <View style={styles.prefillRow}>
              <Text style={styles.prefillText}>Prefilled from booking</Text>
              <TouchableOpacity
                onPress={() =>
                  navigation.navigate('BookingDetails', {
                    id: formData.bookingId,
                  })
                }
                style={{ marginLeft: 8 }}
              >
                <Text style={styles.prefillLink}>View Booking</Text>
              </TouchableOpacity>
            </View>
          ) : null}
        </View>

        <View style={styles.formSection}>
          <Text style={styles.sectionTitle}>Basic Information</Text>

          <View style={styles.inputContainer}>
            <Text style={styles.inputLabel}>Expense Name *</Text>
            <TextInput
              style={styles.input}
              placeholder="Enter expense name"
              placeholderTextColor={NAVY.inactive}
              value={formData.expenseName}
              onChangeText={text => handleChange('expenseName', text)}
            />
          </View>

          <View style={{ flexDirection: 'row', gap: 8 }}>
            <View style={[styles.inputContainer, { flex: 1 }]}>
              <Text style={styles.inputLabel}>Period From</Text>
              <TouchableOpacity
                style={styles.input}
                onPress={() => {
                  setActiveDateField('periodFrom');
                  setTempDate(
                    formData.periodFrom
                      ? new Date(formData.periodFrom)
                      : new Date(),
                  );
                  setOpenDatePicker(true);
                }}
              >
                <Text
                  style={{
                    color: formData.periodFrom
                      ? NAVY.textPrimary
                      : NAVY.inactive,
                    fontSize: 14,
                  }}
                >
                  {formData.periodFrom || 'Select Start Date'}
                </Text>
              </TouchableOpacity>
            </View>

            <View style={[styles.inputContainer, { flex: 1 }]}>
              <Text style={styles.inputLabel}>Period To</Text>
              <TouchableOpacity
                style={styles.input}
                onPress={() => {
                  setActiveDateField('periodTo');
                  setTempDate(
                    formData.periodTo
                      ? new Date(formData.periodTo)
                      : new Date(),
                  );
                  setOpenDatePicker(true);
                }}
              >
                <Text
                  style={{
                    color: formData.periodTo ? NAVY.textPrimary : NAVY.inactive,
                    fontSize: 14,
                  }}
                >
                  {formData.periodTo || 'Select End Date'}
                </Text>
              </TouchableOpacity>
            </View>
          </View>

          <View style={styles.inputContainer}>
            <Text style={styles.inputLabel}>Client</Text>
            <StyledPicker
              value={formData.client}
              onChange={val => handleChange('client', val)}
              placeholder="Select Client"
              items={clients.map(c => ({ label: c.name, value: c._id }))}
            />
          </View>

          <View style={styles.inputContainer}>
            <Text style={styles.inputLabel}>Reference</Text>
            <TextInput
              style={styles.input}
              placeholder="Reference No."
              placeholderTextColor={NAVY.inactive}
              value={formData.reference}
              onChangeText={val => handleChange('reference', val)}
            />
          </View>

          {linkedDocuments.length > 0 && (
            <View style={styles.linkedDocsContainer}>
              <Text style={styles.inputLabel}>Linked Documents</Text>
              {linkedDocuments.map((doc, i) => (
                <View key={i} style={styles.linkedDocRow}>
                  <TouchableOpacity
                    onPress={() => openFile(doc)}
                    style={{ flex: 1 }}
                  >
                    <Text style={styles.linkedDocName} numberOfLines={1}>
                      {doc.name || doc.url || 'Document'}
                    </Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    onPress={() =>
                      setLinkedDocuments(prev =>
                        prev.filter((_, idx) => idx !== i),
                      )
                    }
                  >
                    <MaterialIcons name="close" size={18} color={NAVY.error} />
                  </TouchableOpacity>
                </View>
              ))}
            </View>
          )}

          <View style={styles.inputContainer}>
            <Text style={styles.inputLabel}>Manager *</Text>
            <StyledPicker
              value={formData.managerId}
              onChange={val => handleChange('managerId', val)}
              placeholder="Select Manager"
              items={managers.map(m => ({ label: m.name, value: m._id }))}
            />
          </View>

          <View style={styles.inputContainer}>
            <Text style={styles.inputLabel}>Finance *</Text>
            <StyledPicker
              value={formData.financeId}
              onChange={val => handleChange('financeId', val)}
              placeholder="Select Finance"
              items={financeUsers.map(f => ({ label: f.name, value: f._id }))}
            />
          </View>

          <View style={styles.inputContainer}>
            <Text style={styles.inputLabel}>Currency *</Text>
            <StyledPicker
              value={formData.currency}
              onChange={val => handleChange('currency', val)}
              placeholder="Select Currency"
              items={CURRENCIES.map(c => ({ label: c, value: c }))}
            />
          </View>

          <View style={styles.advanceRow}>
            <TouchableOpacity
              onPress={() => handleChange('isAdvance', !formData.isAdvance)}
              style={{ marginRight: 8 }}
              hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
            >
              <MaterialIcons
                name={
                  formData.isAdvance ? 'check-box' : 'check-box-outline-blank'
                }
                size={22}
                color={NAVY.primary}
              />
            </TouchableOpacity>

            <Text style={styles.inputLabel}>Advance Amount</Text>

            {formData.isAdvance && (
              <TextInput
                style={[
                  styles.input,
                  { marginLeft: 10, width: 90, paddingVertical: 8 },
                ]}
                placeholder="0.00"
                placeholderTextColor={NAVY.inactive}
                keyboardType="numeric"
                value={formData.advanceAmount}
                onChangeText={val => handleChange('advanceAmount', val)}
              />
            )}
          </View>
        </View>

        {/* Expense Items */}
        <View style={styles.formSection}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Expense Items</Text>
            <TouchableOpacity style={styles.addButton} onPress={addSubExpense}>
              <MaterialIcons name="add" size={18} color={NAVY.onPrimary} />
              <Text style={styles.addButtonText}>Add Item</Text>
            </TouchableOpacity>
          </View>

          {formData.subExpenses.map((sub, idx) => {
            const selectedCategory = categories.find(
              c => c._id === sub.expenseCategory,
            );
            const selectedType = selectedCategory?.subtypes?.find(
              st => st.gl_account === sub.expenseType,
            );

            return (
              <View key={idx} style={styles.subExpenseCard}>
                <View style={styles.cardHeader}>
                  <Text style={styles.cardTitle}>Item {idx + 1}</Text>
                  {formData.subExpenses.length > 1 && (
                    <TouchableOpacity
                      onPress={() => removeSubExpense(idx)}
                      style={styles.deleteButton}
                    >
                      <MaterialIcons
                        name="delete"
                        size={18}
                        color={NAVY.error}
                      />
                    </TouchableOpacity>
                  )}
                </View>

                <View style={styles.inputContainer}>
                  <Text style={styles.inputLabel}>Expense Date</Text>
                  <TouchableOpacity
                    style={styles.input}
                    onPress={() => {
                      setActiveDateIndex(idx);
                      setActiveDateField('documentDate');
                      setTempDate(
                        sub.documentDate
                          ? new Date(sub.documentDate)
                          : new Date(),
                      );
                      setOpenDatePicker(true);
                    }}
                  >
                    <Text
                      style={{
                        color: sub.documentDate
                          ? NAVY.textPrimary
                          : NAVY.inactive,
                        fontSize: 14,
                      }}
                    >
                      {sub.documentDate || 'Select Expense Date'}
                    </Text>
                  </TouchableOpacity>
                </View>

                <View style={styles.inputContainer}>
                  <Text style={styles.inputLabel}>Expense Category *</Text>
                  <StyledPicker
                    value={sub.expenseCategory}
                    onChange={val => handleChange('expenseCategory', val, idx)}
                    placeholder="Select Category"
                    items={categories.map(cat => ({
                      label: cat.name,
                      value: cat._id,
                    }))}
                  />
                </View>

                <View style={styles.inputContainer}>
                  <Text style={styles.inputLabel}>Expense Type *</Text>
                  <StyledPicker
                    value={sub.expenseType}
                    onChange={val => handleChange('expenseType', val, idx)}
                    placeholder="Select Type"
                    disabled={!sub.expenseCategory}
                    items={(selectedCategory?.subtypes || []).map(st => ({
                      label: st.name,
                      value: st.gl_account,
                    }))}
                  />
                </View>

                <View style={styles.inputContainer}>
                  <Text style={styles.inputLabel}>Vendor *</Text>
                  <StyledPicker
                    value={sub.vendor}
                    onChange={val => handleChange('vendor', val, idx)}
                    placeholder="Select Vendor"
                    disabled={!sub.expenseType}
                    items={(selectedType?.vendors || []).map(v => ({
                      label: v.name,
                      value: v.name,
                    }))}
                  />
                </View>

                <View style={styles.inputContainer}>
                  <Text style={styles.inputLabel}>Amount *</Text>
                  <TextInput
                    style={styles.input}
                    placeholder="0.00"
                    placeholderTextColor={NAVY.inactive}
                    keyboardType="numeric"
                    value={sub.amount?.toString() || ''}
                    onChangeText={val => handleChange('amount', val, idx)}
                  />
                </View>

                <View style={styles.inputContainer}>
                  <Text style={styles.inputLabel}>Description</Text>
                  <TextInput
                    style={styles.textarea}
                    placeholder="Optional description"
                    placeholderTextColor={NAVY.inactive}
                    value={sub.description}
                    onChangeText={val => handleChange('description', val, idx)}
                    multiline
                  />
                </View>

                <View style={styles.inputContainer}>
                  <Text style={styles.inputLabel}>Attachments</Text>
                  <TouchableOpacity
                    style={styles.fileButton}
                    onPress={() => pickFiles(idx)}
                  >
                    <MaterialIcons
                      name="attach-file"
                      size={18}
                      color={NAVY.onPrimary}
                    />
                    <Text style={styles.fileButtonText}>Add Files</Text>
                  </TouchableOpacity>

                  {sub.files.length > 0 && (
                    <View style={styles.fileListContainer}>
                      {sub.files.map((file, fidx) => (
                        <View key={fidx} style={styles.fileItem}>
                          <View style={styles.fileInfo}>
                            <MaterialIcons
                              name="insert-drive-file"
                              size={15}
                              color={NAVY.primary}
                            />
                            <Text style={styles.fileName} numberOfLines={1}>
                              {file.name}
                            </Text>
                          </View>
                          <TouchableOpacity
                            onPress={() => handleDeleteFile(idx, fidx)}
                            style={styles.fileDeleteButton}
                          >
                            <MaterialIcons
                              name="close"
                              size={15}
                              color={NAVY.error}
                            />
                          </TouchableOpacity>
                        </View>
                      ))}
                    </View>
                  )}
                </View>
              </View>
            );
          })}
        </View>

        {/* Total + Actions */}
        <View style={styles.formSection}>
          <View style={styles.inputContainer}>
            <Text style={styles.inputLabel}>Total Reimbursement</Text>
            <TextInput
              style={[styles.input, styles.totalInput]}
              value={totalReimbursement.toString()}
              editable={false}
            />
          </View>

          <View style={styles.actionSection}>
            <TouchableOpacity
              style={[styles.actionButton, styles.draftButton]}
              onPress={() => handleSubmit(true)}
            >
              <MaterialIcons name="save" size={18} color={NAVY.primary} />
              <Text style={[styles.actionButtonText, { color: NAVY.primary }]}>
                Save Draft
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.actionButton, styles.submitButton]}
              onPress={() => handleSubmit(false)}
              disabled={submitLoading}
            >
              {submitLoading ? (
                <ActivityIndicator size="small" color={NAVY.onPrimary} />
              ) : (
                <>
                  <MaterialIcons name="send" size={18} color={NAVY.onPrimary} />
                  <Text style={styles.actionButtonText}>Submit Expense</Text>
                </>
              )}
            </TouchableOpacity>
          </View>
        </View>

        <DatePicker
          modal
          open={openDatePicker}
          date={tempDate}
          mode="date"
          androidVariant="nativeAndroid"
          onConfirm={date => {
            setOpenDatePicker(false);

            const formatted = formatDate(date);

            if (activeDateField === 'documentDate') {
              handleChange('documentDate', formatted, activeDateIndex);
            }
            if (activeDateField === 'periodFrom') {
              handleChange('periodFrom', formatted);
            }
            if (activeDateField === 'periodTo') {
              handleChange('periodTo', formatted);
            }

            setActiveDateIndex(null);
            setActiveDateField(null);
          }}
          onCancel={() => {
            setOpenDatePicker(false);
            setActiveDateIndex(null);
            setActiveDateField(null);
          }}
        />

        <Toast />
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: NAVY.screenBg,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: NAVY.screenBg,
  },
  loadingText: {
    marginTop: 10,
    fontSize: 14,
    color: NAVY.inactive,
  },
  header: {
    padding: 14,
    paddingBottom: 12,
    backgroundColor: NAVY.bg,
    borderBottomWidth: 1,
    borderBottomColor: NAVY.border,
  },
  title: {
    fontSize: 17,
    fontWeight: '700',
    color: NAVY.primary,
    marginBottom: 3,
  },
  subtitle: {
    fontSize: 13,
    color: NAVY.inactive,
  },
  prefillRow: {
    marginTop: 6,
    flexDirection: 'row',
    alignItems: 'center',
  },
  prefillText: { color: NAVY.primary, fontSize: 12 },
  prefillLink: {
    color: NAVY.primary,
    fontSize: 12,
    textDecorationLine: 'underline',
    fontWeight: '600',
  },

  formSection: {
    margin: 14,
    marginBottom: 6,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  sectionTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: NAVY.textPrimary,
    marginBottom: 12,
  },
  inputContainer: {
    marginBottom: 10,
  },
  inputLabel: {
    fontSize: 13,
    fontWeight: '600',
    color: NAVY.textSecondary,
    marginBottom: 5,
  },
  input: {
    borderWidth: 1,
    borderColor: NAVY.border,
    borderRadius: 10,
    paddingVertical: 10,
    paddingHorizontal: 12,
    fontSize: 14,
    backgroundColor: NAVY.surface,
    color: NAVY.textPrimary,
  },
  totalInput: {
    fontWeight: '700',
    color: NAVY.primary,
    backgroundColor: '#F0F3FA',
  },
  linkedDocsContainer: {
    marginTop: 6,
    padding: 10,
    backgroundColor: NAVY.surface,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: NAVY.border,
  },
  linkedDocRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 6,
  },
  linkedDocName: {
    color: NAVY.primary,
    fontSize: 13,
    flex: 1,
    marginRight: 8,
  },
  textarea: {
    borderWidth: 1,
    borderColor: NAVY.border,
    borderRadius: 10,
    padding: 12,
    fontSize: 14,
    backgroundColor: NAVY.surface,
    color: NAVY.textPrimary,
    minHeight: 70,
    textAlignVertical: 'top',
  },
  pickerContainer: {
    borderWidth: 1,
    borderColor: NAVY.border,
    borderRadius: 10,
    backgroundColor: NAVY.surface,
    height: 48,
    paddingHorizontal: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  pickerSelected: {
    borderColor: '#A9B8D5',
    backgroundColor: '#FBFCFF',
  },
  pickerDisabled: {
    backgroundColor: '#F3F4F6',
    opacity: 0.65,
  },
  pickerValueRow: { flex: 1, flexDirection: 'row', alignItems: 'center' },
  pickerValue: {
    flex: 1,
    marginLeft: 9,
    color: NAVY.textPrimary,
    fontSize: 14,
    fontWeight: '500',
  },
  pickerPlaceholder: {
    color: NAVY.inactive,
    fontWeight: '400',
  },
  selectorBackdrop: {
    flex: 1,
    justifyContent: 'flex-end',
    backgroundColor: 'rgba(11, 31, 69, 0.52)',
  },
  selectorSheet: {
    maxHeight: '72%',
    minHeight: 280,
    backgroundColor: NAVY.surface,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    paddingHorizontal: 18,
    paddingTop: 10,
    paddingBottom: Platform.OS === 'ios' ? 32 : 22,
  },
  selectorHandle: {
    width: 42,
    height: 4,
    borderRadius: 2,
    backgroundColor: '#CBD2DE',
    alignSelf: 'center',
    marginBottom: 16,
  },
  selectorHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 14,
  },
  selectorHeading: { flex: 1 },
  selectorTitle: { fontSize: 19, fontWeight: '700', color: NAVY.primary },
  selectorCount: { marginTop: 3, fontSize: 12, color: NAVY.inactive },
  selectorClose: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#F1F3F7',
    alignItems: 'center',
    justifyContent: 'center',
  },
  selectorSearch: {
    height: 44,
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: NAVY.border,
    borderRadius: 11,
    paddingHorizontal: 12,
    marginBottom: 12,
    backgroundColor: '#F8F9FB',
  },
  selectorSearchInput: {
    flex: 1,
    height: '100%',
    marginLeft: 8,
    color: NAVY.textPrimary,
    fontSize: 14,
  },
  selectorList: { flexGrow: 0 },
  selectorOption: {
    minHeight: 58,
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 12,
    paddingHorizontal: 10,
    paddingVertical: 8,
    marginBottom: 7,
    borderWidth: 1,
    borderColor: '#EDF0F4',
    backgroundColor: '#FFFFFF',
  },
  selectorOptionSelected: {
    borderColor: '#A9B8D5',
    backgroundColor: '#EEF3FC',
  },
  selectorOptionIcon: {
    width: 36,
    height: 36,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#E8EDF7',
  },
  selectorOptionInitial: { color: NAVY.primary, fontSize: 14, fontWeight: '700' },
  selectorOptionText: {
    flex: 1,
    marginHorizontal: 11,
    color: NAVY.textSecondary,
    fontSize: 14,
    fontWeight: '500',
  },
  selectorOptionTextSelected: { color: NAVY.primary, fontWeight: '700' },
  selectorEmpty: { alignItems: 'center', paddingVertical: 30 },
  selectorEmptyText: { marginTop: 8, color: NAVY.inactive, fontSize: 13 },
  advanceRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
  },
  addButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: NAVY.primary,
    paddingHorizontal: 10,
    paddingVertical: 7,
    borderRadius: 10,
    ...CARD_SHADOW,
  },
  addButtonText: {
    color: NAVY.onPrimary,
    fontSize: 13,
    fontWeight: '600',
    marginLeft: 5,
  },
  subExpenseCard: {
    backgroundColor: NAVY.surface,
    borderRadius: 12,
    padding: 12,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: NAVY.border,
    ...CARD_SHADOW,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
    paddingBottom: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#F0F1F4',
  },
  cardTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: NAVY.primary,
  },
  deleteButton: {
    padding: 6,
    borderRadius: 8,
    backgroundColor: NAVY.errorBg,
  },
  fileButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: NAVY.primary,
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderRadius: 10,
  },
  fileButtonText: {
    color: NAVY.onPrimary,
    fontSize: 14,
    fontWeight: '600',
    marginLeft: 6,
  },
  fileListContainer: {
    marginTop: 10,
    borderTopWidth: 1,
    borderTopColor: '#F0F1F4',
    paddingTop: 10,
  },
  fileItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: NAVY.screenBg,
    padding: 10,
    borderRadius: 8,
    marginBottom: 6,
    borderWidth: 1,
    borderColor: NAVY.border,
  },
  fileInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  fileName: {
    flex: 1,
    marginLeft: 6,
    fontSize: 13,
    color: NAVY.textSecondary,
  },
  fileDeleteButton: {
    padding: 4,
    borderRadius: 4,
    backgroundColor: NAVY.errorBg,
  },
  actionSection: {
    padding: 10,
    paddingTop: 6,
    gap: 10,
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 13,
    borderRadius: 12,
  },
  actionButtonText: {
    color: NAVY.onPrimary,
    fontSize: 14,
    fontWeight: '700',
    marginLeft: 8,
  },
  draftButton: {
    backgroundColor: NAVY.surface,
    borderWidth: 1.5,
    borderColor: NAVY.primary,
  },
  submitButton: {
    backgroundColor: NAVY.primary,
  },
});

export default ExpenseFormScreen;
