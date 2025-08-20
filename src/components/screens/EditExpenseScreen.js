import { VITE_API_URL } from '@env';
import { pick, types } from '@react-native-documents/picker';
import { Picker } from '@react-native-picker/picker';
import { useNavigation, useRoute } from '@react-navigation/native';
import axios from 'axios';
import { useEffect, useState } from 'react';
import {
  ActivityIndicator,
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
  WARNING_COLOR,
} from '../theme/theme';
import { CURRENCIES } from '../utils/constant';

const EditExpenseScreen = () => {
  const navigation = useNavigation();
  const route = useRoute();
  const expenseId = route.params.id;
  const [loading, setLoading] = useState(true);
  const [managers, setManagers] = useState([]);
  const [financeUsers, setFinanceUsers] = useState([]);
  const [formData, setFormData] = useState(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [usersRes, expenseRes] = await Promise.all([
          axios.get(`${VITE_API_URL}/users/get-organization-users`, {
            withCredentials: true,
          }),
          axios.get(`${VITE_API_URL}/expenses/get-expense/${expenseId}`, {
            withCredentials: true,
          }),
        ]);

        if (usersRes.data.success) {
          setManagers(usersRes.data.data.managers);
          setFinanceUsers(usersRes.data.data.financeUsers);
        }

        if (expenseRes.data.success) {
          const exp = expenseRes.data.data;

          setFormData({
            expenseName: exp.expenseName,
            managerId: exp.managerId?._id || '',
            financeId: exp.financeId?._id || '',
            currency: exp.currency,
            subExpenses: exp.subExpenses.map(se => ({
              expenseType: se.expenseType,
              expenseName: se.expenseName,
              amount: String(se.amount),
              description: se.description,
              files: se.files || [],
            })),
          });
        }
      } catch (err) {
        Toast.show({ type: 'error', text1: 'Error fetching expense details' });
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [expenseId]);

  const handleChange = (name, value, index = null) => {
    if (!formData) return;
    if (index !== null) {
      const updatedSubExpenses = [...formData.subExpenses];
      updatedSubExpenses[index][name] = value;
      setFormData({ ...formData, subExpenses: updatedSubExpenses });
    } else {
      setFormData({ ...formData, [name]: value });
    }
  };

  const addSubExpense = () => {
    if (!formData) return;
    setFormData({
      ...formData,
      subExpenses: [
        ...formData.subExpenses,
        {
          expenseType: '',
          expenseName: '',
          amount: '',
          description: '',
          files: [],
        },
      ],
    });
  };

  const removeSubExpense = index => {
    if (!formData) return;
    const updated = formData.subExpenses.filter((_, i) => i !== index);
    setFormData({ ...formData, subExpenses: updated });
  };

  const pickFiles = async index => {
    try {
      const results = await pick({
        type: [types.allFiles],
        allowMultiSelection: true,
      });

      const updatedSubExpenses = [...formData.subExpenses];

      updatedSubExpenses[index].files = [
        ...updatedSubExpenses[index].files,
        ...results.map(file => ({
          uri: file.uri,
          type: file.type,
          name: file.name,
          size: file.size,
          fileCopyUri: file.fileCopyUri,
          isNew: true,
        })),
      ];

      setFormData({ ...formData, subExpenses: updatedSubExpenses });
    } catch (err) {
      if (err.code === 'CANCELLED') {
        // User canceled the picker
      } else {
        console.error(err);
        Toast.show({ type: 'error', text1: 'Error picking files' });
      }
    }
  };

  const handleDeleteFile = async (
    subExpenseIndex,
    fileIndex,
    isExistingFile,
    fileName,
  ) => {
    if (!formData) return;
    if (isExistingFile) {
      try {
        const response = await axios.delete(
          `${VITE_API_URL}/expenses/delete-expense-file`,
          {
            data: { expenseId, fileName },
            withCredentials: true,
          },
        );
        if (response.data.success) {
          Toast.show({
            type: 'success',
            text1: 'File deleted successfully',
          });
          const updatedSubExpenses = [...formData.subExpenses];
          updatedSubExpenses[subExpenseIndex].files = updatedSubExpenses[
            subExpenseIndex
          ].files.filter((_, i) => i !== fileIndex);
          setFormData({
            ...formData,
            subExpenses: updatedSubExpenses,
          });
        }
      } catch (error) {
        Toast.show({
          type: 'error',
          text1: 'Error deleting file',
        });
      }
    } else {
      const updatedSubExpenses = [...formData.subExpenses];
      updatedSubExpenses[subExpenseIndex].files = updatedSubExpenses[
        subExpenseIndex
      ].files.filter((_, i) => i !== fileIndex);
      setFormData({
        ...formData,
        subExpenses: updatedSubExpenses,
      });
    }
  };

  const handleUpdate = async () => {
    if (!formData) return;
    const payload = new FormData();
    payload.append('expenseName', formData.expenseName);
    payload.append('managerId', formData.managerId);
    payload.append('financeId', formData.financeId);
    payload.append('currency', formData.currency);

    formData.subExpenses.forEach((sub, idx) => {
      payload.append(`expenseType-${idx}`, sub.expenseType);
      payload.append(`expenseName-${idx}`, sub.expenseName);
      payload.append(`amount-${idx}`, sub.amount);
      payload.append(`description-${idx}`, sub.description);

      sub.files.forEach(file => {
        if (file.isNew) {
          let name = file.name || file.fileName || `file-${idx}`;

          if (!name.includes('.') && file.type === 'application/pdf') {
            name += '.pdf';
          } else if (!name.includes('.') && file.type?.startsWith('image/')) {
            name += '.jpg';
          }

          payload.append(`files-${idx}`, {
            uri: file.uri,
            type:
              file.type ||
              (name.endsWith('.pdf') ? 'application/pdf' : 'image/jpeg'),
            name,
          });
        }
      });
    });

    try {
      const res = await axios.put(
        `${VITE_API_URL}/expenses/edit-expense/${expenseId}`,
        payload,
        {
          withCredentials: true,
          headers: { 'Content-Type': 'multipart/form-data' },
        },
      );
      if (res.data.success) {
        Toast.show({
          type: 'success',
          text1: res.data.message || 'Expense updated successfully!',
        });
        navigation.navigate('ExpensesList');
      }
    } catch (err) {
      Toast.show({
        type: 'error',
        text1: err.response?.data?.message || 'Error updating expense',
      });
    }
  };

  if (loading || !formData) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={PRIMARY_COLOR} />
        <Text style={styles.loadingText}>Loading expense details...</Text>
      </View>
    );
  }

  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
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

        <View style={styles.inputContainer}>
          <Text style={styles.inputLabel}>Manager *</Text>
          <View style={styles.pickerContainer}>
            <Picker
              selectedValue={formData.managerId}
              onValueChange={val => handleChange('managerId', val)}
              style={styles.picker}
            >
              <Picker.Item
                label="Select Manager"
                value=""
                color={INACTIVE_COLOR}
              />
              {managers.map(m => (
                <Picker.Item
                  key={m._id}
                  label={m.name}
                  value={m._id}
                  color="#333"
                />
              ))}
            </Picker>
          </View>
        </View>

        <View style={styles.inputContainer}>
          <Text style={styles.inputLabel}>Finance User *</Text>
          <View style={styles.pickerContainer}>
            <Picker
              selectedValue={formData.financeId}
              onValueChange={val => handleChange('financeId', val)}
              style={styles.picker}
            >
              <Picker.Item
                label="Select Finance User"
                value=""
                color={INACTIVE_COLOR}
              />
              {financeUsers.map(f => (
                <Picker.Item
                  key={f._id}
                  label={f.name}
                  value={f._id}
                  color="#333"
                />
              ))}
            </Picker>
          </View>
        </View>

        <View style={styles.inputContainer}>
          <Text style={styles.inputLabel}>Currency *</Text>
          <View style={styles.pickerContainer}>
            <Picker
              selectedValue={formData.currency}
              onValueChange={val => handleChange('currency', val)}
              style={styles.picker}
            >
              <Picker.Item
                label="Select Currency"
                value=""
                color={INACTIVE_COLOR}
              />
              {CURRENCIES.map(c => (
                <Picker.Item key={c} label={c} value={c} color="#333" />
              ))}
            </Picker>
          </View>
        </View>
      </View>

      <View style={styles.formSection}>
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Expense Items</Text>
          <TouchableOpacity style={styles.addButton} onPress={addSubExpense}>
            <MaterialIcons name="add" size={20} color="#fff" />
            <Text style={styles.addButtonText}>Add Item</Text>
          </TouchableOpacity>
        </View>

        {formData.subExpenses.map((sub, idx) => (
          <View key={idx} style={styles.subExpenseCard}>
            <View style={styles.cardHeader}>
              <Text style={styles.cardTitle}>Item {idx + 1}</Text>
              {formData.subExpenses.length > 1 && (
                <TouchableOpacity
                  onPress={() => removeSubExpense(idx)}
                  style={styles.deleteButton}
                >
                  <MaterialIcons name="delete" size={20} color={ERROR_COLOR} />
                </TouchableOpacity>
              )}
            </View>

            <View style={styles.inputContainer}>
              <Text style={styles.inputLabel}>Expense Type *</Text>
              <View style={styles.pickerContainer}>
                <Picker
                  selectedValue={sub.expenseType}
                  onValueChange={val => handleChange('expenseType', val, idx)}
                  style={styles.picker}
                >
                  <Picker.Item
                    label="Select Type"
                    value=""
                    color={INACTIVE_COLOR}
                  />
                  <Picker.Item label="Travel" value="travel" color="#333" />
                  <Picker.Item label="Food" value="food" color="#333" />
                  <Picker.Item
                    label="Accommodation"
                    value="accommodation"
                    color="#333"
                  />
                  <Picker.Item
                    label="Office Supplies"
                    value="office supplies"
                    color="#333"
                  />
                  <Picker.Item label="Others" value="others" color="#333" />
                </Picker>
              </View>
            </View>

            <View style={styles.inputContainer}>
              <Text style={styles.inputLabel}>Item Name *</Text>
              <TextInput
                style={styles.input}
                placeholder="Enter item name"
                placeholderTextColor={INACTIVE_COLOR}
                value={sub.expenseName}
                onChangeText={text => handleChange('expenseName', text, idx)}
              />
            </View>

            <View style={styles.inputContainer}>
              <Text style={styles.inputLabel}>Amount *</Text>
              <TextInput
                style={styles.input}
                placeholder="0.00"
                placeholderTextColor={INACTIVE_COLOR}
                keyboardType="numeric"
                value={sub.amount}
                onChangeText={text => handleChange('amount', text, idx)}
              />
            </View>

            <View style={styles.inputContainer}>
              <Text style={styles.inputLabel}>Description</Text>
              <TextInput
                style={styles.textarea}
                placeholder="Enter description (optional)"
                placeholderTextColor={INACTIVE_COLOR}
                multiline
                numberOfLines={4}
                value={sub.description}
                onChangeText={text => handleChange('description', text, idx)}
              />
            </View>

            <View style={styles.inputContainer}>
              <Text style={styles.inputLabel}>Attachments</Text>

              {sub.files.length > 0 && (
                <View style={styles.filesContainer}>
                  {sub.files.map((file, fileIndex) => {
                    const isExistingFile = typeof file === 'string';
                    const fileName = isExistingFile ? file : file.name;
                    return (
                      <View key={fileIndex} style={styles.fileItem}>
                        <View style={styles.fileInfo}>
                          <MaterialIcons
                            name="insert-drive-file"
                            size={16}
                            color={PRIMARY_COLOR}
                          />
                          <Text style={styles.fileName} numberOfLines={1}>
                            {fileName}
                          </Text>
                          {!isExistingFile && (
                            <View style={styles.newFileBadge}>
                              <Text style={styles.newFileText}>NEW</Text>
                            </View>
                          )}
                        </View>
                        <TouchableOpacity
                          onPress={() =>
                            handleDeleteFile(
                              idx,
                              fileIndex,
                              isExistingFile,
                              fileName,
                            )
                          }
                          style={styles.fileDeleteButton}
                        >
                          <MaterialIcons
                            name="close"
                            size={16}
                            color={ERROR_COLOR}
                          />
                        </TouchableOpacity>
                      </View>
                    );
                  })}
                </View>
              )}

              <TouchableOpacity
                style={styles.fileButton}
                onPress={() => pickFiles(idx)}
              >
                <MaterialIcons name="attach-file" size={20} color="#fff" />
                <Text style={styles.fileButtonText}>Add Files</Text>
              </TouchableOpacity>
            </View>
          </View>
        ))}
      </View>

      <View style={styles.actionSection}>
        <TouchableOpacity
          style={[styles.actionButton, styles.cancelButton]}
          onPress={() => navigation.goBack()}
        >
          <MaterialIcons name="cancel" size={20} color="#fff" />
          <Text style={styles.actionButtonText}>Cancel</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.actionButton, styles.updateButton]}
          onPress={handleUpdate}
        >
          <MaterialIcons name="save" size={20} color="#fff" />
          <Text style={styles.actionButtonText}>Update Expense</Text>
        </TouchableOpacity>
      </View>

      <Toast />
    </ScrollView>
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
    marginBottom: 16,
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
    padding: 16,
    fontSize: 16,
    backgroundColor: '#fff',
    color: '#1F2937',
    ...CARD_SHADOW,
  },
  textarea: {
    borderWidth: 1.5,
    borderColor: '#D1D5DB',
    borderRadius: 12,
    padding: 16,
    fontSize: 16,
    backgroundColor: '#fff',
    color: '#1F2937',
    minHeight: 100,
    textAlignVertical: 'top',
    ...CARD_SHADOW,
  },
  pickerContainer: {
    borderWidth: 1.5,
    borderColor: '#D1D5DB',
    borderRadius: 12,
    backgroundColor: '#fff',
    overflow: 'hidden',
    ...CARD_SHADOW,
  },
  picker: {
    height: 56,
    color: '#1F2937',
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
    marginLeft: 4,
  },
  subExpenseCard: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 20,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    ...CARD_SHADOW,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
    paddingBottom: 12,
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
  filesContainer: {
    marginBottom: 12,
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
  newFileBadge: {
    backgroundColor: WARNING_COLOR,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
    marginLeft: 8,
  },
  newFileText: {
    color: '#fff',
    fontSize: 10,
    fontWeight: '700',
    letterSpacing: 0.5,
  },
  fileDeleteButton: {
    padding: 4,
    borderRadius: 4,
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
  actionSection: {
    flexDirection: 'row',
    padding: 16,
    paddingTop: 8,
    gap: 12,
  },
  actionButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    borderRadius: 12,
    ...CARD_SHADOW,
  },
  actionButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
    marginLeft: 8,
  },
  cancelButton: {
    backgroundColor: INACTIVE_COLOR,
  },
  updateButton: {
    backgroundColor: WARNING_COLOR,
  },
});

export default EditExpenseScreen;
