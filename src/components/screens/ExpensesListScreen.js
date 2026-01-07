/* eslint-disable react/no-unstable-nested-components */
/* eslint-disable react-native/no-inline-styles */
import { VITE_API_URL } from '@env';
import { useNavigation } from '@react-navigation/native';
import { useQuery } from '@tanstack/react-query';
import axios from 'axios';
import React, { useMemo, useState } from 'react';
import {
  ActivityIndicator,
  FlatList,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import MaterialIcons from 'react-native-vector-icons/MaterialIcons';
import { COLORS, COMPONENT_STYLES } from '../theme/theme';

/* -------------------- API -------------------- */
const fetchExpenses = async () => {
  const { data } = await axios.get(`${VITE_API_URL}/expenses/user-expenses`, {
    withCredentials: true,
  });

  return data.success
    ? data.data.map((e, index) => ({
        id: e._id || index + 1,
        title: e.expenseName,
        managerApproval: e.managerApproval?.approved || 'pending',
        financeApproval: e.financeApproval?.approved || 'pending',
        status: e.status || 'pending',
        isDraft: e.isDraft,
        createdAt: e.createdAt,
        totalAmount: e.totalAmount,
      }))
    : [];
};

const FILTER_TABS = [
  { key: 'all', label: 'All' },
  { key: 'approved', label: 'Approved' },
  { key: 'pending', label: 'Pending' },
  { key: 'resubmission', label: 'Resubmission' },
  { key: 'saved', label: 'Saved' },
];

const formatStatusText = t =>
  t ? t.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase()) : 'Pending';

