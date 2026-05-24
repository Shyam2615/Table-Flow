import React, { useState, useEffect } from 'react';
import { View, Text, FlatList, StyleSheet, TouchableOpacity, ActivityIndicator } from 'react-native';
import API from '../../api';

export default function OwnerBookingsScreen() {
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);

  const loadData = async () => {
    const { data: rest } = await API.get('/restaurants/owner/my-restaurant');
    const { data } = await API.get(`/bookings/restaurant/${rest._id}`);
    setBookings(data.bookings ?? data ?? []);
  };

  useEffect(() => { loadData().finally(() => setLoading(false)); }, []);

  const updateStatus = async (id, status) => {
    await API.put(`/bookings/${id}`, { status });
    await loadData();
  };

  const statusColor = { pending: '#f59e0b', confirmed: '#22c55e', cancelled: '#ef4444', completed: '#3b82f6' };

  if (loading) return <View style={styles.center}><ActivityIndicator size="large" color="#f97316" /></View>;

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Bookings</Text>
      <FlatList
        data={bookings}
        keyExtractor={(item) => item._id}
        renderItem={({ item }) => (
          <View style={styles.card}>
            <View style={styles.row}>
              <Text style={styles.guest}>{item.userId?.name || 'Guest'}</Text>
              <Text style={[styles.status, { color: statusColor[item.status] }]}>{item.status.toUpperCase()}</Text>
            </View>
            <Text style={styles.detail}>📅 {item.date} at {item.time} • T{item.tableNumber} • {item.guests} guests</Text>
            <Text style={styles.detail}>📧 {item.userId?.email}</Text>
            {item.status === 'pending' && (
              <View style={styles.actions}>
                <TouchableOpacity style={styles.btnConfirm} onPress={() => updateStatus(item._id, 'confirmed')}><Text style={styles.btnText}>✓ Confirm</Text></TouchableOpacity>
                <TouchableOpacity style={styles.btnCancel} onPress={() => updateStatus(item._id, 'cancelled')}><Text style={styles.btnText}>✕ Cancel</Text></TouchableOpacity>
              </View>
            )}
            {item.status === 'confirmed' && (
              <TouchableOpacity style={styles.btnComplete} onPress={() => updateStatus(item._id, 'completed')}><Text style={styles.btnText}>Complete</Text></TouchableOpacity>
            )}
          </View>
        )}
        ListEmptyComponent={<Text style={styles.empty}>No bookings</Text>}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0a0a0f', padding: 16 },
  center: { flex: 1, backgroundColor: '#0a0a0f', justifyContent: 'center', alignItems: 'center' },
  title: { fontSize: 24, fontWeight: '800', color: '#fff', marginBottom: 16 },
  card: { backgroundColor: '#14141f', borderRadius: 12, padding: 16, marginBottom: 12, borderWidth: 1, borderColor: '#2a2a3a' },
  row: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 6 },
  guest: { fontSize: 16, fontWeight: '700', color: '#fff' },
  status: { fontSize: 12, fontWeight: '700' },
  detail: { fontSize: 13, color: '#aaa', marginBottom: 2 },
  actions: { flexDirection: 'row', gap: 10, marginTop: 10 },
  btnConfirm: { backgroundColor: '#22c55e', borderRadius: 8, padding: 10, flex: 1, alignItems: 'center' },
  btnCancel: { backgroundColor: '#ef4444', borderRadius: 8, padding: 10, flex: 1, alignItems: 'center' },
  btnComplete: { backgroundColor: '#3b82f6', borderRadius: 8, padding: 10, marginTop: 10, alignItems: 'center' },
  btnText: { color: '#fff', fontWeight: '700', fontSize: 14 },
  empty: { color: '#666', textAlign: 'center', padding: 40, fontSize: 16 },
});
