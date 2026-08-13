import React, { useCallback, useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Modal,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import MaterialIcons from 'react-native-vector-icons/MaterialIcons';
import api from '../../services/api';
const config = {
  Clients: {
    endpoint: '/admin/get-all-clients',
    create: '/admin/create-client',
    remove: '/admin/delete-client/',
    fields: ['name'],
  },
  Categories: {
    endpoint: '/admin/get-all-categories',
    create: '/admin/create-category',
    remove: '/admin/delete-category/',
    fields: ['name'],
  },
  'Cost Centers': {
    endpoint: '/admin/get-all-costcenters',
    create: '/admin/create-costcenter',
    remove: '/admin/delete-costcenter/',
    fields: ['companyCode', 'costCenter', 'name'],
  },
};
export default function MasterDataScreen({ route }) {
  const type = route.name,
    c = config[type];
  const [items, setItems] = useState([]),
    [loading, setLoading] = useState(true),
    [open, setOpen] = useState(false),
    [form, setForm] = useState({});
  const load = useCallback(async () => {
    setLoading(true);
    try {
      const { data } = await api.get(c.endpoint);
      setItems(data.data || []);
    } finally {
      setLoading(false);
    }
  }, [c.endpoint]);
  useEffect(() => {
    load();
  }, [load]);
  const save = async () => {
    await api.post(c.create, form);
    setOpen(false);
    setForm({});
    load();
  };
  const remove = x =>
    Alert.alert(`Delete ${type}`, `Delete ${x.name || x.costCenter}?`, [
      { text: 'Cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: async () => {
          await api.delete(c.remove + x._id);
          load();
        },
      },
    ]);
  return (
    <View style={s.screen}>
      <ScrollView
        contentContainerStyle={s.content}
        refreshControl={
          <RefreshControl refreshing={loading} onRefresh={load} />
        }
      >
        <View style={s.head}>
          <View>
            <Text style={s.title}>{type}</Text>
            <Text style={s.sub}>Organization master data</Text>
          </View>
          <TouchableOpacity style={s.add} onPress={() => setOpen(true)}>
            <MaterialIcons name="add" size={18} color="#FFF" />
          </TouchableOpacity>
        </View>
        {loading && !items.length ? (
          <ActivityIndicator />
        ) : (
          items.map(x => (
            <View key={x._id} style={s.card}>
              <View style={{ flex: 1 }}>
                <Text style={s.name}>{x.name || x.costCenter}</Text>
                {c.fields
                  .filter(f => f !== 'name')
                  .map(f => (
                    <Text key={f} style={s.meta}>
                      {f}: {x[f] || '—'}
                    </Text>
                  ))}
              </View>
              <TouchableOpacity onPress={() => remove(x)}>
                <MaterialIcons
                  name="delete-outline"
                  size={19}
                  color="#BE123C"
                />
              </TouchableOpacity>
            </View>
          ))
        )}
        {!loading && !items.length ? (
          <Text style={s.empty}>No {type.toLowerCase()} found.</Text>
        ) : null}
      </ScrollView>
      <Modal
        visible={open}
        transparent
        animationType="fade"
        onRequestClose={() => setOpen(false)}
      >
        <View style={s.overlay}>
          <View style={s.modal}>
            <Text style={s.modalTitle}>Add {type}</Text>
            {c.fields.map(f => (
              <TextInput
                key={f}
                style={s.input}
                value={form[f] || ''}
                onChangeText={v => setForm({ ...form, [f]: v })}
                placeholder={f.replace(/([A-Z])/g, ' $1')}
              />
            ))}
            <View style={s.buttons}>
              <TouchableOpacity style={s.cancel} onPress={() => setOpen(false)}>
                <Text>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity style={s.save} onPress={save}>
                <Text style={{ color: '#FFF', fontWeight: '700' }}>Save</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
}
const s = StyleSheet.create({
  screen: { flex: 1, backgroundColor: '#F7F8FB' },
  content: { padding: 14 },
  head: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  title: { fontSize: 20, fontWeight: '700', color: '#182033' },
  sub: { fontSize: 11, color: '#7B8498', marginTop: 2 },
  add: {
    width: 36,
    height: 36,
    borderRadius: 10,
    backgroundColor: '#243E78',
    alignItems: 'center',
    justifyContent: 'center',
  },
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFF',
    borderWidth: 1,
    borderColor: '#E5E8EF',
    borderRadius: 11,
    padding: 11,
    marginBottom: 8,
  },
  name: { fontSize: 13, fontWeight: '700', color: '#20293A' },
  meta: {
    fontSize: 10,
    color: '#7B8498',
    marginTop: 2,
    textTransform: 'capitalize',
  },
  empty: { textAlign: 'center', fontSize: 12, color: '#8A94A6', marginTop: 30 },
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(15,23,42,.45)',
    justifyContent: 'center',
    padding: 20,
  },
  modal: { backgroundColor: '#FFF', borderRadius: 14, padding: 15 },
  modalTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#182033',
    marginBottom: 12,
  },
  input: {
    height: 42,
    borderWidth: 1,
    borderColor: '#DDE2EA',
    borderRadius: 9,
    paddingHorizontal: 11,
    fontSize: 13,
    marginBottom: 9,
    color: '#182033',
  },
  buttons: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: 9,
    marginTop: 5,
  },
  cancel: { height: 38, paddingHorizontal: 14, justifyContent: 'center' },
  save: {
    height: 38,
    paddingHorizontal: 16,
    justifyContent: 'center',
    backgroundColor: '#243E78',
    borderRadius: 9,
  },
});
