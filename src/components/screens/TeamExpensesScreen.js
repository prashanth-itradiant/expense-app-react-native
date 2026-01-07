/* eslint-disable react-hooks/exhaustive-deps */
// TeamExpensesScreenSingle.js
import { useNavigation } from '@react-navigation/native';
import { useQuery } from '@tanstack/react-query';
import axios from 'axios';
import React, { useEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  FlatList,
  Linking,
  Platform,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import RNFS from 'react-native-fs';
import Share from 'react-native-share';
import MaterialIcons from 'react-native-vector-icons/MaterialIcons';
import { useSelector } from 'react-redux';
import { COLORS, SPACING } from '../theme/theme';

/**
 * Single-file screen combining:
 * - All/Team list (from /expenses/team-expenses)
 * - Pending (same source but you can filter by status)
 * - Approved (from /expenses/all-org-expenses with pagination)
 * - Export (CSV share for selected/filtered)
 *
 * Adjust endpoints and fields to match your backend.
 */

// Fetchers
const fetchTeamExpenses = async () => {
  const { data } = await axios.get(
    `${process.env.VITE_API_URL || ''}/expenses/team-expenses`,
    { withCredentials: true },
  );
  if (!data.success) throw new Error(data.message || 'Failed to fetch team');
  return data.data;
};

const fetchApprovedExpenses = async ({ queryKey }) => {
  const [_key, page = 1, limit = 10] = queryKey;
  const { data } = await axios.get(
    `${process.env.VITE_API_URL || ''}/expenses/all-org-expenses`,
    {
      params: { page, limit },
      withCredentials: true,
    },
  );
  if (!data.success)
    throw new Error(data.message || 'Failed to fetch approved');
  return { items: data.data, totalCount: data.totalCount || data.data.length };
};

// small segmented tab
function Segmented({ tabs, active, onChange }) {
  return (
    <View style={segStyles.row}>
      {tabs.map(t => {
        const activeTab = t.key === active;
        return (
          <TouchableOpacity
            key={t.key}
            style={[segStyles.tab, activeTab && segStyles.tabActive]}
            onPress={() => onChange(t.key)}
            activeOpacity={0.8}
          >
            <Text
              style={[segStyles.tabText, activeTab && segStyles.tabTextActive]}
            >
              {t.label}
            </Text>
          </TouchableOpacity>
        );
      })}
    </View>
  );
}

export default function TeamExpensesListScreen() {
  const navigation = useNavigation();
  const role = useSelector(s => s.auth?.data?.role) || 'employee';
  const token = useSelector(s => s.auth?.token) || null;

  const [activeTab, setActiveTab] = useState('all'); // all | pending | approved | export
  const [search, setSearch] = useState('');

  // Approved pagination & selection
  const [page, setPage] = useState(1);
  const limit = 10;
  const [selected, setSelected] = useState(new Set());

  // Queries
  const {
    data: teamData = [],
    isLoading: teamLoading,
    isError: teamError,
    refetch: refetchTeam,
  } = useQuery({
    queryKey: ['teamExpenses'],
    queryFn: fetchTeamExpenses,
    staleTime: 5 * 60 * 1000,
    refetchOnWindowFocus: false,
  });

  const {
    data: approvedResp,
    isLoading: approvedLoading,
    isError: approvedError,
    refetch: refetchApproved,
  } = useQuery({
    queryKey: ['approvedExpenses', page, limit],
    queryFn: fetchApprovedExpenses,
    staleTime: 5 * 60 * 1000,
    keepPreviousData: true,
    refetchOnWindowFocus: false,
  });

  const approvedItems = approvedResp?.items || [];
  const approvedTotal = approvedResp?.totalCount || 0;
  const approvedTotalPages = Math.max(1, Math.ceil(approvedTotal / limit));

  // Derived lists
  const allList = teamData;
  const pendingList = useMemo(
    () =>
      (teamData || []).filter(
        i =>
          (i.status || '').toLowerCase().includes('pending') ||
          i.status == null,
      ),
    [teamData],
  );
  const filteredAll = useMemo(
    () =>
      (allList || []).filter(i =>
        (i.employee?.name || '').toLowerCase().includes(search.toLowerCase()),
      ),
    [allList, search],
  );
  const filteredPending = useMemo(
    () =>
      (pendingList || []).filter(i =>
        (i.employee?.name || '').toLowerCase().includes(search.toLowerCase()),
      ),
    [pendingList, search],
  );
  const filteredApproved = useMemo(
    () =>
      (approvedItems || []).filter(i =>
        (i.employee?.name || '').toLowerCase().includes(search.toLowerCase()),
      ),
    [approvedItems, search],
  );

  // selection toggle for approved items
  const toggleSelect = id => {
    setSelected(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  // download pdf (same)
  const downloadPdf = async id => {
    const url = `${process.env.VITE_API_URL || ''}/expenses/${id}/pdf`;
    try {
      await Linking.openURL(url);
    } catch (err) {
      Alert.alert('Open failed', err.message || 'Could not open PDF');
    }
  };

  // Send SAP - uses token if available
  const sendSap = async id => {
    try {
      const res = await axios.post(
        `${process.env.VITE_API_URL}/users/sap/${id}`,
        {},
        {
          headers: token ? { Authorization: `Bearer ${token}` } : {},
        },
      );
      Alert.alert(
        res.data.success ? 'Success' : 'Error',
        res.data.message || 'SAP call completed',
      );
    } catch (err) {
      Alert.alert(
        'Error',
        err?.response?.data?.message || 'Failed to send SAP',
      );
    }
  };

  // Export CSV builder (used by Export tab and Export button)

  const downloadOrgExpensesExcel = async () => {
    try {
      const url = `${process.env.VITE_API_URL}/expenses/all-org-expenses-export`;

      const fileName = `Approved_Expenses_${Date.now()}.xlsx`;
      const filePath =
        Platform.OS === 'android'
          ? `${RNFS.DownloadDirectoryPath}/${fileName}`
          : `${RNFS.DocumentDirectoryPath}/${fileName}`;

      const result = await RNFS.downloadFile({
        fromUrl: url,
        toFile: filePath,
      }).promise;

      if (result.statusCode !== 200) {
        throw new Error(`Download failed: ${result.statusCode}`);
      }

      await Share.open({
        url: `file://${filePath}`,
        type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        showAppsToView: true,
      });
    } catch (err) {
      Alert.alert('Export failed', err?.message || 'Unable to open Excel file');
    }
  };

  // Top-level loading indicator if both queries loading initially
  const loading = teamLoading && approvedLoading;

  // If approved page out of range, clamp
  useEffect(() => {
    if (page > approvedTotalPages) setPage(approvedTotalPages);
  }, [approvedTotalPages]);

  // UI render helpers
  const renderExpenseCard = ({ item }) => (
    <TouchableOpacity
      style={styles.card}
      activeOpacity={0.9}
      onPress={() =>
        navigation.navigate('TeamExpenseDetails', { id: item._id })
      }
    >
      <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
        <View style={{ flex: 1, paddingRight: 8 }}>
          <Text style={styles.title}>{item.expenseName}</Text>
          <Text style={styles.sub}>
            {item.employee?.name || 'Unknown employee'}
          </Text>
          <Text style={styles.muted}>
            {item.periodFrom
              ? `${new Date(item.periodFrom).toLocaleDateString()} - ${new Date(
                  item.periodTo,
                ).toLocaleDateString()}`
              : ''}
          </Text>
        </View>

        <View style={{ alignItems: 'flex-end' }}>
          <Text style={[styles.status, { color: COLORS.neutral[600] }]}>
            {(item.status || 'pending').replace(/_/g, ' ')}
          </Text>

          <TouchableOpacity
            onPress={() => downloadPdf(item._id)}
            style={{ marginTop: 8 }}
          >
            <MaterialIcons
              name="download"
              size={22}
              color={COLORS.primary[600]}
            />
          </TouchableOpacity>
        </View>
      </View>
    </TouchableOpacity>
  );

  // Approved item render (with select checkbox)
  const renderApprovedItem = ({ item }) => (
    <TouchableOpacity
      style={styles.card}
      activeOpacity={0.9}
      onPress={() =>
        navigation.navigate('TeamExpenseDetails', { id: item._id })
      }
    >
      <View style={{ flexDirection: 'row', alignItems: 'center' }}>
        <TouchableOpacity
          onPress={() => toggleSelect(item._id)}
          style={styles.checkbox}
        >
          {selected.has(item._id) && (
            <MaterialIcons name="check" size={16} color="#fff" />
          )}
        </TouchableOpacity>

        <View style={{ flex: 1, marginLeft: 12 }}>
          <Text style={styles.title}>{item.expenseName}</Text>
          <Text style={styles.sub}>{item.employee?.name}</Text>
        </View>

        <TouchableOpacity onPress={() => downloadPdf(item._id)}>
          <MaterialIcons
            name="download"
            size={22}
            color={COLORS.primary[600]}
          />
        </TouchableOpacity>

        {role === 'finance' && (
          <TouchableOpacity
            onPress={() => sendSap(item._id)}
            style={{
              marginLeft: 12,
              backgroundColor: COLORS.primary[600],
              padding: 8,
              borderRadius: 8,
            }}
          >
            <Text style={{ color: '#fff' }}>Send</Text>
          </TouchableOpacity>
        )}
      </View>
    </TouchableOpacity>
  );

  return (
    <View style={{ flex: 1, backgroundColor: COLORS.background.secondary }}>
      <View style={{ padding: SPACING.md }}>
        <Text style={{ fontWeight: '700', fontSize: 18, marginBottom: 8 }}>
          Team Expenses
        </Text>

        <Segmented
          tabs={[
            { key: 'all', label: `All (${allList.length})` },
            { key: 'pending', label: `Pending (${pendingList.length})` },
            { key: 'approved', label: `Approved (${approvedTotal})` },
            { key: 'export', label: 'Export' },
          ]}
          active={activeTab}
          onChange={k => setActiveTab(k)}
        />

        <View
          style={{
            flexDirection: 'row',
            marginTop: 10,
            alignItems: 'center',
            gap: 8,
          }}
        >
          <TextInput
            placeholder="Search by employee..."
            placeholderTextColor="#999"
            style={styles.search}
            value={search}
            onChangeText={setSearch}
          />
          {/* Quick export button: exports current visible list */}
          <TouchableOpacity
            onPress={downloadOrgExpensesExcel}
            style={{
              backgroundColor: COLORS.success[600],
              padding: 10,
              borderRadius: 8,
              marginLeft: 8,
            }}
          >
            <Text style={{ color: '#fff' }}>Export</Text>
          </TouchableOpacity>
        </View>
      </View>

      {loading ? (
        <ActivityIndicator
          style={{ marginTop: 40 }}
          color={COLORS.primary[600]}
        />
      ) : null}

      {/* Error messages */}
      {teamError && (
        <Text style={{ color: COLORS.error[500], padding: SPACING.md }}>
          Failed to load team expenses
        </Text>
      )}
      {approvedError && (
        <Text style={{ color: COLORS.error[500], padding: SPACING.md }}>
          Failed to load approved expenses
        </Text>
      )}

      {/* Content area */}
      <View style={{ flex: 1 }}>
        {activeTab === 'all' && (
          <FlatList
            data={filteredAll}
            contentContainerStyle={{ padding: SPACING.md }}
            keyExtractor={i => i._id}
            renderItem={renderExpenseCard}
            ListEmptyComponent={
              <Text style={{ padding: SPACING.md, textAlign: 'center' }}>
                No expenses found
              </Text>
            }
            refreshing={teamLoading}
            onRefresh={refetchTeam}
          />
        )}

        {activeTab === 'pending' && (
          <FlatList
            data={filteredPending}
            contentContainerStyle={{ padding: SPACING.md }}
            keyExtractor={i => i._id}
            renderItem={renderExpenseCard}
            ListEmptyComponent={
              <Text style={{ padding: SPACING.md, textAlign: 'center' }}>
                No pending expenses
              </Text>
            }
            refreshing={teamLoading}
            onRefresh={refetchTeam}
          />
        )}

        {activeTab === 'approved' && (
          <>
            <FlatList
              data={filteredApproved}
              contentContainerStyle={{ padding: SPACING.md }}
              keyExtractor={i => i._id}
              renderItem={renderApprovedItem}
              ListEmptyComponent={
                <Text style={{ padding: SPACING.md, textAlign: 'center' }}>
                  No approved expenses
                </Text>
              }
              refreshing={approvedLoading}
              onRefresh={refetchApproved}
            />

            {/* Pagination controls */}
            <View style={styles.pagination}>
              <TouchableOpacity
                disabled={page === 1}
                onPress={() => setPage(p => Math.max(1, p - 1))}
                style={[styles.pageBtn, page === 1 && { opacity: 0.5 }]}
              >
                <Text>Prev</Text>
              </TouchableOpacity>

              <Text style={{ alignSelf: 'center' }}>
                {page} / {approvedTotalPages}
              </Text>

              <TouchableOpacity
                disabled={page === approvedTotalPages}
                onPress={() =>
                  setPage(p => Math.min(approvedTotalPages, p + 1))
                }
                style={[
                  styles.pageBtn,
                  page === approvedTotalPages && { opacity: 0.5 },
                ]}
              >
                <Text>Next</Text>
              </TouchableOpacity>
            </View>
          </>
        )}

        {activeTab === 'export' && (
          <View style={{ padding: SPACING.md }}>
            <Text style={{ marginBottom: 8 }}>Export options</Text>

            <TouchableOpacity
              onPress={downloadOrgExpensesExcel}
              style={exportStyles.btn}
            >
              <Text style={exportStyles.btnText}>
                Export currently visible list
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              onPress={downloadOrgExpensesExcel}
              style={[exportStyles.btn, { marginTop: 8 }]}
            >
              <Text style={exportStyles.btnText}>
                Export selected (approved)
              </Text>
            </TouchableOpacity>

            <Text style={{ marginTop: 12, color: COLORS.text.secondary }}>
              Note: select items from the Approved tab first to use "Export
              selected".
            </Text>
          </View>
        )}
      </View>
    </View>
  );
}

const segStyles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    backgroundColor: 'transparent',
    borderRadius: 8,
    overflow: 'hidden',
  },
  tab: {
    paddingVertical: 8,
    paddingHorizontal: 12,
    backgroundColor: '#F3F4F6',
    marginRight: 8,
    borderRadius: 8,
  },
  tabActive: {
    backgroundColor: COLORS.primary[600],
  },
  tabText: {
    color: COLORS.neutral[700],
    fontWeight: '600',
  },
  tabTextActive: {
    color: '#fff',
  },
});

const exportStyles = StyleSheet.create({
  btn: {
    backgroundColor: COLORS.success[600],
    padding: 12,
    borderRadius: 8,
    alignItems: 'center',
  },
  btnText: { color: '#fff', fontWeight: '600' },
});

const styles = StyleSheet.create({
  headerContainer: { padding: SPACING.md },
  search: {
    flex: 1,
    backgroundColor: '#fff',
    padding: 12,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  card: {
    backgroundColor: '#fff',
    padding: SPACING.md,
    borderRadius: 12,
    marginBottom: SPACING.md,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  title: { fontSize: 16, fontWeight: '700', color: COLORS.text.primary },
  sub: { fontSize: 14, color: COLORS.text.secondary },
  muted: { fontSize: 12, color: COLORS.text.tertiary },
  status: { fontWeight: '600' },

  checkbox: {
    width: 28,
    height: 28,
    borderRadius: 8,
    backgroundColor: '#E5E7EB',
    alignItems: 'center',
    justifyContent: 'center',
  },

  pagination: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    padding: SPACING.md,
    alignItems: 'center',
  },
  pageBtn: {
    padding: 8,
    borderRadius: 8,
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
});
