// EditExpenseMobile.js
/* eslint-disable react-native/no-inline-styles */
import { pick, types } from '@react-native-documents/picker';
import { Picker } from '@react-native-picker/picker';
import { useNavigation, useRoute } from '@react-navigation/native';
import axios from 'axios';
import React, { useCallback, useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Image,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import Toast from 'react-native-toast-message';
import MaterialIcons from 'react-native-vector-icons/MaterialIcons';

import {
  CARD_SHADOW,
  ERROR_COLOR,
  INACTIVE_COLOR,
  LIGHT_BG,
  PRIMARY_COLOR,
} from '../theme/theme'; // adjust path if needed
import { CURRENCIES } from '../utils/constant'; // adjust path if needed

import { VITE_API_URL, VITE_IMAGE_URL } from '@env';

export default function EditExpenseMobile() {
  const navigation = useNavigation();
  const route = useRoute();
  const expenseId = route?.params?.id;

  const [loading, setLoading] = useState(true);
  const [submitLoading, setSubmitLoading] = useState(false);

  const [managers, setManagers] = useState([]);
  const [financeUsers, setFinanceUsers] = useState([]);
  const [clients, setClients] = useState([]);
  const [categories, setCategories] = useState([]); // expected shape: [{ _id, expense_category, expense_type, vendor }]
  const [form, setForm] = useState(null); // will hold fields same as web
  const [totalReimbursement, setTotalReimbursement] = useState('0.00');

  // Fetch users, clients, categories, expense
  const fetchAll = useCallback(async () => {
    setLoading(true);
    try {
      const [usersRes, expenseRes, clientsRes, categoriesRes] =
        await Promise.all([
          axios.get(`${VITE_API_URL}/users/get-organization-users`, {
            withCredentials: true,
          }),
          axios.get(`${VITE_API_URL}/expenses/get-expense/${expenseId}`, {
            withCredentials: true,
          }),
          axios.get(`${VITE_API_URL}/admin/get-all-clients`, {
            withCredentials: true,
          }),
          axios.get(`${VITE_API_URL}/admin/get-all-categories`, {
            withCredentials: true,
          }),
        ]);

      if (usersRes.data?.success) {
        setManagers(usersRes.data.data.managers || []);
        setFinanceUsers(usersRes.data.data.financeUsers || []);
      }

      if (clientsRes.data?.data) {
        setClients(clientsRes.data.data || []);
      }

      // categories assumed to return array of objects with fields:
      // expense_category, expense_type, vendor (vendor might be comma separated string)
      setCategories(
        Array.isArray(categoriesRes.data?.data) ? categoriesRes.data.data : [],
      );

      if (expenseRes.data?.success) {
        const e = expenseRes.data.data;

        // Normalize subExpenses so existing files are strings, new ones we will mark with isNew flag when added
        const normalizedSub = (e.subExpenses || []).map(se => ({
          _id: se._id,
          documentDate: se.documentDate || e.periodFrom || '',
          expenseCategory: se.expenseCategory || '',
          expenseType: se.expenseType || '',
          vendor: se.vendor || '',
          amount: se.amount ? String(se.amount) : '',
          comment: se.comment || se.description || '',
          files: se.files || [], // existing filenames (strings)
          managerApproval: se.managerApproval,
          financeApproval: se.financeApproval,
        }));

        setForm({
          expenseName: e.expenseName || '',
          periodFrom: e.periodFrom || '',
          periodTo: e.periodTo || '',
          client: e.client || e.clientId || '',
          reference: e.reference || e.referenceNo || e.referenceNo || '',
          managerId: e.managerId?._id || e.managerId || '',
          financeId: e.financeId?._id || e.financeId || '',
          currency: e.currency || '',
          isDraft: !!e.isDraft,
          subExpenses: normalizedSub.length
            ? normalizedSub
            : [
                {
                  documentDate: '',
                  expenseCategory: '',
                  expenseType: '',
                  vendor: '',
                  amount: '',
                  comment: '',
                  files: [],
                },
              ],
        });
      } else {
        Toast.show({ type: 'error', text1: 'Failed to fetch expense' });
      }
    } catch (err) {
      console.error('fetchAll error', err);
      Toast.show({ type: 'error', text1: 'Error fetching data' });
    } finally {
      setLoading(false);
    }
  }, [expenseId]);

  useEffect(() => {
    fetchAll();
  }, [fetchAll]);

  // Recalculate total
  useEffect(() => {
    if (!form) return;
    const total = form.subExpenses.reduce((acc, s) => {
      const v = parseFloat(String(s.amount || '').replace(/,/g, '')) || 0;
      return acc + v;
    }, 0);
    setTotalReimbursement(total.toFixed(2));
  }, [form]);

  // Helpers to mutate form
  const updateField = (name, value) => {
    setForm(prev => ({ ...prev, [name]: value }));
  };

  const updateSub = (index, key, value) => {
    setForm(prev => {
      const subs = [...(prev.subExpenses || [])];
      subs[index] = { ...subs[index], [key]: value };
      return { ...prev, subExpenses: subs };
    });
  };

  const addSubExpense = () => {
    setForm(prev => ({
      ...prev,
      subExpenses: [
        ...prev.subExpenses,
        {
          documentDate: '',
          expenseCategory: '',
          expenseType: '',
          vendor: '',
          amount: '',
          comment: '',
          files: [],
        },
      ],
    }));
  };

  const removeSubExpense = index => {
    setForm(prev => {
      const subs = [...prev.subExpenses];
      subs.splice(index, 1);
      return { ...prev, subExpenses: subs };
    });
  };

  // Pick files for a subexpense
  const pickFiles = async index => {
    try {
      const results = await pick({
        type: [types.allFiles],
        allowMultiSelection: true,
      });

      // results items: { uri, name, size, type, fileCopyUri }
      setForm(prev => {
        const subs = [...prev.subExpenses];
        const newFiles = results.map(f => ({
          uri: f.uri,
          name: f.name,
          type: f.type,
          size: f.size,
          isNew: true,
        }));
        subs[index].files = [...(subs[index].files || []), ...newFiles];
        return { ...prev, subExpenses: subs };
      });
    } catch (err) {
      if (err?.code !== 'CANCELLED') {
        console.error('pickFiles err', err);
        Toast.show({ type: 'error', text1: 'Error picking files' });
      }
    }
  };

  // Delete a file: existing string fileName will call backend deletion, new files just removed locally
  const deleteFile = async (subIndex, fileIndex) => {
    const target = form.subExpenses[subIndex].files[fileIndex];
    const isExisting = typeof target === 'string';

    if (isExisting) {
      // confirm
      Alert.alert('Delete file', 'Delete this file from server?', [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              const fileName = target;
              const res = await axios.delete(
                `${VITE_API_URL}/expenses/delete-expense-file`,
                {
                  data: { expenseId, fileName },
                  withCredentials: true,
                },
              );
              if (res.data?.success) {
                Toast.show({ type: 'success', text1: 'File deleted' });
                setForm(prev => {
                  const subs = [...prev.subExpenses];
                  subs[subIndex].files = subs[subIndex].files.filter(
                    (_, i) => i !== fileIndex,
                  );
                  return { ...prev, subExpenses: subs };
                });
              } else {
                Toast.show({
                  type: 'error',
                  text1: res.data?.message || 'Delete failed',
                });
              }
            } catch (err) {
              console.error('deleteFile err', err);
              Toast.show({ type: 'error', text1: 'Error deleting file' });
            }
          },
        },
      ]);
    } else {
      // remove new file locally
      setForm(prev => {
        const subs = [...prev.subExpenses];
        subs[subIndex].files = subs[subIndex].files.filter(
          (_, i) => i !== fileIndex,
        );
        return { ...prev, subExpenses: subs };
      });
    }
  };

  // Compute types list filtered by selected category
  const getTypesForCategory = category => {
    if (!category) return [];
    // categories entries may be duplicate; web filtered by item.expense_category === selectedCategory
    return categories
      .filter(c => c.expense_category === category)
      .map(c => c.expense_type);
  };

  // Compute vendor options for selected expenseType
  const getVendorsForType = expenseType => {
    if (!expenseType) return [];
    const found = categories.find(c => c.expense_type === expenseType);
    if (!found || !found.vendor) return [];
    // vendor likely comma separated
    return String(found.vendor)
      .split(',')
      .map(v => v.trim())
      .filter(Boolean);
  };

  // Submit update
  const handleSubmit = async () => {
    if (!form) return;
    setSubmitLoading(true);

    try {
      const payload = new FormData();

      payload.append('expenseName', form.expenseName || '');
      payload.append('periodFrom', form.periodFrom || '');
      payload.append('periodTo', form.periodTo || '');
      payload.append('client', form.client || '');
      payload.append('reference', form.reference || '');
      payload.append('managerId', form.managerId || '');
      payload.append('financeId', form.financeId || '');
      payload.append('currency', form.currency || '');
      payload.append('totalReimbursement', totalReimbursement || '0');

      // append subExpenses with same naming pattern as web
      form.subExpenses.forEach((se, idx) => {
        payload.append(`documentDate-${idx}`, se.documentDate || '');
        payload.append(`expenseCategory-${idx}`, se.expenseCategory || '');
        payload.append(`expenseType-${idx}`, se.expenseType || '');
        payload.append(`vendor-${idx}`, se.vendor || '');
        payload.append(`amount-${idx}`, se.amount || '');
        payload.append(`comment-${idx}`, se.comment || '');

        // files: either existing strings (we don't re-send existing) or new files appended `files-${idx}`
        (se.files || []).forEach(f => {
          if (f && typeof f === 'object' && f.isNew) {
            // file object from pick: need to send { uri, name, type }
            const name = f.name || `file-${idx}`;
            payload.append(`files-${idx}`, {
              uri:
                Platform.OS === 'android'
                  ? f.uri
                  : f.uri.replace('file://', ''),
              type: f.type || 'application/octet-stream',
              name,
            });
          }
        });
      });

      const res = await axios.put(
        `${VITE_API_URL}/expenses/edit-expense/${expenseId}`,
        payload,
        {
          withCredentials: true,
          headers: { 'Content-Type': 'multipart/form-data' },
        },
      );

      if (res.data?.success) {
        Toast.show({
          type: 'success',
          text1: res.data.message || 'Expense updated',
        });
        navigation.goBack();
      } else {
        Toast.show({
          type: 'error',
          text1: res.data?.message || 'Update failed',
        });
      }
    } catch (err) {
      console.error('submit err', err);
      Toast.show({
        type: 'error',
        text1: err.response?.data?.message || 'Error updating',
      });
    } finally {
      setSubmitLoading(false);
    }
  };

  if (loading || !form) {
    return (
      <View style={styles.loadingWrap}>
        <ActivityIndicator size="large" color={PRIMARY_COLOR} />
        <Text style={styles.loadingText}>Loading expense...</Text>
      </View>
    );
  }

  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Basic Information</Text>

        <Text style={styles.label}>Expense Name *</Text>
        <TextInput
          style={styles.input}
          value={form.expenseName}
          onChangeText={t => updateField('expenseName', t)}
          placeholder="Expense Title"
        />

        <View style={styles.row}>
          <View style={{ flex: 1, marginRight: 8 }}>
            <Text style={styles.label}>Period From</Text>
            <TextInput
              style={styles.input}
              value={form.periodFrom?.split?.('T')?.[0] || form.periodFrom}
              onChangeText={t => updateField('periodFrom', t)}
              placeholder="YYYY-MM-DD"
            />
          </View>

          <View style={{ flex: 1 }}>
            <Text style={styles.label}>Period To</Text>
            <TextInput
              style={styles.input}
              value={form.periodTo?.split?.('T')?.[0] || form.periodTo}
              onChangeText={t => updateField('periodTo', t)}
              placeholder="YYYY-MM-DD"
            />
          </View>
        </View>

        <Text style={styles.label}>Currency *</Text>
        <View style={styles.pickerWrap}>
          <Picker
            selectedValue={form.currency}
            onValueChange={v => updateField('currency', v)}
          >
            <Picker.Item
              label="Select currency"
              value=""
              color={INACTIVE_COLOR}
            />
            {CURRENCIES.map(c => (
              <Picker.Item key={c} label={c} value={c} />
            ))}
          </Picker>
        </View>

        <Text style={styles.label}>Total Reimbursement</Text>
        <TextInput
          style={[styles.input, styles.disabledInput]}
          value={totalReimbursement}
          editable={false}
        />

        <Text style={styles.label}>Client</Text>
        <View style={styles.pickerWrap}>
          <Picker
            selectedValue={form.client}
            onValueChange={v => updateField('client', v)}
          >
            <Picker.Item
              label="Select client"
              value=""
              color={INACTIVE_COLOR}
            />
            {clients.map(c => (
              <Picker.Item key={c._id} label={c.name} value={c._id} />
            ))}
          </Picker>
        </View>

        <Text style={styles.label}>Reference</Text>
        <TextInput
          style={styles.input}
          value={form.reference}
          onChangeText={t => updateField('reference', t)}
        />

        <Text style={styles.label}>Manager</Text>
        <View style={styles.pickerWrap}>
          <Picker
            selectedValue={form.managerId}
            onValueChange={v => updateField('managerId', v)}
          >
            <Picker.Item
              label="Select manager"
              value=""
              color={INACTIVE_COLOR}
            />
            {managers.map(m => (
              <Picker.Item key={m._id} label={m.name} value={m._id} />
            ))}
          </Picker>
        </View>

        <Text style={styles.label}>Finance</Text>
        <View style={styles.pickerWrap}>
          <Picker
            selectedValue={form.financeId}
            onValueChange={v => updateField('financeId', v)}
          >
            <Picker.Item
              label="Select finance"
              value=""
              color={INACTIVE_COLOR}
            />
            {financeUsers.map(f => (
              <Picker.Item key={f._id} label={f.name} value={f._1d} />
            ))}
            {financeUsers.map(f => (
              <Picker.Item key={f._id} label={f.name} value={f._id} />
            ))}
          </Picker>
        </View>
      </View>

      <View style={styles.section}>
        <View
          style={[
            styles.row,
            { alignItems: 'center', justifyContent: 'space-between' },
          ]}
        >
          <Text style={styles.sectionTitle}>Sub-Expenses</Text>
          <TouchableOpacity style={styles.addItemBtn} onPress={addSubExpense}>
            <MaterialIcons name="add" size={18} color="#fff" />
            <Text style={styles.addItemText}>Add Item</Text>
          </TouchableOpacity>
        </View>

        {form.subExpenses.map((se, idx) => (
          <View key={idx} style={styles.subCard}>
            <View style={styles.subCardHeader}>
              <Text style={styles.subTitle}>Item {idx + 1}</Text>
              <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                <Text style={styles.subAmount}>
                  {se.amount ? se.amount : ''}
                </Text>
                {form.subExpenses.length > 1 && (
                  <TouchableOpacity
                    onPress={() => removeSubExpense(idx)}
                    style={styles.removeBtn}
                  >
                    <MaterialIcons
                      name="delete"
                      size={18}
                      color={ERROR_COLOR}
                    />
                  </TouchableOpacity>
                )}
              </View>
            </View>

            <Text style={styles.label}>Expense Date</Text>
            <TextInput
              style={styles.input}
              value={se.documentDate?.split?.('T')?.[0] || se.documentDate}
              onChangeText={t => updateSub(idx, 'documentDate', t)}
              placeholder="YYYY-MM-DD"
            />

            <Text style={styles.label}>Category</Text>
            <View style={styles.pickerWrap}>
              <Picker
                selectedValue={se.expenseCategory}
                onValueChange={v => {
                  updateSub(idx, 'expenseCategory', v);
                  // clear dependent fields
                  updateSub(idx, 'expenseType', '');
                  updateSub(idx, 'vendor', '');
                }}
              >
                <Picker.Item
                  label="Select category"
                  value=""
                  color={INACTIVE_COLOR}
                />
                {Array.from(
                  new Set(categories.map(c => c.expense_category)),
                ).map(cg => (
                  <Picker.Item key={cg} label={cg} value={cg} />
                ))}
              </Picker>
            </View>

            <Text style={styles.label}>Type</Text>
            <View style={styles.pickerWrap}>
              <Picker
                selectedValue={se.expenseType}
                onValueChange={v => {
                  updateSub(idx, 'expenseType', v);
                  updateSub(idx, 'vendor', '');
                }}
              >
                <Picker.Item
                  label="Select type"
                  value=""
                  color={INACTIVE_COLOR}
                />
                {getTypesForCategory(se.expenseCategory).map(tp => (
                  <Picker.Item key={tp} label={tp} value={tp} />
                ))}
              </Picker>
            </View>

            <Text style={styles.label}>Vendor</Text>
            <View style={styles.pickerWrap}>
              <Picker
                selectedValue={se.vendor}
                onValueChange={v => updateSub(idx, 'vendor', v)}
              >
                <Picker.Item
                  label="Select vendor"
                  value=""
                  color={INACTIVE_COLOR}
                />
                {getVendorsForType(se.expenseType).map(vn => (
                  <Picker.Item key={vn} label={vn} value={vn} />
                ))}
              </Picker>
            </View>

            <Text style={styles.label}>Amount</Text>
            <TextInput
              style={styles.input}
              keyboardType="numeric"
              value={String(se.amount || '')}
              onChangeText={t => updateSub(idx, 'amount', t)}
            />

            <Text style={styles.label}>Comment</Text>
            <TextInput
              style={styles.input}
              value={se.comment}
              onChangeText={t => updateSub(idx, 'comment', t)}
            />

            <Text style={[styles.label, { marginTop: 8 }]}>Attachments</Text>

            {(se.files || []).map((f, fi) => {
              const isExisting = typeof f === 'string';
              const fileName = isExisting ? f : f.name || 'file';
              const fileUrl = isExisting
                ? `${VITE_IMAGE_URL}/expenses/${f}`
                : f.uri;
              const isImage = /\.(jpe?g|png|gif)$/i.test(fileName);
              return (
                <View key={fi} style={styles.fileRow}>
                  <TouchableOpacity
                    onPress={() => {
                      // open link for existing files
                      if (isExisting) {
                        // open URL
                        // Linking.openURL(fileUrl)
                      } else {
                        // maybe preview new file - skip
                      }
                    }}
                    style={styles.filePreview}
                  >
                    {isImage ? (
                      <Image
                        source={{ uri: fileUrl }}
                        style={styles.fileThumb}
                      />
                    ) : (
                      <MaterialIcons
                        name="picture-as-pdf"
                        size={28}
                        color="#EF4444"
                      />
                    )}
                    <Text style={styles.fileName} numberOfLines={1}>
                      {fileName}
                    </Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    onPress={() => deleteFile(idx, fi)}
                    style={styles.deleteFileBtn}
                  >
                    <MaterialIcons name="close" size={18} color={ERROR_COLOR} />
                  </TouchableOpacity>
                </View>
              );
            })}

            <TouchableOpacity
              style={styles.pickBtn}
              onPress={() => pickFiles(idx)}
            >
              <MaterialIcons name="attach-file" size={18} color="#fff" />
              <Text style={styles.pickBtnText}>Add Files</Text>
            </TouchableOpacity>
          </View>
        ))}
      </View>

      <View style={[styles.section, { marginBottom: 40 }]}>
        <Text style={styles.finalTotal}>
          Total: {totalReimbursement} {form.currency || ''}
        </Text>

        <View style={{ flexDirection: 'row', gap: 12 }}>
          <TouchableOpacity
            style={[styles.actionBtn, styles.cancelBtn]}
            onPress={() => navigation.goBack()}
          >
            <Text style={styles.actionText}>Cancel</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.actionBtn, styles.saveBtn]}
            onPress={handleSubmit}
            disabled={submitLoading}
          >
            {submitLoading ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <Text style={styles.actionText}>Update Expense</Text>
            )}
          </TouchableOpacity>
        </View>
      </View>

      <Toast />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: LIGHT_BG },
  loadingWrap: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 20,
    backgroundColor: LIGHT_BG,
  },
  loadingText: { marginTop: 12, color: INACTIVE_COLOR },

  section: {
    margin: 16,
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 12,
    ...CARD_SHADOW,
  },
  sectionTitle: { fontSize: 18, fontWeight: '700', marginBottom: 8 },
  label: { fontSize: 13, color: '#374151', marginTop: 8, marginBottom: 6 },

  input: {
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderRadius: 10,
    padding: 12,
    fontSize: 15,
    backgroundColor: '#fff',
    color: '#111827',
  },
  disabledInput: { backgroundColor: '#F3F4F6', color: '#6B7280' },

  row: { flexDirection: 'row', alignItems: 'center' },

  pickerWrap: {
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderRadius: 10,
    overflow: 'hidden',
    backgroundColor: '#fff',
  },

  addItemBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: PRIMARY_COLOR,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 20,
  },
  addItemText: { color: '#fff', marginLeft: 8, fontWeight: '700' },

  subCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 12,
    marginTop: 12,
    borderWidth: 1,
    borderColor: '#F3F4F6',
  },
  subCardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  subTitle: { fontWeight: '700', color: '#111827' },
  removeBtn: { marginLeft: 8, padding: 6 },

  subAmount: { color: PRIMARY_COLOR, fontWeight: '700', marginRight: 8 },

  fileRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 8,
  },
  filePreview: { flexDirection: 'row', alignItems: 'center', flex: 1 },
  fileThumb: {
    width: 48,
    height: 48,
    borderRadius: 8,
    marginRight: 8,
    backgroundColor: '#F3F4F6',
  },
  fileName: { flex: 1, marginLeft: 8 },

  deleteFileBtn: { padding: 8 },

  pickBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: PRIMARY_COLOR,
    padding: 10,
    borderRadius: 8,
    marginTop: 8,
  },
  pickBtnText: { color: '#fff', marginLeft: 8 },

  finalTotal: {
    fontSize: 16,
    fontWeight: '800',
    textAlign: 'right',
    marginBottom: 12,
  },

  actionBtn: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: 'center',
  },
  cancelBtn: { backgroundColor: '#9CA3AF', marginRight: 8 },
  saveBtn: { backgroundColor: PRIMARY_COLOR },
  actionText: { color: '#fff', fontWeight: '700' },
});