export default function ExpensesListScreen() {
  const navigation = useNavigation();

  const [activeTab, setActiveTab] = useState('all');
  const [search, setSearch] = useState('');

  const {
    data = [],
    isLoading,
    error,
    refetch,
  } = useQuery({
    queryKey: ['expenses'],
    queryFn: fetchExpenses,
  });

  /* -------------------- FILTER LOGIC -------------------- */
  const filteredData = useMemo(() => {
    let res = [...data];

    if (activeTab === 'approved') {
      res = res.filter(
        e =>
          e.managerApproval === 'approved' && e.financeApproval === 'approved',
      );
    } else if (activeTab === 'pending') {
      res = res.filter(
        e =>
          (e.managerApproval === 'pending' ||
            e.financeApproval === 'pending') &&
          e.status !== 'resubmission' &&
          e.status !== 'rejected',
      );
    } else if (activeTab === 'resubmission') {
      res = res.filter(e => e.status === 'resubmission');
    } else if (activeTab === 'saved') {
      res = res.filter(e => e.isDraft);
    }

    if (search.trim()) {
      res = res.filter(e =>
        e.title.toLowerCase().includes(search.toLowerCase()),
      );
    }

    return res;
  }, [data, activeTab, search]);

  /* -------------------- RENDER EACH ROW -------------------- */
  const renderItem = ({ item }) => (
    <TouchableOpacity
      style={styles.card}
      onPress={() =>
        navigation.navigate(item.isDraft ? 'AddExpense' : 'ExpenseDetails', {
          id: item.id,
        })
      }
    >
      <View style={styles.cardHeader}>
        <Text style={styles.cardTitle}>{item.title}</Text>
        {item.totalAmount && (
          <Text style={styles.amount}>₹{item.totalAmount}</Text>
        )}
      </View>

      <View style={{ marginTop: 8 }}>
        <Text style={styles.statusText}>
          Manager: {formatStatusText(item.managerApproval)}
        </Text>
        <Text style={styles.statusText}>
          Finance: {formatStatusText(item.financeApproval)}
        </Text>
      </View>

      <View style={styles.cardFooter}>
        <Text style={styles.footerStatus}>{formatStatusText(item.status)}</Text>

        <View style={{ flexDirection: 'row', gap: 10 }}>
          <TouchableOpacity
            style={[styles.footerBtn, { backgroundColor: COLORS.primary[600] }]}
            onPress={() =>
              navigation.navigate(
                item.isDraft ? 'AddExpense' : 'ExpenseDetails',
                { id: item.id },
              )
            }
          >
            <MaterialIcons name="visibility" size={16} color="#fff" />
            <Text style={styles.btnText}>View</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.footerBtn, { backgroundColor: '#555' }]}
            onPress={() => navigation.navigate('EditExpense', { id: item.id })}
          >
            <MaterialIcons name="edit" size={16} color="#fff" />
            <Text style={styles.btnText}>Edit</Text>
          </TouchableOpacity>
        </View>
      </View>
    </TouchableOpacity>
  );

  /* -------------------- HEADER RENDER -------------------- */
  const ListHeader = () => (
    <View>
      {/* Search */}
      <TextInput
        placeholder="Search expenses..."
        value={search}
        onChangeText={setSearch}
        style={styles.search}
      />

      {/* Tabs */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        style={{
          height: 40,
          backgroundColor: COLORS.background.secondary,
        }}
        contentContainerStyle={{
          alignItems: 'center',
          paddingHorizontal: 15,
        }}
      >
        {FILTER_TABS.map(tab => (
          <TouchableOpacity
            key={tab.key}
            onPress={() => setActiveTab(tab.key)}
            style={[
              styles.tabBtn,
              activeTab === tab.key && styles.activeTabBtn,
            ]}
          >
            <Text
              style={[
                styles.tabText,
                activeTab === tab.key && styles.activeTabText,
              ]}
            >
              {tab.label}
            </Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

      {/* Page Header */}
      <View style={styles.header}>
        <View>
          <Text style={styles.headerTitle}>My Expenses</Text>
          <Text style={styles.headerSubtitle}>
            {filteredData.length} result(s)
          </Text>
        </View>

        <TouchableOpacity
          style={styles.addButton}
          onPress={() => navigation.navigate('AddExpense')}
        >
          <MaterialIcons name="add" size={20} color="#fff" />
          <Text style={styles.addButtonText}>Add Expense</Text>
        </TouchableOpacity>
      </View>
    </View>
  );

  /* -------------------- LOADING & ERROR -------------------- */
  if (isLoading)
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" />
      </View>
    );

  if (error)
    return (
      <View style={styles.center}>
        <Text style={{ color: 'red' }}>Error loading expenses</Text>
      </View>
    );

  /* -------------------- FINAL UI -------------------- */
  return (
    <View style={styles.container}>
      <FlatList
        data={filteredData}
        keyExtractor={item => item.id.toString()}
        renderItem={renderItem}
        ListHeaderComponent={<ListHeader />}
        contentContainerStyle={{ paddingBottom: 40 }}
        refreshControl={
          <RefreshControl refreshing={isLoading} onRefresh={refetch} />
        }
      />
    </View>
  );
}

/* -------------------- STYLES -------------------- */
const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background.secondary,
  },

  center: { flex: 1, alignItems: 'center', justifyContent: 'center' },

  search: {
    backgroundColor: '#fff',
    margin: 15,
    padding: 12,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#ddd',
  },

  /* Tabs */
  tabBtn: {
    paddingHorizontal: 14,
    paddingVertical: 6,
    backgroundColor: '#e5e7eb',
    borderRadius: 20,
    marginRight: 10,
  },
  activeTabBtn: { backgroundColor: COLORS.primary[600] },
  tabText: { color: '#555', fontWeight: '600' },
  activeTabText: { color: '#fff' },

  /* Header */
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 15,
    paddingTop: 10,
    marginBottom: 10,
  },
  headerTitle: { fontSize: 24, fontWeight: '700' },
  headerSubtitle: { color: '#777' },
  addButton: {
    flexDirection: 'row',
    backgroundColor: COLORS.primary[600],
    paddingHorizontal: 15,
    paddingVertical: 10,
    borderRadius: 10,
    alignItems: 'center',
  },
  addButtonText: { color: '#fff', marginLeft: 5, fontWeight: '600' },

  /* Cards */
  card: {
    ...COMPONENT_STYLES.card.elevated,
    marginHorizontal: 15,
    marginBottom: 15,
    padding: 15,
  },

  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  cardTitle: {
    fontSize: 16,
    fontWeight: '700',
    flex: 1,
  },
  amount: { fontSize: 18, fontWeight: '700', color: COLORS.primary[600] },

  statusText: { color: '#444', marginTop: 2 },

  cardFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 12,
  },
  footerStatus: { fontWeight: '700', color: '#555' },

  footerBtn: {
    flexDirection: 'row',
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 6,
    alignItems: 'center',
  },
  btnText: { color: '#fff', marginLeft: 4, fontWeight: '600' },
});
