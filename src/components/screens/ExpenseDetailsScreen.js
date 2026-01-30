/* eslint-disable react-hooks/exhaustive-deps */
/* eslint-disable react-native/no-inline-styles */

import { API_URL } from '@env';
import { useRoute } from '@react-navigation/native';
import axios from 'axios';
import { useCallback, useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Image,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import LinearGradient from 'react-native-linear-gradient';
import Toast from 'react-native-toast-message';
import MaterialIcons from 'react-native-vector-icons/MaterialIcons';
import { PRIMARY_COLOR } from '../theme/theme';
import { openFile } from '../utils/openFile';

export default function ExpenseDetailsScreen() {
  const route = useRoute();
  const { id } = route.params;

  const [expense, setExpense] = useState(null);
  const [loading, setLoading] = useState(true);
  const [categories, setCategories] = useState([]);
  const [clients, setClients] = useState([]);

  /* ---------------- FETCH LOOKUPS ---------------- */

  const fetchCategories = async () => {
    try {
      const { data } = await axios.get(`${API_URL}/admin/get-all-categories`, {
        withCredentials: true,
      });
      setCategories(Array.isArray(data.data) ? data.data : []);
    } catch {
      Toast.show({ type: 'error', text1: 'Failed to load categories' });
    }
  };

  const fetchClients = async () => {
    try {
      const { data } = await axios.get(`${API_URL}/admin/get-all-clients`, {
        withCredentials: true,
      });
      setClients(data.data || []);
    } catch {
      Toast.show({ type: 'error', text1: 'Failed to load clients' });
    }
  };

  const getCategoryName = id => categories.find(c => c._id === id)?.name || id;

  const getClientName = id => clients.find(c => c._id === id)?.name || id;

  /* ---------------- FETCH DETAILS ---------------- */

  const fetchExpenseDetails = useCallback(async () => {
    setLoading(true);
    try {
      const { data } = await axios.get(
        `${API_URL}/expenses/get-expense/${id}`,
        { withCredentials: true },
      );
      if (data.success) setExpense(data.data);
      else Toast.show({ type: 'error', text1: 'Failed to fetch details' });
    } catch {
      Toast.show({ type: 'error', text1: 'Error fetching details' });
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    fetchClients();
    fetchCategories();
    fetchExpenseDetails();
  }, []);

  /* ---------------- HELPERS ---------------- */

  const getStatusIcon = status => {
    switch (status) {
      case 'approved':
        return 'check-circle';
      case 'rejected':
        return 'cancel';
      case 'resubmission':
        return 'refresh';
      default:
        return 'schedule';
    }
  };

  if (loading)
    return (
      <View style={styles.centered}>
        <LinearGradient
          colors={['#667eea', '#764ba2']}
          style={styles.loadingContainer}
        >
          <ActivityIndicator size="large" color="#FFF" />
          <Text style={styles.loadingText}>Loading expense details...</Text>
        </LinearGradient>
      </View>
    );

  if (!expense)
    return (
      <View style={styles.centered}>
        <MaterialIcons name="error" size={64} color="#EF4444" />
        <Text style={styles.errorText}>Expense not found</Text>
      </View>
    );

  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
      {/* HEADER */}
      <LinearGradient
        colors={['#667eea', '#764ba2']}
        style={styles.headerGradient}
      >
        <Text style={styles.headerTitle}>Expense Details</Text>

        <View style={styles.headerStatusContainer}>
          <MaterialIcons
            name={getStatusIcon(expense.status)}
            size={22}
            color="#FFF"
          />
          <Text style={styles.headerStatus}>
            {expense.status.replace(/_/g, ' ').toUpperCase()}
          </Text>
        </View>
      </LinearGradient>

      {/* MAIN INFO */}
      <View style={[styles.mainCard, styles.cardShadow]}>
        <View style={styles.cardHeader}>
          <MaterialIcons name="receipt" size={24} color={PRIMARY_COLOR} />
          <Text style={styles.cardTitle}>Expense Information</Text>
        </View>

        {[
          ['Expense Name', expense.expenseName],
          ['Manager', expense.managerId?.name],
          ['Finance', expense.financeId?.name],
          ['Currency', expense.currency],
          ['Total Reimbursement', expense.totalReimbursement],
          ['From', new Date(expense.periodFrom).toLocaleDateString()],
          ['To', new Date(expense.periodTo).toLocaleDateString()],
          ['Client', getClientName(expense.clientId)],
          ['Reference No', expense.reference],
          ['Advance Amount', expense.advanceAmount],
        ].map(([label, value], i) => (
          <Info key={i} label={label} value={value} />
        ))}
      </View>

      {/* SUB EXPENSES */}
      <Section title="Sub-Expenses" icon="list" />

      {expense.subExpenses.map((sub, index) => (
        <View key={sub._id} style={[styles.subExpenseCard, styles.cardShadow]}>
          <View style={styles.subExpenseHeader}>
            <View style={styles.subExpenseNumber}>
              <Text style={styles.subExpenseNumberText}>{index + 1}</Text>
            </View>

            <View style={{ flex: 1 }}>
              <Text style={styles.subExpenseType}>
                {getCategoryName(sub.expenseCategory)}
              </Text>
              <Text style={styles.subExpenseName}>{sub.expenseType}</Text>
            </View>

            <View style={styles.amountContainer}>
              <Text style={styles.amountText}>
                {sub.amount} {expense.currency}
              </Text>
            </View>
          </View>

          <Info
            label="Document Date"
            value={new Date(sub.documentDate).toLocaleDateString()}
          />
          <Info label="Vendor" value={sub.vendor} />
          <Info label="GL Account" value={sub.gl_account} />
          <Info label="Description" value={sub.description} />

          {/* ATTACHMENTS */}
          {sub.files?.length > 0 && (
            <View style={styles.attachmentsSection}>
              <Text style={styles.attachmentsTitle}>
                Attachments ({sub.files.length})
              </Text>

              <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                {sub.files.map(file => {
                  const isImage = file?.type?.startsWith('image/');
                  return (
                    <TouchableOpacity
                      key={file._id}
                      onPress={() => openFile(file)}
                      style={styles.attachmentItem}
                    >
                      {isImage ? (
                        <Image
                          source={{ uri: file.url }}
                          style={styles.attachmentImage}
                        />
                      ) : (
                        <View style={styles.pdfContainer}>
                          <MaterialIcons
                            name="picture-as-pdf"
                            size={32}
                            color="#EF4444"
                          />
                        </View>
                      )}
                      <Text numberOfLines={1} style={styles.fileName}>
                        {file.name}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </ScrollView>
            </View>
          )}
        </View>
      ))}

      <View style={{ height: 40 }} />
    </ScrollView>
  );
}

/* ---------------- SMALL COMPONENTS ---------------- */

const Info = ({ label, value }) => (
  <View style={styles.webRow}>
    <Text style={styles.webLabel}>{label}</Text>
    <Text style={styles.webValue}>{value || 'N/A'}</Text>
  </View>
);

const Section = ({ title, icon }) => (
  <View style={styles.sectionHeader}>
    <MaterialIcons name={icon} size={24} color={PRIMARY_COLOR} />
    <Text style={styles.sectionTitle}>{title}</Text>
  </View>
);

/* ---------------- STYLES ---------------- */

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F9FAFB' },
  centered: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  loadingContainer: { padding: 32, borderRadius: 16 },
  loadingText: { color: '#FFF', marginTop: 16 },
  errorText: { marginTop: 16, color: '#EF4444', fontSize: 18 },

  headerGradient: {
    padding: 20,
    paddingTop: 60,
    borderBottomLeftRadius: 20,
    borderBottomRightRadius: 20,
  },
  headerTitle: { fontSize: 22, fontWeight: '700', color: '#FFF' },
  headerStatusContainer: {
    flexDirection: 'row',
    alignSelf: 'center',
    marginTop: 12,
    backgroundColor: 'rgba(255,255,255,0.2)',
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: 20,
  },
  headerStatus: { marginLeft: 8, color: '#FFF', fontWeight: '600' },

  mainCard: {
    backgroundColor: '#FFF',
    borderRadius: 12,
    padding: 20,
    margin: 16,
    marginTop: -40,
  },

  cardHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: 16 },
  cardTitle: { marginLeft: 10, fontSize: 18, fontWeight: '700' },

  webRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },
  webLabel: { color: '#6B7280' },
  webValue: { fontWeight: '600', maxWidth: '50%', textAlign: 'right' },

  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginHorizontal: 16,
    marginTop: 24,
  },
  sectionTitle: { marginLeft: 10, fontSize: 18, fontWeight: '700' },

  subExpenseCard: {
    backgroundColor: '#FFF',
    borderRadius: 12,
    padding: 20,
    margin: 16,
  },

  subExpenseHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  subExpenseNumber: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: PRIMARY_COLOR,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  subExpenseNumberText: { color: '#FFF', fontWeight: '700' },
  subExpenseType: { color: '#6B7280' },
  subExpenseName: { fontWeight: '700', fontSize: 16 },

  amountContainer: {
    backgroundColor: '#ECFDF5',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
  },
  amountText: { fontWeight: '700', color: '#059669' },

  attachmentsSection: { marginTop: 16 },
  attachmentsTitle: { fontWeight: '700', marginBottom: 8 },

  attachmentItem: { marginRight: 12, width: 100, alignItems: 'center' },
  attachmentImage: { width: 80, height: 80, borderRadius: 10 },
  pdfContainer: {
    width: 80,
    height: 80,
    borderRadius: 10,
    backgroundColor: '#FEF2F2',
    justifyContent: 'center',
    alignItems: 'center',
  },
  fileName: { marginTop: 6, fontSize: 12, textAlign: 'center' },

  cardShadow: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.05,
    shadowRadius: 5,
    elevation: 3,
  },
});
