import React, { useState, useEffect } from 'react';
import { View, Text, FlatList, StyleSheet, ActivityIndicator } from 'react-native';
import API from '../../api';

export default function MyBookingsScreen() {
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    API.get('/bookings/my-bookings').then(({ data }) => setBookings(data)).catch(() => {}).finally(() => setLoading(false));
  }, []);

  const statusColor = { pending: '#f59e0b', confirmed: '#22c55e', cancelled: '#ef4444', completed: '#3b82f6' };

  if (loading) return <View style={styles.center}><ActivityIndicator size="large" color="#f97316" /></View>;

  return (
    <View style={styles.container}>
      <Text style={styles.title}>My Bookings</Text>
      <FlatList
        data={bookings}
        keyExtractor={(item) => item._id}
        renderItem={({ item }) => (
          <View style={styles.card}>
            <Text style={styles.restName}>{item.restaurantId?.name || 'Restaurant'}</Text>
            <Text style={styles.detail}>📅 {item.date} at {item.time}</Text>
            <Text style={styles.detail}>🪑 Table {item.tableNumber} • {item.guests} guests</Text>
            <Text style={[styles.status, { color: statusColor[item.status] || '#888' }]}>{item.status.toUpperCase()}</Text>
          </View>
        )}
        ListEmptyComponent={<Text style={styles.empty}>No bookings yet</Text>}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0a0a0f', padding: 16 },
  center: { flex: 1, backgroundColor: '#0a0a0f', justifyContent: 'center', alignItems: 'center' },
  title: { fontSize: 24, fontWeight: '800', color: '#fff', marginBottom: 16 },
  card: { backgroundColor: '#14141f', borderRadius: 12, padding: 16, marginBottom: 12, borderWidth: 1, borderColor: '#2a2a3a' },
  restName: { fontSize: 16, fontWeight: '700', color: '#fff', marginBottom: 6 },
  detail: { fontSize: 14, color: '#aaa', marginBottom: 3 },
  status: { fontSize: 13, fontWeight: '700', marginTop: 6 },
  empty: { color: '#666', textAlign: 'center', padding: 40, fontSize: 16 },
});
