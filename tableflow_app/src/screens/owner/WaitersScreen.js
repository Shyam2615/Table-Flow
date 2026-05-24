import React, { useState, useEffect } from 'react';
import { View, Text, FlatList, StyleSheet, TouchableOpacity, ActivityIndicator, Alert } from 'react-native';
import API from '../../api';

export default function OwnerWaitersScreen() {
  const [waiters, setWaiters] = useState([]);
  const [loading, setLoading] = useState(true);

  const loadWaiters = async () => {
    const { data } = await API.get('/auth/waiters');
    setWaiters(data);
  };

  useEffect(() => { loadWaiters().finally(() => setLoading(false)); }, []);

  const toggleStatus = async (id, active) => {
    try {
      await API.put(`/auth/waiters/${id}/toggle`);
      Alert.alert('Success', active ? 'Waiter deactivated' : 'Waiter activated');
      await loadWaiters();
    } catch { Alert.alert('Error', 'Failed to update status'); }
  };

  if (loading) return <View style={styles.center}><ActivityIndicator size="large" color="#f97316" /></View>;

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Waiters</Text>
      <FlatList
        data={waiters}
        keyExtractor={(item) => item._id}
        renderItem={({ item }) => (
          <View style={styles.card}>
            <View style={styles.row}>
              <View style={{ flex: 1 }}>
                <Text style={styles.name}>{item.name}</Text>
                <Text style={styles.email}>{item.email}</Text>
              </View>
              <Text style={[styles.status, { color: item.isActive ? '#22c55e' : '#ef4444' }]}>
                {item.isActive ? 'Active' : 'Inactive'}
              </Text>
            </View>
            <TouchableOpacity
              style={[styles.btn, item.isActive ? styles.btnDeactivate : styles.btnActivate]}
              onPress={() => toggleStatus(item._id, item.isActive)}
            >
              <Text style={styles.btnText}>{item.isActive ? 'Deactivate' : 'Activate'}</Text>
            </TouchableOpacity>
          </View>
        )}
        ListEmptyComponent={<Text style={styles.empty}>No waiters yet</Text>}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0a0a0f', padding: 16 },
  center: { flex: 1, backgroundColor: '#0a0a0f', justifyContent: 'center', alignItems: 'center' },
  title: { fontSize: 24, fontWeight: '800', color: '#fff', marginBottom: 16 },
  card: { backgroundColor: '#14141f', borderRadius: 12, padding: 16, marginBottom: 10, borderWidth: 1, borderColor: '#2a2a3a' },
  row: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 },
  name: { fontSize: 16, fontWeight: '700', color: '#fff' },
  email: { fontSize: 13, color: '#888', marginTop: 2 },
  status: { fontSize: 13, fontWeight: '700' },
  btn: { borderRadius: 8, padding: 10, alignItems: 'center' },
  btnDeactivate: { backgroundColor: '#ef4444' },
  btnActivate: { backgroundColor: '#22c55e' },
  btnText: { color: '#fff', fontWeight: '700', fontSize: 14 },
  empty: { color: '#666', textAlign: 'center', padding: 40, fontSize: 16 },
});
