/* eslint-disable react-hooks/exhaustive-deps */
/* eslint-disable react-native/no-inline-styles */
import { VITE_API_URL, VITE_IMAGE_URL } from '@env';
import { useRoute } from '@react-navigation/native';
import axios from 'axios';
import { useCallback, useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Image,
  Linking,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import LinearGradient from 'react-native-linear-gradient';
import Toast from 'react-native-toast-message';
import MaterialIcons from 'react-native-vector-icons/MaterialIcons';
import { getStatusColor, PRIMARY_COLOR, STATUS_COLORS } from '../theme/theme';

export default function ExpenseDetailsScreen() {
  const route = useRoute();
  const { id } = route.params;

  const [expense, setExpense] = useState(null);
  const [loading, setLoading] = useState(true);

  const [categories, setCategories] = useState([]);
  const [clients, setClients] = useState([]);

  /* ---------------- FETCH LOOKUPS LIKE WEB ---------------- */

  const fetchCategories = async () => {
    try {
      const { data } = await axios.get(
        `${VITE_API_URL}/admin/get-all-categories`,
        {
          withCredentials: true,
        },
      );

      setCategories(Array.isArray(data.data) ? data.data : []);
    } catch {
      Toast.show({ type: 'error', text1: 'Failed to load categories' });
    }
  };

  const fetchClients = async () => {
    try {
      const { data } = await axios.get(
        `${VITE_API_URL}/admin/get-all-clients`,
        {
          withCredentials: true,
        },
      );
      setClients(data.data || []);
    } catch {
      Toast.show({ type: 'error', text1: 'Failed to load clients' });
    }
  };

  const getCategoryName = id => {
    const found = categories.find(c => c._id === id);
    return found ? found.name : id;
  };

  const getClientName = id => {
    const found = clients.find(c => c._id === id);
    return found ? found.name : id;
  };

  /* ---------------- FETCH EXPENSE DETAILS ---------------- */

  const fetchExpenseDetails = useCallback(async () => {
    setLoading(true);
    try {
      const { data } = await axios.get(
        `${VITE_API_URL}/expenses/get-expense/${id}`,
        {
          withCredentials: true,
        },
      );
      if (data.success) setExpense(data.data);
      else Toast.show({ type: 'error', text1: 'Failed to fetch details' });
    } catch {
      Toast.show({ type: 'error', text1: 'Error fetching details' });
    } finally {
      setLoading(false);
    }
  }, [id]);

  /* ---------------- INITIAL LOAD ---------------- */
  useEffect(() => {
    fetchClients();
    fetchCategories();
    fetchExpenseDetails();
  }, []);

  /* ---------------- HELPERS ---------------- */
  const getStatusColor = status =>
    STATUS_COLORS[status] || STATUS_COLORS.pending;

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
            {expense.status
              .replace(/_/g, ' ')
              .replace(/\b\w/g, c => c.toUpperCase())}
          </Text>
        </View>
      </LinearGradient>

      {/* MAIN INFO CARD */}
      <View style={[styles.mainCard, styles.cardShadow]}>
        <View style={styles.cardHeader}>
          <MaterialIcons name="receipt" size={24} color={PRIMARY_COLOR} />
          <Text style={styles.cardTitle}>Expense Information</Text>
        </View>

        {/* EXACT SAME FIELDS AS WEB */}
        {[
          ['Expense Name', expense.expenseName],
          ['Manager', expense.managerId?.name],
          ['Finance', expense.financeId?.name],
          ['Currency', expense.currency],
          ['Total Reimbursement', expense.totalReimbursement],
          ['From', new Date(expense.periodFrom).toLocaleDateString('en-US')],
          ['To', new Date(expense.periodTo).toLocaleDateString('en-US')],
          ['Client', getClientName(expense.clientId)],
          ['Reference No', expense.reference],
          ['Advance Amount', expense.advanceAmount],
        ].map(([label, value], idx) => (
          <View key={idx} style={styles.webRow}>
            <Text style={styles.webLabel}>{label}</Text>
            <Text style={styles.webValue}>{value || 'N/A'}</Text>
          </View>
        ))}
      </View>

      {/* SUB EXPENSES SECTION */}
      <View style={styles.sectionHeader}>
        <MaterialIcons name="list" size={24} color={PRIMARY_COLOR} />
        <Text style={styles.sectionTitle}>Sub-Expenses</Text>
      </View>

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

          {/* EXACT FIELDS LIKE WEB */}
          <View style={styles.webInfoBlock}>
            <Info
              label="Document Date"
              value={new Date(sub.documentDate).toLocaleDateString('en-US')}
            />
            <Info label="Vendor" value={sub.vendor} />
            <Info label="GL Account" value={sub.gl_account} />
            <Info label="Description" value={sub.description} />
          </View>

          {/* APPROVALS */}
          <View style={styles.approvalSection}>
            <ApprovalItem label="Manager" status={sub.managerApproval} />
            <ApprovalItem label="Finance" status={sub.financeApproval} />
          </View>

          {/* ATTACHMENTS */}
          {sub.files.length > 0 && (
            <View style={styles.attachmentsSection}>
              <View style={styles.attachmentsHeader}>
                <MaterialIcons name="attach-file" size={20} color="#6B7280" />
                <Text style={styles.attachmentsTitle}>
                  Attachments ({sub.files.length})
                </Text>
              </View>

              <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                {sub.files.map((file, i) => {
                  const url = `${VITE_IMAGE_URL}/expenses/${file}`;
                  const ext = file.split('.').pop().toLowerCase();
                  const isImage = ['jpg', 'jpeg', 'png'].includes(ext);

                  return (
                    <TouchableOpacity
                      key={i}
                      onPress={() => Linking.openURL(url)}
                      style={styles.attachmentItem}
                    >
                      {isImage ? (
                        <Image
                          source={{ uri: url }}
                          style={styles.attachmentImage}
                        />
                      ) : (
                        <View style={styles.pdfContainer}>
                          <MaterialIcons
                            name="picture-as-pdf"
                            size={32}
                            color="#EF4444"
                          />
                          <Text style={styles.pdfText}>PDF</Text>
                        </View>
                      )}
                      <Text numberOfLines={1} style={styles.fileName}>
                        {file}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </ScrollView>
            </View>
          )}
        </View>
      ))}

      {/* APPROVAL STATUS (BOTTOM) */}
      <View style={styles.sectionHeader}>
        <MaterialIcons name="approval" size={24} color={PRIMARY_COLOR} />
        <Text style={styles.sectionTitle}>Approval Status</Text>
      </View>

      {/* MANAGER APPROVAL */}
      <ApprovalBlock title="Manager Approval" data={expense.managerApproval} />

      {/* FINANCE APPROVAL */}
      <ApprovalBlock title="Finance Approval" data={expense.financeApproval} />

      <View style={{ height: 40 }} />
    </ScrollView>
  );
}

/* ---------------- COMPONENTS ---------------- */

const Info = ({ label, value }) => (
  <View style={styles.webRow}>
    <Text style={styles.webLabel}>{label}</Text>
    <Text style={styles.webValue}>{value || 'N/A'}</Text>
  </View>
);

const ApprovalItem = ({ label, status }) => (
  <View style={styles.approvalItem}>
    <MaterialIcons
      name={
        status === 'approved'
          ? 'check-circle'
          : status === 'rejected'
          ? 'cancel'
          : 'schedule'
      }
      size={20}
      color={STATUS_COLORS[status]}
    />
    <View style={{ marginLeft: 8 }}>
      <Text style={styles.approvalLabel}>{label}</Text>
      <Text style={[styles.approvalStatus, { color: STATUS_COLORS[status] }]}>
        {status || 'Pending'}
      </Text>
    </View>
  </View>
);

const ApprovalBlock = ({ title, data }) => (
  <View style={[styles.approvalCard, styles.cardShadow]}>
    <View style={styles.approvalBlockHeader}>
      <MaterialIcons name="check" size={22} color="#6B7280" />
      <Text style={styles.approvalBlockTitle}>{title}</Text>
      <View
        style={[
          styles.statusBadge,
          { backgroundColor: getStatusColor(data?.approved) + '20' },
        ]}
      >
        <MaterialIcons
          name={getStatusColor(data?.approved)}
          size={16}
          color={getStatusColor(data?.approved)}
        />
        <Text
          style={[
            styles.statusBadgeText,
            { color: getStatusColor(data?.approved) },
          ]}
        >
          {data?.approved
            ?.replace(/_/g, ' ')
            .replace(/\b\w/g, c => c.toUpperCase())}
        </Text>
      </View>
    </View>

    <View style={styles.approvalDetails}>
      <Info label="Reviewed By" value={data?.reviewedBy?.name} />
      <Info
        label="Reviewed At"
        value={
          data?.reviewedAt
            ? new Date(data.reviewedAt).toLocaleString('en-US', {
                month: '2-digit',
                day: '2-digit',
                year: 'numeric',
                hour: '2-digit',
                minute: '2-digit',
              })
            : 'N/A'
        }
      />
      <Info label="Remark" value={data?.remark || 'No remarks'} />
    </View>
  </View>
);

/* ---------------- STYLES ---------------- */

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F9FAFB' },

  centered: { flex: 1, justifyContent: 'center', alignItems: 'center' },

  loadingContainer: {
    padding: 32,
    borderRadius: 16,
    alignItems: 'center',
  },

  loadingText: { color: '#FFF', marginTop: 16 },

  errorText: {
    marginTop: 16,
    color: '#EF4444',
    fontSize: 18,
    fontWeight: '600',
  },

  headerGradient: {
    padding: 20,
    paddingTop: 60,
    borderBottomLeftRadius: 20,
    borderBottomRightRadius: 20,
    marginBottom: 20,
  },

  headerTitle: {
    fontSize: 22,
    fontWeight: '700',
    color: '#FFF',
    marginBottom: 10,
  },

  headerStatusContainer: {
    flexDirection: 'row',
    marginTop: 12,
    alignSelf: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    paddingHorizontal: 14,
    paddingVertical: 7,
    borderRadius: 20,
  },

  headerStatus: {
    marginLeft: 8,
    fontSize: 14,
    fontWeight: '600',
    color: '#FFF',
  },

  mainCard: {
    backgroundColor: '#FFF',
    borderRadius: 12,
    padding: 20,
    marginHorizontal: 16,
    marginTop: -40,
    marginBottom: 16,
  },

  cardHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: 16 },

  cardTitle: {
    marginLeft: 10,
    fontSize: 18,
    fontWeight: '700',
    color: '#1F2937',
  },

  webRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },
  webLabel: { fontSize: 14, color: '#6B7280', flex: 1 },
  webValue: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1F2937',
    maxWidth: '50%',
    textAlign: 'right',
  },

  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginHorizontal: 16,
    marginTop: 24,
    marginBottom: 12,
  },

  sectionTitle: {
    marginLeft: 10,
    fontSize: 18,
    fontWeight: '700',
    color: '#1F2937',
  },

  subExpenseCard: {
    backgroundColor: '#FFF',
    borderRadius: 12,
    padding: 20,
    marginHorizontal: 16,
    marginBottom: 16,
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

  subExpenseNumberText: { color: '#FFF', fontWeight: '700', fontSize: 16 },

  subExpenseType: { fontSize: 13, color: '#6B7280' },

  subExpenseName: {
    fontSize: 16,
    fontWeight: '700',
    color: '#1F2937',
    marginTop: 2,
  },

  amountContainer: {
    backgroundColor: '#ECFDF5',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
  },

  amountText: { fontWeight: '700', color: '#059669', fontSize: 15 },

  webInfoBlock: { marginBottom: 16 },

  approvalSection: { flexDirection: 'row', justifyContent: 'space-between' },

  approvalItem: {
    flex: 1,
    backgroundColor: '#F3F4F6',
    padding: 14,
    borderRadius: 10,
    marginHorizontal: 4,
    flexDirection: 'row',
    alignItems: 'center',
  },

  approvalLabel: { fontSize: 13, color: '#6B7280' },

  approvalStatus: { fontWeight: '700', fontSize: 15, marginLeft: 8 },

  attachmentsSection: { marginTop: 16 },

  attachmentsHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
  },

  attachmentsTitle: { marginLeft: 8, fontWeight: '700', fontSize: 16 },

  attachmentItem: { marginRight: 12, width: 100, alignItems: 'center' },

  attachmentImage: { width: 80, height: 80, borderRadius: 10 },

  pdfContainer: {
    width: 80,
    height: 80,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#FECACA',
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#FEF2F2',
  },

  pdfText: { color: '#EF4444', fontSize: 10 },

  fileName: { marginTop: 6, fontSize: 12, textAlign: 'center' },

  approvalCard: {
    backgroundColor: '#FFF',
    borderRadius: 12,
    padding: 20,
    marginHorizontal: 16,
    marginBottom: 16,
  },

  approvalBlockHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },

  approvalBlockTitle: {
    marginLeft: 12,
    fontSize: 18,
    fontWeight: '700',
    flex: 1,
    color: '#1F2937',
  },

  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 14,
    paddingVertical: 7,
    borderRadius: 20,
  },

  statusBadgeText: { marginLeft: 6, fontWeight: '700', fontSize: 13 },

  approvalDetails: { marginTop: 16 },
  cardShadow: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.05,
    shadowRadius: 5,
    elevation: 3,
  },
});
