import React, { useCallback, useEffect, useState } from 'react';
import {
  ActivityIndicator,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import MaterialIcons from 'react-native-vector-icons/MaterialIcons';
import { useSelector } from 'react-redux';
import api from '../../services/api';
import { COLORS } from '../theme/theme';

const configs = {
  employee: [
    ['submittedThisMonth', 'Submitted this month', 'description'],
    ['awaitingApproval', 'Awaiting approval', 'schedule'],
    ['approvedAmountThisMonth', 'Approved this month', 'payments'],
    ['avgApprovalHours', 'Avg. approval time', 'timer'],
  ],
  manager: [
    ['pendingMyReview', 'Pending my review', 'pending-actions'],
    ['reviewedThisMonth', 'Reviewed by me', 'task-alt'],
    ['teamSubmittedThisMonth', 'Assigned this month', 'groups'],
    ['avgReviewHours', 'Avg. review time', 'timer'],
  ],
  finance: [
    ['pendingMyReview', 'Pending my review', 'pending-actions'],
    ['reviewedThisMonth', 'Reviewed by me', 'task-alt'],
    ['teamSubmittedThisMonth', 'Assigned this month', 'groups'],
    ['avgReviewHours', 'Avg. review time', 'timer'],
  ],
  admin: [
    ['approvedAmountThisMonth', 'Approved this month', 'payments'],
    ['pendingCount', 'Awaiting review', 'schedule'],
    ['rejectedCount', 'Rejected', 'cancel'],
    ['avgApprovalHours', 'Avg. approval time', 'timer'],
  ],
};
const value = (key, val, currency) =>
  key.toLowerCase().includes('amount')
    ? `${currency || ''} ${Math.round(val || 0).toLocaleString()}`
    : key.toLowerCase().includes('hours')
    ? val == null
      ? '—'
      : val < 1
      ? `${Math.round(val * 60)}m`
      : `${val.toFixed(1)}h`
    : String(val || 0);
export default function DashboardScreen({ navigation }) {
  const role = useSelector(s => s.auth.role) || 'employee';
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const load = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const { data } = await api.get('/dashboard/stats');
      setStats(data.data);
    } catch (e) {
      setError(e.response?.data?.message || 'Could not load dashboard');
    } finally {
      setLoading(false);
    }
  }, []);
  useEffect(() => {
    load();
  }, [load]);
  if (loading && !stats)
    return (
      <View style={styles.center}>
        <ActivityIndicator color={COLORS.primary[700]} />
      </View>
    );
  return (
    <ScrollView
      style={styles.screen}
      contentContainerStyle={styles.content}
      refreshControl={<RefreshControl refreshing={loading} onRefresh={load} />}
    >
      <Text style={styles.eyebrow}>{role.toUpperCase()} OVERVIEW</Text>
      <Text style={styles.title}>Dashboard</Text>
      <Text style={styles.subtitle}>Your expense activity and approvals</Text>
      {error ? <Text style={styles.error}>{error}</Text> : null}
      <View style={styles.grid}>
        {(configs[role] || configs.employee).map(([key, label, icon]) => (
          <View style={styles.stat} key={key}>
            <View style={styles.icon}>
              <MaterialIcons
                name={icon}
                size={17}
                color={COLORS.primary[700]}
              />
            </View>
            <Text style={styles.statValue}>
              {value(key, stats?.kpis?.[key], stats?.currency)}
            </Text>
            <Text style={styles.statLabel}>{label}</Text>
          </View>
        ))}
      </View>
      <View style={styles.card}>
        <Text style={styles.cardTitle}>Status breakdown</Text>
        {Object.entries(stats?.statusCounts || {}).map(([name, count]) => (
          <View style={styles.row} key={name}>
            <Text style={styles.rowLabel}>{name.replaceAll('_', ' ')}</Text>
            <Text style={styles.count}>{count}</Text>
          </View>
        ))}
      </View>
      <View style={styles.card}>
        <Text style={styles.cardTitle}>Recent activity</Text>
        {(stats?.recentExpenses || []).map(x => (
          <TouchableOpacity
            key={x.id}
            style={styles.expense}
            onPress={() =>
              navigation
                .getParent()
                ?.navigate(role === 'employee' ? 'History' : 'Team Expenses')
            }
          >
            <View style={{ flex: 1 }}>
              <Text style={styles.expenseTitle}>{x.title}</Text>
              <Text style={styles.meta}>
                {role === 'employee'
                  ? x.status
                  : `${x.employeeName} · ${x.status}`}
              </Text>
            </View>
            <Text style={styles.amount}>
              {x.currency} {Number(x.amount || 0).toLocaleString()}
            </Text>
          </TouchableOpacity>
        ))}
        {!stats?.recentExpenses?.length ? (
          <Text style={styles.empty}>No recent activity</Text>
        ) : null}
      </View>
    </ScrollView>
  );
}
const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: '#F7F8FB' },
  content: { padding: 14, paddingBottom: 28 },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  eyebrow: { fontSize: 10, color: '#7B8498', letterSpacing: 1 },
  title: { fontSize: 21, fontWeight: '700', color: '#182033', marginTop: 3 },
  subtitle: { fontSize: 12, color: '#7B8498', marginTop: 2, marginBottom: 14 },
  error: { color: '#BE123C', fontSize: 12, marginBottom: 10 },
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  stat: {
    width: '48%',
    backgroundColor: '#FFF',
    borderWidth: 1,
    borderColor: '#E5E8EF',
    borderRadius: 12,
    padding: 12,
  },
  icon: {
    width: 30,
    height: 30,
    borderRadius: 9,
    backgroundColor: '#EFF3FA',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 9,
  },
  statValue: { fontSize: 18, fontWeight: '700', color: '#182033' },
  statLabel: { fontSize: 11, color: '#697386', marginTop: 3 },
  card: {
    backgroundColor: '#FFF',
    borderWidth: 1,
    borderColor: '#E5E8EF',
    borderRadius: 12,
    padding: 12,
    marginTop: 12,
  },
  cardTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: '#182033',
    marginBottom: 8,
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#F0F2F6',
  },
  rowLabel: { fontSize: 12, color: '#4B5565', textTransform: 'capitalize' },
  count: { fontSize: 12, fontWeight: '700', color: '#243E78' },
  expense: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#F0F2F6',
  },
  expenseTitle: { fontSize: 12, fontWeight: '600', color: '#20293A' },
  meta: {
    fontSize: 10,
    color: '#8A94A6',
    marginTop: 2,
    textTransform: 'capitalize',
  },
  amount: { fontSize: 11, fontWeight: '700', color: '#243E78', marginLeft: 8 },
  empty: { fontSize: 12, color: '#8A94A6', textAlign: 'center', padding: 18 },
});
