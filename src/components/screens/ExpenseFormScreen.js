import { pick, types } from '@react-native-documents/picker';
import { Picker } from '@react-native-picker/picker';
import { useNavigation } from '@react-navigation/native';
import { useQueryClient } from '@tanstack/react-query';
import axios from 'axios';
import React, { useEffect, useState } from 'react';
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

// replace or keep these constants as you already have them
import {
  CARD_SHADOW,
  ERROR_COLOR,
  INACTIVE_COLOR,
  LIGHT_BG,
  PRIMARY_COLOR,
  WARNING_COLOR,
} from '../theme/theme';
import { CURRENCIES } from '../utils/constant';
const { VITE_API_URL } = process.env; // or import { VITE_API_URL } from '@env';

const formatDate = date => {
  return date.toISOString().split('T')[0];
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
      {/* Placeholder overlay */}
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
        {/* Hidden placeholder item */}
        <Picker.Item label={placeholder} value="" />
        {items.map(item => (
          <Picker.Item key={item.value} label={item.label} value={item.value} />
        ))}
      </Picker>
    </View>
  );
};

const ExpenseFormScreen = () => {
  const navigation = useNavigation();
  const queryClient = useQueryClient();
  const [openDatePicker, setOpenDatePicker] = useState(false);
  const [activeDateIndex, setActiveDateIndex] = useState(null);
  const [activeDateField, setActiveDateField] = useState(null);
  const [tempDate, setTempDate] = useState(new Date());

  const [loading, setLoading] = useState(true);
  const [submitLoading, setSubmitLoading] = useState(false);

  // master data
  const [managers, setManagers] = useState([]);
  const [financeUsers, setFinanceUsers] = useState([]);
  const [categories, setCategories] = useState([]);
  const [clients, setClients] = useState([]);

  const [totalReimbursement, setTotalReimbursement] = useState('0.00');

  const [formData, setFormData] = useState({
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

  useEffect(() => {
    const fetchAll = async () => {
      try {
        const usersReq = axios.get(
          `${VITE_API_URL}/users/get-organization-users`,
          {
            withCredentials: true,
          },
        );
        const catReq = axios.get(`${VITE_API_URL}/admin/get-all-categories`, {
          withCredentials: true,
        });
        const clientsReq = axios.get(`${VITE_API_URL}/admin/get-all-clients`, {
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

  // recalc total
  useEffect(() => {
    let total = 0;
    formData.subExpenses.forEach(s => {
      const n = parseFloat(s.amount);
      if (!isNaN(n)) total += n;
    });
    setTotalReimbursement(total.toFixed(2));
  }, [formData.subExpenses]);

  const handleChange = (name, value, index = null) => {
    // index !== null => subExpense field
    if (index !== null) {
      const updated = [...formData.subExpenses];
      // If changing category, reset expenseType and vendor
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
      // top-level change
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
    // each subExpense must have at least one file
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
    // other validations can be added here (dates, manager, finance, currency etc.)
    return true;
  };

  const handleSubmit = async isDraft => {
    // guard
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

      formData.subExpenses.forEach((sub, i) => {
        payload.append(`documentDate-${i}`, sub.documentDate || '');
        payload.append(`expenseCategory-${i}`, sub.expenseCategory || '');
        // here we send expenseType as GL account (web does gl_account for subtype in web code)
        payload.append(`expenseType-${i}`, sub.expenseType || '');
        payload.append(`gl_account-${i}`, sub.expenseType || '');
        payload.append(`vendor-${i}`, sub.vendor || '');
        payload.append(`amount-${i}`, sub.amount || '');
        payload.append(`description-${i}`, sub.description || '');

        sub.files.forEach(file => {
          // On Android/IOS we pass object with uri,type,name
          let name = file.name || `file-${Date.now()}`;
          // if name missing extension, attempt to fix
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

      const res = await axios.post(`${VITE_API_URL}/expenses/`, payload, {
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
        <ActivityIndicator size="large" color={PRIMARY_COLOR} />
        <Text style={styles.loadingText}>Loading...</Text>
      </View>
    );
  }

  return (
    <SafeAreaView style={{ flex: 1 }}>
      <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
        <View style={styles.header}>
          <Text style={styles.title}>Create Expense</Text>
          <Text style={styles.subtitle}>Fill in the details below</Text>
        </View>

        <View style={styles.formSection}>
          <Text style={styles.sectionTitle}>Basic Information</Text>

          <View style={styles.inputContainer}>
            <Text style={styles.inputLabel}>Expense Name *</Text>
            <TextInput
              style={styles.input}
              placeholder="Enter expense name"
              placeholderTextColor={INACTIVE_COLOR}
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
                    color: formData.periodFrom ? '#111827' : INACTIVE_COLOR,
                    fontSize: 16,
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
                    color: formData.periodTo ? '#111827' : INACTIVE_COLOR,
                    fontSize: 16,
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
              items={clients.map(c => ({
                label: c.name,
                value: c._id,
              }))}
            />
          </View>

          <View style={styles.inputContainer}>
            <Text style={styles.inputLabel}>Reference</Text>
            <TextInput
              style={styles.input}
              placeholder="Reference No."
              placeholderTextColor={INACTIVE_COLOR}
              value={formData.reference}
              onChangeText={val => handleChange('reference', val)}
            />
          </View>

          <View style={styles.inputContainer}>
            <Text style={styles.inputLabel}>Manager *</Text>
            <StyledPicker
              value={formData.managerId}
              onChange={val => handleChange('managerId', val)}
              placeholder="Select Manager"
              items={managers.map(m => ({
                label: m.name,
                value: m._id,
              }))}
            />
          </View>

          <View style={styles.inputContainer}>
            <Text style={styles.inputLabel}>Finance *</Text>
            <StyledPicker
              value={formData.financeId}
              onChange={val => handleChange('financeId', val)}
              placeholder="Select Finance"
              items={financeUsers.map(f => ({
                label: f.name,
                value: f._id,
              }))}
            />
          </View>

          <View style={styles.inputContainer}>
            <Text style={styles.inputLabel}>Currency *</Text>
            <StyledPicker
              value={formData.currency}
              onChange={val => handleChange('currency', val)}
              placeholder="Select Currency"
              items={CURRENCIES.map(c => ({
                label: c,
                value: c,
              }))}
            />
          </View>

          <View
            style={{
              flexDirection: 'row',
              alignItems: 'center',
              marginBottom: 12,
            }}
          >
            <TouchableOpacity
              onPress={() => handleChange('isAdvance', !formData.isAdvance)}
              style={{ marginRight: 8 }}
            >
              <MaterialIcons
                name={
                  formData.isAdvance ? 'check-box' : 'check-box-outline-blank'
                }
                size={24}
                color={PRIMARY_COLOR}
              />
            </TouchableOpacity>

            <Text style={styles.inputLabel}>Advance Amount</Text>

            {formData.isAdvance && (
              <TextInput
                style={[styles.input, { marginLeft: 10, width: 140 }]}
                placeholder="0.00"
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
              <MaterialIcons name="add" size={20} color="#fff" />
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
                        size={20}
                        color={ERROR_COLOR}
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
                        color: sub.documentDate ? '#111827' : INACTIVE_COLOR,
                        fontSize: 16,
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
                    placeholderTextColor={INACTIVE_COLOR}
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
                    <MaterialIcons name="attach-file" size={20} color="#fff" />
                    <Text style={styles.fileButtonText}>Add Files</Text>
                  </TouchableOpacity>

                  {sub.files.length > 0 && (
                    <View style={styles.fileListContainer}>
                      {sub.files.map((file, fidx) => (
                        <View key={fidx} style={styles.fileItem}>
                          <View style={styles.fileInfo}>
                            <MaterialIcons
                              name="insert-drive-file"
                              size={16}
                              color={PRIMARY_COLOR}
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
                              size={16}
                              color={ERROR_COLOR}
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
              style={styles.input}
              value={totalReimbursement.toString()}
              editable={false}
            />
          </View>

          <View style={styles.actionSection}>
            <TouchableOpacity
              style={[styles.actionButton, styles.draftButton]}
              onPress={() => handleSubmit(true)}
            >
              <MaterialIcons name="save" size={20} color="#fff" />
              <Text style={styles.actionButtonText}>Save Draft</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.actionButton, styles.submitButton]}
              onPress={() => handleSubmit(false)}
              disabled={submitLoading}
            >
              {submitLoading ? (
                <ActivityIndicator size="small" color="#fff" />
              ) : (
                <>
                  <MaterialIcons name="send" size={20} color="#fff" />
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
    backgroundColor: LIGHT_BG,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: LIGHT_BG,
  },
  loadingText: {
    marginTop: 12,
    fontSize: 16,
    color: INACTIVE_COLOR,
  },
  header: {
    padding: 20,
    paddingBottom: 16,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: PRIMARY_COLOR,
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 16,
    color: INACTIVE_COLOR,
  },
  formSection: {
    margin: 16,
    marginBottom: 8,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#1F2937',
    marginBottom: 16,
  },
  inputContainer: {
    marginBottom: 12,
  },
  inputLabel: {
    fontSize: 14,
    fontWeight: '500',
    color: '#374151',
    marginBottom: 6,
  },
  input: {
    borderWidth: 1.5,
    borderColor: '#D1D5DB',
    borderRadius: 12,
    padding: 12,
    fontSize: 16,
    backgroundColor: '#fff',
    color: '#1F2937',
    ...CARD_SHADOW,
  },
  textarea: {
    borderWidth: 1.5,
    borderColor: '#D1D5DB',
    borderRadius: 12,
    padding: 12,
    fontSize: 16,
    backgroundColor: '#fff',
    color: '#1F2937',
    minHeight: 80,
    textAlignVertical: 'top',
    ...CARD_SHADOW,
  },
  pickerContainer: {
    borderWidth: 1.5,
    borderColor: '#D1D5DB',
    borderRadius: 12,
    backgroundColor: '#fff',
    justifyContent: 'center',
    height: 56,
    paddingHorizontal: 12,
    ...CARD_SHADOW,
  },
  picker: {
    color: '#111827',
    height: 56,
    width: '100%',
  },
  dropdownIcon: {
    position: 'absolute',
    right: 12,
    pointerEvents: 'none',
  },
  addButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: PRIMARY_COLOR,
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    ...CARD_SHADOW,
  },
  addButtonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
    marginLeft: 6,
  },
  subExpenseCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    ...CARD_SHADOW,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
    paddingBottom: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: PRIMARY_COLOR,
  },
  deleteButton: {
    padding: 8,
    borderRadius: 8,
    backgroundColor: '#FEF2F2',
  },
  fileButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: PRIMARY_COLOR,
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 10,
    ...CARD_SHADOW,
  },
  fileButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
    marginLeft: 8,
  },
  fileListContainer: {
    marginTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#F3F4F6',
    paddingTop: 12,
  },
  fileItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#F9FAFB',
    padding: 12,
    borderRadius: 8,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  fileInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  fileName: {
    flex: 1,
    marginLeft: 8,
    fontSize: 14,
    color: '#374151',
  },
  fileDeleteButton: {
    padding: 4,
    borderRadius: 4,
    backgroundColor: '#FEF2F2',
  },
  actionSection: {
    padding: 16,
    paddingTop: 8,
    gap: 12,
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 14,
    borderRadius: 12,
    ...CARD_SHADOW,
    marginBottom: 8,
  },
  actionButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
    marginLeft: 8,
  },
  draftButton: {
    backgroundColor: INACTIVE_COLOR,
  },
  submitButton: {
    backgroundColor: WARNING_COLOR,
  },
});

export default ExpenseFormScreen;
