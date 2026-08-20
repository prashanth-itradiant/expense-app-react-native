/* eslint-disable react-hooks/exhaustive-deps */
/* eslint-disable react-native/no-inline-styles */

import { API_URL } from '@env';
import { useRoute } from '@react-navigation/native';
import axios from 'axios';
import { useCallback, useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Image,
  Platform,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import LinearGradient from 'react-native-linear-gradient';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Toast from 'react-native-toast-message';
import MaterialIcons from 'react-native-vector-icons/MaterialIcons';
import { openFile } from '../utils/openFile';

/* ---------------- theme (white + navy) ---------------- */

const NAVY = {
  primary: '#0B1F45',
  primaryLight: '#16326B',
  bg: '#F5F6F8',
  surface: '#FFFFFF',
  border: '#E1E4EA',
  textPrimary: '#111827',
  textSecondary: '#6B7280',
  inactive: '#9AA1AC',
  success: '#0F8A5F',
  successBg: '#DCFCE7',
  error: '#DC2626',
  errorBg: '#FEF2F2',
  onPrimary: '#FFFFFF',
};

const formatDate = d => (d ? new Date(d).toLocaleDateString() : 'N/A');

export default function ExpenseDetailsScreen() {
  const route = useRoute();
  const insets = useSafeAreaInsets();
  const id = route.params?.id || route.params?._id;

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
    if (!id) {
      setLoading(false);
      Toast.show({ type: 'error', text1: 'Missing expense ID' });
      return;
    }
    setLoading(true);
    try {
      const { data } = await axios.get(
        `${API_URL}/expenses/get-expense/${id}`,
        { withCredentials: true },
      );
      if (data.success) setExpense(data.data);
      else Toast.show({ type: 'error', text1: 'Failed to fetch details' });
    } catch (error) {
      Toast.show({
        type: 'error',
        text1: 'Could not open expense',
        text2: error.response?.data?.message || error.message,
      });
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
      <View
        style={[
          styles.centered,
          { paddingTop: insets.top, paddingBottom: insets.bottom },
        ]}
      >
        <StatusBar
          barStyle="light-content"
          backgroundColor={NAVY.primary}
          translucent={Platform.OS === 'android'}
        />
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={NAVY.onPrimary} />
          <Text style={styles.loadingText}>Loading expense details...</Text>
        </View>
      </View>
    );

  if (!expense)
    return (
      <View
        style={[
          styles.centered,
          { paddingTop: insets.top, paddingBottom: insets.bottom },
        ]}
      >
        <StatusBar
          barStyle="dark-content"
          backgroundColor={NAVY.bg}
          translucent={Platform.OS === 'android'}
        />
        <MaterialIcons name="error-outline" size={52} color={NAVY.error} />
        <Text style={styles.errorText}>Expense not found</Text>
      </View>
    );

  return (
    <View style={{ flex: 1, backgroundColor: NAVY.primary }}>
      <StatusBar
        barStyle="light-content"
        backgroundColor={NAVY.primary}
        translucent={Platform.OS === 'android'}
      />
      <ScrollView
        style={styles.container}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: Math.max(insets.bottom, 20) }}
      >
        {/* HEADER */}
        <View style={[styles.headerGradient, { paddingTop: insets.top + 16 }]}>
          <Text style={styles.headerTitle}>Expense Details</Text>

          <View style={styles.headerStatusContainer}>
            <MaterialIcons
              name={getStatusIcon(expense.status)}
              size={18}
              color={NAVY.onPrimary}
            />
            <Text style={styles.headerStatus}>
              {String(expense.status || 'pending')
                .replace(/_/g, ' ')
                .toUpperCase()}
            </Text>
          </View>
        </View>

        {/* MAIN INFO */}
        <View style={styles.mainCard}>
          <View style={styles.cardHeader}>
            <MaterialIcons name="receipt" size={19} color={NAVY.primary} />
            <Text style={styles.cardTitle}>Expense Information</Text>
          </View>

          {[
            ['Expense Name', expense.expenseName],
            ['Manager', expense.managerId?.name],
            ['Finance', expense.financeId?.name],
            ['Currency', expense.currency],
            ['Total Reimbursement', expense.totalReimbursement],
            ['From', formatDate(expense.periodFrom)],
            ['To', formatDate(expense.periodTo)],
            ['Client', getClientName(expense.clientId)],
            ['Reference No', expense.reference],
            ['Advance Amount', expense.advanceAmount],
          ].map(([label, value], i) => (
            <Info key={i} label={label} value={value} />
          ))}
        </View>

        {/* SUB EXPENSES */}
        <Section title="Sub-Expenses" icon="list" />

        {(expense.subExpenses || []).map((sub, index) => (
          <View key={sub._id} style={styles.subExpenseCard}>
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

            <Info label="Document Date" value={formatDate(sub.documentDate)} />
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
                        activeOpacity={0.75}
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
                              size={26}
                              color={NAVY.error}
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

        <View style={{ height: 10 }} />
      </ScrollView>
    </View>
  );
}

/* ---------------- SMALL COMPONENTS ---------------- */

const Info = ({ label, value }) => (
  <View style={styles.webRow}>
    <Text style={styles.webLabel}>{label}</Text>
    <Text style={styles.webValue}>
      {value === 0 ? '0' : String(value || 'N/A')}
    </Text>
  </View>
);

const Section = ({ title, icon }) => (
  <View style={styles.sectionHeader}>
    <MaterialIcons name={icon} size={18} color={NAVY.primary} />
    <Text style={styles.sectionTitle}>{title}</Text>
  </View>
);

/* ---------------- STYLES ---------------- */

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: NAVY.bg },
  centered: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: NAVY.bg,
    gap: 10,
  },
  loadingContainer: {
    padding: 16,
    borderRadius: 14,
    backgroundColor: NAVY.primary,
    alignItems: 'center',
  },
  loadingText: { color: NAVY.onPrimary, marginTop: 12, fontSize: 13 },
  errorText: { color: NAVY.error, fontSize: 14, fontWeight: '600' },

  headerGradient: {
    backgroundColor: NAVY.primary,
    padding: 14,
    paddingBottom: 46,
    borderBottomLeftRadius: 20,
    borderBottomRightRadius: 20,
  },
  headerTitle: { fontSize: 17, fontWeight: '700', color: NAVY.onPrimary },
  headerStatusContainer: {
    flexDirection: 'row',
    alignSelf: 'flex-start',
    alignItems: 'center',
    marginTop: 10,
    backgroundColor: 'rgba(255,255,255,0.15)',
    paddingHorizontal: 12,
    paddingVertical: 5,
    borderRadius: 12,
  },
  headerStatus: {
    marginLeft: 6,
    color: NAVY.onPrimary,
    fontWeight: '700',
    fontSize: 12,
  },

  mainCard: {
    backgroundColor: NAVY.surface,
    borderRadius: 14,
    padding: 14,
    margin: 14,
    marginTop: -34,
    borderWidth: 1,
    borderColor: NAVY.border,
  },

  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
    gap: 8,
  },
  cardTitle: { fontSize: 14, fontWeight: '700', color: NAVY.textPrimary },

  webRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 9,
    borderBottomWidth: 1,
    borderBottomColor: '#F0F1F4',
  },
  webLabel: { color: NAVY.textSecondary, fontSize: 12.5 },
  webValue: {
    fontWeight: '600',
    color: NAVY.textPrimary,
    fontSize: 13,
    maxWidth: '55%',
    textAlign: 'right',
  },

  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginHorizontal: 14,
    marginTop: 14,
    gap: 8,
  },
  sectionTitle: { fontSize: 14, fontWeight: '700', color: NAVY.textPrimary },

  subExpenseCard: {
    backgroundColor: NAVY.surface,
    borderRadius: 14,
    padding: 13,
    margin: 14,
    marginTop: 10,
    borderWidth: 1,
    borderColor: NAVY.border,
  },

  subExpenseHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  subExpenseNumber: {
    width: 28,
    height: 28,
    borderRadius: 10,
    backgroundColor: NAVY.primary,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  subExpenseNumberText: {
    color: NAVY.onPrimary,
    fontWeight: '700',
    fontSize: 12.5,
  },
  subExpenseType: { color: NAVY.textSecondary, fontSize: 12 },
  subExpenseName: { fontWeight: '700', fontSize: 14, color: NAVY.textPrimary },

  amountContainer: {
    backgroundColor: NAVY.successBg,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 8,
  },
  amountText: { fontWeight: '700', color: NAVY.success, fontSize: 12.5 },

  attachmentsSection: { marginTop: 12 },
  attachmentsTitle: {
    fontWeight: '700',
    marginBottom: 8,
    fontSize: 12.5,
    color: NAVY.textPrimary,
  },

  attachmentItem: { marginRight: 10, width: 84, alignItems: 'center' },
  attachmentImage: { width: 68, height: 68, borderRadius: 10 },
  pdfContainer: {
    width: 68,
    height: 68,
    borderRadius: 10,
    backgroundColor: NAVY.errorBg,
    justifyContent: 'center',
    alignItems: 'center',
  },
  fileName: {
    marginTop: 5,
    fontSize: 11,
    textAlign: 'center',
    color: NAVY.textSecondary,
  },
});
